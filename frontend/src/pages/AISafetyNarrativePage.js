import React from 'react';
import AIPage from '../components/AIPage';
import { aiSafetyNarrative } from '../services/api';

function AISafetyNarrativePage() {
  return (
    <AIPage
      title="Safety Narrative Generator (advisory)"
      subtitle="ADVISORY ONLY — drafts a CIOMS-style narrative from an adverse event record. Medical-monitor review required."
      feature="safety-narrative"
      defaults={{ event_id: '' }}
      fields={[{ key: 'event_id', label: 'Adverse Event ID (e.g. AE-001)', full: true }]}
      call={aiSafetyNarrative}
      submitLabel="Draft Narrative"
    />
  );
}
export default AISafetyNarrativePage;
