function clean(value) {
  return String(value || '').toLowerCase().trim();
}

function splitTerms(value) {
  return clean(value).split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}

function phaseBonus(phase) {
  const p = clean(phase);
  if (p.includes('iii') || p.includes('phase 3')) return 15;
  if (p.includes('ii') || p.includes('phase 2')) return 10;
  if (p.includes('iv') || p.includes('phase 4')) return 10;
  if (p.includes('i') || p.includes('phase 1')) return 5;
  return 0;
}

function computeMatchScore(patient, trial) {
  const diagnosis = clean(patient.diagnosis);
  const indication = clean(trial.indication);
  const criteria = `${trial.eligibility_criteria || ''} ${trial.recruitment_summary || ''} ${trial.description || ''}`.toLowerCase();
  const reasons = [];
  let score = 0;
  if (diagnosis && indication) {
    const head = diagnosis.split(/\s+/)[0];
    if (indication.includes(diagnosis) || diagnosis.includes(indication) || indication.includes(head)) {
      score += 40;
      reasons.push(`Diagnosis aligns with ${trial.indication}`);
    }
  }
  let hits = 0;
  for (const b of splitTerms(patient.biomarkers)) {
    const token = b.split(/\s+/)[0];
    if (token && (criteria.includes(token) || indication.includes(token))) hits += 1;
  }
  if (hits) {
    score += Math.min(30, hits * 15);
    reasons.push(`${hits} biomarker signal(s) found`);
  }
  const bonus = phaseBonus(trial.phase);
  if (bonus) score += bonus;
  if (clean(trial.status) === 'recruiting') score += 10;
  if (patient.travel_minutes > 90) {
    score -= 5;
    reasons.push('Travel burden');
  }
  return { score: Math.max(0, Math.min(100, Math.round(score))), reason: reasons.join('; ') || 'No strong criteria match found' };
}

module.exports = async function seedRecruitment(client) {
  const profiles = [
    ['PT-0001', 'Ava', 'Miller', '1962-04-11', 'female', 'ava.miller@example.test', '617-555-0101', 'Non-Small Cell Lung Cancer', 'Stage IV', 'PD-L1 65%, EGFR wild type', 'Former smoker; controlled hypertension', 'lisinopril, atorvastatin', 35, true, 'MRN-10001'],
    ['PT-0002', 'Noah', 'Wilson', '1958-09-23', 'male', 'noah.wilson@example.test', '212-555-0102', 'Non-Small Cell Lung Cancer', 'Stage IV', 'PD-L1 10%, ALK negative', 'Type 2 diabetes', 'metformin, insulin glargine', 95, true, 'MRN-10002'],
    ['PT-0003', 'Mia', 'Garcia', '1971-01-09', 'female', 'mia.garcia@example.test', '713-555-0103', 'Non-Small Cell Lung Cancer', 'Stage IIIB', 'EGFR exon 19 deletion', 'Mild COPD', 'albuterol', 125, false, 'MRN-10003'],
    ['PT-0004', 'Ethan', 'Brown', '1984-06-02', 'male', 'ethan.brown@example.test', '410-555-0104', 'Major Depressive Disorder', 'Treatment Resistant', 'MADRS 35', 'Prior SSRI/SNRI failure', 'sertraline, quetiapine', 20, true, 'MRN-10004'],
    ['PT-0005', 'Sophia', 'Davis', '1990-11-18', 'female', 'sophia.davis@example.test', '216-555-0105', 'Major Depressive Disorder', 'Treatment Resistant', 'MADRS 31', 'Comorbid anxiety', 'venlafaxine', 55, true, 'MRN-10005'],
    ['PT-0006', 'Liam', 'Martinez', '1966-08-30', 'male', 'liam.martinez@example.test', '507-555-0106', 'Type 2 Diabetes Mellitus', 'High CV Risk', 'HbA1c 8.6%, BMI 34', 'Obesity; hypertension', 'metformin, losartan', 40, true, 'MRN-10006'],
    ['PT-0007', 'Olivia', 'Anderson', '1955-03-14', 'female', 'olivia.anderson@example.test', '416-555-0107', 'Type 2 Diabetes Mellitus', 'High CV Risk', 'HbA1c 7.9%, eGFR 62', 'CKD stage 2', 'metformin, empagliflozin', 80, true, 'MRN-10007'],
    ['PT-0008', 'Lucas', 'Thomas', '1978-12-04', 'male', 'lucas.thomas@example.test', '030-555-0108', 'Rheumatoid Arthritis', 'Moderate', 'CRP 12 mg/L, RF positive', 'Methotrexate inadequate response', 'methotrexate, prednisone', 65, true, 'MRN-10008'],
    ['PT-0009', 'Emma', 'Moore', '1969-05-29', 'female', 'emma.moore@example.test', '331-555-0109', 'HR+/HER2- Metastatic Breast Cancer', 'Metastatic', 'HER2 negative, Trop-2 high', 'Prior endocrine therapy', 'letrozole', 45, true, 'MRN-10009'],
    ['PT-0010', 'James', 'Taylor', '1974-10-12', 'male', 'james.taylor@example.test', '046-555-0110', 'HR+/HER2- Metastatic Breast Cancer', 'Metastatic', 'HER2 low', 'Bone metastases', 'palbociclib', 140, false, 'MRN-10010'],
    ['PT-0011', 'Isabella', 'Lee', '1952-07-21', 'female', 'isabella.lee@example.test', '507-555-0111', 'Heart Failure with Reduced Ejection Fraction', 'NYHA II', 'LVEF 32%, NT-proBNP high', 'Prior hospitalization', 'sacubitril/valsartan, carvedilol', 50, true, 'MRN-10011'],
    ['PT-0012', 'Benjamin', 'White', '1948-02-16', 'male', 'ben.white@example.test', '617-555-0112', 'Early Alzheimer Disease', 'MCI', 'Amyloid positive, MMSE 25', 'Mild cognitive impairment', 'donepezil', 70, true, 'MRN-10012'],
    ['PT-0013', 'Charlotte', 'Harris', '2023-08-01', 'female', 'charlotte.harris@example.test', '410-555-0113', 'Spinal Muscular Atrophy Type 1', 'Infantile', 'SMN1 deletion', 'Feeding support', 'nusinersen', 25, true, 'MRN-10013'],
    ['PT-0014', 'Henry', 'Clark', '1997-09-09', 'male', 'henry.clark@example.test', '415-555-0114', 'Seasonal Influenza Prophylaxis', 'Healthy Adult', 'HAI baseline low', 'No major conditions', 'none', 15, true, 'MRN-10014'],
    ['PT-0015', 'Amelia', 'Lewis', '1982-04-25', 'female', 'amelia.lewis@example.test', '020-555-0115', 'Crohn Disease', 'Moderate-Severe', 'CRP elevated, fecal calprotectin high', 'Prior anti-TNF failure', 'adalimumab', 110, false, 'MRN-10015'],
  ];

  for (const p of profiles) {
    await client.query(
      `UPDATE patients
       SET first_name=$2, last_name=$3, date_of_birth=$4, gender=$5, email=$6, phone=$7,
           diagnosis=$8, stage=$9, biomarkers=$10, medical_history=$11, current_medications=$12,
           travel_minutes=$13, caregiver_support=$14, mrn=$15, source='merged-demo'
       WHERE patient_id=$1`,
      p
    );
  }

  const trialDetails = [
    ['ONCO-LUNG-301', 'Adults with metastatic nonsquamous NSCLC. Requires ECOG 0-1 and measurable RECIST disease. Includes PD-L1 testing; excludes EGFR/ALK actionable mutations.', 'First-line metastatic NSCLC recruitment with PD-L1 stratification.'],
    ['NEURO-MDD-202', 'Adults with treatment-resistant major depressive disorder and MADRS >= 28 after inadequate antidepressant response.', 'Psychiatry site recruitment with rapid screening emphasis.'],
    ['METAB-T2D-401', 'Adults with type 2 diabetes, HbA1c 7.0-10.5%, BMI >= 27, and elevated cardiovascular risk.', 'Long-term outcomes recruitment for metabolic disease.'],
    ['ONCO-BREAST-302', 'Adults with HR+/HER2- metastatic breast cancer after endocrine therapy. Trop-2 expression documented when available.', 'Oncology recruitment for metastatic breast cancer.'],
    ['CARDIO-HF-301', 'Adults with symptomatic HFrEF, LVEF <= 40%, elevated natriuretic peptide, and stable guideline-directed therapy.', 'Heart failure recruitment using site cardiology networks.'],
    ['NEURO-AD-202', 'Adults with early symptomatic Alzheimer disease, positive amyloid confirmation, MMSE 22-30.', 'Memory clinic recruitment with amyloid confirmation.'],
    ['RARE-SMA-103', 'Pediatric patients with SMA Type 1 and confirmed SMN1 deletion.', 'Rare disease recruitment requiring caregiver coordination.'],
    ['INF-FLU-202', 'Healthy adults 18-49 with no immunocompromising condition and low baseline influenza antibody titers.', 'Vaccine recruitment among healthy adults.'],
    ['GI-IBD-301', 'Adults with moderate-to-severe Crohn disease and objective inflammation by CRP or fecal calprotectin.', 'GI recruitment after biologic screening.'],
  ];
  for (const t of trialDetails) {
    await client.query(
      `UPDATE trials SET eligibility_criteria=$2, recruitment_summary=$3, description=COALESCE(description, name), target_enrollment=COALESCE(target_enrollment, 300), current_enrollment=COALESCE(current_enrollment, 0)
       WHERE trial_id=$1`,
      t
    );
  }

  const patients = (await client.query('SELECT * FROM patients ORDER BY id')).rows;
  const trials = (await client.query("SELECT * FROM trials WHERE status IN ('recruiting','active','planning') ORDER BY id")).rows;
  let matchCount = 0;
  for (const patient of patients) {
    const ranked = trials
      .map(trial => ({ trial, ...computeMatchScore(patient, trial) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    for (const item of ranked) {
      const status = item.score >= 75 ? 'screening' : 'candidate';
      const r = await client.query(
        `INSERT INTO trial_matches (patient_ref, trial_ref, patient_id, trial_id, match_score, match_reason, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (patient_ref, trial_ref) DO NOTHING RETURNING id`,
        [patient.id, item.trial.id, patient.patient_id, item.trial.trial_id, item.score, item.reason, status]
      );
      if (r.rows.length) matchCount += 1;
    }
  }

  const reviews = (await client.query('SELECT * FROM trial_matches WHERE match_score >= 70 ORDER BY match_score DESC LIMIT 15')).rows;
  for (const m of reviews) {
    await client.query(
      `INSERT INTO eligibility_reviews (match_id, patient_ref, trial_ref, status, score, criteria_flags, reviewer_notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'seed')`,
      [
        m.id, m.patient_ref, m.trial_ref, Number(m.match_score) >= 80 ? 'likely_eligible' : 'review_required', m.match_score,
        JSON.stringify([
          { criterion: 'Indication', status: 'likely_met', evidence: m.match_reason },
          { criterion: 'Biomarkers', status: m.match_reason.includes('biomarker') ? 'likely_met' : 'review' },
          { criterion: 'Clinical review', status: 'required' },
        ]),
        'Seeded from deterministic matching run',
      ]
    );
  }

  const biomarkers = [
    ['PT-0001', 'PD-L1', '65', '%', '2024-08-25', 'Oncology', 'positive', 'High expression supports immunotherapy screening'],
    ['PT-0003', 'EGFR exon 19', 'detected', null, '2024-08-30', 'Genomics', 'positive', 'May exclude from wild-type NSCLC protocols'],
    ['PT-0006', 'HbA1c', '8.6', '%', '2023-11-10', 'Metabolic', 'elevated', 'Supports diabetes eligibility'],
    ['PT-0009', 'HER2', 'negative', null, '2025-01-20', 'Oncology', 'negative', 'Supports HR+/HER2- classification'],
    ['PT-0012', 'Amyloid PET', 'positive', null, '2024-07-02', 'Neurology', 'positive', 'Supports Alzheimer disease confirmation'],
    ['PT-0013', 'SMN1', 'biallelic deletion', null, '2024-02-20', 'Genomics', 'positive', 'Confirms SMA Type 1 diagnosis'],
  ];
  for (const b of biomarkers) {
    await client.query(
      `INSERT INTO patient_biomarkers (patient_ref, name, value, unit, test_date, category, status, significance)
       SELECT id,$2,$3,$4,$5,$6,$7,$8 FROM patients WHERE patient_id=$1`,
      b
    );
  }

  const interactions = [
    ['sertraline', 'esketamine', 'pharmacodynamic', 'moderate', 'Additive CNS effects and sedation risk.', 'Monitor blood pressure and sedation during dosing.', 'label', 'CNS depression'],
    ['metformin', 'iodinated contrast', 'renal safety', 'moderate', 'Potential lactic acidosis risk in renal impairment.', 'Hold per institutional policy around contrast exposure.', 'guideline', 'renal clearance'],
    ['prednisone', 'upadacitinib', 'immunosuppression', 'high', 'Combined immunosuppression may increase infection risk.', 'Screen infection risk and minimize steroid dose.', 'label', 'immune suppression'],
    ['adalimumab', 'risankizumab', 'biologic overlap', 'high', 'Overlapping biologic immune modulation.', 'Require washout before enrollment.', 'expert review', 'cytokine pathway blockade'],
  ];
  for (const d of interactions) {
    await client.query(
      `INSERT INTO drug_interactions (drug_a, drug_b, interaction_type, severity, description, recommendation, evidence_level, mechanism)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      d
    );
  }

  const outcomes = [
    ['PT-0001', 'ONCO-LUNG-301', 'response', 'RECIST ORR', 'Partial Response', null, '2025-02-01', 'observed', 'Durable response likely if early imaging maintained.', 0.74, 'Week 12 scan'],
    ['PT-0004', 'NEURO-MDD-202', 'symptom', 'MADRS change', '-14', 'points', '2024-06-01', 'observed', 'Likely clinically meaningful symptom improvement.', 0.68, 'Day 28 assessment'],
    ['PT-0006', 'METAB-T2D-401', 'lab', 'HbA1c change', '-1.2', '%', '2024-03-01', 'observed', 'Metabolic response consistent with adherence.', 0.71, 'Quarterly lab'],
    ['PT-0011', 'CARDIO-HF-301', 'functional', '6MWD', '+42', 'm', '2024-09-01', 'observed', 'Functional improvement with stable therapy.', 0.63, 'Clinic assessment'],
  ];
  for (const o of outcomes) {
    await client.query(
      `INSERT INTO patient_outcomes (patient_ref, trial_ref, outcome_type, endpoint, value, unit, assessment_date, status, prediction, confidence, notes)
       SELECT p.id, t.id, $3,$4,$5,$6,$7,$8,$9,$10,$11
       FROM patients p, trials t WHERE p.patient_id=$1 AND t.trial_id=$2`,
      o
    );
  }

  console.log(`Seeded recruitment profiles, ${matchCount} trial matches, ${reviews.length} eligibility reviews`);
};
