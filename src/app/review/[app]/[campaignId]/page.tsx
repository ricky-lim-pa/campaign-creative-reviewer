import ReviewClient from "./review-client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { campaignStaticParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return campaignStaticParams();
}

export default async function CampaignReviewPage({ params }: { params: Promise<{ app: string; campaignId: string }> }) {
  const { app, campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, appId: app },
    include: {
      kpi: true,
      mockups: {
        orderBy: { sortOrder: "asc" },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: { approval: true, comments: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });
  if (!campaign) notFound();

  return <ReviewClient key={campaign.id} initialCampaign={{
    ...campaign,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    mockups: campaign.mockups.map((mockup) => ({
      ...mockup,
      versions: mockup.versions.map((version) => ({
        ...version,
        comments: version.comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })),
      })),
    })),
  }} />;
}
