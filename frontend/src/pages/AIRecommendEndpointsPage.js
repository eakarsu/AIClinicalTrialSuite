import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiRecommendEndpoints } from '../services/api';

const FEATURE = 'recommend-endpoints';

function AIRecommendEndpointsPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    indication: 'Major Depressive Disorder',
    phase: 'II',
    mechanism: 'NMDA receptor antagonist (S-enantiomer of ketamine)',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiRecommendEndpoints(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI: Recommend Endpoints</h2><p>Suggest primary, secondary and exploratory endpoints with regulatory precedent.</p></div>
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
          <div className="form-group full"><label>Mechanism of Action</label><input name="mechanism" value={form.mechanism} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Recommend Endpoints</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIRecommendEndpointsPage;
