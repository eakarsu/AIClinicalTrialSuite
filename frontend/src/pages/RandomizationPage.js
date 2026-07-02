import React, { useEffect, useState } from 'react';
import SampleButtons from '../components/SampleButtons';
import DetailModal from '../components/DetailModal';
import AIResult from '../components/AIResult';
import {
  listRandomizationSchemes, createRandomizationScheme,
  getRandomizationScheme, randomizeSubject,
  getIrtKits, getIrtDispenses, dispenseIrtKit,
  featureAiAnalyze,
} from '../services/api';

function RandomizationPage() {
  const [schemes, setSchemes] = useState([]);
  const [kits, setKits] = useState([]);
  const [dispenses, setDispenses] = useState([]);
  const [selected, setSelected] = useState(null);   // full scheme incl. assignments
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [stratum, setStratum] = useState('');
  const [detail, setDetail] = useState(null);       // { title, data } for the popup
  const [form, setForm] = useState({
    scheme_id: '', trial: '', block_size: 4,
    arms: '[{"name":"Active","ratio":1},{"name":"Placebo","ratio":1}]',
    strata: '[]',
    category_schema: '[{"category":"treatment_arm","source":"arms","allowed_values":["Active","Placebo"],"use_in_randomization":true,"use_in_irt":true}]',
    seed: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [s, k, d] = await Promise.all([listRandomizationSchemes(), getIrtKits(), getIrtDispenses()]);
      setSchemes(s);
      setKits(k);
      setDispenses(d);
    } catch (e) { setError(e.message); }
  }

  async function open(schemeId) {
    setError(null); setInfo(null);
    try {
      const s = await getRandomizationScheme(schemeId);
      setSelected(s);
      setStratum((s.strata && s.strata[0]) || '');
    } catch (e) { setError(e.message); }
  }

  async function createScheme() {
    setError(null);
    try {
      const body = { ...form, block_size: Number(form.block_size) };
      try { body.arms = JSON.parse(form.arms); } catch (_) { return setError('Arms must be valid JSON'); }
      try { body.strata = JSON.parse(form.strata); } catch (_) { return setError('Strata must be valid JSON'); }
      try { body.category_schema = JSON.parse(form.category_schema); } catch (_) { return setError('Category Schema must be valid JSON'); }
      await createRandomizationScheme(body);
      setShowNew(false);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function assign() {
    if (!selected || !subjectId.trim()) return;
    setError(null); setInfo(null);
    try {
      const a = await randomizeSubject(selected.scheme_id, { subject_id: subjectId.trim(), stratum });
      setInfo(`Subject ${a.subject_id} randomized to "${a.arm}" (block ${a.block_no}, slot ${a.position})`);
      setSubjectId('');
      await open(selected.scheme_id);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function dispense(subjectIdToDispense) {
    if (!selected || !subjectIdToDispense) return;
    setError(null); setInfo(null);
    try {
      const d = await dispenseIrtKit({ scheme_id: selected.scheme_id, subject_id: subjectIdToDispense });
      setInfo(`IRT kit ${d.dispense.kit_id} dispensed to ${d.dispense.subject_id} (${d.dispense.arm})`);
      await open(selected.scheme_id);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function runAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      setAiResult(await featureAiAnalyze({
        feature: 'randomization',
        intent: 'Review the IWRS/IRT randomization scheme, allocations, kit inventory, dispense status, strata, block size, and assignment auditability.',
        input: { form, subject_id: subjectId, stratum },
        mechanical_result: { schemes, selected, kits, dispenses },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  async function runNewSchemeAiReview() {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      let parsedArms = form.arms;
      let parsedStrata = form.strata;
      try { parsedArms = JSON.parse(form.arms); } catch (_) { /* keep raw text for AI review */ }
      try { parsedStrata = JSON.parse(form.strata); } catch (_) { /* keep raw text for AI review */ }
      const draftScheme = {
        ...form,
        block_size: Number(form.block_size),
        arms: parsedArms,
        strata: parsedStrata,
      };
      const out = await featureAiAnalyze({
        feature: 'randomization-irt-category-schema',
        intent: 'Return STRICT JSON with a top-level category_schema array for this draft randomization/IWRS/IRT scheme. Each item needs category, source, allowed_values, use_in_randomization, use_in_irt, validation_rule, notes.',
        input: draftScheme,
        mechanical_result: { draft_scheme: draftScheme, existing_schemes: schemes, current_irt_inventory: kits },
      });
      setAiResult(out);
      if (Array.isArray(out.category_schema)) {
        setForm(prev => ({ ...prev, category_schema: JSON.stringify(out.category_schema, null, 2) }));
      }
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Randomization / IWRS / IRT</h2>
          <p>Permuted-block randomization plus IRT kit inventory and dispensing. Deterministic and auditable: assignments re-derive from (seed, stratum, block), while IRT dispense rows track medication-kit allocation.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : '+ New Scheme'}</button>
      </div>

      {error && <div className="card" style={{ borderLeft: '4px solid #dc2626', color: '#dc2626' }}>{error}</div>}
      {info && <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>{info}</div>}

      <SampleButtons feature="randomization-scheme" onPick={(v) => { setForm(f => ({ ...f, ...v })); setShowNew(true); }} />

      {showNew && (
        <div className="card">
          <h3>New Scheme</h3>
          <div className="form-grid">
            <div className="form-group"><label>Scheme ID</label><input value={form.scheme_id} onChange={e => setForm({ ...form, scheme_id: e.target.value })} /></div>
            <div className="form-group"><label>Trial ID</label><input value={form.trial} onChange={e => setForm({ ...form, trial: e.target.value })} /></div>
            <div className="form-group"><label>Block Size</label><input type="number" value={form.block_size} onChange={e => setForm({ ...form, block_size: e.target.value })} /></div>
            <div className="form-group"><label>Seed (blank = auto)</label><input value={form.seed} onChange={e => setForm({ ...form, seed: e.target.value })} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Arms (JSON: name + ratio)</label><textarea rows={2} value={form.arms} onChange={e => setForm({ ...form, arms: e.target.value })} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Strata (JSON array of labels; [] = unstratified)</label><textarea rows={2} value={form.strata} onChange={e => setForm({ ...form, strata: e.target.value })} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Category Schema (JSON: randomization + IRT categories)</label><textarea rows={5} value={form.category_schema} onChange={e => setForm({ ...form, category_schema: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={createScheme}>Create Scheme</button>
            <button className="btn btn-ai" onClick={runNewSchemeAiReview} disabled={aiLoading}>
              {aiLoading ? 'Running AI...' : 'OpenRouter AI'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Schemes</h3>
        <table className="data-table" style={{ width: '100%' }}>
          <thead><tr><th align="left">Scheme</th><th align="left">Trial</th><th align="left">Method</th><th align="right">Block</th><th align="left">Arms</th><th align="left">Status</th><th /></tr></thead>
          <tbody>
            {schemes.map(s => (
              <tr key={s.id} style={{ cursor: 'pointer' }}
                  onClick={() => setDetail({ title: `Scheme ${s.scheme_id}`, data: s })}>
                <td>{s.scheme_id}</td>
                <td>{s.trial}</td>
                <td>{s.method}</td>
                <td align="right">{s.block_size}</td>
                <td>{(s.arms || []).map(a => `${a.name} (${a.ratio})`).join(' : ')}</td>
                <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
                <td><button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); open(s.scheme_id); }}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <h3>{selected.scheme_id} — Randomize Subject</h3>
          <div className="form-grid">
            <div className="form-group"><label>Subject ID</label><input value={subjectId} onChange={e => setSubjectId(e.target.value)} placeholder="e.g. PT-0101" /></div>
            {(selected.strata || []).length > 0 && (
              <div className="form-group"><label>Stratum</label>
                <select value={stratum} onChange={e => setStratum(e.target.value)}>
                  {selected.strata.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={assign} disabled={!subjectId.trim()}>Randomize</button>
            <button className="btn btn-ai" onClick={runAiReview} disabled={aiLoading}>{aiLoading ? 'Running AI...' : 'OpenRouter AI'}</button>
          </div>

          <h3 style={{ marginTop: 20 }}>Assignments ({(selected.assignments || []).length})</h3>
          <table className="data-table" style={{ width: '100%' }}>
            <thead><tr><th align="left">Subject</th><th align="left">Stratum</th><th align="left">Arm</th><th align="right">Block</th><th align="right">Slot</th><th align="left">By</th><th align="left">At</th><th /></tr></thead>
            <tbody>
              {(selected.assignments || []).map(a => (
                <tr key={a.id} style={{ cursor: 'pointer' }}
                    onClick={() => setDetail({ title: `Assignment ${a.subject_id}`, data: a })}>
                  <td>{a.subject_id}</td>
                  <td>{a.stratum || '—'}</td>
                  <td>{a.arm}</td>
                  <td align="right">{a.block_no}</td>
                  <td align="right">{a.position}</td>
                  <td>{a.assigned_by || ''}</td>
                  <td>{a.assigned_at ? String(a.assigned_at).slice(0, 19).replace('T', ' ') : ''}</td>
                  <td><button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); dispense(a.subject_id); }}>Dispense IRT Kit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3>IRT Kit Inventory ({kits.length})</h3>
        <table className="data-table" style={{ width: '100%' }}>
          <thead><tr><th align="left">Kit</th><th align="left">Trial</th><th align="left">Site</th><th align="left">Arm</th><th align="left">Lot</th><th align="left">Status</th><th align="left">Assigned Subject</th></tr></thead>
          <tbody>
            {kits.slice(0, 80).map(k => (
              <tr key={k.id} style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: `IRT kit — ${k.kit_id}`, data: k })}>
                <td>{k.kit_id}</td><td>{k.trial}</td><td>{k.site}</td><td>{k.arm}</td><td>{k.lot}</td>
                <td><span className={`status-badge status-${k.status}`}>{k.status}</span></td>
                <td>{k.assigned_subject || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>IRT Dispenses ({dispenses.length})</h3>
        <table className="data-table" style={{ width: '100%' }}>
          <thead><tr><th align="left">Dispense</th><th align="left">Subject</th><th align="left">Arm</th><th align="left">Kit</th><th align="left">Site</th><th align="left">At</th></tr></thead>
          <tbody>
            {dispenses.slice(0, 80).map(d => (
              <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setDetail({ title: `IRT dispense — ${d.dispense_id}`, data: d })}>
                <td>{d.dispense_id}</td><td>{d.subject_id}</td><td>{d.arm}</td><td>{d.kit_id}</td><td>{d.site || '—'}</td>
                <td>{d.dispensed_at ? String(d.dispensed_at).slice(0, 19).replace('T', ' ') : ''}</td>
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
export default RandomizationPage;
