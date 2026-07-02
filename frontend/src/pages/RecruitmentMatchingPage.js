import React, { useEffect, useMemo, useState } from 'react';
import AIResult from '../components/AIResult';
import DetailModal from '../components/DetailModal';
import SampleButtons from '../components/SampleButtons';
import {
  deleteRecruitmentMatch,
  eligibilityReviews,
  featureAiAnalyze,
  getPatients,
  getTrials,
  recruitmentBiomarkers,
  recruitmentDrugInteractions,
  recruitmentMatches,
  recruitmentOutcomes,
  recruitmentRetentionRisk,
  recruitmentSummary,
  runEligibilityReview,
  scorePatientMatches,
  updateRecruitmentMatchStatus,
} from '../services/api';

const TABS = ['matches', 'eligibility', 'retention', 'biomarkers', 'interactions', 'outcomes'];

function pct(value) {
  const n = Number(value || 0);
  return `${Math.round(n)}%`;
}

function scoreColor(value) {
  const n = Number(value || 0);
  if (n >= 75) return '#16a34a';
  if (n >= 50) return '#ca8a04';
  return '#dc2626';
}

function patientName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || row.patient_id || `Patient ${row.patient_ref}`;
}

function RecruitmentMatchingPage() {
  const [tab, setTab] = useState('matches');
  const [summary, setSummary] = useState(null);
  const [matches, setMatches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [retention, setRetention] = useState(null);
  const [biomarkers, setBiomarkers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [trials, setTrials] = useState([]);
  const [detail, setDetail] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTrial, setSelectedTrial] = useState('');

  async function load() {
    setError(null);
    try {
      const [s, m, r, rr, b, d, o, p, t] = await Promise.all([
        recruitmentSummary(),
        recruitmentMatches(200),
        eligibilityReviews(),
        recruitmentRetentionRisk(),
        recruitmentBiomarkers(),
        recruitmentDrugInteractions(),
        recruitmentOutcomes(),
        getPatients(),
        getTrials(),
      ]);
      setSummary(s);
      setMatches(m.data || []);
      setReviews(r);
      setRetention(rr);
      setBiomarkers(b);
      setInteractions(d);
      setOutcomes(o);
      setPatients(p);
      setTrials(t);
      if (!selectedPatient && p[0]) setSelectedPatient(p[0].patient_id);
      if (!selectedTrial && t[0]) setSelectedTrial(t[0].trial_id);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  const activePatients = useMemo(() => patients.filter(p => p.patient_id), [patients]);
  const activeTrials = useMemo(() => trials.filter(t => t.trial_id), [trials]);

  async function scoreSelectedPatient() {
    setLoading(true); setError(null);
    try {
      const result = await scorePatientMatches(selectedPatient);
      setDetail({ title: `Scored ${selectedPatient}`, data: result });
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runReview() {
    setLoading(true); setError(null);
    try {
      const result = await runEligibilityReview({ patient_id: selectedPatient, trial_id: selectedTrial });
      setDetail({ title: `Eligibility review ${selectedPatient} / ${selectedTrial}`, data: result });
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function setMatchStatus(match, status) {
    setLoading(true); setError(null);
    try {
      await updateRecruitmentMatchStatus(match.id, { status, reason: `Updated from Recruitment & Matching page` });
      await load();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function runAiReview() {
    setAiLoading(true); setAiResult(null); setError(null);
    try {
      setAiResult(await featureAiAnalyze({
        feature: 'recruitment-matching',
        intent: 'Review patient-trial matching, eligibility, retention risk, biomarker, drug interaction, and outcome signals for operational risk.',
        input: { selected_patient: selectedPatient, selected_trial: selectedTrial },
        mechanical_result: { summary, top_matches: matches.slice(0, 20), retention: retention?.summary, reviews: reviews.slice(0, 20) },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Recruitment &amp; Matching</h2>
          <p>Patient-trial matching, eligibility review, retention risk, biomarkers, interactions, and outcomes merged from AIClinicalTrialMatching.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={load}>Refresh</button>
          <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>OpenRouter AI</button>
        </div>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card"><div className="stat-label">Patients</div><div className="stat-value">{summary?.patients ?? '-'}</div><div className="stat-sub">Clinical profiles</div></div>
        <div className="stat-card"><div className="stat-label">Matches</div><div className="stat-value">{summary?.matches ?? '-'}</div><div className="stat-sub">Ranked candidates</div></div>
        <div className="stat-card"><div className="stat-label">High Confidence</div><div className="stat-value">{summary?.high_confidence_matches ?? '-'}</div><div className="stat-sub">Score >= 70</div></div>
        <div className="stat-card"><div className="stat-label">Retention Watchlist</div><div className="stat-value">{summary?.retention_watchlist ?? '-'}</div><div className="stat-sub">Outreach priority</div></div>
      </div>

      <div className="card">
        <h3>Run Matching Workflow</h3>
        <SampleButtons
          feature="recruitment-matching"
          onPick={(values) => {
            if (values.patient_id !== undefined) setSelectedPatient(values.patient_id);
            if (values.trial_id !== undefined) setSelectedTrial(values.trial_id);
          }}
        />
        <div className="form-grid">
          <div className="form-group">
            <label>Patient</label>
            <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
              {activePatients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.patient_id} - {patientName(p)} {p.diagnosis ? `(${p.diagnosis})` : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Trial</label>
            <select value={selectedTrial} onChange={e => setSelectedTrial(e.target.value)}>
              {activeTrials.map(t => <option key={t.trial_id} value={t.trial_id}>{t.trial_id} - {t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={scoreSelectedPatient} disabled={loading || !selectedPatient}>Score Patient Against Trials</button>
          <button className="btn btn-secondary" onClick={runReview} disabled={loading || !selectedPatient || !selectedTrial}>Run Eligibility Review</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map(x => (
            <button key={x} className={`btn ${tab === x ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(x)}>
              {x[0].toUpperCase() + x.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'matches' && (
        <div className="card">
          <h3>Ranked Matches</h3>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Trial</th><th>Score</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} onClick={() => setDetail({ title: `${m.patient_id} / ${m.trial_id}`, data: m, onDelete: () => deleteRecruitmentMatch(m.id).then(load) })}>
                  <td>{patientName(m)}<br /><small>{m.diagnosis}</small></td>
                  <td>{m.trial_id}<br /><small>{m.trial_name}</small></td>
                  <td><strong style={{ color: scoreColor(m.match_score) }}>{pct(m.match_score)}</strong></td>
                  <td>{m.match_reason}</td>
                  <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary" onClick={() => setMatchStatus(m, 'screening')}>Screen</button>{' '}
                    <button className="btn btn-secondary" onClick={() => setMatchStatus(m, 'enrolled')}>Enroll</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'eligibility' && (
        <div className="card">
          <h3>Eligibility Reviews</h3>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Trial</th><th>Status</th><th>Score</th><th>Flags</th></tr></thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} onClick={() => setDetail({ title: `Eligibility ${r.patient_id} / ${r.trial_id}`, data: r })}>
                  <td>{r.patient_id}</td><td>{r.trial_id}<br /><small>{r.trial_name}</small></td><td>{r.status}</td><td>{pct(r.score)}</td><td>{Array.isArray(r.criteria_flags) ? r.criteria_flags.length : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'retention' && (
        <div className="card">
          <h3>Retention Risk</h3>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Trial</th><th>Risk</th><th>Driver</th><th>Travel</th></tr></thead>
            <tbody>
              {(retention?.participants || []).map(p => (
                <tr key={p.id} onClick={() => setDetail({ title: `Retention ${p.patient_id}`, data: p })}>
                  <td>{patientName(p)}</td><td>{p.trial}</td><td>{p.retention_risk}</td><td>{p.driver || 'None'}</td><td>{p.travel_minutes || 0} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'biomarkers' && (
        <div className="card">
          <h3>Biomarkers</h3>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Name</th><th>Value</th><th>Status</th><th>Significance</th></tr></thead>
            <tbody>{biomarkers.map(b => (
              <tr key={b.id} onClick={() => setDetail({ title: `Biomarker ${b.name}`, data: b })}>
                <td>{b.patient_id}</td><td>{b.name}</td><td>{b.value} {b.unit || ''}</td><td>{b.status}</td><td>{b.significance}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'interactions' && (
        <div className="card">
          <h3>Drug Interactions</h3>
          <table className="data-table">
            <thead><tr><th>Drug A</th><th>Drug B</th><th>Severity</th><th>Description</th><th>Recommendation</th></tr></thead>
            <tbody>{interactions.map(d => (
              <tr key={d.id} onClick={() => setDetail({ title: `${d.drug_a} / ${d.drug_b}`, data: d })}>
                <td>{d.drug_a}</td><td>{d.drug_b}</td><td>{d.severity}</td><td>{d.description}</td><td>{d.recommendation}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'outcomes' && (
        <div className="card">
          <h3>Outcomes</h3>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Trial</th><th>Endpoint</th><th>Value</th><th>Prediction</th></tr></thead>
            <tbody>{outcomes.map(o => (
              <tr key={o.id} onClick={() => setDetail({ title: `Outcome ${o.patient_id}`, data: o })}>
                <td>{o.patient_id}</td><td>{o.trial_id}</td><td>{o.endpoint}</td><td>{o.value} {o.unit || ''}</td><td>{o.prediction}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <AIResult result={aiResult} loading={aiLoading} error={null} />
      {detail && (
        <DetailModal
          title={detail.title}
          data={detail.data}
          onClose={() => setDetail(null)}
          onDelete={detail.onDelete ? async () => { await detail.onDelete(); setDetail(null); } : undefined}
        />
      )}
    </div>
  );
}

export default RecruitmentMatchingPage;
