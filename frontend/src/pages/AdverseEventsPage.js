import React from 'react';
import CrudTable from '../components/CrudTable';
import { getAdverseEvents, createAdverseEvent, updateAdverseEvent, deleteAdverseEvent } from '../services/api';

const SEVERITY = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
const OUTCOMES = ['Recovered', 'Recovering', 'Recovered with sequelae', 'Not recovered', 'Fatal', 'Unknown'];

const columns = [
  { key: 'event_id', label: 'Event ID' },
  { key: 'patient', label: 'Patient' },
  { key: 'trial', label: 'Trial' },
  { key: 'term', label: 'MedDRA Term' },
  { key: 'severity', label: 'Severity' },
  { key: 'serious', label: 'SAE', format: v => v ? 'Yes' : 'No' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'reported_at', label: 'Reported', format: v => v ? String(v).slice(0,10) : '—' },
];

const fields = [
  { key: 'event_id', label: 'Event ID' },
  { key: 'patient', label: 'Patient (patient_id)' },
  { key: 'trial', label: 'Trial (trial_id)' },
  { key: 'term', label: 'MedDRA Preferred Term', full: true },
  { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY },
  { key: 'serious', label: 'Serious (SAE)', type: 'checkbox' },
  { key: 'outcome', label: 'Outcome', type: 'select', options: OUTCOMES },
  { key: 'reported_at', label: 'Reported At', type: 'date' },
];

const empty = { event_id:'', patient:'', trial:'', term:'', severity:'Grade 1', serious:false, outcome:'Recovered', reported_at:'' };

function AdverseEventsPage() {
  return (
    <CrudTable
      title="Adverse Events" subtitle="MedDRA-aligned safety log"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getAdverseEvents, create:createAdverseEvent, update:updateAdverseEvent, remove:deleteAdverseEvent }}
    />
  );
}
export default AdverseEventsPage;
