import React from 'react';
import CrudTable from '../components/CrudTable';
import { milestonesApi } from '../services/api';

const columns = [
  { key: 'milestone_id', label: 'Milestone ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'name', label: 'Name' },
  { key: 'target_date', label: 'Target' },
  { key: 'actual_date', label: 'Actual' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'milestone_id', label: 'Milestone ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'name', label: 'Name', type: 'select', options: ['FPI', 'LPI', 'DBLock', 'CSR'] },
  { key: 'target_date', label: 'Target Date', type: 'date' },
  { key: 'actual_date', label: 'Actual Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['on_track', 'delayed', 'met'] },
];

const empty = { milestone_id:'', trial:'', name:'FPI', target_date:'', actual_date:'', status:'on_track' };

export default function MilestonesPage() {
  return (
    <CrudTable title="Milestones" subtitle="FPI / LPI / DB Lock / CSR tracking" columns={columns} fields={fields} emptyRow={empty} api={milestonesApi} />
  );
}
