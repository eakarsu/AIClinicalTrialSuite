import React, { useEffect, useState } from 'react';
import SampleButtons from '../components/SampleButtons';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import { sdtmDomains, sdtmExport, featureAiAnalyze } from '../services/api';

function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = v => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function SdtmExportPage() {
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState('DM');
  const [trial, setTrial] = useState('');
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => { sdtmDomains().then(setDomains).catch(e => setError(e.message)); }, []);

  async function run() {
    setLoading(true); setError(null); setResult(null); setAiResult(null);
    try { setResult(await sdtmExport(domain, trial.trim() || null)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const memory = result || await sdtmExport(domain, trial.trim() || null);
      if (!result) setResult(memory);
      setAiResult(await featureAiAnalyze({
        feature: 'sdtm-export',
        intent: 'Review this SDTM-shaped export for likely data-quality, mapping, and CDISC-conformance risks.',
        input: { domain, trial },
        mechanical_result: { ...memory, rows: (memory.rows || []).slice(0, 50) },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  const rows = result?.rows || [];
  const cols = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>SDTM Export</h2>
          <p>SDTM-shaped export of DM / AE / DV domains from live data. NOT validated against CDISC conformance rules.</p>
        </div>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}

      <SampleButtons feature="sdtm-export" onPick={(v) => { if (v.domain !== undefined) setDomain(v.domain); if (v.trial !== undefined) setTrial(v.trial); }} />

      <div className="card">
        <div className="form-grid">
          <div className="form-group"><label>Domain</label>
            <select value={domain} onChange={e => setDomain(e.target.value)}>
              {domains.map(d => <option key={d.domain} value={d.domain}>{d.domain} — {d.label}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Trial ID (blank = all trials)</label>
            <input value={trial} onChange={e => setTrial(e.target.value)} placeholder="e.g. ONCO-LUNG-301" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Loading…' : 'Preview'}</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
          <button className="btn btn-secondary" onClick={() => downloadCsv(rows, `${domain}.csv`)} disabled={!rows.length}>Download CSV</button>
        </div>
      </div>

      {result && (
        <div className="card">
          <h3>{result.domain} — {result.count} records {result.cdisc_validated === false && <span style={{ fontSize: 12, color: '#b45309' }}> (SDTM-shaped, not CDISC-validated)</span>}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead><tr>{cols.map(c => <th key={c} align="left">{c}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }}
                      onClick={() => setDetail({ title: `${result.domain} record — ${r.USUBJID || i + 1}`, data: r })}>
                    {cols.map(c => <td key={c}>{String(r[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 100 && <p style={{ color: '#64748b' }}>Showing first 100 of {rows.length} — download CSV for the full set.</p>}
        </div>
      )}
      <AIResult result={aiResult} loading={aiLoading} error={null} />

      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default SdtmExportPage;
