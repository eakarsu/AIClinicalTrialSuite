import React, { useState } from 'react';
import SampleButtons from '../components/SampleButtons';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import { ctgovSearch, featureAiAnalyze } from '../services/api';

function CtgovSearchPage() {
  const [condition, setCondition] = useState('non small cell lung cancer');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  async function run() {
    setLoading(true); setError(null); setResult(null); setAiResult(null);
    try { setResult(await ctgovSearch({ condition, term, status, pageSize: 20 })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const input = { condition, term, status, pageSize: 20 };
      const base = result || await ctgovSearch(input);
      if (!result) setResult(base);
      setAiResult(await featureAiAnalyze({
        feature: 'ctgov-search',
        intent: 'Review the live ClinicalTrials.gov search results for comparable-trial relevance and registry search limitations.',
        input,
        mechanical_result: { ...base, studies: (base.studies || []).slice(0, 20) },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ClinicalTrials.gov Search (live)</h2>
          <p>Live search against the public CT.gov v2 read API — no credentials required. (Registry push/PRS still needs a sponsor account.)</p>
        </div>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}

      <SampleButtons feature="ctgov-search" onPick={(v) => { if (v.condition !== undefined) setCondition(v.condition); if (v.term !== undefined) setTerm(v.term); if (v.status !== undefined) setStatus(v.status); }} />

      <div className="card">
        <div className="form-grid">
          <div className="form-group"><label>Condition</label><input value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. metastatic melanoma" /></div>
          <div className="form-group"><label>Search term (optional)</label><input value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. pembrolizumab" /></div>
          <div className="form-group"><label>Status (optional)</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">— any —</option>
              <option value="RECRUITING">Recruiting</option>
              <option value="ACTIVE_NOT_RECRUITING">Active, not recruiting</option>
              <option value="COMPLETED">Completed</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={run} disabled={loading || (!condition && !term)}>{loading ? 'Searching…' : 'Search CT.gov'}</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading || (!condition && !term)}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>

      {result && (
        <div className="card">
          <h3>{result.count} studies <span style={{ fontSize: 12, color: '#64748b' }}>({result.source})</span></h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead><tr><th align="left">NCT ID</th><th align="left">Title</th><th align="left">Status</th><th align="left">Phases</th><th align="right">Enrollment</th><th align="left">Sponsor</th></tr></thead>
            <tbody>
              {result.studies.map(s => (
                <tr key={s.nct_id} style={{ cursor: 'pointer' }}
                    onClick={() => setDetail({ title: `${s.nct_id} — study details`, data: s })}>
                  <td><a href={`https://clinicaltrials.gov/study/${s.nct_id}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{s.nct_id}</a></td>
                  <td>{s.title && s.title.length > 70 ? s.title.slice(0, 70) + '…' : s.title}</td>
                  <td>{s.status}</td>
                  <td>{(s.phases || []).join(', ')}</td>
                  <td align="right">{s.enrollment ?? '—'}</td>
                  <td>{s.sponsor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AIResult result={aiResult} loading={aiLoading} error={null} />

      {detail && (
        <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)}>
          <p style={{ marginTop: 8 }}>
            <a href={`https://clinicaltrials.gov/study/${detail.data.nct_id}`} target="_blank" rel="noreferrer">
              Open full record on ClinicalTrials.gov →
            </a>
          </p>
        </DetailModal>
      )}
    </div>
  );
}
export default CtgovSearchPage;
