"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approverIsSigned,
  isFullyApproved,
  syncFullApproval,
  type ApprovalRecord,
  type ApproverId,
} from "@/lib/approvals";
import { setApprover } from "@/lib/reviewBoard";

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

  useEffect(() => {
    if (!optimisticApproval || !approval) return;
    if (
      approval.rogerApproved === optimisticApproval.rogerApproved &&
      approval.toddApproved === optimisticApproval.toddApproved
    ) {
      setOptimisticApproval(null);
    }
  }, [approval, optimisticApproval]);

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
      const saved = await setApprover(mockupVersionId, approver, !currentlySigned);
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
