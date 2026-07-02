import React from 'react';
import CrudTable from '../components/CrudTable';
import { getPatients, createPatient, updatePatient, deletePatient } from '../services/api';

const STATUSES = ['screening', 'enrolled', 'active_followup', 'completed', 'withdrawn'];

const columns = [
  { key: 'patient_id', label: 'Patient ID' },
  { key: 'first_name', label: 'Name', format: (v, r) => [r.first_name, r.last_name].filter(Boolean).join(' ') || '—' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'arm', label: 'Arm' },
  { key: 'enrollment_status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'enrolled_at', label: 'Enrolled At', format: v => v ? String(v).slice(0,10) : '—' },
];

const fields = [
  { key: 'patient_id', label: 'Patient ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'stage', label: 'Stage' },
  { key: 'trial', label: 'Trial (trial_id)' },
  { key: 'site', label: 'Site (site_id)' },
  { key: 'arm', label: 'Arm / Cohort' },
  { key: 'enrollment_status', label: 'Status', type: 'select', options: STATUSES },
  { key: 'enrolled_at', label: 'Enrolled At', type: 'date' },
  { key: 'biomarkers', label: 'Biomarkers', type: 'textarea', full: true },
  { key: 'medical_history', label: 'Medical History', type: 'textarea', full: true },
  { key: 'current_medications', label: 'Current Medications', type: 'textarea', full: true },
  { key: 'travel_minutes', label: 'Travel Minutes', type: 'number' },
  { key: 'caregiver_support', label: 'Caregiver Support', type: 'checkbox' },
  { key: 'mrn', label: 'MRN' },
  { key: 'source', label: 'Source' },
];

const empty = {
  patient_id:'', first_name:'', last_name:'', date_of_birth:'', gender:'', email:'', phone:'',
  diagnosis:'', stage:'', trial:'', site:'', arm:'', enrollment_status:'screening', enrolled_at:'',
  biomarkers:'', medical_history:'', current_medications:'', travel_minutes:0, caregiver_support:true, mrn:'', source:'manual',
};

function PatientsPage() {
  return (
    <CrudTable
      title="Patients" subtitle="Trial enrollment tracking"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getPatients, create:createPatient, update:updatePatient, remove:deletePatient }}
    />
  );
}
export default PatientsPage;
