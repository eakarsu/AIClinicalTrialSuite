const express = require('express');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const DISCLAIMER = 'Matching and eligibility outputs are decision support only and require qualified clinical review.';
const VALID_STATUSES = ['candidate', 'screening', 'enrolled', 'declined', 'screened_out', 'pending', 'review'];

function clean(value) {
  return String(value || '').toLowerCase().trim();
}

function splitTerms(value) {
  return clean(value)
    .split(/[,;|]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function phaseBonus(phase) {
  const p = clean(phase);
  if (p.includes('iii') || p.includes('phase 3')) return 15;
  if (p.includes('ii') || p.includes('phase 2')) return 10;
  if (p.includes('iv') || p.includes('phase 4')) return 10;
  if (p.includes('i') || p.includes('phase 1')) return 5;
  return 0;
}

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function computeMatchScore(patient, trial) {
  const diagnosis = clean(patient.diagnosis);
  const indication = clean(trial.indication);
  const criteria = `${trial.eligibility_criteria || ''} ${trial.recruitment_summary || ''} ${trial.description || ''}`.toLowerCase();
  const reasons = [];
  let score = 0;

  if (diagnosis && indication) {
    const diagnosisHead = diagnosis.split(/\s+/)[0];
    const indicationHead = indication.split(/\s+/)[0];
    if (indication.includes(diagnosis) || diagnosis.includes(indication) || indication.includes(diagnosisHead) || diagnosis.includes(indicationHead)) {
      score += 40;
      reasons.push(`Diagnosis aligns with indication (${trial.indication})`);
    }
  }

  const biomarkers = splitTerms(patient.biomarkers);
  let biomarkerHits = 0;
  for (const b of biomarkers) {
    const token = b.split(/\s+/)[0];
    if (token && (criteria.includes(token) || indication.includes(token))) biomarkerHits += 1;
  }
  if (biomarkerHits > 0) {
    const points = Math.min(30, biomarkerHits * 15);
    score += points;
    reasons.push(`${biomarkerHits} biomarker signal(s) found`);
  }

  const pBonus = phaseBonus(trial.phase);
  if (pBonus) {
    score += pBonus;
    reasons.push(`${trial.phase} readiness bonus`);
  }

  const status = clean(trial.status);
  if (status === 'recruiting') {
    score += 10;
    reasons.push('Trial is recruiting');
  } else if (status === 'active') {
    score += 5;
    reasons.push('Trial is active');
  }

  const age = computeAge(patient.date_of_birth);
  if (age !== null && criteria) {
    const adult = /\badult|18|eighteen/.test(criteria);
    const pediatric = /\bpediatric|child|children|adolescent/.test(criteria);
    if (adult && age >= 18) { score += 5; reasons.push('Adult age criterion likely met'); }
    if (pediatric && age < 18) { score += 5; reasons.push('Pediatric age criterion likely met'); }
  }

  if (patient.travel_minutes && Number(patient.travel_minutes) > 90) {
    score -= 5;
    reasons.push('Long travel burden');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reason: reasons.join('; ') || 'No strong criteria match found',
  };
}

function eligibilityFlags(patient, trial, matchScore) {
  const flags = [];
  const criteria = clean(`${trial.eligibility_criteria || ''} ${trial.recruitment_summary || ''}`);
  const age = computeAge(patient.date_of_birth);
  const biomarkers = splitTerms(patient.biomarkers);

  if (patient.diagnosis && trial.indication) {
    flags.push({
      criterion: 'Indication match',
      status: computeMatchScore(patient, trial).score >= 40 ? 'likely_met' : 'review',
      evidence: `${patient.diagnosis} vs ${trial.indication}`,
    });
  }
  if (age !== null) {
    flags.push({
      criterion: 'Age',
      status: criteria.includes('adult') && age < 18 ? 'potential_exclusion' : 'review',
      evidence: `${age} years`,
    });
  }
  if (biomarkers.length > 0) {
    const matched = biomarkers.filter(b => criteria.includes(b.split(/\s+/)[0]));
    flags.push({
      criterion: 'Biomarker criteria',
      status: matched.length ? 'likely_met' : 'review',
      evidence: matched.length ? matched.join(', ') : biomarkers.join(', '),
    });
  }
  if (patient.current_medications) {
    flags.push({
      criterion: 'Concomitant medications',
      status: 'review',
      evidence: patient.current_medications,
    });
  }
  flags.push({
    criterion: 'Overall matching threshold',
    status: matchScore >= 70 ? 'likely_met' : matchScore >= 45 ? 'review' : 'weak_match',
    evidence: `${matchScore}% deterministic score`,
  });
  return flags;
}

async function patientByAnyId(client, id) {
  const r = await client.query('SELECT * FROM patients WHERE id::text=$1 OR patient_id=$1 LIMIT 1', [String(id)]);
  return r.rows[0] || null;
}

async function trialByAnyId(client, id) {
  const r = await client.query('SELECT * FROM trials WHERE id::text=$1 OR trial_id=$1 LIMIT 1', [String(id)]);
  return r.rows[0] || null;
}

router.get('/summary', async (_req, res) => {
  try {
    const [patients, matches, high, reviews, enrolled, retention] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM patients'),
      pool.query('SELECT COUNT(*)::int AS n FROM trial_matches'),
      pool.query('SELECT COUNT(*)::int AS n FROM trial_matches WHERE match_score >= 70'),
      pool.query('SELECT COUNT(*)::int AS n FROM eligibility_reviews'),
      pool.query("SELECT COUNT(*)::int AS n FROM trial_matches WHERE status='enrolled'"),
      pool.query(`SELECT COUNT(*)::int AS n FROM patients WHERE COALESCE(travel_minutes,0) > 90 OR caregiver_support = false OR enrollment_status IN ('withdrawn','screening')`),
    ]);
    res.json({
      patients: patients.rows[0].n,
      matches: matches.rows[0].n,
      high_confidence_matches: high.rows[0].n,
      eligibility_reviews: reviews.rows[0].n,
      enrolled_matches: enrolled.rows[0].n,
      retention_watchlist: retention.rows[0].n,
      disclaimer: DISCLAIMER,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/matches', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const r = await pool.query(
      `SELECT m.*, p.first_name, p.last_name, p.diagnosis, p.stage, p.biomarkers,
              t.name AS trial_name, t.indication, t.phase, t.status AS trial_status
       FROM trial_matches m
       JOIN patients p ON p.id=m.patient_ref
       JOIN trials t ON t.id=m.trial_ref
       ORDER BY m.match_score DESC, m.updated_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ data: r.rows, disclaimer: DISCLAIMER });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/matches/score-patient', requireRole('sponsor', 'pi'), async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = req.body?.patient_id || req.body?.patientId;
    if (!patientId) return res.status(400).json({ error: 'patient_id is required' });
    const patient = await patientByAnyId(client, patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const trials = (await client.query(
      `SELECT * FROM trials
       WHERE status IN ('recruiting','active','planning')
       ORDER BY CASE status WHEN 'recruiting' THEN 1 WHEN 'active' THEN 2 ELSE 3 END, id`
    )).rows;

    await client.query('BEGIN');
    const scored = [];
    for (const trial of trials) {
      const result = computeMatchScore(patient, trial);
      const upsert = await client.query(
        `INSERT INTO trial_matches (patient_ref, trial_ref, patient_id, trial_id, match_score, match_reason, status)
         VALUES ($1,$2,$3,$4,$5,$6,'candidate')
         ON CONFLICT (patient_ref, trial_ref)
         DO UPDATE SET match_score=EXCLUDED.match_score, match_reason=EXCLUDED.match_reason, updated_at=NOW()
         RETURNING *`,
        [patient.id, trial.id, patient.patient_id, trial.trial_id, result.score, result.reason]
      );
      scored.push({ ...upsert.rows[0], trial_name: trial.name, indication: trial.indication, phase: trial.phase });
    }
    await client.query('COMMIT');
    scored.sort((a, b) => Number(b.match_score) - Number(a.match_score));
    res.status(201).json({
      patient: { id: patient.id, patient_id: patient.patient_id, name: [patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.patient_id, diagnosis: patient.diagnosis },
      trials_scored: scored.length,
      matches: scored,
      disclaimer: DISCLAIMER,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

router.get('/matches/patient/:id/ranked', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT m.*, t.name AS trial_name, t.indication, t.phase, t.status AS trial_status
       FROM trial_matches m
       JOIN trials t ON t.id=m.trial_ref
       JOIN patients p ON p.id=m.patient_ref
       WHERE p.id::text=$1 OR p.patient_id=$1
       ORDER BY m.match_score DESC`,
      [String(req.params.id)]
    );
    res.json({ matches: r.rows, total_matches: r.rows.length, disclaimer: DISCLAIMER });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/matches/:id/status', requireRole('sponsor', 'pi'), async (req, res) => {
  try {
    const { status, reason } = req.body || {};
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    const r = await pool.query(
      `UPDATE trial_matches
       SET status=$1, ai_analysis=COALESCE(ai_analysis,'{}'::jsonb) || $2::jsonb, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [status, JSON.stringify({ status_reason: reason || null, changed_at: new Date().toISOString(), changed_by: req.user?.email || null }), req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Match not found' });
    res.json({ match: r.rows[0], disclaimer: DISCLAIMER });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/matches/:id', requireRole('sponsor', 'pi'), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM trial_matches WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Match not found' });
    res.json({ message: 'Match deleted', match: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/eligibility-reviews', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT e.*, p.patient_id, p.first_name, p.last_name, t.trial_id, t.name AS trial_name
       FROM eligibility_reviews e
       JOIN patients p ON p.id=e.patient_ref
       JOIN trials t ON t.id=e.trial_ref
       ORDER BY e.created_at DESC`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/eligibility-reviews/run', requireRole('sponsor', 'pi'), async (req, res) => {
  const client = await pool.connect();
  try {
    const patient = await patientByAnyId(client, req.body?.patient_id || req.body?.patientId);
    const trial = await trialByAnyId(client, req.body?.trial_id || req.body?.trialId);
    if (!patient || !trial) return res.status(404).json({ error: 'Patient or trial not found' });
    const match = computeMatchScore(patient, trial);
    const flags = eligibilityFlags(patient, trial, match.score);
    const status = flags.some(f => f.status === 'potential_exclusion') ? 'potential_exclusion' : match.score >= 70 ? 'likely_eligible' : 'review_required';
    const existingMatch = await client.query(
      `INSERT INTO trial_matches (patient_ref, trial_ref, patient_id, trial_id, match_score, match_reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,'candidate')
       ON CONFLICT (patient_ref, trial_ref)
       DO UPDATE SET match_score=EXCLUDED.match_score, match_reason=EXCLUDED.match_reason, updated_at=NOW()
       RETURNING *`,
      [patient.id, trial.id, patient.patient_id, trial.trial_id, match.score, match.reason]
    );
    const r = await client.query(
      `INSERT INTO eligibility_reviews (match_id, patient_ref, trial_ref, status, score, criteria_flags, reviewer_notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [existingMatch.rows[0].id, patient.id, trial.id, status, match.score, JSON.stringify(flags), req.body?.reviewer_notes || null, req.user?.email || null]
    );
    res.status(201).json({ review: r.rows[0], patient, trial, disclaimer: DISCLAIMER });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { client.release(); }
});

router.get('/biomarkers', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.*, p.patient_id, p.first_name, p.last_name
       FROM patient_biomarkers b
       JOIN patients p ON p.id=b.patient_ref
       ORDER BY b.test_date DESC NULLS LAST, b.id DESC`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/drug-interactions', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM drug_interactions ORDER BY severity DESC, id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/outcomes', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, p.patient_id, p.first_name, p.last_name, t.trial_id, t.name AS trial_name
       FROM patient_outcomes o
       JOIN patients p ON p.id=o.patient_ref
       LEFT JOIN trials t ON t.id=o.trial_ref
       ORDER BY o.assessment_date DESC NULLS LAST, o.id DESC`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/retention-risk', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.*, t.name AS trial_name,
              CASE
                WHEN p.enrollment_status='withdrawn' THEN 'High'
                WHEN COALESCE(p.travel_minutes,0) > 120 OR p.caregiver_support=false THEN 'High'
                WHEN COALESCE(p.travel_minutes,0) > 75 OR p.enrollment_status='screening' THEN 'Medium'
                ELSE 'Low'
              END AS retention_risk,
              CONCAT_WS('; ',
                CASE WHEN COALESCE(p.travel_minutes,0) > 75 THEN 'travel burden' END,
                CASE WHEN p.caregiver_support=false THEN 'caregiver gap' END,
                CASE WHEN p.enrollment_status='screening' THEN 'screening conversion needed' END,
                CASE WHEN p.enrollment_status='withdrawn' THEN 'withdrawn history' END
              ) AS driver
       FROM patients p
       LEFT JOIN trials t ON t.trial_id=p.trial
       ORDER BY CASE
          WHEN p.enrollment_status='withdrawn' THEN 1
          WHEN COALESCE(p.travel_minutes,0) > 120 OR p.caregiver_support=false THEN 1
          WHEN COALESCE(p.travel_minutes,0) > 75 OR p.enrollment_status='screening' THEN 2
          ELSE 3
        END, p.id`
    );
    const high = r.rows.filter(x => x.retention_risk === 'High').length;
    const medium = r.rows.filter(x => x.retention_risk === 'Medium').length;
    res.json({
      summary: {
        high_risk_participants: high,
        medium_risk_participants: medium,
        outreach_priority: high ? 'Coordinator follow-up within 24 hours' : 'Standard coordinator queue',
      },
      participants: r.rows,
      interventions: [
        'Offer travel support before required on-site assessments.',
        'Switch eligible follow-ups to remote monitoring visits.',
        'Trigger coordinator outreach when travel burden and caregiver gaps stack.',
      ],
      disclaimer: DISCLAIMER,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
