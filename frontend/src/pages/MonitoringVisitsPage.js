import React from 'react';
import CrudTable from '../components/CrudTable';
import { monitoringVisitsApi } from '../services/api';

const columns = [
  { key: 'visit_id', label: 'Visit ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'monitor', label: 'Monitor' },
  { key: 'scheduled_for', label: 'Scheduled' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'visit_id', label: 'Visit ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'monitor', label: 'Monitor' },
  { key: 'scheduled_for', label: 'Scheduled For', type: 'date' },
  { key: 'type', label: 'Type', type: 'select', options: ['SIV', 'IMV', 'COV'] },
  { key: 'status', label: 'Status', type: 'select', options: ['planned', 'complete', 'cancelled'] },
];

const empty = { visit_id:'', trial:'', site:'', monitor:'', scheduled_for:'', type:'IMV', status:'planned' };

export default function MonitoringVisitsPage() {
  return (
    <CrudTable title="Monitoring Visits" subtitle="SIV / IMV / COV visit planning" columns={columns} fields={fields} emptyRow={empty} api={monitoringVisitsApi} />
  );
}
