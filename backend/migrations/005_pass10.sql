-- ============================================================
-- Pass 10: production-readiness mechanics
-- Advanced IRT lifecycle, validation evidence, and compliance export metadata.
-- ============================================================

CREATE TABLE IF NOT EXISTS irt_events (
  id            SERIAL PRIMARY KEY,
  event_id      VARCHAR(80) UNIQUE NOT NULL,
  event_type    VARCHAR(40) NOT NULL,
  kit_id        VARCHAR(80),
  trial         VARCHAR(50),
  site          VARCHAR(50),
  subject_id    VARCHAR(100),
  reason        TEXT,
  actor         VARCHAR(255),
  payload       JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_unblinds (
  id            SERIAL PRIMARY KEY,
  unblind_id    VARCHAR(80) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  subject_id    VARCHAR(100) NOT NULL,
  arm           VARCHAR(100),
  kit_id        VARCHAR(80),
  reason        TEXT NOT NULL,
  requested_by  VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_evidence (
  id            SERIAL PRIMARY KEY,
  evidence_id   VARCHAR(80) UNIQUE NOT NULL,
  area          VARCHAR(80) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  status        VARCHAR(40) DEFAULT 'draft',
  owner         VARCHAR(255),
  evidence_type VARCHAR(80),
  summary       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO validation_evidence (evidence_id, area, title, status, owner, evidence_type, summary) VALUES
  ('VAL-IRT-001', 'IRT', 'Randomization/IWRS/IRT configuration qualification', 'draft', 'Clinical Operations', 'OQ/PQ', 'Covers scheme creation, category schema, kit dispense, quarantine, return, destruction, and emergency unblinding.'),
  ('VAL-SDTM-001', 'SDTM', 'SDTM-shaped export conformance checks', 'draft', 'Data Management', 'UAT', 'Covers required columns, duplicate USUBJID detection, controlled terminology gaps, and domain-specific sanity checks.'),
  ('VAL-AUDIT-001', 'Audit Trail', 'Hash-chain audit verification evidence', 'ready_for_review', 'Quality', 'Technical Verification', 'Covers append-only audit chain verification and broken-chain detection.'),
  ('VAL-ECONSENT-001', 'eConsent', 'Two-component e-signature workflow qualification', 'draft', 'Regulatory Operations', 'UAT', 'Covers form versioning, signature re-authentication, duplicate prevention, and consent-record export.'),
  ('VAL-RBAC-001', 'Permissions', 'Role/action permissions matrix review', 'draft', 'Security', 'Access Control Review', 'Covers sponsor, PI, and monitor read/write permissions by module.')
ON CONFLICT (evidence_id) DO NOTHING;
