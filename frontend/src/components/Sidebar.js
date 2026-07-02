import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationsBell from './NotificationsBell';

const CRUD_LINKS = [
  { path: '/trials', label: 'Trials' },
  { path: '/sites', label: 'Sites' },
  { path: '/protocols', label: 'Protocols' },
  { path: '/investigators', label: 'Investigators' },
  { path: '/patients', label: 'Patients' },
  { path: '/compounds', label: 'Compounds' },
  { path: '/endpoints', label: 'Endpoints' },
  { path: '/adverse-events', label: 'Adverse Events' },
];

const OPS_LINKS = [
  { path: '/amendments',            label: 'Amendments' },
  { path: '/deviations',            label: 'Deviations' },
  { path: '/monitoring-visits',     label: 'Monitoring Visits' },
  { path: '/site-activation-risk',  label: 'Site Activation Risk' },
  { path: '/queries',               label: 'Queries' },
  { path: '/data-locks',            label: 'Data Locks' },
  { path: '/milestones',            label: 'Milestones' },
  { path: '/budgets',               label: 'Budgets' },
  { path: '/vendors-cro',           label: 'CRO Vendors' },
  { path: '/regulatory-submissions',label: 'Regulatory Submissions' },
  { path: '/supply-shipments',      label: 'Supply Shipments' },
];

const RECRUITMENT_LINKS = [
  { path: '/recruitment-matching', label: 'Recruitment & Matching' },
];

const AI_LINKS = [
  { path: '/ai/draft-protocol',         label: 'Draft Protocol' },
  { path: '/ai/recommend-endpoints',    label: 'Recommend Endpoints' },
  { path: '/ai/size-cohort',            label: 'Size Cohort' },
  { path: '/ai/select-sites',           label: 'Select Sites' },
  { path: '/ai/model-risk',             label: 'Model Risk' },
  { path: '/ai/generate-brief',         label: 'Generate Brief' },
  { path: '/ai/deviation-classifier',   label: 'Deviation Classifier' },
  { path: '/ai/dsmb-alert',             label: 'DSMB Alert' },
  { path: '/ai/edc-anomaly',            label: 'EDC Anomaly' },
  { path: '/ai/statistical-imbalance',  label: 'Statistical Imbalance' },
  { path: '/ai/expected-vs-actual',     label: 'Expected vs Actual' },
  { path: '/ai/irb-pkg-drafter',        label: 'IRB Pkg Drafter' },
  { path: '/ai/query-resolver',         label: 'Query Resolver' },
  { path: '/ai/milestone-forecaster',   label: 'Milestone Forecaster' },
  { path: '/ai/budget-burn',            label: 'Budget Burn' },
  { path: '/ai/regulatory-impact',      label: 'Regulatory Impact' },
];

const SYS_LINKS = [
  { path: '/webhooks',    label: 'Webhooks' },
  { path: '/bulk-import', label: 'Bulk Import' },
];

// Pass 7 — full backlog. MECHANICAL deterministic tools + ADVISORY ONLY (TOO-RISKY) helpers.
const PASS7_LINKS = [
  { path: '/ai/power-calc-explain',  label: 'Power-Calc Explainer' },
  { path: '/ai/patient-burden',      label: 'Patient Burden' },
  { path: '/comparable-trials',      label: 'Comparable Trials' },
  { path: '/protocol-version-graph', label: 'Protocol Version-Graph' },
  { path: '/irb-workflows',          label: 'IRB Workflows' },
  { path: '/ai/ie-optimizer',        label: 'I/E Optimizer (advisory)' },
  { path: '/ai/ind-nda-section',     label: 'IND/NDA Section (advisory)' },
  { path: '/ai/dropout-predictor',   label: 'Dropout Predictor (advisory)' },
  { path: '/ai/adaptive-sim',        label: 'Adaptive-Design Sim (advisory)' },
  { path: '/ai/rwe-match',           label: 'RWE Matcher (advisory)' },
  { path: '/integrations',           label: 'Integrations (needs creds)' },
];

// Pass 8 — trial conduct. Randomization/IWRS, SDTM export, DSMB packet,
// enrollment forecast, MedDRA coding + safety narrative (advisory),
// Form 1572 drafts, delegation log, training records.
const PASS8_LINKS = [
  { path: '/randomization',       label: 'Randomization / IWRS / IRT' },
  { path: '/sdtm-export',         label: 'SDTM Export' },
  { path: '/dsmb-packet',         label: 'DSMB Packet' },
  { path: '/enrollment-forecast', label: 'Enrollment Forecast' },
  { path: '/ai/meddra-code',      label: 'MedDRA Coding (advisory)' },
  { path: '/ai/safety-narrative', label: 'Safety Narrative (advisory)' },
  { path: '/form-1572',           label: 'Form 1572 (draft)' },
  { path: '/delegation-log',      label: 'Delegation Log' },
  { path: '/training-records',    label: 'Training Records' },
];

// Pass 9 — live CT.gov search, real design statistics, Part 11-style
// audit chain, eConsent with two-component e-signatures.
const PASS9_LINKS = [
  { path: '/ctgov-search', label: 'CT.gov Search (live)' },
  { path: '/design-sim',   label: 'Design Statistics' },
  { path: '/audit-trail',  label: 'Audit Trail (Part 11-style)' },
  { path: '/econsent',     label: 'eConsent' },
];

const PASS10_LINKS = [
  { path: '/production-readiness', label: 'Production Readiness' },
];

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </button>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Clinical Trial Suite</h1>
          <p>Design, Conduct &amp; Matching</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={close}>Dashboard</Link>

          <div className="sidebar-section">Master Data</div>
          {CRUD_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Trial Operations</div>
          {OPS_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Recruitment &amp; Matching</div>
          {RECRUITMENT_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">AI Studio</div>
          {AI_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">System</div>
          {SYS_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Backlog (Pass 7)</div>
          {PASS7_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Trial Conduct (Pass 8)</div>
          {PASS8_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Compliance &amp; Design (Pass 9)</div>
          {PASS9_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Gap Closure (Pass 10)</div>
          {PASS10_LINKS.map(l => (
            <Link key={l.path} to={l.path} className={`nav-link ${isActive(l.path) ? 'active' : ''}`} onClick={close}>{l.label}</Link>
          ))}

          <div className="sidebar-section">Trial Design Views</div>
          <Link
            to="/custom-views"
            className={`nav-link ${isActive('/custom-views') ? 'active' : ''}`}
            onClick={close}
          >
            Custom Views
          </Link>

          {user && (
            <>
              <div className="sidebar-section">Account</div>
              <div className="sidebar-user">{user.name || user.email}{user.role ? ` (${user.role})` : ''}</div>
              <div className="sidebar-bell"><NotificationsBell /></div>
              <button className="nav-link nav-logout" onClick={() => { close(); onLogout && onLogout(); }}>Sign out</button>
            </>
          )}
        </nav>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={close} />}
    </>
  );
}

export default Sidebar;
