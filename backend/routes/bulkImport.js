const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireWrite } = require('../middleware/auth');

/**
 * Minimal CSV parser that handles quotes and commas inside quoted fields.
 * Returns { headers: string[], rows: string[][] }
 */
function parseCsv(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow   = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { pushField(); i++; continue; }
    if (c === '\n') { pushField(); pushRow(); i++; continue; }
    if (c === '\r') { i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { pushField(); pushRow(); }
  // strip trailing empty row
  while (rows.length && rows[rows.length - 1].every(v => v === '')) rows.pop();
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows.shift().map(h => h.trim());
  return { headers, rows };
}

function rowsToObjects(headers, rows) {
  return rows.map(r => {
    const o = {};
    headers.forEach((h, idx) => { o[h] = r[idx] !== undefined ? r[idx] : ''; });
    return o;
  });
}

const ENTITY_CONFIG = {
  patients: {
    table: 'patients',
    columns: ['patient_id', 'trial', 'site', 'enrollment_status', 'enrolled_at', 'arm'],
    defaults: { enrollment_status: 'screening', enrolled_at: null, arm: '' },
    nullables: ['enrolled_at'],
    conflict: 'patient_id',
  },
  sites: {
    table: 'sites',
    columns: ['site_id', 'name', 'city', 'country', 'principal_investigator', 'capacity', 'status'],
    defaults: { capacity: 0, status: 'active' },
    nullables: [],
    conflict: 'site_id',
  },
  investigators: {
    table: 'investigators',
    columns: ['investigator_id', 'name', 'title', 'site', 'specialty', 'trials_count', 'certifications'],
    defaults: { trials_count: 0, certifications: '' },
    nullables: [],
    conflict: 'investigator_id',
  },
};

router.post('/:entity', requireWrite(), async (req, res) => {
  try {
    const cfg = ENTITY_CONFIG[req.params.entity];
    if (!cfg) return res.status(400).json({ error: `Unsupported entity. Use one of: ${Object.keys(ENTITY_CONFIG).join(', ')}` });

    const csv = req.body && req.body.csv;
    if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'Body must include { csv: "<csv text>" }' });

    const { headers, rows } = parseCsv(csv);
    if (rows.length === 0) return res.status(400).json({ error: 'CSV contains no data rows' });

    const objs = rowsToObjects(headers, rows);
    let inserted = 0, updated = 0, failed = 0;
    const errors = [];

    const placeholders = cfg.columns.map((_, idx) => `$${idx + 1}`).join(',');
    const updateSet = cfg.columns
      .filter(c => c !== cfg.conflict)
      .map(c => `${c}=EXCLUDED.${c}`).join(', ');
    const sql = `INSERT INTO ${cfg.table} (${cfg.columns.join(',')}) VALUES (${placeholders})
                 ON CONFLICT (${cfg.conflict}) DO UPDATE SET ${updateSet}
                 RETURNING (xmax = 0) AS inserted`;

    for (const o of objs) {
      try {
        const values = cfg.columns.map(c => {
          let v = o[c];
          if ((v === undefined || v === '') && Object.prototype.hasOwnProperty.call(cfg.defaults, c)) {
            v = cfg.defaults[c];
          }
          if (cfg.nullables.includes(c) && (v === '' || v === undefined)) return null;
          return v;
        });
        const r = await pool.query(sql, values);
        if (r.rows[0]?.inserted) inserted++; else updated++;
      } catch (e) {
        failed++;
        errors.push({ row: o, error: e.message });
      }
    }

    res.json({ entity: req.params.entity, inserted, updated, failed, total: objs.length, errors: errors.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
