import React from 'react';
import CrudTable from '../components/CrudTable';
import { queriesApi } from '../services/api';

const columns = [
  { key: 'query_id', label: 'Query ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'patient', label: 'Patient' },
  { key: 'field', label: 'Field' },
  { key: 'question', label: 'Question', format: v => v && v.length > 60 ? v.slice(0,60) + '...' : v },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'query_id', label: 'Query ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'patient', label: 'Patient' },
  { key: 'field', label: 'Field' },
  { key: 'question', label: 'Question', full: true, type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'answered', 'closed'] },
  { key: 'raised_at', label: 'Raised At', type: 'date' },
  { key: 'answered_at', label: 'Answered At', type: 'date' },
];

const empty = { query_id:'', trial:'', patient:'', field:'', question:'', status:'open', raised_at:'', answered_at:'' };

export default function QueriesPage() {
  return (
    <CrudTable title="Queries" subtitle="EDC data queries and clarifications" columns={columns} fields={fields} emptyRow={empty} api={queriesApi} />
  );
}
