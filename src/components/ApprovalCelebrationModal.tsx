"use client";

import { useEffect } from "react";
import type { ApprovalAffirmation } from "@/lib/approvalAffirmations";

type ApprovalCelebrationModalProps = {
  affirmation: ApprovalAffirmation;
  onDismiss: () => void;
  hasNextAsset?: boolean;
};

export function ApprovalCelebrationModal({
  affirmation,
  onDismiss,
  hasNextAsset = false,
}: ApprovalCelebrationModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="hub-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-celebration-title"
      onClick={onDismiss}
    >
      <div className="hub-celebration__backdrop" aria-hidden />
      <div className="hub-celebration__card" onClick={(event) => event.stopPropagation()}>
        <p className="hub-celebration__emoji" aria-hidden>
          {affirmation.emoji}
        </p>
        <p id="approval-celebration-title" className="hub-celebration__kicker">
          Roger & Todd approved!
        </p>
        <p className="hub-celebration__message">{affirmation.message}</p>
        <div className="hub-celebration__signatures" aria-hidden>
          <span className="hub-celebration__sig hub-celebration__sig--roger">Roger ✓</span>
          <span className="hub-celebration__sig hub-celebration__sig--todd">Todd ✓</span>
        </div>
        <button type="button" onClick={onDismiss} className="hub-celebration__btn">
          {hasNextAsset ? "Love it — next asset →" : "Love it!"}
        </button>
      </div>
    </div>
  );
}
