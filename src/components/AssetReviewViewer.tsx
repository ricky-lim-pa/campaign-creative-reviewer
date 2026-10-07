"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMockupTypeLabel } from "@/lib/apps";
import { mockupDisplayTitle, hasMockupLabel } from "@/lib/mockups";
import { ExecReviewStage } from "@/components/ExecReviewStage";
import { AssetReviewStepper } from "@/components/AssetReviewStepper";
import { goBackWithFallback } from "@/components/BackLink";
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
    approval: { approved: boolean } | null;
    comments: { id: string; text: string; author: string; createdAt: string }[];
  }>;
};

type AssetReviewViewerProps = {
  mockups: ReviewMockup[];
  campaignId: string;
  appId: string;
  campaignTitle: string;
  appShortName: string;
  approvedCount: number;
  totalCount: number;
  reviewMode: boolean;
  onReviewModeChange: (value: boolean) => void;
  onUpdated: () => void;
  backFallback?: string;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || target.isContentEditable;
}

export function AssetReviewViewer({
  mockups,
  campaignId,
  appId,
  campaignTitle,
  appShortName,
  approvedCount,
  totalCount,
  reviewMode,
  onReviewModeChange,
  onUpdated,
  backFallback = `/review/${appId}`,
}: AssetReviewViewerProps) {
  const router = useRouter();
  const queue = useMemo(
    () =>
      [...mockups]
        .filter((mockup) => mockup.versions.length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [mockups]
  );

  const [index, setIndex] = useState(0);
  const [campaignCompletePending, setCampaignCompletePending] = useState(false);
  const [campaignComplete, setCampaignComplete] = useState<ApprovalAffirmation | null>(null);
  const [unapproving, setUnapproving] = useState(false);

  const campaignFullyApproved = totalCount > 0 && approvedCount === totalCount;

  useEffect(() => {
    if (!campaignCompletePending) return;
    if (totalCount > 0 && approvedCount === totalCount) {
      setCampaignComplete(pickRandomCampaignAffirmation());
      setCampaignCompletePending(false);
    }
  }, [campaignCompletePending, approvedCount, totalCount]);

  useEffect(() => {
    if (index >= queue.length) {
      setIndex(Math.max(0, queue.length - 1));
    }
  }, [index, queue.length]);

  const goBackOrPrev = useCallback(() => {
    if (index > 0) {
      setIndex((current) => Math.max(0, current - 1));
      return;
    }
    goBackWithFallback(router, backFallback);
  }, [index, router, backFallback]);

  const leftLabel = index > 0 ? "← Previous" : "← Back";

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(queue.length - 1, current + 1));
  }, [queue.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft") goBackOrPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        onReviewModeChange(!reviewMode);
      }
      if (event.key === "Escape" && reviewMode) {
        onReviewModeChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBackOrPrev, goNext, onReviewModeChange, reviewMode]);

  if (queue.length === 0) {
    return <p className="text-hub-muted">No assets uploaded yet.</p>;
  }

  const current = queue[index];
  const typeLabel = getMockupTypeLabel(current.type);
  const title = mockupDisplayTitle(current.type, current.label, typeLabel);
  const approved = current.versions[0]?.approval?.approved ?? false;

  const stepperSteps = queue.map((mockup) => ({
    id: mockup.id,
    type: mockup.type,
    label: mockup.label,
    approved: mockup.versions[0]?.approval?.approved ?? false,
  }));

  function handleApproved() {
    onUpdated();
    if (index < queue.length - 1) {
      setIndex((currentIndex) => currentIndex + 1);
      return;
    }
    setCampaignCompletePending(true);
  }

  async function handleUnapprove() {
    if (unapproving || !campaignFullyApproved) return;
    setUnapproving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/unapprove`, { method: "POST" });
      if (res.ok) onUpdated();
    } finally {
      setUnapproving(false);
    }
  }

  return (
    <div className={`hub-review-focus ${reviewMode ? "hub-review-focus--review" : ""}`}>
      <div className="hub-review-focus__nav">
        <button
          type="button"
          onClick={goBackOrPrev}
          className="hub-review-focus__arrow"
          aria-label={index > 0 ? "Previous asset" : "Go back to previous page"}
        >
          {leftLabel}
        </button>

        <div className="min-w-0 flex-1 px-2 text-center">
          <AssetReviewStepper
            steps={stepperSteps}
            currentIndex={index}
            onSelect={setIndex}
          />
          <div className="hub-review-tabs" role="tablist" aria-label="Assets">
            {queue.map((mockup, itemIndex) => {
              const itemType = getMockupTypeLabel(mockup.type);
              const itemTitle = mockupDisplayTitle(mockup.type, mockup.label, itemType);
              const isApproved = mockup.versions[0]?.approval?.approved ?? false;
              const tabLabel = hasMockupLabel(mockup.label) ? `${itemType}: ${itemTitle}` : itemType;

              return (
                <button
                  key={mockup.id}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === index}
                  onClick={() => setIndex(itemIndex)}
                  className="hub-review-tab"
                >
                  {tabLabel}
                  {isApproved ? " ✓" : ""}
                </button>
              );
            })}
          </div>

          {reviewMode ? (
            <>
              <p className="mt-2 truncate text-xs font-semibold uppercase tracking-wide text-hub-muted">
                {appShortName} · {campaignTitle}
              </p>
              <p className="mt-1 text-sm font-semibold text-hub-heading">
                {typeLabel}
                {hasMockupLabel(current.label) ? ` · ${title}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-hub-muted">
                {approvedCount}/{totalCount} fully approved ·{" "}
                {approved ? "Roger & Todd signed off" : "Awaiting Roger & Todd"}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-semibold text-hub-heading">
                {typeLabel}
                {hasMockupLabel(current.label) ? ` · ${title}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-hub-muted">
                {approved ? "Roger & Todd approved" : "Awaiting Roger & Todd sign-off"}
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={index >= queue.length - 1}
          className="hub-review-focus__arrow"
          aria-label="Next asset"
        >
          Next →
        </button>
      </div>

      <div className="hub-review-focus__toolbar">
        <button
          type="button"
          onClick={() => onReviewModeChange(!reviewMode)}
          className="hub-review-focus__review-btn mx-auto sm:mx-0"
          aria-pressed={reviewMode}
        >
          {reviewMode ? "Exit review mode" : "Review mode"}
        </button>
      </div>

      {campaignFullyApproved ? (
        <div className="hub-review-focus__campaign-status">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="hub-tag hub-tag--approved">Approved</span>
            <span className="text-sm text-hub-muted">All assets signed off by Roger & Todd</span>
          </div>
          <button
            type="button"
            onClick={handleUnapprove}
            disabled={unapproving}
            className="text-xs font-medium text-hub-muted hover:text-hub-ink hover:underline disabled:opacity-50"
          >
            {unapproving ? "Unapproving…" : "Unapprove"}
          </button>
        </div>
      ) : null}

      {!reviewMode ? (
        <p className="hub-review-focus__hint text-center text-xs text-hub-muted">
          ← → navigate · R for review mode · C to focus comment
        </p>
      ) : null}

      <ExecReviewStage
        key={current.id}
        mockupId={current.id}
        type={current.type}
        label={current.label}
        versions={current.versions}
        campaignId={campaignId}
        appId={appId}
        hasNextAsset={index < queue.length - 1}
        reviewMode={reviewMode}
        onUpdated={onUpdated}
        onApproved={handleApproved}
      />

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
