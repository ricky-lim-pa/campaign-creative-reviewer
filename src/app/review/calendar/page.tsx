import { NavBar, reviewNav } from "@/components/NavBar";
import { CalendarView } from "@/components/CalendarView";
import { prisma, ensureSettings } from "@/lib/db";
import { getApprovalStats } from "@/lib/stats";

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

  const campaigns = rows.map((c) => {
    const stats = getApprovalStats(c.mockups);
    return {
      id: c.id,
      appId: c.appId,
      title: c.title,
      region: c.region,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      approvedCount: stats.approved,
      totalAssets: stats.total,
      fullyApproved: stats.total > 0 && stats.approved === stats.total,
    };
  });

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={reviewNav} badge="Q4 2026" />

      <section className="hub-hero hub-hero--compact">
        <div className="hub-container">
          <p className="hub-hero__eyebrow">Plan the season</p>
          <h1 className="hub-display-sm">Q4 Calendar</h1>
          <p className="hub-lead mt-2 max-w-2xl">
            Click a month on the timeline to zoom in and see every campaign running that period.
          </p>
        </div>
      </section>

      <main className="hub-container hub-main pb-8">
        <CalendarView campaigns={campaigns} />
      </main>
    </div>
  );
}
