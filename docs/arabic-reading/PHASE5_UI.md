# Phase 5 — Arabic layouts and navigation

The local presentation phase is complete. This phase mounts a separate default-off route and builds the chooser, overview, listening, sentence practice, feedback, quiz, completion and retake screens. It does **not** connect learner APIs, access a microphone, fabricate an authorized session, publish source content or implement quiz/completion writers. Live session/recording integration is Phase 6; source quiz checking/completion is Phase 7. Phase 1 academic/key/editorial/speech review and real Azure/voice acceptance remain open.

## Files and routes

- `src/pages/student/arabic-reading/ArabicReadingPage.tsx` mounts at `/student/arabic-reading` and `/student/arabic-reading/:activityId`.
- `src/components/arabic-reading/ArabicReadingShell.tsx` supplies a separate Zayd visual shell, with the existing logo, Arabic navigation, mobile menu, skip link, restored document title and Arabic language/direction boundary.
- `ArabicReadingView.tsx` supplies learner screens. `ArabicReadingControls.tsx` supplies audio, recording, native dialogs and safe score presentation. `ArabicSourceText.tsx` isolates numeral runs without changing source characters. All styles are scoped to `.arabic-reading`.
- `presentation.ts` defines presentation states/actions and Arabic labels. Shared learner contracts remain unchanged.

The real route checks the independent `VITE_LMS_ENABLE_ARABIC_READING` flag, defaulting off unless exactly `true`, then authenticated student status. This is **not** a tester grant or region authorization. No NAFS, STEP, Primary, avatar or English access implies Arabic access. With the flag off, it displays the Arabic disabled state without any API, heartbeat, recorder or session effect. With the flag on, the signed-out/other-role states are localized; a student sees an unavailable state until the Phase 6 owned-server adapter is connected. Invalid activity identifiers are refused. No synthetic provider is imported into that route.

The route is outside `StudentLayout`. That layout's normal engagement bootstrap/heartbeat, course loading, progress hooks, socket transport, rewards and teacher reports are not imported by the Arabic presentation components. No other mode or shared layout was changed; the existing router gains only the Arabic import and two sibling routes. No discoverability entry is added to normal LMS course loading.

## Reading parity and Arabic behavior

The existing `ReadingModeTopics.tsx` is the design/flow reference: white rounded cards, Zayd blue actions, a three-step sidebar, full passage/audio before reading, coach/learner conversation, sentence model playback, microphone controls, per-question answer checks, completion and retake. The Arabic components independently mirror that structure in RTL instead of reusing English components with hard-coded prompts, ASCII emphasis/vocabulary logic or normal lesson/session effects.

The chooser always orders exactly the three catalog titles: حنكة طفل, من نعم الله, السُّكَّري, with 10/6/9 questions. Activity availability and resume/completed labels are driven by the supplied learner-safe summary, with no fake published availability. The overview renders server-supplied instructions and source question count. Every learner-owned string, loading/error state, navigation label, accessibility name, control label, timer/count and modal is Arabic. Zayd's existing logo is retained.

Reading steps are status indicators, not shortcuts that bypass the current phase. The listening Next action stays disabled until a playback-completion presentation acknowledgement is supplied; actual saved acknowledgement is Phase 6's server responsibility. Reading renders the exact passage blocks and current server target. It provides audio loading/paused/unavailable UI, microphone idle/start/record/ready/upload/saved/reconcile/denied/unavailable UI, and the 30-second limit from the frozen safe contract. These are views/actions, not a second recorder or persistence implementation.

Paragraphs and sentence content preserve original Unicode, diacritics, punctuation and numeric characters. A separate `<bdi dir="ltr">` wrapper isolates Arabic/Western/Persian numeric runs, decimals, dates and percentages; it never converts or edits source text. UI counts/timers use Arabic formatting. Generous line heights and wrapping avoid diacritic clipping and horizontal overflow. The existing Arabic font stack has local system fallbacks; no new external font dependency is added.

Feedback comes from the supplied safe server object. Unsupported/missing scores display `غير متاح`; genuine numeric zero remains `٠ من ١٠٠`. Unavailable assessment explicitly discloses transcript-only feedback. No prosody score is shown. No vocabulary definitions or hints are invented. The current source has no reviewed vocabulary mappings, so those controls remain absent; if a future reviewed feedback object supplies words, only those words are listed, without invented dictionary cards.

Quiz options preserve supplied order and Arabic choice labels. Native radios support keyboard navigation. Draft selection is local presentation state, never an answer key or verdict. Only a matching supplied server-checked correct answer unlocks Next; an incorrect answer can be edited and checked again. Editing hides stale feedback. Finish is unavailable until all supplied questions are checked correct, and completion is shown only from a supplied `completed` session. Production writers/server verification arrive in Phase 7. Retake uses a confirmation dialog and a callback; it never clears normal LMS progress or erases history.

Buttons have visible keyboard focus and 44px targets, the document has an Arabic `lang`/RTL boundary, headings receive focus on screen/activity changes, and native modal dialogs trap focus, close on Escape and restore the triggering control. Mobile navigation is an accessible disclosure and closes on route changes. Reduced-motion settings suppress animations/transitions. Page scrolling keeps long passages and controls reachable even at short/landscape sizes; no fixed recorder obscures source text.

## Local-only synthetic review

The development entry is `dev/arabic-reading/index.html`. Its `fixtures.ts` is **invented engineering content**, not the supplied PDF or proposed answer keys. The 10/6/9 sample quizzes verify layout/order/navigation only. A prominent Arabic banner identifies the local preview. All fixture state is memory-only; playback completion, recorder events and answer responses are explicitly simulated, not device/speech/network acceptance.

Start the isolated preview from the frontend worktree:

```text
node node_modules/vite/bin/vite.js --config dev/arabic-reading/vite.config.ts
```

Then open `http://127.0.0.1:5195/dev/arabic-reading/index.html`. Query `scene` can select `chooser`, `overview`, `listen`, `reading`, `quiz`, `completed`, `loading` or `error`; `activity=1|2|3`, `long=true`, recorder states and audio error/loading states exercise the same presentation components. The isolated Vite config loads no inherited `.env`, adds no proxy and forces the normal client Arabic entry off. The harness checks development mode plus localhost and is never imported by `src/`. Production build inputs stay unchanged, and the built assets are checked to exclude the Arabic synthetic markers/banner.

Run:

```text
node dev/arabic-reading/presentation-check.cjs
node dev/arabic-reading/contract-check.cjs
node node_modules/typescript/bin/tsc -p dev/arabic-reading/tsconfig.preview.json
node dev/arabic-reading/browser-check.cjs
```

Browser checks use local headless Chrome, block all nonlocal requests, create no auth/progress storage and never access a real microphone or account. The report/screenshots are ignored in `dev/arabic-reading/test-results/`; summary evidence is versioned in `PHASE5_VERIFICATION.json`. Generated build caches are not included in the commit.

## Verification and Phase 6 handoff

Local checks cover 56 scene/viewport combinations across 1440×900, 1280×600, 1024×768, 768×1024, 390×844, 320×568 and 844×390; three synthetic full journeys with 10/6/9 checks, wrong-answer edits, completion and cancel/confirm retakes; keyboard radio/submit behavior; modal focus/escape; loading/errors and recorder recovery views; exact diacritics/numerals; absence of unauthorized vocabulary and progress/network side effects. Six screenshots were visually inspected for desktop/mobile styling, diacritics, mixed numbers and modal placement. This is not actual source/teacher/device acceptance.

The full frontend production build and application/preview/contract type checks pass, as do ten existing English reading, binary recording/recovery, socket auth, shared answer/MCQ, component completion and avatar reading regression scripts. Source/schema seal checks remain intact. The inherited Vite large-chunk and pdfjs eval warnings are unchanged and documented; no unrelated bundling/dependency edits were made to hide them.

Phase 6 should consume `ArabicReadingScreen`, `ArabicPlayback`, `ArabicRecorderView` and `ArabicReadingActions`, keyed to the current owner/region/session/version. It must authorize from the backend before presenting content, apply actual saved acknowledgements, fetch authenticated narration bytes and manage blob URLs, connect the existing safe recorder/transport utilities, enforce 30 decoded seconds, reconcile unknown outcomes with the same attempt ID/bytes, revoke stale owner state and implement resume/refresh/reconnect. Do not promote the local fixture adapter or infer content approvals. Phase 7 connects quiz/completion actions to independently validated server writers. No live deployment, grant, DB operation, Azure/AI call or content/media upload occurred in Phase 5.
