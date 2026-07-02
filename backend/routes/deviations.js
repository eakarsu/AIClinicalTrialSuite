const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireEvent } = require('../services/webhooks');
const { notifyAll } = require('../services/notifications');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM deviations ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM deviations WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Deviation not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { deviation_id, trial, site, type, description, root_cause, status } = req.body;
    const r = await pool.query(
      `INSERT INTO deviations (deviation_id, trial, site, type, description, root_cause, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [deviation_id, trial, site, type || 'minor', description, root_cause, status || 'open']
    );
    const row = r.rows[0];
    await fireEvent('deviation.created', row);
    await notifyAll({
      type: 'deviation',
      title: `New ${row.type} deviation: ${row.deviation_id}`,
      body: `${row.trial} @ ${row.site} — ${row.description}`,
      refTable: 'deviations',
      refId: row.deviation_id,
    });
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { deviation_id, trial, site, type, description, root_cause, status } = req.body;
    const r = await pool.query(
      `UPDATE deviations SET deviation_id=$1, trial=$2, site=$3, type=$4, description=$5, root_cause=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [deviation_id, trial, site, type, description, root_cause, status, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Deviation not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM deviations WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Deviation not found' });
    res.json({ message: 'Deviation deleted', deviation: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
