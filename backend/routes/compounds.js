const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM compounds ORDER BY code');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM compounds WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Compound not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { compound_id, code, generic_name, therapeutic_area, mechanism, phase_max_reached, ic50_nm } = req.body;
    const r = await pool.query(
      `INSERT INTO compounds (compound_id, code, generic_name, therapeutic_area, mechanism, phase_max_reached, ic50_nm)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [compound_id, code, generic_name, therapeutic_area, mechanism, phase_max_reached, ic50_nm]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { compound_id, code, generic_name, therapeutic_area, mechanism, phase_max_reached, ic50_nm } = req.body;
    const r = await pool.query(
      `UPDATE compounds SET compound_id=$1, code=$2, generic_name=$3, therapeutic_area=$4, mechanism=$5, phase_max_reached=$6, ic50_nm=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [compound_id, code, generic_name, therapeutic_area, mechanism, phase_max_reached, ic50_nm, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Compound not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM compounds WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Compound not found' });
    res.json({ message: 'Compound deleted', compound: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
