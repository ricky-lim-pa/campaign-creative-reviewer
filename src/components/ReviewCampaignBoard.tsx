"use client";

import { useEffect, useState } from "react";
import { CampaignListTable, type CampaignListRow } from "@/components/CampaignListTable";
import { getReviewDate, isCampaignAtRisk, REVIEW_LEAD_DAYS } from "@/lib/campaigns";
import { liveCampaignApproved, loadReviewBoard, REVIEW_REFRESH_INTERVAL_MS, type ReviewBoard } from "@/lib/reviewBoard";

export function ReviewCampaignBoard({ rows }: { rows: CampaignListRow[] }) {
  const [board, setBoard] = useState<ReviewBoard | null>(null);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;

    async function refresh() {
      setToday(getReviewDate());
      const next = await loadReviewBoard(true);
      if (!cancel) setBoard(next);
    }

    refresh();
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(onVisible, REVIEW_REFRESH_INTERVAL_MS);
    return () => {
      cancel = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const liveRows = rows.map((row) => ({
    ...row,
    fullyApproved: liveCampaignApproved(row.versionIds ?? [], board, Boolean(row.fullyApproved)),
  }));
  const atRisk = today ? liveRows.filter((row) => isCampaignAtRisk(row, today)).length : 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-humaan-tight text-hub-heading md:text-2xl">Q4 campaigns</h1>
        <p className="text-sm text-hub-muted">
          {liveRows.length} campaign{liveRows.length === 1 ? "" : "s"}
          {atRisk > 0 ? (
            <span className="ml-3 font-semibold text-red-600" title={`Live or starts in the next ${REVIEW_LEAD_DAYS} days and still needs approval`}>
              {atRisk} urgent
            </span>
          ) : null}
        </p>
      </div>
      <CampaignListTable rows={liveRows} linkPattern="review-any" linkLabel="Review" showReviewStatus reviewDate={today} />
      {board && !board.live ? (
        <p className="mt-4 text-center text-sm text-hub-muted">
          {board.ok
            ? "Showing the last shared copy. Live updates did not load."
            : "Live approvals could not be loaded."}
        </p>
      ) : null}
    </>
  );
}
