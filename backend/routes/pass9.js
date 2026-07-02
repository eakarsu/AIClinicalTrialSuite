/* ============================================================
   Pass 9 — integrations, real statistics, compliance mechanics
   ------------------------------------------------------------
   Exports MULTIPLE Express routers + one middleware:

     1. ctgovRouter        /api/ctgov
        LIVE ClinicalTrials.gov v2 search — the v2 read API is
        public, no credentials required. (Push/PRS submission
        still needs an account and remains a 503 stub in pass 7.)
     2. designRouter       /api/design-sim
        - POST /power     exact power / sample size (inverse-normal
                          via Acklam's algorithm, continuous +
                          binary endpoints)
        - POST /simulate  Monte Carlo group-sequential simulator:
                          O'Brien-Fleming-shaped boundaries,
                          patient-level simulation, seeded PRNG
                          (reproducible), empirical power / type I
                          error / expected sample size.
        Both are ADVISORY: mathematically real but not validated
        by a biostatistician for regulatory use.
     3. auditMiddleware + auditRouter   /api/audit-trail
        Part 11-STYLE (not certified) tamper-evident audit chain:
        every authenticated write (POST/PUT/PATCH/DELETE) appends
        a sha256 hash-chained row; /verify recomputes the chain.
     4. econsentRouter     /api/econsent
        Versioned consent forms + subject consent records signed
        with a two-component e-signature (userid + password
        re-verified against the users table at signing time).
   ============================================================ */

const express = require('express');
const https = require('https');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { callOpenRouter, safeJsonParse } = require('../services/ai');

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const SYSTEM_PROMPT = 'You are an expert clinical trial methodologist, biostatistician, and pharmaceutical R&D advisor. Provide rigorous, evidence-based, regulator-aware recommendations grounded in ICH-GCP, FDA, and EMA guidance. Always return STRICT JSON when a schema is given.';

async function persist(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output, model) VALUES ($1,$2,$3,$4)',
      [feature, input, output, MODEL]
    );
  } catch (e) { console.warn('[ai_results] persist warning:', e.message); }
}

const ADVISORY_DISCLAIMER =
  'ADVISORY OUTPUT ONLY. This response is NOT validated for regulatory submission, ' +
  'patient-care decisions, or go/no-go program decisions. It MUST be independently reviewed by a qualified ' +
  'biostatistician or other domain expert before any operational use.';

function withAdvisory(obj) {
  return { disclaimer: ADVISORY_DISCLAIMER, requires_expert_review: true, not_for_regulatory_submission: true, ...obj };
}

/* ============================================================
   Math helpers — exact inverse normal CDF (Acklam) + normal CDF,
   and the seeded PRNG reused from pass 8 for reproducible sims.
   ============================================================ */
function normInv(p) {
  if (p <= 0 || p >= 1) throw new Error('normInv: p must be in (0,1)');
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= ph) {
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
function normCdf(z) {
  // Abramowitz & Stegun 7.1.26 via erf
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Box-Muller on a seeded uniform stream
function gaussianStream(seedStr) {
  const rand = mulberry32(hashString(seedStr));
  let spare = null;
  return function () {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0, v = 0;
    while (u === 0) u = rand();
    v = rand();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
}

/* ============================================================
   ROUTER 1 — LIVE ClinicalTrials.gov v2 search  (/api/ctgov)
   Public read API — no credentials. Timeouts + upstream errors
   surface as 502 so the UI can distinguish "CT.gov down" from
   "our bug".
   ============================================================ */
const ctgovRouter = express.Router();

function ctgovGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      { hostname: 'clinicaltrials.gov', path, headers: { Accept: 'application/json' }, timeout: 15000 },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error(`CT.gov responded ${res.statusCode}`));
          try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('CT.gov returned non-JSON')); }
        });
      }
    );
    req.on('timeout', () => { req.destroy(new Error('CT.gov request timed out')); });
    req.on('error', reject);
  });
}

ctgovRouter.get('/search', async (req, res) => {
  try {
    const { condition, term, phase, status, pageSize } = req.query;
    if (!condition && !term) return res.status(400).json({ error: 'Provide condition and/or term' });
    const params = new URLSearchParams();
    if (condition) params.set('query.cond', condition);
    if (term) params.set('query.term', term);
    if (status) params.set('filter.overallStatus', status);
    params.set('pageSize', String(Math.min(Number(pageSize) || 10, 50)));
    params.set('fields', [
      'protocolSection.identificationModule.nctId',
      'protocolSection.identificationModule.briefTitle',
      'protocolSection.statusModule.overallStatus',
      'protocolSection.designModule.phases',
      'protocolSection.designModule.enrollmentInfo',
      'protocolSection.conditionsModule.conditions',
      'protocolSection.sponsorCollaboratorsModule.leadSponsor',
    ].join(','));
    const data = await ctgovGet(`/api/v2/studies?${params.toString()}`);
    let studies = (data.studies || []).map((s) => {
      const p = s.protocolSection || {};
      return {
        nct_id: p.identificationModule?.nctId,
        title: p.identificationModule?.briefTitle,
        status: p.statusModule?.overallStatus,
        phases: p.designModule?.phases || [],
        enrollment: p.designModule?.enrollmentInfo?.count ?? null,
        conditions: p.conditionsModule?.conditions || [],
        sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name,
      };
    });
    if (phase) studies = studies.filter((s) => s.phases.some((ph) => ph.toUpperCase().includes(String(phase).toUpperCase().replace(/^PHASE\s*/, 'PHASE'))));
    res.json({ source: 'clinicaltrials.gov v2 (live, public read API)', count: studies.length, studies });
  } catch (err) {
    res.status(502).json({ error: `ClinicalTrials.gov unreachable: ${err.message}` });
  }
});

ctgovRouter.get('/study/:nctId', async (req, res) => {
  try {
    const data = await ctgovGet(`/api/v2/studies/${encodeURIComponent(req.params.nctId)}`);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: `ClinicalTrials.gov unreachable: ${err.message}` });
  }
});

/* ============================================================
   ROUTER 2 — design statistics  (/api/design-sim)
   ============================================================ */
const designRouter = express.Router();

/* Exact power / sample size. Continuous: two-sample z approximation
   with exact quantiles. Binary: normal approximation on proportions. */
designRouter.post('/power', (req, res) => {
  try {
    const { endpoint_type = 'continuous', alpha = 0.05, power = 0.8, two_sided = true,
            delta, sd, p1, p2, dropout_rate = 0 } = req.body;
    const za = normInv(1 - (two_sided ? alpha / 2 : alpha));
    const zb = normInv(power);
    let nPerArm, detail;
    if (endpoint_type === 'binary') {
      const q1 = Number(p1), q2 = Number(p2);
      if (!(q1 > 0 && q1 < 1 && q2 > 0 && q2 < 1)) return res.status(400).json({ error: 'binary endpoint requires p1, p2 in (0,1)' });
      const pbar = (q1 + q2) / 2;
      nPerArm = Math.ceil(((za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(q1 * (1 - q1) + q2 * (1 - q2))) ** 2) / ((q1 - q2) ** 2));
      detail = { p1: q1, p2: q2, pooled_p: pbar };
    } else {
      const d = Number(delta), s = Number(sd);
      if (!(d > 0 && s > 0)) return res.status(400).json({ error: 'continuous endpoint requires delta > 0 and sd > 0' });
      nPerArm = Math.ceil(2 * ((za + zb) * s / d) ** 2);
      detail = { delta: d, sd: s, standardized_effect: Number((d / s).toFixed(4)) };
    }
    const dr = Math.min(Math.max(Number(dropout_rate) || 0, 0), 0.9);
    const nInflated = Math.ceil(nPerArm / (1 - dr));
    res.json(withAdvisory({
      method: 'exact normal quantiles (Acklam inverse CDF); z-approximation formulas',
      inputs: { endpoint_type, alpha, power, two_sided, dropout_rate: dr, ...detail },
      z_alpha: Number(za.toFixed(4)), z_beta: Number(zb.toFixed(4)),
      n_per_arm: nPerArm, n_per_arm_dropout_inflated: nInflated, total_n: nInflated * 2,
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* Monte Carlo group-sequential simulator.
   - Two-arm, continuous endpoint, standardized effect `delta` (0 = null).
   - K equally-spaced looks; O'Brien-Fleming-shaped boundary z_k = z_final*sqrt(K/k).
   - Patient-level simulation with a seeded PRNG => reproducible.
   Reports empirical rejection rate (power under delta>0, type I under delta=0),
   stop probabilities per look, and expected sample size. */
designRouter.post('/simulate', (req, res) => {
  try {
    const { n_per_arm, delta = 0, looks = 3, alpha = 0.05, sims = 4000, seed = 'gsd-2026' } = req.body;
    const N = Math.floor(Number(n_per_arm));
    const K = Math.min(Math.max(Math.floor(Number(looks)) || 1, 1), 10);
    const S = Math.min(Math.max(Math.floor(Number(sims)) || 1000, 100), 20000);
    const d = Number(delta) || 0;
    const a = Number(alpha) || 0.05;
    if (!(N >= K && N <= 5000)) return res.status(400).json({ error: 'n_per_arm must be between looks and 5000' });

    const zFinal = normInv(1 - a / 2);
    const boundaries = Array.from({ length: K }, (_, i) => Number((zFinal * Math.sqrt(K / (i + 1))).toFixed(4)));
    const lookN = Array.from({ length: K }, (_, i) => Math.floor((N * (i + 1)) / K)); // cumulative per arm

    const gauss = gaussianStream(`${seed}|${N}|${d}|${K}|${a}|${S}`);
    let rejections = 0;
    const stopAtLook = Array(K).fill(0);
    let totalNUsed = 0;

    for (let s = 0; s < S; s++) {
      let sumT = 0, sumC = 0;
      let prevN = 0, rejected = false;
      for (let k = 0; k < K && !rejected; k++) {
        const nk = lookN[k];
        for (let i = prevN; i < nk; i++) { sumT += gauss() + d; sumC += gauss(); }
        prevN = nk;
        const z = (sumT / nk - sumC / nk) / Math.sqrt(2 / nk); // sd=1 by construction
        if (Math.abs(z) >= boundaries[k]) {
          rejected = true; rejections++; stopAtLook[k]++; totalNUsed += 2 * nk;
        }
      }
      if (!rejected) totalNUsed += 2 * N;
    }

    res.json(withAdvisory({
      method: 'Monte Carlo, patient-level, O\'Brien-Fleming-shaped boundaries z_k = z(1-a/2)*sqrt(K/k), seeded PRNG (reproducible)',
      inputs: { n_per_arm: N, delta: d, looks: K, alpha: a, sims: S, seed },
      boundaries_z: boundaries,
      look_sample_sizes_per_arm: lookN,
      rejection_rate: Number((rejections / S).toFixed(4)),
      interpretation: d === 0 ? 'empirical TYPE I ERROR (delta = 0)' : 'empirical POWER',
      stop_probability_by_look: stopAtLook.map((c, i) => ({ look: i + 1, p: Number((c / S).toFixed(4)) })),
      expected_total_n: Number((totalNUsed / S).toFixed(1)),
      max_total_n: 2 * N,
      analytic_fixed_design_power: d === 0 ? null : Number((1 - normCdf(zFinal - d * Math.sqrt(N / 2)) + normCdf(-zFinal - d * Math.sqrt(N / 2))).toFixed(4)),
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ============================================================
   3 — Part 11-STYLE audit chain
   Middleware appends one hash-chained row per authenticated write.
   The chain head is the last row's hash; verification recomputes
   sha256(prev_hash | canonical-payload) for every row.
   ============================================================ */
const GENESIS = '0'.repeat(64);

function canonicalPayload(row) {
  return JSON.stringify({
    actor: row.actor, actor_role: row.actor_role, method: row.method,
    path: row.path, status_code: row.status_code, body_summary: row.body_summary,
    created_at: row.created_at,
  });
}

async function appendAudit(entry) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize chain appends: lock the last row (if any).
    const last = await client.query('SELECT hash FROM audit_events ORDER BY id DESC LIMIT 1 FOR UPDATE');
    const prevHash = last.rows.length ? last.rows[0].hash : GENESIS;
    const createdAt = new Date().toISOString();
    const row = { ...entry, created_at: createdAt };
    const hash = crypto.createHash('sha256').update(prevHash + canonicalPayload(row)).digest('hex');
    await client.query(
      `INSERT INTO audit_events (actor, actor_role, method, path, status_code, body_summary, prev_hash, hash, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [entry.actor, entry.actor_role, entry.method, entry.path, entry.status_code, entry.body_summary, prevHash, hash, createdAt]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.warn('[audit] append warning:', e.message);
  } finally { client.release(); }
}

// Fire-and-forget on response finish so auditing never blocks or breaks the API.
function auditMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (req.path.startsWith('/audit-trail')) return next(); // don't audit the audit reads
  res.on('finish', () => {
    let summary = '';
    try { summary = JSON.stringify(req.body).slice(0, 500); } catch (_) { summary = '[unserializable]'; }
    appendAudit({
      actor: req.user?.email || 'anonymous',
      actor_role: req.user?.role || null,
      method: req.method,
      path: req.originalUrl.slice(0, 500),
      status_code: res.statusCode,
      body_summary: summary,
    });
  });
  next();
}

const auditRouter = express.Router();

auditRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const r = await pool.query('SELECT * FROM audit_events ORDER BY id DESC LIMIT $1', [limit]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

auditRouter.get('/verify', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM audit_events ORDER BY id ASC');
    let prev = GENESIS;
    for (const row of r.rows) {
      const expected = crypto.createHash('sha256')
        .update(prev + canonicalPayload({ ...row, created_at: row.created_at.toISOString() }))
        .digest('hex');
      if (row.prev_hash !== prev || row.hash !== expected) {
        return res.json({ valid: false, first_broken_id: row.id, events_checked: r.rows.length,
          note: 'Chain broken: a row was altered, deleted, or inserted out of band.' });
      }
      prev = row.hash;
    }
    res.json({ valid: true, events_checked: r.rows.length, chain_head: prev,
      part11_note: 'Part 11-STYLE tamper-evident chain — not a certified 21 CFR Part 11 system.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ============================================================
   ROUTER 4 — eConsent  (/api/econsent)
   ============================================================ */
const econsentRouter = express.Router();

econsentRouter.get('/forms', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM consent_forms ORDER BY form_id, version DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

econsentRouter.post('/forms', async (req, res) => {
  try {
    const { form_id, trial, title, content } = req.body;
    if (!form_id || !title) return res.status(400).json({ error: 'form_id and title are required' });
    const v = await pool.query('SELECT COALESCE(MAX(version),0)+1 AS next FROM consent_forms WHERE form_id=$1', [form_id]);
    const r = await pool.query(
      `INSERT INTO consent_forms (form_id, version, trial, title, content) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [form_id, v.rows[0].next, trial || null, title, content || '']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

econsentRouter.get('/records', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM consent_records ORDER BY id DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* Two-component e-signature: the SIGNED-IN user must re-enter their
   password at signing time. The signature hash binds signer, subject,
   form+version, meaning, and timestamp. */
econsentRouter.post('/records', async (req, res) => {
  try {
    const { form_id, form_version, patient, meaning, password } = req.body;
    if (!form_id || !patient || !password) {
      return res.status(400).json({ error: 'form_id, patient, and password (e-signature re-verification) are required' });
    }
    const u = await pool.query('SELECT * FROM users WHERE email=$1', [req.user?.email]);
    if (u.rows.length === 0) return res.status(401).json({ error: 'Signer account not found' });
    const ok = await bcrypt.compare(password, u.rows[0].password);
    if (!ok) return res.status(403).json({ error: 'E-signature failed: password does not match signed-in user' });

    const fv = Number(form_version) ||
      (await pool.query('SELECT MAX(version) AS v FROM consent_forms WHERE form_id=$1 AND status=$2', [form_id, 'active'])).rows[0].v;
    const form = await pool.query('SELECT * FROM consent_forms WHERE form_id=$1 AND version=$2', [form_id, fv]);
    if (form.rows.length === 0) return res.status(404).json({ error: `Consent form ${form_id} v${fv} not found` });

    const signedAt = new Date().toISOString();
    const m = meaning || 'Consent obtained from subject';
    const sigHash = crypto.createHash('sha256')
      .update(`${u.rows[0].email}|${patient}|${form_id}|${fv}|${m}|${signedAt}`).digest('hex');
    const r = await pool.query(
      `INSERT INTO consent_records (form_id, form_version, trial, patient, signer_email, signer_name, signer_role, meaning, signed_at, signature_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [form_id, fv, form.rows[0].trial, patient, u.rows[0].email, u.rows[0].name, u.rows[0].role, m, signedAt, sigHash]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (/duplicate key/.test(err.message)) return res.status(409).json({ error: 'This subject already signed this form version' });
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   ROUTER 5 — AI comparison endpoints
   Each runs the DETERMINISTIC computation first, then an
   OpenRouter analysis of the SAME input, and returns both side
   by side so the UI can compare "memory" (DB) vs AI ranking.
   ============================================================ */
const compareAiRouter = express.Router();

// Same deterministic scoring as pass7's /comparable-trials/find,
// reproduced here so this endpoint returns both views in one call.
async function mechanicalComparables(indication, phase, limit) {
  const r = await pool.query('SELECT * FROM trials ORDER BY id');
  const tokens = String(indication || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
  const scored = r.rows.map((row) => {
    const ind = String(row.indication || '').toLowerCase();
    const tokenHits = tokens.filter(t => ind.includes(t)).length;
    const phaseHit = phase && row.phase === phase ? 1 : 0;
    const denom = tokens.length + 1;
    return {
      trial_id: row.trial_id, name: row.name, indication: row.indication,
      phase: row.phase, sponsor: row.sponsor, status: row.status,
      similarity_score: +((tokenHits + phaseHit) / denom).toFixed(3),
    };
  }).filter(x => x.similarity_score > 0);
  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  return scored.slice(0, limit);
}

compareAiRouter.post('/find-ai', async (req, res) => {
  try {
    const { indication, phase, limit } = req.body;
    if (!indication) return res.status(400).json({ error: 'indication is required' });
    const lim = Math.min(Number(limit) || 10, 25);
    const mechanical = await mechanicalComparables(indication, phase, lim);

    // AI ranks the SAME candidate set on clinical similarity (population,
    // mechanism, endpoints implied by the trial name) — not just keywords.
    let ai = null;
    try {
      const r = await callOpenRouter(
        SYSTEM_PROMPT,
        `A sponsor is designing a trial for "${indication}"${phase ? ` (Phase ${phase})` : ''}. ` +
        `Rank these candidate trials by TRUE clinical comparability (population, mechanism of action, likely endpoints), not keyword overlap. ` +
        `Return STRICT JSON: {"ranking": [{"trial_id": string, "ai_similarity": "high"|"medium"|"low", "rationale": string}], "summary": string, "disagreements_with_keyword_ranking": [string]}.\n` +
        `CANDIDATES: ${JSON.stringify(mechanical)}`
      );
      ai = safeJsonParse(r, { ranking: [], summary: typeof r === 'string' ? r : '' });
    } catch (e) { ai = { ranking: [], summary: '', error: `AI analysis unavailable: ${e.message}` }; }

    const out = {
      disclaimer: ADVISORY_DISCLAIMER,
      requires_expert_review: true,
      mechanical: { source: 'internal trials table (deterministic token-overlap)', results: mechanical },
      ai: { source: `OpenRouter (${MODEL}) — ADVISORY`, ...ai },
    };
    await persist('comparable-trials-ai', req.body, out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI summary of a protocol version history: deterministic graph data is
// loaded from protocols + amendments, then the LLM narrates the evolution.
compareAiRouter.post('/graph-ai', async (req, res) => {
  try {
    const { trial } = req.body;
    if (!trial) return res.status(400).json({ error: 'trial is required' });
    const protocols = await pool.query(
      'SELECT protocol_id, trial, version, status, approved_by, approved_at, created_at FROM protocols WHERE trial=$1 ORDER BY version', [trial]);
    const amendments = await pool.query(
      'SELECT amendment_id, trial, version, summary, status, approved_at, created_at FROM amendments WHERE trial=$1 ORDER BY created_at', [trial]);
    if (protocols.rows.length === 0 && amendments.rows.length === 0) {
      return res.status(404).json({ error: `No protocols or amendments found for trial ${trial}` });
    }

    let ai = null;
    try {
      const r = await callOpenRouter(
        SYSTEM_PROMPT,
        `Summarize this protocol version history for trial ${trial}. Return STRICT JSON: ` +
        `{"summary": string, "key_changes": [string], "risk_flags": [string], "regulatory_considerations": [string]}.\n` +
        `PROTOCOLS: ${JSON.stringify(protocols.rows)}\nAMENDMENTS: ${JSON.stringify(amendments.rows)}`
      );
      ai = safeJsonParse(r, { summary: typeof r === 'string' ? r : '' });
    } catch (e) { ai = { summary: '', error: `AI analysis unavailable: ${e.message}` }; }

    const out = {
      disclaimer: ADVISORY_DISCLAIMER,
      requires_expert_review: true,
      mechanical: { protocols: protocols.rows, amendments: amendments.rows },
      ai: { source: `OpenRouter (${MODEL}) — ADVISORY`, ...ai },
    };
    await persist('protocol-graph-ai', req.body, out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { ctgovRouter, designRouter, auditMiddleware, auditRouter, econsentRouter, compareAiRouter };
