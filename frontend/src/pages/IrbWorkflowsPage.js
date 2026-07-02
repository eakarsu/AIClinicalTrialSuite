import React, { useEffect, useState } from 'react';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import {
  listIrbWorkflows,
  getIrbWorkflow,
  createIrbWorkflow,
  transitionIrbWorkflow,
  featureAiAnalyze,
} from '../services/api';

function IrbWorkflowsPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    workflow_id: 'IRB-WF-' + Date.now(),
    trial: 'ONCO-LUNG-301',
    protocol: 'PROT-ONCO-301-v1.0',
    site: 'SITE-003',
    irb_name: 'Mass General Brigham IRB',
  });
  const [transitionState, setTransitionState] = useState('');
  const [transitionReason, setTransitionReason] = useState('');

  const refresh = async () => {
    try { setRows(await listIrbWorkflows()); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const onSelect = async (id) => {
    try { setSelected(await getIrbWorkflow(id)); setTransitionState(''); setTransitionReason(''); }
    catch (e) { setError(e.message); }
  };

  const onCreate = async () => {
    setError(null);
    try {
      await createIrbWorkflow(newForm);
      setCreating(false);
      setNewForm({ ...newForm, workflow_id: 'IRB-WF-' + Date.now() });
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const onTransition = async () => {
    if (!selected || !transitionState) return;
    setError(null);
    try {
      await transitionIrbWorkflow(selected.workflow.id, { to_state: transitionState, reason: transitionReason });
      await onSelect(selected.workflow.id);
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const runAiReview = async () => {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      setAiResult(await featureAiAnalyze({
        feature: 'irb-workflows',
        intent: 'Review IRB workflow state coverage, transition history, continuing-review risks, and missing approval evidence.',
        input: { selected_workflow: selected?.workflow?.workflow_id || null },
        mechanical_result: { workflows: rows, selected },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>IRB Workflows</h2>
          <p>State-machine: draft → submitted → response_pending → approved | rejected → continuing_review. Every transition is logged for audit.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New Workflow</button>
        </div>
      </div>
      {error && <div className="card" style={{ color: '#b91c1c' }}>Error: {error}</div>}
      {creating && (
        <div className="card">
          <h3>New IRB workflow</h3>
          <div className="form-grid">
            {Object.keys(newForm).map(k => (
              <div className="form-group" key={k}><label>{k}</label>
                <input value={newForm[k]} onChange={(e) => setNewForm({ ...newForm, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display:'flex', gap: 8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn btn-ai" onClick={onCreate}>Create</button>
          </div>
        </div>
      )}
      <div className="card">
        <h3>All workflows</h3>
        <table style={{ width: '100%' }}>
          <thead><tr>
            <th align="left">ID</th>
            <th align="left">Workflow</th>
            <th align="left">Trial</th>
            <th align="left">IRB</th>
            <th align="left">State</th>
            <th align="left">Last review</th>
            <th></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: `IRB workflow — ${r.workflow_id}`, data: r })}>
                <td>{r.id}</td>
                <td>{r.workflow_id}</td>
                <td>{r.trial}</td>
                <td>{r.irb_name}</td>
                <td><span style={{ padding: '2px 8px', borderRadius: 4, background: '#e2e8f0' }}>{r.state}</span></td>
                <td>{r.last_review_at ? new Date(r.last_review_at).toLocaleDateString() : '—'}</td>
                <td><button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); onSelect(r.id); }}>Open</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>No workflows yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="card">
          <h3>Workflow {selected.workflow.workflow_id}</h3>
          <p>Current state: <strong>{selected.workflow.state}</strong></p>
          <p>Allowed next: {selected.allowed_next_states.join(', ') || '(terminal)'}</p>
          {selected.allowed_next_states.length > 0 && (
            <div className="form-grid">
              <div className="form-group"><label>Transition to</label>
                <select value={transitionState} onChange={(e) => setTransitionState(e.target.value)}>
                  <option value="">— select —</option>
                  {selected.allowed_next_states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group full"><label>Reason / note</label>
                <input value={transitionReason} onChange={(e) => setTransitionReason(e.target.value)} placeholder="e.g. IRB approval letter received 2026-05-12" />
              </div>
            </div>
          )}
          <div style={{ marginTop: 12, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-ai" onClick={onTransition} disabled={!transitionState}>Transition</button>
          </div>
          <h4 style={{ marginTop: 16 }}>History</h4>
          <table style={{ width: '100%' }}>
            <thead><tr><th align="left">When</th><th align="left">From</th><th align="left">To</th><th align="left">Actor</th><th align="left">Reason</th></tr></thead>
            <tbody>
              {selected.transitions.map(t => (
                <tr
                  key={t.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetail({ title: `IRB transition — ${t.to_state}`, data: t })}
                >
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td>{t.from_state || '—'}</td>
                  <td>{t.to_state}</td>
                  <td>{t.actor || '—'}</td>
                  <td>{t.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default IrbWorkflowsPage;
