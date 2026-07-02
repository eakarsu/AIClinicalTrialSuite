import React, { useEffect, useState } from 'react';
import AIResult from '../components/AIResult';
import DetailModal from '../components/DetailModal';
import {
  complianceExport,
  emergencyUnblind,
  featureAiAnalyze,
  getIrtEvents,
  getIrtKits,
  getIrtResupplyForecast,
  getPermissionsMatrix,
  getValidationEvidence,
  sdtmValidate,
  updateIrtKitLifecycle,
} from '../services/api';

function ProductionReadinessPage() {
  const [kits, setKits] = useState([]);
  const [events, setEvents] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [sdtm, setSdtm] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [kitAction, setKitAction] = useState({ kit_id: '', action: 'quarantine', reason: 'Temperature excursion investigation' });
  const [unblind, setUnblind] = useState({ subject_id: '', reason: 'Medical emergency requiring treatment-arm knowledge' });

  async function load() {
    setError(null);
    try {
      const [k, f, ev, pm, ve] = await Promise.all([
        getIrtKits(),
        getIrtResupplyForecast(),
        getIrtEvents(),
        getPermissionsMatrix(),
        getValidationEvidence(),
      ]);
      setKits(k);
      setForecast(f);
      setEvents(ev);
      setPermissions(pm);
      setEvidence(ve);
      if (!kitAction.kit_id && k[0]) setKitAction(a => ({ ...a, kit_id: k[0].kit_id }));
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function runKitLifecycle() {
    setLoading(true); setError(null);
    try {
      const r = await updateIrtKitLifecycle(kitAction.kit_id, { action: kitAction.action, reason: kitAction.reason });
      setDetail({ title: `IRT ${kitAction.action} — ${kitAction.kit_id}`, data: r });
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runUnblind() {
    setLoading(true); setError(null);
    try {
      const r = await emergencyUnblind(unblind);
      setDetail({ title: `Emergency unblind — ${unblind.subject_id}`, data: r });
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function validateDomain(domain) {
    setLoading(true); setError(null);
    try { setSdtm(await sdtmValidate(domain)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function exportPackage() {
    setLoading(true); setError(null);
    try { setPkg(await complianceExport()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      setAiResult(await featureAiAnalyze({
        feature: 'production-readiness',
        intent: 'Review the production-readiness gap closure package: IRT controls, SDTM validation, compliance export, permissions matrix, and validation evidence.',
        input: { module: 'production-readiness' },
        mechanical_result: { forecast, permissions, evidence, sdtm, compliance_package: pkg, recent_irt_events: events.slice(0, 30) },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Production Readiness</h2>
          <p>Gap-closure workflows for advanced IRT controls, SDTM validation, evidence export, validation tracking, and access review.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={load}>Refresh</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>OpenRouter AI</button>
        </div>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card"><div className="stat-label">IRT Kits</div><div className="stat-value">{kits.length}</div><div className="stat-sub">Inventory rows</div></div>
        <div className="stat-card"><div className="stat-label">IRT Events</div><div className="stat-value">{events.length}</div><div className="stat-sub">Lifecycle/unblind records</div></div>
        <div className="stat-card"><div className="stat-label">Validation Evidence</div><div className="stat-value">{evidence.length}</div><div className="stat-sub">Tracked packages</div></div>
        <div className="stat-card"><div className="stat-label">SDTM Status</div><div className="stat-value">{sdtm?.status || '—'}</div><div className="stat-sub">{sdtm ? `${sdtm.issue_count} issues` : 'Not run'}</div></div>
      </div>

      <div className="card">
        <h3>IRT Lifecycle Controls</h3>
        <div className="form-grid">
          <div className="form-group"><label>Kit</label>
            <select value={kitAction.kit_id} onChange={e => setKitAction({ ...kitAction, kit_id: e.target.value })}>
              {kits.map(k => <option key={k.kit_id} value={k.kit_id}>{k.kit_id} — {k.status} — {k.trial}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Action</label>
            <select value={kitAction.action} onChange={e => setKitAction({ ...kitAction, action: e.target.value })}>
              <option value="quarantine">quarantine</option>
              <option value="release">release</option>
              <option value="return">return</option>
              <option value="destroy">destroy</option>
            </select>
          </div>
          <div className="form-group full"><label>Reason</label><input value={kitAction.reason} onChange={e => setKitAction({ ...kitAction, reason: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" onClick={runKitLifecycle} disabled={loading || !kitAction.kit_id}>Apply Kit Lifecycle Action</button>
      </div>

      <div className="card">
        <h3>Emergency Unblinding</h3>
        <div className="form-grid">
          <div className="form-group"><label>Subject ID</label><input value={unblind.subject_id} onChange={e => setUnblind({ ...unblind, subject_id: e.target.value })} placeholder="SUBJ-ONCO-LUNG-301-001" /></div>
          <div className="form-group full"><label>Reason</label><input value={unblind.reason} onChange={e => setUnblind({ ...unblind, reason: e.target.value })} /></div>
        </div>
        <button className="btn btn-danger" onClick={runUnblind} disabled={loading || !unblind.subject_id || !unblind.reason}>Emergency Unblind</button>
      </div>

      <div className="card">
        <h3>IRT Resupply Forecast</h3>
        <table className="data-table">
          <thead><tr><th>Trial</th><th>Site</th><th>Arm</th><th>Available</th><th>Monthly Rate</th><th>Months Cover</th><th>Reorder</th></tr></thead>
          <tbody>
            {(forecast?.forecast || []).slice(0, 25).map((r, i) => (
              <tr key={i} onClick={() => setDetail({ title: `Resupply — ${r.trial}`, data: r })}>
                <td>{r.trial}</td><td>{r.site}</td><td>{r.arm}</td><td>{r.available}</td><td>{r.monthly_rate}</td><td>{r.months_cover ?? '—'}</td><td>{r.reorder_recommended ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>SDTM Validation</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['DM', 'AE', 'DV'].map(d => <button key={d} className="btn btn-secondary" onClick={() => validateDomain(d)}>Validate {d}</button>)}
        </div>
        {sdtm && <AIResult result={sdtm} loading={false} error={null} />}
      </div>

      <div className="card">
        <h3>Permissions Matrix</h3>
        <table className="data-table">
          <thead><tr><th>Module</th><th>Action</th><th>Sponsor</th><th>PI</th><th>Monitor</th></tr></thead>
          <tbody>
            {(permissions?.matrix || []).map((p, i) => (
              <tr key={i}><td>{p.module}</td><td>{p.action}</td><td>{p.sponsor ? 'Yes' : 'No'}</td><td>{p.pi ? 'Yes' : 'No'}</td><td>{p.monitor ? 'Yes' : 'No'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Validation Evidence</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Area</th><th>Title</th><th>Status</th><th>Owner</th></tr></thead>
          <tbody>
            {evidence.map(e => (
              <tr key={e.id} onClick={() => setDetail({ title: e.evidence_id, data: e })}>
                <td>{e.evidence_id}</td><td>{e.area}</td><td>{e.title}</td><td>{e.status}</td><td>{e.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Compliance Export</h3>
        <button className="btn btn-primary" onClick={exportPackage}>Generate Evidence Package Summary</button>
        {pkg && <AIResult result={pkg} loading={false} error={null} />}
      </div>

      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}

export default ProductionReadinessPage;
