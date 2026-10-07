import { CAMPAIGN_LINK_FIELDS, type CampaignResourceLinks as Links } from "@/lib/campaigns";
import { formatDate } from "@/lib/apps";

export function CampaignResourceLinks({
  links,
  className = "",
}: {
  links: Links;
  className?: string;
}) {
  const items = CAMPAIGN_LINK_FIELDS.filter(({ key }) => links[key]?.trim());

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map(({ key, shortLabel }) => (
        <a
          key={key}
          href={links[key]!}
          target="_blank"
          rel="noopener noreferrer"
          className="hub-btn !py-1.5 !text-xs"
          title={links[key]!}
        >
          {shortLabel} ↗
        </a>
      ))}
    </div>
  );
}

export function CampaignMeta({
  region,
  startDate,
  endDate,
  eventLabel,
  notes,
  layout = "grid",
}: {
  region?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  eventLabel?: string | null;
  notes?: string | null;
  layout?: "grid" | "stack";
}) {
  const gridClass =
    layout === "stack"
      ? "grid gap-3 sm:grid-cols-1"
      : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-3">
      <dl className={gridClass}>
        {eventLabel ? (
          <div>
            <dt className="hub-copy-label mb-1">Event</dt>
            <dd className="font-medium text-hub-ink">{eventLabel}</dd>
          </div>
        ) : null}
        <div className={eventLabel ? "" : "sm:col-span-2 lg:col-span-2"}>
          <dt className="hub-copy-label mb-1">Region</dt>
          <dd className="font-medium leading-relaxed text-hub-ink">{region || "—"}</dd>
        </div>
        <div>
          <dt className="hub-copy-label mb-1">Start date</dt>
          <dd className="font-medium text-hub-ink">{formatDate(startDate)}</dd>
        </div>
        <div>
          <dt className="hub-copy-label mb-1">End date</dt>
          <dd className="font-medium text-hub-ink">{formatDate(endDate)}</dd>
        </div>
      </dl>
      {notes ? (
        <div>
          <p className="hub-copy-label mb-1">Notes</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-hub-muted">{notes}</p>
        </div>
      ) : null}
    </div>
  );
}
