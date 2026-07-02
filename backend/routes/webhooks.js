const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireEvent } = require('../services/webhooks');
const { requireWrite } = require('../middleware/auth');

// GET subscriptions
router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM webhooks ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireWrite(), async (req, res) => {
  try {
    const { name, url, event, secret, active } = req.body;
    const r = await pool.query(
      `INSERT INTO webhooks (name, url, event, secret, active) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, url, event, secret || null, active !== false]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireWrite(), async (req, res) => {
  try {
    const { name, url, event, secret, active } = req.body;
    const r = await pool.query(
      `UPDATE webhooks SET name=$1, url=$2, event=$3, secret=$4, active=$5 WHERE id=$6 RETURNING *`,
      [name, url, event, secret || null, active !== false, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireWrite(), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM webhooks WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET delivery log (audit trail)
router.get('/deliveries', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.*, w.name AS webhook_name, w.url AS webhook_url
         FROM webhook_deliveries d LEFT JOIN webhooks w ON d.webhook_id = w.id
         ORDER BY d.delivered_at DESC LIMIT 200`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST trigger test event (for manual verification)
router.post('/test/:event', requireWrite(), async (req, res) => {
  try {
    const payload = req.body && Object.keys(req.body).length ? req.body : { test: true, ts: Date.now() };
    await fireEvent(req.params.event, payload);
    res.json({ fired: req.params.event });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
