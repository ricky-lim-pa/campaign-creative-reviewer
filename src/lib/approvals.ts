export type ApprovalRecord = {
  rogerApproved: boolean;
  rogerApprovedAt?: string | Date | null;
  toddApproved: boolean;
  toddApprovedAt?: string | Date | null;
  approved: boolean;
  approvedAt?: string | Date | null;
};

export type ApproverId = "roger" | "todd";

/** Roger = FPA (Photo Art) pink · Todd = FP brand blue/teal */
export const APPROVER_BRAND = {
  roger: { name: "Roger", color: "#db2777" },
  todd: { name: "Todd", color: "#33cbcc" },
} as const;

export function approverButtonLabel(approver: ApproverId, signed: boolean) {
  const name = APPROVER_BRAND[approver].name;
  return signed ? `Approved by ${name}` : `${name} approve`;
}

export function approverStatusLabel(approver: ApproverId, signed: boolean) {
  const name = APPROVER_BRAND[approver].name;
  return signed ? `Approved by ${name}` : `${name} Approval`;
}

export function isFullyApproved(approval: ApprovalRecord | null | undefined) {
  return Boolean(approval?.rogerApproved && approval?.toddApproved);
}

export function approverIsSigned(approval: ApprovalRecord | null | undefined, approver: ApproverId) {
  if (!approval) return false;
  return approver === "roger" ? approval.rogerApproved : approval.toddApproved;
}

export function approvalProgressLabel(approval: ApprovalRecord | null | undefined) {
  if (!approval) return "Awaiting Roger & Todd";
  const parts: string[] = [];
  parts.push(approval.rogerApproved ? "Roger ✓" : "Roger pending");
  parts.push(approval.toddApproved ? "Todd ✓" : "Todd pending");
  return parts.join(" · ");
}

export function syncFullApproval(fields: {
  rogerApproved: boolean;
  toddApproved: boolean;
  rogerApprovedAt?: Date | null;
  toddApprovedAt?: Date | null;
}) {
  const approved = fields.rogerApproved && fields.toddApproved;
  return {
    ...fields,
    approved,
    approvedAt: approved ? new Date() : null,
  };
}
