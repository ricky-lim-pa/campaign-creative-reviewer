import { ReviewTabs } from "@/components/ReviewTabs";
import { TouchpointCalendar, type CalendarEntry } from "@/components/TouchpointCalendar";
import touchpoints from "@/data/touchpoints-q4-2026.json";
import { prisma } from "@/lib/db";

export const metadata = { title: "Touchpoint calendar | Campaign Creative Review" };
export const dynamic = "force-static";

export default async function CalendarPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { quarter: "Q4-2026" },
    select: { id: true, appId: true, title: true, startDate: true, endDate: true, region: true },
  });
  const milestones: CalendarEntry[] = campaigns.flatMap((campaign) => {
    const title = campaign.title.replace(/^\[(?:FG|My Deals)\]\s*/, "");
    const app = campaign.title.startsWith("[FG]") ? "freeprints-gifts"
      : campaign.title.startsWith("[My Deals]") ? "my-deals" : campaign.appId;
    const common = { app, title, audience: campaign.region, href: `/review/${campaign.appId}/${campaign.id}` };
    return [
      { ...common, id: `${campaign.id}-start`, channel: "launch", date: campaign.startDate.toISOString().slice(0, 10) },
      { ...common, id: `${campaign.id}-end`, channel: "end", date: campaign.endDate.toISOString().slice(0, 10) },
    ];
  });
  return (
    <div className="hub-page bg-hub-cream">
      <main className="hub-container hub-main pb-10">
        <ReviewTabs active="calendar" />
        <TouchpointCalendar entries={[...(touchpoints as CalendarEntry[]), ...milestones]} />
      </main>
    </div>
  );
}
