"use client";

import { useRef, useState } from "react";
import { getMockupTypeLabel } from "@/lib/apps";
import { supportsMultipleAssets } from "@/lib/mockups";

type AddMockupControlsProps = {
  campaignId: string;
  onAdded: () => void;
};

export function AddMockupControls({ campaignId, onAdded }: AddMockupControlsProps) {
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [addingType, setAddingType] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  async function createMockup(type: string, assetLabel: string) {
    setLoading(true);
    await fetch("/api/mockups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, type, label: assetLabel }),
    });
    setLoading(false);
    setAddingType(null);
    setLabel("");
    onAdded();
  }

  async function bulkUpload(type: string, files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("campaignId", campaignId);
    formData.set("type", type);
    Array.from(files).forEach((file) => formData.append("files", file));
    const res = await fetch("/api/mockups/bulk", { method: "POST", body: formData });
    const data = res.ok ? await res.json() : null;
    setLoading(false);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
    await onAdded();
    return data;
  }

  const types = [
    { id: "email", label: "Email" },
    { id: "in-app", label: "In-App" },
    { id: "push", label: "Push" },
  ] as const;

  return (
    <div className="space-y-4">
      <input
        ref={bulkInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const type = e.target.dataset.type;
          if (type) bulkUpload(type, e.target.files);
        }}
      />

      {types.map((type) => (
        <div key={type.id} className="hub-card-bordered p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-hub-ink">{type.label} assets</p>
              <p className="text-xs text-hub-muted">
                {supportsMultipleAssets(type.id)
                  ? "Add multiple review items, each with its own image and copy."
                  : "Add a push notification asset."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setAddingType(type.id);
                  setLabel("");
                }}
                className="hub-btn"
              >
                + Add {type.label} asset
              </button>
              {supportsMultipleAssets(type.id) ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (bulkInputRef.current) {
                      bulkInputRef.current.dataset.type = type.id;
                      bulkInputRef.current.click();
                    }
                  }}
                  className="hub-btn-accent"
                >
                  Upload multiple {type.label.toLowerCase()} files
                </button>
              ) : null}
            </div>
          </div>

          {addingType === type.id ? (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                createMockup(type.id, label);
              }}
            >
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={`Label (e.g. ${type.id === "email" ? "Hero email" : "Home modal"})`}
                className="hub-input flex-1"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" disabled={loading || !label.trim()} className="hub-btn-primary">
                  Create
                </button>
                <button type="button" onClick={() => setAddingType(null)} className="hub-btn">
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function MockupSectionHeader({
  type,
  count,
}: {
  type: string;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-hub-border/70 pb-2">
      <h2 className="text-lg font-semibold tracking-humaan-tight text-hub-heading md:text-xl">
        {getMockupTypeLabel(type)}
      </h2>
      <p className="text-sm text-hub-muted">
        {count} item{count !== 1 ? "s" : ""} to review
      </p>
    </div>
  );
}
