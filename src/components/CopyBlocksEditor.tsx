"use client";

import type { CopyBlock } from "@/lib/mockups";

type CopyBlocksEditorProps = {
  blocks: CopyBlock[];
  onChange: (blocks: CopyBlock[]) => void;
};

export function CopyBlocksEditor({ blocks, onChange }: CopyBlocksEditorProps) {
  function updateBlock(index: number, patch: Partial<CopyBlock>) {
    onChange(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)));
  }

  function addBlock() {
    onChange([...blocks, { label: "Copy", value: "" }]);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="hub-copy-label !mb-0">Copy blocks</p>
        <button type="button" onClick={addBlock} className="text-xs font-medium text-hub-green-text hover:underline">
          + Add copy
        </button>
      </div>

      {blocks.map((block, index) => (
        <div key={index} className="rounded-xl border border-hub-border/80 bg-hub-cream/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <input
              value={block.label}
              onChange={(e) => updateBlock(index, { label: e.target.value })}
              placeholder="Label (e.g. Subject, Body)"
              className="hub-input !py-2 text-sm"
            />
            {blocks.length > 1 ? (
              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="shrink-0 text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            ) : null}
          </div>
          <textarea
            value={block.value}
            onChange={(e) => updateBlock(index, { value: e.target.value })}
            placeholder="Copy text"
            rows={block.label.toLowerCase().includes("body") ? 4 : 2}
            className="hub-textarea !py-2 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
