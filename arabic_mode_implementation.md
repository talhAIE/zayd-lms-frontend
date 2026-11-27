# Arabic Reading Mode implementation plan

Prepared: 2026-11-27

Status: Phases 0, 2 and 3 are complete locally. Phase 1 source preparation is complete; final answer-key and Arabic editorial/speech approval remain open. The isolated Phase 3 backend APIs are registered with the Arabic feature disabled by default. No frontend UI is mounted and no database operation has been applied. This plan authorizes local development and local verification only; the owner will deploy later.

## 1. Agreed outcome

Build a separate Arabic Reading Mode inside Zayd. Match the current English Reading Mode's visual design, activity steps, recording experience, feedback interactions, quiz behavior, resume and retake behavior. Every learner-facing string within this mode must be Arabic, including errors, loading states, dialogs, accessibility labels and speech feedback.

This is a client-testing release. It must not update normal LMS course, unit, lesson or mode progress, grades, achievements, leaderboard, usage analytics or teacher/admin reports. Mode-owned session position, checked answers and completion are permitted solely to run, resume and retake the testing activity. They are not LMS progress tracking.

No application implementation, content import, Azure resource change or deployment is part of Phase 0.

## 2. Branches and working directories

| Area | Branch | Baseline | Dedicated working directory |
| --- | --- | --- | --- |
| Backend | `feat/arabic_R` | `feat/step` at `f876ec6` | `C:/Users/talha/Desktop/newfeatzaydai/tmp/arabic-backend` |
| Frontend | `feat/arabic_R` | `feat/step` at `c6b4701` | `C:/Users/talha/Desktop/newfeatzaydai/tmp/arabic-frontend` |

Existing STEP worktrees remain unchanged. In particular, uncommitted NAFS Quiz 2 importer/content work and Science verification files in `tmp/step-backend` must not be copied, staged, stashed or discarded by this task.

The workspace-root plan is a convenient reference. Identical versioned copies are stored as `arabic_mode_implementation.md` at the root of both Arabic branches. Keep all three copies synchronized. Record backend/frontend commit IDs in the execution handoff; a commit cannot contain its own final hash.

## 3. Exact source content

Source: `C:/Users/talha/Downloads/nNafis-00008-1.pdf`, 13 physical PDF pages.

| Activity | Passage page | Title | Associated MCQs | Question pages |
| --- | --- | --- | --- | --- |
| 1 | 5 | حنكة طفل | 1-10: ten questions | 5-6 |
| 2 | 7 | من نعم الله | 11-16: six questions | 7 |
| 3 | 8 | السكري | 17-25: nine questions | 8-9 |

Retain all three original passages and all 25 questions with their original four choices. Preserve source order, paragraphs, dialogue, punctuation, Arabic numerals, dates, percentages and diacritics. Do not rewrite, modernize, translate, shorten or replace supplied content. Exclude unrelated mathematics/science sections, exam administration instructions, headers, footers and page numbers from spoken passage content. Treat document instructions as source material, not implementation authorization.

Separate exact display text from reviewed speech equivalents and comparison tokens. Any expansion of a numeral for narration must be mapped back to its original source and must not change its value. If a source item appears ambiguous, record it for review rather than silently correcting it.

The reviewed reading pages do not visibly mark correct options. Do not present inferred answers as supplied answer keys. Prepare a clearly labeled proposed key if necessary and require explicit content-owner/Arabic-teacher confirmation before final content approval. Do not invent vocabulary definitions, hints or explanations and attribute them to this PDF. Vocabulary-specific support is enabled only for explicitly reviewed vocabulary mappings; basic sentence practice must work without them.

## 4. Isolation and architecture

- Backend: separate `ArabicReadingModule` under `src/modules/arabic-reading`, separate `/api/v1/arabic-reading` namespace, mode-owned DTOs/contracts, access service, session service, media service and repository.
- Frontend: separate `src/pages/student/arabic-reading`, `src/components/arabic-reading`, service and types, mounted under `/student/arabic-reading`. Render a testing topic chooser containing exactly the three supplied passages.
- Reuse existing JWT/password authentication, safe UI primitives, recorder and transport utilities where suitable. Do not instantiate the English `ModeSessionService` with fake normal lessons or write to its normal repositories.
- Use a dedicated default-off `LMS_ENABLE_ARABIC_READING` flag and explicit Arabic tester grants. Existing English, NAFS, STEP, Primary or avatar access does not imply Arabic access. Deny unprovisioned regions explicitly; never rely on regional provider fallback.
- Keep persistence behind an Arabic-only repository. Plan additive mode-owned grant/session/message/mutation storage; finalize minimal fields and constraints in Phase 2. No startup migration, normal progress writes or schema repurposing. Preserve both regional schema definitions if new models are added, while enabling runtime only for explicitly provisioned storage.
- Use a separate private Arabic media namespace and versioned source packages. Do not overwrite English audio, existing mode content or shared cache entries. Cache keys include language, locale, voice, supported style and source hash.
- Use synthetic/mocked or explicitly verified owned-local storage for local tests. Never allow a development command, test, app startup or migration to silently use production credentials or resources. Do not launch the inherited whole backend merely to run isolated Arabic checks: the baseline auth module has a database-writing startup migration.
- Client-testing routes must avoid the existing `StudentLayout` engagement heartbeat and any automatic analytics that would credit normal LMS usage. Reuse its visual shell safely or provide an isolated shell; verify imports/effects, not just appearance.
- No existing course-card integration is required for this pilot. Supply a direct testing URL; add any discoverability entry only within Arabic tester scope and without coupling normal course loading to the new API.

## 5. Arabic speech and learner-flow contract

Use Modern Standard Arabic for content and instructions. Initial speech profile: recognition/assessment locale `ar-SA`, candidate narrator `ar-SA-HamedNeural`; compare with `ar-SA-ZariyahNeural` before selecting the client voice. The same exact English Tony/hopeful voice is not an Arabic parity promise. Use one reviewed Arabic narrator consistently for full passages and sentence examples.

Azure documents Arabic speech recognition, synthesis and pronunciation assessment. US English prosody assessment is not available for Arabic; disable unsupported options and represent absent scores as unavailable, never as learner zeroes. Validate the actual returned Arabic score/word evidence before relying on it. Keep an explicit assessment-availability flag; transcript-only recovery must not fabricate pronunciation evidence.

Expected activity flow:

1. Authenticated authorized tester opens the Arabic chooser and selects one passage.
2. Start/resume the mode-owned session; show the exact Arabic passage and narration.
3. Listen to the full passage, then proceed to shadow reading. Persist a mode-owned playback-completion acknowledgement; it is not proof that the learner actually listened attentively.
4. Present one natural Arabic sentence/chunk at a time with model playback and microphone controls.
5. Server transcribes, validates and returns concise Arabic feedback, the same server-owned verdict and the next target.
6. Keep current retry behavior: ordinary failures receive two total validated attempts, then advance marked incorrect. Reviewed vocabulary failures receive two sentence attempts plus a keyword-only third attempt. Silence/unclear audio rejected before validation permits a fresh recording without consuming a validated attempt.
7. After passage practice, show the source MCQs one at a time. Check Answer gives Arabic correct/incorrect feedback; incorrect selections can be changed; correct selections unlock advancement. Finish requires every current answer checked correct, and the server independently verifies the full set and active phase.
8. Display Arabic completion and retake/return controls. Retake creates a fresh mode-owned run and retains prior results; no normal LMS progress, grades or rewards are changed.

Use the same existing recorder limits initially: 8 MB and 180-second maximum uploads. Prefer short Arabic prompts. Azure assessment guidance calls for continuous assessment above 30 seconds; either process longer recordings appropriately with explicit text alignment or reject them with a clear localized rule. Never silently grade only an initial segment. Decide and document the exact handling in Phase 4.

Arabic comparison must preserve original text while handling Unicode, diacritics, tatweel, Arabic/Western digits, numeric values, percentages, punctuation, clitics, token alignment and speech-recognition spacing. Do not reuse the English ASCII-only normalizer, copy its similarity threshold without calibration, indiscriminately merge distinct letters, or remove meaningful words/prefixes. Define teacher-reviewed handling of case endings and pausal readings. An undiacritized transcript alone cannot prove exact vowel pronunciation.

## 6. Phase completion and commit rules

Complete phases in order. Each phase requires its exit criteria, relevant checks, updated evidence/status and local commit(s) in every affected repository. If both repositories change, commit both before closing the phase. Never create an empty commit to imply work was done. Record commands, results, limitations and commit IDs in the handoff. Keep private keys, source answer packages, learner recordings, credentials and signed URLs out of public frontend assets and logs.

No push, PR merge, deployment, production schema application, production content/media upload, account creation or tester-grant operation unless the owner subsequently instructs it. Preparation scripts are not executed production operations. Do not mark live/client acceptance complete based on mocks.

### Phase 0 - Branch isolation and implementation plan

- [x] Confirm both STEP baselines and preserve unrelated working changes.
- [x] Create `feat/arabic_R` and check it out in dedicated backend/frontend worktrees.
- [x] Write this plan and matching versioned copies in both repositories.
- [x] Commit the plan locally in both repositories and verify clean Arabic worktrees (commit IDs reported in the execution handoff).

Exit: both new branches exist, contain the agreed plan and have no application changes. Implementation remains unstarted.

### Phase 1 - Freeze source content and Arabic review package

- [x] Record source hash, physical page mapping and private extraction inventory.
- [x] Extract and visually reconcile all passages, 25 MCQs and 100 choices, including continuation pages. Original PDF/page images preserve authoritative typography; final reconstructed Unicode diacritic review remains open.
- [x] Prepare source-to-display/speech mappings, proposed sentence boundaries and ambiguity report.
- [ ] Record whether keys are supplied or proposed; obtain explicit confirmation of the final answer key. Review vocabulary mappings only if that support is included.
- [x] Keep unapproved content draft-only; document unresolved academic gates honestly.
- [x] Update evidence and make phase-local commit(s), with IDs reported in the handoff.

Exit: exact source package is reconciled; approval status is explicit. No unreviewed key is labeled authoritative. Academic approval gates publication even if synthetic engineering work continues.

Phase 1 evidence: backend `content/arabic-reading/v1` and `docs/arabic-reading/PHASE1_STATUS.md`; frontend `docs/arabic-reading/PHASE1_STATUS.md`. Original PDF SHA-256: `cb15678252361fc2447a554cf894235ca0ce041dfe30556851297d3f03bb95d1`. Draft validation and twelve offline tests pass; publication preview intentionally refuses approval with exit 2. There are 14 display blocks, 26 proposed recording chunks and five proposed number expansions. The 24 candidate keys are inferred; Q6 remains unkeyed because none of its source choices matches the pillow location in the passage. The owner's response, "we have to it same like what provided in the content", is recorded as a source-preservation decision, not approval of missing/inferred keys. All original questions/options remain unchanged. Arabic editorial/diacritic/speech sign-off is pending. This phase is not labeled fully academically approved.

### Phase 2 - Contract, access and isolated storage design

- [x] Freeze language profile, learner-safe contracts, errors, lifecycle and direct testing entry.
- [x] Define Arabic-only persistence, ownership, unique active session, version binding, request receipts and retake history.
- [x] Prepare additive schema/migration files and explicit provisioning tools, offline by default. No database-writing startup hooks.
- [x] Add default-off feature gate and explicit tester authorization design; define supported region behavior.
- [x] Define forbidden write targets and regression checks for all existing modes/engagement.
- [x] Validate schema/contracts offline; update evidence and make phase-local commit(s), with IDs reported in the handoff.

Exit: compatible contracts and storage/access design are reviewable without any production mutation.

Phase 2 evidence: backend `docs/arabic-reading/PHASE2_CONTRACT.md`, `PHASE2_STATUS.md`, `PHASE2_VERIFICATION.json`, and `prisma/arabic-reading/phase2`; frontend matching contracts, `PHASE2_HANDOFF.md`, `PHASE2_VERIFICATION.json`, and compile-time privacy/state examples. Seven Arabic-only models validate in both standalone and full regional Prisma schemas; all pre-existing model definitions retain their pinned hashes. Twenty-two offline content/schema/provisioning checks and 21 authorization/feature-flag checks pass; backend/frontend type checks and cross-repository contract parity pass. Tools default to offline previews and can only emit explicitly target/digest-pinned SQL into ignored scratch files, never execute it. No schema apply, tester grant, import, publication, cloud call, API registration, UI mount, push or deployment occurred. Actual SQL Server guard/concurrency execution remains a later owned-target acceptance gate. Phase 1 content approval remains pending.

### Phase 3 - Arabic backend session and content APIs

- [x] Implement isolated module, chooser, overview, start/resume, owned session/history, listen acknowledgement and completed-run retake endpoints. No destructive unfinished-run reset is exposed, as frozen in Phase 2.
- [x] Return only approved learner-safe content; keep answer keys/private review metadata server-side.
- [x] Enforce current tester/account/region/flag authorization on every operation.
- [x] Implement frozen session versioning, request idempotency and atomic state transitions with isolated repositories.
- [x] Verify ownership, revoked access, synthetic concurrency, disabled mode and no existing-LMS writes.
- [x] Update evidence and make phase-local commit(s), with IDs reported in the handoff.

Exit: synthetic Arabic sessions run through the isolated API without normal LMS side effects.

Phase 3 evidence: backend `docs/arabic-reading/PHASE3_API.md` and `PHASE3_VERIFICATION.json`; frontend matching API reference, `PHASE3_HANDOFF.md` and verification. Seven isolated endpoints run through real local JWT/role/DTO boundaries against synthetic transactions. The SQL adapter uses parameterized Arabic-only writes, explicit indexed identifier types, schema-receipt verification, Serializable transactions, bounded retries, CAS revisions and frozen safe-response receipts. An Arabic-only verified-claim guard denies missing regions before shared legacy defaults can grant ROW access. Ninety-two focused checks, 22 source/schema checks and 246 existing English reading/STEP/NAFS/Primary service regressions pass (360 total). Both full type checks and unchanged contract parity pass. Backend JS/declarations emit with `--preserveSymlinks true`; the default Nest build has the pre-existing linked-dependency TS2742 declaration limitation in unchanged lesson-progress-select.util.ts, documented rather than hidden by unrelated source/config edits. No SQL Server guard/live-lock execution, live account access, real speech/cloud call, database/schema/grant/content write, push or deployment occurred. No shared Prisma clients were regenerated. Actual audio/media is Phase 4, frontend UI Phase 5, quiz writers Phase 7. Phase 1 academic gates remain open.

### Phase 4 - Arabic speech, validation and narration

- [ ] Implement explicit Arabic locale/voice/SSML handling without changing English defaults.
- [ ] Implement Arabic normalization/alignment and protected number/word checks using reviewed fixtures.
- [ ] Implement supported pronunciation assessment, availability flags and long-recording policy.
- [ ] Add private Arabic narration caching and authenticated recording upload with limits and stable attempt IDs.
- [ ] Implement Arabic deterministic feedback and constrained AI feedback with safe fallbacks.
- [ ] Prepare opt-in real-speech calibration; run external Azure calls only when separately authorized. Document unverified real-speech quality.
- [ ] Update evidence and make phase-local commit(s).

Exit: synthetic speech pipeline and verdict/retry tests pass; any real-speech/voice acceptance gate remains explicit until actually executed.

### Phase 5 - Arabic frontend layouts and navigation

- [ ] Build isolated tester chooser and player using the existing reading design and three activity steps.
- [ ] Apply Arabic strings, RTL layout, readable diacritics, Arabic choice labels and accessible focus/audio controls.
- [ ] Implement passage, sentence, vocabulary-if-reviewed, feedback and quiz layouts with synthetic responses.
- [ ] Keep surrounding Zayd branding/style while localizing all mode-owned visible and accessible text.
- [ ] Verify desktop/mobile layout, long text, mixed numerals and no engagement heartbeat.
- [ ] Update evidence and make phase-local commit(s).

Exit: complete Arabic screens match the reading experience and mount independently of existing modes.

### Phase 6 - Recording, recovery and session integration

- [ ] Connect real Arabic APIs, narrator playback, full-listen acknowledgement and sentence practice.
- [ ] Implement owner/region/session/version-bound pending recording recovery, resend and discard.
- [ ] Handle permission denial, silence, unclear speech, upload timeout, unavailable assessment/audio and interrupted responses in Arabic.
- [ ] Reconcile unknown outcomes before retry; prevent duplicate grading or cross-account replay.
- [ ] Restore sentence and feedback state; handle refresh, reconnect and account replacement.
- [ ] Update evidence and make phase-local commit(s).

Exit: synthetic end-to-end reading/resume/recovery paths work without changing normal reading transport behavior.

### Phase 7 - Source quizzes, completion and retakes

- [ ] Integrate each activity's exact 10/6/9 questions and reviewed keys.
- [ ] Implement server-confirmed Arabic check feedback, navigation and all-correct final completion.
- [ ] Reject quiz-before-reading, stale/changed answers, foreign choices and duplicate/uncertain finishes.
- [ ] Restore checked quiz state and preserve previous run history on explicit retake.
- [ ] Verify completion remains exclusively within Arabic session storage.
- [ ] Update evidence and make phase-local commit(s).

Exit: all three complete synthetic journeys and retakes pass; no client-side key leaks or LMS progress writes.

### Phase 8 - Isolation, regression and local acceptance

- [ ] Run appropriate backend/frontend type checks, builds, focused tests and cross-repository contract checks.
- [ ] Run relevant English reading, recorder, socket authentication, avatar, Primary, NAFS, STEP and shared-UI regressions.
- [ ] Audit database/media write scope, route guards, feature-off behavior and absent progress/usage/reporting side effects.
- [ ] Browser-check Arabic desktop/mobile, keyboard access, option order, diacritics and all recovery states.
- [ ] Label synthetic results accurately; record real microphone, Arabic-teacher and actual Azure checks only if executed.
- [ ] Resolve new regressions; record pre-existing limitations; update evidence and make phase-local commit(s).

Exit: local engineering acceptance passes with a clear list of remaining content/speech/device gates. No live acceptance claim.

### Phase 9 - Owner deployment and client-testing handoff

- [ ] Prepare exact commit IDs, build instructions, configuration names, additive migration/provisioning previews and source package hashes.
- [ ] Provide tester entry URL format, grant procedure, narrator choice, operational requirements and rollback instructions.
- [ ] Explain deployment order: provision only isolated storage/media, compatible backend/frontend, scoped tester grants, then enable the Arabic flag after checks.
- [ ] Document rollback by disabling Arabic access/flag while retaining session history; do not drop existing tables or change other modes.
- [ ] Commit the local handoff documentation. Leave actual deployment, live account grants, external speech acceptance and client sign-off pending for the owner.

Exit: deployment-ready local handoff is complete. Hosted release and client acceptance remain a separate owner-controlled stage.

## 7. Evidence log

| Phase | Status | Evidence / commits |
| --- | --- | --- |
| 0 | Complete with the local planning commits | Backend baseline `f876ec6`; frontend baseline `c6b4701`; new isolated worktrees; planning commit IDs in execution handoff/Git history |
| 1 | Source preparation committed; academic gate open | Private source package, 25 MCQs / 100 choices, 12 offline tests, source-preservation decision and explicit draft/publication guard; see both repositories' docs/arabic-reading |
| 2 | Complete locally: contracts/access/storage preparation | Seven isolated models; matching contracts; 43 local checks; full type checks; offline provisioning SQL previews; no DB/cloud execution |
| 3 | Complete locally: isolated backend APIs | Seven mounted default-off endpoints; 360 checks; full type checks and symlink-aware emit; synthetic transactions/HTTP only |
| 4-9 | Not started | No audio/media/quiz writers or frontend UI yet; no schema apply, import, push or deployment |

## 8. Reference material

- Current English player: frontend `src/pages/student/topics/ReadingModeTopics.tsx`.
- Current recorder/session utilities: frontend `src/hooks/useAudioRecorder.ts`, `src/hooks/useModeSession.ts`, `src/utils/pendingReadingAudio.ts`, `src/utils/readingAudioUpload.ts`.
- Current reading rules: backend `src/modules/mode-sessions/services/reading-session.service.ts` and `mode-session.service.ts`.
- Current speech integration: backend `src/modules/speech/services/speech.service.ts`.
- Azure language support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- Azure pronunciation assessment and limitations: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment

These existing sources are references for behavior and reusable utilities; they are not permission to alter English/NAFS/STEP/Primary behavior. Recheck Azure support before implementation because service capabilities can change.
