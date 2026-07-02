const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM data_locks ORDER BY locked_at DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM data_locks WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Lock not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { lock_id, trial, lock_type, locked_at, locked_by, status } = req.body;
    const r = await pool.query(
      `INSERT INTO data_locks (lock_id, trial, lock_type, locked_at, locked_by, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [lock_id, trial, lock_type || 'interim', locked_at || null, locked_by, status || 'locked']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { lock_id, trial, lock_type, locked_at, locked_by, status } = req.body;
    const r = await pool.query(
      `UPDATE data_locks SET lock_id=$1, trial=$2, lock_type=$3, locked_at=$4, locked_by=$5, status=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [lock_id, trial, lock_type, locked_at || null, locked_by, status, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Lock not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM data_locks WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Lock not found' });
    res.json({ message: 'Lock deleted', lock: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
