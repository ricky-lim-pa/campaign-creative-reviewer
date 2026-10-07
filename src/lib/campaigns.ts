/** Map spreadsheet app codes to hub app IDs */
export function mapSpreadsheetApp(code: string): string {
  const c = code.trim().toUpperCase();
  switch (c) {
    case "ALL":
      return "all";
    case "FP":
    case "FP+FG":
      return "freeprints";
    case "PB":
      return "photo-books";
    case "PT":
      return "photo-tiles";
    case "FPA":
      return "photo-art";
    case "FC":
      return "cards-uk";
    case "INK":
      return "ink";
    case "FG":
      return "freeprints";
    case "MY DEALS":
      return "freeprints";
    default:
      return "freeprints";
  }
}

export function campaignOverlapsMonth(
  campaign: { startDate: Date | string; endDate: Date | string },
  monthNum: number,
  year: number
) {
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  return start <= monthEnd && end >= monthStart;
}

export type TimelineMonth = {
  id: string;
  label: string;
  fullLabel: string;
  month: number;
  year: number;
};

export const Q4_TIMELINE_MONTHS: TimelineMonth[] = [
  { id: "2026-09", label: "Sep", fullLabel: "September 2026", month: 9, year: 2026 },
  { id: "2026-10", label: "Oct", fullLabel: "October 2026", month: 10, year: 2026 },
  { id: "2026-11", label: "Nov", fullLabel: "November 2026", month: 11, year: 2026 },
  { id: "2026-12", label: "Dec", fullLabel: "December 2026", month: 12, year: 2026 },
  { id: "2027-01", label: "Jan", fullLabel: "January 2027", month: 1, year: 2027 },
];

export type CalendarCampaign = {
  id: string;
  appId: string;
  title: string;
  region: string;
  startDate: string;
  endDate: string;
  approvedCount: number;
  totalAssets: number;
  fullyApproved: boolean;
};

/** Position a campaign bar on a timeline from rangeStart to rangeEnd (inclusive days). */
export function campaignBarPosition(
  campaign: { startDate: Date | string; endDate: Date | string },
  rangeStart: Date,
  rangeEnd: Date
) {
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime() + 86_400_000;
  if (totalMs <= 0) return { left: 0, width: 100 };

  const clampedStart = Math.max(start.getTime(), rangeStart.getTime());
  const clampedEnd = Math.min(end.getTime(), rangeEnd.getTime());
  const left = ((clampedStart - rangeStart.getTime()) / totalMs) * 100;
  const width = Math.max(((clampedEnd - clampedStart) / totalMs) * 100 + (86_400_000 / totalMs) * 100, 1.5);

  return {
    left: Math.min(Math.max(left, 0), 99),
    width: Math.min(width, 100 - left),
  };
}

export function monthRange(month: TimelineMonth) {
  const start = new Date(month.year, month.month - 1, 1);
  const end = new Date(month.year, month.month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function fullTimelineRange() {
  const first = Q4_TIMELINE_MONTHS[0];
  const last = Q4_TIMELINE_MONTHS[Q4_TIMELINE_MONTHS.length - 1];
  return {
    start: monthRange(first).start,
    end: monthRange(last).end,
  };
}

export function campaignsInMonth(campaigns: CalendarCampaign[], month: TimelineMonth) {
  return campaigns.filter((c) => campaignOverlapsMonth(c, month.month, month.year));
}

export function countCampaignsByMonth(campaigns: CalendarCampaign[]) {
  return Object.fromEntries(
    Q4_TIMELINE_MONTHS.map((m) => [m.id, campaignsInMonth(campaigns, m).length])
  );
}

export type CampaignResourceLinks = {
  reportUrl?: string | null;
  confluenceUrl?: string | null;
  basecampUrl?: string | null;
};

export const CAMPAIGN_LINK_FIELDS = [
  { key: "reportUrl" as const, label: "Report URL", shortLabel: "Report" },
  { key: "confluenceUrl" as const, label: "Confluence page", shortLabel: "Confluence" },
  { key: "basecampUrl" as const, label: "Basecamp job", shortLabel: "Basecamp" },
];

export { getSettingsBaseUrl } from "./db";
