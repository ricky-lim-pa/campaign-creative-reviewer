import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseReportUrls, stringifyReportUrls, type ReportLink } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  let kpi = await prisma.campaignKpi.findUnique({ where: { campaignId } });

  if (!kpi) {
    kpi = await prisma.campaignKpi.create({ data: { campaignId } });
  }

  return NextResponse.json({
    ...kpi,
    reportLinks: parseReportUrls(kpi.reportUrls),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const body = await request.json();
  const { reportLinks, overallSales, yoyNotes, incrementalityNotes, analysisNotes } = body;

  const data: Record<string, string | undefined> = {};
  if (reportLinks !== undefined) {
    data.reportUrls = stringifyReportUrls(reportLinks as ReportLink[]);
  }
  if (overallSales !== undefined) data.overallSales = overallSales;
  if (yoyNotes !== undefined) data.yoyNotes = yoyNotes;
  if (incrementalityNotes !== undefined) data.incrementalityNotes = incrementalityNotes;
  if (analysisNotes !== undefined) data.analysisNotes = analysisNotes;

  const kpi = await prisma.campaignKpi.upsert({
    where: { campaignId },
    create: { campaignId, ...data },
    update: data,
  });

  return NextResponse.json({
    ...kpi,
    reportLinks: parseReportUrls(kpi.reportUrls),
  });
}
