import Link from "next/link";
import { NavBar, reviewNav } from "@/components/NavBar";
import { AppIcon } from "@/components/AppIcon";
import { APPS } from "@/lib/apps";
import { prisma, ensureSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  const countsByApp = Object.fromEntries(
    APPS.map((app) => {
      const appCampaigns = campaigns.filter((c) => c.appId === app.id);
      return [app.id, appCampaigns.length];
    })
  );

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
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-humaan-tight text-hub-heading md:text-2xl">
              Select an app
            </h2>
            <p className="text-sm text-hub-muted">{APPS.length} apps</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APPS.map((app) => (
              <Link key={app.id} href={`/review/${app.id}`} className="hub-card">
                <AppIcon appId={app.id} size={44} className="mb-3 rounded-xl" />
                <h3 className="text-base font-semibold tracking-humaan-tight text-hub-ink">
                  {app.shortName}
                </h3>
                <p className="mt-0.5 text-sm text-hub-muted">
                  {countsByApp[app.id] || 0} campaign{(countsByApp[app.id] || 0) !== 1 ? "s" : ""}
                </p>
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
