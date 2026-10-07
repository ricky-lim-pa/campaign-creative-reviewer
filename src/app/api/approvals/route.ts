import { NextResponse } from "next/server";
import { prisma, getSettingsBaseUrl } from "@/lib/db";
import { syncFullApproval, type ApproverId } from "@/lib/approvals";
import { notifyApproval } from "@/lib/slack";

const APPROVERS: ApproverId[] = ["roger", "todd"];

export async function POST(request: Request) {
  const body = await request.json();
  const { mockupVersionId, approved, approver, appId, campaignId, mockupType, version } = body;

  if (!mockupVersionId || approved === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!approver || !APPROVERS.includes(approver)) {
    return NextResponse.json({ error: "approver must be roger or todd" }, { status: 400 });
  }

  const existing = await prisma.approval.findUnique({ where: { mockupVersionId } });
  const now = new Date();

  const rogerApproved = approver === "roger" ? Boolean(approved) : (existing?.rogerApproved ?? false);
  const toddApproved = approver === "todd" ? Boolean(approved) : (existing?.toddApproved ?? false);
  const rogerApprovedAt =
    approver === "roger"
      ? approved
        ? now
        : null
      : (existing?.rogerApprovedAt ?? null);
  const toddApprovedAt =
    approver === "todd" ? (approved ? now : null) : (existing?.toddApprovedAt ?? null);

  const synced = syncFullApproval({
    rogerApproved,
    toddApproved,
    rogerApprovedAt,
    toddApprovedAt,
  });

  const approval = await prisma.approval.upsert({
    where: { mockupVersionId },
    create: {
      mockupVersionId,
      ...synced,
    },
    update: synced,
  });

  if (appId && campaignId && mockupType) {
    try {
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      const baseUrl = await getSettingsBaseUrl();
      const approverLabel = approver === "roger" ? "Roger" : "Todd";
      await notifyApproval({
        appId,
        campaignId,
        campaignTitle: campaign?.title || "Campaign",
        mockupType,
        version: version || 1,
        approved: Boolean(approved),
        approverLabel,
        fullyApproved: synced.approved,
        baseUrl,
      });
    } catch {
      // Slack is optional — approval is already saved
    }
  }

  return NextResponse.json(approval);
}
