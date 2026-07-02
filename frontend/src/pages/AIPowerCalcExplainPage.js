import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiPowerCalcExplain } from '../services/api';

const FEATURE = 'power-calc-explain';

function AIPowerCalcExplainPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    alpha: 0.05,
    power: 0.9,
    sd: 1.0,
    mde: 0.5,
    dropout_rate: 0.15,
    two_sided: true,
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
    try { setResult(await aiPowerCalcExplain(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Power-Calc Explainer</h2>
          <p>MECHANICAL — deterministic walk-through of alpha / beta / MDE / SD with an AI plain-language narrative. Not a substitute for a validated power-analysis package.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group"><label>Alpha (two-sided)</label><input type="number" step="0.005" name="alpha" value={form.alpha} onChange={onChange} /></div>
          <div className="form-group"><label>Power (1 - beta)</label><input type="number" step="0.05" name="power" value={form.power} onChange={onChange} /></div>
          <div className="form-group"><label>Pooled SD</label><input type="number" step="0.1" name="sd" value={form.sd} onChange={onChange} /></div>
          <div className="form-group"><label>MDE (minimum detectable effect)</label><input type="number" step="0.1" name="mde" value={form.mde} onChange={onChange} /></div>
          <div className="form-group"><label>Dropout Rate</label><input type="number" step="0.05" name="dropout_rate" value={form.dropout_rate} onChange={onChange} /></div>
          <div className="form-group"><label><input type="checkbox" name="two_sided" checked={!!form.two_sided} onChange={onChange} /> Two-sided test</label></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Explain Power Calc</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIPowerCalcExplainPage;
