# FP Campaign Hub

Q4 creative review and KPI hub for FreePrints mobile apps. Executives review email, push, and in-app mockups with per-asset approval. You manage campaigns and assets via admin.

## Apps supported

- FreePrints
- FreePrints Photo Books
- FreePrints Photo Tiles
- FreePrints Photo Art
- Ink
- FreePrints Cards (UK)
- Photo Calendars
- Easy Tiles

## Quick start

### 1. Install Node.js

Download from [nodejs.org](https://nodejs.org) (LTS). Restart your terminal after installing.

### 2. Install dependencies

```bash
cd fp-campaign-hub
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000/review](http://localhost:3000/review) for exec review, or [http://localhost:3000/admin](http://localhost:3000/admin) to upload campaigns.

## Routes

| URL | Purpose |
|-----|---------|
| `/review` | Exec app picker |
| `/review/calendar` | Q4 timeline across all apps |
| `/review/[app]/[campaignId]` | Creative review + approve/comment |
| `/review/[app]/[campaignId]/kpi` | Report URLs + KPI notes |
| `/admin` | Your dashboard |
| `/admin/campaigns/new` | Create campaign |
| `/admin/campaigns/[id]` | Upload mockups & versions |
| `/admin/settings` | Slack webhook + base URL |

## Workflow

1. **Create campaign** in admin — pick app, title, send date
2. **Add mockups** — email, push, in-app
3. **Upload version** — image + copy fields; re-upload creates v2, v3… (approval resets)
4. **Share `/review`** with execs — they approve each mockup individually
5. **Add KPI data** — paste Amplitude/report URLs and notes per campaign
6. **Slack** — optional webhook in settings for approval/comment alerts

## Slack setup

1. In Slack: **Apps → Incoming Webhooks → Add to Slack**
2. Pick a channel (e.g. `#q4-creative-review`)
3. Copy webhook URL into **Admin → Settings**

## Deploy (when ready)

1. Push to GitHub
2. Deploy on [Vercel](https://vercel.com) (free tier works)
3. Set `DATABASE_URL` — for production, create a free [Supabase](https://supabase.com) project and use Postgres, or use Turso for SQLite hosting
4. Set **Review base URL** in admin settings to your Vercel URL

## Local data

- Database: `prisma/dev.db` (SQLite)
- Uploads: `public/uploads/`

## Working with Cursor

Paste report URLs from the KPI hub into chat and ask for YoY trends, incrementality analysis, or campaign post-mortems. Link campaigns by title and app for context.
