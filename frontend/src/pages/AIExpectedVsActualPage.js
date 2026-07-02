import React from 'react';
import AIPage from '../components/AIPage';
import { aiExpectedVsActual } from '../services/api';

export default function AIExpectedVsActualPage() {
  return (
    <AIPage
      title="AI: Expected vs Actual AE Rates"
      subtitle="Compare observed AE rates to literature baseline for this indication/compound."
      feature="expected-vs-actual"
      submitLabel="Compare"
      defaults={{
        trial: { trial_id: 'ONCO-LUNG-301', indication: 'NSCLC', compound: 'Pembrolizumab' },
        actual_ae_rates: {
          pneumonitis_any: 0.08,
          hypothyroidism: 0.10,
          colitis_grade3plus: 0.04,
        },
      }}
      fields={[
        { key: 'trial', label: 'Trial (JSON)', type: 'json', full: true },
        { key: 'actual_ae_rates', label: 'Actual AE Rates (JSON)', type: 'json', full: true },
      ]}
      call={aiExpectedVsActual}
    />
  );
}
