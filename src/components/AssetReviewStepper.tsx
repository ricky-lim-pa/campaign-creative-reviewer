"use client";

import { getMockupTypeLabel } from "@/lib/apps";
import { mockupDisplayTitle } from "@/lib/mockups";

type AssetReviewStepperProps = {
  steps: Array<{ id: string; type: string; label: string; approved: boolean }>;
  currentIndex: number;
  onSelect: (index: number) => void;
};

function stepState(approved: boolean, index: number, currentIndex: number) {
  if (approved) return "done";
  if (index === currentIndex) return "active";
  if (index < currentIndex) return "incomplete";
  return "upcoming";
}

export function AssetReviewStepper({ steps, currentIndex, onSelect }: AssetReviewStepperProps) {
  return (
    <nav className="hub-stepper" aria-label="Asset review progress">
      <ol className="hub-stepper__track">
        {steps.map((step, index) => {
          const state = stepState(step.approved, index, currentIndex);
          const itemType = getMockupTypeLabel(step.type);
          const itemTitle = mockupDisplayTitle(step.type, step.label, itemType);
          const connectorFilled = step.approved;

          return (
            <li key={step.id} className="hub-stepper__segment">
              <button
                type="button"
                onClick={() => onSelect(index)}
                className={`hub-stepper__ball hub-stepper__ball--${state}`}
                aria-label={`Asset ${index + 1}: ${itemTitle}${step.approved ? ", approved" : ""}`}
                aria-current={index === currentIndex ? "step" : undefined}
              >
                {state === "done" ? (
                  <span className="hub-stepper__check" aria-hidden>
                    ✓
                  </span>
                ) : (
                  <span className="hub-stepper__num" aria-hidden>
                    {index + 1}
                  </span>
                )}
              </button>
              {index < steps.length - 1 ? (
                <span
                  className={`hub-stepper__line ${connectorFilled ? "hub-stepper__line--filled" : ""}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="hub-stepper__caption">
        Asset {currentIndex + 1} of {steps.length}
      </p>
    </nav>
  );
}
