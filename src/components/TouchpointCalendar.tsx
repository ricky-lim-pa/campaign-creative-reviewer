"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApp } from "@/lib/apps";
import { getReviewDate } from "@/lib/campaigns";
import styles from "./TouchpointCalendar.module.css";

const months = ["October", "November", "December"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const kinds = {
  email: "Email",
  push: "Push",
  sms: "SMS",
  asset: "Creative",
  launch: "Campaign launch",
  end: "Campaign end",
} as const;

type Channel = keyof typeof kinds;
type Filter = "all" | "email" | "push" | "sms" | "asset" | "campaign";

export type CalendarEntry = {
  id: string;
  date: string;
  channel: Channel;
  app: string;
  title: string;
  audience?: string;
  warm?: boolean;
  href?: string;
};

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All touchpoints" },
  { id: "email", label: "Emails" },
  { id: "push", label: "Pushes" },
  { id: "sms", label: "SMS" },
  { id: "asset", label: "Creative" },
  { id: "campaign", label: "Campaign dates" },
];

function appName(app: string) {
  if (app === "freeprints-gifts") return "FreePrints Gifts";
  if (app === "my-deals") return "My Deals";
  return getApp(app)?.shortName ?? app;
}

const isMilestone = (channel: Channel) => channel === "launch" || channel === "end";
const monthKey = (month: number) => `2026-${month}`;
const dayKey = (month: number, day: number) => `${monthKey(month)}-${String(day).padStart(2, "0")}`;
const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });

function calendarDays(month: number) {
  const start = new Date(Date.UTC(2026, month - 1, 1));
  const padding = (start.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(2026, month, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((padding + count) / 7) * 7 }, (_, i) => {
    const day = i - padding + 1;
    return day >= 1 && day <= count ? day : null;
  });
}

export function TouchpointCalendar({ entries }: { entries: CalendarEntry[] }) {
  const [month, setMonth] = useState(11);
  const [selected, setSelected] = useState(dayKey(11, 1));
  const [today, setToday] = useState<string | null>(null);
  const [app, setApp] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const date = getReviewDate();
    setToday(date);
    if (/^2026-(10|11|12)-/.test(date)) {
      setMonth(Number(date.slice(5, 7)));
      setSelected(date);
    } else {
      const firstMonth = date < "2026-10-01" ? 10 : 12;
      setMonth(firstMonth);
      setSelected(dayKey(firstMonth, 1));
    }
  }, []);

  const apps = useMemo(() => [...new Set(entries.map((entry) => entry.app))]
    .filter((value) => value !== "all").sort((a, b) => appName(a).localeCompare(appName(b))), [entries]);

  const monthEntries = entries.filter((entry) => entry.date.startsWith(monthKey(month)) && (app === "all" || entry.app === app));
  const visible = monthEntries.filter((entry) => filter === "all" || (filter === "campaign" ? isMilestone(entry.channel) : entry.channel === filter));
  const byDate = new Map<string, CalendarEntry[]>();
  for (const entry of visible) {
    const day = byDate.get(entry.date) ?? [];
    day.push(entry);
    byDate.set(entry.date, day);
  }
  const agenda = byDate.get(selected) ?? [];
  const monthName = months[month - 10];

  function changeMonth(next: number) {
    setMonth(next);
    setSelected(today?.startsWith(monthKey(next)) ? today : dayKey(next, 1));
  }

  return (
    <div className={styles.calendar}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Q4 2026 · Campaign creative review</p>
          <h1>Touchpoint calendar</h1>
          <p className={styles.lede}>See what goes out each day, across apps and markets.</p>
        </div>
        <div className={styles.stats} aria-label={`${monthName} touchpoint totals`}>
          {([
            ["Emails", monthEntries.filter((e) => e.channel === "email").length],
            ["Pushes", monthEntries.filter((e) => e.channel === "push").length],
            ["Launches", monthEntries.filter((e) => e.channel === "launch").length],
          ] as const).map(([label, count]) => <div key={label}><strong>{count}</strong><span>{label}</span></div>)}
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.months} role="group" aria-label="Month">
          {months.map((label, index) => <button key={label} type="button" aria-pressed={month === index + 10}
            onClick={() => changeMonth(index + 10)}>{label}</button>)}
        </div>
        <label className={styles.appFilter}>
          <span>App</span>
          <select aria-label="Filter by app" value={app} onChange={(event) => setApp(event.target.value)}>
            <option value="all">All apps</option>
            {apps.map((value) => <option key={value} value={value}>{appName(value)}</option>)}
          </select>
        </label>
      </div>

      <div role="group" aria-label="Touchpoint type" className={styles.filters}>
        {filters.filter(({ id }) => id === "all" || id === "campaign" || entries.some((entry) => entry.channel === id))
          .map(({ id, label }) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {id !== "all" && <span className={styles.dot} data-channel={id === "campaign" ? "launch" : id} />}{label}
          </button>)}
      </div>

      <div className={styles.layout}>
        <section className={styles.monthCard} aria-label={`${monthName} 2026 calendar`}>
          <div className={styles.cardHeading}>
            <h2>{monthName} <span>2026</span></h2>
            <p>{visible.length} {visible.length === 1 ? "item" : "items"}</p>
          </div>
          <div className={styles.grid}>
            {weekdays.map((label) => <div key={label} className={styles.weekday}>{label}</div>)}
            {calendarDays(month).map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className={styles.blank} aria-hidden="true" />;
              const date = dayKey(month, day);
              const events = byDate.get(date) ?? [];
              return (
                <button key={date} type="button" className={styles.day} aria-pressed={selected === date}
                  aria-current={today === date ? "date" : undefined}
                  aria-label={`${monthName} ${day}, ${events.length} scheduled items`}
                  onClick={() => setSelected(date)}>
                  <span className={styles.dayHeading}><span>{day}</span>{today === date && <span className={styles.today}>Today</span>}</span>
                  <span className={styles.dayEvents} aria-hidden="true">
                    {events.slice(0, 2).map((entry) => <span key={entry.id} className={styles.event} data-channel={entry.channel}>
                      <span className={styles.dot} data-channel={entry.channel} />
                      <span>{entry.title}</span>
                    </span>)}
                    {events.length > 2 && <span className={styles.more}>+{events.length - 2} more</span>}
                  </span>
                  {events.length > 0 && <span className={styles.mobileCount} aria-hidden="true">{events.length}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className={styles.agenda} aria-label="Selected day agenda">
          <div className={styles.agendaHeading} aria-live="polite">
            <p className={styles.eyebrow}>Day agenda</p>
            <h2>{dayFormatter.format(new Date(`${selected}T12:00:00Z`))}</h2>
            <p>{agenda.length} scheduled {agenda.length === 1 ? "item" : "items"}</p>
          </div>
          {agenda.length === 0 ? <p className={styles.empty}>Nothing scheduled for this day with the current filters.</p> : (
            <ul className={styles.agendaList}>
              {agenda.map((entry) => (
                <li key={entry.id} className={styles.agendaItem}>
                  <div className={styles.badges}>
                    <span className={styles.kind} data-channel={entry.channel}>{kinds[entry.channel]}</span>
                    <span>{appName(entry.app)}</span>{entry.warm && <span>Warm</span>}
                  </div>
                  {entry.href ? <Link href={entry.href}>{entry.title}</Link> : <strong>{entry.title}</strong>}
                  {entry.audience && <p>{entry.audience}</p>}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      <p className={styles.source}>
        Sends and creative dates are a snapshot from the <a href="https://promo-calendar.proto.planetart.com/">touchpoint prototype</a>.
        {" "}Launch and end dates come from the campaign reviewer.
        {" "}<a href="https://planetart-my.sharepoint.com/:x:/r/personal/adriana_planetart_com/_layouts/15/doc2.aspx?sourcedoc=%7BE87A5C93-6FD1-437D-AD6B-F6C8AFB64F90%7D&file=Touchpoint%20Calendar%202026-2025.xlsx">Open the live workbook</a>.
      </p>
    </div>
  );
}
