import React from 'react';
import CrudTable from '../components/CrudTable';
import { amendmentsApi } from '../services/api';

const STATUSES = ['proposed', 'approved', 'implemented'];

const columns = [
  { key: 'amendment_id', label: 'Amendment ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'version', label: 'Version' },
  { key: 'summary', label: 'Summary', format: v => v && v.length > 60 ? v.slice(0,60) + '...' : v },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'approved_at', label: 'Approved' },
];

const fields = [
  { key: 'amendment_id', label: 'Amendment ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'version', label: 'Version' },
  { key: 'summary', label: 'Summary', full: true, type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'approved_at', label: 'Approved At', type: 'date' },
];

const empty = { amendment_id:'', trial:'', version:'1.0', summary:'', status:'proposed', approved_at:'' };

export default function AmendmentsPage() {
  return (
    <CrudTable title="Amendments" subtitle="Protocol amendment register" columns={columns} fields={fields} emptyRow={empty} api={amendmentsApi} />
  );
}
