import React from 'react';
import AIPage from '../components/AIPage';
import { aiMeddraCode } from '../services/api';

function AIMeddraCodePage() {
  return (
    <AIPage
      title="MedDRA Coding Assistant (advisory)"
      subtitle="ADVISORY ONLY — proposes SOC/PT-style terms. NOT a licensed MedDRA dictionary; a certified coder must verify every code."
      feature="meddra-code"
      defaults={{ terms: 'severe headache with nausea\nelevated liver enzymes\ninjection site redness and swelling' }}
      fields={[{ key: 'terms', label: 'Verbatim AE terms (one per line)', type: 'textarea', full: true }]}
      call={aiMeddraCode}
      submitLabel="Propose Codes"
    />
  );
}
export default AIMeddraCodePage;
