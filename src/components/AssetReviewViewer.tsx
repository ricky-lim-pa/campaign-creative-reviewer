"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ExecReviewStage } from "@/components/ExecReviewStage";
import { CampaignCompleteModal } from "@/components/CampaignCompleteModal";
import { pickRandomCampaignAffirmation, type ApprovalAffirmation } from "@/lib/approvalAffirmations";
import { mockupsForApproval } from "@/lib/creatives";


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
      mockupsForApproval([...mockups])
        .map((mockup) => ({
          ...mockup,
          versions: mockup.versions.slice(0, 1),
        }))
        .filter((mockup) => mockup.versions.length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [mockups]
  );
  const [campaignCompletePending, setCampaignCompletePending] = useState(false);
  const [campaignComplete, setCampaignComplete] = useState<ApprovalAffirmation | null>(null);
  const [section, setSection] = useState<"assets" | "emails">("assets");
  const sectionId = useId();
  const sections = [
    { id: "assets", label: "Assets", items: queue.filter((mockup) => mockup.type !== "email") },
    { id: "emails", label: "Emails", items: queue.filter((mockup) => mockup.type === "email") },
  ] as const;
  const available = sections.filter(({ items }) => items.length > 0);
  const active = available.find(({ id }) => id === section)?.id ?? available[0]?.id;

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
    <div className="space-y-4">
      {available.length > 1 ? (
        <div role="group" aria-label="Campaign creative type" className="flex flex-wrap gap-2">
          {available.map(({ id, label, items }) => (
            <button
              key={id}
              type="button"
              aria-pressed={active === id}
              aria-controls={`${sectionId}-${id}`}
              className={active === id ? "hub-btn-primary" : "hub-btn"}
              onClick={() => setSection(id)}
            >
              {label} ({items.length})
            </button>
          ))}
        </div>
      ) : null}
      {available.map(({ id, label, items }) => (
        <section key={id} id={`${sectionId}-${id}`} aria-label={label} hidden={active !== id}>
          <div className="hub-asset-stack">
            {items.map((mockup) => (
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
          </div>
        </section>
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
