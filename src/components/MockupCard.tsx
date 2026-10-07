"use client";

import { useCallback, useEffect, useState } from "react";
import { getMockupTypeLabel } from "@/lib/apps";
import { mockupDisplayTitle, hasMockupLabel, resolveCopyBlocks } from "@/lib/mockups";
import { ApproverSignOffButton, DualApprovalBadge } from "./StatusBadge";
import { useApproverSignOff } from "@/hooks/useApproverSignOff";
import { ApprovalCelebrationModal } from "./ApprovalCelebrationModal";
import { pickRandomAffirmation, type ApprovalAffirmation } from "@/lib/approvalAffirmations";

type Version = {
  id: string;
  version: number;
  imagePath: string | null;
  copyBlocks?: string | null;
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
};

type MockupCardProps = {
  mockupId: string;
  type: string;
  label?: string;
  versions: Version[];
  mode: "review" | "admin";
  campaignId?: string;
  appId?: string;
  layout?: "landscape" | "portrait";
  onUpdated?: () => void;
  onApproved?: () => void;
  onDelete?: () => void;
  focused?: boolean;
};

function CopyField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  const [copied, setCopied] = useState(false);

  return (
    <div className="hub-copy-block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="hub-copy-label">{label}</p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-medium text-hub-ink/70 hover:text-hub-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="hub-copy-text">{value}</p>
    </div>
  );
}

export function MockupCard({
  mockupId,
  type,
  label = "",
  versions,
  mode,
  campaignId,
  appId,
  layout = "landscape",
  onUpdated,
  onApproved,
  onDelete,
  focused = false,
}: MockupCardProps) {
  const latest = versions[0];
  const [viewVersionId, setViewVersionId] = useState(latest?.id);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [celebration, setCelebration] = useState<ApprovalAffirmation | null>(null);

  useEffect(() => {
    if (latest?.id) setViewVersionId(latest.id);
  }, [latest?.id]);

  const activeVersion = versions.find((v) => v.id === viewVersionId) ?? latest;
  const isLatest = activeVersion?.id === latest?.id;
  const typeLabel = getMockupTypeLabel(type);
  const displayTitle = mockupDisplayTitle(type, label, typeLabel);
  const copyBlocks = activeVersion ? resolveCopyBlocks(activeVersion) : [];

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
    onApproved?.();
  }, [onApproved]);

  const {
    approval,
    rogerApproved,
    toddApproved,
    fullyApproved,
    loading: approvalLoading,
    error: approvalError,
    toggleApprover,
    clearOptimistic,
  } = useApproverSignOff({
    mockupVersionId: activeVersion?.id ?? "",
    approval: activeVersion?.approval ?? null,
    appId,
    campaignId,
    mockupType: type,
    version: activeVersion?.version,
    enabled: Boolean(isLatest && activeVersion && mode === "review"),
    onUpdated,
    onFullyApproved: () => setCelebration(pickRandomAffirmation()),
  });

  useEffect(() => {
    clearOptimistic();
  }, [activeVersion?.id, clearOptimistic]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !activeVersion || !isLatest) return;
    setLoading(true);
    setCommentError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mockupVersionId: activeVersion.id,
        text: comment.trim(),
        appId,
        campaignId,
        mockupType: type,
        version: activeVersion.version,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setCommentError("Could not post comment. Please try again.");
      return;
    }
    setComment("");
    onUpdated?.();
  }

  if (!activeVersion) {
    return (
      <article className="hub-work-card">
        <div className="hub-work-card__body">
          <p className="font-semibold text-hub-heading">{displayTitle}</p>
          <p className="mt-1 text-sm text-hub-muted">No version uploaded yet</p>
        </div>
      </article>
    );
  }

  const mediaClass =
    layout === "portrait" ? "hub-work-card__media--portrait" : "hub-work-card__media--landscape";

  const body = (
    <>
      <div className={`hub-work-card__media ${mediaClass}`}>
        {activeVersion.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeVersion.imagePath}
            alt={`${displayTitle} mockup`}
            className="hub-work-card__image"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-hub-muted">
            No image uploaded
          </div>
        )}
      </div>

      <div className="hub-work-card__body">
        <div className="hub-work-card__meta">
          <span className="hub-badge">{typeLabel}</span>
          {hasMockupLabel(label) ? <span className="hub-badge">{label}</span> : null}
          <span className="hub-badge">v{activeVersion.version}</span>
          {mode === "review" && isLatest && (
            <DualApprovalBadge approval={approval} />
          )}
          {versions.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-medium text-hub-muted hover:text-hub-ink"
            >
              {showHistory ? "Hide history" : `${versions.length} versions`}
            </button>
          )}
        </div>

        <h3 className="text-lg font-semibold tracking-humaan-tight text-hub-heading">
          {displayTitle}
        </h3>

        {showHistory && versions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewVersionId(v.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  v.id === activeVersion.id
                    ? "bg-hub-green text-white"
                    : "bg-hub-cream-dark text-hub-muted hover:text-hub-ink"
                }`}
              >
                v{v.version}
                {v.approval?.approved ? " ✓" : ""}
              </button>
            ))}
          </div>
        )}

        {!isLatest && (
          <p className="rounded-2xl bg-hub-cream px-4 py-3 text-xs text-hub-muted">
            Viewing archived version — switch to v{latest.version} to approve or comment
          </p>
        )}

        <div className="grid gap-3">
          {copyBlocks.length > 0 ? (
            copyBlocks.map((block, index) => (
              <CopyField key={`${block.label}-${index}`} label={block.label} value={block.value} />
            ))
          ) : (
            <p className="text-sm text-hub-muted">No copy added yet.</p>
          )}
        </div>

        {activeVersion.comments.length > 0 && (
          <div className="space-y-2">
            <p className="hub-copy-label">Comments</p>
            {activeVersion.comments.map((c) => (
              <div key={c.id} className="hub-copy-block">
                <p className="hub-copy-text">{c.text}</p>
                <p className="mt-2 text-xs font-medium text-hub-ink">{c.author}</p>
                <p className="text-xs text-hub-muted">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {mode === "review" && isLatest && (
          <div className="space-y-3 border-t border-hub-border pt-5">
            <ApproverSignOffButton
              approver="roger"
              signed={rogerApproved}
              disabled={approvalLoading || loading}
              onClick={() => toggleApprover("roger")}
              compact
            />
            <ApproverSignOffButton
              approver="todd"
              signed={toddApproved}
              disabled={approvalLoading || loading}
              onClick={() => toggleApprover("todd")}
              compact
            />
            {approvalError ? (
              <p className="text-sm font-medium text-red-600">{approvalError}</p>
            ) : null}
            {fullyApproved ? (
              <p className="text-center text-xs font-medium text-hub-muted">Fully signed off</p>
            ) : null}

            <form onSubmit={submitComment} className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (commentError) setCommentError(null);
                }}
                placeholder="Add a comment or request changes..."
                rows={3}
                className="hub-textarea"
              />
              {commentError ? (
                <p className="text-sm font-medium text-red-600">{commentError}</p>
              ) : null}
              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="hub-btn-primary"
              >
                Post comment
              </button>
            </form>
          </div>
        )}

        {mode === "admin" && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-hub-soft">
            <span>Mockup ID: {mockupId}</span>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="font-medium text-red-600 hover:underline"
              >
                Delete asset
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );

  return (
    <article className={`hub-work-card ${focused ? "hub-work-card--focus" : ""}`}>
      {focused ? <div className="hub-work-card--focus__layout">{body}</div> : body}
      {celebration ? (
        <ApprovalCelebrationModal affirmation={celebration} onDismiss={dismissCelebration} />
      ) : null}
    </article>
  );
}
