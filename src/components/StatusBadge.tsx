"use client";

import {
  APPROVER_BRAND,
  approverButtonLabel,
  approverStatusLabel,
  type ApprovalRecord,
  type ApproverId,
} from "@/lib/approvals";

export function DualApprovalBadge({
  approval,
}: {
  approval: Pick<ApprovalRecord, "rogerApproved" | "toddApproved" | "approved"> | null;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ApproverStatusChip approver="roger" signed={approval?.rogerApproved ?? false} />
      <ApproverStatusChip approver="todd" signed={approval?.toddApproved ?? false} />
    </div>
  );
}

function ApproverStatusChip({ approver, signed }: { approver: ApproverId; signed: boolean }) {
  const brand = APPROVER_BRAND[approver];
  const label = approverStatusLabel(approver, signed);

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:text-xs md:normal-case md:tracking-normal"
      style={
        signed
          ? {
              backgroundColor: `${brand.color}18`,
              borderColor: brand.color,
              color: brand.color,
            }
          : {
              backgroundColor: "#f5f5f5",
              borderColor: `${brand.color}55`,
              color: "#545353",
            }
      }
    >
      {label}
    </span>
  );
}

type ApproverSignOffButtonProps = {
  approver: ApproverId;
  signed: boolean;
  disabled?: boolean;
  onClick: () => void;
  compact?: boolean;
};

export function ApproverSignOffButton({
  approver,
  signed,
  disabled,
  onClick,
  compact = false,
}: ApproverSignOffButtonProps) {
  const brand = APPROVER_BRAND[approver];
  const label = approverButtonLabel(approver, signed);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full justify-center rounded-full border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? "px-4 py-2 text-sm" : "px-4 py-3 text-sm"
      }`}
      style={
        signed
          ? {
              backgroundColor: `${brand.color}14`,
              borderColor: brand.color,
              color: brand.color,
            }
          : {
              backgroundColor: brand.color,
              borderColor: brand.color,
              color: "#ffffff",
            }
      }
    >
      {label}
    </button>
  );
}

export function ProgressBar({ approved, total }: { approved: number; total: number }) {
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-hub-cream-dark">
        <div
          className="h-full rounded-full bg-hub-green transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-hub-muted">
        {approved}/{total} approved
      </span>
    </div>
  );
}

export function StatusBadge({
  approved,
  pending,
}: {
  approved?: boolean;
  pending?: boolean;
}) {
  if (approved) {
    return <span className="hub-badge-approved">Approved</span>;
  }
  if (pending) {
    return <span className="hub-badge-pending">Pending review</span>;
  }
  return <span className="hub-badge-pending">No mockup</span>;
}
