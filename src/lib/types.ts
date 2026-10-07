export type ReportLink = {
  label: string;
  url: string;
};

export function parseReportUrls(json: string): ReportLink[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function stringifyReportUrls(links: ReportLink[]): string {
  return JSON.stringify(links);
}
