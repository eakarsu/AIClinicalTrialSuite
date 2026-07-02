-- ============================================================
-- AIPharmaTrialDesigner - Pass 9 schema
-- 004_pass9.sql
--   * Part 11-STYLE audit trail: append-only, hash-chained
--     (tamper-evident). NOT certified 21 CFR Part 11 compliance;
--     it implements the mechanics (attributable, time-stamped,
--     tamper-evident records + verification endpoint).
--   * eConsent: versioned consent forms + subject consent records
--     with two-component e-signatures (userid + password
--     re-verification at signing).
-- The live CT.gov search, design simulator, and exact power
-- calculator are stateless (no schema).
-- ============================================================

-- Append-only audit chain. hash = sha256(prev_hash | payload-json).
-- Verification endpoint recomputes the chain and reports the first break.
CREATE TABLE IF NOT EXISTS audit_events (
  id           SERIAL PRIMARY KEY,
  actor        VARCHAR(255),
  actor_role   VARCHAR(50),
  method       VARCHAR(10) NOT NULL,
  path         VARCHAR(500) NOT NULL,
  status_code  INTEGER,
  body_summary TEXT,
  prev_hash    VARCHAR(64) NOT NULL,
  hash         VARCHAR(64) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Versioned consent forms.
CREATE TABLE IF NOT EXISTS consent_forms (
  id          SERIAL PRIMARY KEY,
  form_id     VARCHAR(50) NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  trial       VARCHAR(50),
  title       VARCHAR(500) NOT NULL,
  content     TEXT,
  status      VARCHAR(20) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (form_id, version)
);

-- Subject consent records. signature_hash binds signer, subject, form
-- version, meaning, and timestamp; password re-verification happens at
-- signing time (two-component e-signature: userid + password).
CREATE TABLE IF NOT EXISTS consent_records (
  id              SERIAL PRIMARY KEY,
  form_id         VARCHAR(50) NOT NULL,
  form_version    INTEGER NOT NULL,
  trial           VARCHAR(50),
  patient         VARCHAR(50) NOT NULL,
  signer_email    VARCHAR(255) NOT NULL,
  signer_name     VARCHAR(255),
  signer_role     VARCHAR(50),
  meaning         VARCHAR(255) NOT NULL DEFAULT 'Consent obtained from subject',
  signed_at       TIMESTAMPTZ DEFAULT NOW(),
  signature_hash  VARCHAR(64) NOT NULL,
  UNIQUE (form_id, form_version, patient)
);

INSERT INTO consent_forms (form_id, version, trial, title, content, status) VALUES
  ('ICF-ONCO-301', 1, 'ONCO-LUNG-301',
   'Informed Consent — ONCO-LUNG-301 (Main Study)',
   'You are being asked to take part in a research study of MK-3475 in combination with pemetrexed. This form describes the purpose, procedures, risks, and benefits of the study. Participation is voluntary and you may withdraw at any time without penalty.', 'active'),
  ('ICF-ONCO-301', 2, 'ONCO-LUNG-301',
   'Informed Consent — ONCO-LUNG-301 (Main Study, Amendment 1)',
   'Version 2 adds the optional pharmacokinetic sub-study blood draws (4 additional samples at Cycle 1). All other procedures are unchanged. Participation in the sub-study is optional and does not affect main-study participation.', 'active'),
  ('ICF-NEURO-202', 1, 'NEURO-MDD-202',
   'Informed Consent — NEURO-MDD-202',
   'You are being asked to take part in a research study of esketamine nasal spray for treatment-resistant depression. This form describes required clinic observation periods after each dose and driving restrictions on dosing days.', 'active')
ON CONFLICT (form_id, version) DO NOTHING;
