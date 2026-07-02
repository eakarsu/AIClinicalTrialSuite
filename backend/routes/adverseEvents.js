const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireEvent } = require('../services/webhooks');
const { notifyAll } = require('../services/notifications');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM adverse_events ORDER BY reported_at DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM adverse_events WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Adverse event not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { event_id, patient, trial, term, severity, serious, reported_at, outcome } = req.body;
    const r = await pool.query(
      `INSERT INTO adverse_events (event_id, patient, trial, term, severity, serious, reported_at, outcome)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [event_id, patient, trial, term, severity, !!serious, reported_at || null, outcome]
    );
    const row = r.rows[0];
    if (row.serious) {
      await fireEvent('ae.serious', row);
      await notifyAll({
        type: 'ae',
        title: `Serious AE: ${row.event_id}`,
        body: `${row.trial} / ${row.patient} — ${row.term} (${row.severity})`,
        refTable: 'adverse_events',
        refId: row.event_id,
      });
    }
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { event_id, patient, trial, term, severity, serious, reported_at, outcome } = req.body;
    const prev = await pool.query('SELECT serious FROM adverse_events WHERE id=$1', [req.params.id]);
    const r = await pool.query(
      `UPDATE adverse_events SET event_id=$1, patient=$2, trial=$3, term=$4, severity=$5, serious=$6, reported_at=$7, outcome=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [event_id, patient, trial, term, severity, !!serious, reported_at || null, outcome, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Adverse event not found' });
    const row = r.rows[0];
    if (!prev.rows[0]?.serious && row.serious) {
      await fireEvent('ae.serious', row);
      await notifyAll({
        type: 'ae',
        title: `Serious AE: ${row.event_id}`,
        body: `${row.trial} / ${row.patient} — ${row.term} (${row.severity})`,
        refTable: 'adverse_events',
        refId: row.event_id,
      });
    }
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM adverse_events WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Adverse event not found' });
    res.json({ message: 'Adverse event deleted', event: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
