# Public Reading Mode demo

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
node dev/reading-audio-upload-check.cjs
node dev/reading-finish-check.cjs
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.app.json
node node_modules/vite/bin/vite.js build
```

Backend coverage includes public demo HTTP validation and lifecycle, actual reading-engine transitions with mocked speech providers, ownership isolation, expiry, in-flight close, rate/upload limits, server-only quiz answers, normal Reading/3D engine parity, and existing mode upload/session tests.

The demo uses a more conservative browser silence threshold than normal lessons, so quiet microphone signals reach the existing speech assessment service. Digital silence is still rejected locally with device/volume guidance. This does not relax the backend's speech or reading validation and does not change the normal LMS recorder defaults.
