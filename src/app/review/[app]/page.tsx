import Link from "next/link";
import { notFound } from "next/navigation";
import { NavBar, reviewNav } from "@/components/NavBar";
import { AppIcon } from "@/components/AppIcon";
import { CampaignListTable } from "@/components/CampaignListTable";
import { getApp } from "@/lib/apps";
import { prisma, ensureSettings } from "@/lib/db";
import { appStaticParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return appStaticParams();
}

export default async function AppCampaignsPage({
  params,
}: {
  params: Promise<{ app: string }>;
}) {
  const { app: appId } = await params;
  const app = getApp(appId);
  if (!app) notFound();

  await ensureSettings();

  const campaigns = await prisma.campaign.findMany({
    where: { appId },
    orderBy: { startDate: "asc" },
  });

  const rows = campaigns.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
  }));

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={reviewNav} badge={app.shortName} />

      <section className="hub-hero hub-hero--compact">
        <div className="hub-container">
          <Link href="/review" className="text-sm font-medium text-hub-muted hover:text-hub-ink">
            ← All apps
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <AppIcon appId={appId} size={44} className="rounded-xl" />
            <div>
              <h1 className="hub-display-sm">{app.name}</h1>
              <p className="mt-0.5 text-sm text-hub-muted">{campaigns.length} Q4 campaigns</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hub-section--tight">
        <div className="hub-container">
          {campaigns.length === 0 ? (
            <div className="hub-card-bordered p-8 text-center">
              <p className="text-hub-muted">No campaigns yet for this app.</p>
            </div>
          ) : (
            <CampaignListTable
              rows={rows}
              showApp={false}
              linkPattern="review-app"
              appId={appId}
              linkLabel="Review"
            />
          )}
        </div>
      </section>
    </div>
  );
}
