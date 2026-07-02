import React, { useEffect, useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiModelRisk, getTrials } from '../services/api';

const FEATURE = 'model-risk';

function AIModelRiskPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [trials, setTrials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ enrollment_lag_days: 30, protocol_deviations: 4 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrials().then(rs => {
      setTrials(rs);
      if (rs[0]) setSelectedId(String(rs[0].id));
    }).catch(e => setError(e.message));
  }, []);

  const trial = trials.find(t => String(t.id) === selectedId);

  const onSubmit = async () => {
    if (!trial) return;
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await aiModelRisk({
        trial,
        enrollment_lag_days: Number(form.enrollment_lag_days),
        protocol_deviations: Number(form.protocol_deviations),
      }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI: Model Risk</h2><p>Multi-dimensional risk scoring with safety signal detection (uses live AE data).</p></div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        <SampleButtons feature={FEATURE} onPick={(values) => {
          if (values.trial_id) {
            const match = trials.find(t => t.trial_id === values.trial_id);
            if (match) setSelectedId(String(match.id));
          }
          setForm(prev => ({ ...prev, ...values }));
        }} />
        <div className="form-grid">
          <div className="form-group full"><label>Trial</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {trials.map(t => <option key={t.id} value={t.id}>{t.trial_id} — {t.name?.slice(0,70)}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Enrollment Lag (days)</label>
            <input type="number" value={form.enrollment_lag_days} onChange={e=>setForm({...form,enrollment_lag_days:e.target.value})} />
          </div>
          <div className="form-group"><label>Protocol Deviations</label>
            <input type="number" value={form.protocol_deviations} onChange={e=>setForm({...form,protocol_deviations:e.target.value})} />
          </div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading || !trial}>Model Risk</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIModelRiskPage;
