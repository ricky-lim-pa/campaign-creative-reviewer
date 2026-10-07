type MockupWithVersions = {
  versions: Array<{
    approval: {
      rogerApproved: boolean;
      toddApproved: boolean;
      approved: boolean;
    } | null;
  }>;
};

export function getApprovalStats(mockups: MockupWithVersions[]) {
  let total = 0;
  let approved = 0;

  for (const mockup of mockups) {
    const latest = mockup.versions[0];
    if (!latest) continue;
    total += 1;
    if (latest.approval?.approved) approved += 1;
  }

  return { total, approved };
}
