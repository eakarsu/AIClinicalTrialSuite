import React from 'react';
import CrudTable from '../components/CrudTable';
import { getEndpoints, createEndpoint, updateEndpoint, deleteEndpoint } from '../services/api';

const TYPES = ['primary', 'secondary', 'exploratory'];

const columns = [
  { key: 'endpoint_id', label: 'ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'type', label: 'Type', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'measure', label: 'Measure', format: v => v && v.length > 60 ? v.slice(0,60) + '...' : v },
  { key: 'timepoint', label: 'Timepoint' },
  { key: 'statistical_method', label: 'Stat Method', format: v => v && v.length > 50 ? v.slice(0,50) + '...' : v },
];

const fields = [
  { key: 'endpoint_id', label: 'Endpoint ID' },
  { key: 'trial', label: 'Trial (trial_id)' },
  { key: 'type', label: 'Type', type: 'select', options: TYPES },
  { key: 'measure', label: 'Measure', full: true, type: 'textarea' },
  { key: 'timepoint', label: 'Timepoint' },
  { key: 'statistical_method', label: 'Statistical Method', full: true, type: 'textarea' },
];

const empty = { endpoint_id:'', trial:'', type:'primary', measure:'', timepoint:'', statistical_method:'' };

function EndpointsPage() {
  return (
    <CrudTable
      title="Endpoints" subtitle="Trial endpoint definitions"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getEndpoints, create:createEndpoint, update:updateEndpoint, remove:deleteEndpoint }}
    />
  );
}
export default EndpointsPage;
