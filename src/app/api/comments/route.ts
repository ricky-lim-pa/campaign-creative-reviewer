import { NextResponse } from "next/server";
import { prisma, getSettingsBaseUrl } from "@/lib/db";
import { notifyComment } from "@/lib/slack";

export async function POST(request: Request) {
  const body = await request.json();
  const { mockupVersionId, text, author, appId, campaignId, mockupType, version } = body;

  if (!mockupVersionId || !text?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      mockupVersionId,
      text: text.trim(),
      author: author || "Executive",
    },
  });

  if (appId && campaignId && mockupType) {
    try {
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      const baseUrl = await getSettingsBaseUrl();
      await notifyComment({
        appId,
        campaignId,
        campaignTitle: campaign?.title || "Campaign",
        mockupType,
        version: version || 1,
        comment: text.trim(),
        baseUrl,
      });
    } catch {
      // Slack is optional — comment is already saved
    }
  }

  return NextResponse.json(comment);
}
