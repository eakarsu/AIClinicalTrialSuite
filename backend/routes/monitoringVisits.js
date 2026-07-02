const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM monitoring_visits ORDER BY scheduled_for DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM monitoring_visits WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { visit_id, trial, site, monitor, scheduled_for, type, status } = req.body;
    const r = await pool.query(
      `INSERT INTO monitoring_visits (visit_id, trial, site, monitor, scheduled_for, type, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [visit_id, trial, site, monitor, scheduled_for || null, type || 'IMV', status || 'planned']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { visit_id, trial, site, monitor, scheduled_for, type, status } = req.body;
    const r = await pool.query(
      `UPDATE monitoring_visits SET visit_id=$1, trial=$2, site=$3, monitor=$4, scheduled_for=$5, type=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [visit_id, trial, site, monitor, scheduled_for || null, type, status, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM monitoring_visits WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json({ message: 'Visit deleted', visit: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
