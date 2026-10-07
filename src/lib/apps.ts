export const APPS = [
  {
    id: "all",
    name: "All Apps",
    shortName: "All Apps",
    color: "#6366f1",
    website: "https://www.planetart.com",
    iconUrl:
      "https://cdn-cms.planetart.com/planetart/en_US/app_block__navigation/planetart-1720559646.svg",
  },
  {
    id: "freeprints",
    name: "FreePrints",
    shortName: "FreePrints",
    color: "#33cbcc",
    website: "https://www.freeprintsapp.com",
    iconUrl:
      "https://cdn-cms.planetart.com/freeprintsapp/appgroup/appgroup_block__meta_tags/freeprints-120x120-1702541878.png",
  },
  {
    id: "photo-books",
    name: "FreePrints Photo Books",
    shortName: "Photo Books",
    color: "#7c3aed",
    website: "https://www.freeprintsphotobooks.com",
    iconUrl:
      "https://cdn-cms.planetart.com/freeprints-photo-books/appgroup/appgroup_block__meta_tags/fppb-120x120-1726189332.png",
  },
  {
    id: "photo-tiles",
    name: "FreePrints Photo Tiles",
    shortName: "Photo Tiles",
    color: "#0891b2",
    website: "https://www.freeprintsphototiles.com",
    iconUrl:
      "https://cdn-cms.planetart.com/freeprints-photo-tiles/appgroup/appgroup_block__meta_tags/fpt-120x120-1725484518.png",
  },
  {
    id: "photo-art",
    name: "FreePrints Photo Art",
    shortName: "Photo Art",
    color: "#db2777",
    website: "https://www.freeprintsphotoart.com",
    iconUrl:
      "https://cdn-cms.planetart.com/freeprints-photo-art/appgroup/appgroup_block__meta_tags/apple-touch-icon-1730534452.png",
  },
  {
    id: "ink",
    name: "Ink",
    shortName: "Ink",
    color: "#ea580c",
    website: "https://www.sincerely.com",
    iconUrl:
      "https://cdn-cms.planetart.com/sincerely/appgroup/appgroup_block__meta_tags/favicon-128-1721521525.png",
  },
  {
    id: "cards-uk",
    name: "FreePrints Cards (UK)",
    shortName: "Cards UK",
    color: "#059669",
    website: "https://www.freeprintscards.co.uk",
    iconUrl:
      "https://cdn-cms.planetart.com/freeprints-cards/appgroup/appgroup_block__meta_tags/icon-120x120-1722410286.png",
  },
  {
    id: "photo-calendars",
    name: "Photo Calendars",
    shortName: "Calendars",
    color: "#ca8a04",
    website: "https://www.photocalendars.com",
    iconUrl:
      "https://cdn-cms.planetart.com/photocalendars/appgroup/appgroup_block__meta_tags/gc_apple-touch-icon-1721890480.png",
  },
  {
    id: "easy-tiles",
    name: "Easy Tiles",
    shortName: "Easy Tiles",
    color: "#64748b",
    website: "https://www.easytiles.com",
    iconUrl:
      "https://cdn-cms.planetart.com/easy_tiles/appgroup/appgroup_block__meta_tags/et_apple_touch-120x120-1722231191.png",
  },
] as const;

export type AppId = (typeof APPS)[number]["id"];

export const MOCKUP_TYPES = [
  { id: "email", label: "Email" },
  { id: "push", label: "Push" },
  { id: "in-app", label: "In-App" },
] as const;

export type MockupType = (typeof MOCKUP_TYPES)[number]["id"];

export function getApp(appId: string) {
  return APPS.find((a) => a.id === appId);
}

export function getMockupTypeLabel(type: string) {
  return MOCKUP_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateRange(start: Date | string, end: Date | string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(startDate);
  }
  return `${formatDateShort(startDate)} – ${formatDate(endDate)}`;
}
