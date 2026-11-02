# Public landing mode demos

Vocabulary completes the six-card public demo section. It reuses the existing `FlashcardsComponent`, `MatchComponent`, MCQ, and shared component player: reveal **Library / Borrow / Quiet** with meanings and examples, match all three words to shuffled meanings with retries, then answer one sentence-completion quiz. The final correct quiz closes the popup. Reopening starts at the first unrevealed flashcard, zero progress, with no matching selections or answers retained.

`/api/v1/public-demo/vocabulary/{start,actions,close}` uses the unchanged component engine and Vocabulary policy through the existing private memory adapter. It needs no account, database writes, tracking, AI, or speech calls. Tokens, expiry, bounded sessions, request limits, activity order, response sanitization, close cancellation, and late-result handling follow the Grammar demo. Normal LMS Vocabulary content, authentication, endpoints, and progress behavior remain unchanged. Verify with `node dev/grammar-demo-check.cjs vocabulary` and backend `src/modules/public-demo/vocabulary-demo.spec.ts` alongside component/policy and existing demo regression checks.

Writing Mode is the fifth public demo: **My daily routine**. The existing instruction screen, three-row writing table (morning / after school / evening), paragraph builder, AI feedback with rubric scores, retry controls, model answer, and Finish action all use the current Zayd UI. The model paragraph is server-only until final submission. Viewing it completes the final activity; Finish closes the popup without navigating to a course. Closing at any point discards sentences, paragraph, review, and session token; reopening starts from the instruction at 0%.

Dedicated `/api/v1/public-demo/writing/{start,actions,close}` routes reuse the unchanged `LearningComponentsService`, `CloseReadService`, `WritingReviewService`, and `WritingReviewAiService`. Private memory adapters replace both component and review database repositories. There are no user, content, progress, review, reward, or analytics database writes. Normal authenticated writing endpoints and their repositories remain unchanged. Real review text goes to the existing configured AI provider and consumes its quota; the instruction asks visitors to use fictional details. Paragraphs are limited to 100 words, action responses to 4 KB, and each opening allows six review-related requests, 200 total actions, a ten-minute lifetime, and one operation in flight. Four review operations may run concurrently across Writing demos. Closing aborts frontend requests; a provider request already running may finish, but its result is discarded. Start/address/session limits match Grammar.

Verify with `node dev/writing-demo-check.cjs`, `node dev/writing-review-check.cjs`, and backend `src/modules/public-demo/writing-demo.spec.ts`, alongside existing compilation, review, component, policy, and other public demo regressions. No database migration or lesson upload is required.

Grammar Mode is the fourth public demo. Its existing `ComponentModePlay`, text, fill-in-the-blank, and MCQ components run a short lesson on **am / is / are**: teach the rule, fill `I ___ ready.`, `She ___ a student.`, and `They ___ at school.`, then choose `He is my friend.` from three sentences. Incorrect answers use the existing grader and retry feedback. The final correct answer automatically closes the dialog. Close, Escape, back, and reopening discard the previous attempt and start at the lesson again.

The opt-in `demo` adapter uses only `/api/v1/public-demo/grammar/{start,actions,close}` with a fresh in-memory `x-demo-token`, omitted cookies, and aborted requests on close. The server reuses the unchanged `LearningComponentsService` and `Section2ModePolicyService` with private memory repositories; no Prisma, user, lesson content, saved progress, rewards, or tracking records are written. Normal authenticated component screens retain their existing service calls and behavior. Grammar requires no AI or speech requests and accepts only the three fixed demo component IDs in order. Answers are sanitized through the existing learner serializer. Sessions expire after ten minutes and have 200 requests per opening (including draft saves), one action in flight, and the same 12-start/64-session limits as the other demos.

Verification: `node dev/grammar-demo-check.cjs`, `node dev/grammar-completeness-check.cjs`, `node dev/component-completion-check.cjs`, and backend `src/modules/public-demo/grammar-demo.spec.ts`. Existing component-engine/policy tests cover normal LMS grading and completion.

Roleplay Mode is the third public demo. Its existing `RolePlayModeTopics` UI presents a short cafe scenario, then three meaningful exchanges: order a drink, choose a size, and finish politely. Both typed replies and microphone recordings use the existing Roleplay engine, relevance evaluation, hints, feedback, speech assessment, and tutor voice. The demo sets `requiredTurns: 3` in its own content only; ordinary lessons retain their configured lengths and behavior. There is no Roleplay quiz.

Roleplay has its own `/api/v1/public-demo/roleplay` endpoints, anonymous tokens, memory store, close/expiry handling, and request limits. `/actions` accepts text or history; `/:sessionId/audio` accepts up to 3 MB and uses the existing audio decoder/duration validation and speech engine. Recording attempt IDs prevent network retries from awarding duplicate progress. Completed sessions are discarded immediately. It never creates an LMS user, saves LMS progress, or archives recordings. Closing stops playback/recording, aborts pending browser requests, and ignores late results. Reopening begins at the scenario with 0/3 turns.

`scripts/generate-roleplay-demo-audio.ts` creates the fixed scenario narration once with the existing Tony voice. Conversation replies use the existing live AI and speech providers and share their quota. `scripts/roleplay-demo-smoke.ts` checks real text and synthetic voice replies, unrelated-answer rejection, three-turn completion, and session destruction against the isolated local demo server on port 4000.

Listening Mode is also available beside Reading in the same landing section. It reuses `ListeningModeTopics` and the existing listening engine through separate `/api/v1/public-demo/listening` endpoints and a separate memory store. The flow is a complete first listen, a comprehension prompt with a complete second listen, then one server-graded quiz question. A correct submission closes the popup; a wrong submission keeps the normal quiz retry behavior. No microphone is used in Listening mode.

Its fixed story is **8.892 seconds**. Instruction and comprehension audio are 4.824 and 4.860 seconds. All three use the existing Tony voice; their duration was checked from decoded PCM by `scripts/generate-listening-demo-audio.ts`. Packaged audio is committed in the backend, so playing the demo needs no runtime speech-generation request. This does not change normal Listening content, audio lengths, authentication, progress, or completion behavior. Reading keeps its own endpoints and session lifetime.

Branch: `feat/live_interact` in the frontend and `zayd-lms-backend` checkouts.

The Reading Mode card in `#personalized-learning` opens the existing `ReadingModeTopics` screen in a dialog. The session uses a fixed three-sentence A2 passage, the same sentence assessment/retry flow, and one server-graded question. A correct checked answer submits automatically; successful completion closes the dialog. Incorrect answers retain the normal retry UI.

## Isolation

- A dedicated fetch transport calls only `/api/v1/public-demo/reading`. It never reads LMS authentication tokens, sends account cookies, refreshes authentication, or redirects to login.
- The existing mode hook defaults to authenticated/persistent behavior. Only this dialog explicitly supplies the demo transport and `ephemeral: true`.
- Demo recordings and viewed-feedback state are not written to IndexedDB, sessionStorage, or localStorage. Recording playback URLs remain in the current browser and are revoked on unmount.
- Completion closes the dialog instead of refreshing LMS progress or navigating to another lesson. Microphone startup/recording, playback, requests, and listeners are cleaned up on close. Delayed responses cannot update a closed demo.
- The backend reuses `ModeSessionService` and `ReadingSessionService` through the existing repository/media adapter. Its anonymous identity and all session state exist only in process memory. No student/user/progress/message database writes, file state, recording archive, achievements, or analytics are created by the demo.
- The existing authenticated controller, socket authentication, and normal Reading flow remain protected and keep their original defaults.

## Backend contract

All requests use a newly generated 256-bit `x-demo-token` for each opening. `credentials: omit` prevents account cookies. The token is held only in memory.

- `POST /start`: create/resume this opening's fixed demo; returns normal mode events.
- `POST /actions`: passage listened, history, check answer, or submit the single answer. The server rejects foreign session IDs and arbitrary actions/content.
- `POST /:sessionId/reading-audio`: same speech conversion, assessment, reading validation, and feedback engine; 3 MB multipart limit.
- `POST /close`: invalidate and discard this opening. Also called on `pagehide` with keepalive.

Finished sessions are removed immediately. Abandoned sessions expire after 10 minutes. Temporary rate buckets allow 12 starts per address per 10 minutes, 20 audio attempts and 80 requests per opening, 64 simultaneous sessions, and 4 concurrent engine requests. Address buckets contain only a hash and expire; they are abuse limits, not visitor analytics. Closed tokens cannot recreate sessions through a delayed start.

The public endpoints share existing speech/AI providers and quota. A request already submitted to a provider can finish after the dialog closes; its result is discarded and cannot restore the session. Multiple API instances need session affinity or a dedicated single-process demo service because session state is intentionally memory-only. Restarting the server resets demos.

The production backend must include the new module and allow `x-demo-token` in CORS. No database migration, new account, or new provider credentials are needed. Frontend and backend changes must be deployed together; the frontend uses the existing `VITE_API_BASE_URL`.

## Local verification

From the backend checkout, `node -r ts-node/register -r tsconfig-paths/register scripts/reading-demo-preview.ts` runs only demo routes and real configured speech/AI providers at `127.0.0.1:4012`; it does not boot Prisma or LMS modules.

Run Vite on port 5179 with `VITE_API_BASE_URL=http://127.0.0.1:4012` in the process environment. No `.env` edits are needed. Open the Reading card on the landing page.

If your frontend already targets `http://localhost:4000` and the normal backend is not running, start the isolated preview on that port instead (PowerShell):

```
$env:READING_DEMO_PREVIEW_PORT='4000'
node -r ts-node/register -r tsconfig-paths/register scripts/reading-demo-preview.ts
```

Keep this terminal running while testing. The isolated preview accepts localhost frontend origins and serves only demo endpoints. To test the full LMS, run the normal backend with the new module instead; do not run both servers on the same port.

`scripts/reading-demo-smoke.ts` checks all three sentences using synthetic narrated audio against the real speech provider, then checks the quiz and completed-session destruction. It requires the preview server and existing backend provider configuration. It does not use a student's microphone or account.

Frontend checks:

```
node dev/reading-demo-transport-check.cjs
node dev/reading-demo-flow-check.cjs
node dev/reading-demo-silence-check.cjs
node dev/listening-demo-flow-check.cjs
node dev/roleplay-demo-flow-check.cjs
node dev/reading-audio-upload-check.cjs
node dev/reading-finish-check.cjs
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.app.json
node node_modules/vite/bin/vite.js build
```

Backend coverage includes public demo HTTP validation and lifecycle, actual reading-engine transitions with mocked speech providers, ownership isolation, expiry, in-flight close, rate/upload limits, server-only quiz answers, normal Reading/3D engine parity, and existing mode upload/session tests.

The demo uses a more conservative browser silence threshold than normal lessons, so quiet microphone signals reach the existing speech assessment service. Digital silence is still rejected locally with device/volume guidance. This does not relax the backend's speech or reading validation and does not change the normal LMS recorder defaults.
