/* ============================================================
   Seeder for pass 8/9 tables — >= 15 rows per table.
   Called from seed.js AFTER migrations are applied. Resets these
   tables first (same semantics as the main seed) so counts are
   deterministic on every run.

   Tables covered:
     randomization_schemes      15
     randomization_assignments  30 (derived with the REAL permuted-
                                    block algorithm from routes/pass8)
     irt_kits                   45
     irt_dispenses              15
     delegation_log_entries     15
     training_records           15
     consent_forms              15 (5 form families x versions)
     consent_records            15 (signature hashes computed with the
                                    same formula the API uses)
     audit_events               15 (correctly sha256 hash-chained so
                                    /api/audit-trail/verify stays green)
   ============================================================ */

const crypto = require('crypto');
const { permutedBlock } = require('../routes/pass8');

const TRIALS = ['ONCO-LUNG-301', 'NEURO-MDD-202', 'METAB-T2D-401', 'IMMUN-RA-201', 'ONCO-BREAST-302',
                'CARDIO-HF-301', 'NEURO-AD-202', 'RARE-SMA-103', 'ONCO-MEL-301', 'INF-FLU-202',
                'GI-IBD-301', 'HEME-AML-201', 'DERM-PSO-302', 'VASC-PAH-201', 'RENAL-CKD-301'];

const TWO_ARM = [{ name: 'Active', ratio: 1 }, { name: 'Placebo', ratio: 1 }];
const TWO_TO_ONE = [{ name: 'Active', ratio: 2 }, { name: 'Placebo', ratio: 1 }];
const THREE_ARM = [{ name: 'Low Dose', ratio: 1 }, { name: 'High Dose', ratio: 1 }, { name: 'Placebo', ratio: 1 }];

async function seedConduct(client) {
  console.log('Seeding trial-conduct tables (pass 8/9)...');

  await client.query(`
    DELETE FROM randomization_assignments;
    DELETE FROM irt_dispenses;
    DELETE FROM irt_kits;
    DELETE FROM randomization_schemes;
    DELETE FROM delegation_log_entries;
    DELETE FROM training_records;
    DELETE FROM consent_records;
    DELETE FROM consent_forms;
    DELETE FROM audit_events;
  `);

  /* ---------- randomization_schemes (15, one per trial) ---------- */
  const schemes = TRIALS.map((trial, i) => {
    const arms = i % 3 === 0 ? TWO_ARM : i % 3 === 1 ? TWO_TO_ONE : THREE_ARM;
    const blockSize = i % 3 === 1 ? 6 : i % 3 === 2 ? 6 : 4;
    const strata = i % 2 === 0 ? ['ECOG 0-1', 'ECOG 2'] : [];
    const categorySchema = [
      {
        category: 'treatment_arm',
        source: 'arms',
        allowed_values: arms.map(a => a.name),
        use_in_randomization: true,
        use_in_irt: true,
      },
      ...(strata.length ? [{
        category: 'randomization_stratum',
        source: 'strata',
        allowed_values: strata,
        use_in_randomization: true,
        use_in_irt: true,
      }] : []),
    ];
    return {
      scheme_id: `RND-${trial}`,
      trial, block_size: blockSize, arms, strata, category_schema: categorySchema,
      seed: `${trial.toLowerCase()}-2026`,
      status: i === 14 ? 'closed' : 'active',
    };
  });
  for (const s of schemes) {
    await client.query(
      `INSERT INTO randomization_schemes (scheme_id, trial, method, block_size, arms, strata, category_schema, seed, status)
       VALUES ($1,$2,'permuted-block',$3,$4,$5,$6,$7,$8)`,
      [s.scheme_id, s.trial, s.block_size, JSON.stringify(s.arms), JSON.stringify(s.strata), JSON.stringify(s.category_schema), s.seed, s.status]);
  }
  console.log(`Seeded ${schemes.length} randomization schemes`);

  /* ---------- randomization_assignments (30 = 2 subjects x 15 schemes),
                derived with the REAL algorithm ---------- */
  let nAssign = 0;
  for (const s of schemes) {
    for (let pos = 0; pos < 2; pos++) {
      const stratum = s.strata.length ? s.strata[0] : '';
      const blockNo = Math.floor(pos / s.block_size);
      const block = permutedBlock(s, stratum, blockNo);
      const arm = block[pos % s.block_size];
      await client.query(
        `INSERT INTO randomization_assignments (scheme, subject_id, stratum, arm, block_no, position, assigned_by)
         VALUES ($1,$2,$3,$4,$5,$6,'pi@trials.io')`,
        [s.scheme_id, `SUBJ-${s.trial}-${String(pos + 1).padStart(3, '0')}`, stratum, arm, blockNo, pos % s.block_size]);
      nAssign++;
    }
  }
  console.log(`Seeded ${nAssign} randomization assignments (algorithm-derived)`);

  /* ---------- IRT kits (45 = 3 per trial) + dispenses (15) ---------- */
  let nKits = 0;
  for (const s of schemes) {
    for (let i = 0; i < 3; i++) {
      const arm = s.arms[i % s.arms.length].name;
      await client.query(
        `INSERT INTO irt_kits (kit_id, trial, site, arm, lot, status, expiry_date, temperature_status)
         VALUES ($1,$2,$3,$4,$5,'available',$6,'in_range')`,
        [
          `KIT-${s.trial}-${String(i + 1).padStart(3, '0')}`,
          s.trial,
          `SITE-${String((i % 6) + 1).padStart(3, '0')}`,
          arm,
          `LOT-${s.trial.slice(0, 4)}-${2026 + (i % 2)}`,
          `${2027 + (i % 2)}-${String((i % 12) + 1).padStart(2, '0')}-28`,
        ]
      );
      nKits++;
    }
  }
  let nDispense = 0;
  for (const s of schemes) {
    const a = (await client.query(
      'SELECT * FROM randomization_assignments WHERE scheme=$1 ORDER BY id LIMIT 1',
      [s.scheme_id]
    )).rows[0];
    if (!a) continue;
    const kit = (await client.query(
      `SELECT * FROM irt_kits WHERE trial=$1 AND arm=$2 AND status='available' ORDER BY expiry_date ASC, kit_id ASC LIMIT 1`,
      [s.trial, a.arm]
    )).rows[0];
    if (!kit) continue;
    await client.query(
      `UPDATE irt_kits SET status='assigned', assigned_subject=$1, assigned_at=NOW(), updated_at=NOW() WHERE id=$2`,
      [a.subject_id, kit.id]
    );
    await client.query(
      `INSERT INTO irt_dispenses (dispense_id, scheme, trial, subject_id, arm, kit_id, site, dispensed_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pi@trials.io','Seeded IRT dispense')`,
      [`DSP-${s.trial}-001`, s.scheme_id, s.trial, a.subject_id, a.arm, kit.kit_id, kit.site]
    );
    nDispense++;
  }
  console.log(`Seeded ${nKits} IRT kits and ${nDispense} IRT dispenses`);

  /* ---------- delegation_log_entries (15) ---------- */
  const STAFF = [
    ['Sarah Chen, RN', 'Study Coordinator', 'Informed consent process; vital signs; EDC data entry'],
    ['Michael Torres, CRC', 'Research Coordinator', 'Visit scheduling; sample processing; query resolution'],
    ['Emily Park, PharmD', 'Pharmacist', 'IP dispensing; accountability logs; temperature monitoring'],
    ['David Kim, RN', 'Study Nurse', 'Dosing administration; AE assessment support; PRO administration'],
    ['Lisa Nguyen, CRC', 'Research Coordinator', 'EDC data entry; visit windows; source document filing'],
    ['James Okafor, MD', 'Sub-Investigator', 'Eligibility confirmation; AE causality assessment; dose modifications'],
    ['Maria Santos, RN', 'Study Nurse', 'Infusion administration; post-dose monitoring; sample collection'],
    ['Tom Reilly, CRC', 'Regulatory Coordinator', 'Regulatory binder; IRB submissions; delegation log maintenance'],
    ['Aisha Patel, PharmD', 'Pharmacist', 'Randomization calls; IP preparation; blinding maintenance'],
    ['Kevin Wu, RA', 'Research Assistant', 'PRO questionnaire administration; visit reminders; travel reimbursement'],
    ['Rachel Green, RN', 'Study Coordinator', 'Screening visits; consent re-verification; central lab shipments'],
    ['Carlos Mendez, MD', 'Sub-Investigator', 'Physical exams; ECG interpretation; SAE reporting'],
    ['Nina Ivanova, CRC', 'Data Coordinator', 'Query resolution; data entry QC; monitoring visit prep'],
    ['Sam Ahmed, RN', 'Study Nurse', 'Vital signs; injection training; home-dosing diary review'],
    ['Julia Costa, CRC', 'Research Coordinator', 'Recruitment outreach; pre-screening; enrollment tracking'],
  ];
  const PIS = ['Dr. James Wilson', 'Dr. Anita Rao', 'Dr. Robert Hayes'];
  for (let i = 0; i < 15; i++) {
    const [name, role, tasks] = STAFF[i];
    await client.query(
      `INSERT INTO delegation_log_entries (entry_id, trial, site, staff_name, staff_role, delegated_tasks, delegated_by, effective_from, effective_to, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [`DLG-${String(i + 1).padStart(3, '0')}`, TRIALS[i % TRIALS.length], `SITE-${String((i % 6) + 1).padStart(3, '0')}`,
       name, role, tasks, PIS[i % 3],
       `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
       i % 5 === 4 ? `2025-${String((i % 12) + 1).padStart(2, '0')}-01` : null,
       i % 5 === 4 ? 'expired' : 'active']);
  }
  console.log('Seeded 15 delegation log entries');

  /* ---------- training_records (15) ---------- */
  const COURSES = [
    ['ICH-GCP E6(R3) Initial', 'gcp', 36], ['ICH-GCP E6(R3) Refresher', 'gcp', 36],
    ['Protocol-Specific Training v2.0', 'protocol', null], ['EDC System (Rave) Certification', 'system', 24],
    ['IATA Dangerous Goods', 'iata', 24], ['Human Subjects Protection', 'gcp', 36],
    ['Blood-Borne Pathogens', 'other', 12], ['Investigational Product Handling', 'protocol', null],
  ];
  for (let i = 0; i < 15; i++) {
    const [course, type, monthsValid] = COURSES[i % COURSES.length];
    const done = new Date(2024, (i * 2) % 12, ((i * 7) % 27) + 1);
    const expires = monthsValid ? new Date(done.getFullYear(), done.getMonth() + monthsValid, done.getDate()) : null;
    const expired = expires && expires < new Date();
    await client.query(
      `INSERT INTO training_records (record_id, trial, site, staff_name, course, course_type, completed_at, expires_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [`TRN-${String(i + 1).padStart(3, '0')}`, TRIALS[i % TRIALS.length], `SITE-${String((i % 6) + 1).padStart(3, '0')}`,
       STAFF[i][0], course, type,
       done.toISOString().slice(0, 10), expires ? expires.toISOString().slice(0, 10) : null,
       expired ? 'expired' : 'current']);
  }
  console.log('Seeded 15 training records');

  /* ---------- consent_forms (15 = 5 families x 3 versions) ---------- */
  const FORM_FAMILIES = [
    ['ICF-ONCO-301', 'ONCO-LUNG-301', 'Informed Consent — ONCO-LUNG-301 Main Study'],
    ['ICF-NEURO-202', 'NEURO-MDD-202', 'Informed Consent — NEURO-MDD-202'],
    ['ICF-METAB-401', 'METAB-T2D-401', 'Informed Consent — METAB-T2D-401 CV Outcomes'],
    ['ICF-MEL-301', 'ONCO-MEL-301', 'Informed Consent — ONCO-MEL-301 Adjuvant Study'],
    ['ICF-SMA-103', 'RARE-SMA-103', 'Informed Consent — RARE-SMA-103 Gene Therapy'],
  ];
  const VERSION_NOTES = [
    'Initial IRB-approved version describing purpose, procedures, risks, benefits, and voluntary participation.',
    'Amendment 1: adds optional pharmacokinetic sub-study sampling; clarifies contraception requirements.',
    'Amendment 2: updated risk language following DSMB review; adds remote-visit option for follow-up.',
  ];
  for (const [formId, trial, title] of FORM_FAMILIES) {
    for (let v = 1; v <= 3; v++) {
      await client.query(
        `INSERT INTO consent_forms (form_id, version, trial, title, content, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [formId, v, trial, v === 1 ? title : `${title} (Amendment ${v - 1})`, VERSION_NOTES[v - 1],
         v === 3 ? 'active' : 'superseded']);
    }
  }
  console.log('Seeded 15 consent form versions');

  /* ---------- consent_records (15) — same signature formula as the API ---------- */
  const SIGNERS = [
    ['pi@trials.io', 'Demo Principal Investigator', 'pi'],
    ['sponsor@trials.io', 'Demo Sponsor Operations', 'sponsor'],
  ];
  let nConsent = 0;
  for (let i = 0; i < 15; i++) {
    const [formId, trial] = FORM_FAMILIES[i % FORM_FAMILIES.length];
    const version = 3; // latest active
    const patient = `PT-${String(i + 1).padStart(4, '0')}`;
    const [email, name, role] = SIGNERS[i % 2];
    const meaning = i % 7 === 6 ? 'Re-consent after amendment' : 'Consent obtained from subject';
    const signedAt = new Date(2025, i % 12, (i % 27) + 1, 9 + (i % 8)).toISOString();
    const sigHash = crypto.createHash('sha256')
      .update(`${email}|${patient}|${formId}|${version}|${meaning}|${signedAt}`).digest('hex');
    await client.query(
      `INSERT INTO consent_records (form_id, form_version, trial, patient, signer_email, signer_name, signer_role, meaning, signed_at, signature_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [formId, version, trial, patient, email, name, role, meaning, signedAt, sigHash]);
    nConsent++;
  }
  console.log(`Seeded ${nConsent} consent records`);

  /* ---------- audit_events (15) — correctly hash-chained ---------- */
  const GENESIS = '0'.repeat(64);
  const AUDIT_ACTIONS = [
    ['pi@trials.io', 'pi', 'POST', '/api/trials', 201, '{"trial_id":"ONCO-LUNG-301"}'],
    ['sponsor@trials.io', 'sponsor', 'POST', '/api/protocols', 201, '{"protocol_id":"PROT-001"}'],
    ['pi@trials.io', 'pi', 'POST', '/api/patients', 201, '{"patient_id":"PT-0001"}'],
    ['pi@trials.io', 'pi', 'POST', '/api/randomization/schemes/RND-ONCO-LUNG-301/assign', 201, '{"subject_id":"SUBJ-ONCO-LUNG-301-001"}'],
    ['monitor@trials.io', 'monitor', 'POST', '/api/queries', 201, '{"query_id":"QRY-001","field":"vital_signs"}'],
    ['pi@trials.io', 'pi', 'PUT', '/api/adverse-events/3', 200, '{"severity":"grade 3","serious":true}'],
    ['sponsor@trials.io', 'sponsor', 'POST', '/api/amendments', 201, '{"amendment_id":"AMD-002"}'],
    ['pi@trials.io', 'pi', 'POST', '/api/econsent/records', 201, '{"form_id":"ICF-ONCO-301","patient":"PT-0002"}'],
    ['monitor@trials.io', 'monitor', 'PUT', '/api/queries/4', 200, '{"status":"answered"}'],
    ['sponsor@trials.io', 'sponsor', 'POST', '/api/data-locks', 201, '{"scope":"ONCO-LUNG-301 interim"}'],
    ['pi@trials.io', 'pi', 'POST', '/api/deviations', 201, '{"deviation_id":"DEV-011","type":"minor"}'],
    ['sponsor@trials.io', 'sponsor', 'PUT', '/api/budgets/2', 200, '{"amount":1250000}'],
    ['pi@trials.io', 'pi', 'POST', '/api/irb-workflows', 201, '{"workflow_id":"IRB-005"}'],
    ['sponsor@trials.io', 'sponsor', 'POST', '/api/regulatory-submissions', 201, '{"submission_id":"SUB-009"}'],
    ['pi@trials.io', 'pi', 'DELETE', '/api/attachments/7', 200, '{}'],
  ];
  let prevHash = GENESIS;
  const base = Date.now() - 15 * 3600 * 1000;
  for (let i = 0; i < AUDIT_ACTIONS.length; i++) {
    const [actor, role, method, path, status, body] = AUDIT_ACTIONS[i];
    const createdAt = new Date(base + i * 3600 * 1000).toISOString();
    const payload = JSON.stringify({
      actor, actor_role: role, method, path, status_code: status, body_summary: body, created_at: createdAt,
    });
    const hash = crypto.createHash('sha256').update(prevHash + payload).digest('hex');
    await client.query(
      `INSERT INTO audit_events (actor, actor_role, method, path, status_code, body_summary, prev_hash, hash, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [actor, role, method, path, status, body, prevHash, hash, createdAt]);
    prevHash = hash;
  }
  console.log(`Seeded ${AUDIT_ACTIONS.length} hash-chained audit events`);

  /* ---------- irb_workflows (15, pass-7 table that previously started empty)
                + one logged transition per non-draft workflow ---------- */
  await client.query('DELETE FROM irb_workflow_transitions; DELETE FROM irb_workflows;');
  const IRB_STATES = ['draft', 'submitted', 'response_pending', 'approved', 'continuing_review'];
  const IRB_NAMES = ['WCG IRB', 'Advarra IRB', 'University Central IRB'];
  let nIrb = 0;
  for (let i = 0; i < 15; i++) {
    const trial = TRIALS[i];
    const state = IRB_STATES[i % IRB_STATES.length];
    const workflowId = `IRB-${String(i + 1).padStart(3, '0')}`;
    await client.query(
      `INSERT INTO irb_workflows (workflow_id, trial, protocol, site, irb_name, state, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [workflowId, trial, `PROT-${trial}`,
       `SITE-${String((i % 6) + 1).padStart(3, '0')}`, IRB_NAMES[i % 3], state,
       state === 'approved' || state === 'continuing_review' ? `2026-${String((i % 12) + 1).padStart(2, '0')}-15` : null]);
    if (state !== 'draft') {
      await client.query(
        `INSERT INTO irb_workflow_transitions (workflow_id, from_state, to_state, actor, reason)
         VALUES ($1,'draft','submitted','pi@trials.io','Initial submission (seed)')`,
        [workflowId]);
    }
    nIrb++;
  }
  console.log(`Seeded ${nIrb} IRB workflows`);
}

module.exports = seedConduct;
