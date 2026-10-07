"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NavBar, reviewNav } from "@/components/NavBar";
import { AppIcon } from "@/components/AppIcon";
import { CampaignMeta, CampaignResourceLinks } from "@/components/CampaignMeta";
import { getApp } from "@/lib/apps";
import { fetchCampaign } from "@/lib/publicPath";
import { parseReportUrls, type ReportLink } from "@/lib/types";

type KpiData = {
  reportLinks: ReportLink[];
  overallSales: string | null;
  yoyNotes: string | null;
  incrementalityNotes: string | null;
  analysisNotes: string | null;
};

type CampaignHeader = {
  title: string;
  eventLabel: string;
  region: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  reportUrl: string | null;
  confluenceUrl: string | null;
  basecampUrl: string | null;
};

export default function KpiPage() {
  const params = useParams<{ app: string; campaignId: string }>();
  const app = getApp(params.app);
  const [campaign, setCampaign] = useState<CampaignHeader | null>(null);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<KpiData>({
    reportLinks: [],
    overallSales: "",
    yoyNotes: "",
    incrementalityNotes: "",
    analysisNotes: "",
  });
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const load = useCallback(async () => {
    const camp = await fetchCampaign(params.campaignId);
    if (camp) {
      setCampaign({
        title: camp.title,
        eventLabel: camp.eventLabel,
        region: camp.region,
        startDate: camp.startDate,
        endDate: camp.endDate,
        notes: camp.notes,
        reportUrl: camp.reportUrl,
        confluenceUrl: camp.confluenceUrl,
        basecampUrl: camp.basecampUrl,
      });
      const reportLinks = parseReportUrls(camp.kpi?.reportUrls || "[]");
      setKpi({
        reportLinks,
        overallSales: camp.kpi?.overallSales ?? null,
        yoyNotes: camp.kpi?.yoyNotes ?? null,
        incrementalityNotes: camp.kpi?.incrementalityNotes ?? null,
        analysisNotes: camp.kpi?.analysisNotes ?? null,
      });
      setForm({
        reportLinks,
        overallSales: camp.kpi?.overallSales || "",
        yoyNotes: camp.kpi?.yoyNotes || "",
        incrementalityNotes: camp.kpi?.incrementalityNotes || "",
        analysisNotes: camp.kpi?.analysisNotes || "",
      });
    }
  }, [params.campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    await fetch(`/api/kpi/${params.campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditMode(false);
    load();
  }

  if (!app || !kpi || !campaign) return <p className="p-8 text-hub-muted">Loading...</p>;

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={reviewNav} badge="KPI Hub" />
      <main className="hub-container-narrow hub-main">
        <Link
          href={`/review/${params.app}/${params.campaignId}`}
          className="text-sm font-medium text-hub-muted hover:text-hub-ink"
        >
          ← Back to creative review
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <AppIcon appId={params.app} size={40} className="rounded-xl" />
          <p className="text-sm font-medium text-hub-muted">{app.name}</p>
        </div>
        <h1 className="hub-display-sm mt-3">{campaign.title}</h1>
        <p className="mt-2 text-hub-muted">Performance data and report links</p>

        <div className="mt-5 hub-card-bordered p-4">
          <CampaignMeta
            eventLabel={campaign.eventLabel}
            region={campaign.region}
            startDate={campaign.startDate}
            endDate={campaign.endDate}
            notes={campaign.notes}
            layout="stack"
          />
          <CampaignResourceLinks
            className="mt-4"
            links={{
              reportUrl: campaign.reportUrl,
              confluenceUrl: campaign.confluenceUrl,
              basecampUrl: campaign.basecampUrl,
            }}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={() => setEditMode(!editMode)} className="hub-btn">
            {editMode ? "Cancel" : "Edit KPI data"}
          </button>
          {editMode && (
            <button type="button" onClick={save} className="hub-btn-primary">
              Save
            </button>
          )}
        </div>

        <div className="mt-8 space-y-5">
          <section className="hub-card-bordered p-6">
            <h2 className="font-semibold text-hub-ink">Report links</h2>
            {editMode ? (
              <div className="mt-4 space-y-3">
                {form.reportLinks.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={link.label}
                      onChange={(e) => {
                        const links = [...form.reportLinks];
                        links[i] = { ...links[i], label: e.target.value };
                        setForm({ ...form, reportLinks: links });
                      }}
                      placeholder="Label"
                      className="hub-input flex-1"
                    />
                    <input
                      value={link.url}
                      onChange={(e) => {
                        const links = [...form.reportLinks];
                        links[i] = { ...links[i], url: e.target.value };
                        setForm({ ...form, reportLinks: links });
                      }}
                      placeholder="URL"
                      className="hub-input flex-[2]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          reportLinks: form.reportLinks.filter((_, j) => j !== i),
                        })
                      }
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={newLink.label}
                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                    placeholder="New label"
                    className="hub-input flex-1"
                  />
                  <input
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="New URL"
                    className="hub-input flex-[2]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newLink.label && newLink.url) {
                        setForm({
                          ...form,
                          reportLinks: [...form.reportLinks, newLink],
                        });
                        setNewLink({ label: "", url: "" });
                      }
                    }}
                    className="hub-btn"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : kpi.reportLinks.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {kpi.reportLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-hub-ink hover:underline"
                      title={link.url}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-hub-muted">No report links added yet.</p>
            )}
          </section>

          {[
            { key: "overallSales" as const, label: "Overall sales", rows: 2 },
            { key: "yoyNotes" as const, label: "YoY comparison notes", rows: 3 },
            { key: "incrementalityNotes" as const, label: "Incrementality notes", rows: 3 },
            { key: "analysisNotes" as const, label: "Analysis notes", rows: 4 },
          ].map(({ key, label, rows }) => (
            <section key={key} className="hub-card-bordered p-6">
              <h2 className="font-semibold text-hub-ink">{label}</h2>
              {editMode ? (
                <textarea
                  value={form[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  rows={rows}
                  className="hub-textarea mt-3"
                />
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-hub-muted">
                  {kpi[key] || "—"}
                </p>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
