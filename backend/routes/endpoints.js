const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM endpoints ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM endpoints WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Endpoint not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { endpoint_id, trial, type, measure, timepoint, statistical_method } = req.body;
    const r = await pool.query(
      `INSERT INTO endpoints (endpoint_id, trial, type, measure, timepoint, statistical_method)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [endpoint_id, trial, type || 'primary', measure, timepoint, statistical_method]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { endpoint_id, trial, type, measure, timepoint, statistical_method } = req.body;
    const r = await pool.query(
      `UPDATE endpoints SET endpoint_id=$1, trial=$2, type=$3, measure=$4, timepoint=$5, statistical_method=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [endpoint_id, trial, type, measure, timepoint, statistical_method, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Endpoint not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM endpoints WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Endpoint not found' });
    res.json({ message: 'Endpoint deleted', endpoint: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
