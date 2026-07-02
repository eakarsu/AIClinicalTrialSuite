const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM regulatory_submissions ORDER BY submitted_at DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM regulatory_submissions WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { sub_id, trial, agency, type, status, submitted_at } = req.body;
    const r = await pool.query(
      `INSERT INTO regulatory_submissions (sub_id, trial, agency, type, status, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [sub_id, trial, agency, type, status || 'submitted', submitted_at || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { sub_id, trial, agency, type, status, submitted_at } = req.body;
    const r = await pool.query(
      `UPDATE regulatory_submissions SET sub_id=$1, trial=$2, agency=$3, type=$4, status=$5, submitted_at=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [sub_id, trial, agency, type, status, submitted_at || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM regulatory_submissions WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ message: 'Submission deleted', submission: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
