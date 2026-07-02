import React from 'react';
import AIPage from '../components/AIPage';
import { aiIrbPkgDrafter } from '../services/api';

export default function AIIrbPkgDrafterPage() {
  return (
    <AIPage
      title="AI: IRB Package Drafter"
      subtitle="Generate an IRB submission package outline from a protocol."
      feature="irb-pkg-drafter"
      submitLabel="Draft Package"
      defaults={{
        protocol: {
          protocol_id: 'PROT-ONCO-301-v1.0',
          trial: 'ONCO-LUNG-301',
          indication: 'NSCLC',
          phase: 'III',
          design: 'Randomized, double-blind, placebo-controlled',
          population: 'Adults with metastatic NSCLC, PD-L1 TPS >= 1%',
        },
      }}
      fields={[{ key: 'protocol', label: 'Protocol (JSON)', type: 'json', full: true }]}
      call={aiIrbPkgDrafter}
    />
  );
}
