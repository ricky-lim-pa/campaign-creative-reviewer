import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
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
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  let cleared = 0;

  for (const mockup of campaign.mockups) {
    const latest = mockup.versions[0];
    if (!latest?.approval) continue;

    await prisma.approval.update({
      where: { mockupVersionId: latest.id },
      data: {
        rogerApproved: false,
        rogerApprovedAt: null,
        toddApproved: false,
        toddApprovedAt: null,
        approved: false,
        approvedAt: null,
      },
    });
    cleared += 1;
  }

  return NextResponse.json({ ok: true, cleared });
}
