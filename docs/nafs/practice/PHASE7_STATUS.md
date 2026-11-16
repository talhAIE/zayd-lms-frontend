# Phase 7 - complete locally (2026-11-14)

The user explicitly included the format extension before acceptance. Both repositories remain on `feat/nafs_PM`. No client questions were imported; no production schema/data, publication, student grants, push or deployment were touched.

## Delivered

- Source-faithful 2-4 option questions, exact-set multi-answer grading, linked one-mark multipart children with private parent/part provenance, and written-response editing/checking/recovery.
- A separate NAFS binary checker on the existing Azure AI configuration. It initializes only for written checks. Private references/rubrics/passages/visual descriptions stay server-side. Inference runs outside transactions; ownership, grants, revision and immutable snapshot are checked again before commit. Unavailable inference records no check. Accepted replay retains its judgment without another AI call.
- Old single-choice snapshots/requests remain valid. Canonical response tokens use the legacy `optionId` field; see `RESPONSE_FORMATS.md`. No client scores or supplied keys are exposed.
- PostgreSQL and SQL Server extension migrations preserve existing data and append-only/check/completion guards. Only three SQL Server practice payload columns widen; phase2 migrations and legacy tables remain unchanged. Added migration hashes, local-only apply helper and offline release preflight.
- Existing shared feedback works for every format, with one animation per multi-answer check. Written/multi drafts, pending receipts and explicit conflict/recovery flows use the existing durable writer.
- Updated governing plan, content scope, deployment configuration, rollback procedure and release gates.

## Verification

| Check | Result |
| --- | --- |
| NAFS/Practice/flags backend suites, real JWT and owned loopback PostgreSQL | 124 passed across 12 suites, no skips |
| Neighboring STEP/Primary/3D/Science backend suites | 210 passed, 1 optional Primary database test skipped, 18 suites |
| Broad NAFS learner/transport/session/teacher/isolation browser run | 102 passed; one old timeout expectation failed, corrected and rechecked below |
| Corrected transport suite | All 4 passed; writes/checks now explicitly assert 30s/75s timeouts |
| Final format/player browser recheck after animation refinement | All 17 passed at mobile/desktop, including extended formats and legacy Quiz |
| Existing STEP/Primary layout/isolation/flow browser checks | All 27 passed |
| Shared Science auth/transport checks | All 10 passed, no network or database |
| Backend/frontend types and production builds | Passed; existing PDF.js eval/large-bundle warnings remain |
| Changed runtime/new tests lint | Passed; original HTTP spec has the same 138 errors/39 warnings as HEAD; new acceptance sections have zero diagnostics |
| Contract, protected-source, model/helper parity, migration/hash/private-field/write audit | Passed; 41 protected files unchanged, five earlier integrations reconstructed; only four practice progress models written |

The corrected transport rerun resolves the sole broad browser failure; no acceptance failure remains. Browser APIs and AI verdicts were synthetic. PostgreSQL tests used only the independently owned marker-verified `127.0.0.1:55447/nafs_practice_phase2` cluster, retaining labeled fixtures instead of resetting data. Its helper is stopped after verification.

The 250-question HTTP journey checks all questions, wrong-to-right retry, partial/final resume, repeated source numbering across 25 indicators, immutable classification, 251 retained response events, completion replay and a new run preserving the predecessor. Validation also covers 500 questions and rejects 501. Extended-format tests cover exact sets, duplicate/foreign/noncanonical options, independent DB rejection of malformed tokens, private-key exclusion, source parts, AI outage/no revision advance, repeated written attempts, and receipt replay with one inference.

## Boundaries and next step

Phase 8 prepares and reconciles supplied Quiz 1 content for Grades 3, 6 and 9, including the received Math 9 supplement and exact-duplicate audit. Preserve source questions/keys as instructed; do not infer missing accepted sets or written rubrics. Phase 9 implements/verifies import. Production draft/schema work begins in Phase 10, publication/grants/live acceptance in Phase 11, handover in Phase 12.

No local test certifies SQL Server runtime constraints or live AI grading quality. Execute both provider migrations/constraint tests on an isolated SQL Server target and validate configured AI behavior against source-bound approved samples before releasing corresponding content. These remain explicit preflight gates in `RELEASE_RUNBOOK.md`; `release-preflight.cjs` deliberately reports `releaseReady:false` until later content/release phases. Practice remains default-off.
