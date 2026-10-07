"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NavBar, reviewNav } from "@/components/NavBar";
import { BackLink } from "@/components/BackLink";
import { AssetReviewViewer } from "@/components/AssetReviewViewer";
import { AppIcon } from "@/components/AppIcon";
import { ProgressBar } from "@/components/StatusBadge";
import { getApp } from "@/lib/apps";
import { getApprovalStats } from "@/lib/stats";
import { fetchCampaign } from "@/lib/publicPath";

type CampaignData = {
  id: string;
  appId: string;
  title: string;
  eventLabel: string;
  region: string;
  startDate: string;
  endDate: string;
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

export default function CampaignReviewPage() {
  const params = useParams<{ app: string; campaignId: string }>();
  const app = getApp(params.app);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchCampaign(params.campaignId);
    if (data) setCampaign(data);
    setLoading(false);
  }, [params.campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!reviewMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reviewMode]);

  if (!app) return <p className="p-8">App not found</p>;
  if (loading) return <p className="p-8 text-hub-muted">Loading...</p>;
  if (!campaign) return <p className="p-8">Campaign not found</p>;

  const stats = getApprovalStats(campaign.mockups);

  return (
    <div className={`${reviewMode ? "hub-review-mode" : "hub-page bg-hub-cream"}`}>
      {!reviewMode ? <NavBar links={reviewNav} badge={app.shortName} /> : null}

      {!reviewMode ? (
        <section className="hub-hero hub-hero--compact hub-hero--review">
          <div className="hub-container max-w-[1600px]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <BackLink
                  fallback={`/review/${params.app}`}
                  label={`← ${app.shortName} campaigns`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-hub-muted hover:text-hub-ink"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <AppIcon appId={campaign.appId} size={36} className="rounded-lg" />
                  <h1 className="text-2xl font-semibold tracking-humaan-tight text-hub-heading md:text-3xl">
                    {campaign.title}
                  </h1>
                  <ProgressBar approved={stats.approved} total={stats.total} />
                </div>
              </div>
              <Link
                href={`/review/${params.app}/${params.campaignId}/kpi`}
                className="hub-btn shrink-0 self-start"
              >
                KPI & Reports →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className={reviewMode ? "hub-review-mode__body" : "hub-section--tight pb-8"}>
        <div className={reviewMode ? "hub-review-mode__container" : "hub-container max-w-[1600px]"}>
          <AssetReviewViewer
            mockups={campaign.mockups}
            campaignId={campaign.id}
            appId={campaign.appId}
            campaignTitle={campaign.title}
            appShortName={app.shortName}
            approvedCount={stats.approved}
            totalCount={stats.total}
            reviewMode={reviewMode}
            onReviewModeChange={setReviewMode}
            onUpdated={load}
            backFallback={`/review/${params.app}`}
          />
        </div>
      </section>
    </div>
  );
}
