const express = require('express');
const pool = require('../config/database');
const { callOpenRouter, safeJsonParse } = require('../services/ai');

const router = express.Router();

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const SYSTEM_PROMPT = `You are an expert clinical-trial operations, regulatory, and biostatistics reviewer.
Return STRICT JSON only:
{
  "feature": string,
  "mode": "openrouter_ai_review",
  "executive_summary": string,
  "key_findings": [string],
  "risks_or_limitations": [string],
  "recommended_actions": [string],
  "comparison_to_mechanical_result": string,
  "confidence": "high" | "medium" | "low"
}
Do not invent source data. If the deterministic/memory result is incomplete, say so.`;

const CATEGORY_SCHEMA_PROMPT = `You are an expert clinical-trial IWRS/IRT configuration designer.
Return STRICT JSON only:
{
  "feature": string,
  "mode": "openrouter_category_schema",
  "category_schema": [
    {
      "category": string,
      "source": "arms" | "strata" | "irt" | "site" | "trial",
      "allowed_values": [string],
      "use_in_randomization": boolean,
      "use_in_irt": boolean,
      "validation_rule": string,
      "notes": string
    }
  ],
  "executive_summary": string,
  "key_findings": [string],
  "risks_or_limitations": [string],
  "recommended_actions": [string],
  "confidence": "high" | "medium" | "low"
}
Use the provided draft scheme only. Category schemas should support both randomization and IRT kit allocation.`;

const CRUD_PROMPT = `You are an expert clinical-trial operations data steward.
Return STRICT JSON only:
{
  "feature": string,
  "mode": "crud_ai_assist",
  "executive_summary": string,
  "suggested_fields": { },
  "key_findings": [string],
  "risks_or_limitations": [string],
  "recommended_actions": [string],
  "comparison_to_mechanical_result": string,
  "confidence": "high" | "medium" | "low"
}
For AI Fill requests, populate suggested_fields using ONLY the exact field keys provided in the input. Include optional fields when the input contains them. Do not invent unavailable IDs unless clearly marked as draft/demo values.`;

async function persist(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output, model) VALUES ($1,$2,$3,$4)',
      [feature, input, output, MODEL]
    );
  } catch (e) {
    console.warn('[ai_results] persist warning:', e.message);
  }
}

router.post('/analyze', async (req, res) => {
  try {
    const body = req.body || {};
    const feature = String(body.feature || '').trim();
    if (!feature) return res.status(400).json({ error: 'feature is required' });

    const payload = {
      feature,
      intent: body.intent || 'Review the deterministic/memory result and provide an OpenRouter AI advisory analysis.',
      input: body.input || null,
      mechanical_result: body.mechanical_result || body.result || null,
    };

    const wantsCategorySchema = /category-schema|category_schema/i.test(feature) || /category_schema/i.test(body.intent || '');
    const wantsCrudAssist = /^crud-/i.test(feature) || /suggested_fields|CRUD record|AI Fill/i.test(body.intent || '');
    const response = await callOpenRouter(
      wantsCategorySchema ? CATEGORY_SCHEMA_PROMPT : wantsCrudAssist ? CRUD_PROMPT : SYSTEM_PROMPT,
      `Review this feature output. Compare the deterministic/memory result with what an expert AI reviewer would flag.
DATA:
${JSON.stringify(payload, null, 2)}`
    );
    const parsed = safeJsonParse(response, wantsCategorySchema ? {
      feature,
      mode: 'openrouter_category_schema',
      category_schema: [],
      executive_summary: typeof response === 'string' ? response : '',
      key_findings: [],
      risks_or_limitations: [],
      recommended_actions: [],
      confidence: 'low',
    } : wantsCrudAssist ? {
      feature,
      mode: 'crud_ai_assist',
      executive_summary: typeof response === 'string' ? response : '',
      suggested_fields: {},
      key_findings: [],
      risks_or_limitations: [],
      recommended_actions: [],
      comparison_to_mechanical_result: '',
      confidence: 'low',
    } : {
      feature,
      mode: 'openrouter_ai_review',
      executive_summary: typeof response === 'string' ? response : '',
      key_findings: [],
      risks_or_limitations: [],
      recommended_actions: [],
      comparison_to_mechanical_result: '',
      confidence: 'low',
    });
    const out = {
      source: `OpenRouter (${MODEL})`,
      advisory_only: true,
      requires_expert_review: true,
      ...parsed,
      feature: parsed.feature || feature,
      mode: parsed.mode || 'openrouter_ai_review',
    };
    await persist(`${feature}-openrouter-review`, payload, out);
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
