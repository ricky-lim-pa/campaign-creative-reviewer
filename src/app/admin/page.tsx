import Link from "next/link";
import { NavBar, adminNav } from "@/components/NavBar";
import { CampaignListTable } from "@/components/CampaignListTable";
import { prisma, ensureSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
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
