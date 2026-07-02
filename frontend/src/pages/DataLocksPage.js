import React from 'react';
import CrudTable from '../components/CrudTable';
import { dataLocksApi } from '../services/api';

const columns = [
  { key: 'lock_id', label: 'Lock ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'lock_type', label: 'Type' },
  { key: 'locked_at', label: 'Locked At' },
  { key: 'locked_by', label: 'Locked By' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'lock_id', label: 'Lock ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'lock_type', label: 'Lock Type', type: 'select', options: ['interim', 'final'] },
  { key: 'locked_at', label: 'Locked At', type: 'date' },
  { key: 'locked_by', label: 'Locked By' },
  { key: 'status', label: 'Status', type: 'select', options: ['locked', 'unlocked'] },
];

const empty = { lock_id:'', trial:'', lock_type:'interim', locked_at:'', locked_by:'', status:'locked' };

export default function DataLocksPage() {
  return (
    <CrudTable title="Data Locks" subtitle="Interim and final database locks" columns={columns} fields={fields} emptyRow={empty} api={dataLocksApi} />
  );
}
