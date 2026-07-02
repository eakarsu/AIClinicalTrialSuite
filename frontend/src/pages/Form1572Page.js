import React, { useEffect, useState } from 'react';
import SampleButtons from '../components/SampleButtons';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import { generateForm1572, getInvestigators, getTrials, featureAiAnalyze } from '../services/api';

function Form1572Page() {
  const [investigators, setInvestigators] = useState([]);
  const [trials, setTrials] = useState([]);
  const [investigatorId, setInvestigatorId] = useState('');
  const [trial, setTrial] = useState('');
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getInvestigators().then(rows => {
      setInvestigators(rows);
      if (rows.length) setInvestigatorId(rows[0].investigator_id);
    }).catch(e => setError(e.message));
    getTrials().then(setTrials).catch(() => {});
  }, []);

  async function run() {
    setLoading(true); setError(null); setResult(null); setAiResult(null);
    try { setResult(await generateForm1572({ investigator_id: investigatorId, trial: trial || undefined })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const draft = result || await generateForm1572({ investigator_id: investigatorId, trial: trial || undefined });
      if (!result) setResult(draft);
      setAiResult(await featureAiAnalyze({
        feature: 'form-1572',
        intent: 'Review this draft Form FDA 1572 assembly for missing sections, regulatory caveats, and operational risks.',
        input: { investigator_id: investigatorId, trial },
        mechanical_result: draft,
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  const Section = ({ title, children }) => (
    <div style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
      <strong>{title}</strong>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Form FDA 1572 (Draft)</h2>
          <p>Deterministic DRAFT assembly from investigator, site, trial, and delegation-log records. Requires signature + regulatory review before any use.</p>
        </div>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}

      <SampleButtons feature="form-1572" onPick={(v) => { if (v.investigator_id !== undefined) setInvestigatorId(v.investigator_id); if (v.trial !== undefined) setTrial(v.trial); }} />

      <div className="card">
        <div className="form-grid">
          <div className="form-group"><label>Investigator</label>
            <select value={investigatorId} onChange={e => setInvestigatorId(e.target.value)}>
              {investigators.map(i => <option key={i.investigator_id} value={i.investigator_id}>{i.investigator_id} — {i.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Protocol / Trial (optional)</label>
            <select value={trial} onChange={e => setTrial(e.target.value)}>
              <option value="">— none —</option>
              {trials.map(t => <option key={t.trial_id} value={t.trial_id}>{t.trial_id}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={run} disabled={loading || !investigatorId}>{loading ? 'Generating…' : 'Generate Draft 1572'}</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading || !investigatorId}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
        </div>
      </div>

      {result && (
        <div className="card">
          <div style={{ background: '#fef3c7', padding: 8, borderRadius: 6, marginBottom: 10, fontSize: 13 }}>{result.status}</div>
          <Section title="1. Investigator">
            {result.section_1_investigator?.name} — {result.section_1_investigator?.title} ({result.section_1_investigator?.specialty})<br />
            <span style={{ color: '#64748b' }}>{result.section_1_investigator?.certifications}</span>
          </Section>
          <Section title="2. Education / CV">{result.section_2_education}</Section>
          <Section title="3. Facility">
            {result.section_3_facility
              ? `${result.section_3_facility.name} (${result.section_3_facility.site_id}) — ${result.section_3_facility.city}, ${result.section_3_facility.country}`
              : '—'}
          </Section>
          <Section title="4. Clinical Laboratory">{result.section_4_clinical_lab}</Section>
          <Section title="5. IRB">{result.section_5_irb}</Section>
          <Section title="6. Sub-investigators (from active delegation log)">
            {(result.section_6_sub_investigators || []).length === 0 ? '—' : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.section_6_sub_investigators.map(s => (
                  <li key={s.entry_id} style={{ cursor: 'pointer' }}
                      onClick={() => setDetail({ title: `Sub-investigator — ${s.staff_name}`, data: s })}>
                    {s.staff_name} — {s.staff_role} <span style={{ color: '#64748b' }}>({s.delegated_tasks})</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="7. Protocol">
            {result.section_7_protocol
              ? `${result.section_7_protocol.trial_id} — ${result.section_7_protocol.name} (Phase ${result.section_7_protocol.phase}, ${result.section_7_protocol.sponsor})`
              : '—'}
          </Section>
          <Section title="8. Commitments">{result.section_8_commitments}</Section>
        </div>
      )}
      <AIResult result={aiResult} loading={aiLoading} error={null} />

      {detail && <DetailModal title={detail.title} data={detail.data} onClose={() => setDetail(null)} />}
    </div>
  );
}
export default Form1572Page;
