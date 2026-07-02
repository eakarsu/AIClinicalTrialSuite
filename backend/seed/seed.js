const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'clinical_trial_suite',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS webhook_deliveries CASCADE;
      DROP TABLE IF EXISTS webhooks CASCADE;
      DROP TABLE IF EXISTS attachments CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS patient_outcomes CASCADE;
      DROP TABLE IF EXISTS drug_interactions CASCADE;
      DROP TABLE IF EXISTS patient_biomarkers CASCADE;
      DROP TABLE IF EXISTS eligibility_reviews CASCADE;
      DROP TABLE IF EXISTS trial_matches CASCADE;
      DROP TABLE IF EXISTS supply_shipments CASCADE;
      DROP TABLE IF EXISTS regulatory_submissions CASCADE;
      DROP TABLE IF EXISTS vendors_cro CASCADE;
      DROP TABLE IF EXISTS budgets CASCADE;
      DROP TABLE IF EXISTS milestones CASCADE;
      DROP TABLE IF EXISTS data_locks CASCADE;
      DROP TABLE IF EXISTS queries CASCADE;
      DROP TABLE IF EXISTS monitoring_visits CASCADE;
      DROP TABLE IF EXISTS deviations CASCADE;
      DROP TABLE IF EXISTS amendments CASCADE;
      DROP TABLE IF EXISTS ai_results CASCADE;
      DROP TABLE IF EXISTS adverse_events CASCADE;
      DROP TABLE IF EXISTS endpoints CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
      DROP TABLE IF EXISTS investigators CASCADE;
      DROP TABLE IF EXISTS protocols CASCADE;
      DROP TABLE IF EXISTS compounds CASCADE;
      DROP TABLE IF EXISTS sites CASCADE;
      DROP TABLE IF EXISTS trials CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    const schema = fs.readFileSync(path.join(__dirname, '../migrations/001_schema.sql'), 'utf-8');
    await client.query(schema);

    // Apply all later migrations too (seed drops everything, so 001 alone loses pass-7 tables)
    const migrationsDir = path.join(__dirname, '../migrations');
    const later = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== '001_schema.sql')
      .sort();
    for (const f of later) {
      await client.query(fs.readFileSync(path.join(migrationsDir, f), 'utf-8'));
      console.log(`Applied migration ${f}`);
    }

    // ---------- TRIALS (15) ----------
    const trials = [
      ['ONCO-LUNG-301', 'A Phase III Study of MK-3475 in Combination with Pemetrexed for First-Line Treatment of Metastatic NSCLC', 'Non-Small Cell Lung Cancer', 'III', 'recruiting', 'Merck Sharp & Dohme', '2024-09-01'],
      ['NEURO-MDD-202', 'Phase II Randomized Study of Esketamine Nasal Spray for Treatment-Resistant Major Depressive Disorder', 'Major Depressive Disorder', 'II', 'active', 'Janssen Pharmaceuticals', '2024-04-15'],
      ['METAB-T2D-401', 'Long-Term Cardiovascular Outcomes Trial of Tirzepatide in Adults with Type 2 Diabetes', 'Type 2 Diabetes Mellitus', 'IV', 'active', 'Eli Lilly', '2023-11-01'],
      ['IMMUN-RA-201', 'Phase II Study of JAK1-Selective Inhibitor Upadacitinib in Moderate-to-Severe Rheumatoid Arthritis', 'Rheumatoid Arthritis', 'II', 'completed', 'AbbVie', '2023-02-10'],
      ['ONCO-BREAST-302', 'Phase III Trial of Sacituzumab Govitecan vs Standard of Care in HR+/HER2- Metastatic Breast Cancer', 'HR+/HER2- Metastatic Breast Cancer', 'III', 'recruiting', 'Gilead Sciences', '2025-01-20'],
      ['CARDIO-HF-301', 'Phase III Study of Vericiguat in Heart Failure with Reduced Ejection Fraction', 'Heart Failure with Reduced Ejection Fraction', 'III', 'active', 'Bayer / MSD', '2024-06-01'],
      ['NEURO-AD-202', 'Phase II Anti-Amyloid Therapy in Early Symptomatic Alzheimer Disease', 'Early Alzheimer Disease', 'II', 'recruiting', 'Eisai / Biogen', '2024-08-12'],
      ['RARE-SMA-103', 'Phase I/II Gene Therapy Study of Onasemnogene Abeparvovec in Spinal Muscular Atrophy Type 1', 'Spinal Muscular Atrophy Type 1', 'I/II', 'active', 'Novartis Gene Therapies', '2024-03-01'],
      ['ONCO-MEL-301', 'Phase III Adjuvant Nivolumab + Relatlimab in Resected Stage III Melanoma', 'Resected Stage III Melanoma', 'III', 'planning', 'Bristol Myers Squibb', '2025-06-01'],
      ['INF-FLU-202', 'Phase II Study of a Universal Influenza mRNA Vaccine in Healthy Adults', 'Seasonal Influenza Prophylaxis', 'II', 'recruiting', 'Moderna', '2025-02-15'],
      ['GI-IBD-301', 'Phase III Trial of Risankizumab Maintenance in Moderately-to-Severely Active Crohn Disease', 'Crohn Disease', 'III', 'active', 'AbbVie', '2024-01-10'],
      ['HEME-AML-201', 'Phase II Venetoclax + Azacitidine in Newly Diagnosed AML Unfit for Intensive Chemotherapy', 'Acute Myeloid Leukemia', 'II', 'completed', 'AbbVie / Genentech', '2022-05-01'],
      ['DERM-PSO-302', 'Phase III Bimekizumab vs Secukinumab in Moderate-to-Severe Plaque Psoriasis', 'Plaque Psoriasis', 'III', 'halted', 'UCB Biopharma', '2023-09-15'],
      ['VASC-PAH-201', 'Phase II Sotatercept in Pulmonary Arterial Hypertension on Background Therapy', 'Pulmonary Arterial Hypertension', 'II', 'active', 'Merck Sharp & Dohme', '2024-07-01'],
      ['RENAL-CKD-301', 'Phase III Finerenone in Non-Diabetic Chronic Kidney Disease', 'Non-Diabetic CKD Stage 3-4', 'III', 'recruiting', 'Bayer', '2025-03-10'],
    ];
    for (const t of trials) {
      await client.query(
        `INSERT INTO trials (trial_id, name, indication, phase, status, sponsor, start_date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        t
      );
    }
    console.log(`Seeded ${trials.length} trials`);

    // ---------- SITES (15) ----------
    const sites = [
      ['SITE-001', 'Massachusetts General Hospital', 'Boston', 'USA', 'Dr. Bruce Chabner', 80, 'active'],
      ['SITE-002', 'Memorial Sloan Kettering Cancer Center', 'New York', 'USA', 'Dr. Charles Rudin', 95, 'active'],
      ['SITE-003', 'MD Anderson Cancer Center', 'Houston', 'USA', 'Dr. Roy Herbst', 110, 'active'],
      ['SITE-004', 'Dana-Farber Cancer Institute', 'Boston', 'USA', 'Dr. Pasi Janne', 70, 'active'],
      ['SITE-005', 'Mayo Clinic Rochester', 'Rochester', 'USA', 'Dr. Alex Adjei', 65, 'active'],
      ['SITE-006', 'Charite Universitaetsmedizin Berlin', 'Berlin', 'Germany', 'Prof. Dr. Ulrich Keilholz', 60, 'active'],
      ['SITE-007', 'Royal Marsden Hospital', 'London', 'United Kingdom', 'Prof. James Larkin', 55, 'active'],
      ['SITE-008', 'Institut Gustave Roussy', 'Villejuif', 'France', 'Prof. Fabrice Andre', 75, 'active'],
      ['SITE-009', 'Karolinska University Hospital', 'Stockholm', 'Sweden', 'Prof. Jonas Bergh', 50, 'active'],
      ['SITE-010', 'National Cancer Center Hospital', 'Tokyo', 'Japan', 'Dr. Yasuhiro Fujiwara', 65, 'active'],
      ['SITE-011', 'Princess Margaret Cancer Centre', 'Toronto', 'Canada', 'Dr. Lillian Siu', 60, 'active'],
      ['SITE-012', 'Cleveland Clinic', 'Cleveland', 'USA', 'Dr. Brian Bolwell', 70, 'active'],
      ['SITE-013', 'Johns Hopkins Hospital', 'Baltimore', 'USA', 'Dr. Drew Pardoll', 85, 'active'],
      ['SITE-014', 'University of California San Francisco', 'San Francisco', 'USA', 'Dr. Pamela Munster', 75, 'recruiting'],
      ['SITE-015', 'Universitatsklinikum Heidelberg', 'Heidelberg', 'Germany', 'Prof. Dirk Jaeger', 55, 'pending_activation'],
    ];
    for (const s of sites) {
      await client.query(
        `INSERT INTO sites (site_id, name, city, country, principal_investigator, capacity, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        s
      );
    }
    console.log(`Seeded ${sites.length} sites`);

    // ---------- PROTOCOLS (15) ----------
    const protocols = [
      ['PROT-ONCO-301-v1.0', 'ONCO-LUNG-301', '1.0', 'approved', 'IRB Mass General', '2024-08-15'],
      ['PROT-ONCO-301-v1.1', 'ONCO-LUNG-301', '1.1', 'in_review', null, null],
      ['PROT-NEURO-202-v2.0', 'NEURO-MDD-202', '2.0', 'approved', 'Janssen Safety Board', '2024-03-20'],
      ['PROT-METAB-401-v1.0', 'METAB-T2D-401', '1.0', 'approved', 'FDA SPA', '2023-10-01'],
      ['PROT-IMMUN-201-v3.0', 'IMMUN-RA-201', '3.0', 'final', 'AbbVie GCP', '2023-01-25'],
      ['PROT-ONCO-302-v1.0', 'ONCO-BREAST-302', '1.0', 'approved', 'Gilead Medical Monitor', '2024-12-10'],
      ['PROT-CARDIO-301-v1.2', 'CARDIO-HF-301', '1.2', 'approved', 'Bayer-MSD Joint Committee', '2024-05-15'],
      ['PROT-NEURO-AD-202-v1.0', 'NEURO-AD-202', '1.0', 'approved', 'Eisai Medical', '2024-07-20'],
      ['PROT-RARE-103-v1.0', 'RARE-SMA-103', '1.0', 'approved', 'FDA RMAT', '2024-02-10'],
      ['PROT-ONCO-MEL-301-v0.9', 'ONCO-MEL-301', '0.9', 'draft', null, null],
      ['PROT-INF-202-v1.0', 'INF-FLU-202', '1.0', 'approved', 'Moderna Clinical Ops', '2025-01-30'],
      ['PROT-GI-301-v2.1', 'GI-IBD-301', '2.1', 'approved', 'AbbVie GCP', '2023-12-15'],
      ['PROT-HEME-201-v1.0', 'HEME-AML-201', '1.0', 'final', 'Genentech Safety', '2022-04-15'],
      ['PROT-DERM-302-v1.0', 'DERM-PSO-302', '1.0', 'halted', 'DSMB', '2024-02-28'],
      ['PROT-VASC-201-v1.1', 'VASC-PAH-201', '1.1', 'approved', 'MSD Medical', '2024-06-25'],
    ];
    for (const p of protocols) {
      await client.query(
        `INSERT INTO protocols (protocol_id, trial, version, status, approved_by, approved_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        p
      );
    }
    console.log(`Seeded ${protocols.length} protocols`);

    // ---------- INVESTIGATORS (15) ----------
    const investigators = [
      ['INV-001', 'Dr. Bruce Chabner', 'MD, Professor of Medicine', 'SITE-001', 'Medical Oncology', 12, 'ABIM Oncology; GCP'],
      ['INV-002', 'Dr. Charles Rudin', 'MD PhD, Chief Thoracic Oncology', 'SITE-002', 'Thoracic Oncology', 18, 'ABIM Oncology; GCP; NCI-CTEP'],
      ['INV-003', 'Dr. Roy Herbst', 'MD PhD, Deputy Director', 'SITE-003', 'Thoracic / Head & Neck Oncology', 22, 'ABIM Oncology; GCP'],
      ['INV-004', 'Dr. Pasi Janne', 'MD PhD, Director Lowe Center', 'SITE-004', 'Thoracic Oncology', 20, 'ABIM Oncology; GCP; FDA Advisor'],
      ['INV-005', 'Dr. Alex Adjei', 'MD PhD, Chair Oncology', 'SITE-005', 'Medical Oncology', 16, 'ABIM Oncology; GCP'],
      ['INV-006', 'Prof. Dr. Ulrich Keilholz', 'MD, Director Comprehensive Cancer Center', 'SITE-006', 'Medical Oncology', 14, 'EMA GCP; ESMO'],
      ['INV-007', 'Prof. James Larkin', 'MD PhD, Consultant Medical Oncology', 'SITE-007', 'Melanoma / GU Oncology', 19, 'MHRA GCP; ESMO'],
      ['INV-008', 'Prof. Fabrice Andre', 'MD PhD, Research Director', 'SITE-008', 'Breast Oncology', 21, 'ANSM GCP; ESMO'],
      ['INV-009', 'Prof. Jonas Bergh', 'MD PhD, Professor Oncology', 'SITE-009', 'Breast Oncology', 17, 'EMA GCP; ESMO'],
      ['INV-010', 'Dr. Yasuhiro Fujiwara', 'MD PhD, Vice President', 'SITE-010', 'Early Phase / Translational', 24, 'PMDA GCP; JSMO'],
      ['INV-011', 'Dr. Lillian Siu', 'MD, Senior Medical Oncologist', 'SITE-011', 'Phase I / Head & Neck', 26, 'Health Canada GCP; ASCO'],
      ['INV-012', 'Dr. Brian Bolwell', 'MD, Chair Taussig Cancer Institute', 'SITE-012', 'Hematology / BMT', 15, 'ABIM Hematology; GCP'],
      ['INV-013', 'Dr. Drew Pardoll', 'MD PhD, Director Bloomberg-Kimmel', 'SITE-013', 'Cancer Immunotherapy', 23, 'ABIM Oncology; GCP'],
      ['INV-014', 'Dr. Pamela Munster', 'MD, Professor of Medicine', 'SITE-014', 'Early Phase / Breast', 18, 'ABIM Oncology; GCP'],
      ['INV-015', 'Prof. Dirk Jaeger', 'MD, Director Med Oncology', 'SITE-015', 'GI / Immuno-Oncology', 12, 'EMA GCP; ESMO'],
    ];
    for (const i of investigators) {
      await client.query(
        `INSERT INTO investigators (investigator_id, name, title, site, specialty, trials_count, certifications) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        i
      );
    }
    console.log(`Seeded ${investigators.length} investigators`);

    // ---------- PATIENTS (15) ----------
    const patients = [
      ['PT-0001', 'ONCO-LUNG-301', 'SITE-001', 'enrolled', '2024-09-12', 'Pembrolizumab + Pemetrexed'],
      ['PT-0002', 'ONCO-LUNG-301', 'SITE-002', 'enrolled', '2024-09-18', 'Placebo + Pemetrexed'],
      ['PT-0003', 'ONCO-LUNG-301', 'SITE-003', 'screening', null, 'TBD'],
      ['PT-0004', 'NEURO-MDD-202', 'SITE-013', 'enrolled', '2024-05-02', 'Esketamine 84 mg'],
      ['PT-0005', 'NEURO-MDD-202', 'SITE-012', 'enrolled', '2024-05-09', 'Placebo Nasal'],
      ['PT-0006', 'METAB-T2D-401', 'SITE-005', 'active_followup', '2023-12-01', 'Tirzepatide 10 mg'],
      ['PT-0007', 'METAB-T2D-401', 'SITE-011', 'active_followup', '2023-12-08', 'Standard of Care'],
      ['PT-0008', 'IMMUN-RA-201', 'SITE-006', 'completed', '2023-03-10', 'Upadacitinib 15 mg'],
      ['PT-0009', 'ONCO-BREAST-302', 'SITE-008', 'enrolled', '2025-02-04', 'Sacituzumab Govitecan'],
      ['PT-0010', 'ONCO-BREAST-302', 'SITE-009', 'screening', null, 'TBD'],
      ['PT-0011', 'CARDIO-HF-301', 'SITE-005', 'enrolled', '2024-06-20', 'Vericiguat 10 mg'],
      ['PT-0012', 'NEURO-AD-202', 'SITE-004', 'screening', null, 'TBD'],
      ['PT-0013', 'RARE-SMA-103', 'SITE-013', 'enrolled', '2024-03-15', 'Onasemnogene Abeparvovec single infusion'],
      ['PT-0014', 'INF-FLU-202', 'SITE-014', 'enrolled', '2025-03-01', 'mRNA-1010 50 mcg'],
      ['PT-0015', 'GI-IBD-301', 'SITE-007', 'withdrawn', '2024-02-12', 'Risankizumab 180 mg SC'],
    ];
    for (const p of patients) {
      await client.query(
        `INSERT INTO patients (patient_id, trial, site, enrollment_status, enrolled_at, arm) VALUES ($1,$2,$3,$4,$5,$6)`,
        p
      );
    }
    console.log(`Seeded ${patients.length} patients`);

    // ---------- COMPOUNDS (15) ----------
    const compounds = [
      ['CMP-001', 'MK-3475', 'Pembrolizumab',         'Oncology / Immuno-Oncology', 'Anti-PD-1 monoclonal antibody',                              'Approved', 0.10],
      ['CMP-002', 'JNJ-54135419', 'Esketamine',       'Neuropsychiatry',            'NMDA receptor antagonist (S-enantiomer of ketamine)',         'Approved', 285.00],
      ['CMP-003', 'LY3298176', 'Tirzepatide',         'Metabolic',                  'Dual GIP/GLP-1 receptor agonist',                             'Approved', 0.81],
      ['CMP-004', 'ABT-494', 'Upadacitinib',          'Immunology',                 'Selective JAK1 inhibitor',                                    'Approved', 43.00],
      ['CMP-005', 'IMMU-132', 'Sacituzumab Govitecan','Oncology',                   'Trop-2 directed antibody-drug conjugate (SN-38 payload)',     'Approved', 5.20],
      ['CMP-006', 'BAY 1021189', 'Vericiguat',        'Cardiovascular',             'Soluble guanylate cyclase stimulator',                        'Approved', 1.40],
      ['CMP-007', 'BAN2401', 'Lecanemab',             'Neurology / Alzheimer',      'Anti-amyloid-beta protofibril monoclonal antibody',           'Approved', 0.43],
      ['CMP-008', 'AVXS-101', 'Onasemnogene Abeparvovec','Rare / Neuromuscular',    'AAV9 SMN1 gene replacement therapy',                          'Approved', null],
      ['CMP-009', 'BMS-986213', 'Relatlimab',         'Oncology / Immuno-Oncology', 'Anti-LAG-3 monoclonal antibody',                              'Approved', 0.85],
      ['CMP-010', 'mRNA-1010', 'Quadrivalent Influenza mRNA Vaccine','Infectious Disease','Lipid nanoparticle-encapsulated mRNA encoding HA antigens','II', null],
      ['CMP-011', 'BI 655066', 'Risankizumab',        'Immunology',                 'Anti-IL-23 p19 monoclonal antibody',                          'Approved', 0.06],
      ['CMP-012', 'ABT-199', 'Venetoclax',            'Hematology / Oncology',      'Selective BCL-2 inhibitor',                                   'Approved', 0.01],
      ['CMP-013', 'UCB4940', 'Bimekizumab',           'Immunology / Dermatology',   'Selective IL-17A and IL-17F dual inhibitor',                  'Approved', 0.30],
      ['CMP-014', 'ACE-011', 'Sotatercept',           'Cardiovascular / Rare',      'Activin signaling inhibitor (ActRIIA-Fc fusion)',             'Approved', null],
      ['CMP-015', 'BAY 94-8862', 'Finerenone',        'Nephrology / Cardio-Renal',  'Non-steroidal selective mineralocorticoid receptor antagonist','Approved', 17.80],
    ];
    for (const c of compounds) {
      await client.query(
        `INSERT INTO compounds (compound_id, code, generic_name, therapeutic_area, mechanism, phase_max_reached, ic50_nm) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        c
      );
    }
    console.log(`Seeded ${compounds.length} compounds`);

    // ---------- ENDPOINTS (15) ----------
    const endpoints = [
      ['EP-001', 'ONCO-LUNG-301', 'primary',     'Overall Survival (OS)',                                  'Until death from any cause', 'Stratified log-rank test; Cox proportional hazards model'],
      ['EP-002', 'ONCO-LUNG-301', 'secondary',   'Progression-Free Survival per RECIST v1.1',              'Up to 36 months',            'Kaplan-Meier; stratified log-rank'],
      ['EP-003', 'ONCO-LUNG-301', 'secondary',   'Objective Response Rate (ORR)',                          '24 weeks',                   'Cochran-Mantel-Haenszel test'],
      ['EP-004', 'NEURO-MDD-202', 'primary',     'Change from baseline in MADRS total score',              'Day 28',                     'MMRM with treatment, visit, and treatment-by-visit interaction'],
      ['EP-005', 'NEURO-MDD-202', 'secondary',   'Response rate (>=50% MADRS reduction)',                  'Day 28',                     'Logistic regression with treatment as covariate'],
      ['EP-006', 'METAB-T2D-401', 'primary',     '3-point MACE (CV death, non-fatal MI, non-fatal stroke)','Median 5 years',             'Cox proportional hazards; non-inferiority margin HR 1.3'],
      ['EP-007', 'METAB-T2D-401', 'secondary',   'Change from baseline in HbA1c',                          'Week 52',                    'ANCOVA with baseline HbA1c as covariate'],
      ['EP-008', 'IMMUN-RA-201',  'primary',     'ACR50 response',                                         'Week 12',                    'Cochran-Mantel-Haenszel; NRI for missing data'],
      ['EP-009', 'ONCO-BREAST-302','primary',    'Progression-Free Survival (PFS) per BICR',               'Up to 30 months',            'Stratified log-rank'],
      ['EP-010', 'CARDIO-HF-301', 'primary',     'Composite of CV death or first HF hospitalization',      'Until event or 36 months',   'Cox proportional hazards stratified by region'],
      ['EP-011', 'NEURO-AD-202',  'primary',     'Change from baseline in CDR-SB',                         'Week 78',                    'MMRM'],
      ['EP-012', 'NEURO-AD-202',  'exploratory', 'Amyloid PET SUVR change from baseline',                  'Week 78',                    'Paired t-test; ANCOVA'],
      ['EP-013', 'RARE-SMA-103',  'primary',     'Proportion alive and ventilator-free at 14 months',      '14 months',                  'Exact binomial 95% CI vs natural history threshold'],
      ['EP-014', 'INF-FLU-202',   'primary',     'Geometric mean titer ratio (HAI) vs comparator',         'Day 28 post-dose',           'ANCOVA on log-transformed titers; 2-sided 95% CI'],
      ['EP-015', 'GI-IBD-301',    'primary',     'Clinical remission (CDAI < 150)',                        'Week 52',                    'Cochran-Mantel-Haenszel'],
    ];
    for (const e of endpoints) {
      await client.query(
        `INSERT INTO endpoints (endpoint_id, trial, type, measure, timepoint, statistical_method) VALUES ($1,$2,$3,$4,$5,$6)`,
        e
      );
    }
    console.log(`Seeded ${endpoints.length} endpoints`);

    // ---------- ADVERSE EVENTS (15, MedDRA-style preferred terms) ----------
    const ae = [
      ['AE-0001', 'PT-0001', 'ONCO-LUNG-301', 'Fatigue',                       'Grade 2', false, '2024-10-02', 'Recovered'],
      ['AE-0002', 'PT-0001', 'ONCO-LUNG-301', 'Immune-mediated pneumonitis',   'Grade 3', true,  '2024-10-21', 'Recovering'],
      ['AE-0003', 'PT-0002', 'ONCO-LUNG-301', 'Anaemia',                       'Grade 2', false, '2024-10-05', 'Recovered'],
      ['AE-0004', 'PT-0004', 'NEURO-MDD-202', 'Dissociation',                  'Grade 1', false, '2024-05-03', 'Recovered'],
      ['AE-0005', 'PT-0004', 'NEURO-MDD-202', 'Blood pressure increased',      'Grade 2', false, '2024-05-04', 'Recovered'],
      ['AE-0006', 'PT-0006', 'METAB-T2D-401', 'Nausea',                        'Grade 1', false, '2023-12-15', 'Recovered'],
      ['AE-0007', 'PT-0006', 'METAB-T2D-401', 'Pancreatitis acute',            'Grade 3', true,  '2024-04-02', 'Recovered with sequelae'],
      ['AE-0008', 'PT-0008', 'IMMUN-RA-201',  'Herpes zoster',                 'Grade 2', false, '2023-06-12', 'Recovered'],
      ['AE-0009', 'PT-0009', 'ONCO-BREAST-302','Neutropenia',                  'Grade 4', true,  '2025-03-12', 'Recovering'],
      ['AE-0010', 'PT-0009', 'ONCO-BREAST-302','Diarrhoea',                    'Grade 2', false, '2025-03-10', 'Recovered'],
      ['AE-0011', 'PT-0011', 'CARDIO-HF-301', 'Hypotension',                   'Grade 2', false, '2024-07-15', 'Recovered'],
      ['AE-0012', 'PT-0013', 'RARE-SMA-103',  'Transaminases increased',       'Grade 3', true,  '2024-04-05', 'Recovered'],
      ['AE-0013', 'PT-0014', 'INF-FLU-202',   'Injection site pain',           'Grade 1', false, '2025-03-02', 'Recovered'],
      ['AE-0014', 'PT-0014', 'INF-FLU-202',   'Pyrexia',                       'Grade 1', false, '2025-03-03', 'Recovered'],
      ['AE-0015', 'PT-0015', 'GI-IBD-301',    'Upper respiratory tract infection','Grade 2', false, '2024-01-30', 'Recovered'],
    ];
    for (const a of ae) {
      await client.query(
        `INSERT INTO adverse_events (event_id, patient, trial, term, severity, serious, reported_at, outcome) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        a
      );
    }
    console.log(`Seeded ${ae.length} adverse events`);

    // ---------- AMENDMENTS ----------
    const amendments = [
      ['AMD-001', 'ONCO-LUNG-301', '1.1', 'Add PD-L1 TPS 1-49% sub-cohort and update sample size to 720', 'approved', '2024-11-15'],
      ['AMD-002', 'NEURO-MDD-202', '2.1', 'Extend follow-up to 8 weeks; refine MADRS scoring window', 'proposed', null],
      ['AMD-003', 'METAB-T2D-401', '1.1', 'Add eGFR sub-stratification; clarify SAE reporting timelines', 'implemented', '2024-02-28'],
      ['AMD-004', 'ONCO-BREAST-302', '1.1', 'Update inclusion criteria for prior endocrine therapy lines', 'approved', '2025-03-10'],
      ['AMD-005', 'CARDIO-HF-301', '1.2', 'Expand NYHA II inclusion; update concomitant ACEi/ARB language', 'approved', '2024-08-20'],
      ['AMD-006', 'NEURO-AD-202', '1.1', 'Add tau PET sub-study; revise infusion premedication', 'proposed', null],
      ['AMD-007', 'RARE-SMA-103', '1.1', 'Extend follow-up to 5 years; add motor function MFM-32', 'approved', '2024-09-10'],
      ['AMD-008', 'INF-FLU-202', '1.1', 'Add B/Yamagata strain analysis; expand to 4 dose levels', 'proposed', null],
      ['AMD-009', 'GI-IBD-301', '2.2', 'Add fecal calprotectin biomarker; clarify endoscopy timing', 'implemented', '2024-04-05'],
      ['AMD-010', 'VASC-PAH-201', '1.2', 'Add 6MWD secondary endpoint; expand WHO FC III inclusion', 'approved', '2024-10-15'],
    ];
    for (const a of amendments) {
      await client.query(`INSERT INTO amendments (amendment_id, trial, version, summary, status, approved_at) VALUES ($1,$2,$3,$4,$5,$6)`, a);
    }
    console.log(`Seeded ${amendments.length} amendments`);

    // ---------- DEVIATIONS ----------
    const deviations = [
      ['DEV-001', 'ONCO-LUNG-301', 'SITE-001', 'minor', 'Visit window exceeded by 3 days at week 12', 'Patient scheduling conflict', 'closed'],
      ['DEV-002', 'ONCO-LUNG-301', 'SITE-003', 'major', 'Patient enrolled with ECOG 2 (protocol requires 0-1)', 'PI misread eligibility checklist', 'open'],
      ['DEV-003', 'NEURO-MDD-202', 'SITE-013', 'minor', 'MADRS not administered at day 28; +5 days late', 'Site staff turnover', 'closed'],
      ['DEV-004', 'METAB-T2D-401', 'SITE-005', 'minor', 'Lab sample shipped above recommended temp', 'Courier delay over weekend', 'closed'],
      ['DEV-005', 'ONCO-BREAST-302', 'SITE-008', 'major', 'Prohibited concomitant medication (CYP3A4 inhibitor) administered', 'PI unaware of recent label update', 'open'],
      ['DEV-006', 'CARDIO-HF-301', 'SITE-005', 'minor', 'KCCQ questionnaire not completed at baseline', 'Patient declined questionnaire', 'closed'],
      ['DEV-007', 'NEURO-AD-202', 'SITE-004', 'major', 'MRI screening missed; patient dosed', 'Imaging suite unavailable', 'open'],
      ['DEV-008', 'RARE-SMA-103', 'SITE-013', 'minor', 'Infusion rate slower than protocol-specified', 'Conservative clinical judgment', 'closed'],
      ['DEV-009', 'GI-IBD-301', 'SITE-007', 'minor', 'CDAI scoring incomplete one item', 'Source document missing entry', 'closed'],
      ['DEV-010', 'DERM-PSO-302', 'SITE-006', 'major', 'Randomization stratification factor recorded incorrectly', 'IWRS user error', 'open'],
    ];
    for (const d of deviations) {
      await client.query(`INSERT INTO deviations (deviation_id, trial, site, type, description, root_cause, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`, d);
    }
    console.log(`Seeded ${deviations.length} deviations`);

    // ---------- MONITORING VISITS ----------
    const visits = [
      ['MV-001', 'ONCO-LUNG-301', 'SITE-001', 'Sarah Chen', '2025-06-15', 'IMV', 'planned'],
      ['MV-002', 'ONCO-LUNG-301', 'SITE-002', 'David Park', '2024-12-10', 'IMV', 'complete'],
      ['MV-003', 'NEURO-MDD-202', 'SITE-013', 'Maya Patel', '2024-04-20', 'SIV', 'complete'],
      ['MV-004', 'METAB-T2D-401', 'SITE-005', 'Liam Ortega', '2025-08-01', 'IMV', 'planned'],
      ['MV-005', 'ONCO-BREAST-302', 'SITE-008', 'Sophie Larkin', '2025-04-25', 'IMV', 'planned'],
      ['MV-006', 'CARDIO-HF-301', 'SITE-005', 'Liam Ortega', '2025-07-10', 'IMV', 'planned'],
      ['MV-007', 'NEURO-AD-202', 'SITE-004', 'Hiroshi Tanaka', '2024-09-15', 'SIV', 'complete'],
      ['MV-008', 'RARE-SMA-103', 'SITE-013', 'Maya Patel', '2025-09-30', 'COV', 'planned'],
      ['MV-009', 'INF-FLU-202', 'SITE-014', 'Sarah Chen', '2025-05-20', 'IMV', 'planned'],
      ['MV-010', 'GI-IBD-301', 'SITE-007', 'Emma Watson', '2024-11-12', 'IMV', 'complete'],
    ];
    for (const v of visits) {
      await client.query(`INSERT INTO monitoring_visits (visit_id, trial, site, monitor, scheduled_for, type, status) VALUES ($1,$2,$3,$4,$5,$6,$7)`, v);
    }
    console.log(`Seeded ${visits.length} monitoring visits`);

    // ---------- QUERIES ----------
    const queries = [
      ['Q-001', 'ONCO-LUNG-301', 'PT-0001', 'PD-L1 TPS', 'TPS value missing — please confirm', 'open', '2024-10-10', null],
      ['Q-002', 'ONCO-LUNG-301', 'PT-0002', 'Concomitant medication', 'Date of last steroid dose unclear', 'answered', '2024-10-12', '2024-10-15'],
      ['Q-003', 'NEURO-MDD-202', 'PT-0004', 'MADRS day 28', 'Score appears outside expected range', 'closed', '2024-06-01', '2024-06-03'],
      ['Q-004', 'METAB-T2D-401', 'PT-0006', 'HbA1c week 26', 'Lab unit mismatch (% vs mmol/mol)', 'answered', '2024-06-15', '2024-06-18'],
      ['Q-005', 'ONCO-BREAST-302', 'PT-0009', 'ANC day 8', 'Value inconsistent with prior trend', 'open', '2025-03-20', null],
      ['Q-006', 'CARDIO-HF-301', 'PT-0011', 'NT-proBNP baseline', 'Sample collected outside window', 'open', '2024-07-01', null],
      ['Q-007', 'NEURO-AD-202', 'PT-0012', 'Amyloid PET centiloid', 'Imaging vendor reads pending', 'answered', '2024-10-05', '2024-10-12'],
      ['Q-008', 'RARE-SMA-103', 'PT-0013', 'CHOP-INTEND', 'Score discrepancy across raters', 'closed', '2024-04-10', '2024-04-15'],
      ['Q-009', 'INF-FLU-202', 'PT-0014', 'HAI titer day 28', 'Dilution series incomplete', 'open', '2025-04-01', null],
      ['Q-010', 'GI-IBD-301', 'PT-0015', 'CDAI week 12', 'Bowel frequency item missing', 'answered', '2024-04-22', '2024-04-25'],
    ];
    for (const q of queries) {
      await client.query(`INSERT INTO queries (query_id, trial, patient, field, question, status, raised_at, answered_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, q);
    }
    console.log(`Seeded ${queries.length} queries`);

    // ---------- DATA LOCKS ----------
    const locks = [
      ['LOCK-001', 'IMMUN-RA-201', 'final', '2023-06-01', 'AbbVie Data Management', 'locked'],
      ['LOCK-002', 'HEME-AML-201', 'final', '2023-04-01', 'AbbVie / Genentech DM', 'locked'],
      ['LOCK-003', 'NEURO-MDD-202', 'interim', '2024-09-15', 'Janssen Statistics', 'locked'],
      ['LOCK-004', 'METAB-T2D-401', 'interim', '2024-12-31', 'Eli Lilly DM', 'locked'],
      ['LOCK-005', 'ONCO-LUNG-301', 'interim', '2025-01-15', 'Merck Statistics', 'locked'],
      ['LOCK-006', 'CARDIO-HF-301', 'interim', '2025-02-01', 'Bayer DM', 'locked'],
      ['LOCK-007', 'GI-IBD-301', 'interim', '2024-11-30', 'AbbVie DM', 'unlocked'],
      ['LOCK-008', 'DERM-PSO-302', 'final', '2024-04-15', 'UCB DM', 'locked'],
      ['LOCK-009', 'NEURO-AD-202', 'interim', '2025-04-01', 'Eisai DM', 'unlocked'],
      ['LOCK-010', 'RARE-SMA-103', 'interim', '2025-06-30', 'Novartis Gene DM', 'unlocked'],
    ];
    for (const l of locks) {
      await client.query(`INSERT INTO data_locks (lock_id, trial, lock_type, locked_at, locked_by, status) VALUES ($1,$2,$3,$4,$5,$6)`, l);
    }
    console.log(`Seeded ${locks.length} data locks`);

    // ---------- MILESTONES ----------
    const milestones = [
      ['MS-001', 'ONCO-LUNG-301', 'FPI', '2024-09-10', '2024-09-12', 'met'],
      ['MS-002', 'ONCO-LUNG-301', 'LPI', '2025-12-15', null, 'on_track'],
      ['MS-003', 'NEURO-MDD-202', 'FPI', '2024-05-01', '2024-05-02', 'met'],
      ['MS-004', 'NEURO-MDD-202', 'DBLock', '2025-06-30', null, 'on_track'],
      ['MS-005', 'METAB-T2D-401', 'CSR', '2026-12-31', null, 'on_track'],
      ['MS-006', 'IMMUN-RA-201', 'CSR', '2023-09-30', '2023-10-15', 'delayed'],
      ['MS-007', 'ONCO-BREAST-302', 'FPI', '2025-02-01', '2025-02-04', 'met'],
      ['MS-008', 'CARDIO-HF-301', 'LPI', '2025-09-30', null, 'delayed'],
      ['MS-009', 'NEURO-AD-202', 'FPI', '2024-09-01', '2024-09-05', 'met'],
      ['MS-010', 'RARE-SMA-103', 'DBLock', '2026-06-30', null, 'on_track'],
    ];
    for (const m of milestones) {
      await client.query(`INSERT INTO milestones (milestone_id, trial, name, target_date, actual_date, status) VALUES ($1,$2,$3,$4,$5,$6)`, m);
    }
    console.log(`Seeded ${milestones.length} milestones`);

    // ---------- BUDGETS ----------
    const budgets = [
      ['BUD-001', 'ONCO-LUNG-301', 'Site Payments', 12500000, 4800000, -2.5, 'FY2025'],
      ['BUD-002', 'ONCO-LUNG-301', 'Lab / Central Reads', 3200000, 1400000, 1.2, 'FY2025'],
      ['BUD-003', 'NEURO-MDD-202', 'CRO Services', 4500000, 3100000, -4.0, 'FY2024'],
      ['BUD-004', 'METAB-T2D-401', 'Site Payments', 18900000, 9200000, 0.8, 'FY2025'],
      ['BUD-005', 'IMMUN-RA-201', 'Drug Supply', 2200000, 2300000, 4.5, 'FY2023'],
      ['BUD-006', 'ONCO-BREAST-302', 'CRO Services', 7500000, 1100000, -3.0, 'FY2025'],
      ['BUD-007', 'CARDIO-HF-301', 'Imaging Core Lab', 1800000, 800000, 2.0, 'FY2025'],
      ['BUD-008', 'NEURO-AD-202', 'Biomarker Assays', 2900000, 1100000, -1.5, 'FY2025'],
      ['BUD-009', 'RARE-SMA-103', 'Gene Therapy Manufacture', 14500000, 7800000, 6.0, 'FY2024-FY2025'],
      ['BUD-010', 'GI-IBD-301', 'Endoscopy Procedures', 3400000, 2200000, 1.8, 'FY2024'],
    ];
    for (const b of budgets) {
      await client.query(`INSERT INTO budgets (budget_id, trial, category, budgeted_usd, spent_usd, variance_pct, period) VALUES ($1,$2,$3,$4,$5,$6,$7)`, b);
    }
    console.log(`Seeded ${budgets.length} budgets`);

    // ---------- VENDORS / CRO ----------
    const vendors = [
      ['CRO-001', 'IQVIA',  ['Monitoring', 'Data Management', 'Biostatistics'], 28500000, 'active',  '2023-01-15'],
      ['CRO-002', 'Parexel', ['Regulatory', 'Pharmacovigilance'],                12200000, 'active',  '2023-06-10'],
      ['CRO-003', 'PPD',     ['Central Lab', 'Imaging'],                          9800000, 'active',  '2024-02-20'],
      ['CRO-004', 'Syneos Health', ['Clinical Operations', 'Site Management'],    18700000, 'active',  '2024-04-05'],
      ['CRO-005', 'Labcorp Drug Development', ['Bioanalytical', 'Central Lab'],    7200000, 'active',  '2023-09-30'],
      ['CRO-006', 'ICON',    ['Monitoring', 'Site Selection'],                    15400000, 'closing', '2022-11-01'],
      ['CRO-007', 'Medidata', ['EDC', 'Randomization'],                            3100000, 'active',  '2024-01-10'],
      ['CRO-008', 'Veeva',    ['eTMF', 'Document Mgmt'],                           1800000, 'active',  '2024-03-15'],
      ['CRO-009', 'Worldwide Clinical Trials', ['Phase I Unit', 'PK/PD'],          4200000, 'ended',   '2022-05-20'],
      ['CRO-010', 'Premier Research', ['Rare Disease Ops'],                        5600000, 'active',  '2024-08-12'],
    ];
    for (const v of vendors) {
      await client.query(`INSERT INTO vendors_cro (cro_id, name, services, contract_value_usd, status, started_at) VALUES ($1,$2,$3,$4,$5,$6)`, v);
    }
    console.log(`Seeded ${vendors.length} vendors`);

    // ---------- REGULATORY SUBMISSIONS ----------
    const subs = [
      ['SUB-001', 'ONCO-LUNG-301', 'FDA', 'IND', 'approved',  '2024-06-15'],
      ['SUB-002', 'ONCO-LUNG-301', 'EMA', 'CTA', 'approved',  '2024-07-01'],
      ['SUB-003', 'NEURO-MDD-202', 'FDA', 'IND', 'approved',  '2024-02-20'],
      ['SUB-004', 'METAB-T2D-401', 'FDA', 'IND', 'approved',  '2023-08-10'],
      ['SUB-005', 'METAB-T2D-401', 'PMDA','CTA', 'submitted', '2024-01-15'],
      ['SUB-006', 'ONCO-BREAST-302', 'FDA','IND','approved',  '2024-11-20'],
      ['SUB-007', 'CARDIO-HF-301', 'EMA', 'IMPD','approved',  '2024-04-30'],
      ['SUB-008', 'NEURO-AD-202', 'FDA',  'IND', 'submitted', '2024-06-10'],
      ['SUB-009', 'RARE-SMA-103', 'FDA',  'IND', 'approved',  '2024-01-05'],
      ['SUB-010', 'DERM-PSO-302', 'EMA',  'CTA', 'rejected',  '2023-08-15'],
    ];
    for (const s of subs) {
      await client.query(`INSERT INTO regulatory_submissions (sub_id, trial, agency, type, status, submitted_at) VALUES ($1,$2,$3,$4,$5,$6)`, s);
    }
    console.log(`Seeded ${subs.length} regulatory submissions`);

    // ---------- SUPPLY SHIPMENTS ----------
    const shipments = [
      ['SHP-001', 'ONCO-LUNG-301', 'SITE-001', 50, 'LOT-A2401', 'delivered',  false],
      ['SHP-002', 'ONCO-LUNG-301', 'SITE-002', 75, 'LOT-A2401', 'delivered',  false],
      ['SHP-003', 'ONCO-LUNG-301', 'SITE-003', 60, 'LOT-A2402', 'in_transit', false],
      ['SHP-004', 'NEURO-MDD-202', 'SITE-013', 40, 'LOT-B2403', 'delivered',  false],
      ['SHP-005', 'METAB-T2D-401', 'SITE-005', 100,'LOT-C2401', 'delivered',  true],
      ['SHP-006', 'ONCO-BREAST-302','SITE-008',55, 'LOT-D2501', 'delivered',  false],
      ['SHP-007', 'CARDIO-HF-301', 'SITE-005', 65, 'LOT-E2402', 'pending',    false],
      ['SHP-008', 'NEURO-AD-202', 'SITE-004', 35, 'LOT-F2403', 'in_transit', false],
      ['SHP-009', 'RARE-SMA-103', 'SITE-013', 5,  'LOT-G2401', 'delivered',  false],
      ['SHP-010', 'INF-FLU-202', 'SITE-014', 200, 'LOT-H2501', 'delivered',  false],
    ];
    for (const sh of shipments) {
      await client.query(`INSERT INTO supply_shipments (shipment_id, trial, site, kit_count, lot, status, temp_excursion) VALUES ($1,$2,$3,$4,$5,$6,$7)`, sh);
    }
    console.log(`Seeded ${shipments.length} supply shipments`);

    // ---------- USERS (RBAC: sponsor, pi, monitor) ----------
    const piPw       = await bcrypt.hash('trial2026', 10);
    const sponsorPw  = await bcrypt.hash('sponsor2026', 10);
    const monitorPw  = await bcrypt.hash('monitor2026', 10);
    const users = [
      ['pi@trials.io',       piPw,      'Demo Principal Investigator', 'pi'],
      ['sponsor@trials.io',  sponsorPw, 'Demo Sponsor Operations',     'sponsor'],
      ['monitor@trials.io',  monitorPw, 'Demo CRA Monitor',            'monitor'],
    ];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4)
         ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, name=EXCLUDED.name, role=EXCLUDED.role`,
        u
      );
    }
    console.log('Seeded RBAC users: pi@trials.io / sponsor@trials.io / monitor@trials.io');

    // ---------- WEBHOOKS (demo subscriber) ----------
    await client.query(
      `INSERT INTO webhooks (name, url, event, secret, active) VALUES
       ('demo-deviation', 'http://localhost:3051/api/webhooks/test-receiver', 'deviation.created', 'whsec_demo_2026', true),
       ('demo-sae',       'http://localhost:3051/api/webhooks/test-receiver', 'ae.serious',        'whsec_demo_2026', true),
       ('demo-amendment', 'http://localhost:3051/api/webhooks/test-receiver', 'amendment.approved','whsec_demo_2026', true)`
    );
    console.log('Seeded 3 demo webhooks');

    // ---------- Pass 8/9 trial-conduct tables (>=15 rows each) ----------
    await require('./seedConduct')(client);

    // ---------- Merged recruitment/matching tables ----------
    await require('./seedRecruitment')(client);

    console.log('\nSeed complete.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
