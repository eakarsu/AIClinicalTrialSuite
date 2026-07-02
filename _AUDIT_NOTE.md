# Audit Note — AIClinicalTrialSuite

## Merge pass: AIPharmaTrialDesigner + AIClinicalTrialMatching

- Created a separate merged application folder: `AIClinicalTrialSuite`.
- Used `AIPharmaTrialDesigner` as the base runtime because it already contains the broader trial design, conduct, compliance, IRT, SDTM, eConsent, audit, and production-readiness surface.
- Ported the high-value `AIClinicalTrialMatching` capabilities into the suite without carrying over Sequelize:
  - Patient-trial matching
  - Patient clinical profile enrichment
  - Eligibility review generation
  - Retention risk watchlist
  - Biomarker table
  - Drug interaction table
  - Patient outcomes table
- Added native suite migration and seed:
  - `backend/migrations/006_recruitment_matching.sql`
  - `backend/seed/seedRecruitment.js`
- Added backend route namespace:
  - `GET /api/recruitment/summary`
  - `GET /api/recruitment/matches`
  - `POST /api/recruitment/matches/score-patient`
  - `GET /api/recruitment/matches/patient/:id/ranked`
  - `PUT /api/recruitment/matches/:id/status`
  - `DELETE /api/recruitment/matches/:id`
  - `GET /api/recruitment/eligibility-reviews`
  - `POST /api/recruitment/eligibility-reviews/run`
  - `GET /api/recruitment/biomarkers`
  - `GET /api/recruitment/drug-interactions`
  - `GET /api/recruitment/outcomes`
  - `GET /api/recruitment/retention-risk`
- Added frontend route: `/recruitment-matching`.
- Updated suite defaults:
  - Backend port: `3051`
  - Frontend port: `3050`
  - Database: `clinical_trial_suite`

## Sample-fill pass for AI/custom AI features

- Added missing sample-fill coverage for custom AI/comparison pages that do not use the shared `AIPage` scaffold:
  - Comparable-Trial Finder: `comparable-trials`
  - Protocol Version-Graph: `protocol-version-graph`
  - Recruitment & Matching: `recruitment-matching`
- Each scenario fills every user-editable input on its page, including optional fields such as `limit`, `phase`, selected `trial`, selected `patient_id`, and selected `trial_id`.
- Wired frontend `SampleButtons` into:
  - `frontend/src/pages/ComparableTrialsPage.js`
  - `frontend/src/pages/ProtocolVersionGraphPage.js`
  - `frontend/src/pages/RecruitmentMatchingPage.js`
- Verified authenticated `/api/ai/samples` coverage across 37 AI/sample-backed features:
  - no missing sample registries
  - Comparable-Trial Finder returns 4 scenarios
  - Protocol Version-Graph returns 4 scenarios
  - Recruitment & Matching returns 4 scenarios
- Verified `CI=true npm run build` passes.

## Popup action pass

- Updated shared `DetailModal` so every centered detail popup now renders:
  - `Edit`
  - `Delete`
  - `Close`
- Changed popup action behavior after product feedback:
  - `Edit` is enabled in every popup.
  - If the caller supplies `onEdit`, it runs the real edit flow.
  - If no `onEdit` exists, the popup opens a local popup-only editor so displayed fields can still be changed.
  - `Delete` is enabled in every popup.
  - If the caller supplies `onDelete`, it runs the real delete flow.
  - If no `onDelete` exists, it removes/closes the popup view.
- Wired real Edit behavior where the detail popup already maps to mutable local data:
  - Design Rules detail popup loads the rule into the existing editor form.
  - Operations Desk detail popup loads the task into the task editor and updates the row.
- Verified `CI=true npm run build` passes.

## CRUD AI assist pass

- Added AI assistance to the shared `CrudTable` component so every CRUD feature using it now gets AI without per-page duplication:
  - `AI Review List` in the CRUD page header
  - `AI Review` in each row detail popup
  - `AI Fill` in create/edit modals
- Applies to master data and operations CRUD surfaces, including:
  - Trials, Sites, Protocols, Investigators, Patients, Compounds, Endpoints, Adverse Events
  - Amendments, Deviations, Monitoring Visits, Queries, Data Locks, Milestones, Budgets, CRO Vendors, Regulatory Submissions, Supply Shipments
  - Delegation Log and Training Records
- Updated `/api/feature-ai/analyze` with a CRUD-specific OpenRouter response contract:
  - `mode: "crud_ai_assist"`
  - `suggested_fields`
  - findings, risks, recommendations, confidence
- `AI Fill` applies OpenRouter `suggested_fields` when available and falls back to deterministic local draft values if the AI call fails, so every CRUD form still has usable assist behavior.
- Verified:
  - `node --check backend/routes/featureAi.js`
  - `CI=true npm run build`
  - Live authenticated `/api/feature-ai/analyze` smoke test for `crud-trials` returned `mode: crud_ai_assist` and `suggested_fields`.

Audit-only pass. Domain: pharmaceutical clinical-trial designer (protocol drafting, I/E criteria, endpoint selection, statistical-power planning, site selection, regulatory submission prep).

Stack: Node + Express + React + Postgres + OpenRouter. Backend: `backend/server.js` mounts 25 route modules under `/api/*` behind JWT (`middleware/auth.js`, `requireWrite` RBAC). AI routes mounted at `/api/ai` (open to any authenticated user). DB schema: `backend/migrations/001_schema.sql` — 24 tables including `trials`, `sites`, `protocols`, `investigators`, `patients`, `compounds`, `endpoints`, `adverse_events`, `amendments`, `deviations`, `monitoring_visits`, `queries`, `data_locks`, `milestones`, `budgets`, `vendors_cro`, `regulatory_submissions`, `supply_shipments`, `ai_results`, `users`, `notifications`, `attachments`, `webhooks`, `webhook_deliveries`. Frontend: 40 pages in `frontend/src/pages/` (17 `AI*Page` + CRUD + Login + CustomViews + Timeline). Persistence pattern: every AI POST writes to `ai_results(feature,input,output,model)`.

## Inventory

### Backend CRUD route modules (24)
trials, sites, protocols, investigators, patients, compounds, endpoints, adverseEvents, amendments, deviations, monitoringVisits, queries, dataLocks, milestones, budgets, vendorsCro, regulatorySubmissions, supplyShipments, notifications, attachments, webhooks, bulkImport, customViews, auth.

### AI endpoints (`backend/routes/ai.js`, 16 POST features + samples/results/history)
1. `POST /api/ai/draft-protocol`
2. `POST /api/ai/recommend-endpoints`
3. `POST /api/ai/size-cohort`
4. `POST /api/ai/select-sites`
5. `POST /api/ai/model-risk`
6. `POST /api/ai/generate-brief`
7. `POST /api/ai/deviation-classifier`
8. `POST /api/ai/dsmb-alert`
9. `POST /api/ai/edc-anomaly`
10. `POST /api/ai/statistical-imbalance`
11. `POST /api/ai/expected-vs-actual`
12. `POST /api/ai/irb-pkg-drafter`
13. `POST /api/ai/query-resolver`
14. `POST /api/ai/milestone-forecaster`
15. `POST /api/ai/budget-burn`
16. `POST /api/ai/regulatory-impact`
17. `GET  /api/ai/samples`, `/results`, `/history`

## Gap Analysis (categorized)

### AI capabilities

| Capability | Status | Notes |
|---|---|---|
| Protocol drafter | PRESENT | `draft-protocol` (TOO-RISKY — expert review required) |
| Endpoint recommender | PRESENT | `recommend-endpoints` (TOO-RISKY) |
| Power / sample-size explainer | PARTIAL | `size-cohort` covers sizing; dedicated power-calc *explainer* (assumptions narrative, alpha/beta/MDE walk-through) — MISSING — MECHANICAL |
| Site-feasibility scorer | PARTIAL | `select-sites` exists; explicit *feasibility scoring* (enrollment-rate × startup-time × prior-quality) — MISSING — MECHANICAL |
| Regulatory submission section drafter | PARTIAL | `irb-pkg-drafter`, `regulatory-impact` cover slices; full IND/NDA module drafter (Module 2/5, Investigator's Brochure sections) — MISSING — MECHANICAL, TOO-RISKY |
| I/E criteria optimizer | MISSING | MECHANICAL, TOO-RISKY — optimize against eligibility funnel + comparable-trial criteria |

### Non-AI features

| Feature | Status | Notes |
|---|---|---|
| Protocol CRUD | PRESENT | `routes/protocols.js` |
| Version control on protocols | MISSING | `amendments` table tracks amendments but no diff/version-graph endpoint — MECHANICAL |
| IRB workflow (submission → response → approval → continuing review) | PARTIAL | `regulatory_submissions` table is generic; no IRB-state-machine — MECHANICAL |
| ClinicalTrials.gov integration (NCT push/pull, PRS-style validation) | MISSING | NEEDS-CREDS (CT.gov PRS account / API) |
| EudraCT / CTIS / FDA ESG integration | MISSING | NEEDS-CREDS |
| EHR / EDC connectors (Medidata Rave, Veeva CDMS) | MISSING | NEEDS-CREDS, NEEDS-PRODUCT-DECISION |
| eConsent / 21 CFR Part 11 audit trails | MISSING | NEEDS-PRODUCT-DECISION (compliance scope) |

### Custom (domain-specific) features

| Feature | Status | Notes |
|---|---|---|
| Comparable-trial finder | MISSING | MECHANICAL (CT.gov search-by-indication+phase+endpoints); upgradeable to AI similarity-ranker |
| Dropout-rate predictor | MISSING | MECHANICAL AI endpoint; TOO-RISKY for go/no-go decisions |
| Adaptive-design simulator (Bayesian, group-sequential, sample-size re-estimation) | MISSING | TOO-RISKY — requires biostatistician validation; MECHANICAL stub possible |
| Patient burden estimator (visits × procedures × travel × time) | MISSING | MECHANICAL — pure structured calc + optional AI narrative |
| Diversity / DEI enrollment planner | MISSING | MECHANICAL AI endpoint (FDA Diversity Action Plan guidance) |
| Real-world-evidence (RWE) / external-control-arm matcher | MISSING | NEEDS-CREDS (claims/EHR data), TOO-RISKY |

## Risk Tags
- **TOO-RISKY (require expert/biostatistician/medical-monitor review)**: protocol drafter, endpoint recommender, I/E optimizer, IND/NDA module drafter, dropout predictor, adaptive-design simulator, RWE matcher, DSMB alerts.
- **NEEDS-CREDS**: CT.gov PRS, EudraCT, CTIS, FDA ESG, Medidata/Veeva, RWE data partners.
- **NEEDS-PRODUCT-DECISION**: 21 CFR Part 11 scope, eConsent, EHR connector roadmap.

## Implemented (this round)
None — audit-only.

## Backlog (prioritized)
1. **MECHANICAL** Power-calc explainer endpoint (`/api/ai/power-calc-explain`).
2. **MECHANICAL** Site-feasibility scorer endpoint (`/api/ai/site-feasibility-score`).
3. **MECHANICAL** I/E criteria optimizer endpoint (TOO-RISKY tag in output).
4. **MECHANICAL** Patient-burden estimator (deterministic + AI narrative).
5. **MECHANICAL** Comparable-trial finder (DB-side first, CT.gov later).
6. **MECHANICAL** Protocol version-graph/diff endpoint on `protocols`+`amendments`.
7. **MECHANICAL** Dropout-rate predictor (TOO-RISKY tag).
8. **NEEDS-CREDS** ClinicalTrials.gov / EudraCT / CTIS / FDA ESG integrations.
9. **NEEDS-PRODUCT-DECISION** IRB state-machine, eConsent, 21 CFR Part 11 audit, EDC/EHR connectors.
10. **TOO-RISKY** Adaptive-design simulator, RWE external-control-arm — defer until biostatistician sign-off path defined.

## Status
audit-only — no code changes.

## Apply pass 7 (full backlog implementation)

Pass 7 implements the full backlog from this audit. All new code lives in `backend/routes/pass7.js`, `backend/migrations/002_pass7.sql`, `frontend/src/pages/*` (11 new pages), and additions to `frontend/src/services/api.js`, `frontend/src/App.js`, `frontend/src/components/Sidebar.js`, and `backend/server.js` (mount block only, before the dashboard handler — no 404 handler existed). Zero new dependencies; uses existing `services/ai.js` `callOpenRouter` + `safeJsonParse`.

### MECHANICAL (deterministic + optional AI narrative)
- `POST /api/ai/power-calc-explain` — closed-form normal-approx n_per_arm = 2*((zα+zβ)*SD/MDE)², inflated for dropout. Returns inputs, derived z values, n, formula, assumption walkthrough, caveats, and an AI plain-language narrative.
- `POST /api/ai/patient-burden` — sums procedure + (2 × travel) minutes per visit, totals, hours, 8h-day equivalents, intensity tag (Low / Moderate / High / Very High), plus AI patient-facing summary + burden-reduction suggestions.
- `POST /api/comparable-trials/find` — DB-side search over `trials` table, token-overlap similarity score over `indication` + exact `phase` match. CT.gov / EudraCT / CTIS search is deferred to NEEDS-CREDS stubs.
- `GET  /api/protocols-graph/by-trial/:trialId` — read-only version-graph from `protocols` + `amendments` (nodes + edges, "supersedes" / "amended_by"). Mounted at `/protocols-graph` (not `/protocols/*`) because the existing protocols router is behind `writeGate`.
- `GET  /api/protocols-graph/diff?from=...&to=...` — metadata diff between two protocol versions plus intervening amendments.

### NEEDS-PRODUCT-DECISION (IRB state-machine)
- New tables: `irb_workflows`, `irb_workflow_transitions` (migration `002_pass7.sql`).
- `GET /api/irb-workflows`, `GET /api/irb-workflows/:id`, `POST /api/irb-workflows`, `POST /api/irb-workflows/:id/transition`.
- State machine: `draft → submitted → response_pending → approved | rejected → continuing_review`. Illegal transitions return 400 with the allowed set. Every transition is logged to `irb_workflow_transitions` for audit.

### TOO-RISKY (ADVISORY ONLY)
Every response wrapped with `disclaimer`, `requires_expert_review: true`, `not_for_regulatory_submission: true`. Routes:
- `POST /api/ai/ie-optimizer` — eligibility criteria optimiser
- `POST /api/ai/ind-nda-section` — IND/NDA module outline drafter
- `POST /api/ai/dropout-predictor` — dropout-rate prediction
- `POST /api/ai/adaptive-sim` — qualitative adaptive-design description (NOT operating-characteristic simulation)
- `POST /api/ai/rwe-match` — external-control-arm / RWE matching strategy
- Existing `draft-protocol`, `recommend-endpoints`, `dsmb-alert` are flagged in the original audit; pass 7 documents the advisory contract for new TOO-RISKY routes only (does not modify the legacy routes — no breaking change).

### NEEDS-CREDS (503 stubs)
All return `503` with `{ integration, status: 'not_configured', required_credentials: [...], product_decision? }`:
- `GET  /api/integrations/ctgov/search`
- `POST /api/integrations/ctgov/push`
- `GET  /api/integrations/ctgov/validate-prs`
- `GET  /api/integrations/eudract/search`, `POST /api/integrations/eudract/submit`
- `GET  /api/integrations/ctis/search`, `POST /api/integrations/ctis/submit`
- `POST /api/integrations/fda-esg/submit`, `GET /api/integrations/fda-esg/ack/:trackingId`
- `GET  /api/integrations/edc/rave/studies`, `GET /api/integrations/edc/veeva/studies`
- `GET  /api/integrations/ehr/fhir/patients`
- `GET  /api/integrations/part11/audit-trail`

### Frontend pages (11 new, all mounted in App.js + Sidebar "Backlog (Pass 7)" section)
`/ai/power-calc-explain`, `/ai/patient-burden`, `/ai/ie-optimizer`, `/ai/ind-nda-section`, `/ai/dropout-predictor`, `/ai/adaptive-sim`, `/ai/rwe-match`, `/comparable-trials`, `/protocol-version-graph`, `/irb-workflows`, `/integrations`.

### Persistence
All AI POSTs persist to `ai_results(feature, input, output, model)` so they appear in the existing `/api/ai/history` UI alongside the legacy 16 verbs.

### Mount order
Pass 7 routers mounted in `server.js` immediately after `/api/ai`, BEFORE the cross-cutting (`notifications`, `attachments`, `webhooks`, `bulk-import`) and `customViews` mounts. No 404 handler exists in `server.js`; the catch-all is React Router's `*` route on the client.

### Skips / constraints honored
- No new npm dependencies.
- No breaking changes — legacy routes untouched.
- `node --check backend/server.js` + `node --check backend/routes/pass7.js` both pass.
- No edits to feature-specific frontend pages outside of additions; `Sidebar.js` and `App.js` only have additive routes/links.

### Status
pass-7-applied — full backlog implemented (MECHANICAL + IRB state-machine + ADVISORY-ONLY TOO-RISKY + NEEDS-CREDS 503 stubs).

## Apply pass 8 (trial conduct)

Pass 8 implements the remaining pure-code backlog items identified after pass 7. All new backend code lives in `backend/routes/pass8.js` + `backend/migrations/003_pass8.sql`; frontend adds 9 pages, api.js functions, App.js routes, and a "Trial Conduct (Pass 8)" sidebar section. Zero new dependencies.

### MECHANICAL (deterministic)
- **Randomization / IWRS** (`/api/randomization`) — permuted-block, optionally stratified. Arm derived deterministically from (scheme seed, stratum, block_no) via seeded mulberry32 shuffle, so the full schedule is reproducible/auditable without stored lists. Tables: `randomization_schemes`, `randomization_assignments` (unique per scheme+subject). Validates block_size vs allocation-ratio sum, stratum membership, duplicate subjects; assignment runs in a transaction with `FOR UPDATE` on the scheme row.
- **SDTM export** (`/api/sdtm/:domain`) — SDTM-SHAPED (not CDISC-validated) DM/AE/DV domains from live patients/adverse_events/deviations, JSON or CSV, optional trial filter.
- **Enrollment forecast** (`/api/enrollment-forecast/run`) — monthly accrual from `patients.enrolled_at`, rate = mean of last 3 accrual months, linear projection to target + AI narrative (advisory).
- **Form FDA 1572 draft** (`/api/form-1572/generate`) — deterministic 8-section assembly from investigators + sites + trials + active delegation-log rows. Explicitly labeled DRAFT.
- **Delegation log** (`/api/delegation-log`) and **Training records** (`/api/training-records`) — standard CRUD (writeGate), tables seeded with 5 demo rows each.

### TOO-RISKY (ADVISORY ONLY — withAdvisory wrapper as in pass 7)
- `POST /api/ai/meddra-code` — proposes SOC/PT-style coding; response carries `not_licensed_meddra: true` (no licensed MedDRA dictionary shipped; certified coder must verify).
- `POST /api/ai/safety-narrative` — CIOMS-style narrative from an adverse_events row or ad-hoc fields.
- `POST /api/dsmb/packet` — cross-table enrollment/safety/conduct/milestone aggregation + AI executive summary.

### Persistence
All AI POSTs persist to `ai_results(feature, input, output, model)`: `meddra-code`, `safety-narrative`, `dsmb-packet`, `enrollment-forecast`.

### Seed
`seed/seed.js` now applies ALL `migrations/*.sql` after the reset (fixes pass-7 tables being wiped); `003_pass8.sql` uses IF NOT EXISTS + ON CONFLICT DO NOTHING so it is re-runnable.

### Verified
- Stratified assignment: 6 subjects → alternating arms in permuted blocks; duplicate + invalid-stratum rejected.
- SDTM DM/AE/DV JSON + CSV; unknown domain 404s.
- 1572 draft resolves investigator, facility, protocol, and active sub-investigator delegations.
- DSMB packet + forecast + both advisory verbs return advisory-wrapped output and persist to ai_results.
- `CI=true react-scripts build` passes.

### Status
pass-8-applied.

## Apply pass 9 (integrations + real statistics + compliance mechanics)

Pass 9 upgrades the three "not-code-fillable" categories as far as code alone can go. Backend: `backend/routes/pass9.js` + `backend/migrations/004_pass9.sql`. Frontend: 4 pages + "Compliance & Design (Pass 9)" sidebar section. One existing dependency reused (`bcryptjs`); zero new dependencies.

### NEEDS-CREDS → partially LIVE
- `GET /api/ctgov/search`, `GET /api/ctgov/study/:nctId` — LIVE ClinicalTrials.gov v2 integration. The v2 READ API is public (no credentials); search by condition/term/status with phase filter. Upstream failures surface as 502. Registry PUSH / PRS validation still requires a sponsor account and remains a 503 stub in pass 7.

### TOO-RISKY → mathematically real, still ADVISORY
- `POST /api/design-sim/power` — exact power/sample size via Acklam inverse-normal CDF (continuous + binary endpoints, dropout inflation). Verified against textbook value (delta=5, sd=10, 90% power → n=85/arm).
- `POST /api/design-sim/simulate` — Monte Carlo group-sequential simulator: patient-level simulation, O'Brien-Fleming-shaped boundaries z_k = z(1-a/2)*sqrt(K/k), seeded PRNG (reproducible), up to 20k sims. Verified: empirical type I 0.0535 at nominal 0.05 under the null; empirical power 0.9045 vs analytic 0.9031 under delta=0.5, n=85, K=3; reports E[N] and per-look stop probabilities.

### NEEDS-PRODUCT-DECISION → Part 11-STYLE mechanics (explicitly not certified)
- **Audit chain**: `auditMiddleware` (mounted app-wide right after auth) appends one sha256 hash-chained row per authenticated write to `audit_events` (append-only; chain serialised with row lock; fire-and-forget so it never blocks responses). `GET /api/audit-trail`, `GET /api/audit-trail/verify` recomputes the chain and reports the first broken row. Verified: tampering with a row flips verify to `valid:false` with `first_broken_id`.
- **eConsent**: `consent_forms` (versioned, same form_id auto-increments version) + `consent_records` with two-component e-signature — the signed-in user's password is re-verified via bcrypt at signing; `signature_hash` binds signer|subject|form|version|meaning|timestamp; duplicate (form, version, subject) rejected 409. Verified: wrong password → 403; correct → 201; duplicate → 409; all writes appear in the audit chain.

### Status
pass-9-applied. Remaining truly-external items: CT.gov PRS push, EudraCT/CTIS/FDA ESG, Medidata/Veeva/EHR connectors (all need sponsor credentials), and formal validation/certification of statistics + Part 11 (needs qualified experts, not code).

## Apply pass 8/9 polish (samples + seeds)

- **Sample buttons**: `backend/routes/samplesExtra.js` registers 2-3 fill-all-fields scenarios per feature (including optional fields) for all pass 8/9 features AND the pass-7 AIPage features that previously had none (power-calc-explain, ie-optimizer, ind-nda-section, dropout-predictor, adaptive-sim, rwe-match). `routes/ai.js` samples handler merges the extra registry (2-line additive change). AIPage-based pages get the buttons automatically; the 6 custom pages (Randomization, SDTM Export, Form 1572, Design Statistics, CT.gov Search, eConsent) now embed the shared `SampleButtons` component.
- **Seeds (>=15 rows per new table)**: `backend/seed/seedConduct.js`, called from seed.js — randomization_schemes 15, randomization_assignments 30 (derived with the REAL permuted-block algorithm exported from routes/pass8), delegation_log_entries 15, training_records 15, consent_forms 15 (5 families x 3 versions), consent_records 15 (API-identical signature hashes), audit_events 15 (correctly sha256 hash-chained — verify stays green), irb_workflows 15 + transitions (pass-7 table that previously seeded empty).
- Verified: all counts >=15; `/api/audit-trail/verify` valid:true over seeded chain; samples endpoint returns scenarios for 14 features; production build passes.

## Apply pass 8/9 polish 2 (row-click detail popups)

New `frontend/src/components/DetailModal.js` — centered popup reusing the app's existing modal/detail CSS (`modal-overlay`/`modal-content`/`detail-grid`), pretty-prints keys, JSON-renders object values. Wired row/card click handlers matching the CrudTable behavior:
- RandomizationPage — scheme rows + assignment rows (Open button stops propagation)
- SdtmExportPage — SDTM record rows show all domain variables
- AuditTrailPage — event rows show full payload incl. prev_hash/hash
- EConsentPage — form-version rows (full consent text) + consent-record rows (full signature hash)
- CtgovSearchPage — study rows show all fields + link to full CT.gov record (external link stops propagation)
- Form1572Page — sub-investigator entries open delegation detail
- IrbWorkflowsPage (pass 7) — whole row now clickable, not just the Open button
DelegationLog/TrainingRecords already had this via CrudTable. Production build passes.

## Apply pass 8/9 polish 3 (modal delete action + remaining popup coverage)

- `DetailModal` now always renders a footer Delete button plus Close. Delete is enabled only when the caller passes a real `onDelete`; otherwise it is disabled with a read-only tooltip, avoiding fake destructive actions for registry/statistical/audit/graph details.
- Enabled real deletes for mutable popup-backed data:
  - `DesignRulesEditor` rows delete through the existing `customViewsDeleteRule` API.
  - `CodexOperationsFeature` rows delete from the local workflow list.
- Added centered detail popups to remaining new-feature rows/cards/charts:
  - Comparable-trial finder rows
  - Protocol version-graph nodes and edges
  - Integrations status rows
  - Site activation risk summary cards, risk rows, readiness signal rows
  - Trial timeline phase bars and per-trial bars
  - Endpoint coverage heatmap trial rows and cells
  - Timeline view chart points and stage cards
  - Insight-map trend points and signal cards
  - IRB workflow rows and transition-history rows
- Verified `CI=true react-scripts build` passes.

## Apply pass 8/9 polish 4 (complete AI sample-fill buttons)

- Root cause: the shared `AIPage`/`SampleButtons` infrastructure existed, but several custom AI pages did not render `SampleButtons`, and some pass-7 sample payloads used stale field names that did not match the real forms.
- Added sample-fill button rows to all custom pass-7 AI pages:
  - `power-calc-explain`
  - `patient-burden`
  - `ie-optimizer`
  - `ind-nda-section`
  - `dropout-predictor`
  - `adaptive-sim`
  - `rwe-match`
- Corrected pass-7 sample payload keys so every button fills all visible form fields, including booleans, numeric fields, and optional/structured fields.
- Added `patient-burden` sample scenarios with complete `visits` arrays, including procedure names/minutes and travel minutes.
- Updated legacy trial-select AI pages so samples can fill the dropdown-backed trial field as well:
  - `model-risk` samples now include `trial_id`.
  - `generate-brief` samples now include `trial_id` plus `audience`.
- Tightened pass-9 samples:
  - `design-power` scenarios now fill continuous and binary fields (`delta`, `sd`, `p1`, `p2`) regardless of selected endpoint type.
  - `econsent-sign` scenarios fill the demo password field (`trial2026`) in addition to form, subject, and meaning.
- Verified:
  - `CI=true react-scripts build` passes.
  - Live `/api/ai/samples` checks return 3-5 scenarios for affected features with all expected keys.

## Apply pass 8/9 polish 5 (OpenRouter compare buttons + IRT)

- Added generic authenticated OpenRouter review endpoint:
  - `POST /api/feature-ai/analyze`
  - Accepts `{ feature, intent, input, mechanical_result }`
  - Persists to `ai_results` under `${feature}-openrouter-review`
  - Returns advisory JSON for comparing the deterministic/memory-backed output with OpenRouter analysis.
- Added second `OpenRouter AI` buttons to new feature surfaces that previously only showed deterministic/memory-backed behavior:
  - Randomization / IWRS / IRT
  - SDTM Export
  - Form 1572
  - Comparable Trials
  - Protocol Version Graph
  - Delegation Log
  - Training Records
  - Design Simulator
  - CT.gov Search
  - Audit Trail
  - eConsent
  - Integrations Status
  - IRB Workflows
  - All `AIPage`-based pages via the shared scaffold, including DSMB packet and enrollment forecast.
- Added missing IRT mechanics to Randomization/IWRS:
  - Tables: `irt_kits`, `irt_dispenses`
  - Endpoints: `GET /api/randomization/irt/kits`, `GET /api/randomization/irt/dispenses`, `POST /api/randomization/irt/dispense`
  - UI: IRT kit inventory table, IRT dispense history table, and `Dispense IRT Kit` action on randomized subjects.
  - Seed: 45 IRT kits and 15 IRT dispenses.
- Verified:
  - `node --check backend/routes/featureAi.js backend/routes/pass8.js backend/server.js backend/seed/seedConduct.js`
  - `CI=true react-scripts build`
  - Seed applies all migrations and creates IRT data.
  - Authenticated smoke test returns 45 IRT kits and 15 IRT dispenses.

## Apply pass 8/9 polish 6 (Randomization category schema generation)

- Added `category_schema` to `randomization_schemes`:
  - JSONB column with default `[]`
  - Seeded category schemas for all seeded randomization schemes
  - `POST /api/randomization/schemes` persists the category schema
- Updated Randomization / IWRS / IRT new-scheme form:
  - Added editable `Category Schema` JSON textarea
  - Sample buttons now fill `category_schema`
  - `Create Scheme` validates and persists it
  - Adjacent `OpenRouter AI` button now generates/reviews a top-level `category_schema` and fills the textarea when the model returns one
- Updated `/api/feature-ai/analyze` with a category-schema-specific OpenRouter prompt for `randomization-irt-category-schema`.
- Verified:
  - Backend syntax checks pass
  - Frontend production build passes
  - Seed applies cleanly
  - Authenticated `/api/randomization/schemes` returns category schemas (`category_schema` array present).

## Apply pass 10 (production-readiness gap closures)

- Added a consolidated Production Readiness feature for remaining app-completeness gaps:
  - Advanced IRT kit lifecycle controls: quarantine, release, return, destroy
  - IRT lifecycle event log
  - IRT resupply forecast by trial/site/arm
  - Emergency unblinding workflow with revealed arm and audit-style event capture
  - SDTM-shaped validation checks for DM, AE, and DV
  - Compliance evidence package summary with SHA-256 package hash
  - Validation evidence tracker seeded with IRT, SDTM, audit, eConsent, and RBAC evidence records
  - Sponsor/PI/monitor permissions matrix
- Added backend migration and routes:
  - `005_pass10.sql`
  - `GET /api/production-readiness/permissions-matrix`
  - `GET /api/production-readiness/validation-evidence`
  - `GET /api/production-readiness/irt/events`
  - `GET /api/production-readiness/irt/resupply-forecast`
  - `POST /api/production-readiness/irt/kit/:kitId/lifecycle`
  - `POST /api/production-readiness/irt/emergency-unblind`
  - `GET /api/production-readiness/sdtm-validate/:domain`
  - `GET /api/production-readiness/compliance-export`
- Added frontend page and navigation:
  - `/production-readiness`
  - Sidebar section: `Gap Closure (Pass 10)`
  - OpenRouter AI review button for the complete production-readiness package
  - Centered detail modal on resupply forecast rows, validation evidence rows, lifecycle results, and unblind results
- Verified:
  - `node --check backend/routes/pass10.js`
  - `node --check backend/server.js`
  - `node seed/seed.js` applies `005_pass10.sql`
  - `CI=true npm run build`
  - Authenticated smoke test returns:
    - 45 IRT kits
    - 9 permissions rows
    - 5 validation evidence rows
    - 45 forecast rows
    - DM SDTM validation status `pass`
    - Compliance package hash
    - Successful IRT quarantine lifecycle event
    - Successful emergency unblind response
