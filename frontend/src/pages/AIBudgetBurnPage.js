import React from 'react';
import AIPage from '../components/AIPage';
import { aiBudgetBurn } from '../services/api';

export default function AIBudgetBurnPage() {
  return (
    <AIPage
      title="AI: Budget Burn"
      subtitle="Project burn rate and identify variance drivers."
      feature="budget-burn"
      submitLabel="Forecast Burn"
      defaults={{
        trial: { trial_id: 'ONCO-LUNG-301', phase: 'III' },
      }}
      fields={[
        { key: 'trial',   label: 'Trial (JSON, trial.trial_id auto-pulls budgets)', type: 'json', full: true },
        { key: 'budgets', label: 'Budgets (JSON, optional override)', type: 'json', full: true },
      ]}
      call={aiBudgetBurn}
    />
  );
}
