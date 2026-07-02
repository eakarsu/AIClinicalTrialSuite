const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM investigators ORDER BY name');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM investigators WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Investigator not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { investigator_id, name, title, site, specialty, trials_count, certifications } = req.body;
    const r = await pool.query(
      `INSERT INTO investigators (investigator_id, name, title, site, specialty, trials_count, certifications)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [investigator_id, name, title, site, specialty, trials_count || 0, certifications]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { investigator_id, name, title, site, specialty, trials_count, certifications } = req.body;
    const r = await pool.query(
      `UPDATE investigators SET investigator_id=$1, name=$2, title=$3, site=$4, specialty=$5, trials_count=$6, certifications=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [investigator_id, name, title, site, specialty, trials_count, certifications, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Investigator not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM investigators WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Investigator not found' });
    res.json({ message: 'Investigator deleted', investigator: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
