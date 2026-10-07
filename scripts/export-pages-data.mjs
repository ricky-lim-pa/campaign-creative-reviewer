import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./dev.db";

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), "public", "data");
const campaignDir = path.join(dataDir, "campaigns");

const list = await prisma.campaign.findMany({
  orderBy: { startDate: "asc" },
  include: {
    mockups: {
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          include: { approval: true },
        },
      },
    },
    kpi: true,
  },
});

const details = await prisma.campaign.findMany({
  include: {
    mockups: {
      orderBy: { sortOrder: "asc" },
      include: {
        versions: {
          orderBy: { version: "desc" },
          include: {
            approval: true,
            comments: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    },
    kpi: true,
  },
});

await mkdir(campaignDir, { recursive: true });
await writeFile(path.join(dataDir, "campaigns.json"), JSON.stringify(list));
for (const campaign of details) {
  await writeFile(path.join(campaignDir, `${campaign.id}.json`), JSON.stringify(campaign));
}

await prisma.$disconnect();
console.log(`Wrote ${details.length} campaign files for GitHub Pages.`);
