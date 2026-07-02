import React, { useState } from 'react';
import AIResult from '../components/AIResult';
import AIHistory from '../components/AIHistory';
import SampleButtons from '../components/SampleButtons';
import { aiIndNdaSection } from '../services/api';

const FEATURE = 'ind-nda-section';

const SECTIONS = [
  'Module 2.5 Clinical Overview',
  'Module 2.7 Clinical Summary',
  'Module 5 Clinical Study Reports',
  'Investigator\'s Brochure — Pharmacology',
  'Investigator\'s Brochure — Clinical Experience',
  'IND Form FDA-1571 cover letter',
];

function AIIndNdaSectionPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form, setForm] = useState({
    section: SECTIONS[0],
    indication: 'Non-Small Cell Lung Cancer',
    compound: 'Pembrolizumab (MK-3475)',
    program_stage: 'Phase 3 readout',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await aiIndNdaSection(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>IND/NDA Section Drafter</h2>
          <p>ADVISORY ONLY. Outline-quality only. Must be authored/owned by Regulatory Affairs before any submission.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <p style={{ color: '#92400e', fontSize: 13 }}>ADVISORY ONLY — requires expert review — not for regulatory submission.</p>
        <SampleButtons feature={FEATURE} onPick={(values) => setForm(prev => ({ ...prev, ...values }))} />
        <div className="form-grid">
          <div className="form-group full"><label>Section</label>
            <select name="section" value={form.section} onChange={onChange}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Indication</label><input name="indication" value={form.indication} onChange={onChange} /></div>
          <div className="form-group"><label>Compound</label><input name="compound" value={form.compound} onChange={onChange} /></div>
          <div className="form-group full"><label>Program Stage</label><input name="program_stage" value={form.program_stage} onChange={onChange} /></div>
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>Draft Outline</button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIHistory feature={FEATURE} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
export default AIIndNdaSectionPage;
