import React from 'react';
import AIPage from '../components/AIPage';
import { aiQueryResolver } from '../services/api';

export default function AIQueryResolverPage() {
  return (
    <AIPage
      title="AI: Query Resolver"
      subtitle="Suggest resolution and clarification template for an EDC query."
      feature="query-resolver"
      submitLabel="Resolve"
      defaults={{
        query: {
          query_id: 'Q-NEW-001',
          trial: 'ONCO-LUNG-301',
          patient: 'PT-0001',
          field: 'PD-L1 TPS',
          question: 'TPS value missing from baseline pathology report — please clarify.',
        },
      }}
      fields={[{ key: 'query', label: 'Query (JSON)', type: 'json', full: true }]}
      call={aiQueryResolver}
    />
  );
}
