import Link from "next/link";

export function LocalAdminNotice({ campaignId }: { campaignId?: string }) {
  const path = campaignId ? `/admin/campaigns/${encodeURIComponent(campaignId)}/` : "/admin/";

  return (
    <main className="hub-container hub-main">
      <div className="hub-card-bordered max-w-xl p-8">
        <h1 className="hub-display-sm">Campaign admin</h1>
        <p className="mt-3 text-sm text-hub-muted">
          Open the admin on the computer that has the campaign workspace to upload, replace, or remove creative.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={`http://127.0.0.1:3000${path}`} className="hub-btn-accent">
            {campaignId ? "Edit this campaign locally" : "Open local admin"}
          </a>
          <Link href="/review" className="hub-btn">Back to review</Link>
        </div>
      </div>
    </main>
  );
}
