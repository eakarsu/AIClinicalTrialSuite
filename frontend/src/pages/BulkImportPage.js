import React, { useState } from 'react';
import { bulkImport } from '../services/api';

const ENTITIES = [
  { key: 'patients',      headers: 'patient_id,trial,site,enrollment_status,enrolled_at,arm',
    sample: 'PT-NEW-01,ONCO-LUNG-301,SITE-001,screening,,TBD\nPT-NEW-02,ONCO-LUNG-301,SITE-002,enrolled,2025-05-10,Pembrolizumab + Pemetrexed' },
  { key: 'sites',         headers: 'site_id,name,city,country,principal_investigator,capacity,status',
    sample: 'SITE-NEW-1,University Medical Center Utrecht,Utrecht,Netherlands,Prof. Anna de Vries,55,active' },
  { key: 'investigators', headers: 'investigator_id,name,title,site,specialty,trials_count,certifications',
    sample: 'INV-NEW-1,Dr. Elena Rossi,MD PhD,SITE-NEW-1,Oncology,7,EMA GCP' },
];

export default function BulkImportPage() {
  const [entity, setEntity] = useState('patients');
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cur = ENTITIES.find(e => e.key === entity);

  const useSample = () => setCsv(`${cur.headers}\n${cur.sample}`);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(f);
  };

  const onRun = async () => {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await bulkImport(entity, csv)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Bulk Import</h2><p>Upload CSV to upsert patients, sites, or investigators.</p></div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>Entity</label>
            <select value={entity} onChange={e => { setEntity(e.target.value); setCsv(''); setResult(null); }}>
              {ENTITIES.map(e => <option key={e.key} value={e.key}>{e.key}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>CSV File</label>
            <input type="file" accept=".csv,text/csv" onChange={onFile} />
          </div>
          <div className="form-group full">
            <label>Expected headers: <code>{cur.headers}</code></label>
            <textarea rows={10} value={csv} onChange={e => setCsv(e.target.value)} placeholder="Paste CSV here (first line = headers)" />
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button className="btn btn-secondary" onClick={useSample}>Use Sample CSV</button>
          <button className="btn btn-primary" onClick={onRun} disabled={loading || !csv.trim()}>{loading ? 'Importing...' : 'Run Import'}</button>
        </div>
      </div>

      {error && <div className="ai-error" style={{ marginTop:16 }}>{error}</div>}
      {result && (
        <div className="card" style={{ marginTop:16 }}>
          <h3>Result</h3>
          <p>
            Entity <strong>{result.entity}</strong> · total {result.total} ·
            inserted <strong>{result.inserted}</strong> ·
            updated <strong>{result.updated}</strong> ·
            failed <strong>{result.failed}</strong>
          </p>
          {result.errors?.length > 0 && (
            <>
              <h4>Errors (first {result.errors.length})</h4>
              <pre>{JSON.stringify(result.errors, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
