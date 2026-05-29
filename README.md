# TikFlow — TikTok Automation Platform

A full-featured TikTok automation SaaS app. Everything ManyChat is missing for TikTok.

## Features

- **Flow Builder** — Visual drag-and-drop builder with 14 node types
- **All Triggers** — Comment, Live Stream, Story Reply, New Follower, Video Mention, DM, Ref URL, QR
- **All Actions** — Send TikTok DM, Email, SMS, Add Tag, Set Field, Condition, Delay, Sequence, AI Step, Webhook, Notify Team
- **Contacts CRM** — Lead collection from TikTok, tags, custom fields, search/filter
- **Broadcasts** — Mass DMs with clickable link buttons and audience segments
- **Sequences** — Multi-day drip campaigns over TikTok DM
- **Analytics** — Per-flow stats, CTR, revenue attribution

---

## Run Locally

```bash
npm install
npm run dev
```
Open http://localhost:5173

---

## Deploy to Vercel (recommended — free)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Or: go to [vercel.com](https://vercel.com) → New Project → Import from GitHub → deploy.

---

## Deploy to Netlify (free)

1. Run `npm run build` — this creates a `dist/` folder
2. Go to [netlify.com](https://netlify.com) → Sites → drag and drop the `dist/` folder
3. Done — your site is live in 30 seconds

---

## Deploy to GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to package.json scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```

Then: `npm run deploy`

---

## Tech Stack

- React 18 + Vite
- Vanilla CSS (no UI library — fully custom TikTok dark theme)
- Zero external dependencies beyond React
