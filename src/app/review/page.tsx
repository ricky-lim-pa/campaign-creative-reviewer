import Link from "next/link";
import { NavBar, reviewNav } from "@/components/NavBar";
import { AppIcon } from "@/components/AppIcon";
import { isCampaignApproved } from "@/lib/approvals";
import { APPS } from "@/lib/apps";
import { prisma, ensureSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

function assetsPendingLabel(count: number) {
  return count === 1 ? "1 asset pending" : `${count} assets pending`;
}

function reviewStatus(appCampaigns: { title: string; mockups: { versions: { approval: { rogerApproved: boolean; toddApproved: boolean } | null }[] }[] }[]) {
  if (appCampaigns.length === 0) {
    return { primary: "No campaigns", needsReview: 0, assetsPending: 0, tone: "empty" as const };
  }
  const assetsPending = appCampaigns.filter((campaign) => campaign.mockups.length === 0 && !isCampaignApproved(campaign)).length;
  const reviewable = appCampaigns.length - assetsPending;
  const approved = appCampaigns.filter(isCampaignApproved).length;
  const needsReview = reviewable - approved;
  if (reviewable === 0) {
    return { primary: assetsPendingLabel(assetsPending), needsReview: 0, assetsPending, tone: "waiting" as const };
  }
  if (needsReview === 0) {
    return { primary: `${approved}/${reviewable} approved`, needsReview: 0, assetsPending, tone: "approved" as const };
  }
  if (approved === 0) {
    return { primary: `0/${reviewable} pending review`, needsReview, assetsPending, tone: "pending" as const };
  }
  return { primary: `${approved}/${reviewable} approved`, needsReview, assetsPending, tone: "mixed" as const };
}

export default async function ReviewHomePage() {
  await ensureSettings();

  const campaigns = await prisma.campaign.findMany({
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

  const statusByApp = Object.fromEntries(
    APPS.map((app) => {
      const appCampaigns = campaigns.filter((c) => c.appId === app.id);
      return [app.id, reviewStatus(appCampaigns)];
    })
  );
  const visibleApps = APPS.filter((app) => statusByApp[app.id].tone !== "empty");

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={reviewNav} badge="Q4 2026" />

      <section className="hub-hero hub-hero--compact">
        <div className="hub-container">
          <p className="hub-hero__eyebrow">Creative review</p>
          <h1 className="hub-display-sm max-w-3xl">
            Extraordinary campaigns, idea to execution.
          </h1>
          <p className="hub-lead mt-3">
            Review email, push, and in-app creative across every FreePrints app — built for
            executive sign-off.
          </p>
        </div>
      </section>

      <section className="hub-section--tight">
        <div className="hub-container">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-humaan-tight text-hub-heading md:text-2xl">
              Select an app
            </h2>
            <p className="text-sm text-hub-muted">{visibleApps.length} apps</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleApps.map((app) => (
              <Link key={app.id} href={`/review/${app.id}`} className="hub-card flex min-h-[10.5rem] flex-col">
                <AppIcon appId={app.id} size={44} className="mb-3 rounded-xl" />
                <h3 className="text-base font-semibold leading-none tracking-humaan-tight text-hub-ink">
                  {app.shortName}
                </h3>
                <div className="mt-auto flex flex-col items-start gap-1.5 pt-3">
                  {statusByApp[app.id].tone === "empty" ? (
                    <p className="text-sm text-hub-muted">{statusByApp[app.id].primary}</p>
                  ) : (
                    <span
                      className={
                        statusByApp[app.id].tone === "pending" || statusByApp[app.id].tone === "waiting"
                          ? "hub-badge-pending"
                          : "hub-badge-approved"
                      }
                    >
                      {statusByApp[app.id].primary}
                    </span>
                  )}
                  {statusByApp[app.id].tone === "mixed" ? (
                    <span className="hub-badge-pending">{statusByApp[app.id].needsReview} pending review</span>
                  ) : null}
                  {statusByApp[app.id].assetsPending > 0 && statusByApp[app.id].tone !== "waiting" ? (
                    <span className="hub-badge-pending">{assetsPendingLabel(statusByApp[app.id].assetsPending)}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-hub-muted">
            <Link href="/admin" className="font-medium text-hub-ink underline-offset-4 hover:underline">
              Admin
            </Link>{" "}
            to upload campaigns and assets
          </p>
        </div>
      </section>
    </div>
  );
}
