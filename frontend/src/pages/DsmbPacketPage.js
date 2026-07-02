import React from 'react';
import AIPage from '../components/AIPage';
import { dsmbPacket } from '../services/api';

function DsmbPacketPage() {
  return (
    <AIPage
      title="DSMB Packet Generator"
      subtitle="Aggregates enrollment, AE, deviation, query, and milestone data for one trial. AI executive summary is ADVISORY ONLY."
      feature="dsmb-packet"
      defaults={{ trial: 'ONCO-LUNG-301' }}
      fields={[{ key: 'trial', label: 'Trial ID', full: true }]}
      call={dsmbPacket}
      submitLabel="Generate Packet"
    />
  );
}
export default DsmbPacketPage;
