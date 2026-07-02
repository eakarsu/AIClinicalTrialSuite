/**
 * Custom Views routes - 4 endpoints serving 4 derived/composed views over
 * existing pharma trial data. All endpoints are read-only or virtual CRUD
 * (rules store kept in-memory; survives until server restart, like a draft).
 *
 *   GET  /api/custom-views/trial-timeline        VIZ - phase x duration
 *   GET  /api/custom-views/endpoint-coverage     VIZ - endpoint x trial heatmap
 *   GET  /api/custom-views/protocol-pdf/:id      NON-VIZ - PDF-like text export
 *   GET  /api/custom-views/design-rules          NON-VIZ - list inclusion/exclusion rules
 *   POST /api/custom-views/design-rules          NON-VIZ - create rule
 *   PUT  /api/custom-views/design-rules/:id      NON-VIZ - update rule
 *   DELETE /api/custom-views/design-rules/:id    NON-VIZ - delete rule
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ---------------------------------------------------------------------------
// In-memory rules store. Seeded with realistic clinical inclusion/exclusion
// criteria so the UI never starts empty. Keyed by numeric id.
// ---------------------------------------------------------------------------
let ruleSeq = 1;
const rules = new Map();
function seedRule(trial, kind, text) {
  const id = ruleSeq++;
  rules.set(id, { id, trial, kind, text, created_at: new Date().toISOString() });
}
seedRule('ONCO-LUNG-301', 'inclusion', 'Histologically confirmed metastatic NSCLC, ECOG 0-1.');
seedRule('ONCO-LUNG-301', 'exclusion', 'Prior systemic therapy for metastatic disease.');
seedRule('ONCO-LUNG-301', 'inclusion', 'PD-L1 TPS >= 1% by FDA-approved assay.');
seedRule('NEURO-MDD-202', 'inclusion', 'MADRS total score >= 28 at screening and baseline.');
seedRule('NEURO-MDD-202', 'exclusion', 'Active suicidal ideation with intent in past 6 months.');
seedRule('METAB-T2D-401', 'inclusion', 'HbA1c 7.0-10.5% on stable background therapy.');
seedRule('METAB-T2D-401', 'exclusion', 'History of pancreatitis or medullary thyroid carcinoma.');
seedRule('CARDIO-HF-301', 'inclusion', 'LVEF <= 45% within 12 months, NYHA class II-IV.');

// ---------------------------------------------------------------------------
// 1) VIZ - trial timeline (phase x duration buckets)
// ---------------------------------------------------------------------------
router.get('/trial-timeline', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, trial_id, name, phase, status, start_date FROM trials ORDER BY phase, start_date NULLS LAST`
    );
    const today = new Date();
    const rows = r.rows.map(t => {
      const start = t.start_date ? new Date(t.start_date) : null;
      const months = start
        ? Math.max(1, Math.round((today - start) / (1000 * 60 * 60 * 24 * 30.44)))
        : 0;
      return {
        trial_id: t.trial_id,
        name: t.name,
        phase: t.phase || 'N/A',
        status: t.status,
        start_date: t.start_date,
        duration_months: months,
      };
    });

    // Aggregate per phase: trial count + total duration months (for bar viz)
    const byPhase = {};
    rows.forEach(row => {
      if (!byPhase[row.phase]) byPhase[row.phase] = { phase: row.phase, trials: 0, total_months: 0, avg_months: 0 };
      byPhase[row.phase].trials += 1;
      byPhase[row.phase].total_months += row.duration_months;
    });
    Object.values(byPhase).forEach(p => {
      p.avg_months = Math.round(p.total_months / Math.max(1, p.trials));
    });

    res.json({
      generated_at: new Date().toISOString(),
      rows,
      by_phase: Object.values(byPhase).sort((a, b) => a.phase.localeCompare(b.phase)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 2) VIZ - endpoint coverage heatmap (endpoint type x trial)
// ---------------------------------------------------------------------------
router.get('/endpoint-coverage', async (_req, res) => {
  try {
    const tr = await pool.query(`SELECT trial_id, name, phase FROM trials ORDER BY trial_id`);
    const ep = await pool.query(`SELECT trial, type FROM endpoints`);

    const trials = tr.rows.map(t => t.trial_id);
    const types = ['primary', 'secondary', 'exploratory', 'safety'];

    // counts[trial_id][type] = N
    const counts = {};
    trials.forEach(t => { counts[t] = {}; types.forEach(k => { counts[t][k] = 0; }); });
    ep.rows.forEach(e => {
      if (!counts[e.trial]) return;
      const k = types.includes(e.type) ? e.type : 'exploratory';
      counts[e.trial][k] += 1;
    });

    // Build cells [{trial, type, count}] for grid render
    const cells = [];
    trials.forEach(t => {
      types.forEach(k => cells.push({ trial: t, type: k, count: counts[t][k] }));
    });

    res.json({
      generated_at: new Date().toISOString(),
      trials: tr.rows,
      types,
      cells,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 3) NON-VIZ - protocol PDF (text body suitable for textarea / download)
// ---------------------------------------------------------------------------
router.get('/protocol-pdf/:trialId', async (req, res) => {
  try {
    const trialId = req.params.trialId;
    const t = await pool.query(`SELECT * FROM trials WHERE trial_id=$1`, [trialId]);
    if (t.rows.length === 0) return res.status(404).json({ error: 'Trial not found' });
    const trial = t.rows[0];
    const eps = await pool.query(`SELECT * FROM endpoints WHERE trial=$1`, [trialId]);

    const ruleList = [...rules.values()].filter(r => r.trial === trialId);
    const inc = ruleList.filter(r => r.kind === 'inclusion');
    const exc = ruleList.filter(r => r.kind === 'exclusion');

    const lines = [];
    lines.push('===============================================');
    lines.push(`PROTOCOL  ${trial.trial_id}`);
    lines.push('===============================================');
    lines.push('');
    lines.push(`Title:       ${trial.name}`);
    lines.push(`Indication:  ${trial.indication || '-'}`);
    lines.push(`Phase:       ${trial.phase || '-'}`);
    lines.push(`Status:      ${trial.status || '-'}`);
    lines.push(`Sponsor:     ${trial.sponsor || '-'}`);
    lines.push(`Start date:  ${trial.start_date || '-'}`);
    lines.push('');
    lines.push('---- 1. Endpoints ----');
    if (eps.rows.length === 0) lines.push('  (none on file)');
    eps.rows.forEach((e, i) => {
      lines.push(`  ${i + 1}. [${e.type}] ${e.measure} @ ${e.timepoint || 'n/a'}`);
      if (e.statistical_method) lines.push(`     stat: ${e.statistical_method}`);
    });
    lines.push('');
    lines.push('---- 2. Inclusion criteria ----');
    if (inc.length === 0) lines.push('  (none defined)');
    inc.forEach((r, i) => lines.push(`  IN-${i + 1}. ${r.text}`));
    lines.push('');
    lines.push('---- 3. Exclusion criteria ----');
    if (exc.length === 0) lines.push('  (none defined)');
    exc.forEach((r, i) => lines.push(`  EX-${i + 1}. ${r.text}`));
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);

    res.json({
      trial_id: trialId,
      filename: `protocol_${trialId}.txt`,
      body: lines.join('\n'),
      meta: {
        endpoints: eps.rows.length,
        inclusion_rules: inc.length,
        exclusion_rules: exc.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 4) NON-VIZ - design rules CRUD (in-memory)
// ---------------------------------------------------------------------------
router.get('/design-rules', (_req, res) => {
  const list = [...rules.values()].sort((a, b) => a.id - b.id);
  res.json({ count: list.length, rules: list });
});

router.post('/design-rules', (req, res) => {
  const { trial, kind, text } = req.body || {};
  if (!trial || !text) return res.status(400).json({ error: 'trial and text required' });
  const cleanKind = kind === 'exclusion' ? 'exclusion' : 'inclusion';
  const id = ruleSeq++;
  const rule = { id, trial, kind: cleanKind, text, created_at: new Date().toISOString() };
  rules.set(id, rule);
  res.status(201).json(rule);
});

router.put('/design-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!rules.has(id)) return res.status(404).json({ error: 'Rule not found' });
  const cur = rules.get(id);
  const { trial, kind, text } = req.body || {};
  const updated = {
    ...cur,
    trial: trial ?? cur.trial,
    kind: kind === 'exclusion' || kind === 'inclusion' ? kind : cur.kind,
    text: text ?? cur.text,
    updated_at: new Date().toISOString(),
  };
  rules.set(id, updated);
  res.json(updated);
});

router.delete('/design-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!rules.has(id)) return res.status(404).json({ error: 'Rule not found' });
  const removed = rules.get(id);
  rules.delete(id);
  res.json({ message: 'Deleted', rule: removed });
});

module.exports = router;
