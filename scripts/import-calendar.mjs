/**
 * Import / sync Q4 campaign calendar from an Excel spreadsheet.
 *
 * Expected columns (header row, case-insensitive):
 *   App | Title | Event | Region | Start | End | Notes
 *
 * Usage:
 *   npm run calendar:import -- "C:\path\to\Q4-Campaign-Calendar.xlsx"
 *   npm run calendar:import -- ./data/calendar.xlsx --sheet "Q4 2026"
 *   npm run calendar:import -- ./calendar.xlsx --dry-run
 *
 * The script upserts by natural key: app + title + start + region.
 * Uploaded mockups and approvals on matched campaigns are preserved.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function appKey(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function mapApp(code) {
  switch (appKey(code)) {
    case "ALL":
      return "all";
    case "FP":
    case "FP+FG":
    case "FG":
    case "MYDEALS":
      return "freeprints";
    case "PB":
      return "photo-books";
    case "PT":
      return "photo-tiles";
    case "FPA":
      return "photo-art";
    case "FC":
      return "cards-uk";
    case "INK":
      return "ink";
    default:
      return "freeprints";
  }
}

function titlePrefix(appCode) {
  switch (appKey(appCode)) {
    case "FG":
      return "[FG] ";
    case "MYDEALS":
      return "[My Deals] ";
    case "FP+FG":
      return "[FP+FG] ";
    default:
      return "";
  }
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0));
  }
  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T12:00:00.000Z`);
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0));
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function pick(row, aliases) {
  for (const [key, value] of Object.entries(row)) {
    const header = normalizeHeader(key);
    if (aliases.some((alias) => header === alias || header.includes(alias))) {
      return value;
    }
  }
  return "";
}

function exactPick(row, names) {
  const wanted = new Set(names.map(normalizeHeader));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeHeader(key))) return value;
  }
  return "";
}

function buildNotes(rawRow) {
  const status = String(exactPick(rawRow, ["status"]) || "").trim();
  const decision = String(exactPick(rawRow, ["todd decision"]) || "").trim();
  const parts = [];
  if (status) parts.push(`Status: ${status}`);
  if (decision) parts.push(`Todd: ${decision}`);
  return parts.length ? parts.join("\n") : null;
}

function rowToCampaign(rawRow) {
  const app = pick(rawRow, ["app", "application"]);
  const title = pick(rawRow, ["title", "campaign", "promotion", "promo"]);
  const start = parseDate(pick(rawRow, ["start", "start date", "launch"]));
  const end = parseDate(pick(rawRow, ["end", "end date", "finish"]));

  const appText = String(app || "").trim();
  if (!appText || appText.startsWith("-") || !title || !start || !end) return null;

  const region = String(pick(rawRow, ["region", "markets", "geo"]) || "").trim();
  const eventLabel = String(pick(rawRow, ["season/event", "event", "event label", "theme"]) || "").trim();
  const decisionNotes = buildNotes(rawRow);
  const notesRaw = exactPick(rawRow, ["notes", "note"]);
  const notes = decisionNotes || (notesRaw ? String(notesRaw).trim() : null);

  return {
    appId: mapApp(app),
    title: `${titlePrefix(appText)}${String(title).trim()}`.trim(),
    eventLabel,
    region,
    startDate: start,
    endDate: end,
    sendDate: start,
    quarter: "Q4-2026",
    notes,
    key: `${mapApp(app)}|${String(title).trim()}|${start.toISOString().slice(0, 10)}|${region}`,
  };
}

function parseArgs(argv) {
  const positional = [];
  let sheet = null;
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--sheet") {
      sheet = argv[i + 1] || null;
      i += 1;
    } else if (!arg.startsWith("--")) positional.push(arg);
  }

  return { filePath: positional[0] || null, sheet, dryRun };
}

async function main() {
  const { filePath, sheet, dryRun } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error("Provide the Excel file path.");
    console.error('Example: npm run calendar:import -- "C:\\path\\calendar.xlsx"');
    process.exit(1);
  }

  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const workbook = XLSX.read(readFileSync(resolved), { type: "buffer", cellDates: true });
  const sheetName = sheet || (workbook.SheetNames.includes("By App") ? "By App" : workbook.SheetNames[0]);
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.error(`Sheet not found: ${sheetName}`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  const parsed = rows.map(rowToCampaign).filter(Boolean);

  console.log(`Sheet: ${sheetName}`);
  console.log(`Parsed ${parsed.length} campaign row(s) from ${rows.length} spreadsheet row(s).`);
  if (dryRun) {
    parsed.slice(0, 5).forEach((row) => console.log("•", row.title, row.region, row.startDate.toISOString().slice(0, 10)));
    if (parsed.length > 5) console.log(`… and ${parsed.length - 5} more`);
    return;
  }

  let created = 0;
  let updated = 0;
  const keptIds = [];

  for (const row of parsed) {
    const existing = await prisma.campaign.findFirst({
      where: {
        appId: row.appId,
        title: row.title,
        region: row.region,
        startDate: row.startDate,
      },
    });

    if (existing) {
      await prisma.campaign.update({
        where: { id: existing.id },
        data: {
          eventLabel: row.eventLabel,
          endDate: row.endDate,
          sendDate: row.sendDate,
          notes: row.notes,
          quarter: row.quarter,
        },
      });
      updated += 1;
      keptIds.push(existing.id);
    } else {
      const campaign = await prisma.campaign.create({
        data: {
          appId: row.appId,
          title: row.title,
          eventLabel: row.eventLabel,
          region: row.region,
          startDate: row.startDate,
          endDate: row.endDate,
          sendDate: row.sendDate,
          quarter: row.quarter,
          notes: row.notes,
          kpi: { create: {} },
        },
      });
      created += 1;
      keptIds.push(campaign.id);
    }
  }

  const stale = await prisma.campaign.findMany({
    where: { quarter: "Q4-2026", id: { notIn: keptIds } },
    include: { _count: { select: { mockups: true } } },
  });
  const removable = stale.filter((campaign) => campaign._count.mockups === 0);
  if (removable.length > 0) {
    await prisma.campaign.deleteMany({ where: { id: { in: removable.map((campaign) => campaign.id) } } });
  }

  console.log(`Import complete. Created ${created}, updated ${updated}.`);
  console.log(`Removed ${removable.length} old Q4 campaign(s) with no uploaded assets.`);
  const keptWithAssets = stale.length - removable.length;
  if (keptWithAssets > 0) {
    console.log(`Left ${keptWithAssets} unmatched campaign(s) in place because they have assets.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
