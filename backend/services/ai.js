const https = require('https');
require('dotenv').config({ path: '../.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const SYSTEM_PROMPT = 'You are an expert clinical trial methodologist, biostatistician, and pharmaceutical R&D advisor. Provide rigorous, evidence-based, regulator-aware recommendations grounded in ICH-GCP, FDA, and EMA guidance. Always return STRICT JSON when a schema is given.';

async function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3050',
        'X-Title': 'AI Clinical Trial Suite',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) {
          return resolve({ error: 'AI response parsing failed', raw: body });
        }
        if (parsed.error) {
          reject(new Error(parsed.error.message || 'OpenRouter API error'));
        } else {
          const content = parsed.choices?.[0]?.message?.content || 'No response generated';
          resolve(content);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error, raw: response.raw };
  }
  if (response === null || response === undefined) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();

  try { return JSON.parse(text); } catch (_) { /* fall through */ }

  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, escape = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) return JSON.parse(text.slice(start, i + 1));
        }
      }
    }
  } catch (_) { /* fall through */ }

  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) { /* fall through */ }

  return { ...fallback, summary: text };
}

// AI 1: Draft Protocol
async function draftProtocol({ indication, phase, compound, population, sample_size }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "title": string,
  "background": string,
  "objectives": { "primary": string, "secondary": [string], "exploratory": [string] },
  "study_design": { "type": string, "blinding": string, "randomization_ratio": string, "duration_weeks": number, "arms": [{ "name": string, "intervention": string, "n": number }] },
  "inclusion_criteria": [string],
  "exclusion_criteria": [string],
  "primary_endpoint": string,
  "key_secondary_endpoints": [string],
  "safety_monitoring": string,
  "statistical_considerations": string,
  "ich_gcp_considerations": [string],
  "summary": string
}`;
  const user = `Draft a Phase ${phase || ''} clinical trial protocol.
Indication: ${indication || 'Unknown'}
Investigational compound: ${compound || 'Unknown'}
Target population: ${population || 'Adults with confirmed diagnosis'}
Planned sample size: ${sample_size || 'TBD'}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, title: '' });
}

// AI 2: Recommend Endpoints
async function recommendEndpoints({ indication, phase, mechanism }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "primary_endpoints": [{ "name": string, "measure": string, "timepoint": string, "rationale": string, "regulatory_precedent": string }],
  "secondary_endpoints": [{ "name": string, "measure": string, "timepoint": string, "rationale": string }],
  "exploratory_endpoints": [{ "name": string, "measure": string, "timepoint": string, "rationale": string }],
  "biomarker_strategy": string,
  "patient_reported_outcomes": [string],
  "statistical_methods": [{ "endpoint": string, "method": string, "justification": string }],
  "summary": string
}`;
  const user = `Recommend endpoints for:
Indication: ${indication}
Phase: ${phase}
Mechanism of action: ${mechanism || 'Unknown'}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, primary_endpoints: [] });
}

// AI 3: Size Cohort
async function sizeCohort({ primary_endpoint, effect_size, alpha, power, dropout_rate, allocation_ratio }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "recommended_total_n": number,
  "per_arm_n": [{ "arm": string, "n": number }],
  "assumptions": { "effect_size": string, "alpha": number, "power": number, "dropout_rate": number, "allocation": string },
  "method": string,
  "sensitivity_analysis": [{ "scenario": string, "n_required": number, "notes": string }],
  "feasibility_notes": [string],
  "summary": string
}`;
  const user = `Calculate sample size for:
Primary endpoint: ${primary_endpoint}
Anticipated effect size: ${effect_size || '0.5 (Cohen d) or 15% absolute risk reduction'}
Alpha (two-sided): ${alpha || 0.05}
Power: ${power || 0.8}
Dropout rate: ${dropout_rate || 0.15}
Allocation ratio (treatment:control): ${allocation_ratio || '1:1'}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, recommended_total_n: 0 });
}

// AI 4: Select Sites
async function selectSites({ indication, phase, target_enrollment, sites }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "ranked_sites": [{ "site_id": string, "site_name": string, "rank": number, "fit_score": number, "expected_enrollment_per_month": number, "strengths": [string], "concerns": [string] }],
  "geographic_coverage": string,
  "estimated_full_enrollment_months": number,
  "recommended_site_count": number,
  "risk_mitigation": [string],
  "summary": string
}`;
  const siteList = (sites || []).map(s => `- ${s.site_id || s.id}: ${s.name} (${s.city}, ${s.country}) PI:${s.principal_investigator} capacity:${s.capacity} status:${s.status}`).join('\n');
  const user = `Select & rank sites for a Phase ${phase} trial in ${indication}, target enrollment ${target_enrollment || 200}.

Available sites:
${siteList || '(no sites supplied)'}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, ranked_sites: [] });
}

// AI 5: Model Risk
async function modelRisk({ trial, adverse_events, enrollment_lag_days, protocol_deviations }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "overall_risk_level": "Low" | "Moderate" | "High" | "Critical",
  "risk_score": number,
  "risk_categories": [{ "category": string, "level": "Low" | "Moderate" | "High" | "Critical", "drivers": [string], "mitigation": string }],
  "safety_signal_detected": boolean,
  "safety_signal_detail": string,
  "enrollment_risk": { "level": string, "notes": string, "projected_delay_weeks": number },
  "regulatory_risk": { "level": string, "notes": string },
  "recommended_actions": [{ "action": string, "owner": string, "priority": "Immediate" | "High" | "Medium" | "Low" }],
  "summary": string
}`;
  const aeSummary = (adverse_events || []).slice(0, 30).map(a => `${a.term} (severity:${a.severity} serious:${a.serious} outcome:${a.outcome})`).join('; ');
  const user = `Model risk for trial:
Trial: ${JSON.stringify(trial || {})}
Recent adverse events: ${aeSummary || 'none reported'}
Enrollment lag (days vs plan): ${enrollment_lag_days || 0}
Protocol deviations (count): ${protocol_deviations || 0}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, overall_risk_level: 'Moderate' });
}

// AI 6: Generate Brief
async function generateBrief({ trial, audience }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "executive_summary": string,
  "scientific_rationale": string,
  "study_design_overview": string,
  "patient_population": string,
  "key_endpoints": [string],
  "safety_profile_summary": string,
  "operational_plan": string,
  "milestones": [{ "milestone": string, "target_date": string }],
  "budget_considerations": string,
  "key_risks": [string],
  "next_steps": [string],
  "summary": string
}`;
  const user = `Generate a ${audience || 'investor / steering committee'} brief for the following trial:
${JSON.stringify(trial || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, executive_summary: '' });
}

// AI 7: Deviation Classifier
async function deviationClassifier({ deviation }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "classification": "major" | "minor",
  "confidence": number,
  "reasoning": string,
  "impact": { "patient_safety": string, "data_integrity": string, "regulatory": string },
  "capa_recommendation": string,
  "reportability": { "irb": boolean, "fda": boolean, "ema": boolean, "notes": string },
  "summary": string
}`;
  const user = `Classify this protocol deviation as major or minor with full impact assessment:
${JSON.stringify(deviation || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, classification: 'minor' });
}

// AI 8: DSMB Alert
async function dsmbAlert({ trial, ae_data }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "alert_level": "Routine" | "Escalation" | "Urgent",
  "trigger_signals": [string],
  "recommendation": "Continue" | "Modify" | "Pause Enrollment" | "Halt",
  "rationale": string,
  "stopping_rule_check": { "met": boolean, "rule": string, "current_value": string },
  "dsmb_message": string,
  "follow_up_actions": [string],
  "summary": string
}`;
  const ae = (ae_data || []).slice(0, 50).map(a => `${a.term} sev:${a.severity} ser:${a.serious} out:${a.outcome}`).join('; ');
  const user = `Draft a DSMB-style alert for trial ${JSON.stringify(trial || {})}.
Recent AE data: ${ae || 'none'}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, alert_level: 'Routine' });
}

// AI 9: EDC Anomaly Detection
async function edcAnomaly({ edc_data }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "anomalies": [{ "row_index": number, "field": string, "value": string, "anomaly_type": string, "severity": "Low" | "Medium" | "High", "explanation": string }],
  "data_quality_score": number,
  "patterns_detected": [string],
  "recommended_queries": [{ "field": string, "question": string }],
  "summary": string
}`;
  const user = `Detect anomalies in this EDC dataset (entries, outliers, transcription errors, range violations):
${JSON.stringify(edc_data || [], null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, anomalies: [] });
}

// AI 10: Statistical Imbalance
async function statisticalImbalance({ arm_data }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "imbalance_signals": [{ "variable": string, "arm_a": string, "arm_b": string, "p_value_estimate": number, "concern_level": "Low" | "Moderate" | "High" }],
  "randomization_integrity": "Intact" | "Possible Compromise" | "Compromised",
  "power_impact": { "original_power": number, "current_power": number, "delta": number, "rationale": string },
  "recommended_adjustments": [string],
  "covariate_recommendations": [string],
  "summary": string
}`;
  const user = `Analyse arm-level imbalances and power impact:
${JSON.stringify(arm_data || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, imbalance_signals: [] });
}

// AI 11: Expected vs Actual AE rates
async function expectedVsActual({ trial, actual_ae_rates }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "literature_baseline": [{ "event": string, "expected_rate": string, "source": string }],
  "actual_vs_expected": [{ "event": string, "expected_rate_pct": number, "actual_rate_pct": number, "ratio": number, "signal": "Within Expected" | "Higher Than Expected" | "Lower Than Expected" }],
  "notable_signals": [string],
  "regulatory_implications": string,
  "summary": string
}`;
  const user = `Compare AE rates to literature expectations for trial:
${JSON.stringify(trial || {}, null, 2)}
Actual AE rates (optional): ${JSON.stringify(actual_ae_rates || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, actual_vs_expected: [] });
}

// AI 12: IRB Submission Package Drafter
async function irbPkgDrafter({ protocol }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "package_outline": [{ "document": string, "purpose": string, "status": "Required" | "Recommended" }],
  "informed_consent_summary": string,
  "risk_benefit_assessment": string,
  "vulnerable_populations_considerations": [string],
  "data_safety_monitoring_plan_outline": string,
  "submission_checklist": [string],
  "estimated_review_timeline": string,
  "summary": string
}`;
  const user = `Draft an IRB submission package outline for this protocol:
${JSON.stringify(protocol || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, package_outline: [] });
}

// AI 13: Query Resolver
async function queryResolver({ query }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "likely_root_cause": string,
  "suggested_resolution": string,
  "clarification_template": string,
  "ICH_GCP_considerations": [string],
  "follow_up_actions": [string],
  "summary": string
}`;
  const user = `Suggest resolution + clarification template for this EDC query:
${JSON.stringify(query || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, suggested_resolution: '' });
}

// AI 14: Milestone Forecaster
async function milestoneForecaster({ trial, milestones, enrollment_curve }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "milestone_forecasts": [{ "milestone": string, "target_date": string, "forecast_date": string, "risk_level": "Low" | "Medium" | "High", "drivers": [string] }],
  "critical_path": [string],
  "overall_program_risk": "Low" | "Medium" | "High",
  "recommended_mitigations": [string],
  "summary": string
}`;
  const user = `Forecast key milestones and risk for trial:
Trial: ${JSON.stringify(trial || {})}
Current milestones: ${JSON.stringify(milestones || [], null, 2)}
Enrollment curve (optional): ${JSON.stringify(enrollment_curve || [], null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, milestone_forecasts: [] });
}

// AI 15: Budget Burn
async function budgetBurn({ trial, budgets }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "burn_rate_monthly_usd": number,
  "projected_end_state": { "month": string, "projected_spend_usd": number, "variance_vs_plan_pct": number },
  "variance_drivers": [{ "category": string, "driver": string, "impact_usd": number }],
  "category_forecasts": [{ "category": string, "remaining_budget_usd": number, "forecast_overrun_usd": number, "risk": "Low" | "Medium" | "High" }],
  "cost_control_recommendations": [string],
  "summary": string
}`;
  const user = `Forecast burn rate and variance drivers for trial:
Trial: ${JSON.stringify(trial || {})}
Budgets: ${JSON.stringify(budgets || [], null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, burn_rate_monthly_usd: 0 });
}

// AI 16: Regulatory Impact (amendment)
async function regulatoryImpact({ amendment }) {
  const system = `${SYSTEM_PROMPT} Return JSON in this exact shape:
{
  "substantial_amendment": boolean,
  "agency_actions_required": [{ "agency": string, "action": "Notify" | "Submit" | "Approval Required" | "No Action", "timeline_days": number, "rationale": string }],
  "consent_re_consent_needed": boolean,
  "irb_re_review_needed": boolean,
  "trial_pause_recommended": boolean,
  "patient_impact_assessment": string,
  "summary": string
}`;
  const user = `Assess regulatory impact of this amendment:
${JSON.stringify(amendment || {}, null, 2)}`;
  const response = await callOpenRouter(system, user);
  return safeJsonParse(response, { summary: response, substantial_amendment: false });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  draftProtocol,
  recommendEndpoints,
  sizeCohort,
  selectSites,
  modelRisk,
  generateBrief,
  deviationClassifier,
  dsmbAlert,
  edcAnomaly,
  statisticalImbalance,
  expectedVsActual,
  irbPkgDrafter,
  queryResolver,
  milestoneForecaster,
  budgetBurn,
  regulatoryImpact,
};
