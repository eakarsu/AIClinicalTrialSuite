-- ============================================================
-- AIPharmaTrialDesigner - Pass 8 schema
-- 003_pass8.sql
--   * Randomization / IWRS: schemes + subject assignments
--   * Delegation-of-authority log (site staff task delegation)
--   * Training records (GCP / protocol training per staff member)
-- SDTM export, DSMB packet, enrollment forecast, MedDRA coding,
-- safety narrative, and Form 1572 are computed from existing
-- tables and need no schema of their own (AI verbs persist to
-- ai_results as usual).
-- ============================================================

-- Randomization scheme: permuted-block, optionally stratified.
-- arms:   JSONB array [{ "name": "Active", "ratio": 1 }, ...]
-- strata: JSONB array of stratum labels ("" / [] means unstratified)
CREATE TABLE IF NOT EXISTS randomization_schemes (
  id            SERIAL PRIMARY KEY,
  scheme_id     VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  method        VARCHAR(40) NOT NULL DEFAULT 'permuted-block',
  block_size    INTEGER NOT NULL DEFAULT 4,
  arms          JSONB NOT NULL DEFAULT '[{"name":"Active","ratio":1},{"name":"Placebo","ratio":1}]'::jsonb,
  strata        JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  seed          VARCHAR(100) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE randomization_schemes
  ADD COLUMN IF NOT EXISTS category_schema JSONB NOT NULL DEFAULT '[]'::jsonb;

-- One row per randomized subject. The arm is derived deterministically
-- from (scheme.seed, stratum, block number) so the list is reproducible
-- and auditable without storing pre-generated blocks.
CREATE TABLE IF NOT EXISTS randomization_assignments (
  id            SERIAL PRIMARY KEY,
  scheme        VARCHAR(50) NOT NULL,
  subject_id    VARCHAR(100) NOT NULL,
  stratum       VARCHAR(255) NOT NULL DEFAULT '',
  arm           VARCHAR(100) NOT NULL,
  block_no      INTEGER NOT NULL,
  position      INTEGER NOT NULL,
  assigned_by   VARCHAR(255),
  assigned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (scheme, subject_id)
);

-- IRT / drug-supply inventory. These rows represent blinded or open-label
-- medication kits available for dispense after IWRS randomization.
CREATE TABLE IF NOT EXISTS irt_kits (
  id            SERIAL PRIMARY KEY,
  kit_id        VARCHAR(80) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  site          VARCHAR(50),
  arm           VARCHAR(100),
  lot           VARCHAR(80),
  status        VARCHAR(30) NOT NULL DEFAULT 'available',
  expiry_date   DATE,
  temperature_status VARCHAR(40) DEFAULT 'in_range',
  assigned_subject VARCHAR(100),
  assigned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS irt_dispenses (
  id            SERIAL PRIMARY KEY,
  dispense_id   VARCHAR(80) UNIQUE NOT NULL,
  scheme        VARCHAR(50),
  trial         VARCHAR(50),
  subject_id    VARCHAR(100) NOT NULL,
  arm           VARCHAR(100) NOT NULL,
  kit_id        VARCHAR(80) NOT NULL,
  site          VARCHAR(50),
  dispensed_by  VARCHAR(255),
  dispensed_at  TIMESTAMPTZ DEFAULT NOW(),
  notes         TEXT
);

-- Delegation-of-authority log (FDA 1572 / ICH-GCP site delegation).
CREATE TABLE IF NOT EXISTS delegation_log_entries (
  id             SERIAL PRIMARY KEY,
  entry_id       VARCHAR(50) UNIQUE NOT NULL,
  trial          VARCHAR(50),
  site           VARCHAR(50),
  staff_name     VARCHAR(255) NOT NULL,
  staff_role     VARCHAR(100),
  delegated_tasks TEXT,
  delegated_by   VARCHAR(255),
  effective_from DATE,
  effective_to   DATE,
  status         VARCHAR(20) DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Training records (GCP, protocol-specific, IATA, EDC system).
CREATE TABLE IF NOT EXISTS training_records (
  id            SERIAL PRIMARY KEY,
  record_id     VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  site          VARCHAR(50),
  staff_name    VARCHAR(255) NOT NULL,
  course        VARCHAR(255) NOT NULL,
  course_type   VARCHAR(50) DEFAULT 'gcp',
  completed_at  DATE,
  expires_at    DATE,
  status        VARCHAR(20) DEFAULT 'current',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Demo rows so the pages are not empty on first open.
INSERT INTO randomization_schemes (scheme_id, trial, method, block_size, arms, strata, category_schema, seed) VALUES
  ('RND-ONCO-301', 'ONCO-LUNG-301', 'permuted-block', 4,
   '[{"name":"MK-3475 + Pemetrexed","ratio":1},{"name":"Placebo + Pemetrexed","ratio":1}]'::jsonb,
   '["ECOG 0-1","ECOG 2"]'::jsonb,
   '[{"category":"performance_status","source":"strata","allowed_values":["ECOG 0-1","ECOG 2"],"use_in_randomization":true,"use_in_irt":true},{"category":"supply_type","source":"arms","allowed_values":["MK-3475 + Pemetrexed","Placebo + Pemetrexed"],"use_in_randomization":true,"use_in_irt":true}]'::jsonb,
   'onco-lung-301-2026'),
  ('RND-NEURO-202', 'NEURO-MDD-202', 'permuted-block', 6,
   '[{"name":"Esketamine 56mg","ratio":1},{"name":"Esketamine 84mg","ratio":1},{"name":"Placebo","ratio":1}]'::jsonb,
   '[]'::jsonb,
   '[{"category":"dose_group","source":"arms","allowed_values":["Esketamine 56mg","Esketamine 84mg","Placebo"],"use_in_randomization":true,"use_in_irt":true}]'::jsonb,
   'neuro-mdd-202-2026')
ON CONFLICT (scheme_id) DO NOTHING;

INSERT INTO irt_kits (kit_id, trial, site, arm, lot, status, expiry_date, temperature_status) VALUES
  ('KIT-ONCO-001', 'ONCO-LUNG-301', 'SITE-001', 'Active',  'LOT-A2401', 'available', '2027-06-30', 'in_range'),
  ('KIT-ONCO-002', 'ONCO-LUNG-301', 'SITE-001', 'Placebo', 'LOT-A2401', 'available', '2027-06-30', 'in_range'),
  ('KIT-ONCO-003', 'ONCO-LUNG-301', 'SITE-002', 'Active',  'LOT-A2402', 'available', '2027-08-31', 'in_range'),
  ('KIT-NEURO-001', 'NEURO-MDD-202', 'SITE-013', 'Active',  'LOT-B2403', 'available', '2026-12-31', 'in_range'),
  ('KIT-NEURO-002', 'NEURO-MDD-202', 'SITE-013', 'Placebo', 'LOT-B2403', 'available', '2026-12-31', 'in_range')
ON CONFLICT (kit_id) DO NOTHING;

INSERT INTO delegation_log_entries (entry_id, trial, site, staff_name, staff_role, delegated_tasks, delegated_by, effective_from, status) VALUES
  ('DLG-001', 'ONCO-LUNG-301', 'SITE-001', 'Sarah Chen, RN',      'Study Coordinator', 'Informed consent process; vital signs; EDC data entry',        'Dr. James Wilson', '2025-01-15', 'active'),
  ('DLG-002', 'ONCO-LUNG-301', 'SITE-001', 'Michael Torres, CRC', 'Research Coordinator', 'Visit scheduling; sample processing; query resolution',     'Dr. James Wilson', '2025-01-15', 'active'),
  ('DLG-003', 'NEURO-MDD-202', 'SITE-002', 'Emily Park, PharmD',  'Pharmacist', 'IP dispensing; accountability logs; temperature monitoring',           'Dr. Anita Rao',   '2024-11-01', 'active'),
  ('DLG-004', 'NEURO-MDD-202', 'SITE-002', 'David Kim, RN',       'Study Nurse', 'Dosing administration; AE assessment support; PRO administration',    'Dr. Anita Rao',   '2024-11-01', 'expired'),
  ('DLG-005', 'METAB-T2D-401', 'SITE-003', 'Lisa Nguyen, CRC',    'Research Coordinator', 'EDC data entry; visit windows; source document filing',      'Dr. Robert Hayes', '2024-02-01', 'active')
ON CONFLICT (entry_id) DO NOTHING;

INSERT INTO training_records (record_id, trial, site, staff_name, course, course_type, completed_at, expires_at, status) VALUES
  ('TRN-001', 'ONCO-LUNG-301', 'SITE-001', 'Sarah Chen, RN',      'ICH-GCP E6(R3) Refresher',        'gcp',      '2025-01-10', '2028-01-10', 'current'),
  ('TRN-002', 'ONCO-LUNG-301', 'SITE-001', 'Sarah Chen, RN',      'Protocol ONCO-LUNG-301 v2.0',     'protocol', '2025-01-12', NULL,         'current'),
  ('TRN-003', 'ONCO-LUNG-301', 'SITE-001', 'Michael Torres, CRC', 'ICH-GCP E6(R3) Initial',          'gcp',      '2024-12-20', '2027-12-20', 'current'),
  ('TRN-004', 'NEURO-MDD-202', 'SITE-002', 'Emily Park, PharmD',  'IATA Dangerous Goods',            'iata',     '2023-06-15', '2025-06-15', 'expired'),
  ('TRN-005', 'NEURO-MDD-202', 'SITE-002', 'David Kim, RN',       'EDC System (Rave) Certification', 'system',   '2024-10-28', NULL,         'current')
ON CONFLICT (record_id) DO NOTHING;
