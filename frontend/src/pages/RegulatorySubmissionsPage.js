import React from 'react';
import CrudTable from '../components/CrudTable';
import { regulatorySubmissionsApi } from '../services/api';

const columns = [
  { key: 'sub_id', label: 'Submission ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'agency', label: 'Agency' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'submitted_at', label: 'Submitted' },
];

const fields = [
  { key: 'sub_id', label: 'Submission ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'agency', label: 'Agency', type: 'select', options: ['FDA', 'EMA', 'PMDA'] },
  { key: 'type', label: 'Type', type: 'select', options: ['IND', 'IMPD', 'CTA'] },
  { key: 'status', label: 'Status', type: 'select', options: ['submitted', 'approved', 'rejected'] },
  { key: 'submitted_at', label: 'Submitted At', type: 'date' },
];

const empty = { sub_id:'', trial:'', agency:'FDA', type:'IND', status:'submitted', submitted_at:'' };

export default function RegulatorySubmissionsPage() {
  return (
    <CrudTable title="Regulatory Submissions" subtitle="IND / IMPD / CTA filings to FDA / EMA / PMDA" columns={columns} fields={fields} emptyRow={empty} api={regulatorySubmissionsApi} />
  );
}
