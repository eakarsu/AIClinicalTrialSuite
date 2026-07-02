import React, { useState } from 'react';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import SampleButtons from '../components/SampleButtons';
import { findComparableTrials, findComparableTrialsAi } from '../services/api';

function ComparableTrialsPage() {
  const [form, setForm] = useState({ indication: 'Non-Small Cell Lung Cancer', phase: 'III', limit: 10 });
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null); setAiResult(null);
    try { setResult(await findComparableTrials({ ...form, limit: Number(form.limit) || 10 })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const onAi = async () => {
    setAiLoading(true); setError(null); setAiResult(null);
    try { setAiResult(await findComparableTrialsAi({ ...form, limit: Number(form.limit) || 10 })); }
    catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Comparable-Trial Finder</h2>
          <p>MECHANICAL — searches the internal trials table by indication + phase, ranks by token-overlap similarity. ClinicalTrials.gov / EudraCT / CTIS search requires NEEDS-CREDS integration.</p>
        </div>
      </div>
      <div className="card">
        <SampleButtons feature="comparable-trials" onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group full"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Phase</label><input name="phase" value={form.phase} onChange={onChange} /></div>
          <div className="form-group"><label>Limit</label><input type="number" name="limit" value={form.limit} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end', gap: 8 }}>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>Find Comparable Trials</button>
          <button className="btn btn-ai" onClick={onAi} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>
      {error && <div className="card" style={{ color: '#b91c1c' }}>Error: {error}</div>}
      {loading && <div className="card">Searching...</div>}
      {result && (
        <div className="card">
          <p><strong>Source:</strong> {result.source} &nbsp; <strong>Matches:</strong> {result.result_count}</p>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th align="left">Trial ID</th>
                <th align="left">Name</th>
                <th align="left">Indication</th>
                <th align="left">Phase</th>
                <th align="left">Sponsor</th>
                <th align="left">Status</th>
                <th align="right">Similarity</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((t, i) => (
                <tr
                  key={i}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetail({ title: `Comparable trial — ${t.trial_id}`, data: t })}
                >
                  <td>{t.trial_id}</td>
                  <td>{t.name}</td>
                  <td>{t.indication}</td>
                  <td>{t.phase}</td>
                  <td>{t.sponsor}</td>
                  <td>{t.status}</td>
                  <td align="right">{t.similarity_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.notes?.map((n, i) => <p key={i} style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{n}</p>)}
        </div>
      )}
      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default ComparableTrialsPage;
