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

app.use(express.static(path.join(__dirname, 'public')));

// ── Supabase-compatible REST endpoints ────────────────────────
app.get('/rest/v1/app_data', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_data ORDER BY key');
    res.json(result.rows);
  } catch (e) {
    console.error('GET /rest/v1/app_data error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

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

// ── Claude AI Proxy ───────────────────────────────────────────
// Forwards requests to Anthropic API — keeps API key server-side.
app.options('/api/claude', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.post('/api/claude', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Claude proxy error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 DMC ERP server running on port ${PORT}`));
