/* ============================================================
   Sample scenarios for pass 7/8/9 features.
   Same shape as the SAMPLES registry in routes/ai.js:
     { feature: [ { label, values: {field: value} }, ... ] }
   routes/ai.js merges this into GET /api/ai/samples so both the
   shared AIPage scaffold and the SampleButtons component pick
   them up automatically. Every scenario fills ALL fields of its
   page, including optional ones.
   ============================================================ */

module.exports = {
  /* ---------- pass 7 (AIPage-based, previously had no samples) ---------- */
  'power-calc-explain': [
    { label: 'Phase III superiority (90% power)', values: { alpha: 0.05, power: 0.9, mde: 5, sd: 12, dropout_rate: 0.15, two_sided: true } },
    { label: 'Phase II signal-finding (80% power)', values: { alpha: 0.1, power: 0.8, mde: 8, sd: 15, dropout_rate: 0.2, two_sided: true } },
    { label: 'Tight-margin cardiology outcome', values: { alpha: 0.025, power: 0.9, mde: 3, sd: 10, dropout_rate: 0.1, two_sided: false } },
  ],
  'patient-burden': [
    { label: 'Oncology imaging-heavy schedule', values: { visits: [
      { name: 'Screening', travel_minutes: 60, procedures: [
        { name: 'Informed consent', minutes: 30 },
        { name: 'Tumor biopsy', minutes: 90 },
        { name: 'CT chest/abdomen/pelvis', minutes: 60 },
        { name: 'Labs + ECG', minutes: 35 },
      ] },
      { name: 'Cycle 1 Day 1', travel_minutes: 60, procedures: [
        { name: 'Physical exam', minutes: 20 },
        { name: 'Infusion', minutes: 120 },
        { name: 'PK sampling', minutes: 45 },
      ] },
      { name: 'Week 12 response assessment', travel_minutes: 60, procedures: [
        { name: 'CT imaging', minutes: 60 },
        { name: 'PRO questionnaires', minutes: 25 },
        { name: 'Safety labs', minutes: 15 },
      ] },
    ] } },
    { label: 'Psychiatry supervised dosing', values: { visits: [
      { name: 'Screening', travel_minutes: 35, procedures: [
        { name: 'Informed consent', minutes: 30 },
        { name: 'MINI diagnostic interview', minutes: 60 },
        { name: 'MADRS + C-SSRS', minutes: 45 },
      ] },
      { name: 'Twice-weekly dosing visit', travel_minutes: 35, procedures: [
        { name: 'Pre-dose vitals', minutes: 10 },
        { name: 'Supervised intranasal dosing', minutes: 15 },
        { name: 'Post-dose observation', minutes: 120 },
      ] },
      { name: 'Week 8 endpoint visit', travel_minutes: 35, procedures: [
        { name: 'MADRS blinded rater assessment', minutes: 40 },
        { name: 'Safety labs', minutes: 15 },
        { name: 'Exit counseling', minutes: 20 },
      ] },
    ] } },
    { label: 'Remote-first metabolic trial', values: { visits: [
      { name: 'Screening', travel_minutes: 25, procedures: [
        { name: 'Consent + eligibility', minutes: 35 },
        { name: 'HbA1c lab draw', minutes: 15 },
        { name: 'Vitals', minutes: 10 },
      ] },
      { name: 'Telehealth Week 4', travel_minutes: 0, procedures: [
        { name: 'Video visit', minutes: 25 },
        { name: 'ePRO completion', minutes: 10 },
      ] },
      { name: 'Week 26 clinic visit', travel_minutes: 25, procedures: [
        { name: 'HbA1c lab draw', minutes: 15 },
        { name: 'Weight + vitals', minutes: 10 },
        { name: 'Medication accountability', minutes: 15 },
      ] },
    ] } },
  ],
  'ie-optimizer': [
    { label: 'NSCLC 1L immunotherapy', values: { indication: 'Metastatic non-small cell lung cancer, first line', phase: 'III', current_inclusion: 'Age >= 18; ECOG 0-1; measurable disease per RECIST 1.1; adequate organ function; PD-L1 TPS >= 1%.', current_exclusion: 'Untreated brain metastases; prior PD-1/PD-L1 therapy; autoimmune disease requiring systemic therapy; EGFR/ALK driver mutations.', enrollment_target: 720, screen_fail_rate_pct: 45 } },
    { label: 'TRD esketamine study', values: { indication: 'Treatment-resistant major depressive disorder', phase: 'II', current_inclusion: 'Age 18-65; MADRS >= 28; failure of >= 2 adequate antidepressant trials in current episode.', current_exclusion: 'Psychotic features; substance use disorder within 6 months; uncontrolled hypertension; active suicidal intent requiring inpatient care.', enrollment_target: 180, screen_fail_rate_pct: 38 } },
    { label: 'Pediatric T1DM prevention', values: { indication: 'Stage 2 type 1 diabetes in pediatric patients', phase: 'II', current_inclusion: 'Age 8-17; two or more diabetes-related autoantibodies; dysglycemia on OGTT; parent/guardian consent and child assent.', current_exclusion: 'Clinical diabetes diagnosis; immunosuppressive therapy within 3 months; active infection; prior investigational immune therapy.', enrollment_target: 120, screen_fail_rate_pct: 52 } },
  ],
  'ind-nda-section': [
    { label: 'Module 2.5 — NSCLC clinical overview', values: { section: 'Module 2.5 Clinical Overview', indication: 'Metastatic non-squamous NSCLC, first line', compound: 'Pembrolizumab (MK-3475) + pemetrexed', program_stage: 'Phase 3 primary analysis complete; ORR 41%, median PFS 8.9 months, no new safety signal.' } },
    { label: 'Module 2.7 — TRD safety summary', values: { section: 'Module 2.7 Clinical Summary', indication: 'Treatment-resistant depression', compound: 'Esketamine nasal spray 56/84 mg', program_stage: 'NDA safety pool n=1708; common TEAEs dissociation, dizziness, nausea; discontinuation rate 6 per 100 patient-years.' } },
    { label: 'IB clinical experience — AML', values: { section: 'Investigator\'s Brochure — Clinical Experience', indication: 'Relapsed/refractory AML', compound: 'Venetoclax + azacitidine', program_stage: 'Dose escalation complete; RP2D selected; expansion cohort enrolling IDH1-mutant subgroup.' } },
  ],
  'dropout-predictor': [
    { label: 'Oncology, long treatment', values: { indication: 'Metastatic melanoma', phase: 'III', duration_weeks: 104, visit_frequency: 'weekly labs during first 2 cycles, imaging every 6 weeks', population: 'Median age 64, ECOG 0-1, 40% rural patients driving >1h to site', placebo_arm: false } },
    { label: 'Psychiatry, frequent visits', values: { indication: 'Treatment-resistant depression', phase: 'II', duration_weeks: 16, visit_frequency: 'twice-weekly supervised dosing with 2h post-dose observation', population: 'Working-age adults, 55% employed full time, MADRS >= 28', placebo_arm: true } },
    { label: 'Metabolic, remote-friendly', values: { indication: 'Type 2 diabetes with obesity', phase: 'III', duration_weeks: 52, visit_frequency: 'monthly telehealth plus quarterly clinic labs', population: 'Adults with HbA1c 7.5-10.5%, BMI 30-45 on stable metformin', placebo_arm: true } },
  ],
  'adaptive-sim': [
    { label: 'Group-sequential OS trial', values: { design_family: 'Group-sequential (O\'Brien-Fleming)', indication: 'Metastatic NSCLC', phase: 'III', primary_endpoint: 'Overall survival', planned_n: 600, interim_fractions: '0.5, 0.75' } },
    { label: 'Bayesian dose-finding', values: { design_family: 'Bayesian adaptive dose-finding', indication: 'Pulmonary arterial hypertension', phase: 'II', primary_endpoint: 'Change in 6-minute walk distance at Week 24', planned_n: 240, interim_fractions: '0.25, 0.5, 0.75' } },
    { label: 'Sample-size re-estimation', values: { design_family: 'Blinded sample-size re-estimation', indication: 'Treatment-resistant depression', phase: 'III', primary_endpoint: 'Change from baseline in MADRS at Week 8', planned_n: 520, interim_fractions: '0.5' } },
  ],
  'rwe-match': [
    { label: 'Rare disease external control', values: { indication: 'Spinal muscular atrophy type 1', target_population: 'Infants with genetically confirmed SMA type 1, symptomatic before 6 months, no prior gene therapy', target_outcome: 'Event-free survival at 14 months', proposed_use: 'External control arm for single-arm gene therapy expansion using natural-history registry and claims linkage' } },
    { label: 'Hybrid oncology control', values: { indication: 'Relapsed/refractory AML', target_population: 'Adults >= 18 with R/R AML after 1-2 prior lines, ECOG 0-2, molecular annotation available', target_outcome: 'Overall survival and composite complete remission', proposed_use: 'Hybrid control with reduced concurrent randomized control and EHR-derived external cohort' } },
    { label: 'Post-market safety comparator', values: { indication: 'Heart failure with reduced ejection fraction', target_population: 'Adults with HFrEF on guideline-directed medical therapy, excluding recent decompensation hospitalization', target_outcome: 'Hospitalization for heart failure and MACE', proposed_use: 'External comparator for post-authorization safety and effectiveness study' } },
  ],

  /* ---------- custom AI/AI-comparison feature surfaces ---------- */
  'comparable-trials': [
    { label: 'NSCLC Phase III', values: { indication: 'Non-Small Cell Lung Cancer', phase: 'III', limit: 10 } },
    { label: 'Treatment-resistant depression Phase II', values: { indication: 'Treatment-Resistant Major Depressive Disorder', phase: 'II', limit: 8 } },
    { label: 'Heart failure outcomes', values: { indication: 'Heart Failure with Reduced Ejection Fraction', phase: 'III', limit: 12 } },
    { label: 'Rare SMA gene therapy', values: { indication: 'Spinal Muscular Atrophy Type 1', phase: 'I/II', limit: 10 } },
  ],
  'protocol-version-graph': [
    { label: 'ONCO-LUNG-301', values: { trial: 'ONCO-LUNG-301' } },
    { label: 'NEURO-MDD-202', values: { trial: 'NEURO-MDD-202' } },
    { label: 'METAB-T2D-401', values: { trial: 'METAB-T2D-401' } },
    { label: 'ONCO-BREAST-302', values: { trial: 'ONCO-BREAST-302' } },
  ],
  'recruitment-matching': [
    { label: 'NSCLC high match', values: { patient_id: 'PT-0001', trial_id: 'ONCO-LUNG-301' } },
    { label: 'TRD psychiatry match', values: { patient_id: 'PT-0004', trial_id: 'NEURO-MDD-202' } },
    { label: 'Diabetes outcomes match', values: { patient_id: 'PT-0006', trial_id: 'METAB-T2D-401' } },
    { label: 'Alzheimer amyloid match', values: { patient_id: 'PT-0012', trial_id: 'NEURO-AD-202' } },
  ],

  /* ---------- pass 8 ---------- */
  'meddra-code': [
    { label: '3 common AE verbatims', values: { terms: 'severe headache with nausea\nelevated liver enzymes\ninjection site redness and swelling' } },
    { label: 'Oncology AE verbatims', values: { terms: 'grade 3 neutropenic fever\nperipheral tingling in both hands\npatient reports severe fatigue limiting daily activities\nmucositis of mouth' } },
    { label: 'Cardio-metabolic verbatims', values: { terms: 'dizziness on standing up\nfast irregular heartbeat\nswollen ankles both sides\nlow blood sugar episode at night' } },
  ],
  'safety-narrative': [
    { label: 'Seeded event AE-0001', values: { event_id: 'AE-0001' } },
    { label: 'Seeded event AE-0004', values: { event_id: 'AE-0004' } },
    { label: 'Seeded event AE-0006', values: { event_id: 'AE-0006' } },
  ],
  'dsmb-packet': [
    { label: 'ONCO-LUNG-301 (Phase III NSCLC)', values: { trial: 'ONCO-LUNG-301' } },
    { label: 'NEURO-MDD-202 (Phase II TRD)', values: { trial: 'NEURO-MDD-202' } },
    { label: 'CARDIO-HF-301 (Phase III HF)', values: { trial: 'CARDIO-HF-301' } },
  ],
  'enrollment-forecast': [
    { label: 'ONCO-LUNG-301 to N=120', values: { trial: 'ONCO-LUNG-301', target_n: 120 } },
    { label: 'NEURO-MDD-202 to N=80', values: { trial: 'NEURO-MDD-202', target_n: 80 } },
    { label: 'METAB-T2D-401 to N=300', values: { trial: 'METAB-T2D-401', target_n: 300 } },
  ],
  'randomization-scheme': [
    { label: '1:1 two-arm, ECOG-stratified', values: { scheme_id: 'RND-DEMO-11', trial: 'ONCO-MEL-301', block_size: 4, arms: '[{"name":"Nivolumab + Relatlimab","ratio":1},{"name":"Nivolumab","ratio":1}]', strata: '["ECOG 0-1","ECOG 2"]', category_schema: '[{"category":"treatment_arm","source":"arms","allowed_values":["Nivolumab + Relatlimab","Nivolumab"],"use_in_randomization":true,"use_in_irt":true},{"category":"performance_status","source":"strata","allowed_values":["ECOG 0-1","ECOG 2"],"use_in_randomization":true,"use_in_irt":true}]', seed: 'demo-mel-2026' } },
    { label: '2:1 allocation, unstratified', values: { scheme_id: 'RND-DEMO-21', trial: 'RARE-SMA-103', block_size: 6, arms: '[{"name":"Gene Therapy","ratio":2},{"name":"Sham","ratio":1}]', strata: '[]', category_schema: '[{"category":"treatment_arm","source":"arms","allowed_values":["Gene Therapy","Sham"],"use_in_randomization":true,"use_in_irt":true},{"category":"supply_blinding","source":"irt","allowed_values":["blinded-kit"],"use_in_randomization":false,"use_in_irt":true}]', seed: 'demo-sma-2026' } },
    { label: '3-arm dose-finding', values: { scheme_id: 'RND-DEMO-3A', trial: 'VASC-PAH-201', block_size: 6, arms: '[{"name":"Low Dose","ratio":1},{"name":"High Dose","ratio":1},{"name":"Placebo","ratio":1}]', strata: '["Functional Class II","Functional Class III"]', category_schema: '[{"category":"dose_group","source":"arms","allowed_values":["Low Dose","High Dose","Placebo"],"use_in_randomization":true,"use_in_irt":true},{"category":"functional_class","source":"strata","allowed_values":["Functional Class II","Functional Class III"],"use_in_randomization":true,"use_in_irt":true}]', seed: 'demo-pah-2026' } },
  ],
  'sdtm-export': [
    { label: 'DM — all trials', values: { domain: 'DM', trial: '' } },
    { label: 'AE — ONCO-LUNG-301', values: { domain: 'AE', trial: 'ONCO-LUNG-301' } },
    { label: 'DV — NEURO-MDD-202', values: { domain: 'DV', trial: 'NEURO-MDD-202' } },
  ],
  'form-1572': [
    { label: 'INV-001 on ONCO-LUNG-301', values: { investigator_id: 'INV-001', trial: 'ONCO-LUNG-301' } },
    { label: 'INV-002 on NEURO-MDD-202', values: { investigator_id: 'INV-002', trial: 'NEURO-MDD-202' } },
    { label: 'INV-003, no protocol', values: { investigator_id: 'INV-003', trial: '' } },
  ],

  /* ---------- pass 9 ---------- */
  'design-power': [
    { label: 'Continuous — Phase III (n=85/arm)', values: { endpoint_type: 'continuous', delta: 5, sd: 10, p1: 0.6, p2: 0.4, alpha: 0.05, power: 0.9, dropout_rate: 0.1 } },
    { label: 'Binary — 60% vs 40% response', values: { endpoint_type: 'binary', delta: 5, sd: 10, p1: 0.6, p2: 0.4, alpha: 0.05, power: 0.8, dropout_rate: 0.15 } },
    { label: 'Small effect, high power', values: { endpoint_type: 'continuous', delta: 2, sd: 10, p1: 0.55, p2: 0.45, alpha: 0.05, power: 0.95, dropout_rate: 0.2 } },
  ],
  'design-simulate': [
    { label: 'Type I check (null, K=3)', values: { n_per_arm: 85, delta: 0, looks: 3, alpha: 0.05, sims: 8000, seed: 'gsd-2026' } },
    { label: 'Power under d=0.5, K=3', values: { n_per_arm: 85, delta: 0.5, looks: 3, alpha: 0.05, sims: 8000, seed: 'gsd-2026' } },
    { label: 'Aggressive early stopping, K=5', values: { n_per_arm: 120, delta: 0.4, looks: 5, alpha: 0.05, sims: 10000, seed: 'gsd-k5' } },
  ],
  'ctgov-search': [
    { label: 'NSCLC + pembrolizumab, recruiting', values: { condition: 'non small cell lung cancer', term: 'pembrolizumab', status: 'RECRUITING' } },
    { label: 'Treatment-resistant depression', values: { condition: 'treatment resistant depression', term: 'esketamine', status: '' } },
    { label: 'Heart failure, completed', values: { condition: 'heart failure', term: '', status: 'COMPLETED' } },
  ],
  'econsent-sign': [
    { label: 'Main-study consent, PT-0002', values: { form_id: 'ICF-ONCO-301', patient: 'PT-0002', meaning: 'Consent obtained from subject', password: 'trial2026' } },
    { label: 'Re-consent after amendment, PT-0003', values: { form_id: 'ICF-ONCO-301', patient: 'PT-0003', meaning: 'Re-consent after amendment', password: 'trial2026' } },
    { label: 'NEURO-MDD consent, PT-0006', values: { form_id: 'ICF-NEURO-202', patient: 'PT-0006', meaning: 'Consent obtained from subject', password: 'trial2026' } },
  ],
};
