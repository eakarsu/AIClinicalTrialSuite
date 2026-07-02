import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiRweMatch } from '../services/api';

const FEATURE = 'rwe-match';

function AIRweMatchPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    indication: 'Relapsed/Refractory Acute Myeloid Leukemia',
    target_population: 'Adults >= 18, ineligible for intensive chemotherapy',
    target_outcome: 'Overall survival',
    proposed_use: 'External control arm for single-arm Phase 1b expansion',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiRweMatch(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>RWE / External-Control-Arm Matcher</h2>
          <p>ADVISORY ONLY. Real implementation requires data-partner contracts (Flatiron, Optum, TriNetX, claims/EHR) plus HEOR sign-off.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#92400e', fontSize: 13 }}>ADVISORY ONLY — requires expert review — not for regulatory submission.</p>
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Target Outcome</label><input name="target_outcome" value={form.target_outcome} onChange={onChange} /></div>
          <div className="form-group full"><label>Target Population</label><textarea name="target_population" value={form.target_population} onChange={onChange} rows={2} /></div>
          <div className="form-group full"><label>Proposed Use</label><input name="proposed_use" value={form.proposed_use} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Suggest Matching Strategy</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIRweMatchPage;
