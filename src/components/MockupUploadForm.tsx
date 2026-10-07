"use client";

import { useRef, useState } from "react";
import { CopyBlocksEditor } from "@/components/CopyBlocksEditor";
import {
  defaultCopyBlocksForType,
  serializeCopyBlocks,
  type CopyBlock,
} from "@/lib/mockups";

type MockupUploadFormProps = {
  mockupId: string;
  mockupType: string;
  mockupLabel?: string;
  nextVersion: number;
  loading: boolean;
  onSubmit: (form: HTMLFormElement) => Promise<void>;
  onCancel: () => void;
};

export function MockupUploadForm({
  mockupId,
  mockupType,
  mockupLabel,
  nextVersion,
  loading,
  onSubmit,
  onCancel,
}: MockupUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [copyBlocks, setCopyBlocks] = useState<CopyBlock[]>(
    defaultCopyBlocksForType(mockupType)
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(e.target.files ?? []));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    await onSubmit(formRef.current);
    setSelectedFiles([]);
    setCopyBlocks(defaultCopyBlocksForType(mockupType));
  }

  const lastVersion = nextVersion + Math.max(selectedFiles.length - 1, 0);
  const createsSeparateAssets =
    selectedFiles.length > 1 && (mockupType === "email" || mockupType === "in-app");
  const versionLabel = createsSeparateAssets
    ? `${selectedFiles.length} assets`
    : selectedFiles.length <= 1
      ? `v${nextVersion}`
      : `v${nextVersion}–v${lastVersion}`;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="hub-card-bordered space-y-3 p-4"
    >
      <div>
        <p className="text-sm font-semibold text-hub-ink">
          {mockupLabel ? `${mockupLabel} · ` : ""}
          Upload{" "}
          {selectedFiles.length > 1 &&
          (mockupType === "email" || mockupType === "in-app")
            ? "assets"
            : selectedFiles.length > 1
              ? "versions"
              : "new version"}{" "}
          ({versionLabel})
        </p>
        <p className="mt-1 text-xs text-hub-muted">
          {mockupType === "email" || mockupType === "in-app"
            ? "Select multiple images to create separate review assets. One file updates this asset; multiple files each become their own item to review."
            : "Add one or more images. Multiple files become separate versions with the same copy below."}
        </p>
      </div>

      <input
        type="file"
        name="files"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-hub-green file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--hub-green-dark)]"
      />

      {selectedFiles.length > 0 ? (
        <ul className="rounded-xl border border-hub-border/80 bg-hub-cream/50 px-3 py-2 text-sm">
          {selectedFiles.map((file) => (
            <li key={`${file.name}-${file.lastModified}`} className="py-1 text-hub-ink">
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}

      <CopyBlocksEditor blocks={copyBlocks} onChange={setCopyBlocks} />

      <input type="hidden" name="mockupId" value={mockupId} />
      <input type="hidden" name="copyBlocks" value={serializeCopyBlocks(copyBlocks)} readOnly />

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className="hub-btn-primary">
          {loading
            ? "Uploading..."
            : selectedFiles.length > 1
              ? mockupType === "email" || mockupType === "in-app"
                ? `Create ${selectedFiles.length} assets`
                : `Upload ${selectedFiles.length} files`
              : selectedFiles.length === 1
                ? "Save version"
                : "Save copy only"}
        </button>
        <button type="button" onClick={onCancel} className="hub-btn">
          Cancel
        </button>
      </div>
    </form>
  );
}
