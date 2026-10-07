"use client";

import { useState } from "react";
import { APPS } from "@/lib/apps";
import { CampaignMeta, CampaignResourceLinks } from "@/components/CampaignMeta";

type CampaignMetaFormProps = {
  campaign: {
    id: string;
    appId: string;
    title: string;
    eventLabel: string;
    region: string;
    startDate: string;
    endDate: string;
    quarter: string;
    notes: string | null;
    reportUrl: string | null;
    confluenceUrl: string | null;
    basecampUrl: string | null;
  };
  onSaved: () => void;
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function CampaignMetaForm({ campaign, onSaved }: CampaignMetaFormProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    appId: campaign.appId,
    title: campaign.title,
    eventLabel: campaign.eventLabel || "",
    region: campaign.region || "",
    startDate: toDateInput(campaign.startDate),
    endDate: toDateInput(campaign.endDate),
    quarter: campaign.quarter,
    notes: campaign.notes || "",
    reportUrl: campaign.reportUrl || "",
    confluenceUrl: campaign.confluenceUrl || "",
    basecampUrl: campaign.basecampUrl || "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setEditing(false);
    onSaved();
  }

  if (!editing) {
    return (
      <section className="hub-card-bordered mt-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="hub-copy-label">Campaign details</p>
            <div className="mt-3">
              <CampaignMeta
                eventLabel={campaign.eventLabel}
                region={campaign.region}
                startDate={campaign.startDate}
                endDate={campaign.endDate}
                notes={campaign.notes}
              />
            </div>
            <CampaignResourceLinks
              className="mt-4"
              links={{
                reportUrl: campaign.reportUrl,
                confluenceUrl: campaign.confluenceUrl,
                basecampUrl: campaign.basecampUrl,
              }}
            />
          </div>
          <button type="button" onClick={() => setEditing(true)} className="hub-btn shrink-0">
            Edit details
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={save} className="hub-card-bordered mt-4 space-y-4 p-4">
      <p className="font-semibold text-hub-ink">Edit campaign details</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-hub-ink">App</label>
          <select
            value={form.appId}
            onChange={(e) => setForm({ ...form, appId: e.target.value })}
            className="hub-input mt-1"
          >
            {APPS.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-hub-ink">Event / season</label>
          <input
            value={form.eventLabel}
            onChange={(e) => setForm({ ...form, eventLabel: e.target.value })}
            placeholder="e.g. Black Friday"
            className="hub-input mt-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-hub-ink">Campaign title</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="hub-input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-hub-ink">Region</label>
        <input
          value={form.region}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
          placeholder="e.g. US, UK, FR"
          className="hub-input mt-1"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-hub-ink">Start date</label>
          <input
            required
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="hub-input mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-hub-ink">End date</label>
          <input
            required
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="hub-input mt-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-hub-ink">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="hub-textarea mt-1"
        />
      </div>

      <div className="border-t border-hub-border pt-4">
        <p className="mb-3 text-sm font-semibold text-hub-ink">Project links (shown in exec review)</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-hub-muted">Report URL</label>
            <input
              value={form.reportUrl}
              onChange={(e) => setForm({ ...form, reportUrl: e.target.value })}
              placeholder="https://..."
              className="hub-input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-hub-muted">Confluence page</label>
            <input
              value={form.confluenceUrl}
              onChange={(e) => setForm({ ...form, confluenceUrl: e.target.value })}
              placeholder="https://..."
              className="hub-input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-hub-muted">Basecamp job</label>
            <input
              value={form.basecampUrl}
              onChange={(e) => setForm({ ...form, basecampUrl: e.target.value })}
              placeholder="https://..."
              className="hub-input mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="hub-btn-primary">
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="hub-btn">
          Cancel
        </button>
      </div>
    </form>
  );
}
