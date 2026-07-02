-- ============================================================
-- Pass 11: merged recruitment and clinical trial matching module
-- Ported from AIClinicalTrialMatching into the Designer runtime.
-- ============================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(40),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(80),
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS stage VARCHAR(80),
  ADD COLUMN IF NOT EXISTS biomarkers TEXT,
  ADD COLUMN IF NOT EXISTS medical_history TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT,
  ADD COLUMN IF NOT EXISTS travel_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caregiver_support BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS mrn VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'manual';

ALTER TABLE trials
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS target_enrollment INTEGER,
  ADD COLUMN IF NOT EXISTS current_enrollment INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT,
  ADD COLUMN IF NOT EXISTS recruitment_summary TEXT;

CREATE TABLE IF NOT EXISTS trial_matches (
  id             SERIAL PRIMARY KEY,
  patient_ref    INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  trial_ref      INTEGER REFERENCES trials(id) ON DELETE CASCADE,
  patient_id     VARCHAR(50),
  trial_id       VARCHAR(50),
  match_score    NUMERIC(5,2) DEFAULT 0,
  match_reason   TEXT,
  status         VARCHAR(40) DEFAULT 'candidate',
  ai_analysis    JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_ref, trial_ref)
);

CREATE INDEX IF NOT EXISTS idx_trial_matches_patient ON trial_matches(patient_ref);
CREATE INDEX IF NOT EXISTS idx_trial_matches_trial ON trial_matches(trial_ref);
CREATE INDEX IF NOT EXISTS idx_trial_matches_score ON trial_matches(match_score DESC);

CREATE TABLE IF NOT EXISTS eligibility_reviews (
  id              SERIAL PRIMARY KEY,
  match_id        INTEGER REFERENCES trial_matches(id) ON DELETE SET NULL,
  patient_ref     INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  trial_ref       INTEGER REFERENCES trials(id) ON DELETE CASCADE,
  status          VARCHAR(40) DEFAULT 'review_required',
  score           NUMERIC(5,2) DEFAULT 0,
  criteria_flags  JSONB DEFAULT '[]'::jsonb,
  reviewer_notes  TEXT,
  created_by      VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_biomarkers (
  id           SERIAL PRIMARY KEY,
  patient_ref  INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  name         VARCHAR(120) NOT NULL,
  value        VARCHAR(120),
  unit         VARCHAR(80),
  test_date    DATE,
  category     VARCHAR(120),
  status       VARCHAR(80),
  significance TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drug_interactions (
  id                SERIAL PRIMARY KEY,
  drug_a            VARCHAR(180) NOT NULL,
  drug_b            VARCHAR(180) NOT NULL,
  interaction_type  VARCHAR(120),
  severity          VARCHAR(80),
  description       TEXT,
  recommendation    TEXT,
  evidence_level    VARCHAR(80),
  mechanism         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_outcomes (
  id              SERIAL PRIMARY KEY,
  patient_ref     INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  trial_ref       INTEGER REFERENCES trials(id) ON DELETE SET NULL,
  outcome_type    VARCHAR(120),
  endpoint        TEXT,
  value           VARCHAR(120),
  unit            VARCHAR(80),
  assessment_date DATE,
  status          VARCHAR(80),
  prediction      TEXT,
  confidence      NUMERIC(5,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
