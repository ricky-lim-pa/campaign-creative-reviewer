import Link from "next/link";
import { ReviewCampaignBoard } from "@/components/ReviewCampaignBoard";
import { prisma, ensureSettings } from "@/lib/db";
import { isCampaignApproved } from "@/lib/approvals";
import { mockupsForApproval } from "@/lib/creatives";

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

  const campaigns = rows.map((c) => {
    const visible = mockupsForApproval(c.mockups);
    return {
      id: c.id,
      appId: c.appId,
      title: c.title,
      region: c.region,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      totalAssets: visible.length,
      fullyApproved: isCampaignApproved(c),
      versionIds: visible.map((mockup) => mockup.versions[0]?.id).filter((id): id is string => Boolean(id)),
    };
  });

  return (
    <div className="hub-page bg-hub-cream">
      <main className="hub-container hub-main pb-8">
        <ReviewCampaignBoard rows={campaigns} />
        <p className="mt-6 text-center text-sm text-hub-muted">
          <Link href="/admin" className="font-medium text-hub-ink underline-offset-4 hover:underline">
            Admin
          </Link>
        </p>
      </main>
    </div>
  );
}
