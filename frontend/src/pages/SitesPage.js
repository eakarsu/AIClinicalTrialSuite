import React from 'react';
import CrudTable from '../components/CrudTable';
import { getSites, createSite, updateSite, deleteSite } from '../services/api';

const STATUSES = ['active', 'recruiting', 'pending_activation', 'closed'];

const columns = [
  { key: 'site_id', label: 'Site ID' },
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'principal_investigator', label: 'PI' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'site_id', label: 'Site ID' },
  { key: 'name', label: 'Name', full: true },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'principal_investigator', label: 'Principal Investigator' },
  { key: 'capacity', label: 'Capacity', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
];

const empty = { site_id:'', name:'', city:'', country:'', principal_investigator:'', capacity:50, status:'active' };

function SitesPage() {
  return (
    <CrudTable
      title="Sites" subtitle="Investigator site network"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getSites, create:createSite, update:updateSite, remove:deleteSite }}
    />
  );
}
export default SitesPage;
