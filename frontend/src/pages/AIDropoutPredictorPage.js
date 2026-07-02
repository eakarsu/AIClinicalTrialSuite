import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiDropoutPredictor } from '../services/api';

const FEATURE = 'dropout-predictor';

function AIDropoutPredictorPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    indication: 'Major Depressive Disorder',
    phase: 'III',
    duration_weeks: 52,
    visit_frequency: 'every 4 weeks',
    population: 'Adults with DSM-5 MDD',
    placebo_arm: true,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiDropoutPredictor(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dropout-Rate Predictor</h2>
          <p>ADVISORY ONLY. Do not use for go/no-go program decisions.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#92400e', fontSize: 13 }}>ADVISORY ONLY — requires expert review — not for regulatory submission.</p>
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Phase</label><input name="phase" value={form.phase} onChange={onChange} /></div>
          <div className="form-group"><label>Duration (weeks)</label><input type="number" name="duration_weeks" value={form.duration_weeks} onChange={onChange} /></div>
          <div className="form-group"><label>Visit Frequency</label><input name="visit_frequency" value={form.visit_frequency} onChange={onChange} /></div>
          <div className="form-group full"><label>Population</label><input name="population" value={form.population} onChange={onChange} /></div>
          <div className="form-group"><label><input type="checkbox" name="placebo_arm" checked={!!form.placebo_arm} onChange={onChange} /> Has placebo arm</label></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Predict Dropout</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIDropoutPredictorPage;
