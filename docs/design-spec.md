# FP Campaign Hub — Design Spec

**Date:** 2026-07-07  
**Status:** Approved  
**Owner:** Ricky (PM, FreePrints apps)

## Goal

Single hub for Q4 2026 executive creative review across 8 FreePrints apps, with per-mockup approval, version history, calendar view, KPI/report linking, and Slack notifications.

## Users

| User | Access | Actions |
|------|--------|---------|
| PM (Ricky) | `/admin` | Create campaigns, upload mockups, manage KPI data, configure Slack |
| Executives | `/review` (simple link, no login) | View all creative, approve per mockup, comment |

## Approval model

- One approval per creative mockup (email, push, in-app are separate)
- Campaign shows progress rollup (e.g. 3/5 approved) but no campaign-level gate
- Re-upload creates new version; approval resets to pending on latest version
- Prior versions archived with their approvals and comments

## MVP features

- [x] 8-app navigation
- [x] Campaign CRUD with send date and title
- [x] Image mockup upload + copy fields per channel type
- [x] Per-mockup approve / comment (exec view)
- [x] Version history
- [x] Q4 calendar timeline
- [x] KPI hub: report URLs + manual fields (sales, YoY, incrementality, analysis notes)
- [x] Slack webhook notifications on approve/comment
- [ ] Email HTML rendering (explicitly excluded)

## Tech stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Prisma + SQLite** locally (no Supabase account required to start)
- **Local file storage** in `public/uploads/`
- Migration path to Supabase Postgres + Storage for production

## Security

- Exec review: unlisted URL, `noindex`
- Admin: open in MVP (no password); add auth in v1.1 if needed
- Slack webhook stored in local DB settings

## Future phases

- Admin password / simple auth
- Supabase migration for hosted deploy
- Amplitude chart embeds (beyond URL links)
- PDF export of approved creative pack
- Post-campaign learnings library
