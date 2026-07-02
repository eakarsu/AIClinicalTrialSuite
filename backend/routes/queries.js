const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { notifyAll } = require('../services/notifications');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM queries ORDER BY raised_at DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM queries WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Query not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { query_id, trial, patient, field, question, status, raised_at, answered_at } = req.body;
    const r = await pool.query(
      `INSERT INTO queries (query_id, trial, patient, field, question, status, raised_at, answered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [query_id, trial, patient, field, question, status || 'open', raised_at || new Date(), answered_at || null]
    );
    const row = r.rows[0];
    await notifyAll({
      type: 'query',
      title: `New query: ${row.query_id}`,
      body: `${row.trial} / ${row.patient} — ${row.field}: ${row.question}`,
      refTable: 'queries',
      refId: row.query_id,
    });
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { query_id, trial, patient, field, question, status, raised_at, answered_at } = req.body;
    const r = await pool.query(
      `UPDATE queries SET query_id=$1, trial=$2, patient=$3, field=$4, question=$5, status=$6, raised_at=$7, answered_at=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [query_id, trial, patient, field, question, status, raised_at || null, answered_at || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Query not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM queries WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Query not found' });
    res.json({ message: 'Query deleted', query: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
