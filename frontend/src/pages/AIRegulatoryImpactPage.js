import React from 'react';
import AIPage from '../components/AIPage';
import { aiRegulatoryImpact } from '../services/api';

export default function AIRegulatoryImpactPage() {
  return (
    <AIPage
      title="AI: Regulatory Impact (Amendment)"
      subtitle="Assess regulatory impact of a proposed protocol amendment."
      feature="regulatory-impact"
      submitLabel="Assess Impact"
      defaults={{
        amendment: {
          amendment_id: 'AMD-NEW-001',
          trial: 'ONCO-LUNG-301',
          version: '1.2',
          summary: 'Expand eligibility to PD-L1 TPS 1-49% sub-cohort, add stratification factor; sample size increases 600 → 720.',
        },
      }}
      fields={[{ key: 'amendment', label: 'Amendment (JSON)', type: 'json', full: true }]}
      call={aiRegulatoryImpact}
    />
  );
}
