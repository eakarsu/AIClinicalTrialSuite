import React from 'react';
import AIPage from '../components/AIPage';
import { aiMilestoneForecaster } from '../services/api';

export default function AIMilestoneForecasterPage() {
  return (
    <AIPage
      title="AI: Milestone Forecaster"
      subtitle="Forecast FPI/LPI/DBLock/CSR dates and program risk."
      feature="milestone-forecaster"
      submitLabel="Forecast"
      defaults={{
        trial: { trial_id: 'ONCO-LUNG-301', indication: 'NSCLC', phase: 'III' },
        enrollment_curve: [
          { month: '2024-09', enrolled: 5 },
          { month: '2024-10', enrolled: 18 },
          { month: '2024-11', enrolled: 34 },
          { month: '2024-12', enrolled: 52 },
        ],
      }}
      fields={[
        { key: 'trial',            label: 'Trial (JSON)', type: 'json', full: true },
        { key: 'enrollment_curve', label: 'Enrollment Curve (JSON, optional)', type: 'json', full: true },
      ]}
      call={aiMilestoneForecaster}
    />
  );
}
