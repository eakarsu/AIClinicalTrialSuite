import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

import LoginPage from './pages/LoginPage';

// Original 8 CRUD
import TrialsPage from './pages/TrialsPage';
import SitesPage from './pages/SitesPage';
import ProtocolsPage from './pages/ProtocolsPage';
import InvestigatorsPage from './pages/InvestigatorsPage';
import PatientsPage from './pages/PatientsPage';
import CompoundsPage from './pages/CompoundsPage';
import EndpointsPage from './pages/EndpointsPage';
import AdverseEventsPage from './pages/AdverseEventsPage';

// New 10 CRUD
import AmendmentsPage from './pages/AmendmentsPage';
import DeviationsPage from './pages/DeviationsPage';
import MonitoringVisitsPage from './pages/MonitoringVisitsPage';
import QueriesPage from './pages/QueriesPage';
import DataLocksPage from './pages/DataLocksPage';
import MilestonesPage from './pages/MilestonesPage';
import BudgetsPage from './pages/BudgetsPage';
import VendorsCroPage from './pages/VendorsCroPage';
import RegulatorySubmissionsPage from './pages/RegulatorySubmissionsPage';
import SupplyShipmentsPage from './pages/SupplyShipmentsPage';

// Original 6 AI
import AIDraftProtocolPage from './pages/AIDraftProtocolPage';
import AIRecommendEndpointsPage from './pages/AIRecommendEndpointsPage';
import AISizeCohortPage from './pages/AISizeCohortPage';
import AISelectSitesPage from './pages/AISelectSitesPage';
import AIModelRiskPage from './pages/AIModelRiskPage';
import AIGenerateBriefPage from './pages/AIGenerateBriefPage';

// New 10 AI
import AIDeviationClassifierPage from './pages/AIDeviationClassifierPage';
import AIDsmbAlertPage from './pages/AIDsmbAlertPage';
import AIEdcAnomalyPage from './pages/AIEdcAnomalyPage';
import AIStatisticalImbalancePage from './pages/AIStatisticalImbalancePage';
import AIExpectedVsActualPage from './pages/AIExpectedVsActualPage';
import AIIrbPkgDrafterPage from './pages/AIIrbPkgDrafterPage';
import AIQueryResolverPage from './pages/AIQueryResolverPage';
import AIMilestoneForecasterPage from './pages/AIMilestoneForecasterPage';
import AIBudgetBurnPage from './pages/AIBudgetBurnPage';
import AIRegulatoryImpactPage from './pages/AIRegulatoryImpactPage';

// System
import WebhooksPage from './pages/WebhooksPage';
import BulkImportPage from './pages/BulkImportPage';

// Custom Views (Trial Design Views)
import CustomViewsPage from './pages/CustomViewsPage';
import SiteActivationRiskPage from './pages/SiteActivationRiskPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Pass 7 (full backlog) — MECHANICAL + ADVISORY ONLY + IRB state-machine
import AIPowerCalcExplainPage from './pages/AIPowerCalcExplainPage';
import AIPatientBurdenPage from './pages/AIPatientBurdenPage';
import AIIeOptimizerPage from './pages/AIIeOptimizerPage';
import AIIndNdaSectionPage from './pages/AIIndNdaSectionPage';
import AIDropoutPredictorPage from './pages/AIDropoutPredictorPage';
import AIAdaptiveSimPage from './pages/AIAdaptiveSimPage';
import AIRweMatchPage from './pages/AIRweMatchPage';
import ComparableTrialsPage from './pages/ComparableTrialsPage';
import ProtocolVersionGraphPage from './pages/ProtocolVersionGraphPage';
import IrbWorkflowsPage from './pages/IrbWorkflowsPage';
import IntegrationsStatusPage from './pages/IntegrationsStatusPage';

// Pass 8 (trial conduct) — randomization, SDTM, DSMB, forecast, 1572, logs
import RandomizationPage from './pages/RandomizationPage';
import SdtmExportPage from './pages/SdtmExportPage';
import DsmbPacketPage from './pages/DsmbPacketPage';
import EnrollmentForecastPage from './pages/EnrollmentForecastPage';
import AIMeddraCodePage from './pages/AIMeddraCodePage';
import AISafetyNarrativePage from './pages/AISafetyNarrativePage';
import Form1572Page from './pages/Form1572Page';
import DelegationLogPage from './pages/DelegationLogPage';
import TrainingRecordsPage from './pages/TrainingRecordsPage';

// Pass 9 — live CT.gov, design statistics, audit chain, eConsent
import CtgovSearchPage from './pages/CtgovSearchPage';
import DesignSimulatorPage from './pages/DesignSimulatorPage';
import AuditTrailPage from './pages/AuditTrailPage';
import EConsentPage from './pages/EConsentPage';
import ProductionReadinessPage from './pages/ProductionReadinessPage';
import RecruitmentMatchingPage from './pages/RecruitmentMatchingPage';

function AppShell({ user, onLogout }) {
  return (
    <div className="app">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="main">
        <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

          <Route path="/" element={<Dashboard />} />

          <Route path="/trials" element={<TrialsPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/protocols" element={<ProtocolsPage />} />
          <Route path="/investigators" element={<InvestigatorsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/recruitment-matching" element={<RecruitmentMatchingPage />} />
          <Route path="/compounds" element={<CompoundsPage />} />
          <Route path="/endpoints" element={<EndpointsPage />} />
          <Route path="/adverse-events" element={<AdverseEventsPage />} />

          <Route path="/amendments"             element={<AmendmentsPage />} />
          <Route path="/deviations"             element={<DeviationsPage />} />
          <Route path="/monitoring-visits"      element={<MonitoringVisitsPage />} />
          <Route path="/site-activation-risk"   element={<SiteActivationRiskPage />} />
          <Route path="/queries"                element={<QueriesPage />} />
          <Route path="/data-locks"             element={<DataLocksPage />} />
          <Route path="/milestones"             element={<MilestonesPage />} />
          <Route path="/budgets"                element={<BudgetsPage />} />
          <Route path="/vendors-cro"            element={<VendorsCroPage />} />
          <Route path="/regulatory-submissions" element={<RegulatorySubmissionsPage />} />
          <Route path="/supply-shipments"       element={<SupplyShipmentsPage />} />

          <Route path="/ai/draft-protocol"        element={<AIDraftProtocolPage />} />
          <Route path="/ai/recommend-endpoints"   element={<AIRecommendEndpointsPage />} />
          <Route path="/ai/size-cohort"           element={<AISizeCohortPage />} />
          <Route path="/ai/select-sites"          element={<AISelectSitesPage />} />
          <Route path="/ai/model-risk"            element={<AIModelRiskPage />} />
          <Route path="/ai/generate-brief"        element={<AIGenerateBriefPage />} />

          <Route path="/ai/deviation-classifier"  element={<AIDeviationClassifierPage />} />
          <Route path="/ai/dsmb-alert"            element={<AIDsmbAlertPage />} />
          <Route path="/ai/edc-anomaly"           element={<AIEdcAnomalyPage />} />
          <Route path="/ai/statistical-imbalance" element={<AIStatisticalImbalancePage />} />
          <Route path="/ai/expected-vs-actual"    element={<AIExpectedVsActualPage />} />
          <Route path="/ai/irb-pkg-drafter"       element={<AIIrbPkgDrafterPage />} />
          <Route path="/ai/query-resolver"        element={<AIQueryResolverPage />} />
          <Route path="/ai/milestone-forecaster"  element={<AIMilestoneForecasterPage />} />
          <Route path="/ai/budget-burn"           element={<AIBudgetBurnPage />} />
          <Route path="/ai/regulatory-impact"     element={<AIRegulatoryImpactPage />} />

          <Route path="/webhooks"    element={<WebhooksPage />} />
          <Route path="/bulk-import" element={<BulkImportPage />} />

          <Route path="/custom-views" element={<CustomViewsPage />} />

          {/* Pass 7 — full backlog */}
          <Route path="/ai/power-calc-explain"  element={<AIPowerCalcExplainPage />} />
          <Route path="/ai/patient-burden"      element={<AIPatientBurdenPage />} />
          <Route path="/ai/ie-optimizer"        element={<AIIeOptimizerPage />} />
          <Route path="/ai/ind-nda-section"     element={<AIIndNdaSectionPage />} />
          <Route path="/ai/dropout-predictor"   element={<AIDropoutPredictorPage />} />
          <Route path="/ai/adaptive-sim"        element={<AIAdaptiveSimPage />} />
          <Route path="/ai/rwe-match"           element={<AIRweMatchPage />} />
          <Route path="/comparable-trials"      element={<ComparableTrialsPage />} />
          <Route path="/protocol-version-graph" element={<ProtocolVersionGraphPage />} />
          <Route path="/irb-workflows"          element={<IrbWorkflowsPage />} />
          <Route path="/integrations"           element={<IntegrationsStatusPage />} />

          {/* Pass 8 — trial conduct */}
          <Route path="/randomization"        element={<RandomizationPage />} />
          <Route path="/sdtm-export"          element={<SdtmExportPage />} />
          <Route path="/dsmb-packet"          element={<DsmbPacketPage />} />
          <Route path="/enrollment-forecast"  element={<EnrollmentForecastPage />} />
          <Route path="/ai/meddra-code"       element={<AIMeddraCodePage />} />
          <Route path="/ai/safety-narrative"  element={<AISafetyNarrativePage />} />
          <Route path="/form-1572"            element={<Form1572Page />} />
          <Route path="/delegation-log"       element={<DelegationLogPage />} />
          <Route path="/training-records"     element={<TrainingRecordsPage />} />

          {/* Pass 9 — live CT.gov, design statistics, audit chain, eConsent */}
          <Route path="/ctgov-search"     element={<CtgovSearchPage />} />
          <Route path="/design-sim"       element={<DesignSimulatorPage />} />
          <Route path="/audit-trail"      element={<AuditTrailPage />} />
          <Route path="/econsent"         element={<EConsentPage />} />

          {/* Pass 10 — production-readiness gap closures */}
          <Route path="/production-readiness" element={<ProductionReadinessPage />} />

          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch (_) { return null; }
  });

  useEffect(() => {
    const sync = () => {
      setToken(localStorage.getItem('token'));
      try { setUser(JSON.parse(localStorage.getItem('user') || 'null')); }
      catch (_) { setUser(null); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleLogin = (u, t) => { setUser(u); setToken(t); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <Router>
      {(!token || !user) ? (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <AppShell user={user} onLogout={handleLogout} />
      )}
    </Router>
  );
}

export default App;
