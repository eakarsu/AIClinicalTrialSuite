import React, { useEffect, useState } from 'react';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import { getAuditTrail, verifyAuditTrail, featureAiAnalyze } from '../services/api';

function AuditTrailPage() {
  const [events, setEvents] = useState([]);
  const [verify, setVerify] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setEvents(await getAuditTrail(200)); } catch (e) { setError(e.message); }
  }

  async function runVerify() {
    setVerifying(true); setVerify(null);
    try { setVerify(await verifyAuditTrail()); } catch (e) { setError(e.message); }
    finally { setVerifying(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const verification = verify || await verifyAuditTrail();
      if (!verify) setVerify(verification);
      setAiResult(await featureAiAnalyze({
        feature: 'audit-trail',
        intent: 'Review the audit trail verification status, write-event patterns, and Part 11-style compliance limitations.',
        input: { limit: 200 },
        mechanical_result: { verification, events: events.slice(0, 100) },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Audit Trail (Part 11-style)</h2>
          <p>Append-only, sha256 hash-chained record of every authenticated write. Tamper-evident, not a certified 21 CFR Part 11 system.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={load}>Refresh</button>
          <button className="btn btn-primary" onClick={runVerify} disabled={verifying}>{verifying ? 'Verifying…' : 'Verify Chain'}</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}

      {verify && (
        <div className="card" style={{ borderLeft: `4px solid ${verify.valid ? '#16a34a' : '#dc2626'}` }}>
          {verify.valid
            ? <>✔ Chain intact — {verify.events_checked} events verified. Head: <code>{verify.chain_head?.slice(0, 16)}…</code></>
            : <>✖ CHAIN BROKEN at event #{verify.first_broken_id} — a row was altered, deleted, or inserted out of band ({verify.events_checked} events checked).</>}
        </div>
      )}

      <div className="card">
        <h3>Events ({events.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead><tr><th align="left">#</th><th align="left">When</th><th align="left">Actor</th><th align="left">Role</th><th align="left">Action</th><th align="right">Status</th><th align="left">Hash</th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id} style={{ cursor: 'pointer' }}
                    onClick={() => setDetail({ title: `Audit event #${e.id}`, data: e })}>
                  <td>{e.id}</td>
                  <td>{e.created_at ? String(e.created_at).slice(0, 19).replace('T', ' ') : ''}</td>
                  <td>{e.actor}</td>
                  <td>{e.actor_role || '—'}</td>
                  <td><code>{e.method} {e.path}</code></td>
                  <td align="right">{e.status_code}</td>
                  <td><code>{(e.hash || '').slice(0, 12)}…</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AIResult result={aiResult} loading={aiLoading} error={null} />

      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default AuditTrailPage;
