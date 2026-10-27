"use client";

import { useEffect, useMemo, useState } from "react";
import { ExecReviewStage } from "@/components/ExecReviewStage";
import { CampaignCompleteModal } from "@/components/CampaignCompleteModal";
import { pickRandomCampaignAffirmation, type ApprovalAffirmation } from "@/lib/approvalAffirmations";

type ReviewMockup = {
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
};

type AssetReviewViewerProps = {
  mockups: ReviewMockup[];
  campaignId: string;
  appId: string;
  campaignTitle: string;
  approvedCount: number;
  totalCount: number;
  onUpdated: () => void;
};

export function AssetReviewViewer({
  mockups,
  campaignId,
  appId,
  campaignTitle,
  approvedCount,
  totalCount,
  onUpdated,
}: AssetReviewViewerProps) {
  const queue = useMemo(
    () =>
      [...mockups]
        .filter((mockup) => mockup.versions.length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [mockups]
  );
  const [campaignCompletePending, setCampaignCompletePending] = useState(false);
  const [campaignComplete, setCampaignComplete] = useState<ApprovalAffirmation | null>(null);

  useEffect(() => {
    if (!campaignCompletePending) return;
    if (totalCount > 0 && approvedCount === totalCount) {
      setCampaignComplete(pickRandomCampaignAffirmation());
      setCampaignCompletePending(false);
    }
  }, [campaignCompletePending, approvedCount, totalCount]);

  if (queue.length === 0) {
    return (
      <div className="hub-card-bordered p-8 text-center">
        <p className="font-medium text-hub-ink">Assets pending</p>
        <p className="mt-2 text-sm text-hub-muted">This campaign is not ready to review until assets are uploaded.</p>
      </div>
    );
  }

  return (
    <div className="hub-asset-stack">
      {queue.map((mockup) => (
        <ExecReviewStage
          key={mockup.id}
          mockupId={mockup.id}
          type={mockup.type}
          label={mockup.label}
          versions={mockup.versions}
          campaignId={campaignId}
          appId={appId}
          hasNextAsset={false}
          reviewMode={false}
          onUpdated={onUpdated}
          onApproved={() => setCampaignCompletePending(true)}
        />
      ))}
      {campaignComplete ? (
        <CampaignCompleteModal
          affirmation={campaignComplete}
          appId={appId}
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          onClose={() => setCampaignComplete(null)}
        />
      ) : null}
    </div>
  );
}
