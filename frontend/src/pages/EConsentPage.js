import React, { useEffect, useState } from 'react';
import SampleButtons from '../components/SampleButtons';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import { getConsentForms, createConsentForm, getConsentRecords, signConsentRecord, featureAiAnalyze } from '../services/api';

function EConsentPage() {
  const [forms, setForms] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ form_id: '', trial: '', title: '', content: '' });
  const [sign, setSign] = useState({ form_id: '', patient: '', meaning: 'Consent obtained from subject', password: '' });
  const [detail, setDetail] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [f, r] = await Promise.all([getConsentForms(), getConsentRecords()]);
      setForms(f); setRecords(r);
      if (f.length && !sign.form_id) setSign(s => ({ ...s, form_id: f[0].form_id }));
    } catch (e) { setError(e.message); }
  }

  async function addForm() {
    setError(null);
    try {
      await createConsentForm(newForm);
      setShowNewForm(false);
      setNewForm({ form_id: '', trial: '', title: '', content: '' });
      await load();
    } catch (e) { setError(e.message); }
  }

  async function doSign() {
    setError(null); setInfo(null);
    try {
      const r = await signConsentRecord(sign);
      setInfo(`Signed: ${r.patient} on ${r.form_id} v${r.form_version} by ${r.signer_email} — signature ${r.signature_hash.slice(0, 16)}…`);
      setSign(s => ({ ...s, patient: '', password: '' }));
      await load();
    } catch (e) { setError(e.message); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      setAiResult(await featureAiAnalyze({
        feature: 'econsent',
        intent: 'Review eConsent form versioning, signature records, re-consent coverage, and Part 11-style limitations.',
        input: { pending_signature: { ...sign, password: sign.password ? '(provided)' : '' } },
        mechanical_result: { forms, records },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  const formIds = [...new Set(forms.map(f => f.form_id))];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>eConsent</h2>
          <p>Versioned consent forms + two-component e-signatures (your password is re-verified at signing). Signature hash binds signer, subject, form version, and timestamp.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)}>{showNewForm ? 'Cancel' : '+ New Form Version'}</button>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}
      {info && <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>{info}</div>}

      {showNewForm && (
        <div className="card">
          <h3>New Consent Form Version</h3>
          <div className="form-grid">
            <div className="form-group"><label>Form ID (same ID = new version)</label><input value={newForm.form_id} onChange={e => setNewForm({ ...newForm, form_id: e.target.value })} placeholder="ICF-ONCO-301" /></div>
            <div className="form-group"><label>Trial</label><input value={newForm.trial} onChange={e => setNewForm({ ...newForm, trial: e.target.value })} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Title</label><input value={newForm.title} onChange={e => setNewForm({ ...newForm, title: e.target.value })} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Content</label><textarea rows={4} value={newForm.content} onChange={e => setNewForm({ ...newForm, content: e.target.value })} /></div>
          </div>
          <button className="btn btn-primary" onClick={addForm} disabled={!newForm.form_id || !newForm.title}>Create</button>
        </div>
      )}

      <SampleButtons feature="econsent-sign" onPick={(v) => setSign(s => ({ ...s, ...v }))} />

      <div className="card">
        <h3>Sign Consent (e-signature)</h3>
        <div className="form-grid">
          <div className="form-group"><label>Form</label>
            <select value={sign.form_id} onChange={e => setSign({ ...sign, form_id: e.target.value })}>
              {formIds.map(id => <option key={id} value={id}>{id} (latest active version)</option>)}
            </select>
          </div>
          <div className="form-group"><label>Subject / Patient ID</label><input value={sign.patient} onChange={e => setSign({ ...sign, patient: e.target.value })} placeholder="PT-0001" /></div>
          <div className="form-group"><label>Meaning</label>
            <select value={sign.meaning} onChange={e => setSign({ ...sign, meaning: e.target.value })}>
              <option>Consent obtained from subject</option>
              <option>Re-consent after amendment</option>
              <option>Consent withdrawn</option>
            </select>
          </div>
          <div className="form-group"><label>Your password (e-signature)</label><input type="password" value={sign.password} onChange={e => setSign({ ...sign, password: e.target.value })} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={doSign} disabled={!sign.form_id || !sign.patient || !sign.password}>Sign</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>

      <div className="card">
        <h3>Consent Forms ({forms.length} versions)</h3>
        <table className="data-table" style={{ width: '100%' }}>
          <thead><tr><th align="left">Form</th><th align="right">Version</th><th align="left">Trial</th><th align="left">Title</th><th align="left">Status</th></tr></thead>
          <tbody>
            {forms.map(f => (
              <tr key={f.id} style={{ cursor: 'pointer' }}
                  onClick={() => setDetail({ title: `${f.form_id} v${f.version}`, data: f })}>
                <td>{f.form_id}</td><td align="right">{f.version}</td><td>{f.trial}</td><td>{f.title}</td><td><span className={`status-badge status-${f.status}`}>{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Consent Records ({records.length})</h3>
        <table className="data-table" style={{ width: '100%' }}>
          <thead><tr><th align="left">Subject</th><th align="left">Form</th><th align="right">v</th><th align="left">Meaning</th><th align="left">Signer</th><th align="left">Signed At</th><th align="left">Signature</th></tr></thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }}
                  onClick={() => setDetail({ title: `Consent — ${r.patient} on ${r.form_id} v${r.form_version}`, data: r })}>
                <td>{r.patient}</td><td>{r.form_id}</td><td align="right">{r.form_version}</td>
                <td>{r.meaning}</td><td>{r.signer_email}</td>
                <td>{r.signed_at ? String(r.signed_at).slice(0, 19).replace('T', ' ') : ''}</td>
                <td><code>{(r.signature_hash || '').slice(0, 12)}…</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default EConsentPage;
