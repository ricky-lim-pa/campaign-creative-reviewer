"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar, adminNav } from "@/components/NavBar";

export default function SettingsPage() {
  const [form, setForm] = useState({ slackWebhookUrl: "", reviewBaseUrl: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          slackWebhookUrl: data.slackWebhookUrl || "",
          reviewBaseUrl: data.reviewBaseUrl || "",
        });
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="hub-page bg-hub-cream">
      <NavBar links={adminNav} badge="Admin" />
      <main className="hub-container max-w-lg hub-main">
        <Link href="/admin" className="text-sm font-semibold text-hub-ink hover:underline">
          ← Dashboard
        </Link>
        <h1 className="hub-display mt-4 text-4xl">Settings</h1>

        {loading ? (
          <p className="mt-4 text-hub-muted">Loading...</p>
        ) : (
          <form onSubmit={save} className="hub-card-bordered mt-6 space-y-5 p-6">
            <div>
              <label className="block text-sm font-bold text-hub-ink">Slack webhook URL</label>
              <p className="mt-0.5 text-xs text-hub-muted">
                Posts when mockups are approved or commented on.
              </p>
              <input
                value={form.slackWebhookUrl}
                onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })}
                placeholder="https://hooks.slack.com/services/..."
                className="hub-input mt-2 !rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-hub-ink">Review base URL</label>
              <p className="mt-0.5 text-xs text-hub-muted">
                Used in Slack notification links.
              </p>
              <input
                value={form.reviewBaseUrl}
                onChange={(e) => setForm({ ...form, reviewBaseUrl: e.target.value })}
                placeholder="http://localhost:3000"
                className="hub-input mt-2 !rounded-2xl"
              />
            </div>

            <button type="submit" className="hub-btn-primary">
              Save settings
            </button>
            {saved && <p className="text-sm font-semibold text-hub-ink">Saved!</p>}
          </form>
        )}
      </main>
    </div>
  );
}
