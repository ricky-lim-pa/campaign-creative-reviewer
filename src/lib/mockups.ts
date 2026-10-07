export type CopyBlock = {
  label: string;
  value: string;
};

export type MockupVersionCopySource = {
  copyBlocks?: string | null;
  subject?: string | null;
  preheader?: string | null;
  bodyCopy?: string | null;
  pushTitle?: string | null;
  pushBody?: string | null;
  cta?: string | null;
  notes?: string | null;
};

export function defaultCopyBlocksForType(type: string): CopyBlock[] {
  if (type === "email") {
    return [
      { label: "Subject", value: "" },
      { label: "Preheader", value: "" },
      { label: "Body", value: "" },
      { label: "CTA", value: "" },
    ];
  }
  if (type === "push") {
    return [
      { label: "Title", value: "" },
      { label: "Body", value: "" },
      { label: "CTA", value: "" },
    ];
  }
  if (type === "in-app") {
    return [
      { label: "Headline", value: "" },
      { label: "Body", value: "" },
      { label: "CTA", value: "" },
      { label: "Notes", value: "" },
    ];
  }
  return [{ label: "Copy", value: "" }];
}

export function parseCopyBlocks(raw: string | null | undefined): CopyBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CopyBlock[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((block) => block.label?.trim() || block.value?.trim());
  } catch {
    return [];
  }
}

export function copyBlocksFromLegacy(version: MockupVersionCopySource): CopyBlock[] {
  const parsed = parseCopyBlocks(version.copyBlocks);
  if (parsed.length > 0) return parsed;

  const blocks: CopyBlock[] = [];
  if (version.subject) blocks.push({ label: "Subject", value: version.subject });
  if (version.preheader) blocks.push({ label: "Preheader", value: version.preheader });
  if (version.bodyCopy) blocks.push({ label: "Body", value: version.bodyCopy });
  if (version.pushTitle) blocks.push({ label: "Title", value: version.pushTitle });
  if (version.pushBody) blocks.push({ label: "Body", value: version.pushBody });
  if (version.cta) blocks.push({ label: "CTA", value: version.cta });
  if (version.notes) blocks.push({ label: "Notes", value: version.notes });
  return blocks;
}

export function resolveCopyBlocks(version: MockupVersionCopySource): CopyBlock[] {
  return copyBlocksFromLegacy(version).filter((block) => block.value.trim());
}

const EMAIL_REVIEW_LABELS = ["subject", "preheader", "pv", "preview"];

function labelMatchesReview(label: string, candidates: string[]) {
  const normalized = label.trim().toLowerCase();
  return candidates.some(
    (candidate) => normalized === candidate || normalized.includes(candidate)
  );
}

/** Copy fields shown during exec review — email gets subject + PV; push gets all copy. */
export function reviewCopyBlocksForType(type: string, blocks: CopyBlock[]): CopyBlock[] {
  if (type === "email") {
    const ordered: CopyBlock[] = [];
    for (const candidate of ["Subject", "Preheader", "PV", "Preview"]) {
      const match = blocks.find((block) => block.label.trim().toLowerCase() === candidate.toLowerCase());
      if (match) ordered.push(match);
    }
    const extras = blocks.filter(
      (block) =>
        labelMatchesReview(block.label, EMAIL_REVIEW_LABELS) &&
        !ordered.some((entry) => entry.label === block.label)
    );
    return [...ordered, ...extras];
  }
  if (type === "push") return blocks;
  return [];
}

export function hasReviewCopy(type: string, _blocks: CopyBlock[]) {
  return type === "email" || type === "push";
}

function blockValue(blocks: CopyBlock[], ...labels: string[]) {
  for (const label of labels) {
    const match = blocks.find(
      (block) => block.label.trim().toLowerCase() === label.toLowerCase()
    );
    if (match?.value.trim()) return match.value.trim();
  }
  return null;
}

export function legacyFieldsFromCopyBlocks(blocks: CopyBlock[]) {
  return {
    subject: blockValue(blocks, "Subject"),
    preheader: blockValue(blocks, "Preheader"),
    bodyCopy:
      blockValue(blocks, "Body", "Headline", "Headline / copy") ??
      blockValue(blocks, "Copy"),
    pushTitle: blockValue(blocks, "Title", "Push title"),
    pushBody: blockValue(blocks, "Push body", "Body"),
    cta: blockValue(blocks, "CTA"),
    notes: blockValue(blocks, "Notes"),
  };
}

export function sanitizeCopyBlocks(blocks: CopyBlock[]): CopyBlock[] {
  return blocks
    .map((block) => ({
      label: block.label.trim(),
      value: block.value.trim(),
    }))
    .filter((block) => block.label || block.value);
}

export function serializeCopyBlocks(blocks: CopyBlock[]) {
  return JSON.stringify(sanitizeCopyBlocks(blocks));
}

export function labelFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export function supportsMultipleAssets(type: string) {
  return type === "email" || type === "in-app";
}

export function mockupDisplayTitle(
  type: string,
  label: string | null | undefined,
  typeLabel: string
) {
  const trimmed = label?.trim();
  if (trimmed) return trimmed;
  return typeLabel;
}

export function hasMockupLabel(label: string | null | undefined) {
  return Boolean(label?.trim());
}

export function groupMockupsByType<T extends { type: string; sortOrder: number }>(mockups: T[]) {
  const groups = new Map<string, T[]>();
  for (const mockup of [...mockups].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const list = groups.get(mockup.type) ?? [];
    list.push(mockup);
    groups.set(mockup.type, list);
  }
  return groups;
}
