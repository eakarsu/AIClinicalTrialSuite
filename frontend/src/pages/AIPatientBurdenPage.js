import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiPatientBurden } from '../services/api';

const FEATURE = 'patient-burden';

const DEFAULT_VISITS = [
  { name: 'Screening', travel_minutes: 45, procedures: [
    { name: 'Informed consent', minutes: 30 },
    { name: 'Medical history', minutes: 20 },
    { name: 'Phlebotomy (panel)', minutes: 15 },
    { name: 'ECG', minutes: 10 },
  ] },
  { name: 'Week 4', travel_minutes: 45, procedures: [
    { name: 'Vitals', minutes: 10 },
    { name: 'Phlebotomy', minutes: 10 },
    { name: 'PRO questionnaires', minutes: 25 },
  ] },
  { name: 'Week 12', travel_minutes: 45, procedures: [
    { name: 'Vitals', minutes: 10 },
    { name: 'Imaging (CT)', minutes: 60 },
    { name: 'Phlebotomy', minutes: 10 },
  ] },
];

function AIPatientBurdenPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [visits, setVisits] = useState(DEFAULT_VISITS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateVisit = (idx, key, value) => {
    const next = visits.slice();
    next[idx] = { ...next[idx], [key]: value };
    setVisits(next);
  };
  const updateProc = (vIdx, pIdx, key, value) => {
    const next = visits.slice();
    const procs = next[vIdx].procedures.slice();
    procs[pIdx] = { ...procs[pIdx], [key]: key === 'minutes' ? Number(value) : value };
    next[vIdx] = { ...next[vIdx], procedures: procs };
    setVisits(next);
  };
  const addVisit = () => setVisits([...visits, { name: 'New visit', travel_minutes: 30, procedures: [{ name: 'Procedure', minutes: 15 }] }]);
  const addProc = (vIdx) => {
    const next = visits.slice();
    next[vIdx] = { ...next[vIdx], procedures: [...(next[vIdx].procedures || []), { name: 'New procedure', minutes: 15 }] };
    setVisits(next);
  };

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiPatientBurden({ visits })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Patient Burden Estimator</h2>
          <p>MECHANICAL — sums procedure + travel minutes per visit and tags overall intensity. AI narrative is plain-language only.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        <SampleButtons feature={FEATURE} onPick={(values) => {
          if (Array.isArray(values.visits)) setVisits(values.visits);
        }} />
        {visits.map((v, vIdx) => (
          <div key={vIdx} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 12 }}>
            <div className="form-grid">
              <div className="form-group"><label>Visit Name</label><input value={v.name} onChange={(e) => updateVisit(vIdx, 'name', e.target.value)} /></div>
              <div className="form-group"><label>One-way travel (min)</label><input type="number" value={v.travel_minutes} onChange={(e) => updateVisit(vIdx, 'travel_minutes', Number(e.target.value))} /></div>
            </div>
            <table style={{ width: '100%', marginTop: 8 }}>
              <thead><tr><th align="left">Procedure</th><th align="right">Minutes</th></tr></thead>
              <tbody>
                {(v.procedures || []).map((p, pIdx) => (
                  <tr key={pIdx}>
                    <td><input style={{ width: '100%' }} value={p.name} onChange={(e) => updateProc(vIdx, pIdx, 'name', e.target.value)} /></td>
                    <td align="right"><input type="number" style={{ width: 80 }} value={p.minutes} onChange={(e) => updateProc(vIdx, pIdx, 'minutes', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-secondary" style={{ marginTop: 4 }} onClick={() => addProc(vIdx)}>+ Procedure</button>
          </div>
        ))}
        <button className="btn btn-secondary" onClick={addVisit}>+ Visit</button>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Estimate Burden</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIPatientBurdenPage;
