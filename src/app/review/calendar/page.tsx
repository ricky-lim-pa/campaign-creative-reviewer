import { NavBar, reviewNav } from "@/components/NavBar";
import { CampaignListTable } from "@/components/CampaignListTable";
import { prisma, ensureSettings } from "@/lib/db";
import { isCampaignApproved } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
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
      <NavBar links={reviewNav} badge="Q4 2026" />

      <main className="hub-container hub-main pb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-humaan-tight text-hub-heading md:text-2xl">
            Q4 campaigns
          </h1>
          <p className="text-sm text-hub-muted">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
          </p>
        </div>
        <CampaignListTable
          rows={campaigns}
          linkPattern="review-any"
          linkLabel="Review"
          showReviewStatus
        />
      </main>
    </div>
  );
}
