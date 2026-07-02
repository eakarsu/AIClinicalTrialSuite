const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM supply_shipments ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM supply_shipments WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { shipment_id, trial, site, kit_count, lot, status, temp_excursion } = req.body;
    const r = await pool.query(
      `INSERT INTO supply_shipments (shipment_id, trial, site, kit_count, lot, status, temp_excursion)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [shipment_id, trial, site, kit_count || 0, lot, status || 'pending', !!temp_excursion]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { shipment_id, trial, site, kit_count, lot, status, temp_excursion } = req.body;
    const r = await pool.query(
      `UPDATE supply_shipments SET shipment_id=$1, trial=$2, site=$3, kit_count=$4, lot=$5, status=$6, temp_excursion=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [shipment_id, trial, site, kit_count, lot, status, !!temp_excursion, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM supply_shipments WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ message: 'Shipment deleted', shipment: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
