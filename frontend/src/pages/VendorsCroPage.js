import React from 'react';
import CrudTable from '../components/CrudTable';
import { vendorsCroApi } from '../services/api';

const fmt = (v) => v == null ? '' : '$' + Number(v).toLocaleString();
const arrFmt = (v) => Array.isArray(v) ? v.join(', ') : (v || '');

const columns = [
  { key: 'cro_id', label: 'CRO ID' },
  { key: 'name', label: 'Name' },
  { key: 'services', label: 'Services', format: arrFmt },
  { key: 'contract_value_usd', label: 'Contract', format: fmt },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'started_at', label: 'Started' },
];

const fields = [
  { key: 'cro_id', label: 'CRO ID' },
  { key: 'name', label: 'Name', full: true },
  { key: 'services', label: 'Services (comma-separated)', full: true },
  { key: 'contract_value_usd', label: 'Contract Value USD', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'closing', 'ended'] },
  { key: 'started_at', label: 'Started At', type: 'date' },
];

const empty = { cro_id:'', name:'', services:'', contract_value_usd:0, status:'active', started_at:'' };

export default function VendorsCroPage() {
  return (
    <CrudTable title="CRO Vendors" subtitle="Contract research organisations and contract status" columns={columns} fields={fields} emptyRow={empty} api={vendorsCroApi} />
  );
}
