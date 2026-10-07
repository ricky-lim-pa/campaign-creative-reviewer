"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { CampaignListTable } from "@/components/CampaignListTable";
import { APPS, formatDate, getApp } from "@/lib/apps";
import {
  type CalendarCampaign,
  Q4_TIMELINE_MONTHS,
  campaignBarPosition,
  campaignsInMonth,
  countCampaignsByMonth,
  fullTimelineRange,
  monthRange,
} from "@/lib/campaigns";

type CalendarViewProps = {
  campaigns: CalendarCampaign[];
};

export function CalendarView({ campaigns }: CalendarViewProps) {
  const [selectedMonthId, setSelectedMonthId] = useState<string>("all");
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => countCampaignsByMonth(campaigns), [campaigns]);
  const selectedMonth = Q4_TIMELINE_MONTHS.find((m) => m.id === selectedMonthId);

  const visibleCampaigns = useMemo(() => {
    if (selectedMonthId === "all") return campaigns;
    const month = Q4_TIMELINE_MONTHS.find((m) => m.id === selectedMonthId);
    if (!month) return campaigns;
    return campaignsInMonth(campaigns, month);
  }, [campaigns, selectedMonthId]);

  const range = useMemo(() => {
    if (selectedMonth) return monthRange(selectedMonth);
    return fullTimelineRange();
  }, [selectedMonth]);

  function selectMonth(id: string) {
    setSelectedMonthId(id);
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const rangeLabel = selectedMonth ? selectedMonth.fullLabel : "September 2026 through January 2027";

  return (
    <div className="space-y-6">
      <section className="hub-calendar-panel">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="hub-copy-label">Timeline</p>
            <h2 className="text-xl font-semibold text-hub-heading md:text-2xl">{rangeLabel}</h2>
            <p className="mt-1 text-sm text-hub-muted">
              {visibleCampaigns.length} campaign{visibleCampaigns.length !== 1 ? "s" : ""}
              {selectedMonth ? " in this month" : " across the season"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => selectMonth("all")}
            className={`hub-calendar-pill ${selectedMonthId === "all" ? "hub-calendar-pill--active" : ""}`}
          >
            Full season
          </button>
        </div>

        <div className="hub-calendar-months">
          {Q4_TIMELINE_MONTHS.map((month) => (
            <button
              key={month.id}
              type="button"
              onClick={() => selectMonth(month.id)}
              className={`hub-calendar-month ${selectedMonthId === month.id ? "hub-calendar-month--active" : ""}`}
              aria-pressed={selectedMonthId === month.id}
            >
              <span className="hub-calendar-month__label">{month.label}</span>
              <span className="hub-calendar-month__year">{month.year}</span>
              <span className="hub-calendar-month__count">{counts[month.id]}</span>
            </button>
          ))}
        </div>

        <div className="hub-calendar-density" aria-hidden>
          {Q4_TIMELINE_MONTHS.map((month) => {
            const count = counts[month.id];
            const max = Math.max(...Object.values(counts), 1);
            const height = Math.max(12, (count / max) * 100);
            return (
              <button
                key={month.id}
                type="button"
                onClick={() => selectMonth(month.id)}
                className={`hub-calendar-density__col ${selectedMonthId === month.id ? "hub-calendar-density__col--active" : ""}`}
                title={`${month.fullLabel}: ${count} campaigns`}
              >
                <span className="hub-calendar-density__bar" style={{ height: `${height}%` }} />
                <span className="hub-calendar-density__label">{month.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hub-calendar-panel">
        <p className="hub-copy-label mb-4">Campaign spans</p>
        <div className="hub-calendar-gantt">
          <div className="hub-calendar-gantt__axis">
            {selectedMonth ? (
              <>
                <span>Day 1</span>
                <span>Mid-month</span>
                <span>Day {range.end.getDate()}</span>
              </>
            ) : (
              Q4_TIMELINE_MONTHS.map((m) => <span key={m.id}>{m.fullLabel}</span>)
            )}
          </div>
          <div className="hub-calendar-gantt__track">
            {visibleCampaigns.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-hub-muted">
                No campaigns in this period.
              </p>
            ) : (
              visibleCampaigns.map((campaign) => {
                const app = getApp(campaign.appId);
                const pos = campaignBarPosition(campaign, range.start, range.end);
                return (
                  <Link
                    key={campaign.id}
                    href={`/review/${campaign.appId}/${campaign.id}`}
                    className="hub-calendar-gantt__card group"
                  >
                    <div className="hub-calendar-gantt__card-head">
                      <AppIcon appId={campaign.appId} size={24} className="shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold leading-snug text-hub-heading group-hover:text-hub-green-text">
                            {campaign.title}
                          </p>
                          {campaign.fullyApproved ? (
                            <span className="hub-tag hub-tag--approved">Approved</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-hub-muted">
                          <span className="font-medium text-hub-ink">{app?.shortName}</span>
                          {campaign.region ? (
                            <>
                              {" "}
                              <span className="text-hub-soft">|</span> Region: {campaign.region}
                            </>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-hub-muted">
                          {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="hub-calendar-gantt__bar-wrap">
                      <span
                        className="hub-calendar-gantt__bar"
                        style={{
                          left: `${pos.left}%`,
                          width: `${pos.width}%`,
                          backgroundColor: app?.color ?? "#33cbcc",
                        }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section ref={listRef} className="scroll-mt-28">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="hub-copy-label">Campaign list</p>
          {selectedMonth && (
            <button
              type="button"
              onClick={() => selectMonth("all")}
              className="text-xs font-medium text-hub-green-text hover:underline"
            >
              Show full season
            </button>
          )}
        </div>

        <CampaignListTable
          rows={visibleCampaigns}
          linkPattern="review-any"
          linkLabel="Review"
          showReviewStatus
        />
      </section>

      <section className="hub-calendar-legend">
        <p className="hub-copy-label mb-3">Apps</p>
        <div className="flex flex-wrap gap-3">
          {APPS.filter((a) => a.id !== "all").map((app) => (
            <div key={app.id} className="hub-calendar-legend__item">
              <AppIcon appId={app.id} size={20} className="rounded-md" />
              <span>{app.shortName}</span>
              <span
                className="hub-calendar-legend__dot"
                style={{ backgroundColor: app.color }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
