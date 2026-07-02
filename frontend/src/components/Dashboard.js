import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { key: 'trials',         path: '/trials',         title: 'Trials',         icon: 'TRL', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'sites',          path: '/sites',          title: 'Sites',          icon: 'SITE',color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  { key: 'protocols',      path: '/protocols',      title: 'Protocols',      icon: 'PRT', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'investigators',  path: '/investigators',  title: 'Investigators',  icon: 'INV', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { key: 'patients',       path: '/patients',       title: 'Patients',       icon: 'PT',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'compounds',      path: '/compounds',      title: 'Compounds',      icon: 'CMP', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'endpoints',      path: '/endpoints',      title: 'Endpoints',      icon: 'EP',  color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
  { key: 'adverse_events', path: '/adverse-events', title: 'Adverse Events', icon: 'AE',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  { key: 'amendments',         path: '/amendments',             title: 'Amendments',         icon: 'AMD', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  { key: 'deviations',         path: '/deviations',             title: 'Deviations',         icon: 'DEV', color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  { key: 'monitoring_visits',  path: '/monitoring-visits',      title: 'Monitoring Visits',  icon: 'MV',  color: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
  { key: 'queries',            path: '/queries',                title: 'Queries',            icon: 'Q',   color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { key: 'data_locks',         path: '/data-locks',             title: 'Data Locks',         icon: 'DBL', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  { key: 'milestones',         path: '/milestones',             title: 'Milestones',         icon: 'MIL', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { key: 'budgets',            path: '/budgets',                title: 'Budgets',            icon: '$',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { key: 'vendors_cro',        path: '/vendors-cro',            title: 'CRO Vendors',        icon: 'CRO', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  { key: 'regulatory_submissions', path: '/regulatory-submissions', title: 'Reg. Submissions', icon: 'REG', color: '#d946ef', bg: 'rgba(217,70,239,0.12)' },
  { key: 'supply_shipments',   path: '/supply-shipments',       title: 'Supply Shipments',   icon: 'SHP', color: '#0891b2', bg: 'rgba(8,145,178,0.12)' },
];

const AI_FEATURES = [
  { path: '/ai/draft-protocol',         title: 'AI: Draft Protocol' },
  { path: '/ai/recommend-endpoints',    title: 'AI: Recommend Endpoints' },
  { path: '/ai/size-cohort',            title: 'AI: Size Cohort' },
  { path: '/ai/select-sites',           title: 'AI: Select Sites' },
  { path: '/ai/model-risk',             title: 'AI: Model Risk' },
  { path: '/ai/generate-brief',         title: 'AI: Generate Brief' },
  { path: '/ai/deviation-classifier',   title: 'AI: Deviation Classifier' },
  { path: '/ai/dsmb-alert',             title: 'AI: DSMB Alert' },
  { path: '/ai/edc-anomaly',            title: 'AI: EDC Anomaly' },
  { path: '/ai/statistical-imbalance',  title: 'AI: Statistical Imbalance' },
  { path: '/ai/expected-vs-actual',     title: 'AI: Expected vs Actual AE' },
  { path: '/ai/irb-pkg-drafter',        title: 'AI: IRB Pkg Drafter' },
  { path: '/ai/query-resolver',         title: 'AI: Query Resolver' },
  { path: '/ai/milestone-forecaster',   title: 'AI: Milestone Forecaster' },
  { path: '/ai/budget-burn',            title: 'AI: Budget Burn' },
  { path: '/ai/regulatory-impact',      title: 'AI: Regulatory Impact' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(e => setError(e.message));
  }, []);

  const c = stats?.counts || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>AI-assisted clinical trial design, monitoring and analytics.</p>
        </div>
      </div>

      {error && <div className="ai-error">Failed to load stats: {error}</div>}

      <div className="dashboard-stats">
        {FEATURES.slice(0, 8).map(f => (
          <div key={f.key} className="stat-card">
            <div className="stat-label">{f.title}</div>
            <div className="stat-value">{c[f.key] ?? '—'}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin:'16px 0 8px' }}>Trial Operations</h3>
      <div className="feature-grid">
        {FEATURES.slice(8).map(f => (
          <div key={f.key} className="feature-card" style={{ '--card-color': f.color }} onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.bg, color: f.color, fontWeight: 700, fontSize: 13 }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{c[f.key] ?? 0} records</p>
          </div>
        ))}
      </div>

      <h3 style={{ margin:'16px 0 8px' }}>AI Studio (16 verbs)</h3>
      <div className="feature-grid">
        {AI_FEATURES.map(f => (
          <div key={f.path} className="feature-card" style={{ '--card-color': '#a855f7' }} onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', fontWeight: 700, fontSize: 13 }}>AI</div>
            <h3>{f.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
