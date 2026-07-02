const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM milestones ORDER BY target_date NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM milestones WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Milestone not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { milestone_id, trial, name, target_date, actual_date, status } = req.body;
    const r = await pool.query(
      `INSERT INTO milestones (milestone_id, trial, name, target_date, actual_date, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [milestone_id, trial, name, target_date || null, actual_date || null, status || 'on_track']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { milestone_id, trial, name, target_date, actual_date, status } = req.body;
    const r = await pool.query(
      `UPDATE milestones SET milestone_id=$1, trial=$2, name=$3, target_date=$4, actual_date=$5, status=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [milestone_id, trial, name, target_date || null, actual_date || null, status, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Milestone not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM milestones WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Milestone not found' });
    res.json({ message: 'Milestone deleted', milestone: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
