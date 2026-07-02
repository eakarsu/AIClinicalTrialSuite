import React from 'react';
import CrudTable from '../components/CrudTable';
import { budgetsApi } from '../services/api';

const fmt = (v) => v == null ? '' : '$' + Number(v).toLocaleString();

const columns = [
  { key: 'budget_id', label: 'Budget ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'category', label: 'Category' },
  { key: 'budgeted_usd', label: 'Budgeted', format: fmt },
  { key: 'spent_usd', label: 'Spent', format: fmt },
  { key: 'variance_pct', label: 'Variance %' },
  { key: 'period', label: 'Period' },
];

const fields = [
  { key: 'budget_id', label: 'Budget ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'category', label: 'Category' },
  { key: 'budgeted_usd', label: 'Budgeted USD', type: 'number' },
  { key: 'spent_usd', label: 'Spent USD', type: 'number' },
  { key: 'variance_pct', label: 'Variance %', type: 'number' },
  { key: 'period', label: 'Period' },
];

const empty = { budget_id:'', trial:'', category:'', budgeted_usd:0, spent_usd:0, variance_pct:0, period:'FY2025' };

export default function BudgetsPage() {
  return (
    <CrudTable title="Budgets" subtitle="Trial budgets, spend and variance" columns={columns} fields={fields} emptyRow={empty} api={budgetsApi} />
  );
}
