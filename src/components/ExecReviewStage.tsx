"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMockupTypeLabel } from "@/lib/apps";
import {
  hasMockupLabel,
  mockupDisplayTitle,
  resolveCopyBlocks,
  reviewCopyBlocksForType,
  hasReviewCopy,
} from "@/lib/mockups";
import { ApproverSignOffButton, DualApprovalBadge } from "./StatusBadge";
import { useApproverSignOff } from "@/hooks/useApproverSignOff";
import { ApprovalCelebrationModal } from "./ApprovalCelebrationModal";
import { pickRandomAffirmation, type ApprovalAffirmation } from "@/lib/approvalAffirmations";
import { withBasePath } from "@/lib/publicPath";

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
    rogerApprovedAt?: string | Date | null;
    toddApprovedAt?: string | Date | null;
    approvedAt?: string | Date | null;
  } | null;
  comments: { id: string; text: string; author: string; createdAt: string }[];
};

type ExecReviewStageProps = {
  mockupId: string;
  type: string;
  label?: string;
  versions: Version[];
  campaignId: string;
  appId: string;
  hasNextAsset?: boolean;
  reviewMode?: boolean;
  onUpdated: () => void;
  onApproved?: () => void;
};

function copyFieldLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized === "preheader") return "PV (Preheader)";
  if (normalized === "pv") return "PV";
  return label;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const displayLabel = copyFieldLabel(label);

  return (
    <div className="hub-copy-block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="hub-copy-label">{displayLabel}</p>
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

function AssetCompareSlider({
  previousSrc,
  latestSrc,
  previousLabel,
  latestLabel,
  alt,
  note,
}: {
  previousSrc: string;
  latestSrc: string;
  previousLabel: string;
  latestLabel: string;
  alt: string;
  note?: string | null;
}) {
  const [split, setSplit] = useState(52);

  useEffect(() => {
    setSplit(52);
  }, [previousSrc, latestSrc]);

  return (
    <div className="hub-compare">
      <div className="hub-compare__labels">
        <span>{previousLabel}</span>
        <span>{latestLabel}</span>
      </div>
      <div className="hub-compare__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previousSrc} alt={`Previous: ${alt}`} className="hub-compare__base" draggable={false} />
        <div className="hub-compare__clip" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={latestSrc} alt={`Latest: ${alt}`} className="hub-compare__overlay" draggable={false} />
        </div>
        <div className="hub-compare__handle" style={{ left: `${split}%` }} aria-hidden>
          <span>⟷</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(event) => setSplit(Number(event.target.value))}
          className="hub-compare__range"
          aria-label="Drag to compare previous and latest"
        />
      </div>
      <p className="hub-compare__hint">Left is previous. Right is latest. Drag to compare.</p>
      {note ? <p className="hub-compare__note">{note}</p> : null}
    </div>
  );
}

function AssetStaticViewer({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="hub-theater__stage hub-theater__stage--static">
      <div className="hub-theater__canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="hub-theater__image hub-theater__image--static" draggable={false} />
      </div>
      <p className="hub-theater__static-hint">Enter review mode to zoom and pan</p>
    </div>
  );
}

function AssetZoomViewer({
  src,
  alt,
  assetKey,
  onToggleFullscreen,
  isFullscreen,
}: {
  src: string;
  alt: string;
  assetKey: string;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; panX: number; panY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [assetKey, resetView]);

  function zoomIn() {
    setScale((current) => Math.min(4, current + 0.35));
  }

  function zoomOut() {
    setScale((current) => {
      const next = Math.max(1, current - 0.35);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    setScale((current) => {
      const next = Math.min(4, Math.max(1, current + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function onPointerDown(event: React.PointerEvent) {
    if (scale <= 1) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.panX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (event.clientY - dragRef.current.startY),
    });
  }

  function onPointerUp(event: React.PointerEvent) {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function onDoubleClick() {
    if (scale > 1) {
      resetView();
      return;
    }
    setScale(2);
  }

  const zoomLabel = `${Math.round(scale * 100)}%`;

  return (
    <div className="hub-theater__stage">
      <div className="hub-theater__zoom-toolbar">
        <button type="button" onClick={zoomOut} className="hub-theater__zoom-btn" aria-label="Zoom out">
          −
        </button>
        <span className="hub-theater__zoom-label">{zoomLabel}</span>
        <button type="button" onClick={zoomIn} className="hub-theater__zoom-btn" aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={resetView} className="hub-theater__zoom-reset">
          Reset
        </button>
        {onToggleFullscreen ? (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hub-theater__fullscreen-btn"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="hub-theater__canvas"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={onDoubleClick}
        style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="hub-theater__image"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>

      <p className="hub-theater__zoom-hint">
        Scroll to zoom · Double-click to zoom in or reset · Drag when zoomed
      </p>
    </div>
  );
}

export function ExecReviewStage({
  mockupId,
  type,
  label = "",
  versions,
  campaignId,
  appId,
  hasNextAsset = false,
  reviewMode = false,
  onUpdated,
  onApproved,
}: ExecReviewStageProps) {
  const latest = versions[0];
  const [viewVersionId, setViewVersionId] = useState(latest?.id);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [celebration, setCelebration] = useState<ApprovalAffirmation | null>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (latest?.id) setViewVersionId(latest.id);
  }, [latest?.id, mockupId]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    const node = visualRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen();
  }

  const activeVersion = versions.find((v) => v.id === viewVersionId) ?? latest;
  const isLatest = activeVersion?.id === latest?.id;
  const previousVersion = activeVersion
    ? [...versions]
        .filter((version) => version.version < activeVersion.version && version.imagePath)
        .sort((a, b) => b.version - a.version)[0]
    : undefined;
  const canCompare = Boolean(isLatest && activeVersion?.imagePath && previousVersion?.imagePath);
  const typeLabel = getMockupTypeLabel(type);
  const displayTitle = mockupDisplayTitle(type, label, typeLabel);
  const allCopyBlocks = activeVersion ? resolveCopyBlocks(activeVersion) : [];
  const reviewCopyBlocks = reviewCopyBlocksForType(type, allCopyBlocks);
  const showCopyPanel = hasReviewCopy(type, allCopyBlocks);

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
    enabled: Boolean(isLatest && activeVersion),
    onUpdated,
    onFullyApproved: () => setCelebration(pickRandomAffirmation()),
  });

  useEffect(() => {
    clearOptimistic();
  }, [activeVersion?.id, clearOptimistic]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "c" && event.key !== "C") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)
      ) {
        return;
      }
      if (!isLatest) return;
      event.preventDefault();
      commentRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLatest]);

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
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
    onUpdated();
  }

  if (!activeVersion) {
    return (
      <div className="hub-theater">
        <p className="text-hub-muted">No version uploaded yet.</p>
      </div>
    );
  }

  const copyPanelLabel = type === "email" ? "Subject & preview" : type === "push" ? "Push copy" : "Copy";

  const copyContent = (
    <div className="space-y-3">
      <p className="hub-copy-label">{copyPanelLabel}</p>
      {reviewCopyBlocks.length > 0 ? (
        reviewCopyBlocks.map((block, blockIndex) => (
          <CopyField key={`${block.label}-${blockIndex}`} label={block.label} value={block.value} />
        ))
      ) : (
        <p className="text-sm text-hub-muted">
          {type === "email" ? "Subject and PV not added yet." : "No copy added yet."}
        </p>
      )}
    </div>
  );

  const metadataBlock = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="hub-badge">{typeLabel}</span>
        {hasMockupLabel(label) ? <span className="hub-badge">{label}</span> : null}
        <span className="hub-badge">v{activeVersion.version}</span>
        {isLatest ? <DualApprovalBadge approval={approval} /> : null}
      </div>
      <h3
        className={
          reviewMode
            ? "mt-2 text-sm font-semibold leading-snug tracking-humaan-tight text-hub-heading"
            : "mt-2 text-lg font-semibold tracking-humaan-tight text-hub-heading"
        }
      >
        {displayTitle}
      </h3>
      {versions.length > 1 ? (
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="mt-2 text-xs font-medium text-hub-muted hover:text-hub-ink"
        >
          {showHistory ? "Hide versions" : `${versions.length} versions`}
        </button>
      ) : null}
      {showHistory && versions.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {versions.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => setViewVersionId(version.id)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                version.id === activeVersion.id
                  ? "bg-hub-green text-white"
                  : "bg-hub-cream-dark text-hub-muted hover:text-hub-ink"
              }`}
            >
              v{version.version}
              {version.approval?.approved ? " ✓" : ""}
            </button>
          ))}
        </div>
      ) : null}
      {!isLatest ? (
        <p className="mt-2 rounded-lg bg-hub-cream px-2.5 py-1.5 text-xs text-hub-muted">
          Older version — switch to v{latest.version} to approve.
        </p>
      ) : null}
    </>
  );

  const commentsBlock = isLatest ? (
    <div className="hub-theater__comments">
      {activeVersion.comments.length > 0 ? (
        <div className="space-y-2">
          <p className="hub-copy-label">Comments</p>
          {activeVersion.comments.map((entry) => (
            <div key={entry.id} className="hub-comment-entry">
              <p className="hub-copy-text text-sm">{entry.text}</p>
              <p className="mt-1.5 text-xs font-medium text-hub-ink">{entry.author}</p>
              <p className="text-xs text-hub-muted">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : null}

      <form onSubmit={submitComment} className="space-y-2">
        <label htmlFor={`comment-${mockupId}`} className="hub-copy-label">
          {activeVersion.comments.length > 0 ? "Add another comment" : "Leave feedback"}
        </label>
        <textarea
          ref={commentRef}
          id={`comment-${mockupId}`}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            if (commentError) setCommentError(null);
          }}
          placeholder="Request changes or leave feedback..."
          rows={reviewMode ? 4 : 3}
          className="hub-textarea"
        />
        {commentError ? <p className="text-sm font-medium text-red-600">{commentError}</p> : null}
        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="hub-btn-primary w-full justify-center"
        >
          Post comment
        </button>
      </form>
    </div>
  ) : null;

  const approveBlock = isLatest ? (
    <div className="hub-theater__actions hub-theater__actions--dual">
      <ApproverSignOffButton
        approver="roger"
        signed={rogerApproved}
        disabled={approvalLoading || loading}
        onClick={() => toggleApprover("roger")}
      />
      <ApproverSignOffButton
        approver="todd"
        signed={toddApproved}
        disabled={approvalLoading || loading}
        onClick={() => toggleApprover("todd")}
      />
      {approvalError ? <p className="text-sm font-medium text-red-600">{approvalError}</p> : null}
      {fullyApproved && hasNextAsset ? (
        <p className="text-center text-xs font-medium text-hub-muted">Both signed off — moving to next asset</p>
      ) : null}
    </div>
  ) : null;

  const detailPanel = (
    <aside className="hub-theater__detail">
      <div className="hub-theater__detail-head">{metadataBlock}</div>
      <div className="hub-theater__detail-scroll">
        {commentsBlock}
      </div>
      {approveBlock}
    </aside>
  );

  return (
    <div className={`hub-theater ${reviewMode ? "hub-theater--review" : ""}`}>
      <div className="hub-theater__layout">
        <div className="hub-theater__visual" ref={visualRef}>
          {canCompare && previousVersion?.imagePath && activeVersion.imagePath ? (
            <AssetCompareSlider
              previousSrc={withBasePath(previousVersion.imagePath)}
              latestSrc={withBasePath(activeVersion.imagePath)}
              previousLabel={`v${previousVersion.version}`}
              latestLabel={`v${activeVersion.version}`}
              alt={displayTitle}
              note={activeVersion.notes}
            />
          ) : activeVersion.imagePath ? (
            reviewMode ? (
              <AssetZoomViewer
                key={`${mockupId}-${activeVersion.id}`}
                assetKey={`${mockupId}-${activeVersion.id}`}
                src={withBasePath(activeVersion.imagePath || "")}
                alt={displayTitle}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
              />
            ) : (
              <AssetStaticViewer src={withBasePath(activeVersion.imagePath || "")} alt={displayTitle} />
            )
          ) : (
            <div className="hub-theater__stage hub-theater__stage--empty">
              <p className="text-sm text-hub-muted">No image uploaded</p>
            </div>
          )}
        </div>

        {reviewMode ? (
          <div className="hub-theater__aside-group">
            {showCopyPanel ? (
              <aside className="hub-theater__copy-panel">
                <div className="hub-theater__copy-scroll">{copyContent}</div>
              </aside>
            ) : null}
            {detailPanel}
          </div>
        ) : (
          <div className="hub-theater__aside-group hub-theater__aside-group--standard">
            {showCopyPanel ? (
              <aside className="hub-theater__copy-panel">
                <div className="hub-theater__copy-scroll">{copyContent}</div>
              </aside>
            ) : null}
            {detailPanel}
          </div>
        )}
      </div>
      {celebration ? (
        <ApprovalCelebrationModal
          affirmation={celebration}
          onDismiss={dismissCelebration}
          hasNextAsset={hasNextAsset}
        />
      ) : null}
    </div>
  );
}
