import Link from "next/link";
import { NavBar, adminNav } from "@/components/NavBar";
import { CampaignListTable } from "@/components/CampaignListTable";
import { prisma, ensureSettings } from "@/lib/db";
import { basePath } from "@/lib/publicPath";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (basePath) {
    return (
      <main className="hub-container hub-main">
        <div className="hub-card-bordered max-w-xl p-8">
          <h1 className="hub-display-sm">Campaign admin</h1>
          <p className="mt-3 text-sm text-hub-muted">
            Open the admin on the computer that has the campaign workspace to upload, replace, or remove creative.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="http://127.0.0.1:3000/admin/" className="hub-btn-accent">Open local admin</a>
            <Link href="/review" className="hub-btn">Back to review</Link>
          </div>
        </div>
      </main>
    );
  }

  await ensureSettings();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { startDate: "asc" },
  });

  const rows = campaigns.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
  }));

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={adminNav} badge="Admin" />
      <main className="hub-container hub-main">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hub-hero__eyebrow">Your workspace</p>
            <h1 className="hub-display-sm">Campaign dashboard</h1>
            <p className="mt-0.5 text-sm text-hub-muted">{campaigns.length} campaigns · chronological</p>
          </div>
          <Link href="/admin/campaigns/new" className="hub-btn-accent">
            + New campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="hub-card-bordered p-8 text-center">
            <p className="text-hub-muted">No campaigns yet. Create your first one to get started.</p>
          </div>
        ) : (
          <CampaignListTable
            rows={rows}
            linkPattern="admin"
            linkLabel="Manage"
          />
        )}

        <p className="mt-6 text-center text-sm text-hub-muted">
          Exec review link:{" "}
          <Link href="/review" className="font-semibold text-hub-ink hover:underline">
            /review
          </Link>
        </p>
      </main>
    </div>
  );
}
