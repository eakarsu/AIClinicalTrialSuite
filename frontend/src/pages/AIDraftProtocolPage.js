import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiDraftProtocol } from '../services/api';

const FEATURE = 'draft-protocol';

function AIDraftProtocolPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    indication: 'Non-Small Cell Lung Cancer',
    phase: 'III',
    compound: 'Pembrolizumab (MK-3475) + Pemetrexed',
    population: 'Adults with confirmed stage IV NSCLC, PD-L1 TPS >= 1%, ECOG 0-1',
    sample_size: 600,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiDraftProtocol(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI: Draft Protocol</h2><p>Generate a Phase-specific draft protocol from your inputs.</p></div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Phase</label>
            <select name="phase" value={form.phase} onChange={onChange}>
              {['I','I/II','II','II/III','III','IV'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group full"><label>Investigational Compound</label><input name="compound" value={form.compound} onChange={onChange} /></div>
          <div className="form-group full"><label>Target Population</label><textarea name="population" value={form.population} onChange={onChange} rows={2} /></div>
          <div className="form-group"><label>Planned Sample Size</label><input type="number" name="sample_size" value={form.sample_size} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Generate Protocol Draft</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIDraftProtocolPage;
