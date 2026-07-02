import React, { useEffect, useState } from 'react';
import AIResult from './AIResult';
import AIHistory from './AIHistory';
import { aiSamples, featureAiAnalyze } from '../services/api';

/**
 * Reusable AI page scaffold.
 * props:
 *   title, subtitle
 *   feature: ai_results.feature key (for history)
 *   defaults: object — initial form values
 *   fields:   [{ key, label, type ('text'|'number'|'textarea'|'select'|'date'|'json'), options?, full? }]
 *   call:     async (form) => result
 *   submitLabel?: string
 */
export default function AIPage({ title, subtitle, feature, defaults, fields, call, submitLabel = 'Run' }) {
  const [form, setForm] = useState(defaults || {});
  const [result, setResult] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    if (!feature) return;
    aiSamples(feature)
      .then(r => setSamples(Array.isArray(r?.samples) ? r.samples : []))
      .catch(() => setSamples([]));
  }, [feature]);

  const onChange = (key, value) => setForm(p => ({ ...p, [key]: value }));

  // Apply a sample-scenario into the form. JSON-typed fields get stringified
  // so the textarea shows them; the submit handler will parse them back.
  const applySample = (sample) => {
    if (!sample || !sample.values) return;
    setForm(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(sample.values)) {
        const f = fields.find(ff => ff.key === k);
        if (f && f.type === 'json' && typeof v !== 'string') {
          next[k] = JSON.stringify(v, null, 2);
        } else {
          next[k] = v;
        }
      }
      return next;
    });
    setResult(null);
    setError(null);
  };

  const buildPayload = () => {
    const payload = { ...form };
    for (const f of fields) {
      if (f.type === 'json' && typeof payload[f.key] === 'string') {
        try { payload[f.key] = JSON.parse(payload[f.key]); } catch (_) { /* keep as string */ }
      }
    }
    return payload;
  };

  const onSubmit = async () => {
    setLoading(true); setError(null); setResult(null); setAiReview(null);
    try {
      setResult(await call(buildPayload()));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const onAiReview = async () => {
    setAiLoading(true); setError(null); setAiReview(null);
    try {
      const payload = buildPayload();
      const baseResult = result || await call(payload);
      if (!result) setResult(baseResult);
      setAiReview(await featureAiAnalyze({
        feature,
        intent: `Review the ${title} feature output and compare it with the deterministic/memory-backed result.`,
        input: payload,
        mechanical_result: baseResult,
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  };

  const renderField = (f) => {
    const v = form[f.key] ?? '';
    if (f.type === 'select')   return <select value={v} onChange={(e) => onChange(f.key, e.target.value)}>{f.options.map(o => <option key={o}>{o}</option>)}</select>;
    if (f.type === 'textarea') return <textarea rows={3} value={v} onChange={(e) => onChange(f.key, e.target.value)} />;
    if (f.type === 'json')     return <textarea rows={6} value={typeof v === 'string' ? v : JSON.stringify(v, null, 2)} onChange={(e) => onChange(f.key, e.target.value)} />;
    if (f.type === 'number')   return <input type="number" value={v} onChange={(e) => onChange(f.key, e.target.value)} step="any" />;
    if (f.type === 'date')     return <input type="date" value={v ? String(v).slice(0,10) : ''} onChange={(e) => onChange(f.key, e.target.value)} />;
    return <input value={v} onChange={(e) => onChange(f.key, e.target.value)} />;
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="btn btn-secondary" onClick={() => setHistoryOpen(true)}>History</button>
      </div>
      <div className="card">
        {samples.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Sample scenarios — click to fill the form:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {samples.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => applySample(s)}
                  title={`Fill form with: ${s.label}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="form-grid">
          {fields.map(f => (
            <div key={f.key} className={`form-group ${f.full ? 'full' : ''}`}>
              <label>{f.label}</label>
              {renderField(f)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display:'flex', justifyContent:'flex-end', gap: 8 }}>
          <button className="btn btn-ai" onClick={onSubmit} disabled={loading}>{submitLabel}</button>
          <button className="btn btn-secondary" onClick={onAiReview} disabled={aiLoading}>
            {aiLoading ? 'Running AI...' : 'OpenRouter AI'}
          </button>
        </div>
      </div>
      <AIResult result={result} loading={loading} error={error} />
      <AIResult result={aiReview} loading={aiLoading} error={null} />
      <AIHistory feature={feature} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
