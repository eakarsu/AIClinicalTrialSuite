import React from 'react';
import AIPage from '../components/AIPage';
import { aiDeviationClassifier } from '../services/api';

export default function AIDeviationClassifierPage() {
  return (
    <AIPage
      title="AI: Deviation Classifier"
      subtitle="Classify a protocol deviation as major/minor with impact assessment."
      feature="deviation-classifier"
      submitLabel="Classify"
      defaults={{
        deviation: {
          deviation_id: 'DEV-NEW-001',
          trial: 'ONCO-LUNG-301',
          site: 'SITE-003',
          description: 'Patient enrolled with ECOG 2 (protocol requires 0-1)',
          root_cause: 'PI misread eligibility checklist',
        },
      }}
      fields={[
        { key: 'deviation', label: 'Deviation (JSON)', type: 'json', full: true },
      ]}
      call={aiDeviationClassifier}
    />
  );
}
