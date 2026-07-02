const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM sites ORDER BY name');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM sites WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Site not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { site_id, name, city, country, principal_investigator, capacity, status } = req.body;
    const r = await pool.query(
      `INSERT INTO sites (site_id, name, city, country, principal_investigator, capacity, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [site_id, name, city, country, principal_investigator, capacity || 0, status || 'active']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { site_id, name, city, country, principal_investigator, capacity, status } = req.body;
    const r = await pool.query(
      `UPDATE sites SET site_id=$1, name=$2, city=$3, country=$4, principal_investigator=$5, capacity=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [site_id, name, city, country, principal_investigator, capacity, status, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Site not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM sites WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Site not found' });
    res.json({ message: 'Site deleted', site: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
