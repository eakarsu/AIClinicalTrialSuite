const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const pool = require('../config/database');

/**
 * Compute HMAC-SHA256 signature: hex(hmac(secret, body))
 */
function sign(secret, body) {
  return crypto.createHmac('sha256', secret || '').update(body).digest('hex');
}

function postJson(targetUrl, body, signature) {
  return new Promise((resolve) => {
    try {
      const url = new URL(targetUrl);
      const lib = url.protocol === 'https:' ? https : http;
      const opts = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search || ''}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Webhook-Signature': `sha256=${signature}`,
        },
        timeout: 5000,
      };
      const req = lib.request(opts, (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve({ status: res.statusCode || 0, body: buf.slice(0, 2000) }));
      });
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
      req.on('error', (e) => resolve({ status: 0, body: String(e.message).slice(0, 2000) }));
      req.write(body);
      req.end();
    } catch (e) {
      resolve({ status: 0, body: String(e.message).slice(0, 2000) });
    }
  });
}

/**
 * Fire an event to every active webhook subscribed to that event.
 * Records a delivery row per webhook (success or failure) for the audit log.
 */
async function fireEvent(event, payload) {
  try {
    const subs = await pool.query(
      `SELECT id, url, secret FROM webhooks WHERE event=$1 AND active=true`,
      [event]
    );
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const w of subs.rows) {
      const signature = sign(w.secret, body);
      const resp = await postJson(w.url, body, signature);
      const success = resp.status >= 200 && resp.status < 300;
      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event, payload, response_status, response_body, signature, success)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [w.id, event, JSON.parse(body), resp.status, resp.body, signature, success]
      );
    }
  } catch (e) {
    console.warn('[webhooks] fireEvent error:', e.message);
  }
}

module.exports = { fireEvent, sign };
