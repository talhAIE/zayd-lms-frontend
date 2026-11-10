# STEP Phase 5 — course navigation and question layouts

Implemented locally on `feat/step`, 2026-11-10. No push, deployment, production settings, SQL writes, storage operations, accounts or enrollments in this phase.

## Delivered

- Independent authenticated STEP discovery in Courses, hidden for disabled/unenrolled/denied access; loading and retry do not replace existing course cards. STEP progress uses server completion counts.
- Dedicated owner-bound routes and API transport for course, ordered sections, topics, overview and existing attempt views. IDs/counts/order/state come from learner API responses. Existing shared authentication/refresh is reused without modification; account, region and abort guards reject stale requests/responses.
- Current LMS colors, rounded panels, buttons and sidebar/header conventions. STEP routes do not start ordinary curriculum engagement sessions. Other mode routes/services are unchanged.
- Controlled MCQ component: one question, A–D native radio choices, blue selection only, numbered navigation, answered progress, Previous/Next, focus management, optional save status and gated Submit callback. It does not grade or reveal keys, hints, explanations or correctness.
- Listening: native accessible audio controls outside the question subtree; navigation preserves the same playing element. Authorized temporary URLs stay in component memory; invalid/expired URLs and playback errors show reload. Leaving/changing accounts aborts access and pauses/releases the element.
- Reading: passage beside the question at desktop `lg`, accessible expandable passage on mobile, kept open while navigating. Text is rendered with JSX, preserved blanks/newlines, `dir=auto`, and wrapping for long/Arabic choices.
- Server-confirmed submitted attempt presentation shows final total only. No answer review or retake.

## Explicit Phase 6 boundary

This phase supplies presentation and read transport. The routed topic's new Start button remains disabled; existing attempts render saved selections read-only. The controlled player accepts selection/submit callbacks, exercised in the development preview. Durable Start/save/submit/session recovery is **not wired yet**, as assigned to Phase 6 in the plan. No fake grades or local-only assessment persistence were introduced. STEP remains unavailable in production until its publication/activation/deployment phases.

## Verification

- `pnpm exec playwright test --config dev/step/playwright.config.ts`: focused synthetic browser/transport checks; see `phase5-evidence/checks.json`.
- Desktop 1440px/mobile 390px screenshots inspected for all three layouts; 60-question Grammar navigation wraps, long blanks/Arabic/unbroken choices remain inside viewport, native keyboard radio selection and question focus work. Full LMS routed Listening screenshot also inspected. Screenshot artifacts stay in ignored `dev/.step-qa/`.
- Synthetic audio is ten seconds of generated silence, fulfilled by Playwright; external requests are blocked. No production audio/student/session/SAS token is used. Playback continuity, retry, expiry, route exit and account-switch release are checked. Actual production MP3/mobile device playback/seek remains Phase 7 acceptance.
- TypeScript production check/build, contract parity/private-authoring import guard and production bundle marker scan pass. Preview HTML/fixtures are development-only and excluded from the build.
- Existing NAFS transport suite: nine passing checks. Existing Science transport/practice checks: ten and twenty-eight passing checks, no network or database connections. Courses test retains an ordinary curriculum card with STEP disabled/empty/failing.
- Build retains existing PDF.js eval and large-chunk warnings; no build errors. Full cross-mode production smoke testing remains Phase 7.

## Developer QA

`dev/step/layout.html?kind=grammar|listening|reading` runs only with the serve-only `STEP_BROWSER_QA=true` Vite flag on localhost. Synthetic learner fixtures have no keys or authoring imports. Playwright uses Edge on Windows. Run from the frontend root; dependencies are already declared in the existing lockfile. All API/media requests are intercepted, and the preview only calls local controlled callbacks.

Frontend runtime additions live under `src/components/step`, `src/pages/student/step`, and `src/services/stepService.ts`. Backend runtime/schema/content is unchanged; its Phase 5 commit records the synchronized plan and handoff only. Eleven unresolved Nouns academic findings still block publication.
