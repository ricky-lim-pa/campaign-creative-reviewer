"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { AssetReviewViewer } from "@/components/AssetReviewViewer";
import { AppIcon } from "@/components/AppIcon";
import { CampaignMeta, CampaignResourceLinks } from "@/components/CampaignMeta";
import { ProgressBar } from "@/components/StatusBadge";
import { getApp } from "@/lib/apps";
import { getApprovalStats } from "@/lib/stats";
import { fetchCampaign } from "@/lib/publicPath";
import { loadReviewBoard, mergeCampaignReview, type ReviewBoard } from "@/lib/reviewBoard";
import { parseReportUrls } from "@/lib/types";

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
  kpi: {
    reportUrls: string | null;
    overallSales: string | null;
    yoyNotes: string | null;
    incrementalityNotes: string | null;
    analysisNotes: string | null;
  } | null;
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
  const [board, setBoard] = useState<ReviewBoard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [data, nextBoard] = await Promise.all([
      fetchCampaign(params.campaignId),
      loadReviewBoard(true),
    ]);
    if (data) setCampaign(mergeCampaignReview(data, nextBoard));
    setBoard(nextBoard);
    setLoading(false);
  }, [params.campaignId]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  if (!app) return <p className="p-8">App not found</p>;
  if (loading) return <p className="p-8 text-hub-muted">Loading...</p>;
  if (!campaign) return <p className="p-8">Campaign not found</p>;

  const stats = getApprovalStats(campaign.mockups);
  const reportLinks = parseReportUrls(campaign.kpi?.reportUrls || "[]");
  const performance = [
    { label: "Overall sales", value: campaign.kpi?.overallSales },
    { label: "YoY comparison", value: campaign.kpi?.yoyNotes },
    { label: "Incrementality", value: campaign.kpi?.incrementalityNotes },
    { label: "Analysis", value: campaign.kpi?.analysisNotes },
  ].filter((item) => item.value?.trim());

  return (
    <div className="hub-page bg-hub-cream">
      <section className="hub-hero hub-hero--compact hub-hero--review">
        <div className="hub-container max-w-[1600px]">
          <BackLink
            fallback="/review"
            label="← Campaigns"
            className="inline-flex items-center gap-2 text-sm font-medium text-hub-muted hover:text-hub-ink"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AppIcon appId={campaign.appId} size={36} className="rounded-lg" />
            <h1 className="text-2xl font-semibold tracking-humaan-tight text-hub-heading md:text-3xl">
              {campaign.title}
            </h1>
            {stats.total > 0 ? (
              <ProgressBar approved={stats.approved} total={stats.total} />
            ) : (
              <span className="hub-tag hub-tag--review">Assets pending</span>
            )}
          </div>
          <div className="mt-4 hub-card-bordered p-4">
            <CampaignMeta
              eventLabel={campaign.eventLabel}
              region={campaign.region}
              startDate={campaign.startDate}
              endDate={campaign.endDate}
              notes={campaign.notes}
            />
            <CampaignResourceLinks
              className="mt-4"
              links={{
                reportUrl: campaign.reportUrl,
                confluenceUrl: campaign.confluenceUrl,
                basecampUrl: campaign.basecampUrl,
              }}
            />
          </div>
        </div>
      </section>

      <section className="hub-section--tight pb-8">
        <div className="hub-container max-w-[1600px] space-y-6">
          {board && !board.live ? (
            <p className="text-sm text-hub-muted">
              {board.ok
                ? "Showing the last shared copy. Live updates did not load."
                : "Live approvals could not be loaded."}
            </p>
          ) : null}
          <AssetReviewViewer
            mockups={campaign.mockups}
            campaignId={campaign.id}
            appId={campaign.appId}
            campaignTitle={campaign.title}
            approvedCount={stats.approved}
            totalCount={stats.total}
            onUpdated={load}
          />
          {reportLinks.length > 0 || performance.length > 0 ? (
            <section className="hub-card-bordered p-5">
              <h2 className="text-lg font-semibold text-hub-heading">Performance</h2>
              {reportLinks.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {reportLinks.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-hub-ink hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {performance.length > 0 ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {performance.map((item) => (
                    <div key={item.label}>
                      <dt className="hub-copy-label mb-1">{item.label}</dt>
                      <dd className="whitespace-pre-wrap text-sm leading-relaxed text-hub-muted">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
