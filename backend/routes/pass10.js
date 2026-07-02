const express = require('express');
const crypto = require('crypto');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const PERMISSIONS = [
  { module: 'Master Data', action: 'read', sponsor: true, pi: true, monitor: true },
  { module: 'Master Data', action: 'write', sponsor: true, pi: true, monitor: false },
  { module: 'Queries', action: 'write', sponsor: true, pi: true, monitor: true },
  { module: 'IRT Dispense', action: 'write', sponsor: true, pi: true, monitor: false },
  { module: 'IRT Lifecycle', action: 'quarantine_return_destroy', sponsor: true, pi: true, monitor: false },
  { module: 'Emergency Unblind', action: 'execute', sponsor: true, pi: true, monitor: false },
  { module: 'eConsent', action: 'sign', sponsor: true, pi: true, monitor: false },
  { module: 'Audit Trail', action: 'read_verify_export', sponsor: true, pi: true, monitor: true },
  { module: 'Validation Evidence', action: 'read', sponsor: true, pi: true, monitor: true },
];

function eventId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function insertIrtEvent(client, { event_type, kit_id, trial, site, subject_id, reason, actor, payload }) {
  const id = eventId('IRT');
  const r = await client.query(
    `INSERT INTO irt_events (event_id, event_type, kit_id, trial, site, subject_id, reason, actor, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, event_type, kit_id || null, trial || null, site || null, subject_id || null, reason || null, actor || null, payload || {}]
  );
  return r.rows[0];
}

router.get('/permissions-matrix', (req, res) => {
  res.json({
    roles: ['sponsor', 'pi', 'monitor'],
    matrix: PERMISSIONS,
    note: 'Application-level RBAC matrix. Formal access-control validation still requires QA approval.',
  });
});

router.get('/validation-evidence', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM validation_evidence ORDER BY area, evidence_id');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/irt/events', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM irt_events ORDER BY created_at DESC LIMIT 200');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/irt/resupply-forecast', async (req, res) => {
  try {
    const kits = await pool.query(
      `SELECT trial, site, arm, status, COUNT(*)::int AS n
       FROM irt_kits GROUP BY trial, site, arm, status ORDER BY trial, site, arm, status`
    );
    const disp = await pool.query(
      `SELECT trial, site, arm, COUNT(*)::int AS n
       FROM irt_dispenses
       WHERE dispensed_at >= NOW() - INTERVAL '90 days'
       GROUP BY trial, site, arm`
    );
    const key = (x) => `${x.trial}|${x.site || ''}|${x.arm || ''}`;
    const used = new Map(disp.rows.map(r => [key(r), r.n]));
    const groups = new Map();
    for (const row of kits.rows) {
      const k = key(row);
      if (!groups.has(k)) groups.set(k, { trial: row.trial, site: row.site, arm: row.arm, available: 0, assigned: 0, quarantined: 0, destroyed: 0, returned: 0 });
      const g = groups.get(k);
      const s = String(row.status || '').toLowerCase();
      if (s === 'available') g.available += row.n;
      else if (s === 'assigned') g.assigned += row.n;
      else if (s === 'quarantined') g.quarantined += row.n;
      else if (s === 'destroyed') g.destroyed += row.n;
      else if (s === 'returned') g.returned += row.n;
    }
    const forecast = Array.from(groups.values()).map(g => {
      const ninetyDayUse = used.get(key(g)) || 0;
      const monthlyRate = +(ninetyDayUse / 3).toFixed(2);
      const monthsCover = monthlyRate > 0 ? +(g.available / monthlyRate).toFixed(1) : null;
      const reorder = g.available <= Math.max(2, monthlyRate * 2);
      return { ...g, ninety_day_dispenses: ninetyDayUse, monthly_rate: monthlyRate, months_cover: monthsCover, reorder_recommended: reorder };
    });
    res.json({ generated_at: new Date().toISOString(), forecast });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/irt/kit/:kitId/lifecycle', requireRole('sponsor', 'pi'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { action, reason } = req.body || {};
    const allowed = new Set(['quarantine', 'release', 'return', 'destroy']);
    if (!allowed.has(action)) return res.status(400).json({ error: `action must be one of ${Array.from(allowed).join(', ')}` });
    const status = action === 'quarantine' ? 'quarantined' : action === 'release' ? 'available' : action === 'return' ? 'returned' : 'destroyed';
    await client.query('BEGIN');
    const k = await client.query('SELECT * FROM irt_kits WHERE kit_id=$1 FOR UPDATE', [req.params.kitId]);
    if (k.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Kit not found' }); }
    const kit = k.rows[0];
    const updated = await client.query(
      `UPDATE irt_kits SET status=$1, updated_at=NOW() WHERE kit_id=$2 RETURNING *`,
      [status, req.params.kitId]
    );
    const event = await insertIrtEvent(client, {
      event_type: action, kit_id: kit.kit_id, trial: kit.trial, site: kit.site,
      subject_id: kit.assigned_subject, reason, actor: req.user?.email, payload: { previous_status: kit.status, new_status: status },
    });
    await client.query('COMMIT');
    res.json({ kit: updated.rows[0], event });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

router.post('/irt/emergency-unblind', requireRole('sponsor', 'pi'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { subject_id, reason } = req.body || {};
    if (!subject_id || !reason) return res.status(400).json({ error: 'subject_id and reason are required' });
    await client.query('BEGIN');
    const r = await client.query(
      `SELECT d.*, k.assigned_subject
       FROM irt_dispenses d
       LEFT JOIN irt_kits k ON k.kit_id=d.kit_id
       WHERE d.subject_id=$1
       ORDER BY d.dispensed_at DESC LIMIT 1`,
      [subject_id]
    );
    if (r.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'No IRT dispense found for subject' }); }
    const row = r.rows[0];
    const unblindId = eventId('UNB');
    const u = await client.query(
      `INSERT INTO emergency_unblinds (unblind_id, trial, subject_id, arm, kit_id, reason, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [unblindId, row.trial, subject_id, row.arm, row.kit_id, reason, req.user?.email || null]
    );
    const event = await insertIrtEvent(client, {
      event_type: 'emergency_unblind', kit_id: row.kit_id, trial: row.trial, site: row.site,
      subject_id, reason, actor: req.user?.email, payload: { unblind_id: unblindId, revealed_arm: row.arm },
    });
    await client.query('COMMIT');
    res.status(201).json({ unblind: u.rows[0], event, revealed_arm: row.arm });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

function validateDomain(domain, rows) {
  const issues = [];
  const required = {
    DM: ['STUDYID', 'USUBJID', 'SUBJID'],
    AE: ['STUDYID', 'USUBJID', 'AETERM'],
    DV: ['STUDYID', 'USUBJID', 'DVTERM'],
  }[domain] || [];
  rows.forEach((row, idx) => {
    required.forEach(col => {
      if (row[col] === null || row[col] === undefined || row[col] === '') {
        issues.push({ severity: 'high', row: idx + 1, column: col, message: `${col} is required` });
      }
    });
  });
  if (domain === 'DM') {
    const seen = new Set();
    rows.forEach((row, idx) => {
      if (seen.has(row.USUBJID)) issues.push({ severity: 'medium', row: idx + 1, column: 'USUBJID', message: 'Duplicate USUBJID in DM' });
      seen.add(row.USUBJID);
    });
  }
  if (domain === 'AE') {
    rows.forEach((row, idx) => {
      if (row.AESER !== 'Y' && row.AESER !== 'N') issues.push({ severity: 'medium', row: idx + 1, column: 'AESER', message: 'AESER should be Y or N' });
    });
  }
  return issues;
}

router.get('/sdtm-validate/:domain', async (req, res) => {
  try {
    const domain = String(req.params.domain || '').toUpperCase();
    let rows = [];
    if (domain === 'DM') {
      rows = (await pool.query(`SELECT trial AS "STUDYID", trial || '-' || patient_id AS "USUBJID", patient_id AS "SUBJID", site AS "SITEID", arm AS "ARM" FROM patients ORDER BY patient_id`)).rows;
    } else if (domain === 'AE') {
      rows = (await pool.query(`SELECT trial AS "STUDYID", trial || '-' || patient AS "USUBJID", event_id AS "AESEQ", term AS "AETERM", CASE WHEN serious THEN 'Y' ELSE 'N' END AS "AESER", severity AS "AESEV" FROM adverse_events ORDER BY event_id`)).rows;
    } else if (domain === 'DV') {
      rows = (await pool.query(`SELECT trial AS "STUDYID", trial || '-' || site AS "USUBJID", deviation_id AS "DVSEQ", description AS "DVTERM", type AS "DVCAT" FROM deviations ORDER BY deviation_id`)).rows;
    } else {
      return res.status(404).json({ error: 'Supported domains: DM, AE, DV' });
    }
    const issues = validateDomain(domain, rows);
    res.json({
      domain, row_count: rows.length, issue_count: issues.length,
      status: issues.some(i => i.severity === 'high') ? 'fail' : issues.length ? 'warning' : 'pass',
      issues,
      note: 'Rule-based SDTM-shaped validation only; not a certified CDISC validator.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/compliance-export', async (req, res) => {
  try {
    const [audit, evidence, forms, records, permissions, unblinds, irtEvents] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n, MAX(created_at) AS latest FROM audit_events'),
      pool.query('SELECT area, status, COUNT(*)::int AS n FROM validation_evidence GROUP BY area, status ORDER BY area, status'),
      pool.query('SELECT COUNT(*)::int AS n FROM consent_forms'),
      pool.query('SELECT COUNT(*)::int AS n FROM consent_records'),
      Promise.resolve({ rows: PERMISSIONS }),
      pool.query('SELECT COUNT(*)::int AS n FROM emergency_unblinds'),
      pool.query('SELECT COUNT(*)::int AS n FROM irt_events'),
    ]);
    const payload = {
      generated_at: new Date().toISOString(),
      generated_by: req.user?.email || null,
      package_hash_scope: 'summary-metadata',
      audit_events: audit.rows[0],
      validation_evidence_summary: evidence.rows,
      consent_forms: forms.rows[0].n,
      consent_records: records.rows[0].n,
      emergency_unblinds: unblinds.rows[0].n,
      irt_events: irtEvents.rows[0].n,
      permissions_matrix: permissions.rows,
      disclaimers: [
        'Export is a machine-readable evidence package summary, not a full eTMF.',
        'Part 11 and SDTM/CDISC status remains not-certified until formal validation and QA approval are complete.',
      ],
    };
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    res.json({ ...payload, package_hash: hash });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
