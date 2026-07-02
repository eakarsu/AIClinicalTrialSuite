const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3051/api';

function getHeaders(extra) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  if (res.status === 401 || res.status === 403) {
    // Only auto-redirect on TOKEN problems; 403 from RBAC denial keeps user signed in.
    let msg = 'Unauthorized';
    try { const data = await res.json(); msg = data.error || msg; } catch (_) {}
    const tokenProblem = res.status === 401 || /token|access/i.test(msg);
    if (tokenProblem) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const me = () => request('/auth/me');

// Dashboard
export const getDashboardStats = () => request('/dashboard/stats');

// ---------- Original 8 CRUD ----------
export const getTrials = () => request('/trials');
export const createTrial = (data) => request('/trials', { method: 'POST', body: JSON.stringify(data) });
export const updateTrial = (id, data) => request(`/trials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTrial = (id) => request(`/trials/${id}`, { method: 'DELETE' });

export const getSites = () => request('/sites');
export const createSite = (data) => request('/sites', { method: 'POST', body: JSON.stringify(data) });
export const updateSite = (id, data) => request(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSite = (id) => request(`/sites/${id}`, { method: 'DELETE' });

export const getProtocols = () => request('/protocols');
export const createProtocol = (data) => request('/protocols', { method: 'POST', body: JSON.stringify(data) });
export const updateProtocol = (id, data) => request(`/protocols/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProtocol = (id) => request(`/protocols/${id}`, { method: 'DELETE' });

export const getInvestigators = () => request('/investigators');
export const createInvestigator = (data) => request('/investigators', { method: 'POST', body: JSON.stringify(data) });
export const updateInvestigator = (id, data) => request(`/investigators/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteInvestigator = (id) => request(`/investigators/${id}`, { method: 'DELETE' });

export const getPatients = () => request('/patients');
export const createPatient = (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) });
export const updatePatient = (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePatient = (id) => request(`/patients/${id}`, { method: 'DELETE' });

export const getCompounds = () => request('/compounds');
export const createCompound = (data) => request('/compounds', { method: 'POST', body: JSON.stringify(data) });
export const updateCompound = (id, data) => request(`/compounds/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCompound = (id) => request(`/compounds/${id}`, { method: 'DELETE' });

export const getEndpoints = () => request('/endpoints');
export const createEndpoint = (data) => request('/endpoints', { method: 'POST', body: JSON.stringify(data) });
export const updateEndpoint = (id, data) => request(`/endpoints/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEndpoint = (id) => request(`/endpoints/${id}`, { method: 'DELETE' });

export const getAdverseEvents = () => request('/adverse-events');
export const createAdverseEvent = (data) => request('/adverse-events', { method: 'POST', body: JSON.stringify(data) });
export const updateAdverseEvent = (id, data) => request(`/adverse-events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAdverseEvent = (id) => request(`/adverse-events/${id}`, { method: 'DELETE' });

// ---------- 10 NEW CRUD ENTITIES ----------
function crud(base) {
  return {
    list: () => request(base),
    create: (data) => request(base, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
  };
}

export const amendmentsApi          = crud('/amendments');
export const deviationsApi          = crud('/deviations');
export const monitoringVisitsApi    = crud('/monitoring-visits');
export const queriesApi             = crud('/queries');
export const dataLocksApi           = crud('/data-locks');
export const milestonesApi          = crud('/milestones');
export const budgetsApi             = crud('/budgets');
export const vendorsCroApi          = crud('/vendors-cro');
export const regulatorySubmissionsApi = crud('/regulatory-submissions');
export const supplyShipmentsApi     = crud('/supply-shipments');

// ---------- AI (16 verbs) ----------
export const aiDraftProtocol       = (body) => request('/ai/draft-protocol',       { method: 'POST', body: JSON.stringify(body) });
export const aiRecommendEndpoints  = (body) => request('/ai/recommend-endpoints',  { method: 'POST', body: JSON.stringify(body) });
export const aiSizeCohort          = (body) => request('/ai/size-cohort',          { method: 'POST', body: JSON.stringify(body) });
export const aiSelectSites         = (body) => request('/ai/select-sites',         { method: 'POST', body: JSON.stringify(body) });
export const aiModelRisk           = (body) => request('/ai/model-risk',           { method: 'POST', body: JSON.stringify(body) });
export const aiGenerateBrief       = (body) => request('/ai/generate-brief',       { method: 'POST', body: JSON.stringify(body) });

export const aiDeviationClassifier = (body) => request('/ai/deviation-classifier', { method: 'POST', body: JSON.stringify(body) });
export const aiDsmbAlert           = (body) => request('/ai/dsmb-alert',           { method: 'POST', body: JSON.stringify(body) });
export const aiEdcAnomaly          = (body) => request('/ai/edc-anomaly',          { method: 'POST', body: JSON.stringify(body) });
export const aiStatisticalImbalance= (body) => request('/ai/statistical-imbalance',{ method: 'POST', body: JSON.stringify(body) });
export const aiExpectedVsActual    = (body) => request('/ai/expected-vs-actual',   { method: 'POST', body: JSON.stringify(body) });
export const aiIrbPkgDrafter       = (body) => request('/ai/irb-pkg-drafter',      { method: 'POST', body: JSON.stringify(body) });
export const aiQueryResolver       = (body) => request('/ai/query-resolver',       { method: 'POST', body: JSON.stringify(body) });
export const aiMilestoneForecaster = (body) => request('/ai/milestone-forecaster', { method: 'POST', body: JSON.stringify(body) });
export const aiBudgetBurn          = (body) => request('/ai/budget-burn',          { method: 'POST', body: JSON.stringify(body) });
export const aiRegulatoryImpact    = (body) => request('/ai/regulatory-impact',    { method: 'POST', body: JSON.stringify(body) });

// AI history
export const aiHistory = (feature) =>
  request(`/ai/history?feature=${encodeURIComponent(feature)}`);

// AI sample scenarios (powers the "Sample Fill" buttons on every AI page)
export const aiSamples = (feature) =>
  request(`/ai/samples?feature=${encodeURIComponent(feature)}`);

// ---------- Notifications ----------
export const getNotifications = () => request('/notifications');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/read-all', { method: 'POST' });

// ---------- Attachments ----------
export const listAttachments = (refTable, refId) => {
  const qs = refTable && refId ? `?ref_table=${encodeURIComponent(refTable)}&ref_id=${encodeURIComponent(refId)}` : '';
  return request(`/attachments${qs}`);
};
export const uploadAttachment = async (file, refTable, refId) => {
  const token = localStorage.getItem('token');
  const fd = new FormData();
  fd.append('file', file);
  if (refTable) fd.append('ref_table', refTable);
  if (refId)    fd.append('ref_id',    refId);
  const res = await fetch(`${API_BASE}/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
};
export const attachmentDownloadUrl = (id) => `${API_BASE}/attachments/${id}/download`;
export const deleteAttachment = (id) => request(`/attachments/${id}`, { method: 'DELETE' });

// ---------- Webhooks ----------
export const listWebhooks = () => request('/webhooks');
export const createWebhook = (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
export const updateWebhook = (id, data) => request(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWebhook = (id) => request(`/webhooks/${id}`, { method: 'DELETE' });
export const listWebhookDeliveries = () => request('/webhooks/deliveries');
export const fireWebhookTest = (event, payload) =>
  request(`/webhooks/test/${encodeURIComponent(event)}`, { method: 'POST', body: JSON.stringify(payload || {}) });

// ---------- Bulk import ----------
export const bulkImport = (entity, csv) =>
  request(`/bulk-import/${entity}`, { method: 'POST', body: JSON.stringify({ csv }) });

// ---------- Pass 7 (full backlog) ----------
// MECHANICAL + ADVISORY-ONLY AI endpoints
export const aiPowerCalcExplain  = (body) => request('/ai/power-calc-explain',  { method: 'POST', body: JSON.stringify(body) });
export const aiPatientBurden     = (body) => request('/ai/patient-burden',     { method: 'POST', body: JSON.stringify(body) });
export const aiIeOptimizer       = (body) => request('/ai/ie-optimizer',       { method: 'POST', body: JSON.stringify(body) });
export const aiIndNdaSection     = (body) => request('/ai/ind-nda-section',    { method: 'POST', body: JSON.stringify(body) });
export const aiDropoutPredictor  = (body) => request('/ai/dropout-predictor',  { method: 'POST', body: JSON.stringify(body) });
export const aiAdaptiveSim       = (body) => request('/ai/adaptive-sim',       { method: 'POST', body: JSON.stringify(body) });
export const aiRweMatch          = (body) => request('/ai/rwe-match',          { method: 'POST', body: JSON.stringify(body) });

// Generic OpenRouter review for deterministic / memory-backed feature outputs.
export const featureAiAnalyze = (body) => request('/feature-ai/analyze', { method: 'POST', body: JSON.stringify(body) });

// Comparable-trial finder
export const findComparableTrials = (body) => request('/comparable-trials/find', { method: 'POST', body: JSON.stringify(body) });

// Protocol version-graph
export const getProtocolGraphByTrial = (trialId) => request(`/protocols-graph/by-trial/${encodeURIComponent(trialId)}`);
export const getProtocolDiff = (fromId, toId) =>
  request(`/protocols-graph/diff?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`);

// IRB workflow state-machine
export const listIrbWorkflows   = () => request('/irb-workflows');
export const getIrbWorkflow     = (id) => request(`/irb-workflows/${id}`);
export const createIrbWorkflow  = (data) => request('/irb-workflows', { method: 'POST', body: JSON.stringify(data) });
export const transitionIrbWorkflow = (id, data) =>
  request(`/irb-workflows/${id}/transition`, { method: 'POST', body: JSON.stringify(data) });

// NEEDS-CREDS integrations (return 503 with required_credentials)
export const integrationProbe = (path) => request(`/integrations/${path}`);

// ---------- Custom Views (4 derived views) ----------
export const customViewsTrialTimeline    = () => request('/custom-views/trial-timeline');
export const customViewsEndpointCoverage = () => request('/custom-views/endpoint-coverage');
export const customViewsProtocolPdf      = (trialId) =>
  request(`/custom-views/protocol-pdf/${encodeURIComponent(trialId)}`);
export const customViewsListRules        = () => request('/custom-views/design-rules');
export const customViewsCreateRule       = (data) =>
  request('/custom-views/design-rules', { method: 'POST', body: JSON.stringify(data) });
export const customViewsUpdateRule       = (id, data) =>
  request(`/custom-views/design-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const customViewsDeleteRule       = (id) =>
  request(`/custom-views/design-rules/${id}`, { method: 'DELETE' });

// ---------- Pass 8 (trial conduct) ----------
// Randomization / IWRS
export const listRandomizationSchemes  = () => request('/randomization/schemes');
export const createRandomizationScheme = (data) => request('/randomization/schemes', { method: 'POST', body: JSON.stringify(data) });
export const getRandomizationScheme    = (schemeId) => request(`/randomization/schemes/${encodeURIComponent(schemeId)}`);
export const randomizeSubject          = (schemeId, data) =>
  request(`/randomization/schemes/${encodeURIComponent(schemeId)}/assign`, { method: 'POST', body: JSON.stringify(data) });
export const getIrtKits = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return request(`/randomization/irt/kits${q.toString() ? `?${q.toString()}` : ''}`);
};
export const getIrtDispenses = () => request('/randomization/irt/dispenses');
export const dispenseIrtKit = (data) => request('/randomization/irt/dispense', { method: 'POST', body: JSON.stringify(data) });

// SDTM-shaped export
export const sdtmDomains = () => request('/sdtm/domains');
export const sdtmExport  = (domain, trial) =>
  request(`/sdtm/${encodeURIComponent(domain)}${trial ? `?trial=${encodeURIComponent(trial)}` : ''}`);

// DSMB packet + enrollment forecast
export const dsmbPacket         = (body) => request('/dsmb/packet', { method: 'POST', body: JSON.stringify(body) });
export const enrollmentForecast = (body) => request('/enrollment-forecast/run', { method: 'POST', body: JSON.stringify(body) });

// ADVISORY AI verbs
export const aiMeddraCode      = (body) => request('/ai/meddra-code',      { method: 'POST', body: JSON.stringify(body) });
export const aiSafetyNarrative = (body) => request('/ai/safety-narrative', { method: 'POST', body: JSON.stringify(body) });

// Form 1572 draft
export const generateForm1572 = (body) => request('/form-1572/generate', { method: 'POST', body: JSON.stringify(body) });

// Delegation log + training records (CRUD)
export const getDelegationLog    = () => request('/delegation-log');
export const createDelegationLog = (data) => request('/delegation-log', { method: 'POST', body: JSON.stringify(data) });
export const updateDelegationLog = (id, data) => request(`/delegation-log/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDelegationLog = (id) => request(`/delegation-log/${id}`, { method: 'DELETE' });

export const getTrainingRecords   = () => request('/training-records');
export const createTrainingRecord = (data) => request('/training-records', { method: 'POST', body: JSON.stringify(data) });
export const updateTrainingRecord = (id, data) => request(`/training-records/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTrainingRecord = (id) => request(`/training-records/${id}`, { method: 'DELETE' });

// ---------- Pass 9 (integrations + real stats + compliance mechanics) ----------
// LIVE ClinicalTrials.gov v2 (public read API)
export const ctgovSearch = (params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return request(`/ctgov/search?${q.toString()}`);
};

// Design statistics
export const designPower    = (body) => request('/design-sim/power',    { method: 'POST', body: JSON.stringify(body) });
export const designSimulate = (body) => request('/design-sim/simulate', { method: 'POST', body: JSON.stringify(body) });

// Part 11-style audit chain
export const getAuditTrail    = (limit = 100) => request(`/audit-trail?limit=${limit}`);
export const verifyAuditTrail = () => request('/audit-trail/verify');

// eConsent
export const getConsentForms     = () => request('/econsent/forms');
export const createConsentForm   = (data) => request('/econsent/forms', { method: 'POST', body: JSON.stringify(data) });
export const getConsentRecords   = () => request('/econsent/records');
export const signConsentRecord   = (data) => request('/econsent/records', { method: 'POST', body: JSON.stringify(data) });

// AI-vs-deterministic comparison (comparable trials + protocol graph)
export const findComparableTrialsAi = (body) => request('/comparable-trials/find-ai', { method: 'POST', body: JSON.stringify(body) });
export const protocolGraphAi        = (body) => request('/protocols-graph/graph-ai',  { method: 'POST', body: JSON.stringify(body) });

// ---------- Pass 10 production-readiness gap closures ----------
export const getPermissionsMatrix = () => request('/production-readiness/permissions-matrix');
export const getValidationEvidence = () => request('/production-readiness/validation-evidence');
export const getIrtEvents = () => request('/production-readiness/irt/events');
export const getIrtResupplyForecast = () => request('/production-readiness/irt/resupply-forecast');
export const updateIrtKitLifecycle = (kitId, data) =>
  request(`/production-readiness/irt/kit/${encodeURIComponent(kitId)}/lifecycle`, { method: 'POST', body: JSON.stringify(data) });
export const emergencyUnblind = (data) =>
  request('/production-readiness/irt/emergency-unblind', { method: 'POST', body: JSON.stringify(data) });
export const sdtmValidate = (domain) => request(`/production-readiness/sdtm-validate/${encodeURIComponent(domain)}`);
export const complianceExport = () => request('/production-readiness/compliance-export');

// ---------- Merged recruitment and patient-trial matching ----------
export const recruitmentSummary = () => request('/recruitment/summary');
export const recruitmentMatches = (limit = 100) => request(`/recruitment/matches?limit=${limit}`);
export const scorePatientMatches = (patientId) =>
  request('/recruitment/matches/score-patient', { method: 'POST', body: JSON.stringify({ patient_id: patientId }) });
export const rankedPatientMatches = (patientId) =>
  request(`/recruitment/matches/patient/${encodeURIComponent(patientId)}/ranked`);
export const updateRecruitmentMatchStatus = (id, data) =>
  request(`/recruitment/matches/${id}/status`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRecruitmentMatch = (id) =>
  request(`/recruitment/matches/${id}`, { method: 'DELETE' });
export const eligibilityReviews = () => request('/recruitment/eligibility-reviews');
export const runEligibilityReview = (data) =>
  request('/recruitment/eligibility-reviews/run', { method: 'POST', body: JSON.stringify(data) });
export const recruitmentBiomarkers = () => request('/recruitment/biomarkers');
export const recruitmentDrugInteractions = () => request('/recruitment/drug-interactions');
export const recruitmentOutcomes = () => request('/recruitment/outcomes');
export const recruitmentRetentionRisk = () => request('/recruitment/retention-risk');
