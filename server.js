const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

function loadFrontendConfig() {
  const p = path.join(__dirname, 'src', 'assets', 'config.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

app.post('/auth/token', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body || {};
    if (!code) return res.status(400).json({ error: 'bad_request', error_description: 'Missing code' });
    if (!code_verifier) return res.status(400).json({ error: 'bad_request', error_description: 'Missing code_verifier' });

    const cfg = loadFrontendConfig();
    const clientSecret = process.env.SF_CLIENT_SECRET;
    if (!clientSecret) {
      return res.status(500).json({
        error: 'server_misconfigured',
        error_description: 'Missing SF_CLIENT_SECRET env var (Connected App consumer secret)',
      });
    }

    const tokenUrl = String(cfg.authBaseUrl).replace(/\/$/, '') + '/services/oauth2/token';
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', cfg.clientId);
    body.set('client_secret', clientSecret);
    body.set('redirect_uri', redirect_uri || cfg.redirectUri);
    body.set('code', code);
    body.set('code_verifier', code_verifier);

    const sfRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const text = await sfRes.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    return res.status(sfRes.status).json(json);
  } catch (e) {
    return res.status(500).json({ error: 'server_error', error_description: e?.message || String(e) });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth proxy listening on http://localhost:${port}`);
});

