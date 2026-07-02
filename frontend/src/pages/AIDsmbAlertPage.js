import React from 'react';
import AIPage from '../components/AIPage';
import { aiDsmbAlert } from '../services/api';

export default function AIDsmbAlertPage() {
  return (
    <AIPage
      title="AI: DSMB Alert"
      subtitle="Draft a DSMB-style safety alert from recent AE data."
      feature="dsmb-alert"
      submitLabel="Draft Alert"
      defaults={{
        trial: { trial_id: 'ONCO-LUNG-301', name: 'NSCLC Phase III', indication: 'NSCLC' },
        ae_data: [
          { term: 'Pneumonitis grade 3', severity: 'Grade 3', serious: true, outcome: 'Recovering' },
          { term: 'Hepatotoxicity grade 4', severity: 'Grade 4', serious: true, outcome: 'Recovering' },
        ],
      }}
      fields={[
        { key: 'trial',   label: 'Trial (JSON)',   type: 'json', full: true },
        { key: 'ae_data', label: 'AE Data (JSON, optional — auto-pulls if trial.trial_id set)', type: 'json', full: true },
      ]}
      call={aiDsmbAlert}
    />
  );
}
