"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/apps";
import { getApprovalStats } from "@/lib/stats";
import { fetchCampaignList } from "@/lib/publicPath";
import type { ApprovalAffirmation } from "@/lib/approvalAffirmations";

type CampaignApiRow = {
  id: string;
  appId: string;
  title: string;
  region: string;
  startDate: string;
  mockups: Array<{
    versions: Array<{
      approval: {
        rogerApproved: boolean;
        toddApproved: boolean;
        approved: boolean;
      } | null;
    }>;
  }>;
};

export type CampaignReviewOption = {
  id: string;
  title: string;
  region: string;
  startDate: string;
  approved: number;
  total: number;
  complete: boolean;
};

type CampaignCompleteModalProps = {
  affirmation: ApprovalAffirmation;
  appId: string;
  campaignId: string;
  campaignTitle: string;
  onClose: () => void;
};

function sortCampaignOptions(options: CampaignReviewOption[]) {
  return [...options].sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
}

export function CampaignCompleteModal({
  affirmation,
  appId,
  campaignId,
  campaignTitle,
  onClose,
}: CampaignCompleteModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<CampaignReviewOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      setLoading(true);
      try {
        const rows = (await fetchCampaignList(appId)) as CampaignApiRow[];
        if (cancelled) return;

        const mapped = rows
          .filter((row) => row.id !== campaignId)
          .map((row) => {
            const stats = getApprovalStats(row.mockups);
            return {
              id: row.id,
              title: row.title,
              region: row.region,
              startDate: row.startDate,
              approved: stats.approved,
              total: stats.total,
              complete: stats.total > 0 && stats.approved === stats.total,
            };
          });

        setOptions(sortCampaignOptions(mapped));
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, [appId, campaignId]);

  const pendingOptions = useMemo(() => options.filter((option) => !option.complete), [options]);
  const displayOptions = pendingOptions.length > 0 ? pendingOptions : options;

  function goToCampaign(id: string) {
    router.push(`/review/${appId}/${id}`);
    onClose();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="hub-celebration hub-celebration--campaign"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-complete-title"
      onClick={onClose}
    >
      <div className="hub-celebration__backdrop" aria-hidden />
      <div className="hub-celebration__card hub-celebration__card--campaign" onClick={(e) => e.stopPropagation()}>
        <p className="hub-celebration__emoji" aria-hidden>
          {affirmation.emoji}
        </p>
        <p id="campaign-complete-title" className="hub-celebration__kicker">
          Campaign complete!
        </p>
        <p className="hub-celebration__message">{affirmation.message}</p>
        <p className="hub-celebration__campaign-name">{campaignTitle}</p>

        <div className="hub-celebration__next">
          <p className="hub-celebration__next-label">
            {pendingOptions.length > 0 ? "Review the next campaign?" : "Pick another campaign"}
          </p>

          {loading ? (
            <p className="hub-celebration__next-empty">Loading campaigns…</p>
          ) : displayOptions.length === 0 ? (
            <p className="hub-celebration__next-empty">No other campaigns for this app yet.</p>
          ) : (
            <ul className="hub-celebration__list">
              {displayOptions.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => goToCampaign(option.id)}
                    className="hub-celebration__list-item"
                  >
                    <span className="hub-celebration__list-title">{option.title}</span>
                    <span className="hub-celebration__list-meta">
                      {option.region ? `${option.region} · ` : ""}
                      {formatDate(option.startDate)}
                      {option.total > 0
                        ? ` · ${option.approved}/${option.total} approved`
                        : " · No assets yet"}
                    </span>
                    {option.complete ? (
                      <span className="hub-celebration__list-badge hub-celebration__list-badge--done">
                        Complete ✓
                      </span>
                    ) : (
                      <span className="hub-celebration__list-badge">Review →</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" onClick={onClose} className="hub-celebration__btn hub-celebration__btn--ghost">
          Stay on this campaign
        </button>
      </div>
    </div>
  );
}
