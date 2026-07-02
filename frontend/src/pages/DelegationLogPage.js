import React, { useState } from 'react';
import CrudTable from '../components/CrudTable';
import AIResult from '../components/AIResult';
import { getDelegationLog, createDelegationLog, updateDelegationLog, deleteDelegationLog, featureAiAnalyze } from '../services/api';

const STATUSES = ['active', 'expired', 'revoked'];

const columns = [
  { key: 'entry_id', label: 'Entry ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'staff_name', label: 'Staff' },
  { key: 'staff_role', label: 'Role' },
  { key: 'delegated_tasks', label: 'Delegated Tasks', format: v => v && v.length > 50 ? v.slice(0, 50) + '...' : v },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'entry_id', label: 'Entry ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'staff_name', label: 'Staff Name' },
  { key: 'staff_role', label: 'Role' },
  { key: 'delegated_tasks', label: 'Delegated Tasks', type: 'textarea', full: true },
  { key: 'delegated_by', label: 'Delegated By (PI)' },
  { key: 'effective_from', label: 'Effective From', type: 'date' },
  { key: 'effective_to', label: 'Effective To', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
];

const empty = { entry_id: '', trial: '', site: '', staff_name: '', staff_role: '', delegated_tasks: '', delegated_by: '', effective_from: '', effective_to: '', status: 'active' };

function DelegationLogPage() {
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runAiReview(rows) {
    setAiLoading(true); setError(null); setAiResult(null);
    try {
      const data = rows && rows.length ? rows : await getDelegationLog();
      setAiResult(await featureAiAnalyze({
        feature: 'delegation-log',
        intent: 'Review delegation-of-authority coverage, task appropriateness, expiry gaps, and Form 1572/GCP operational risks.',
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
        title="Delegation Log" subtitle="Delegation of authority per site (ICH-GCP / Form 1572 section 6)"
        columns={columns} fields={fields} emptyRow={empty}
        api={{ list: getDelegationLog, create: createDelegationLog, update: updateDelegationLog, remove: deleteDelegationLog }}
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
export default DelegationLogPage;
