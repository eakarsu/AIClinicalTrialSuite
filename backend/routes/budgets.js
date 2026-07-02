const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM budgets ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM budgets WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { budget_id, trial, category, budgeted_usd, spent_usd, variance_pct, period } = req.body;
    const r = await pool.query(
      `INSERT INTO budgets (budget_id, trial, category, budgeted_usd, spent_usd, variance_pct, period)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [budget_id, trial, category, budgeted_usd || 0, spent_usd || 0, variance_pct || 0, period]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { budget_id, trial, category, budgeted_usd, spent_usd, variance_pct, period } = req.body;
    const r = await pool.query(
      `UPDATE budgets SET budget_id=$1, trial=$2, category=$3, budgeted_usd=$4, spent_usd=$5, variance_pct=$6, period=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [budget_id, trial, category, budgeted_usd, spent_usd, variance_pct, period, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM budgets WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted', budget: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
