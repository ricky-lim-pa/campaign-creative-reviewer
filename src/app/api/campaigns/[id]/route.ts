import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
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

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(campaign);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    title,
    eventLabel,
    region,
    startDate,
    endDate,
    sendDate,
    quarter,
    appId,
    notes,
    reportUrl,
    confluenceUrl,
    basecampUrl,
  } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (eventLabel !== undefined) data.eventLabel = eventLabel;
  if (region !== undefined) data.region = region;
  if (appId !== undefined) data.appId = appId;
  if (quarter !== undefined) data.quarter = quarter;
  if (notes !== undefined) data.notes = notes || null;
  if (reportUrl !== undefined) data.reportUrl = reportUrl || null;
  if (confluenceUrl !== undefined) data.confluenceUrl = confluenceUrl || null;
  if (basecampUrl !== undefined) data.basecampUrl = basecampUrl || null;

  if (startDate) {
    data.startDate = new Date(startDate);
    data.sendDate = new Date(startDate);
  } else if (sendDate) {
    data.sendDate = new Date(sendDate);
    data.startDate = new Date(sendDate);
  }
  if (endDate) data.endDate = new Date(endDate);

  const campaign = await prisma.campaign.update({
    where: { id },
    data,
  });

  return NextResponse.json(campaign);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
