import React from 'react';
import CrudTable from '../components/CrudTable';
import { getTrials, createTrial, updateTrial, deleteTrial } from '../services/api';

const PHASES = ['I', 'I/II', 'II', 'II/III', 'III', 'IV'];
const STATUSES = ['planning', 'recruiting', 'active', 'completed', 'halted'];

const columns = [
  { key: 'trial_id', label: 'Trial ID' },
  { key: 'name', label: 'Name', format: v => v && v.length > 60 ? v.slice(0,60) + '...' : v },
  { key: 'indication', label: 'Indication' },
  { key: 'phase', label: 'Phase' },
  { key: 'target_enrollment', label: 'Target' },
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
];

const fields = [
  { key: 'trial_id', label: 'Trial ID' },
  { key: 'name', label: 'Name', full: true },
  { key: 'indication', label: 'Indication' },
  { key: 'phase', label: 'Phase', type: 'select', options: PHASES },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'sponsor', label: 'Sponsor' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'target_enrollment', label: 'Target Enrollment', type: 'number' },
  { key: 'current_enrollment', label: 'Current Enrollment', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea', full: true },
  { key: 'eligibility_criteria', label: 'Eligibility Criteria', type: 'textarea', full: true },
  { key: 'recruitment_summary', label: 'Recruitment Summary', type: 'textarea', full: true },
];

const empty = {
  trial_id:'', name:'', indication:'', phase:'II', status:'planning', sponsor:'', start_date:'',
  target_enrollment:'', current_enrollment:0, description:'', eligibility_criteria:'', recruitment_summary:'',
};

function TrialsPage() {
  return (
    <CrudTable
      title="Trials" subtitle="Clinical trial portfolio"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getTrials, create:createTrial, update:updateTrial, remove:deleteTrial }}
    />
  );
}
export default TrialsPage;
