"use client";

import { useEffect, useState } from "react";
import { CampaignListTable, type CampaignListRow } from "@/components/CampaignListTable";
import { isCampaignAtRisk } from "@/lib/campaigns";
import { liveCampaignApproved, loadReviewBoard, type ReviewBoard } from "@/lib/reviewBoard";

export function ReviewCampaignBoard({ rows }: { rows: CampaignListRow[] }) {
  const [board, setBoard] = useState<ReviewBoard | null>(null);

  useEffect(() => {
    let cancel = false;

    async function refresh() {
      const next = await loadReviewBoard(true);
      if (!cancel) setBoard(next);
    }

    refresh();
    const timer = window.setInterval(refresh, 15000);
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancel = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const liveRows = rows.map((row) => ({
    ...row,
    fullyApproved: liveCampaignApproved(row.versionIds ?? [], board, Boolean(row.fullyApproved)),
  }));
  const atRisk = liveRows.filter(isCampaignAtRisk).length;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-humaan-tight text-hub-heading md:text-2xl">Q4 campaigns</h1>
        <p className="text-sm text-hub-muted">
          {liveRows.length} campaign{liveRows.length === 1 ? "" : "s"}
          {atRisk > 0 ? (
            <span className="ml-3 font-semibold text-red-600">
              {atRisk} at risk before Nov 7
            </span>
          ) : null}
        </p>
      </div>
      <CampaignListTable rows={liveRows} linkPattern="review-any" linkLabel="Review" showReviewStatus />
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
