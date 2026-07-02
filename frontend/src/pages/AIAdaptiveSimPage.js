import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiAdaptiveSim } from '../services/api';

const FEATURE = 'adaptive-sim';

function AIAdaptiveSimPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    design_family: 'Group-sequential (O\'Brien-Fleming)',
    indication: 'NSCLC',
    phase: 'III',
    primary_endpoint: 'Overall survival',
    planned_n: 600,
    interim_fractions: '0.5, 0.75',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiAdaptiveSim(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Adaptive-Design Simulator</h2>
          <p>ADVISORY ONLY — qualitative description only. Real operating characteristics must come from EAST / FACTS / R simulations owned by a biostatistician.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#92400e', fontSize: 13 }}>ADVISORY ONLY — requires expert review — not for regulatory submission.</p>
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group"><label>Design Family</label><input name="design_family" value={form.design_family} onChange={onChange} /></div>
          <div className="form-group"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Phase</label><input name="phase" value={form.phase} onChange={onChange} /></div>
          <div className="form-group"><label>Primary Endpoint</label><input name="primary_endpoint" value={form.primary_endpoint} onChange={onChange} /></div>
          <div className="form-group"><label>Planned N</label><input type="number" name="planned_n" value={form.planned_n} onChange={onChange} /></div>
          <div className="form-group"><label>Interim Fractions (comma-separated)</label><input name="interim_fractions" value={form.interim_fractions} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Describe Design</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIAdaptiveSimPage;
