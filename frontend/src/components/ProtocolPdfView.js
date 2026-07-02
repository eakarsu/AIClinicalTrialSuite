import React, { useEffect, useState } from 'react';
import { customViewsProtocolPdf, getTrials } from '../services/api';

/**
 * NON-VIZ - protocol "PDF" view. Pulls a server-rendered text protocol body
 * for a selected trial, displays it in a fixed-width readout, and offers
 * a one-click .txt download (a real binary PDF is overkill for a JSON API
 * demo; the body is shaped to look like a printable protocol).
 */
function ProtocolPdfView() {
  const [trials, setTrials] = useState([]);
  const [trialId, setTrialId] = useState('');
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTrials()
      .then(rows => {
        setTrials(rows);
        if (rows.length && !trialId) setTrialId(rows[0].trial_id);
      })
      .catch(e => setError(e.message));
  }, [trialId]);

  const load = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await customViewsProtocolPdf(id);
      setDoc(d);
    } catch (e) {
      setError(e.message);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (trialId) load(trialId); }, [trialId]);

  const download = () => {
    if (!doc) return;
    const blob = new Blob([doc.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="protocol-pdf-view" style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16,
    }}>
      <h3 style={{ margin: '0 0 4px' }}>Protocol PDF</h3>
      <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
        Generates a printable protocol document from the selected trial + its endpoints + design rules.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={trialId}
          onChange={e => setTrialId(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          {trials.map(t => (
            <option key={t.trial_id} value={t.trial_id}>{t.trial_id} - {t.name?.slice(0, 50)}</option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={() => load(trialId)} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <button className="btn btn-primary" onClick={download} disabled={!doc}>
          Download .txt
        </button>
      </div>

      {error && <div className="ai-error" style={{ marginBottom: 8 }}>{error}</div>}

      {doc && (
        <>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
            {doc.meta.endpoints} endpoints · {doc.meta.inclusion_rules} inclusion ·
            {' '}{doc.meta.exclusion_rules} exclusion
          </div>
          <pre style={{
            background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 6,
            fontSize: 11, lineHeight: 1.45, maxHeight: 360, overflow: 'auto',
            margin: 0,
          }}>{doc.body}</pre>
        </>
      )}
    </div>
  );
}

export default ProtocolPdfView;
