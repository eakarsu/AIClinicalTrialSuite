const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM patients ORDER BY enrolled_at DESC NULLS LAST, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const {
      patient_id, trial, site, enrollment_status, enrolled_at, arm,
      first_name, last_name, date_of_birth, gender, email, phone, diagnosis,
      stage, biomarkers, medical_history, current_medications, travel_minutes,
      caregiver_support, mrn, source,
    } = req.body;
    const r = await pool.query(
      `INSERT INTO patients (
        patient_id, trial, site, enrollment_status, enrolled_at, arm,
        first_name, last_name, date_of_birth, gender, email, phone, diagnosis,
        stage, biomarkers, medical_history, current_medications, travel_minutes,
        caregiver_support, mrn, source
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        patient_id, trial, site, enrollment_status || 'screening', enrolled_at || null, arm,
        first_name, last_name, date_of_birth || null, gender, email, phone, diagnosis,
        stage, biomarkers, medical_history, current_medications, travel_minutes || 0,
        caregiver_support !== undefined ? caregiver_support : true, mrn, source || 'manual',
      ]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      patient_id, trial, site, enrollment_status, enrolled_at, arm,
      first_name, last_name, date_of_birth, gender, email, phone, diagnosis,
      stage, biomarkers, medical_history, current_medications, travel_minutes,
      caregiver_support, mrn, source,
    } = req.body;
    const r = await pool.query(
      `UPDATE patients SET
        patient_id=$1, trial=$2, site=$3, enrollment_status=$4, enrolled_at=$5, arm=$6,
        first_name=$7, last_name=$8, date_of_birth=$9, gender=$10, email=$11, phone=$12,
        diagnosis=$13, stage=$14, biomarkers=$15, medical_history=$16, current_medications=$17,
        travel_minutes=$18, caregiver_support=$19, mrn=$20, source=$21, updated_at=NOW()
       WHERE id=$22 RETURNING *`,
      [
        patient_id, trial, site, enrollment_status, enrolled_at || null, arm,
        first_name, last_name, date_of_birth || null, gender, email, phone, diagnosis,
        stage, biomarkers, medical_history, current_medications, travel_minutes || 0,
        caregiver_support !== undefined ? caregiver_support : true, mrn, source || 'manual',
        req.params.id,
      ]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM patients WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted', patient: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
