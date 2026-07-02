const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM trials ORDER BY start_date DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM trials WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Trial not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const {
      trial_id, name, indication, phase, status, sponsor, start_date,
      description, target_enrollment, current_enrollment, eligibility_criteria, recruitment_summary,
    } = req.body;
    const r = await pool.query(
      `INSERT INTO trials (
        trial_id, name, indication, phase, status, sponsor, start_date,
        description, target_enrollment, current_enrollment, eligibility_criteria, recruitment_summary
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        trial_id, name, indication, phase, status || 'planning', sponsor, start_date || null,
        description, target_enrollment || null, current_enrollment || 0, eligibility_criteria, recruitment_summary,
      ]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      trial_id, name, indication, phase, status, sponsor, start_date,
      description, target_enrollment, current_enrollment, eligibility_criteria, recruitment_summary,
    } = req.body;
    const r = await pool.query(
      `UPDATE trials SET
        trial_id=$1, name=$2, indication=$3, phase=$4, status=$5, sponsor=$6, start_date=$7,
        description=$8, target_enrollment=$9, current_enrollment=$10,
        eligibility_criteria=$11, recruitment_summary=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [
        trial_id, name, indication, phase, status, sponsor, start_date || null,
        description, target_enrollment || null, current_enrollment || 0,
        eligibility_criteria, recruitment_summary, req.params.id,
      ]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Trial not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM trials WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Trial not found' });
    res.json({ message: 'Trial deleted', trial: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
