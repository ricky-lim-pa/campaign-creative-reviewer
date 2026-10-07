"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { NavBar, adminNav } from "@/components/NavBar";
import { AddMockupControls, MockupSectionHeader } from "@/components/AddMockupControls";
import { CampaignMetaForm } from "@/components/CampaignMetaForm";
import { MockupCard } from "@/components/MockupCard";
import { MockupUploadForm } from "@/components/MockupUploadForm";
import { APPS, MOCKUP_TYPES } from "@/lib/apps";
import { groupMockupsByType } from "@/lib/mockups";
import { AppIcon } from "@/components/AppIcon";

type Campaign = {
  id: string;
  appId: string;
  title: string;
  eventLabel: string;
  region: string;
  startDate: string;
  endDate: string;
  quarter: string;
  notes: string | null;
  reportUrl: string | null;
  confluenceUrl: string | null;
  basecampUrl: string | null;
  mockups: Array<{
    id: string;
    type: string;
    label: string;
    sortOrder: number;
    versions: Array<{
      id: string;
      version: number;
      imagePath: string | null;
      copyBlocks: string | null;
      subject: string | null;
      preheader: string | null;
      bodyCopy: string | null;
      pushTitle: string | null;
      pushBody: string | null;
      cta: string | null;
      notes: string | null;
      approval: {
        rogerApproved: boolean;
        toddApproved: boolean;
        approved: boolean;
      } | null;
      comments: { id: string; text: string; author: string; createdAt: string }[];
    }>;
  }>;
};

export default function AdminCampaignPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [uploadMockupId, setUploadMockupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${params.id}`);
    if (res.ok) setCampaign(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadVersion(form: HTMLFormElement, mockupId: string) {
    setLoading(true);
    setUploadMessage(null);
    const formData = new FormData(form);
    formData.set("mockupId", mockupId);
    const res = await fetch("/api/mockups/versions", { method: "POST", body: formData });
    const data = res.ok ? await res.json() : null;
    setUploadMockupId(null);
    setLoading(false);
    form.reset();
    await load();
    if (data?.mode === "assets" && data?.count > 1) {
      setUploadMessage(`Created ${data.count} separate assets to review.`);
    } else if (data?.count > 1) {
      setUploadMessage(`Uploaded ${data.count} versions successfully.`);
    } else if (data?.count === 1) {
      setUploadMessage("Uploaded 1 asset successfully.");
    }
  }

  async function deleteMockup(mockupId: string) {
    if (!confirm("Delete this asset and all of its versions?")) return;
    await fetch(`/api/mockups?id=${mockupId}`, { method: "DELETE" });
    await load();
  }

  async function deleteCampaign() {
    if (!confirm("Delete this campaign and all mockups?")) return;
    await fetch(`/api/campaigns/${params.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  const mockupGroups = useMemo(
    () =>
      campaign
        ? groupMockupsByType(campaign.mockups)
        : new Map<string, Campaign["mockups"]>(),
    [campaign]
  );

  if (!campaign) return <p className="p-8 text-hub-muted">Loading...</p>;

  const app = APPS.find((a) => a.id === campaign.appId);

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={adminNav} badge="Admin" />
      <main className="hub-container hub-main">
        <Link href="/admin" className="text-sm font-medium text-hub-muted hover:text-hub-ink">
          ← Dashboard
        </Link>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <AppIcon appId={campaign.appId} size={40} className="rounded-xl" />
              <p className="text-sm font-medium text-hub-muted">{app?.name}</p>
            </div>
            <h1 className="hub-display-sm mt-3">{campaign.title}</h1>
            {campaign.eventLabel ? (
              <span className="hub-badge mt-2 inline-flex">{campaign.eventLabel}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/review/${campaign.appId}/${campaign.id}`} className="hub-btn">
              Preview exec view
            </Link>
            <Link href={`/review/${campaign.appId}/${campaign.id}/kpi`} className="hub-btn">
              KPI hub
            </Link>
            <button
              type="button"
              onClick={deleteCampaign}
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        <CampaignMetaForm campaign={campaign} onSaved={load} />

        {uploadMessage ? (
          <p className="mt-4 rounded-xl border border-hub-green/30 bg-hub-green/10 px-4 py-2 text-sm font-medium text-hub-green-text">
            {uploadMessage}
          </p>
        ) : null}

        <div className="mt-6">
          <AddMockupControls campaignId={campaign.id} onAdded={load} />
        </div>

        <div className="mt-6 space-y-8">
          {MOCKUP_TYPES.map((type) => {
            const items = mockupGroups.get(type.id) ?? [];
            if (items.length === 0) return null;

            return (
              <section key={type.id} className="space-y-4">
                <MockupSectionHeader type={type.id} count={items.length} />
                {items.map((mockup) => (
                  <div key={mockup.id} className="space-y-3">
                    <MockupCard
                      mockupId={mockup.id}
                      type={mockup.type}
                      label={mockup.label}
                      versions={mockup.versions}
                      mode="admin"
                      onDelete={() => deleteMockup(mockup.id)}
                    />

                    {uploadMockupId === mockup.id ? (
                      <MockupUploadForm
                        mockupId={mockup.id}
                        mockupType={mockup.type}
                        mockupLabel={mockup.label}
                        nextVersion={(mockup.versions[0]?.version ?? 0) + 1}
                        loading={loading}
                        onSubmit={(form) => uploadVersion(form, mockup.id)}
                        onCancel={() => setUploadMockupId(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUploadMockupId(mockup.id)}
                        className="text-sm font-medium text-hub-ink hover:underline"
                      >
                        {mockup.versions.length > 0 ? "Upload new version" : "Upload first version"} →
                      </button>
                    )}
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
