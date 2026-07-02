const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/notifications  — current user's notifications
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    const unread = r.rows.filter(n => !n.read).length;
    res.json({ data: r.rows, unread });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/notifications/:id/read  — mark single notification as read
router.post('/:id/read', async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/notifications/read-all  — mark all as read for current user
router.post('/read-all', async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET read=true WHERE user_id=$1`, [req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
