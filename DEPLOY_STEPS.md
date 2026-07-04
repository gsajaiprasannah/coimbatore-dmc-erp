# Coimbatore DMC ERP — Deployment Guide
## Stack: GitHub → Render.com (Node + PostgreSQL) → Cloudflare (DNS)

---

## Folder structure (what you'll push to GitHub)

```
your-repo/
├── server.js          ← Express backend
├── package.json
├── render.yaml        ← Render infrastructure-as-code
└── public/
    └── index.html     ← The ERP app (unchanged)
```

---

## Step 1 — Push to GitHub

1. Go to github.com → **New repository**
   - Name: `coimbatore-dmc-erp`  
   - Visibility: **Private** (this is an internal tool)
   - Do NOT initialise with a README

2. On your computer, open Terminal and run:
   ```bash
   cd path/to/this/deploy/folder
   git init
   git add .
   git commit -m "Initial ERP deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/coimbatore-dmc-erp.git
   git push -u origin main
   ```

---

## Step 2 — Deploy to Render (one-click via render.yaml)

1. Go to **dashboard.render.com** → **New** → **Blueprint**
2. Connect your GitHub account if not already done
3. Select the `coimbatore-dmc-erp` repository
4. Render reads `render.yaml` and shows you what it will create:
   - A **PostgreSQL database** (`coimbatore-dmc-db`)
   - A **Web Service** (`coimbatore-dmc-erp`)
5. Click **Apply** — Render provisions everything automatically
6. Wait 3–5 minutes for the first deploy to complete

### What Render sets up automatically
| Item | Value |
|------|-------|
| Node version | 18+ |
| Build command | `npm install` |
| Start command | `node server.js` |
| `API_KEY` | Auto-generated secure random string |
| `DATABASE_URL` | Auto-linked to the PostgreSQL database |

### Get your app URL and API key
- App URL: shown in Render dashboard, looks like `https://coimbatore-dmc-erp.onrender.com`
- API key: Render Dashboard → Web Service → **Environment** → copy `API_KEY` value

> **The HTML injects credentials automatically.** You don't need to edit index.html.
> The server replaces the placeholder values at request time using environment variables.

---

## Step 3 — Test the live app

1. Open `https://coimbatore-dmc-erp.onrender.com` in your browser
2. Log in with any existing account (data from localStorage won't carry over — start fresh)
3. Create a booking → it saves to PostgreSQL on Render
4. Open the same URL on a different device → same data appears ✅

### Warm-up note (free tier)
The free Render plan sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to **Starter ($7/mo)** to keep it always-on.

---

## Step 4 — Custom domain via Cloudflare (optional)

If you want `erp.yourdomain.com` instead of the Render URL:

1. **Render Dashboard** → Web Service → **Settings** → **Custom Domains** → Add `erp.yourdomain.com`
2. Render shows you a CNAME target (e.g. `coimbatore-dmc-erp.onrender.com`)
3. **Cloudflare Dashboard** → your domain → **DNS** → **Add record**:
   - Type: `CNAME`
   - Name: `erp`
   - Target: the Render CNAME value
   - Proxy: **Proxied** (orange cloud) ✅
4. Set SSL/TLS to **Full** in Cloudflare → SSL/TLS settings
5. Wait 1–2 minutes → visit `https://erp.yourdomain.com`

---

## Step 5 — Every future update

Whenever you get an updated `index.html` from Claude:

```bash
cp /path/to/new/Coimbatore_DMC_ERP.html public/index.html
git add public/index.html
git commit -m "Update ERP: <describe what changed>"
git push
```

Render auto-deploys within 2 minutes of a push to `main`. ✅

---

## Database info

| Item | Free tier | Starter ($7/mo) |
|------|-----------|-----------------|
| Storage | 1 GB | 10 GB |
| Expiry | **90 days** ⚠️ | No expiry |
| Connections | 97 | 97 |

> **Important:** Upgrade to Starter before 90 days to avoid losing data.
> Render sends email warnings before the free DB expires.

---

## How the data layer works

```
Browser (index.html)
  │
  ├─ DB.get(key)  → reads from in-memory CACHE (instant)
  │
  └─ DB.set(key, value)
        ├─ writes to CACHE (instant — UI stays fast)
        ├─ POST /rest/v1/app_data → saves to PostgreSQL on Render
        └─ mirrors to localStorage as offline backup

On page load after login:
  GET /rest/v1/app_data → loads all keys from PostgreSQL into CACHE
```

All devices share the same PostgreSQL database → real-time shared data across the team.
