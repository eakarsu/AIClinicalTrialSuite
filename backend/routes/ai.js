const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const {
  draftProtocol,
  recommendEndpoints,
  sizeCohort,
  selectSites,
  modelRisk,
  generateBrief,
  deviationClassifier,
  dsmbAlert,
  edcAnomaly,
  statisticalImbalance,
  expectedVsActual,
  irbPkgDrafter,
  queryResolver,
  milestoneForecaster,
  budgetBurn,
  regulatoryImpact,
} = require('../services/ai');

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function persist(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output, model) VALUES ($1,$2,$3,$4)',
      [feature, input, output, MODEL]
    );
  } catch (e) {
    console.warn('[ai_results] persist warning:', e.message);
  }
}

router.post('/draft-protocol', async (req, res) => {
  try {
    const result = await draftProtocol(req.body || {});
    await persist('draft-protocol', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/recommend-endpoints', async (req, res) => {
  try {
    const result = await recommendEndpoints(req.body || {});
    await persist('recommend-endpoints', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/size-cohort', async (req, res) => {
  try {
    const result = await sizeCohort(req.body || {});
    await persist('size-cohort', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/select-sites', async (req, res) => {
  try {
    let payload = req.body || {};
    if (!payload.sites || payload.sites.length === 0) {
      const r = await pool.query('SELECT site_id, name, city, country, principal_investigator, capacity, status FROM sites ORDER BY capacity DESC LIMIT 25');
      payload.sites = r.rows;
    }
    const result = await selectSites(payload);
    await persist('select-sites', { ...payload, sites_count: payload.sites?.length }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/model-risk', async (req, res) => {
  try {
    let payload = req.body || {};
    if (!payload.adverse_events && payload.trial?.trial_id) {
      const r = await pool.query('SELECT term, severity, serious, outcome FROM adverse_events WHERE trial=$1 ORDER BY reported_at DESC LIMIT 50', [payload.trial.trial_id]);
      payload.adverse_events = r.rows;
    }
    const result = await modelRisk(payload);
    await persist('model-risk', { trial: payload.trial, ae_count: payload.adverse_events?.length }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/generate-brief', async (req, res) => {
  try {
    const result = await generateBrief(req.body || {});
    await persist('generate-brief', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- 10 NEW AI VERBS ----------

router.post('/deviation-classifier', async (req, res) => {
  try {
    const result = await deviationClassifier(req.body || {});
    await persist('deviation-classifier', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/dsmb-alert', async (req, res) => {
  try {
    let payload = req.body || {};
    if (!payload.ae_data && payload.trial?.trial_id) {
      const r = await pool.query('SELECT term, severity, serious, outcome FROM adverse_events WHERE trial=$1 ORDER BY reported_at DESC LIMIT 50', [payload.trial.trial_id]);
      payload.ae_data = r.rows;
    }
    const result = await dsmbAlert(payload);
    await persist('dsmb-alert', { trial: payload.trial, ae_count: payload.ae_data?.length }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/edc-anomaly', async (req, res) => {
  try {
    const result = await edcAnomaly(req.body || {});
    await persist('edc-anomaly', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/statistical-imbalance', async (req, res) => {
  try {
    const result = await statisticalImbalance(req.body || {});
    await persist('statistical-imbalance', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/expected-vs-actual', async (req, res) => {
  try {
    const result = await expectedVsActual(req.body || {});
    await persist('expected-vs-actual', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/irb-pkg-drafter', async (req, res) => {
  try {
    const result = await irbPkgDrafter(req.body || {});
    await persist('irb-pkg-drafter', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/query-resolver', async (req, res) => {
  try {
    const result = await queryResolver(req.body || {});
    await persist('query-resolver', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/milestone-forecaster', async (req, res) => {
  try {
    let payload = req.body || {};
    if (!payload.milestones && payload.trial?.trial_id) {
      const r = await pool.query('SELECT name, target_date, actual_date, status FROM milestones WHERE trial=$1', [payload.trial.trial_id]);
      payload.milestones = r.rows;
    }
    const result = await milestoneForecaster(payload);
    await persist('milestone-forecaster', { trial: payload.trial, milestones_count: payload.milestones?.length }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/budget-burn', async (req, res) => {
  try {
    let payload = req.body || {};
    if (!payload.budgets && payload.trial?.trial_id) {
      const r = await pool.query('SELECT category, budgeted_usd, spent_usd, variance_pct, period FROM budgets WHERE trial=$1', [payload.trial.trial_id]);
      payload.budgets = r.rows;
    }
    const result = await budgetBurn(payload);
    await persist('budget-burn', { trial: payload.trial, budgets_count: payload.budgets?.length }, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/regulatory-impact', async (req, res) => {
  try {
    const result = await regulatoryImpact(req.body || {});
    await persist('regulatory-impact', req.body, result);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- Sample scenarios for "Sample Fill" buttons ----------
// Hardcoded 5 realistic clinical-trial scenarios per AI verb.
// Field names match each page's form `key` exactly so the frontend can
// merge {fieldName: value, ...} straight into its form state.
const SAMPLES = {
  'draft-protocol': [
    {
      label: 'NSCLC Phase 2 immunotherapy',
      values: {
        indication: 'Non-Small Cell Lung Cancer (PD-L1 TPS >= 50%)',
        phase: 'II',
        compound: 'Pembrolizumab (MK-3475) 200 mg Q3W',
        population: 'Adults with previously untreated metastatic NSCLC, PD-L1 TPS >= 50%, ECOG 0-1, no actionable EGFR/ALK alterations',
        sample_size: 180,
      },
    },
    {
      label: 'MDD Phase 3 SSRI vs placebo',
      values: {
        indication: 'Major Depressive Disorder (moderate-to-severe)',
        phase: 'III',
        compound: 'Escitalopram 20 mg QD vs placebo',
        population: 'Adults 18-65 with DSM-5 MDD, MADRS >= 26, failed <= 1 prior antidepressant in current episode',
        sample_size: 540,
      },
    },
    {
      label: 'T2DM Phase 2 GLP-1',
      values: {
        indication: 'Type 2 Diabetes Mellitus (inadequately controlled on metformin)',
        phase: 'II',
        compound: 'Semaglutide-analog NN9931 1.0 mg SC weekly',
        population: 'Adults with T2DM, HbA1c 7.5-10.5%, BMI 27-45, on stable metformin >= 1500 mg/day for >= 8 weeks',
        sample_size: 240,
      },
    },
    {
      label: 'RA Phase 3 JAK inhibitor',
      values: {
        indication: 'Moderate-to-Severe Rheumatoid Arthritis',
        phase: 'III',
        compound: 'Upadacitinib (ABT-494) 15 mg QD vs adalimumab 40 mg Q2W',
        population: 'Adults with active RA (ACR/EULAR 2010), DAS28-CRP > 3.2, inadequate response to MTX',
        sample_size: 1500,
      },
    },
    {
      label: 'AML Phase 1 dose-finding',
      values: {
        indication: 'Relapsed/Refractory Acute Myeloid Leukemia',
        phase: 'I',
        compound: 'Venetoclax (ABT-199) + azacitidine, 3+3 dose escalation 100/200/400/800 mg',
        population: 'Adults >= 18 with R/R AML ineligible for intensive chemotherapy, ECOG 0-2',
        sample_size: 36,
      },
    },
  ],

  'recommend-endpoints': [
    {
      label: 'MDD Phase 2 NMDA antagonist',
      values: {
        indication: 'Treatment-Resistant Major Depressive Disorder',
        phase: 'II',
        mechanism: 'NMDA receptor antagonist (S-enantiomer of ketamine, intranasal)',
      },
    },
    {
      label: 'NSCLC Phase 3 anti-PD-1',
      values: {
        indication: 'Metastatic Non-Small Cell Lung Cancer',
        phase: 'III',
        mechanism: 'Anti-PD-1 monoclonal antibody (humanised IgG4 kappa)',
      },
    },
    {
      label: 'T2DM Phase 3 GLP-1 agonist',
      values: {
        indication: 'Type 2 Diabetes Mellitus',
        phase: 'III',
        mechanism: 'Long-acting GLP-1 receptor agonist (once-weekly subcutaneous)',
      },
    },
    {
      label: 'Alzheimer Phase 2 anti-amyloid',
      values: {
        indication: 'Early Symptomatic Alzheimer Disease',
        phase: 'II',
        mechanism: 'Anti-amyloid-beta protofibril monoclonal antibody (humanised IgG1)',
      },
    },
    {
      label: 'HFrEF Phase 3 SGLT2 inhibitor',
      values: {
        indication: 'Heart Failure with Reduced Ejection Fraction (NYHA II-IV)',
        phase: 'III',
        mechanism: 'Selective SGLT2 inhibitor (once-daily oral)',
      },
    },
  ],

  'size-cohort': [
    {
      label: 'T2DM HbA1c primary endpoint',
      values: {
        primary_endpoint: 'Change from baseline in HbA1c at Week 52',
        effect_size: '0.4% absolute reduction vs placebo, SD 1.1%',
        alpha: 0.05,
        power: 0.9,
        dropout_rate: 0.15,
        allocation_ratio: '1:1',
      },
    },
    {
      label: 'NSCLC OS Phase 3',
      values: {
        primary_endpoint: 'Overall Survival (months) at primary analysis (450 events)',
        effect_size: 'HR 0.72 (median OS 16.0 vs 11.5 months)',
        alpha: 0.05,
        power: 0.9,
        dropout_rate: 0.05,
        allocation_ratio: '2:1',
      },
    },
    {
      label: 'MDD MADRS endpoint',
      values: {
        primary_endpoint: 'Change from baseline in MADRS total score at Week 8',
        effect_size: '3.0 point reduction vs placebo, SD 8.5',
        alpha: 0.05,
        power: 0.85,
        dropout_rate: 0.2,
        allocation_ratio: '1:1',
      },
    },
    {
      label: 'RA ACR20 response',
      values: {
        primary_endpoint: 'Proportion of subjects achieving ACR20 at Week 12',
        effect_size: '20% absolute difference (60% active vs 40% placebo)',
        alpha: 0.05,
        power: 0.9,
        dropout_rate: 0.1,
        allocation_ratio: '1:1:1',
      },
    },
    {
      label: 'AML CR rate Phase 1b',
      values: {
        primary_endpoint: 'Complete Remission (CR + CRi) rate at end of cycle 2',
        effect_size: 'CR rate 45% vs historical control 20%',
        alpha: 0.1,
        power: 0.8,
        dropout_rate: 0.1,
        allocation_ratio: 'single-arm',
      },
    },
  ],

  'select-sites': [
    {
      label: 'mBC Phase 3 (HR+/HER2-)',
      values: {
        indication: 'HR+/HER2- Metastatic Breast Cancer',
        phase: 'III',
        target_enrollment: 450,
      },
    },
    {
      label: 'NSCLC Phase 2',
      values: {
        indication: 'Non-Small Cell Lung Cancer (PD-L1 high)',
        phase: 'II',
        target_enrollment: 180,
      },
    },
    {
      label: 'MDD Phase 3 global',
      values: {
        indication: 'Major Depressive Disorder',
        phase: 'III',
        target_enrollment: 540,
      },
    },
    {
      label: 'Pediatric T1DM Phase 2',
      values: {
        indication: 'Pediatric Type 1 Diabetes (ages 6-17)',
        phase: 'II',
        target_enrollment: 120,
      },
    },
    {
      label: 'AML Phase 1 dose-escalation',
      values: {
        indication: 'Relapsed/Refractory Acute Myeloid Leukemia',
        phase: 'I',
        target_enrollment: 36,
      },
    },
  ],

  'model-risk': [
    {
      label: 'On-track NSCLC Phase 3',
      values: {
        trial_id: 'ONCO-LUNG-301',
        enrollment_lag_days: 5,
        protocol_deviations: 2,
      },
    },
    {
      label: 'Moderate slip — MDD Phase 3',
      values: {
        trial_id: 'NEURO-MDD-202',
        enrollment_lag_days: 30,
        protocol_deviations: 6,
      },
    },
    {
      label: 'Severe slip — RA Phase 3',
      values: {
        trial_id: 'IMMUN-RA-201',
        enrollment_lag_days: 75,
        protocol_deviations: 14,
      },
    },
    {
      label: 'Early signal — AML Phase 1',
      values: {
        trial_id: 'HEME-AML-201',
        enrollment_lag_days: 14,
        protocol_deviations: 4,
      },
    },
    {
      label: 'Crisis — site quality failures',
      values: {
        trial_id: 'ONCO-LUNG-301',
        enrollment_lag_days: 120,
        protocol_deviations: 28,
      },
    },
  ],

  'generate-brief': [
    { label: 'Steering committee update',         values: { trial_id: 'ONCO-LUNG-301', audience: 'Steering committee' } },
    { label: 'Investor quarterly readout',        values: { trial_id: 'NEURO-MDD-202', audience: 'Investors' } },
    { label: 'FDA Type B pre-meeting',            values: { trial_id: 'CARDIO-HF-301', audience: 'FDA / regulatory pre-meeting' } },
    { label: 'Internal R&D leadership review',    values: { trial_id: 'METAB-T2D-401', audience: 'Internal R&D leadership' } },
    { label: 'Site investigators newsletter',     values: { trial_id: 'ONCO-LUNG-301', audience: 'Site investigators' } },
  ],

  'deviation-classifier': [
    {
      label: 'Eligibility — ECOG out of range',
      values: {
        deviation: {
          deviation_id: 'DEV-NEW-001',
          trial: 'ONCO-LUNG-301',
          site: 'SITE-003 (Massachusetts General Hospital)',
          description: 'Patient PT-0042 enrolled with ECOG performance status 2; protocol requires ECOG 0-1.',
          root_cause: 'PI misread eligibility checklist during screening visit.',
        },
      },
    },
    {
      label: 'Dosing — wrong cycle dose',
      values: {
        deviation: {
          deviation_id: 'DEV-NEW-002',
          trial: 'ONCO-AML-101',
          site: 'SITE-007 (MD Anderson Cancer Center)',
          description: 'Cycle 3 venetoclax dose administered at 800 mg instead of protocol-specified 400 mg ramp.',
          root_cause: 'Pharmacy mis-transcription of dose-modification worksheet.',
        },
      },
    },
    {
      label: 'Visit window — outside +/- 3 days',
      values: {
        deviation: {
          deviation_id: 'DEV-NEW-003',
          trial: 'CARDIO-HF-202',
          site: 'SITE-011 (Charite Universitatsmedizin Berlin)',
          description: 'Week 24 efficacy visit performed on Day 175 (protocol window Day 168 +/- 3).',
          root_cause: 'Patient holiday travel; site CRC did not request advance window extension.',
        },
      },
    },
    {
      label: 'IC — outdated consent version',
      values: {
        deviation: {
          deviation_id: 'DEV-NEW-004',
          trial: 'NEURO-MDD-301',
          site: 'SITE-014 (Karolinska University Hospital)',
          description: 'Subject re-consented to ICF v2.1 instead of currently active v2.3 (released 2026-03-10).',
          root_cause: 'Site staff did not retire v2.1 from regulatory binder after amendment notification.',
        },
      },
    },
    {
      label: 'SAE reporting — late notification',
      values: {
        deviation: {
          deviation_id: 'DEV-NEW-005',
          trial: 'ONCO-LUNG-301',
          site: 'SITE-022 (Royal Marsden Hospital)',
          description: 'Grade 3 pneumonitis SAE reported to sponsor 48 hours after PI awareness (protocol requires 24h).',
          root_cause: 'On-call PI on flight; back-up sub-investigator not designated in delegation log.',
        },
      },
    },
  ],

  'dsmb-alert': [
    {
      label: 'NSCLC — pneumonitis cluster',
      values: {
        trial: { trial_id: 'ONCO-LUNG-301', name: 'KEYNOTE-NSCLC-III', indication: 'NSCLC' },
        ae_data: [
          { term: 'Pneumonitis', severity: 'Grade 3', serious: true,  outcome: 'Recovering' },
          { term: 'Pneumonitis', severity: 'Grade 4', serious: true,  outcome: 'Recovering' },
          { term: 'Pneumonitis', severity: 'Grade 2', serious: false, outcome: 'Recovered' },
          { term: 'Hypothyroidism', severity: 'Grade 1', serious: false, outcome: 'Ongoing' },
        ],
      },
    },
    {
      label: 'AML — tumor lysis + hepatotox',
      values: {
        trial: { trial_id: 'ONCO-AML-101', name: 'VEN-AZA-AML-1b', indication: 'AML' },
        ae_data: [
          { term: 'Tumor lysis syndrome', severity: 'Grade 4', serious: true, outcome: 'Recovered with sequelae' },
          { term: 'Hepatic enzyme increased', severity: 'Grade 3', serious: true, outcome: 'Recovering' },
          { term: 'Neutropenic fever', severity: 'Grade 4', serious: true, outcome: 'Recovered' },
        ],
      },
    },
    {
      label: 'MDD — suicidal ideation signal',
      values: {
        trial: { trial_id: 'NEURO-MDD-301', name: 'ESC-MDD-III', indication: 'Major Depressive Disorder' },
        ae_data: [
          { term: 'Suicidal ideation', severity: 'Moderate', serious: true,  outcome: 'Resolved' },
          { term: 'Suicidal ideation', severity: 'Severe',   serious: true,  outcome: 'Hospitalisation' },
          { term: 'Insomnia',          severity: 'Mild',     serious: false, outcome: 'Ongoing' },
        ],
      },
    },
    {
      label: 'RA — serious infection trend',
      values: {
        trial: { trial_id: 'IMMUN-RA-301', name: 'UPA-RA-III', indication: 'Rheumatoid Arthritis' },
        ae_data: [
          { term: 'Herpes zoster',            severity: 'Grade 3', serious: true,  outcome: 'Recovered' },
          { term: 'Pneumonia bacterial',      severity: 'Grade 3', serious: true,  outcome: 'Recovered' },
          { term: 'Tuberculosis reactivation',severity: 'Grade 4', serious: true,  outcome: 'Recovering' },
        ],
      },
    },
    {
      label: 'HFrEF — death imbalance flag',
      values: {
        trial: { trial_id: 'CARDIO-HF-202', name: 'SGLT2-HF-III', indication: 'Heart Failure rEF' },
        ae_data: [
          { term: 'Cardiac death',             severity: 'Grade 5', serious: true, outcome: 'Fatal' },
          { term: 'Diabetic ketoacidosis',     severity: 'Grade 4', serious: true, outcome: 'Recovered' },
          { term: 'Acute kidney injury',       severity: 'Grade 3', serious: true, outcome: 'Recovering' },
        ],
      },
    },
  ],

  'edc-anomaly': [
    {
      label: 'Vitals — outlier SBP',
      values: {
        edc_data: [
          { patient: 'PT-0001', visit: 'Week 4', sbp: 120, dbp: 80, weight_kg: 72.0 },
          { patient: 'PT-0002', visit: 'Week 4', sbp: 320, dbp: 60, weight_kg: 70.4 },
          { patient: 'PT-0003', visit: 'Week 4', sbp: 118, dbp: 78, weight_kg:  7.2 },
          { patient: 'PT-0004', visit: 'Week 4', sbp: 124, dbp: 82, weight_kg: 71.1 },
        ],
      },
    },
    {
      label: 'Labs — impossible HbA1c',
      values: {
        edc_data: [
          { patient: 'PT-0101', visit: 'Week 12', hba1c_pct: 7.4, fasting_glucose_mgdl: 142 },
          { patient: 'PT-0102', visit: 'Week 12', hba1c_pct: 25.6, fasting_glucose_mgdl: 165 },
          { patient: 'PT-0103', visit: 'Week 12', hba1c_pct: 7.1, fasting_glucose_mgdl: 9999 },
          { patient: 'PT-0104', visit: 'Week 12', hba1c_pct: 7.9, fasting_glucose_mgdl: 158 },
        ],
      },
    },
    {
      label: 'Dates — visit before screening',
      values: {
        edc_data: [
          { patient: 'PT-0201', screening_date: '2025-09-10', randomization_date: '2025-09-17', week4_date: '2025-10-15' },
          { patient: 'PT-0202', screening_date: '2025-09-12', randomization_date: '2025-09-05', week4_date: '2025-10-17' },
          { patient: 'PT-0203', screening_date: '2025-09-14', randomization_date: '2025-09-21', week4_date: '2026-04-01' },
        ],
      },
    },
    {
      label: 'AE term — non-MedDRA free text',
      values: {
        edc_data: [
          { patient: 'PT-0301', ae_term: 'Nausea', ae_grade: 1, serious: false },
          { patient: 'PT-0302', ae_term: 'felt bad in tummy', ae_grade: 2, serious: false },
          { patient: 'PT-0303', ae_term: 'Diarrhoea', ae_grade: 'severe???', serious: false },
          { patient: 'PT-0304', ae_term: 'Headache', ae_grade: 1, serious: true },
        ],
      },
    },
    {
      label: 'Dosing — duplicate cycle entry',
      values: {
        edc_data: [
          { patient: 'PT-0401', cycle: 1, dose_mg: 200, date: '2025-10-01' },
          { patient: 'PT-0401', cycle: 1, dose_mg: 200, date: '2025-10-01' },
          { patient: 'PT-0402', cycle: 1, dose_mg: 200, date: '2025-10-02' },
          { patient: 'PT-0403', cycle: 2, dose_mg:  -200, date: '2025-10-22' },
        ],
      },
    },
  ],

  'statistical-imbalance': [
    {
      label: 'NSCLC — age & sex imbalance',
      values: {
        arm_data: {
          arm_a: { n: 150, mean_age: 62, pct_female: 45, baseline_score: 12.3 },
          arm_b: { n: 148, mean_age: 58, pct_female: 62, baseline_score: 10.1 },
          target_power: 0.8,
          alpha: 0.05,
        },
      },
    },
    {
      label: 'MDD — baseline MADRS imbalance',
      values: {
        arm_data: {
          arm_a: { n: 270, mean_age: 41, pct_female: 64, baseline_madrs: 31.2 },
          arm_b: { n: 268, mean_age: 42, pct_female: 65, baseline_madrs: 27.9 },
          target_power: 0.85,
          alpha: 0.05,
        },
      },
    },
    {
      label: 'T2DM — HbA1c stratum off',
      values: {
        arm_data: {
          arm_a: { n: 240, mean_age: 57, pct_female: 48, baseline_hba1c: 8.6, pct_on_insulin: 22 },
          arm_b: { n: 242, mean_age: 56, pct_female: 49, baseline_hba1c: 7.8, pct_on_insulin: 11 },
          target_power: 0.9,
          alpha: 0.05,
        },
      },
    },
    {
      label: 'RA — disease severity skew',
      values: {
        arm_data: {
          arm_a: { n: 500, mean_age: 54, pct_female: 78, baseline_das28: 5.8, pct_prior_biologic: 18 },
          arm_b: { n: 498, mean_age: 53, pct_female: 79, baseline_das28: 5.1, pct_prior_biologic: 34 },
          arm_c: { n: 502, mean_age: 55, pct_female: 80, baseline_das28: 5.4, pct_prior_biologic: 22 },
          target_power: 0.9,
          alpha: 0.025,
        },
      },
    },
    {
      label: 'HFrEF — EF & NYHA imbalance',
      values: {
        arm_data: {
          arm_a: { n: 1500, mean_age: 67, pct_female: 31, mean_ef_pct: 28, pct_nyha_iii_iv: 60 },
          arm_b: { n: 1498, mean_age: 66, pct_female: 32, mean_ef_pct: 33, pct_nyha_iii_iv: 47 },
          target_power: 0.9,
          alpha: 0.05,
        },
      },
    },
  ],

  'expected-vs-actual': [
    {
      label: 'NSCLC pembrolizumab vs label',
      values: {
        trial: { trial_id: 'ONCO-LUNG-301', indication: 'NSCLC', compound: 'Pembrolizumab' },
        actual_ae_rates: {
          pneumonitis_any:    0.080,
          hypothyroidism:     0.105,
          colitis_grade3plus: 0.041,
          hepatitis_any:      0.063,
        },
      },
    },
    {
      label: 'AML venetoclax-aza',
      values: {
        trial: { trial_id: 'ONCO-AML-101', indication: 'AML', compound: 'Venetoclax + Azacitidine' },
        actual_ae_rates: {
          neutropenic_fever:       0.42,
          tumor_lysis_syndrome:    0.06,
          thrombocytopenia_g3plus: 0.45,
          pneumonia:               0.21,
        },
      },
    },
    {
      label: 'MDD escitalopram',
      values: {
        trial: { trial_id: 'NEURO-MDD-301', indication: 'Major Depressive Disorder', compound: 'Escitalopram' },
        actual_ae_rates: {
          nausea:              0.18,
          insomnia:            0.14,
          sexual_dysfunction:  0.09,
          suicidal_ideation:   0.012,
        },
      },
    },
    {
      label: 'T2DM semaglutide-analog',
      values: {
        trial: { trial_id: 'ENDO-T2DM-202', indication: 'Type 2 Diabetes', compound: 'Semaglutide-analog NN9931' },
        actual_ae_rates: {
          nausea:        0.31,
          vomiting:      0.14,
          diarrhoea:     0.13,
          pancreatitis:  0.004,
        },
      },
    },
    {
      label: 'RA upadacitinib',
      values: {
        trial: { trial_id: 'IMMUN-RA-301', indication: 'Rheumatoid Arthritis', compound: 'Upadacitinib 15 mg' },
        actual_ae_rates: {
          herpes_zoster:           0.034,
          serious_infection:       0.029,
          mace:                    0.005,
          venous_thromboembolism:  0.006,
        },
      },
    },
  ],

  'irb-pkg-drafter': [
    {
      label: 'NSCLC Phase 3 — MGH local IRB',
      values: {
        protocol: {
          protocol_id: 'PROT-ONCO-301-v1.0',
          trial: 'ONCO-LUNG-301',
          indication: 'NSCLC',
          phase: 'III',
          design: 'Randomized, double-blind, placebo-controlled, 2:1 active:placebo',
          population: 'Adults with metastatic NSCLC, PD-L1 TPS >= 1%, ECOG 0-1',
          site_irb: 'Mass General Brigham IRB',
        },
      },
    },
    {
      label: 'MDD Phase 3 — central IRB (Advarra)',
      values: {
        protocol: {
          protocol_id: 'PROT-NEURO-MDD-301-v2.1',
          trial: 'NEURO-MDD-301',
          indication: 'Major Depressive Disorder',
          phase: 'III',
          design: 'Randomized, double-blind, placebo-controlled, fixed-dose',
          population: 'Adults 18-65 with DSM-5 MDD, MADRS >= 26',
          site_irb: 'Advarra Central IRB',
        },
      },
    },
    {
      label: 'AML Phase 1 — MD Anderson IRB',
      values: {
        protocol: {
          protocol_id: 'PROT-ONCO-AML-101-v1.3',
          trial: 'ONCO-AML-101',
          indication: 'Relapsed/Refractory AML',
          phase: 'I',
          design: '3+3 dose escalation, single-arm, open-label',
          population: 'Adults >= 18 with R/R AML ineligible for intensive chemotherapy',
          site_irb: 'MD Anderson Cancer Center IRB',
        },
      },
    },
    {
      label: 'Pediatric T1DM — Boston Children EC',
      values: {
        protocol: {
          protocol_id: 'PROT-PEDS-T1DM-202-v1.0',
          trial: 'PEDS-T1DM-202',
          indication: 'Pediatric Type 1 Diabetes',
          phase: 'II',
          design: 'Randomized, double-blind, parallel-group',
          population: 'Children 6-17 with T1DM duration >= 1 year, HbA1c 7.5-10.0%',
          site_irb: 'Boston Children\'s Hospital Committee on Clinical Investigation',
        },
      },
    },
    {
      label: 'RA Phase 3 — Charite EC (EU lead)',
      values: {
        protocol: {
          protocol_id: 'PROT-IMMUN-RA-301-v3.0',
          trial: 'IMMUN-RA-301',
          indication: 'Moderate-to-Severe Rheumatoid Arthritis',
          phase: 'III',
          design: 'Randomized, double-blind, active-comparator (adalimumab)',
          population: 'Adults with active RA, DAS28-CRP > 3.2, inadequate MTX response',
          site_irb: 'Charite Universitatsmedizin Berlin Ethics Committee',
        },
      },
    },
  ],

  'query-resolver': [
    {
      label: 'NSCLC — missing PD-L1 TPS',
      values: {
        query: {
          query_id: 'Q-NEW-001',
          trial: 'ONCO-LUNG-301',
          patient: 'PT-0001',
          field: 'PD-L1 TPS (%)',
          question: 'TPS value missing from baseline pathology report — please clarify or upload PD-L1 IHC result.',
        },
      },
    },
    {
      label: 'T2DM — HbA1c unit ambiguity',
      values: {
        query: {
          query_id: 'Q-NEW-002',
          trial: 'ENDO-T2DM-202',
          patient: 'PT-0117',
          field: 'HbA1c at Week 24',
          question: 'Value entered as 58. Confirm unit — IFCC mmol/mol (58 = 7.5% DCCT) or % (58% is impossible).',
        },
      },
    },
    {
      label: 'MDD — MADRS item-9 outlier',
      values: {
        query: {
          query_id: 'Q-NEW-003',
          trial: 'NEURO-MDD-301',
          patient: 'PT-0042',
          field: 'MADRS item 9 (Pessimistic thoughts)',
          question: 'Item 9 = 6 (max). Verify scoring; if confirmed, ensure C-SSRS was administered same visit per protocol section 8.4.',
        },
      },
    },
    {
      label: 'AML — discrepant dose record',
      values: {
        query: {
          query_id: 'Q-NEW-004',
          trial: 'ONCO-AML-101',
          patient: 'PT-0007',
          field: 'Cycle 2 venetoclax dose',
          question: 'EDC shows 400 mg; pharmacy log shows 200 mg ramp. Confirm actual administered dose for Cycle 2 Day 1-3.',
        },
      },
    },
    {
      label: 'HFrEF — death narrative pending',
      values: {
        query: {
          query_id: 'Q-NEW-005',
          trial: 'CARDIO-HF-202',
          patient: 'PT-0234',
          field: 'SAE narrative — cardiac death',
          question: 'Death reported 2026-04-22 but narrative + autopsy report not yet attached. Adjudication committee needs by next DSMB meeting.',
        },
      },
    },
  ],

  'milestone-forecaster': [
    {
      label: 'NSCLC Phase 3 — on plan',
      values: {
        trial: { trial_id: 'ONCO-LUNG-301', indication: 'NSCLC', phase: 'III' },
        enrollment_curve: [
          { month: '2025-09', enrolled:   5 },
          { month: '2025-10', enrolled:  18 },
          { month: '2025-11', enrolled:  34 },
          { month: '2025-12', enrolled:  52 },
          { month: '2026-01', enrolled:  78 },
          { month: '2026-02', enrolled: 109 },
        ],
      },
    },
    {
      label: 'MDD Phase 3 — slow ramp',
      values: {
        trial: { trial_id: 'NEURO-MDD-301', indication: 'Major Depressive Disorder', phase: 'III' },
        enrollment_curve: [
          { month: '2025-10', enrolled:  3 },
          { month: '2025-11', enrolled:  8 },
          { month: '2025-12', enrolled: 14 },
          { month: '2026-01', enrolled: 19 },
          { month: '2026-02', enrolled: 24 },
        ],
      },
    },
    {
      label: 'T2DM Phase 2 — ahead of plan',
      values: {
        trial: { trial_id: 'ENDO-T2DM-202', indication: 'Type 2 Diabetes', phase: 'II' },
        enrollment_curve: [
          { month: '2025-11', enrolled:  12 },
          { month: '2025-12', enrolled:  41 },
          { month: '2026-01', enrolled:  82 },
          { month: '2026-02', enrolled: 138 },
          { month: '2026-03', enrolled: 195 },
        ],
      },
    },
    {
      label: 'RA Phase 3 — global stall',
      values: {
        trial: { trial_id: 'IMMUN-RA-301', indication: 'Rheumatoid Arthritis', phase: 'III' },
        enrollment_curve: [
          { month: '2025-08', enrolled:  20 },
          { month: '2025-09', enrolled:  55 },
          { month: '2025-10', enrolled:  88 },
          { month: '2025-11', enrolled:  96 },
          { month: '2025-12', enrolled: 102 },
          { month: '2026-01', enrolled: 110 },
        ],
      },
    },
    {
      label: 'AML Phase 1 — rare-disease cadence',
      values: {
        trial: { trial_id: 'ONCO-AML-101', indication: 'Relapsed/Refractory AML', phase: 'I' },
        enrollment_curve: [
          { month: '2025-10', enrolled:  2 },
          { month: '2025-11', enrolled:  3 },
          { month: '2025-12', enrolled:  5 },
          { month: '2026-01', enrolled:  7 },
          { month: '2026-02', enrolled:  9 },
          { month: '2026-03', enrolled: 12 },
        ],
      },
    },
  ],

  'budget-burn': [
    {
      label: 'NSCLC Phase 3 — Q1 burn',
      values: {
        trial: { trial_id: 'ONCO-LUNG-301', phase: 'III' },
        budgets: [
          { category: 'Site grants',     budgeted_usd: 18000000, spent_usd:  9200000, variance_pct:  2.5, period: '2025-Q4-2026-Q1' },
          { category: 'CRO services',    budgeted_usd: 12000000, spent_usd:  7100000, variance_pct: 18.0, period: '2025-Q4-2026-Q1' },
          { category: 'Lab / central',   budgeted_usd:  4500000, spent_usd:  1900000, variance_pct: -5.0, period: '2025-Q4-2026-Q1' },
          { category: 'Drug supply',     budgeted_usd:  6000000, spent_usd:  2400000, variance_pct:  0.0, period: '2025-Q4-2026-Q1' },
        ],
      },
    },
    {
      label: 'MDD Phase 3 — overspend',
      values: {
        trial: { trial_id: 'NEURO-MDD-301', phase: 'III' },
        budgets: [
          { category: 'Site grants',     budgeted_usd: 9000000, spent_usd: 6800000, variance_pct: 24.0, period: 'YTD-2026' },
          { category: 'CRO services',    budgeted_usd: 5000000, spent_usd: 4100000, variance_pct: 19.0, period: 'YTD-2026' },
          { category: 'Imaging / rater', budgeted_usd: 2500000, spent_usd: 1900000, variance_pct: 15.0, period: 'YTD-2026' },
        ],
      },
    },
    {
      label: 'T2DM Phase 2 — under-spend',
      values: {
        trial: { trial_id: 'ENDO-T2DM-202', phase: 'II' },
        budgets: [
          { category: 'Site grants',     budgeted_usd: 3000000, spent_usd: 1200000, variance_pct: -22.0, period: 'YTD-2026' },
          { category: 'CRO services',    budgeted_usd: 2000000, spent_usd:  900000, variance_pct: -15.0, period: 'YTD-2026' },
          { category: 'Central lab',     budgeted_usd:  900000, spent_usd:  350000, variance_pct:  -8.0, period: 'YTD-2026' },
        ],
      },
    },
    {
      label: 'RA Phase 3 — mid-trial review',
      values: {
        trial: { trial_id: 'IMMUN-RA-301', phase: 'III' },
        budgets: [
          { category: 'Site grants',         budgeted_usd: 24000000, spent_usd: 18500000, variance_pct:  8.0, period: 'inception-to-date' },
          { category: 'CRO services',        budgeted_usd: 14000000, spent_usd: 12700000, variance_pct: 14.0, period: 'inception-to-date' },
          { category: 'Drug + comparator',   budgeted_usd: 11000000, spent_usd:  8900000, variance_pct:  5.0, period: 'inception-to-date' },
          { category: 'DSMB / IDMC',         budgeted_usd:   600000, spent_usd:   520000, variance_pct: 12.0, period: 'inception-to-date' },
        ],
      },
    },
    {
      label: 'AML Phase 1 — small-trial pace',
      values: {
        trial: { trial_id: 'ONCO-AML-101', phase: 'I' },
        budgets: [
          { category: 'Site grants',     budgeted_usd:  900000, spent_usd: 320000, variance_pct:  -3.0, period: 'YTD-2026' },
          { category: 'Translational',   budgeted_usd:  600000, spent_usd: 410000, variance_pct:  12.0, period: 'YTD-2026' },
          { category: 'Drug supply',     budgeted_usd:  400000, spent_usd: 180000, variance_pct:   0.0, period: 'YTD-2026' },
        ],
      },
    },
  ],

  'regulatory-impact': [
    {
      label: 'NSCLC — expand PD-L1 sub-cohort',
      values: {
        amendment: {
          amendment_id: 'AMD-NEW-001',
          trial: 'ONCO-LUNG-301',
          version: '1.2',
          summary: 'Expand eligibility to include PD-L1 TPS 1-49% sub-cohort; add PD-L1 as stratification factor; sample size increases 600 -> 720.',
        },
      },
    },
    {
      label: 'MDD — add open-label extension',
      values: {
        amendment: {
          amendment_id: 'AMD-NEW-002',
          trial: 'NEURO-MDD-301',
          version: '2.4',
          summary: 'Add 52-week open-label extension period after primary 8-week double-blind phase; updated ICF and long-term safety reporting plan required.',
        },
      },
    },
    {
      label: 'T2DM — change primary endpoint timing',
      values: {
        amendment: {
          amendment_id: 'AMD-NEW-003',
          trial: 'ENDO-T2DM-202',
          version: '1.1',
          summary: 'Move primary endpoint analysis timepoint from Week 26 to Week 52; secondary endpoints unchanged. Adds 6-month extension to all subjects currently enrolled.',
        },
      },
    },
    {
      label: 'RA — DLT-driven dose-modification rules',
      values: {
        amendment: {
          amendment_id: 'AMD-NEW-004',
          trial: 'IMMUN-RA-301',
          version: '3.1',
          summary: 'Tighten dose-modification rules following 4 cases of Grade 3 herpes zoster: mandatory VZV vaccination >= 4 weeks pre-randomization and treatment hold for any serious infection.',
        },
      },
    },
    {
      label: 'AML — add expansion cohort',
      values: {
        amendment: {
          amendment_id: 'AMD-NEW-005',
          trial: 'ONCO-AML-101',
          version: '1.4',
          summary: 'Add 20-subject expansion cohort at RP2D (400 mg) in IDH1-mutant subgroup with paired bone-marrow biomarker sampling at Day 1 and Day 28.',
        },
      },
    },
  ],
};

// Pass 8/9: samples for the newer features live in samplesExtra.js so this
// legacy registry stays untouched; merged here at lookup time.
const EXTRA_SAMPLES = require('./samplesExtra');

router.get('/samples', (req, res) => {
  const feature = req.query.feature;
  if (!feature) return res.status(400).json({ error: 'feature query param required' });
  const samples = SAMPLES[feature] || EXTRA_SAMPLES[feature];
  if (!samples) return res.status(404).json({ error: `no samples for feature '${feature}'` });
  res.json({ samples });
});

// History
async function listHistory(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const feature = req.query.feature;
    const where = feature ? 'WHERE feature=$3' : '';
    const params = feature ? [limit, offset, feature] : [limit, offset];
    const r = await pool.query(`SELECT id, feature, input, output, model, created_at FROM ai_results ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params);
    res.json({ data: r.rows, pagination: { page, limit } });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

router.get('/results', listHistory);
router.get('/history', listHistory);

module.exports = router;
