# STEP mode implementation plan

Status as of 2026-11-10: STEP application Phases 2–6 are implemented locally on feat/step and Phase 7 verification has passed. The project owner explicitly resolved the eleven Nouns findings by requiring the original supplied marked answers to remain authoritative, then authorized production publication. Reviewed step-v2 is now imported, approved/published and active in production SQL, with original content/keys/audio preserved and the sealed v1 draft/audit retained. The one production account step.test is actively enrolled; read-only service discovery sees all three not-started topics when STEP is enabled in the verification process. No test attempts were consumed. Hosted application deployment and the live LMS_ENABLE_STEP setting remain pending; earlier instructions kept both branches unpushed, and this publication operation has not pushed/deployed code. Phase 7 remains incomplete until live HTTP/UI/device acceptance passes. See backend docs/step/release-v2.md and release-v2-evidence.

## 1. Agreed outcome

Build STEP as a separate mode inside the current Zayd LMS. Follow the current LMS visual design and the NAFS MCQ assessment experience. Use the existing production Azure SQL database and production Azure Blob Storage for persisted STEP data and media. Do not create or depend on a local STEP database, local content server, or local-only student accounts.

The first release contains one course, three sections, and one topic/activity per section. Each activity contains its complete reviewed question set, not a single question.

| Course | Section | Initial topic | Activity content |
| --- | --- | --- | --- |
| STEP | Grammar | Nouns | Authored MCQs from the Nouns document |
| STEP | Listening | Making Plans | Supplied audio and its four MCQs |
| STEP | Reading | Ants | Authored reading passage and its MCQs |

The user accepted these initial topics. Keep the remaining topics inventoried for later expansion; do not publish them automatically. For Nouns, retain the authored subtopic and level groupings within the one topic and determine the full question count during Phase 1. Do not silently select a smaller subset or combine questions from other documents.

## 2. Source content

Source root: `C:\Users\talha\Downloads\STEP content`

- Grammar: `Grammar Topics` — 16 Word documents. Launch source: `1.1.1 Nouns.docx`.
- Listening: `Listening Topics` — 10 topic folders with Word questions and supplied MP3/M4A audio. Launch source: `Listening Topics\1\Making Plans.docx` and the supplied audio in the same folder.
- Reading: `Reading Topics` — 20 Word documents. Launch source: `Ants.docx`.

Observed source format:

- Grammar contains subtopics, level labels, A–D options, marked correct choices, English/Arabic explanations, and hints.
- Making Plans contains four A–D questions with marked correct options and separate audio.
- Ants contains the passage, A–D questions, marked correct options, and Arabic answer strategies/explanations.
- `1.4 Modals & Semi-Modals.docx` is zero bytes. Record it as unavailable for a later expansion. It does not block the three selected launch topics.

Extract authored content rather than generating replacement questions. Strip answer markers from learner-facing text. Keep keys, hints, answer strategies, and explanations private. Preserve punctuation, blanks, Arabic text, and source order in the private authoring package. Do not synthesize a replacement for the supplied listening audio.

## 3. Learner flow and UI contract

1. The eligible student signs in with the existing LMS authentication.
2. Courses shows one STEP card alongside any other courses the student is entitled to access.
3. Opening STEP shows Grammar, Listening, and Reading section cards.
4. Opening a section shows its one topic and Start, Resume, or View Result state.
5. The topic overview displays question count and instructions. An attempt starts only when Start is pressed.
6. The player presents one question at a time, four selectable options, question navigation, answered progress, Previous/Next, and save status.
7. Grammar shows the question and choices. Listening keeps the audio player available while navigating its questions. Reading keeps the passage available beside the question on desktop and in an accessible passage panel on mobile.
8. The student can change answers before submitting. Autosave and resume restore the same unfinished attempt.
9. Every question must be answered before final submission. Finish waits for pending saves and asks the student to confirm submission.
10. Submission locks the activity and displays earned marks, total marks, and completion status.

Assessment rules follow NAFS: one attempt per student per topic, no timer, all answers required, final total marks only. Each of the three topics has its own independent attempt. Award one mark per question for this release. No negative marking, per-question correctness, answer review, retake, or correct/wrong animations during the activity. Do not add recording, pronunciation assessment, AI chat, or mandatory listen-completion gating to STEP.

Use current LMS typography, spacing, cards, colors, buttons, sidebar, and responsive behavior. Do not introduce a different visual theme. Meet keyboard, focus, option-label, and audio-control accessibility requirements.

## 4. Isolation and production requirements

- Use a dedicated NestJS STEP module, `/api/v1/step` API namespace, frontend `/student/step` routes, STEP contracts, and STEP-prefixed data tables.
- Use additive schema changes. Do not repurpose or overwrite normal LMS, NAFS, Primary, 3D, Science Spark, or other mode tables, content, progress, grants, or attempts.
- Keep `LMS_ENABLE_STEP` disabled until deployment and launch checks pass. A disabled or failing STEP service must not prevent other course cards from loading.
- Reuse existing authentication and visual primitives. Reuse NAFS patterns selectively; do not change NAFS subject enums, answer contracts, attempt rules, or image-only media endpoint to accommodate STEP audio.
- Assign STEP through persistent STEP course enrollment/access records. Do not use a username list in `.env`, assume a grade automatically grants STEP, or enroll every existing student.
- Use the existing production SQL configuration and approved regional routing. Enable only regions explicitly provisioned for STEP; unprovisioned regions must deny STEP without affecting their other modes.
- Use private production Azure storage under a dedicated STEP container, proposed `step-private-content`, and versioned `step/<package-version>/...` blob keys. Do not overwrite other mode assets or change their container access policies.
- Credentials remain in existing environment/secret management. No secrets in this plan, commits, content packages, logs, or upload reports.
- Local extraction, builds, mocks, and unit tests are allowed. Persisted integration data, launch content, and STEP test accounts belong in production. Do not run destructive database test suites against production.
- Preparing scripts is not uploading content. Uploading content is not publishing it. Publishing data is not deploying the application. Record evidence for each separately.

## Phase 1 — Audit launch content and freeze the contract

- [x] Verify the current frontend/backend checkout, branch, HEAD, and applicable repository instructions. Both integrated checkouts use `feat/step`, based on backend `a3cfcca` and frontend `c8f63f2`, with initially clean working trees. No additional AGENTS.md instructions were found. Preserve unrelated changes and do not create release branches or worktrees without a task requirement.
- [x] Inventory all supplied documents/audio and record file size, checksum, relative source path, and parsing status. All 56 files inventoried: 45 readable DOCX, one empty unused DOCX, and ten successfully decoded recordings. The three launch sources were audited fully.
- [x] Extract each launch question, options, source-marked correct option, source location, grouping, passage reference, and audio reference into versioned private manifests. All 68 questions retained: Nouns 60, Making Plans 4, Ants 4. Nouns numbering resets are covered by subtopic-qualified unique IDs.
- [x] Verify four distinct option IDs and one source-marked key per question, no missing/duplicate questions, four intact passage paragraphs, valid audio, and no keys embedded in display text. Making Plans was decoded and its full unprompted Azure Speech transcript reviewed against all four questions with the user's explicit transcription approval. Verification used transcription evidence, not a claimed human listening sign-off.
- [x] Produce a launch content report with exact counts, order, total marks, 95.060-second supplied MP3, source-to-question mappings, and ambiguities. Eleven unresolved Nouns findings are flagged rather than guessed or silently corrected.
- [x] Define identical backend/frontend learner-safe DTOs, error codes, state transitions, persistent enrollment behavior, routes, short-lived private audio access, and final-result policy. Document reusable UI/session patterns without editing NAFS behavior.

**Exit criteria:** The three launch manifests are reviewed and valid; counts and keys are reconciled with source files; the backend/frontend contract and production targets are documented. A problem in an unused source is tracked separately.

**Phase 1 outcome:** Engineering/audit deliverables are implemented and validated. The full academic exit criterion is **not yet met**: eleven Nouns questions may permit multiple answers or contain multiple errors. Preserve all source content until an explicit reviewed content decision resolves them. `validate-content.cjs --for-publication` deliberately fails while blockers remain. Backend evidence: `docs/step/content-audit.md`, `docs/step/README.md`, and `prisma/data/step/v1`. Frontend evidence: `docs/step/README.md`, `src/types/step.contract.ts`, and `dev/step/contract-check.cjs`. No production mutation occurred.

## Phase 2 — Add STEP storage and production schema

- [x] Add STEP-specific models for course, ordered sections/topics, immutable content versions, questions/options, private answer keys, passages, media assets, enrollments, attempts, saved answers, and idempotent mutation receipts. Fourteen tables include a dedicated schema-migration receipt. Both regional Prisma models validate.
- [x] Enforce foreign keys, unique enrollment, unique student/topic attempt, unique question/attempt answer, and stable content version relationships. Composite constraints bind every attempt to its owner/course/region/version and every answer/key to the correct question/option/version.
- [x] Add draft/published/retired publication state and source/package/content hashes. SQL checks and guard triggers protect published content, immutable snapshots, submitted results, and mutation receipts. Approval/open-issue checks prevent unreviewed publication.
- [x] Prepare reviewed additive SQL using the existing explicit migration process. Verify production server `tutor-lms-prod-sql` / database `zayd_lms_prod`; record retained full/differential/recent log backups, a UTC recovery checkpoint, all 78 existing table counts, and a pre-change schema-catalog digest. No credentials are saved in evidence.
- [x] Apply only STEP schema additions to production in one transaction with a deployment lock and checksum-pinned receipt. No reset, broad `db push`, table deletion, existing-table ALTER, content/account import, or blob operation occurred.
- [x] Verify fourteen tables, 112 columns, 38 primary/unique and four lookup indexes, twenty foreign keys, twelve checks, and nine triggers in production. Both clients regenerate; type/build and regression checks pass. STEP storage rejects unprovisioned regions before provider fallback; Saudi is not provisioned. Existing-mode schema digest and deployment-window counts are unchanged. STEP remains disabled and content/enrollment/attempt tables are empty.

**Exit criteria:** Production has the dedicated STEP schema and no STEP course is visible yet. Migration execution and verification are recorded; a migration file alone does not complete this phase.

**Phase 2 outcome:** Complete. Applied migration `step-phase2-001` at 14:22 UTC on 2026-11-10 and independently verified the existing receipt/catalog with `newlyApplied: false`. Backend evidence is in `docs/step/phase2-storage.md` and `docs/step/phase2-evidence`; frontend handoff is `docs/step/phase2-status.md`. All 25 offline STEP tests, 85 backend suites (692 tests passed, one skipped), both project type checks, contract parity, and backend build pass. Production evidence is schema-only; no runtime deployment or live learner flow is claimed. Eleven Phase 1 Nouns findings still block publication.

## Phase 3 — Build the isolated backend assessment API

- [x] Implement the independent `StepModule`, feature-gated course/ordered section/topic discovery, overview, start/resume, attempt retrieval, save, submit and result routes under `/api/v1/step`. Existing global JWT/role guards are reused; no existing mode routes or service behavior are changed.
- [x] Enforce live active student identity, persistent active enrollment, ownership, ROW regional scope, published/reviewed zero-issue content for starts, and the STEP flag on every operation, including audio access. Existing owned attempts retain their frozen version after retirement; revoked/inactive access is denied.
- [x] Enforce one attempt per student/topic with unique constraints, Serializable transactions and bounded conflict retries. Snapshot validated content and private correct-option IDs with a digest; whitelist assessment responses so answer keys, source/review data and storage configuration are absent. Audio access intentionally returns only a temporary signed URL and expiry.
- [x] Implement revision compare-and-swap saves, atomic answer/receipt writes, stable request IDs/payload hashes, exact replay, stale-revision denial and cross-operation request-ID conflict handling. Concurrent saves retain one winner and receipt failures roll back all mutation state.
- [x] Require all valid, distinct answers, matching revision, and equality with persisted selections before submission. Calculate marks on the server; lock final state, return immutable final results on retry, and refuse later answer writes. No per-question correctness, explanations, answer review, or retake is exposed.
- [x] Implement authorized private Azure audio access: verify account/container/blob namespace, size/type/SHA metadata and private access; bound metadata requests to ten seconds; mint a read-only single-blob HTTPS SAS for four minutes. Native Azure range requests support seeking without backend audio buffering. Actual production playback/expiry/browser checks remain Phase 7, since content is not uploaded in this phase.
- [x] Add synthetic transactional service/content/repository tests, real Nest JWT/role/validation HTTP tests, and mocked-storage tests with real local SAS signing. All 61 focused STEP tests pass, including timeout and key-leakage checks.

**Exit criteria:** Backend compiles; focused tests pass; STEP contracts and failure states are implemented independently of NAFS. Actual production HTTP verification follows deployment in Phase 7.

**Phase 3 outcome:** Complete locally. Backend type check/build pass; the full backend regression suite passes 90 suites (749 tests passed, one skipped). The existing 25 offline content/schema/target tests, frontend type check and contract parity also pass. Backend evidence is `docs/step/phase3-api.md` and `docs/step/phase3-evidence/checks.json`; frontend handoff is `docs/step/phase3-status.md`. Production SQL/schema/blob/settings/data are unchanged in this phase, and no application deployment occurred. Phase 4 is next; eleven Nouns findings continue to block publication.

## Phase 4 — Upload launch content and audio to production

- [x] Build separate offline validate, explicit production import, read-only verify, and guarded publish modes. Pin sealed package digest `d0547580aa5d8aa0da1568a502d2464154642ad4ce50c1d92807fb3df8f299d9`, production SQL/storage identity, disabled flag, and Phase 2 schema receipt before mutation. Current publish is blocked before production access by the eleven unresolved findings.
- [x] Upload the original Making Plans MP3 to private production account `zaydlmsprodstore2026`, container `step-private-content`, versioned `step/step-v1/` key. Full read-back verifies 3,802,671 bytes, source SHA-256, MIME and exact signed HTTP 206 byte-range response; anonymous HEAD returns 401. No keys/SAS tokens are recorded and no account-wide CORS/public policy is changed. Browser playback remains Phase 7 acceptance.
- [x] Import the actual STEP course, three ordered sections/topics/versions, 68 questions, 272 options, 68 private keys, four-paragraph Ants passage and one audio reference into production `zayd_lms_prod`. All versions are draft/academic-pending; course/topics stay inactive, and no enrollment/account/attempt is created.
- [x] Use RFC UUIDv5 stable identities, source/package/content digests, insert-only comparison, a deployment lock and one SQL transaction. Production repeat import created zero new records and reused rather than overwrote the blob. Tests prove rollback/refusal for partial inserts and mismatched content. Published versions/attempts are not reset.
- [x] Independently read production SQL/blob content back and reconcile every imported field, count, ordering, source grouping, key/review JSON, passage paragraph and media reference with the sealed plan. The runtime snapshot parser also accepts the exact mapped source content in an offline compatibility test.
- [x] Record actual production upload, independent verification, zero-new-record repeat import, validation preview and check summaries in `docs/step/phase4-evidence`. The existing 78-table normal-mode schema fingerprint is unchanged; writes target only STEP content and its private blob.

**Exit criteria:** All three launch activities actually exist in production SQL with verified private production audio. They remain draft/unexposed until launch checks; there is no runtime dependency on the Downloads folder or local media.

**Phase 4 outcome:** Complete. Actual production draft import completed at 15:21 UTC on 2026-11-10, with verified private audio, independent read-back and idempotent replay. All 47 offline STEP tests, 62 focused STEP tests and 91 backend suites pass (750 tests passed, one skipped). Both type checks, backend build and contract parity pass. Backend details are `docs/step/phase4-import.md`; frontend handoff is `docs/step/phase4-status.md`. No application deployment, course activation, publication, accounts or enrollments occurred. Eleven Nouns findings still block publication; Phase 5 frontend layouts are next.

## Phase 5 — Build STEP course navigation and question layouts

- [x] Add STEP types/service and dedicated components/pages under `src/types/step.contract.ts`, `src/services/stepService.ts`, `src/components/step`, and `src/pages/student/step`, adjusted to existing project conventions.
- [x] Add one STEP card to Courses for enrolled students. Fetch STEP independently so disabled, empty, or failed discovery does not blank other courses. Add loading, empty, retry, and denied states.
- [x] Implement STEP course -> Grammar/Listening/Reading sections -> selected topic overview. Use backend order/count/state rather than hardcoded source manifests in the client.
- [x] Build the one-question MCQ layout, A–D choices, numbered navigation, answer progress, Previous/Next, and final Submit using current LMS styling.
- [x] Keep the Listening audio player mounted across question navigation; pause/release it when leaving the topic or changing accounts. Add clear loading, playback failure, retry, and accessible controls.
- [x] Show the Reading passage beside the question on desktop and in an accessible panel on mobile. Preserve passage access while answering. Render text safely without importing authoring HTML or private explanations.
- [x] Verify long grammar options, blanks, Arabic where authored for learners, mobile widths, touch targets, keyboard navigation, and focus states.

**Exit criteria:** All three layouts and course hierarchy render correctly in desktop/mobile views and consume the agreed learner-safe API shape. No keys or source packages are bundled into the frontend.


**Phase 5 outcome:** Complete locally. Independent STEP course hierarchy, controlled MCQ layouts, persistent Listening audio, responsive Reading passage and owner-bound transport are implemented and browser-verified. Routed existing attempts are read-only and new Start remains disabled until Phase 6 binds durable actions. Types/build, contract parity, bundle isolation and focused STEP plus existing NAFS/Science checks pass; evidence is in frontend `docs/step/phase5-layouts.md` and `phase5-evidence/checks.json`, with backend handoff `docs/step/phase5-status.md`. No push, deployment, production writes, publication or enrollments. Eleven academic findings still block publication.

## Phase 6 — Connect autosave, resume, and final results

- [x] Connect Start/Resume/View Result and all assessment actions to STEP APIs. Restore the same attempt, answered state, content version, and current-question position after refresh/navigation.
- [x] Serialize/coalesce answer writes safely, show save state, retain unsaved drafts scoped to account/region/attempt, and use stable request IDs for retries.
- [x] Handle offline failures, revision conflicts, rapid answer changes, refresh-token retries, and switching accounts. Abort stale requests, clear old account views, and never replay one student's writes as another student.
- [x] Disable Submit while answers are incomplete or saves are pending. Drain saves before confirmation/submission; preserve answers on recoverable failures.
- [x] Handle an uncertain submit response by checking the same attempt/result before replaying submission. Prevent edits while submission outcome is unresolved.
- [x] Show final marks and completion only after server-confirmed submission. Update topic, section, and course progress from backend state. No answer reveal, retry button, or immediate feedback animations.

**Exit criteria:** A complete learner journey works for each section, including interrupted-session recovery and final-result recovery. Submission cannot lose a pending answer or create another attempt.


**Phase 6 outcome:** Complete locally. Start/resume, serialized/coalesced answer saves, tab-scoped owner/region/attempt/version journals, exact request replay, explicit conflict review, saved-question position, final confirmation and uncertain-submit recovery are wired to STEP APIs. Results/progress are server-confirmed, with no answer reveal or retake. All three full synthetic browser journeys and focused session/transport checks pass, together with type/build, parity/isolation and NAFS/Science regressions. Frontend evidence: `docs/step/phase6-session.md` and `phase6-evidence/checks.json`; backend handoff: `docs/step/phase6-status.md`. No push, deployment, production writes or enrollment; publication remains blocked by eleven academic findings. Phase 7 is next.

## Phase 7 — Verify builds, isolation, and production integration

- [x] Run focused STEP backend/frontend tests, type checks, and production builds. Cover authorized/denied access, single-attempt enforcement, hidden keys, autosave conflicts, account switching, lost submit responses, and audio recovery.
- [x] Review database write scope, importer diff, API registration, Courses integration, and shared-component changes. Confirm all persisted STEP writes target STEP records only.
- [x] Smoke-check normal LMS, NAFS, Primary Grades 1–3, 3D Reading/Listening/Roleplay, Science Spark, and existing teacher/course access. Run their established relevant checks where available; document any untested path. Local synthetic/runtime checks are completed; production UI/device checks remain pending deployment.
- [ ] Deploy compatible backend/frontend builds with STEP disabled first. Verify migrations and application health. Production staging configuration may share production SQL/storage; confirm actual targets rather than assuming staging is isolated.
- [x] Create a small set of clearly labeled production STEP test students or explicitly enroll designated existing test students. Record usernames and STEP enrollments without changing unrelated student access. Do not invent a local pilot database or overwrite accounts. One production account, step.test, is created and actively enrolled; no other mode grants or attempts were added.
- [ ] Publish the validated package and enable STEP for enrolled test students through production access records. Run production HTTP/browser checks for all three activities, mobile playback/seek, reload/resume, final marks, cross-account denial, and persisted attempt records. Data publication/activation is complete for reviewed step-v2; the live flag/deployment/browser portion of this item remains pending.
- [ ] Use test-owned attempts only; never delete/reset real attempts for a repeated test. Keep enrollment scoped to test students until checks pass.

**Exit criteria:** Both deployed apps work against production SQL/storage; the three topics are published and usable by production STEP test accounts; existing modes pass the relevant regression checks. Record verified deployment revision, URLs, counts, and test outcomes.


**Phase 7 outcome:** Partially complete; not release-complete. Builds/regressions, scope isolation and production schema/content/private-audio read-back pass. The project owner source-key decision resolves the academic gate for reviewed step-v2, which is now approved/published and active in production with all 68 original questions and source keys preserved. The step.test account is actively enrolled and all topics remain not_started; no tester attempts were consumed. Hosting deployment/live feature activation and production HTTP/UI/device acceptance remain pending. Both feat/step branches are still local-only under the earlier no-push instruction; GitHub deployment access was discovered through the existing Git credential, but no code was pushed or deployed. Detailed evidence: backend docs/step/release-v2.md / release-v2-evidence and frontend docs/step/release-v2.md. Do not mark the phase complete until live acceptance actually passes.

## Phase 8 — Client handover and controlled rollout

- [ ] Verify client test students have STEP enrollment and can see the single course and three sections. Enrollment must support future students through records/provisioning without editing `.env` usernames.
- [ ] Provide course/topic names, test usernames, production application URL, and the final question/mark counts. Distinguish actual deployed/published state from local commits or pushed branches.
- [ ] Monitor STEP-specific errors, failed audio requests, save/submit failures, and existing-mode health during initial use. Keep logs free of secrets and private answer keys.
- [ ] Document rollback: disable `LMS_ENABLE_STEP` or revoke STEP access; retain production content, completed results, and media. Roll back compatible application code without dropping tables or touching other modes.
- [ ] Update every phase checkbox with evidence, record remaining issues, and make the required implementation commits in the appropriate repositories. Push/deploy according to the user's active instruction; do not equate a commit with a deployment.

**Exit criteria:** The client can test all three STEP activities on production, no local setup is required, and the handover accurately identifies what is deployed and verified.

## Completion rules and scope boundaries

Follow phases in order. Phase completion requires its exit criteria, not just file creation. Update this plan as implementation progresses with changed files, commands/check results, content counts, commit IDs, and production verification evidence. Never mark an unexecuted production operation as done.

The initial scope is the student STEP course and its three activities. Additional topics, immediate learning feedback, retakes, timers, speaking/AI features, and STEP-specific teacher dashboards are future work unless explicitly requested. Existing teacher results and access must continue to work unchanged.

### Implementation evidence log

| Phase | Status | Evidence / commit / production verification |
| --- | --- | --- |
| 1. Content and contract | Complete; owner source-key decision recorded | 68 questions; 56 source hashes; ten audio decodes; approved transcription; fifteen content tests; both type checks and contract parity pass. Publication guard exits 2 for eleven Nouns findings. Local commits: backend `ae79f13`, frontend `12d3734`. |
| 2. Production schema | Complete | Production migration `step-phase2-001`: 14 tables; existing 78-table catalog unchanged; recovery/backup evidence and independent verification recorded. 25 offline tests and 85 backend suites pass (692 passed, one skipped). Local commits: backend `9ec3fd1`, frontend `95167a3`. |
| 3. Backend APIs | Complete locally; not deployed | Independent STEP APIs; 61 focused and 25 offline tests; 90 backend suites passed (749 passed, one skipped). Local commits: backend `b802d5c`, frontend `7cdf3e6`. |
| 4. Production content/audio upload | Complete; draft only | Actual SQL content: 1 course, 3 sections/topics/versions, 68 questions, 272 options, 68 keys, 1 passage/audio. Private production MP3 checksum/range/access verified; repeat import creates 0 records. 47 offline tests, 62 focused STEP tests and 91 backend suites pass (750 passed, one skipped); types/build/parity pass. STEP disabled; no publication/accounts/enrollments. Local commits only, no push. |
| 5. Frontend layouts | Complete locally; not deployed | Independent course hierarchy; controlled Grammar/Listening/Reading layouts; account-safe transport; audio/passage lifecycle; desktop/mobile QA. Frontend phase5-layouts.md and phase5-evidence/checks.json; backend phase5-status.md. Local commits only, no push. |
| 6. Assessment lifecycle | Complete locally; not deployed | Start/resume; serial autosaves; owner/region/version-scoped recovery journals; conflict review; safe final submission and recovery; server totals/progress. Frontend phase6-session.md / phase6-evidence/checks.json; backend phase6-status.md. Local commits only; no push. |
| 7. Verification and production integration | Verified; v2 data published; app deployment pending | Both builds, local cross-mode regressions, STEP write-scope audit and actual production SQL/private audio read-back pass. Owner accepted source keys for reviewed v2; production publication/activation and one step.test enrollment are complete. No application push/deployment or live learner acceptance performed. See phase7-verification.md / phase7-evidence in both repos. |
| 8. Client handover | Not started | |
