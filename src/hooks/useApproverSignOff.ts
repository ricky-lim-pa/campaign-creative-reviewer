"use client";

import { useCallback, useState } from "react";
import {
  approverIsSigned,
  isFullyApproved,
  syncFullApproval,
  type ApprovalRecord,
  type ApproverId,
} from "@/lib/approvals";

type UseApproverSignOffOptions = {
  mockupVersionId: string;
  approval: ApprovalRecord | null;
  appId?: string;
  campaignId?: string;
  mockupType?: string;
  version?: number;
  enabled?: boolean;
  onUpdated?: () => void;
  onFullyApproved?: () => void;
};

export function useApproverSignOff({
  mockupVersionId,
  approval,
  appId,
  campaignId,
  mockupType,
  version,
  enabled = true,
  onUpdated,
  onFullyApproved,
}: UseApproverSignOffOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticApproval, setOptimisticApproval] = useState<ApprovalRecord | null>(null);

  const currentApproval = optimisticApproval ?? approval;
  const rogerApproved = approverIsSigned(currentApproval, "roger");
  const toddApproved = approverIsSigned(currentApproval, "todd");
  const fullyApproved = isFullyApproved(currentApproval);

  const clearOptimistic = useCallback(() => setOptimisticApproval(null), []);

  async function toggleApprover(approver: ApproverId) {
    if (!enabled || loading) return;

    const currentlySigned = approverIsSigned(currentApproval, approver);
    const nextRoger = approver === "roger" ? !currentlySigned : rogerApproved;
    const nextTodd = approver === "todd" ? !currentlySigned : toddApproved;
    const optimistic = syncFullApproval({
      rogerApproved: nextRoger,
      toddApproved: nextTodd,
      rogerApprovedAt: nextRoger ? new Date() : null,
      toddApprovedAt: nextTodd ? new Date() : null,
    });

    setError(null);
    setOptimisticApproval(optimistic);
    setLoading(true);

    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockupVersionId,
          approver,
          approved: !currentlySigned,
          appId,
          campaignId,
          mockupType,
          version,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Could not save approval.");
      }

      const saved = (await res.json()) as ApprovalRecord;
      setOptimisticApproval(saved);
      const wasFullyApproved = isFullyApproved(approval);
      onUpdated?.();

      if (!wasFullyApproved && isFullyApproved(saved)) {
        onFullyApproved?.();
      }
    } catch (err) {
      setOptimisticApproval(null);
      setError(err instanceof Error ? err.message : "Could not save approval.");
    } finally {
      setLoading(false);
    }
  }

  return {
    approval: currentApproval,
    rogerApproved,
    toddApproved,
    fullyApproved,
    loading,
    error,
    toggleApprover,
    clearOptimistic,
  };
}
