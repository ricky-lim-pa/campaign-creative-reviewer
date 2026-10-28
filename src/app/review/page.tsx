import Link from "next/link";
import { CampaignListTable } from "@/components/CampaignListTable";
import { prisma, ensureSettings } from "@/lib/db";
import { isCampaignApproved } from "@/lib/approvals";
import { isCampaignAtRisk } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export default async function ReviewHomePage() {
  await ensureSettings();

  const rows = await prisma.campaign.findMany({
    where: { quarter: "Q4-2026" },
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
    },
  });

  const campaigns = rows.map((c) => ({
    id: c.id,
    appId: c.appId,
    title: c.title,
    region: c.region,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    totalAssets: c.mockups.length,
    fullyApproved: isCampaignApproved(c),
  }));

  return (
    <div className="hub-page bg-hub-cream">
      <main className="hub-container hub-main pb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-humaan-tight text-hub-heading md:text-2xl">
            Q4 campaigns
          </h1>
          <p className="text-sm text-hub-muted">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
            {campaigns.some(isCampaignAtRisk) ? (
              <span className="ml-3 font-semibold text-red-600">
                {campaigns.filter(isCampaignAtRisk).length} at risk before Nov 7
              </span>
            ) : null}
          </p>
        </div>
        <CampaignListTable
          rows={campaigns}
          linkPattern="review-any"
          linkLabel="Review"
          showReviewStatus
        />
        <p className="mt-6 text-center text-sm text-hub-muted">
          <Link href="/admin" className="font-medium text-hub-ink underline-offset-4 hover:underline">
            Admin
          </Link>
        </p>
      </main>
    </div>
  );
}
