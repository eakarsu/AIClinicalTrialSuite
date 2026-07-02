import React from 'react';
import CrudTable from '../components/CrudTable';
import { getInvestigators, createInvestigator, updateInvestigator, deleteInvestigator } from '../services/api';

const columns = [
  { key: 'investigator_id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'site', label: 'Site' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'trials_count', label: '# Trials' },
];

const fields = [
  { key: 'investigator_id', label: 'Investigator ID' },
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'site', label: 'Site (site_id)' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'trials_count', label: 'Trials Count', type: 'number' },
  { key: 'certifications', label: 'Certifications', full: true, type: 'textarea' },
];

const empty = { investigator_id:'', name:'', title:'', site:'', specialty:'', trials_count:0, certifications:'' };

function InvestigatorsPage() {
  return (
    <CrudTable
      title="Investigators" subtitle="Principal & sub-investigators"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getInvestigators, create:createInvestigator, update:updateInvestigator, remove:deleteInvestigator }}
    />
  );
}
export default InvestigatorsPage;
