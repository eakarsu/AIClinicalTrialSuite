import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiSizeCohort } from '../services/api';

const FEATURE = 'size-cohort';

function AISizeCohortPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    primary_endpoint: 'Change from baseline in HbA1c at Week 52',
    effect_size: '0.4% absolute reduction vs control',
    alpha: 0.05,
    power: 0.9,
    dropout_rate: 0.15,
    allocation_ratio: '1:1',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiSizeCohort(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI: Size Cohort</h2><p>Sample-size calculation with sensitivity analysis and feasibility notes.</p></div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group full"><label>Primary Endpoint</label><input name="primary_endpoint" value={form.primary_endpoint} onChange={onChange} /></div>
          <div className="form-group"><label>Effect Size</label><input name="effect_size" value={form.effect_size} onChange={onChange} /></div>
          <div className="form-group"><label>Alpha (two-sided)</label><input type="number" step="0.005" name="alpha" value={form.alpha} onChange={onChange} /></div>
          <div className="form-group"><label>Power</label><input type="number" step="0.05" name="power" value={form.power} onChange={onChange} /></div>
          <div className="form-group"><label>Dropout Rate</label><input type="number" step="0.05" name="dropout_rate" value={form.dropout_rate} onChange={onChange} /></div>
          <div className="form-group"><label>Allocation Ratio</label><input name="allocation_ratio" value={form.allocation_ratio} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Calculate Sample Size</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AISizeCohortPage;
