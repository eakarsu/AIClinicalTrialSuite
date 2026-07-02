-- ============================================================
-- AIPharmaTrialDesigner - Pass 7 (full backlog) schema
-- 002_pass7.sql
--   * IRB state-machine workflow rows + state-transition log
--   * Protocol version-graph helper view (read via SQL in routes)
-- ============================================================

-- IRB state-machine: one row per IRB workflow (one per protocol typically).
-- state values: draft -> submitted -> response_pending -> approved | rejected -> continuing_review
CREATE TABLE IF NOT EXISTS irb_workflows (
  id                SERIAL PRIMARY KEY,
  workflow_id       VARCHAR(50) UNIQUE NOT NULL,
  trial             VARCHAR(50),
  protocol          VARCHAR(50),
  site              VARCHAR(50),
  irb_name          VARCHAR(255),
  state             VARCHAR(40) NOT NULL DEFAULT 'draft',
  expires_at        DATE,
  last_review_at    TIMESTAMPTZ,
  meta              JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_irb_workflows_trial   ON irb_workflows(trial);
CREATE INDEX IF NOT EXISTS idx_irb_workflows_state   ON irb_workflows(state);

-- Append-only audit log of every state transition. Used to render the
-- IRB workflow's history graph in the UI.
CREATE TABLE IF NOT EXISTS irb_workflow_transitions (
  id            SERIAL PRIMARY KEY,
  workflow_id   VARCHAR(50) NOT NULL,
  from_state    VARCHAR(40),
  to_state      VARCHAR(40) NOT NULL,
  actor         VARCHAR(255),
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_irb_transitions_wf ON irb_workflow_transitions(workflow_id, created_at);
