const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireEvent } = require('../services/webhooks');
const { notifyAll } = require('../services/notifications');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM amendments ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM amendments WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Amendment not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { amendment_id, trial, version, summary, status, approved_at } = req.body;
    const r = await pool.query(
      `INSERT INTO amendments (amendment_id, trial, version, summary, status, approved_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [amendment_id, trial, version, summary, status || 'proposed', approved_at || null]
    );
    const row = r.rows[0];
    if (row.status === 'approved') {
      await fireEvent('amendment.approved', row);
      await notifyAll({ type: 'amendment', title: `Amendment approved: ${row.amendment_id}`, body: row.summary, refTable: 'amendments', refId: row.amendment_id });
    }
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { amendment_id, trial, version, summary, status, approved_at } = req.body;
    const prev = await pool.query('SELECT status FROM amendments WHERE id=$1', [req.params.id]);
    const r = await pool.query(
      `UPDATE amendments SET amendment_id=$1, trial=$2, version=$3, summary=$4, status=$5, approved_at=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [amendment_id, trial, version, summary, status, approved_at || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Amendment not found' });
    const row = r.rows[0];
    if (prev.rows[0]?.status !== 'approved' && row.status === 'approved') {
      await fireEvent('amendment.approved', row);
      await notifyAll({ type: 'amendment', title: `Amendment approved: ${row.amendment_id}`, body: row.summary, refTable: 'amendments', refId: row.amendment_id });
    }
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM amendments WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Amendment not found' });
    res.json({ message: 'Amendment deleted', amendment: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
