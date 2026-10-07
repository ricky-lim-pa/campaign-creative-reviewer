import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function d(iso) {
  return new Date(iso + "T12:00:00.000Z");
}

/** Q4 2026 promotion calendar from PM spreadsheet */
const CAMPAIGNS = [
  {
    eventLabel: "",
    title: "Canvas Promotion",
    app: "FP",
    region: "UK, FR",
    start: "2026-10-01",
    end: "2026-10-31",
    notes: "Stale but fading away. New offer? New size 11x14 and look at p&l. Testable.",
  },
  {
    eventLabel: "",
    title: "Canvas Promotion",
    app: "FP+FG",
    region: "US",
    start: "2026-10-01",
    end: "2026-10-31",
    notes: "",
  },
  {
    eventLabel: "",
    title: "Keyring Promotion",
    app: "FP",
    region: "IT, IE, ES, DE, NL",
    start: "2026-10-01",
    end: "2026-10-31",
    notes: "11.6k in orders generating 100k in revenue",
  },
  {
    eventLabel: "Movie Promotion",
    title: "Universal x FreePrints Sweepstakes",
    app: "ALL",
    region: "ALL",
    start: "2026-09-18",
    end: "2026-10-16",
    notes: "Confirmed",
  },
  {
    eventLabel: "Amazon Prime",
    title: "Super Sale",
    app: "ALL",
    region: "US, UK, FR, IT, IE, ES, DE, AT, BE, NL",
    start: "2026-10-01",
    end: "2026-10-31",
    notes: "A new strategy will be needed to sell the super sale. Conflicts with canvas and Universal x FreePrints promotion.",
  },
  {
    eventLabel: "TMT",
    title: "Free 5x7 or 6x6 photo book + $3.99 shipping",
    app: "PB",
    region: "US",
    start: "2026-10-27",
    end: "2026-11-02",
    notes: "No action. This is good.",
  },
  {
    eventLabel: "",
    title: "% OFF Bauble Sale",
    app: "FP",
    region: "UK, FR, IT, IE, ES, DE, NL, BE, AT",
    start: "2026-11-01",
    end: "2026-11-22",
    notes: "Sales are lower. Can rework the offer, see if we can do a 50% off discount. Need competitive analysis in requesting the P&L. Add an additional touchpoint.",
  },
  {
    eventLabel: "",
    title: "FREE Ornament",
    app: "FG",
    region: "US",
    start: "2026-11-01",
    end: "2026-11-30",
    notes: "",
  },
  {
    eventLabel: "",
    title: "Second Free Gift",
    app: "FG",
    region: "US",
    start: "2026-11-01",
    end: "2026-11-30",
    notes: "Blanket and has christmas theme",
  },
  {
    eventLabel: "",
    title: "Holiday Cards $10 GC",
    app: "FP",
    region: "US",
    start: "2026-11-01",
    end: "2027-01-10",
    notes: "Relook at the p&l, try do update to $15 if possible by card qty tiers.",
  },
  {
    eventLabel: "",
    title: "Holiday Cards £XX GC",
    app: "FP",
    region: "UK",
    start: "2026-11-01",
    end: "2027-01-10",
    notes: "Look into the p&l and see if we can match what we do in the US.",
  },
  {
    eventLabel: "",
    title: "Free Retro Prints (Re-evaluate offer)",
    app: "FP",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE",
    start: "2026-11-04",
    end: "2026-11-09",
    notes: "Idea 1: Buy XX prints and get free designer box. Olivier prefers offer 1 — retroprints or XX prints. Need to look at the p&l.",
  },
  {
    eventLabel: "",
    title: "Free Foil",
    app: "PB",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-11-09",
    end: "2026-11-15",
    notes: "Remove this to push for free foil during Black Friday",
  },
  {
    eventLabel: "",
    title: "Super Sale — 25% off cards, card packs and RA",
    app: "FC",
    region: "UK",
    start: "2026-11-16",
    end: "2026-11-22",
    notes: "",
  },
  {
    eventLabel: "",
    title: "Easel Promotion",
    app: "FP",
    region: "UK, IT, IE, ES, DE, NL",
    start: "2026-11-16",
    end: "2026-11-22",
    notes: "Recommend to remove. Keep as backup plan to increase sales.",
  },
  {
    eventLabel: "Black Friday",
    title: "Free Foil",
    app: "PB",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-11-23",
    end: "2026-11-29",
    notes: "New offer idea",
  },
  {
    eventLabel: "Black Friday",
    title: "Buy 4+ tile get FREE magic level and free shipping",
    app: "PT",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-11-23",
    end: "2026-11-29",
    notes: "New offer idea, do the P&L for UK/EU. US same but see wiggle room for acrylic tiles.",
  },
  {
    eventLabel: "Black Friday",
    title: "Up to 30% off frames and canvases",
    app: "FPA",
    region: "US, UK, FR, IT, IE, ES, DE, AT",
    start: "2026-11-23",
    end: "2026-11-29",
    notes: "Focus on stronger offer on 30% frames; UK/EU push to 50% off with new vendor.",
  },
  {
    eventLabel: "Black Friday",
    title: "Holiday Savings Spectacular (My Deals)",
    app: "My Deals",
    region: "US, UK, FR, IT, IE, ES, DE, AT, BE, NL",
    start: "2026-11-23",
    end: "2026-12-06",
    notes: "No mcspace.",
  },
  {
    eventLabel: "Black Friday",
    title: "25% Off Card Packs",
    app: "FC",
    region: "UK",
    start: "2026-11-22",
    end: "2026-12-06",
    notes: "Look at P&L and 50% off shipping for card packs. Check competitors like Funky Pigeon.",
  },
  {
    eventLabel: "Black Friday",
    title: "Free Return Addressing for Card Packs",
    app: "Ink",
    region: "US",
    start: "2026-11-23",
    end: "2026-12-06",
    notes: "",
  },
  {
    eventLabel: "Black Friday",
    title: "25% off cards (includes card packs)",
    app: "Ink",
    region: "US",
    start: "2026-11-24",
    end: "2026-12-07",
    notes: "",
  },
  {
    eventLabel: "Cyber Monday",
    title: "Large cover upgrade for price of small",
    app: "PB",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-11-30",
    end: "2026-11-30",
    notes: "",
  },
  {
    eventLabel: "Cyber Monday",
    title: "Buy 4+ tile get FREE magic level and free shipping",
    app: "PT",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-11-30",
    end: "2026-11-30",
    notes: "Follow BF plan",
  },
  {
    eventLabel: "Cyber Monday",
    title: "Up to 30% off frames and canvases",
    app: "FPA",
    region: "US, UK, FR, IT, IE, ES, DE, AT",
    start: "2026-11-30",
    end: "2026-11-30",
    notes: "Follow BF plan",
  },
  {
    eventLabel: "",
    title: "FREE Calendar",
    app: "FG",
    region: "US",
    start: "2026-12-01",
    end: "2026-12-31",
    notes: "Look at P&L for new offer. Free calendar + XX% off additional calendars.",
  },
  {
    eventLabel: "",
    title: "$2/£2/€2 OFF Calendars",
    app: "FP",
    region: "US, UK, FR, IT, ES, DE, IE",
    start: "2026-12-01",
    end: "2027-01-10",
    notes: "",
  },
  {
    eventLabel: "Cyber Week",
    title: "Large cover upgrade for price of small",
    app: "PB",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-12-02",
    end: "2026-12-03",
    notes: "",
  },
  {
    eventLabel: "Cyber Week",
    title: "Buy 4+ tile get FREE magic level and free shipping",
    app: "PT",
    region: "US, UK, FR, IT, ES, DE, AT, NL, BE, IE",
    start: "2026-12-02",
    end: "2026-12-03",
    notes: "New offer idea",
  },
  {
    eventLabel: "Cyber Week",
    title: "Up to 30% off frames and canvases",
    app: "FPA",
    region: "US, UK, FR, IT, IE, ES, DE, AT",
    start: "2026-12-01",
    end: "2026-12-03",
    notes: "New offer idea",
  },
  {
    eventLabel: "",
    title: "Free Pens",
    app: "FP",
    region: "US",
    start: "2026-12-03",
    end: "2026-12-06",
    notes: "Idea 1: Free Tumbler. New offer idea.",
  },
  {
    eventLabel: "",
    title: "Card Pack Sale + FREE Shipping",
    app: "Ink",
    region: "US",
    start: "2026-12-03",
    end: "2026-12-07",
    notes: "",
  },
  {
    eventLabel: "",
    title: "FREE Standard Card (New CX ONLY)",
    app: "FC",
    region: "UK",
    start: "2026-12-02",
    end: "2026-12-04",
    notes: "Update to earlier timing this year.",
  },
  {
    eventLabel: "",
    title: "December Card Sale: 25% OFF card packs + FREE RA",
    app: "FC",
    region: "UK",
    start: "2026-12-09",
    end: "2026-12-13",
    notes: "",
  },
  {
    eventLabel: "",
    title: "Holiday Card Sale",
    app: "Ink",
    region: "US",
    start: "2026-12-08",
    end: "2026-12-13",
    notes: "",
  },
  {
    eventLabel: "Christmas",
    title: "Free Canvas: Get it before Christmas",
    app: "FP",
    region: "FR",
    start: "2026-12-07",
    end: "2026-12-09",
    notes: "",
  },
  {
    eventLabel: "Christmas",
    title: "Free Canvas: Get it before Christmas",
    app: "FP",
    region: "US",
    start: "2026-12-08",
    end: "2026-12-10",
    notes: "NEW PROPOSAL",
  },
  {
    eventLabel: "Christmas",
    title: "Free Canvas: Get it before Christmas",
    app: "FP",
    region: "UK",
    start: "2026-12-11",
    end: "2026-12-13",
    notes: "",
  },
  {
    eventLabel: "Christmas",
    title: "Get it before Christmas (My Deals banner only)",
    app: "FP",
    region: "FR, IT, IE, ES",
    start: "2026-12-10",
    end: "2026-12-12",
    notes: "NEW PROPOSAL",
  },
  {
    eventLabel: "Christmas",
    title: "Get it before Christmas",
    app: "FP",
    region: "US",
    start: "2026-12-11",
    end: "2026-12-13",
    notes: "Was very effective",
  },
  {
    eventLabel: "Christmas",
    title: "Get it before Christmas",
    app: "FP",
    region: "UK",
    start: "2026-12-14",
    end: "2026-12-16",
    notes: "Was very effective",
  },
  {
    eventLabel: "Boxing Day",
    title: "Boxing Day — 25% OFF all cards and card packs",
    app: "FC",
    region: "UK",
    start: "2026-12-26",
    end: "2026-12-31",
    notes: "",
  },
  {
    eventLabel: "",
    title: "After Christmas Sale",
    app: "Ink",
    region: "US",
    start: "2026-12-26",
    end: "2027-01-02",
    notes: "",
  },
  {
    eventLabel: "Boxing Day",
    title: "Boxing Day (My Deals banner ONLY)",
    app: "FP",
    region: "UK",
    start: "2026-12-26",
    end: "2026-12-30",
    notes: "",
  },
];

function mapApp(code) {
  const c = code.trim().toUpperCase();
  switch (c) {
    case "ALL":
      return "all";
    case "FP":
    case "FP+FG":
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
    case "FG":
      return "freeprints";
    case "MY DEALS":
      return "freeprints";
    default:
      return "freeprints";
  }
}

async function main() {
  console.log("Clearing existing campaigns...");
  await prisma.comment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.mockupVersion.deleteMany();
  await prisma.mockup.deleteMany();
  await prisma.campaignKpi.deleteMany();
  await prisma.campaign.deleteMany();

  console.log(`Seeding ${CAMPAIGNS.length} Q4 campaigns...`);

  for (const row of CAMPAIGNS) {
    const startDate = d(row.start);
    const endDate = d(row.end);
    const appCode = row.app.trim().toUpperCase();
    const titlePrefix =
      appCode === "FG" ? "[FG] " : appCode === "MY DEALS" ? "[My Deals] " : appCode === "FP+FG" ? "[FP+FG] " : "";

    await prisma.campaign.create({
      data: {
        appId: mapApp(row.app),
        title: `${titlePrefix}${row.title}`.trim(),
        eventLabel: row.eventLabel || "",
        region: row.region,
        startDate,
        endDate,
        sendDate: startDate,
        quarter: "Q4-2026",
        notes: row.notes || null,
        kpi: { create: {} },
      },
    });
  }

  const count = await prisma.campaign.count();
  console.log(`Done. ${count} campaigns in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
