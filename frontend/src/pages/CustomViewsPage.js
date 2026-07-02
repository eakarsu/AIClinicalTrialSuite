import React from 'react';
import TrialTimelineView from '../components/TrialTimelineView';
import EndpointCoverageHeatmap from '../components/EndpointCoverageHeatmap';
import ProtocolPdfView from '../components/ProtocolPdfView';
import DesignRulesEditor from '../components/DesignRulesEditor';

/**
 * Trial Design Views - 4 derived views (2 VIZ + 2 NON-VIZ) composed on top
 * of the existing trials / endpoints data plus an in-memory design-rules store.
 */
function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h2>Trial Design Views</h2>
          <p>Four derived views: timeline + endpoint coverage + protocol PDF + design rules editor.</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 16,
      }}>
        <TrialTimelineView />
        <EndpointCoverageHeatmap />
        <ProtocolPdfView />
        <DesignRulesEditor />
      </div>
    </div>
  );
}

export default CustomViewsPage;
