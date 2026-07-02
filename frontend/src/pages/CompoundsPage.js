import React from 'react';
import CrudTable from '../components/CrudTable';
import { getCompounds, createCompound, updateCompound, deleteCompound } from '../services/api';

const PHASES = ['Preclinical', 'I', 'I/II', 'II', 'II/III', 'III', 'Approved'];

const columns = [
  { key: 'compound_id', label: 'ID' },
  { key: 'code', label: 'Code' },
  { key: 'generic_name', label: 'Generic Name' },
  { key: 'therapeutic_area', label: 'Therapeutic Area' },
  { key: 'mechanism', label: 'Mechanism', format: v => v && v.length > 50 ? v.slice(0,50) + '...' : v },
  { key: 'phase_max_reached', label: 'Max Phase' },
  { key: 'ic50_nm', label: 'IC50 (nM)' },
];

const fields = [
  { key: 'compound_id', label: 'Compound ID' },
  { key: 'code', label: 'Internal Code' },
  { key: 'generic_name', label: 'Generic Name' },
  { key: 'therapeutic_area', label: 'Therapeutic Area' },
  { key: 'mechanism', label: 'Mechanism of Action', full: true, type: 'textarea' },
  { key: 'phase_max_reached', label: 'Max Phase Reached', type: 'select', options: PHASES },
  { key: 'ic50_nm', label: 'IC50 (nM)', type: 'number' },
];

const empty = { compound_id:'', code:'', generic_name:'', therapeutic_area:'', mechanism:'', phase_max_reached:'I', ic50_nm:0 };

function CompoundsPage() {
  return (
    <CrudTable
      title="Compounds" subtitle="Investigational compound library"
      columns={columns} fields={fields} emptyRow={empty}
      api={{ list:getCompounds, create:createCompound, update:updateCompound, remove:deleteCompound }}
    />
  );
}
export default CompoundsPage;
