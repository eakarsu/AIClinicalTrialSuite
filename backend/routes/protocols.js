const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM protocols ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM protocols WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Protocol not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { protocol_id, trial, version, status, approved_by, approved_at } = req.body;
    const r = await pool.query(
      `INSERT INTO protocols (protocol_id, trial, version, status, approved_by, approved_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [protocol_id, trial, version, status || 'draft', approved_by || null, approved_at || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { protocol_id, trial, version, status, approved_by, approved_at } = req.body;
    const r = await pool.query(
      `UPDATE protocols SET protocol_id=$1, trial=$2, version=$3, status=$4, approved_by=$5, approved_at=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [protocol_id, trial, version, status, approved_by, approved_at, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Protocol not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM protocols WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Protocol not found' });
    res.json({ message: 'Protocol deleted', protocol: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
