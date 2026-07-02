import React from 'react';
import CrudTable from '../components/CrudTable';
import { getProtocols, createProtocol, updateProtocol, deleteProtocol } from '../services/api';

const STATUSES = ['draft', 'in_review', 'approved', 'final', 'halted'];

const columns = [
  { key: 'protocol_id', label: 'Protocol ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'approved_by', label: 'Approved By' },
  { key: 'approved_at', label: 'Approved At', format: v => v ? String(v).slice(0,10) : '—' },
];

const fields = [
  { key: 'protocol_id', label: 'Protocol ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'approved_by', label: 'Approved By' },
  { key: 'approved_at', label: 'Approved At', type: 'date' },
];

const empty = { protocol_id:'', trial:'', version:'1.0', status:'draft', approved_by:'', approved_at:'' };

function ProtocolsPage() {
  return (
    <CrudTable
      title="Protocols" subtitle="Protocol versions and approvals"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getProtocols, create:createProtocol, update:updateProtocol, remove:deleteProtocol }}
    />
  );
}
export default ProtocolsPage;
