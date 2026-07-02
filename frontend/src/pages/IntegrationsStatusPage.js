import React, { useState } from 'react';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import { featureAiAnalyze } from '../services/api';

const PROBES = [
  { label: 'ClinicalTrials.gov — search',     path: 'ctgov/search' },
  { label: 'ClinicalTrials.gov — PRS validate', path: 'ctgov/validate-prs' },
  { label: 'EudraCT — search',                path: 'eudract/search' },
  { label: 'CTIS — search',                   path: 'ctis/search' },
  { label: 'FDA ESG — submit',                path: 'fda-esg/submit' },
  { label: 'FDA ESG — ack lookup',            path: 'fda-esg/ack/SAMPLE123' },
  { label: 'Medidata Rave (EDC) — studies',   path: 'edc/rave/studies' },
  { label: 'Veeva CDMS (EDC) — studies',      path: 'edc/veeva/studies' },
  { label: 'EHR FHIR — patients',             path: 'ehr/fhir/patients' },
  { label: '21 CFR Part 11 — audit trail',    path: 'part11/audit-trail' },
];

function IntegrationsStatusPage() {
  const [results, setResults] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const probeAll = async () => {
    setLoading(true);
    const next = {};
    await Promise.all(PROBES.map(async (p) => {
      try {
        // Most probes are GET — request() throws on non-2xx, but we still want
        // to surface the body. Use a low-level fetch here.
        const token = localStorage.getItem('token');
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3051/api';
        const res = await fetch(`${apiBase}/integrations/${p.path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => ({}));
        next[p.path] = { status: res.status, body: data };
      } catch (e) {
        next[p.path] = { status: 'network_error', body: { error: e.message } };
      }
    }));
    setResults(next);
    setLoading(false);
  };

  const runAiReview = async () => {
    setAiLoading(true); setAiResult(null);
    try {
      setAiResult(await featureAiAnalyze({
        feature: 'integrations-status',
        intent: 'Review integration readiness, missing credentials, product decisions, and sequencing risks.',
        input: { probes: PROBES },
        mechanical_result: { results },
      }));
    } catch (e) {
      setAiResult({ error: e.message });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Integrations Status</h2>
          <p>NEEDS-CREDS endpoints. Each returns 503 with a machine-readable list of credentials required before it can be wired up.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={probeAll} disabled={loading}>Probe All</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>
      <div className="card">
        <table style={{ width: '100%' }}>
          <thead><tr>
            <th align="left">Integration</th>
            <th align="left">Path</th>
            <th align="left">Status</th>
            <th align="left">Required credentials</th>
          </tr></thead>
          <tbody>
            {PROBES.map(p => {
              const r = results[p.path];
              return (
                <tr
                  key={p.path}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetail({
                    title: `Integration — ${p.label}`,
                    data: { ...p, ...(r || { status: 'not_probed', body: null }) },
                  })}
                >
                  <td>{p.label}</td>
                  <td><code>/api/integrations/{p.path}</code></td>
                  <td>{r ? r.status : '—'}</td>
                  <td>{r?.body?.required_credentials ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {r.body.required_credentials.map((c, i) => <li key={i}><code>{c}</code></li>)}
                    </ul>
                  ) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default IntegrationsStatusPage;
