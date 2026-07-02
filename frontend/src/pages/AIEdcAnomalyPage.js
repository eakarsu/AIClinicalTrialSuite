import React from 'react';
import AIPage from '../components/AIPage';
import { aiEdcAnomaly } from '../services/api';

export default function AIEdcAnomalyPage() {
  return (
    <AIPage
      title="AI: EDC Anomaly Detection"
      subtitle="Flag data-entry anomalies, outliers, and transcription errors."
      feature="edc-anomaly"
      submitLabel="Detect Anomalies"
      defaults={{
        edc_data: [
          { patient: 'PT-0001', visit: 'Week 4', sbp: 120, dbp: 80, weight_kg: 72 },
          { patient: 'PT-0002', visit: 'Week 4', sbp: 320, dbp: 60, weight_kg: 70 },
          { patient: 'PT-0003', visit: 'Week 4', sbp: 118, dbp: 78, weight_kg: 7.2 },
          { patient: 'PT-0004', visit: 'Week 4', sbp: 124, dbp: 82, weight_kg: 71 },
        ],
      }}
      fields={[{ key: 'edc_data', label: 'EDC Rows (JSON)', type: 'json', full: true }]}
      call={aiEdcAnomaly}
    />
  );
}
