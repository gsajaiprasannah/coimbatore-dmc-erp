// ═══════════════════════════════════════════════════════════════
// Coimbatore DMC ERP — Backend Server
// Mimics the Supabase REST API so the HTML app works unchanged.
// Deployed on Render.com with PostgreSQL.
// ═══════════════════════════════════════════════════════════════
const express = require('express');
const { Pool }  = require('pg');
const path      = require('path');
const fs        = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));

// ── Database ─────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table on first boot
pool.query(`
  CREATE TABLE IF NOT EXISTS app_data (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => console.log('✅ app_data table ready'))
  .catch(e  => console.error('DB init error:', e.message));

// ── Auth middleware ───────────────────────────────────────────
// The HTML sends the API key in the "apikey" header (Supabase format)
// and also as "Authorization: Bearer <key>".
const API_KEY = process.env.API_KEY;
function auth(req, res, next) {
  const key = req.headers['apikey']
    || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!API_KEY || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Serve the HTML app ────────────────────────────────────────
// Inject the Render URL and API key into the HTML at request time
// so credentials never live in the source file.
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    return res.status(404).send('index.html not found in /public');
  }
  let html = fs.readFileSync(htmlPath, 'utf8');
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  html = html
    .replace("'YOUR_SUPABASE_PROJECT_URL'", `'${origin}'`)
    .replace("'YOUR_SUPABASE_ANON_KEY'",    `'${API_KEY}'`);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// All other static files (if any) served normally
app.use(express.static(path.join(__dirname, 'public')));

// ── Supabase-compatible REST endpoints ────────────────────────
// The app calls:
//   GET  /rest/v1/app_data?select=key,value
//   POST /rest/v1/app_data   (with Prefer: resolution=merge-duplicates)

// GET — load all data on page start
app.get('/rest/v1/app_data', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_data ORDER BY key');
    res.json(result.rows);
  } catch (e) {
    console.error('GET /rest/v1/app_data error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST — upsert a single key (called on every DB.set())
app.post('/rest/v1/app_data', auth, async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key is required' });
  try {
    await pool.query(
      `INSERT INTO app_data (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE
         SET value      = EXCLUDED.value,
             updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
    res.status(201).json({ key });
  } catch (e) {
    console.error('POST /rest/v1/app_data error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Health check — Render pings this to keep the service warm
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 DMC ERP server running on port ${PORT}`));
