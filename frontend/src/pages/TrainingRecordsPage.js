import React, { useState } from 'react';
import CrudTable from '../components/CrudTable';
import AIResult from '../components/AIResult';
import { getTrainingRecords, createTrainingRecord, updateTrainingRecord, deleteTrainingRecord, featureAiAnalyze } from '../services/api';

const TYPES = ['gcp', 'protocol', 'system', 'iata', 'other'];
const STATUSES = ['current', 'expired', 'pending'];

const columns = [
  { key: 'record_id', label: 'Record ID' },
  { key: 'staff_name', label: 'Staff' },
  { key: 'course', label: 'Course' },
  { key: 'course_type', label: 'Type' },
  { key: 'completed_at', label: 'Completed', format: v => v ? String(v).slice(0, 10) : '' },
  { key: 'expires_at', label: 'Expires', format: v => v ? String(v).slice(0, 10) : '—' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'record_id', label: 'Record ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'staff_name', label: 'Staff Name' },
  { key: 'course', label: 'Course', full: true },
  { key: 'course_type', label: 'Type', type: 'select', options: TYPES },
  { key: 'completed_at', label: 'Completed', type: 'date' },
  { key: 'expires_at', label: 'Expires', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
];

const empty = { record_id: '', trial: '', site: '', staff_name: '', course: '', course_type: 'gcp', completed_at: '', expires_at: '', status: 'current' };

function TrainingRecordsPage() {
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runAiReview(rows) {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const data = rows && rows.length ? rows : await getTrainingRecords();
      setAiResult(await featureAiAnalyze({
        feature: 'training-records',
        intent: 'Review training completeness, expired records, role/course fit, and site readiness risks.',
        input: { row_count: data.length },
        mechanical_result: { rows: data },
      }));
    } catch (e) { setError(e.message); }
    finally { setAiLoading(false); }
  }

  return (
    <>
      {error && <div className="ai-error">{error}</div>}
      <CrudTable
        title="Training Records" subtitle="GCP / protocol / system training per staff member"
        columns={columns} fields={fields} emptyRow={empty}
        api={{ list: getTrainingRecords, create: createTrainingRecord, update: updateTrainingRecord, remove: deleteTrainingRecord }}
        extraActions={({ filtered }) => (
          <button className="btn btn-ai" onClick={() => runAiReview(filtered)} disabled={aiLoading}>
            {aiLoading ? 'Running AI...' : 'OpenRouter AI'}
          </button>
        )}
      />
      <AIResult result={aiResult} loading={aiLoading} error={null} />
    </>
  );
}
export default TrainingRecordsPage;
