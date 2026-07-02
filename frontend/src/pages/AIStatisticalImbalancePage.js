import React from 'react';
import AIPage from '../components/AIPage';
import { aiStatisticalImbalance } from '../services/api';

export default function AIStatisticalImbalancePage() {
  return (
    <AIPage
      title="AI: Statistical Imbalance"
      subtitle="Detect arm-level covariate imbalance and quantify power impact."
      feature="statistical-imbalance"
      submitLabel="Analyse"
      defaults={{
        arm_data: {
          arm_a: { n: 150, mean_age: 62, pct_female: 45, baseline_score: 12.3 },
          arm_b: { n: 148, mean_age: 58, pct_female: 62, baseline_score: 10.1 },
          target_power: 0.8,
          alpha: 0.05,
        },
      }}
      fields={[{ key: 'arm_data', label: 'Arm Summary (JSON)', type: 'json', full: true }]}
      call={aiStatisticalImbalance}
    />
  );
}
