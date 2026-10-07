"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar, adminNav } from "@/components/NavBar";
import { APPS } from "@/lib/apps";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    appId: "freeprints",
    title: "",
    eventLabel: "",
    region: "",
    startDate: "",
    endDate: "",
    quarter: "Q4-2026",
    notes: "",
    reportUrl: "",
    confluenceUrl: "",
    basecampUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const campaign = await res.json();
      router.push(`/admin/campaigns/${campaign.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={adminNav} badge="Admin" />
      <main className="hub-container max-w-lg hub-main">
        <Link href="/admin" className="text-sm font-semibold text-hub-ink hover:underline">
          ← Dashboard
        </Link>
        <h1 className="hub-display mt-4 text-4xl">New campaign</h1>

        <form onSubmit={handleSubmit} className="hub-card-bordered mt-6 space-y-4 p-6">
          <div>
            <label className="block text-sm font-bold text-hub-ink">App</label>
            <select
              value={form.appId}
              onChange={(e) => setForm({ ...form, appId: e.target.value })}
              className="hub-input mt-1 !rounded-2xl"
            >
              {APPS.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-hub-ink">Event / season</label>
            <input
              value={form.eventLabel}
              onChange={(e) => setForm({ ...form, eventLabel: e.target.value })}
              placeholder="e.g. Black Friday"
              className="hub-input mt-1 !rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-hub-ink">Campaign title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Black Friday 2026"
              className="hub-input mt-1 !rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-hub-ink">Region</label>
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="e.g. US, UK, FR"
              className="hub-input mt-1 !rounded-2xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-hub-ink">Start date</label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="hub-input mt-1 !rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-hub-ink">End date</label>
              <input
                required
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="hub-input mt-1 !rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-hub-ink">Quarter</label>
            <input
              value={form.quarter}
              onChange={(e) => setForm({ ...form, quarter: e.target.value })}
              className="hub-input mt-1 !rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-hub-ink">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="hub-textarea mt-1"
            />
          </div>

          <div className="border-t border-hub-border pt-4">
            <p className="mb-3 text-sm font-bold text-hub-ink">Project links</p>
            <div className="space-y-3">
              <input
                value={form.reportUrl}
                onChange={(e) => setForm({ ...form, reportUrl: e.target.value })}
                placeholder="Report URL"
                className="hub-input !rounded-2xl"
              />
              <input
                value={form.confluenceUrl}
                onChange={(e) => setForm({ ...form, confluenceUrl: e.target.value })}
                placeholder="Confluence page URL"
                className="hub-input !rounded-2xl"
              />
              <input
                value={form.basecampUrl}
                onChange={(e) => setForm({ ...form, basecampUrl: e.target.value })}
                placeholder="Basecamp job URL"
                className="hub-input !rounded-2xl"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="hub-btn-accent w-full">
            {loading ? "Creating..." : "Create campaign"}
          </button>
        </form>
      </main>
    </div>
  );
}
