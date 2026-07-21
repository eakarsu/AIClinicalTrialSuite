const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const { authenticateToken, requireWrite } = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 3051;
const HOST = process.env.BACKEND_HOST || '127.0.0.1';

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Webhook test receiver (public, no auth — simulates a downstream subscriber).
// Logs the signature header so it shows up in the delivery log.
app.post('/api/webhooks/test-receiver', express.json(), (req, res) => {
  const sig = req.headers['x-webhook-signature'];
  console.log(`[webhook-receiver] event=${req.body?.event} signature=${sig}`);
  res.json({ received: true, event: req.body?.event, signature_seen: !!sig });
});

// Gate everything else under /api/* behind JWT
app.use('/api', authenticateToken);

// Pass 9: Part 11-STYLE tamper-evident audit chain — records every
// authenticated write across the whole /api surface (fire-and-forget,
// never blocks the response). Mounted right after auth so req.user exists.
const pass9 = require('./routes/pass9');
app.use('/api', pass9.auditMiddleware);

// Read-open CRUD routes (RBAC: any authenticated user can read; only sponsor+pi can write)
const writeGate = requireWrite();

app.use('/api/trials',        writeGate, require('./routes/trials'));
app.use('/api/sites',         writeGate, require('./routes/sites'));
app.use('/api/protocols',     writeGate, require('./routes/protocols'));
app.use('/api/investigators', writeGate, require('./routes/investigators'));
app.use('/api/patients',      writeGate, require('./routes/patients'));
app.use('/api/compounds',     writeGate, require('./routes/compounds'));
app.use('/api/endpoints',     writeGate, require('./routes/endpoints'));
app.use('/api/adverse-events', writeGate, require('./routes/adverseEvents'));

// New CRUD entities
app.use('/api/amendments',         writeGate, require('./routes/amendments'));
app.use('/api/deviations',         writeGate, require('./routes/deviations'));
app.use('/api/monitoring-visits',  writeGate, require('./routes/monitoringVisits'));
// Queries: monitors CAN write here (they raise/close queries) — no writeGate
app.use('/api/queries',                          require('./routes/queries'));
app.use('/api/data-locks',         writeGate, require('./routes/dataLocks'));
app.use('/api/milestones',         writeGate, require('./routes/milestones'));
app.use('/api/budgets',            writeGate, require('./routes/budgets'));
app.use('/api/vendors-cro',        writeGate, require('./routes/vendorsCro'));
app.use('/api/regulatory-submissions', writeGate, require('./routes/regulatorySubmissions'));
app.use('/api/supply-shipments',   writeGate, require('./routes/supplyShipments'));

// AI route (any authenticated user)
app.use('/api/ai', require('./routes/ai'));
app.use('/api/feature-ai', require('./routes/featureAi'));
app.use('/api/site-activation-risk', require('./routes/siteActivationRisk'));

// Pass 7 (full backlog) — extra AI endpoints, comparable-trial finder,
// protocol version-graph, IRB state-machine, and NEEDS-CREDS 503 stubs.
// All mounted BEFORE any 404 / catch-all handler.
const pass7 = require('./routes/pass7');
app.use('/api/ai',                pass7.aiRouter);             // adds power-calc-explain, patient-burden, ie-optimizer, ind-nda-section, dropout-predictor, adaptive-sim, rwe-match
app.use('/api/comparable-trials', pass7.comparableRouter);     // MECHANICAL DB-side finder
app.use('/api/protocols-graph',   pass7.protocolGraphRouter);  // protocol version-graph + diff (read-only)
app.use('/api/irb-workflows',     pass7.irbRouter);            // IRB state-machine
app.use('/api/integrations',      pass7.integrationsRouter);   // NEEDS-CREDS 503 stubs

// Pass 8 (trial conduct) — randomization/IWRS, SDTM export, DSMB packet,
// enrollment forecast, MedDRA coding + safety narrative (advisory),
// Form 1572 drafts, delegation log, and training records.
const pass8 = require('./routes/pass8');
app.use('/api/ai',                  pass8.aiRouter);           // adds meddra-code, safety-narrative
app.use('/api/randomization',       pass8.randomizationRouter);
app.use('/api/sdtm',                pass8.sdtmRouter);
app.use('/api/dsmb',                pass8.dsmbRouter);
app.use('/api/enrollment-forecast', pass8.forecastRouter);
app.use('/api/form-1572',           pass8.form1572Router);
app.use('/api/delegation-log',      writeGate, pass8.delegationRouter);
app.use('/api/training-records',    writeGate, pass8.trainingRouter);

// Pass 9 (integrations + real stats + compliance mechanics)
app.use('/api/ctgov',       pass9.ctgovRouter);      // LIVE CT.gov v2 public read API
app.use('/api/design-sim',  pass9.designRouter);     // exact power calc + Monte Carlo GSD simulator
app.use('/api/audit-trail', pass9.auditRouter);      // hash-chain view + verify
app.use('/api/econsent',    pass9.econsentRouter);   // consent forms + e-signed records
// AI-vs-deterministic comparison endpoints (extend the pass-7 base paths)
app.use('/api/comparable-trials', pass9.compareAiRouter);  // adds POST /find-ai
app.use('/api/protocols-graph',   pass9.compareAiRouter);  // adds POST /graph-ai

// Pass 10 — production-readiness gap closures: advanced IRT lifecycle,
// emergency unblinding, SDTM validation checks, permissions matrix,
// validation evidence, and compliance export.
app.use('/api/production-readiness', require('./routes/pass10'));

// Merged recruitment and patient-trial matching module from
// AIClinicalTrialMatching, adapted to the Designer schema/runtime.
app.use('/api/recruitment', require('./routes/recruitment'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));
app.use('/api/bulk-import',   require('./routes/bulkImport'));

// Custom Views (4 derived endpoints powering /custom-views UI).
// Mounted BEFORE any 404 / dashboard handler so it always takes priority.
app.use('/api/custom-views',  require('./routes/customViews'));

// Dashboard stats
const pool = require('./config/database');
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const tables = [
      'trials', 'sites', 'protocols', 'investigators', 'patients', 'compounds', 'endpoints', 'adverse_events',
      'amendments', 'deviations', 'monitoring_visits', 'queries', 'data_locks', 'milestones',
      'budgets', 'vendors_cro', 'regulatory_submissions', 'supply_shipments',
    ];
    const counts = {};
    for (const t of tables) {
      const r = await pool.query(`SELECT COUNT(*) FROM ${t}`);
      counts[t] = parseInt(r.rows[0].count);
    }
    const trialPhases = await pool.query(`SELECT phase, COUNT(*) AS c FROM trials GROUP BY phase ORDER BY phase`);
    const trialStatus = await pool.query(`SELECT status, COUNT(*) AS c FROM trials GROUP BY status`);
    const aeSeverity  = await pool.query(`SELECT severity, COUNT(*) AS c FROM adverse_events GROUP BY severity`);
    res.json({
      counts,
      trial_phases: trialPhases.rows,
      trial_status: trialStatus.rows,
      ae_severity: aeSeverity.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`\nClinical Trial Suite API running on http://${HOST}:${PORT}\n`);
});
