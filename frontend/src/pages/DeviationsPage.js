import React from 'react';
import CrudTable from '../components/CrudTable';
import { deviationsApi } from '../services/api';

const columns = [
  { key: 'deviation_id', label: 'Deviation ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'type', label: 'Type', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'description', label: 'Description', format: v => v && v.length > 60 ? v.slice(0,60) + '...' : v },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'deviation_id', label: 'Deviation ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'type', label: 'Type', type: 'select', options: ['major', 'minor'] },
  { key: 'description', label: 'Description', full: true, type: 'textarea' },
  { key: 'root_cause', label: 'Root Cause', full: true, type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed'] },
];

const empty = { deviation_id:'', trial:'', site:'', type:'minor', description:'', root_cause:'', status:'open' };

export default function DeviationsPage() {
  return (
    <CrudTable title="Deviations" subtitle="Protocol deviations and corrective actions" columns={columns} fields={fields} emptyRow={empty} api={deviationsApi} />
  );
}
