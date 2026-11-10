# STEP frontend Phase 1 contract

This phase adds type definitions and implementation guidance only. No STEP routes, card, service, player, feature flag, or enrollment is active yet. The canonical contract is backend `docs/step/step-api.contract.ts`; `src/types/step.contract.ts` is an identical learner-safe copy. Never import backend `prisma/data/step`, authoring packages, answer keys, transcripts, or source snapshots into the frontend.

## Navigation and appearance

Courses -> one STEP card -> three sections in order (Grammar, Listening, Reading) -> one topic each (Nouns, Making Plans, Ants) -> overview -> Start/Resume/View Result. Nouns contains 60 questions; the other two contain four each. Counts, IDs, and state come from the backend, not hardcoded content. Six Nouns groups and A1–C1 level labels remain visible as grouping, not separate enrollments or activities.

Use current LMS sidebar, typography, cards, buttons, radio options, dialog, spacing, and responsive conventions. Show a question instruction even when its secondary stem is empty. Retain source punctuation/blanks; render plain text safely. Do not import authored Word/HTML for display.

All players show one MCQ, A–D options, progress, numbered navigation, Previous/Next, and save status. Grammar has a text question; Listening retains the shared audio player across questions; Reading shows a passage beside the question on desktop and in an accessible mobile panel. No recording or AI dialogue. Audio can be replayed/seeked without a mandatory listen gate. No per-answer animations or correctness feedback in this assessment.

## Session behavior

One independent attempt per topic, no timer, all answers required, one mark each. Discovery/overview does not start an attempt. Start returns an existing attempt if already created; completed attempts return only total marks. Do not offer a retake or answer review.

Backend `/api/v1/step` API routes, access rules, status codes, concurrency rules, and media-access design are defined in backend `docs/step/README.md`. Use existing JWT refresh handling, bind requests/retries to user ID, username, and region, and abort/reset STEP state on account switch. Student grade and membership in other modes do not grant STEP. Courses must load independently: `STEP_DISABLED`, no enrollment, or a STEP failure cannot blank normal cards.

Serialize/coalesce saves, retain stable request IDs for uncertain retries, and show saving/saved/retry. Drafts are keyed by user/username/region/attempt and contain choices plus navigation position, never private media URLs. A revision conflict requires loading the owned server state and resolving local/server differences before retrying with a fresh request ID. Do not blindly replay local changes on top of another tab's edits.

Drain saves before confirming submission. Submit a complete final selection snapshot and expected revision; incomplete/failed requests retain answers. If the response is lost, freeze editing until GET attempt/result determines whether submission succeeded. Do not create another attempt. Final marks and completion appear only after server confirmation.

For Listening, request a read-only blob URL from authenticated POST `/attempts/:attemptId/audio/:assetId/access`. The URL expires within five minutes and allows native byte-range seeking. Refresh on expiry, do not persist/log it, and pause/remove the player when leaving the topic or switching accounts. Keep audio state mounted across question navigation. Show a recoverable playback error instead of blocking other LMS screens.

## Reuse and separation

Reference `src/components/nafs/NafsCourseCards.tsx`, `NafsSession.tsx`, `useNafsSession.ts`, and the session/transport helpers they use. Reuse shared UI primitives and apply the existing recovery patterns in STEP-owned components/services. NAFS's subject types and PNG media component are not a STEP audio API. No NAFS contracts/routes, Primary reading or feedback, normal LMS grading, 3D layout, Science Spark, landing pages, or teacher results are changed by this phase.

## Content and production status

The backend audit extracted 68 source questions and one supplied 95.060-second MP3, with private answer keys and provenance. Eleven Nouns questions need an explicit academic/content decision before publication; the full selected topic was preserved. Making Plans audio was decoded and its approved transcription checked against all four questions. Ants retains its four paragraphs. No launch topic has been uploaded or published by Phase 1.

Use the existing production SQL/storage in later phases; no local STEP database or local-only student accounts. Access will be persistent STEP enrollment, not `.env` username allowlists. No runtime feature is enabled by these type files.

## Verification

The compile-only examples exercise final-result discriminated unions and reject answer-key/correctness fields. Run `node dev/step/contract-check.cjs` and the normal frontend type check. The contract checker compares against the canonical backend file in the sibling integrated checkout by default; pass its absolute path as the first argument when checkouts differ. It also ensures private authoring content has not been added to STEP frontend directories. Run existing mode regressions when runtime integration begins in later phases.
