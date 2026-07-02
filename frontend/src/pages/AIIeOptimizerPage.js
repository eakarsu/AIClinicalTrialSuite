import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiIeOptimizer } from '../services/api';

const FEATURE = 'ie-optimizer';

function AIIeOptimizerPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    indication: 'Non-Small Cell Lung Cancer',
    phase: 'III',
    current_inclusion: 'Adults >= 18, ECOG 0-1, PD-L1 TPS >= 1%, no prior systemic therapy',
    current_exclusion: 'Active brain metastases, ILD history, autoimmune disease on systemic steroids',
    enrollment_target: 600,
    screen_fail_rate_pct: 45,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiIeOptimizer(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>I/E Criteria Optimizer</h2>
          <p>ADVISORY ONLY. Output must be reviewed by a medical monitor and biostatistician before any protocol change.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#92400e', fontSize: 13 }}>ADVISORY ONLY — requires expert review — not for regulatory submission.</p>
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Phase</label><input name="phase" value={form.phase} onChange={onChange} /></div>
          <div className="form-group full"><label>Current Inclusion Criteria</label><textarea name="current_inclusion" value={form.current_inclusion} onChange={onChange} rows={3} /></div>
          <div className="form-group full"><label>Current Exclusion Criteria</label><textarea name="current_exclusion" value={form.current_exclusion} onChange={onChange} rows={3} /></div>
          <div className="form-group"><label>Enrollment Target</label><input type="number" name="enrollment_target" value={form.enrollment_target} onChange={onChange} /></div>
          <div className="form-group"><label>Current Screen-Fail %</label><input type="number" name="screen_fail_rate_pct" value={form.screen_fail_rate_pct} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Suggest Optimisations</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIIeOptimizerPage;
