import { NextResponse } from "next/server";
import { prisma, ensureSettings } from "@/lib/db";

export async function GET(request: Request) {
  await ensureSettings();
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");

  const campaigns = await prisma.campaign.findMany({
    where: appId ? { appId } : undefined,
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
  return NextResponse.json(campaigns);
}

export async function POST(request: Request) {
  await ensureSettings();
  const body = await request.json();
  const {
    appId,
    title,
    eventLabel,
    region,
    startDate,
    endDate,
    sendDate,
    quarter,
    notes,
    reportUrl,
    confluenceUrl,
    basecampUrl,
  } = body;

  const start = startDate || sendDate;
  if (!appId || !title || !start || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const startDt = new Date(start);
  const campaign = await prisma.campaign.create({
    data: {
      appId,
      title,
      eventLabel: eventLabel || "",
      region: region || "",
      startDate: startDt,
      endDate: new Date(endDate),
      sendDate: startDt,
      quarter: quarter || "Q4-2026",
      notes: notes || null,
      reportUrl: reportUrl || null,
      confluenceUrl: confluenceUrl || null,
      basecampUrl: basecampUrl || null,
      kpi: { create: {} },
    },
    include: { kpi: true },
  });

  return NextResponse.json(campaign);
}
