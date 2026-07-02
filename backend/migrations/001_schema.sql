-- ============================================================
-- AIPharmaTrialDesigner - Full Schema
-- 001_schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS trials (
  id            SERIAL PRIMARY KEY,
  trial_id      VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(500) NOT NULL,
  indication    VARCHAR(255),
  phase         VARCHAR(20),
  status        VARCHAR(50) DEFAULT 'planning',
  sponsor       VARCHAR(255),
  start_date    DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id                     SERIAL PRIMARY KEY,
  site_id                VARCHAR(50) UNIQUE NOT NULL,
  name                   VARCHAR(255) NOT NULL,
  city                   VARCHAR(100),
  country                VARCHAR(100),
  principal_investigator VARCHAR(255),
  capacity               INTEGER,
  status                 VARCHAR(50) DEFAULT 'active',
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocols (
  id            SERIAL PRIMARY KEY,
  protocol_id   VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  version       VARCHAR(20),
  status        VARCHAR(50) DEFAULT 'draft',
  approved_by   VARCHAR(255),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investigators (
  id              SERIAL PRIMARY KEY,
  investigator_id VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  title           VARCHAR(100),
  site            VARCHAR(50),
  specialty       VARCHAR(255),
  trials_count    INTEGER DEFAULT 0,
  certifications  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id                SERIAL PRIMARY KEY,
  patient_id        VARCHAR(50) UNIQUE NOT NULL,
  trial             VARCHAR(50),
  site              VARCHAR(50),
  enrollment_status VARCHAR(50) DEFAULT 'screening',
  enrolled_at       TIMESTAMPTZ,
  arm               VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compounds (
  id                  SERIAL PRIMARY KEY,
  compound_id         VARCHAR(50) UNIQUE NOT NULL,
  code                VARCHAR(100),
  generic_name        VARCHAR(255),
  therapeutic_area    VARCHAR(255),
  mechanism           VARCHAR(500),
  phase_max_reached   VARCHAR(20),
  ic50_nm             NUMERIC(12,2),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS endpoints (
  id                  SERIAL PRIMARY KEY,
  endpoint_id         VARCHAR(50) UNIQUE NOT NULL,
  trial               VARCHAR(50),
  type                VARCHAR(50),
  measure             VARCHAR(500),
  timepoint           VARCHAR(100),
  statistical_method  VARCHAR(255),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adverse_events (
  id            SERIAL PRIMARY KEY,
  event_id      VARCHAR(50) UNIQUE NOT NULL,
  patient       VARCHAR(50),
  trial         VARCHAR(50),
  term          VARCHAR(500),
  severity      VARCHAR(50),
  serious       BOOLEAN DEFAULT FALSE,
  reported_at   TIMESTAMPTZ,
  outcome       VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id         SERIAL PRIMARY KEY,
  feature    VARCHAR(100) NOT NULL,
  input      JSONB,
  output     JSONB,
  model      VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(255),
  role       VARCHAR(50) DEFAULT 'pi',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trials_phase  ON trials(phase);
CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);
CREATE INDEX IF NOT EXISTS idx_patients_trial ON patients(trial);
CREATE INDEX IF NOT EXISTS idx_ae_trial ON adverse_events(trial);
CREATE INDEX IF NOT EXISTS idx_ae_severity ON adverse_events(severity);

-- ============================================================
-- Extended CRUD entities
-- ============================================================

CREATE TABLE IF NOT EXISTS amendments (
  id            SERIAL PRIMARY KEY,
  amendment_id  VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  version       VARCHAR(20),
  summary       TEXT,
  status        VARCHAR(50) DEFAULT 'proposed',
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deviations (
  id            SERIAL PRIMARY KEY,
  deviation_id  VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  site          VARCHAR(50),
  type          VARCHAR(20) DEFAULT 'minor',
  description   TEXT,
  root_cause    TEXT,
  status        VARCHAR(20) DEFAULT 'open',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_visits (
  id            SERIAL PRIMARY KEY,
  visit_id      VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  site          VARCHAR(50),
  monitor       VARCHAR(255),
  scheduled_for TIMESTAMPTZ,
  type          VARCHAR(20) DEFAULT 'IMV',
  status        VARCHAR(20) DEFAULT 'planned',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queries (
  id            SERIAL PRIMARY KEY,
  query_id      VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  patient       VARCHAR(50),
  field         VARCHAR(255),
  question      TEXT,
  status        VARCHAR(20) DEFAULT 'open',
  raised_at     TIMESTAMPTZ DEFAULT NOW(),
  answered_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_locks (
  id            SERIAL PRIMARY KEY,
  lock_id       VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  lock_type     VARCHAR(20) DEFAULT 'interim',
  locked_at     TIMESTAMPTZ,
  locked_by     VARCHAR(255),
  status        VARCHAR(20) DEFAULT 'locked',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id            SERIAL PRIMARY KEY,
  milestone_id  VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  name          VARCHAR(50),
  target_date   DATE,
  actual_date   DATE,
  status        VARCHAR(20) DEFAULT 'on_track',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id            SERIAL PRIMARY KEY,
  budget_id     VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  category      VARCHAR(100),
  budgeted_usd  NUMERIC(14,2) DEFAULT 0,
  spent_usd     NUMERIC(14,2) DEFAULT 0,
  variance_pct  NUMERIC(6,2) DEFAULT 0,
  period        VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors_cro (
  id              SERIAL PRIMARY KEY,
  cro_id          VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  services        TEXT[],
  contract_value_usd NUMERIC(14,2) DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'active',
  started_at      DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_submissions (
  id            SERIAL PRIMARY KEY,
  sub_id        VARCHAR(50) UNIQUE NOT NULL,
  trial         VARCHAR(50),
  agency        VARCHAR(20),
  type          VARCHAR(20),
  status        VARCHAR(20) DEFAULT 'submitted',
  submitted_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supply_shipments (
  id              SERIAL PRIMARY KEY,
  shipment_id     VARCHAR(50) UNIQUE NOT NULL,
  trial           VARCHAR(50),
  site            VARCHAR(50),
  kit_count       INTEGER DEFAULT 0,
  lot             VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'pending',
  temp_excursion  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Cross-cutting: notifications, attachments, webhooks
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER,
  type        VARCHAR(50),
  title       VARCHAR(255),
  body        TEXT,
  ref_table   VARCHAR(50),
  ref_id      VARCHAR(50),
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS attachments (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type   VARCHAR(100),
  size_bytes  BIGINT,
  ref_table   VARCHAR(50),
  ref_id      VARCHAR(50),
  uploaded_by VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_ref ON attachments(ref_table, ref_id);

CREATE TABLE IF NOT EXISTS webhooks (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  event       VARCHAR(50) NOT NULL,
  secret      VARCHAR(255),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            SERIAL PRIMARY KEY,
  webhook_id    INTEGER,
  event         VARCHAR(50),
  payload       JSONB,
  response_status INTEGER,
  response_body TEXT,
  signature     VARCHAR(255),
  success       BOOLEAN DEFAULT FALSE,
  delivered_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
