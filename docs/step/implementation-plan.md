# STEP mode implementation plan

Status as of 2026-11-10: Phase 1 audit, authoring packages, validators, and API contract are implemented on `feat/step` in both integrated repositories. The full Phase 1 academic exit gate remains pending eleven Nouns content findings; no source answers were silently changed. Phases 2–8 have not started. No STEP production schema, content upload, accounts, runtime integration, or deployment has been performed.

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

- [ ] Add STEP-specific models for course, ordered sections/topics, immutable content versions, questions/options, private answer keys, passages, media assets, enrollments, attempts, saved answers, and idempotent mutation receipts. Exact table names can follow repository conventions.
- [ ] Enforce foreign keys, unique enrollment, unique student/topic attempt, unique question/attempt answer, and stable content version relationships. Bind every attempt to its owner, region, topic, and content snapshot.
- [ ] Add draft/published/retired publication state and content checksum/version metadata. Existing attempts must retain their original content and scoring snapshot when new versions are imported.
- [ ] Prepare reviewed additive SQL using the repository's production migration process. Verify the configured production server/database identity without printing credentials; take the appropriate pre-change backup/recovery checkpoint and record schema baseline counts.
- [ ] Apply only STEP schema additions to production. Do not use database reset, schema replacement, broad `db push`, or automatic table deletion against production.
- [ ] Verify tables, indexes, constraints, routing, and generated Prisma clients. Keep STEP disabled. Compare existing-mode schema/data baselines to confirm no unintended modification.

**Exit criteria:** Production has the dedicated STEP schema and no STEP course is visible yet. Migration execution and verification are recorded; a migration file alone does not complete this phase.

## Phase 3 — Build the isolated backend assessment API

- [ ] Implement feature-gated course discovery, ordered section/topic discovery, topic overview, start/resume, attempt retrieval, answer save, submit, and result APIs under `/api/v1/step`.
- [ ] Enforce active student role, enrollment, ownership, regional scope, published content, and feature flag on every operation, including media. Hiding a card is not authorization.
- [ ] Enforce one attempt per student/topic transactionally, including concurrent Start requests. Snapshot published content and private keys at start; never send keys or explanations to the client.
- [ ] Add revision-checked saves and stable request IDs for idempotent retries. Handle stale revisions and duplicate requests without losing saved answers or advancing twice.
- [ ] Submit only complete attempts, calculate marks on the server, and lock further writes. Repeated submission returns the stored result. Return no correctness information before or after submission beyond final total marks.
- [ ] Add production-private audio delivery using bounded streaming or authorized short-lived blob access. Support browser audio seeking/range behavior, correct content type, ownership checks, expiry/recovery, and limits. Do not load an entire large recording unnecessarily or expose storage credentials.
- [ ] Add meaningful unit/contract tests using mocks for access denial, content filtering, concurrency, save conflicts, incomplete submission, duplicate submission, and answer-key leakage.

**Exit criteria:** Backend compiles; focused tests pass; STEP contracts and failure states are implemented independently of NAFS. Actual production HTTP verification follows deployment in Phase 7.

## Phase 4 — Upload launch content and audio to production

- [ ] Build a repeatable importer with validation-only, upload/import, verification, and explicit publish operations. Pin the reviewed package checksum and production target before mutation.
- [ ] Upload Making Plans audio to private production Azure Blob Storage; verify blob length, checksum, content type, and playable audio. Record blob keys without credentials or reusable access tokens.
- [ ] Import the STEP course, three ordered sections, Nouns, Making Plans, Ants, questions/options, private keys, passage, and media references into STEP production tables in draft state.
- [ ] Use deterministic source IDs/checksums and transactions so rerunning the same package neither duplicates content nor changes existing attempts. Failed imports must leave no partially published course.
- [ ] Read the production records back and reconcile counts, question order, keys, passage text, and audio references against the manifest. Verify every referenced asset exists in production storage.
- [ ] Save an upload report listing actual database identity, package version/checksum, record counts, topic IDs, blob verification, and publication state. Do not mark this phase complete from a local extraction report.

**Exit criteria:** All three launch activities actually exist in production SQL with verified private production audio. They remain draft/unexposed until launch checks; there is no runtime dependency on the Downloads folder or local media.

## Phase 5 — Build STEP course navigation and question layouts

- [ ] Add STEP types/service and dedicated components/pages under `src/types/step.contract.ts`, `src/services/stepService.ts`, `src/components/step`, and `src/pages/student/step`, adjusted to existing project conventions.
- [ ] Add one STEP card to Courses for enrolled students. Fetch STEP independently so disabled, empty, or failed discovery does not blank other courses. Add loading, empty, retry, and denied states.
- [ ] Implement STEP course -> Grammar/Listening/Reading sections -> selected topic overview. Use backend order/count/state rather than hardcoded source manifests in the client.
- [ ] Build the one-question MCQ layout, A–D choices, numbered navigation, answer progress, Previous/Next, and final Submit using current LMS styling.
- [ ] Keep the Listening audio player mounted across question navigation; pause/release it when leaving the topic or changing accounts. Add clear loading, playback failure, retry, and accessible controls.
- [ ] Show the Reading passage beside the question on desktop and in an accessible panel on mobile. Preserve passage access while answering. Render text safely without importing authoring HTML or private explanations.
- [ ] Verify long grammar options, blanks, Arabic where authored for learners, mobile widths, touch targets, keyboard navigation, and focus states.

**Exit criteria:** All three layouts and course hierarchy render correctly in desktop/mobile views and consume the agreed learner-safe API shape. No keys or source packages are bundled into the frontend.

## Phase 6 — Connect autosave, resume, and final results

- [ ] Connect Start/Resume/View Result and all assessment actions to STEP APIs. Restore the same attempt, answered state, content version, and current-question position after refresh/navigation.
- [ ] Serialize/coalesce answer writes safely, show save state, retain unsaved drafts scoped to account/region/attempt, and use stable request IDs for retries.
- [ ] Handle offline failures, revision conflicts, rapid answer changes, refresh-token retries, and switching accounts. Abort stale requests, clear old account views, and never replay one student's writes as another student.
- [ ] Disable Submit while answers are incomplete or saves are pending. Drain saves before confirmation/submission; preserve answers on recoverable failures.
- [ ] Handle an uncertain submit response by checking the same attempt/result before replaying submission. Prevent edits while submission outcome is unresolved.
- [ ] Show final marks and completion only after server-confirmed submission. Update topic, section, and course progress from backend state. No answer reveal, retry button, or immediate feedback animations.

**Exit criteria:** A complete learner journey works for each section, including interrupted-session recovery and final-result recovery. Submission cannot lose a pending answer or create another attempt.

## Phase 7 — Verify builds, isolation, and production integration

- [ ] Run focused STEP backend/frontend tests, type checks, and production builds. Cover authorized/denied access, single-attempt enforcement, hidden keys, autosave conflicts, account switching, lost submit responses, and audio recovery.
- [ ] Review database write scope, importer diff, API registration, Courses integration, and shared-component changes. Confirm all persisted STEP writes target STEP records only.
- [ ] Smoke-check normal LMS, NAFS, Primary Grades 1–3, 3D Reading/Listening/Roleplay, Science Spark, and existing teacher/course access. Run their established relevant checks where available; document any untested path.
- [ ] Deploy compatible backend/frontend builds with STEP disabled first. Verify migrations and application health. Production staging configuration may share production SQL/storage; confirm actual targets rather than assuming staging is isolated.
- [ ] Create a small set of clearly labeled production STEP test students or explicitly enroll designated existing test students. Record usernames and STEP enrollments without changing unrelated student access. Do not invent a local pilot database or overwrite accounts.
- [ ] Publish the validated package and enable STEP for enrolled test students through production access records. Run production HTTP/browser checks for all three activities, mobile playback/seek, reload/resume, final marks, cross-account denial, and persisted attempt records.
- [ ] Use test-owned attempts only; never delete/reset real attempts for a repeated test. Keep enrollment scoped to test students until checks pass.

**Exit criteria:** Both deployed apps work against production SQL/storage; the three topics are published and usable by production STEP test accounts; existing modes pass the relevant regression checks. Record verified deployment revision, URLs, counts, and test outcomes.

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
| 1. Content and contract | Audit/contract implemented; academic exit pending | 68 questions; 56 verified source checksums; 10 audio decodes; approved Listening transcription; 15 offline content tests; both contract type checks, both project type checks and cross-repo contract parity pass. Publication guard correctly exits 2. Eleven Nouns findings prevent publication. Local commits only; identify final hashes with `git log -1` in each repository. |
| 2. Production schema | Not started | |
| 3. Backend APIs | Not started | |
| 4. Production content/audio upload | Not started | |
| 5. Frontend layouts | Not started | |
| 6. Assessment lifecycle | Not started | |
| 7. Verification and production integration | Not started | |
| 8. Client handover | Not started | |
