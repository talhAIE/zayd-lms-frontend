# Phase 5 — Practice player and answer animations

Implemented locally on `feat/nafs_PM` on 2026-11-13. Practice remains disabled by default. No client content, grants, schema changes, production access, push or deployment.

## Player and feedback

- Added the authenticated `/student/nafs/practice/sessions/:sessionId` route for an existing owned practice session. The player has one question, neutral checked/unchecked numbered navigation, Previous/Next, checked progress and explicit Check Answer. Checking never advances automatically. A completed session GET shows server-provided marks without loading questions.
- Uses the existing unchanged `NafsText` fraction presentation and `GradedAnswerSurface` correct/pop/confetti and incorrect/shake effects. Ordinary grading components, Quiz APIs/player and shared animation CSS are unchanged.
- Local selection is ungraded. Correctness appears only after an accepted check for the same session/question/option. Only that selected answer receives correctness styling; no correct-answer reveal or running score.
- Every deliberate check gets a fresh request ID. Accepted response IDs are deduplicated; initial/restored checks and uncertain retries can restore colors/text without animation. Navigation remounts question surfaces without replaying effects. New intentional same-choice checks can animate again.
- Changing an option clears its feedback immediately. It remains unchecked until a fresh check, including changing back to an earlier choice. Pending checks lock choices/navigation so a delayed response cannot grade another visible selection. The button remains available for deliberate retries after a successful check.
- Full question-linked passages render side by side on desktop and behind an accessible Read/Hide passage control on mobile. Authored emphasis, selectable stacked fractions, text alternatives, question/passage figures and image options are supported without HTML injection. No taxonomy or authoring labels are rendered.
- Radio groups use native keyboard behavior, accessible labels and visible focus; navigation focuses the question heading. Navigation and image controls have at least 44px targets. Feedback is announced in a status region. Shared reduced-motion CSS suppresses animation/confetti while preserving correctness colors/text.
- Private images are fetched through constructed session/asset API routes with bearer authentication, MIME/size checks and owner/region guards. Content-provided absolute URLs are ignored. Revocable Blob URLs are used only in component memory; images support retry, enlargement, dialog focus/escape and cleanup on unmount.

## Phase 6 boundary

Overview Start/Resume/View result controls stay disabled. This phase can open existing sessions directly; it does not create runs, finish practice or repeat runs. Checked answers persist through the server check endpoint; unchecked choices live in player memory only and are labeled accordingly. Leaving/reloading can discard unchecked choices; a before-unload warning protects browser reload/close. Phase 6 must implement ungraded durable saves, account/region/version/session-scoped drafts, complete uncertain-operation reconciliation, multi-tab conflict decisions, start/resume/finish/repeat orchestration and overview activation. A conflict currently requires an explicit reload that discards unchecked choices; no silent rebase is attempted. An uncertain check retains its exact request in memory and locks dependent edits until retry/reload. These are player safeguards, not a claim of completed durable-session work.

## Verification

The final broad run passed **51 tests** (13 player cases and 38 navigation/course/recovery/transport/session regressions), with zero failures or skips. The final image lifecycle/dialog touch-target rerun passed **1 test** after enlarging the close control to 48px; this preserves at least 44px even during its opening animation. Sanitized counts are in backend `docs/nafs/practice/PHASE5_VERIFICATION.json`. Browser checks use loopback Vite and synthetic API responses. Practice media is a coded synthetic diagram; no new client questions or keys are read. The one legacy Quiz smoke and existing course/recovery regressions reuse established learner-only fixtures.

```powershell
node node_modules/@playwright/test/cli.js test --config dev/nafs/playwright.config.ts practice-player.spec.ts practice-navigation.spec.ts courses.spec.ts recovery.spec.ts service.spec.ts session.spec.ts
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/nafs-practice src/services/nafsPracticePlayerService.ts src/pages/student/nafs/NafsPracticeSession.tsx src/routes/index.tsx dev/nafs/practice-player.spec.ts
node dev/nafs-practice/contract-check.cjs
node node_modules/vite/bin/vite.js build
```

From the backend, `node scripts/nafs-practice/validate-phase3.cjs --phase5` verifies original source preservation, exact allowed integration changes, schema/migration hashes, contract parity and runtime write scope. `--phase4` remains a historical check and deliberately rejects the new session-route additions. The baseline is never refreshed to accept unrelated changes.

Desktop/mobile screenshots were inspected locally. Reports/screenshots/traces are ignored. Final types, changed-code lint, contract parity, production build and private/synthetic bundle-marker scan passed. Vite reports PDF.js eval and large-chunk warnings. No packages or lockfiles were changed. No database, Azure storage or production API was accessed in this phase.

Next: Phase 6, durable frontend practice sessions.
