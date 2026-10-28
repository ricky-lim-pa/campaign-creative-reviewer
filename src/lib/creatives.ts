function regionTokens(label: string | null | undefined) {
  return (label || "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

export function isUkCreative(label: string | null | undefined) {
  return regionTokens(label).includes("UK");
}

export function isEuOnlyCreative(label: string | null | undefined) {
  const tokens = regionTokens(label);
  return tokens.includes("EU") && !tokens.includes("UK");
}

/** UK creative stands in for EU. EU-only assets stay hidden from approval when a UK asset exists. */
export function mockupsForApproval<T extends { label?: string | null }>(mockups: T[]) {
  if (!mockups.some((mockup) => isUkCreative(mockup.label))) return mockups;
  return mockups.filter((mockup) => !isEuOnlyCreative(mockup.label));
}
