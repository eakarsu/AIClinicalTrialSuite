const express = require('express');
const router = express.Router();
const pool = require('../config/database');

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM vendors_cro ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM vendors_cro WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { cro_id, name, services, contract_value_usd, status, started_at } = req.body;
    const r = await pool.query(
      `INSERT INTO vendors_cro (cro_id, name, services, contract_value_usd, status, started_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [cro_id, name, toArray(services), contract_value_usd || 0, status || 'active', started_at || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { cro_id, name, services, contract_value_usd, status, started_at } = req.body;
    const r = await pool.query(
      `UPDATE vendors_cro SET cro_id=$1, name=$2, services=$3, contract_value_usd=$4, status=$5, started_at=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [cro_id, name, toArray(services), contract_value_usd, status, started_at || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM vendors_cro WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor deleted', vendor: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
