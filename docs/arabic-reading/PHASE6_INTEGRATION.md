# Phase 6 — owned session, audio and recovery integration

Completed locally on 2026-11-28. The production Arabic entry now connects the real Arabic HTTP APIs when its independent frontend flag is enabled and a student identity with explicit ROW claims is present. Backend account/grant/region/feature/content checks remain authoritative. Both feature flags remain disabled by default; no source content was published, real account/grant changed, database contacted or cloud service used.

## Runtime integration

`ArabicReadingPage.tsx` mounts an owner/activity-scoped live controller outside `StudentLayout`. The presentation components remain transport-free. `useArabicReading.ts` constructs/disposes a controller per lifetime; `controller.ts` manages the chooser/overview, start/resume, owned sessions, saved full-listen acknowledgement, current sentence, server feedback, narration, recording and reconciliation. Refresh/online/focus reauthorize and restore current server state. They do not automatically grade or resend audio.

`arabicReadingService.ts` uses the existing account-guarded HTTP client and shared token-refresh queue, with a request-local lifetime guard. It calls only the `/api/v1/arabic-reading` namespace; normal authentication refresh remains shared. Typed runtime schemas project supported learner fields, bound arrays/text and reject malformed sessions/scores. Raw provider/server messages are never displayed. JSON/media requests have bounded timeouts; multipart uploads retain the existing 180-second transport timeout and the tighter Arabic 30-second recording policy.

The new local identity helper binds resources to token subject, username, explicit ROW region, student role and authentication version, cross-checking the existing signed-in user. These untrusted browser claims provide privacy/lifetime binding, not server authorization. Missing/unsupported regions have no ROW fallback. Same-owner token refresh preserves recovery; account replacement/logout/disposal aborts requests, releases microphone/media resources and prevents late results from updating the replacement account. A previously authorized upload can still finish on its original owner's server session after navigation/logout; it cannot be replayed as the new owner. Its original-owner pending record remains available for later reconciliation.

## Narration and recorder

Narration is fetched through authenticated POST and played from a client-local blob URL. Tokens/signed/public URLs never appear in an audio source. Every new play/retry reauthorizes through the server; paused playback retains its position when reloaded. Only a real media `ended` event unlocks the local listen acknowledgement. The saved phase is fetched after mutation, including uncertain listen outcomes. Playback completion remains an acknowledgement, not evidence of attentiveness. Seeking is a playback affordance and is not a pronunciation verdict.

Audio/source changes, recording start, phase/run changes, identity changes and unmount pause/clear media and revoke blob URLs. Native playback rejection is a localized retryable media failure, not an authorization failure. Media callbacks are scoped by generation/session so stale events cannot replace a new target. A new run does not inherit a previous run's playback acknowledgement.

The English `useAudioRecorder` owns English toasts, base64 preparation and different persistence semantics. It and all existing recording/recovery utilities remain unchanged. `arabicReadingRecorder.ts` is a separate bounded Blob adapter: supported browser container selection, mono/echo/noise settings, 64kbps preference, 20-second permission deadline, cancel/late-stream release, error/visibility/unmount cleanup, 8 MiB limit and automatic stop at the 30-second client timer. Actual decoded duration and silence/quality checks remain server-owned; the client never truncates and grades an initial segment. Browser timer precision does not guarantee decoded duration, so the existing localized server overlong rejection remains necessary.

## Durable exact-attempt recovery

`arabicReadingPending.ts` uses a dedicated IndexedDB database, `zayd-arabic-reading-recordings`, isolated from English/NAFS/STEP/Primary stores. One immutable record is added per owner/activity slot, containing its owner scope, activity, session, frozen version, chunk, expected revision, UUID attempt ID, original Blob, SHA-256 and creation time. No bearer/refresh token is stored there. Transaction completion must succeed before dispatch; quota/blocked/digest failures have no upload fallback. Conditional deletion compares owner/attempt ID, so an old callback cannot delete a newer pending record. Recordings are retained until confirmed reconciliation/discard; replacement accounts do not load or send them. This is mode-owned transport recovery, not normal LMS progress or usage tracking.

Every send/resend verifies the bytes and asks the server for the exact attempt's disposition first. It sends only when the current session/version/chunk/revision still matches. It retains the same UUID, bytes and metadata on resend, never assigning a fresh ID to an uncertain grade. A receipt-confirmed response is followed by current-state reconciliation, so an old replay cannot roll the UI backwards. Terminal committed/discarded outcomes clear the local record only after confirmation. Failure to delete locally remains recoverable by another status check. Same-browser Web Locks reduce competing work; backend CAS/receipt uniqueness remains the correctness boundary when locks are absent or clients differ.

Silence, unclear speech, invalid/oversized/overlong input closes the rejected attempt with a discard receipt before offering fresh recording; it consumes no validated sentence attempt. Provider failure, offline, timeout, 429 and interrupted responses retain the original attempt for deliberate retry/discard. Wrong-content feedback and ordinary two-attempt advancement come only from the backend. An unavailable assessment remains explicitly null/unavailable and is disclosed as transcript-only. Older pending work can still be discarded if another client advances to quiz/newer state, without resending into that state. Corrupt local bytes cannot upload; their original metadata/digest can still cancel the attempt safely.

## Added backend recovery endpoints

Both endpoints use the existing Arabic JWT/role/explicit-region/current-account/current-grant checks and private/no-store responses:

```text
POST /api/v1/arabic-reading/sessions/:sessionId/audio/status
POST /api/v1/arabic-reading/sessions/:sessionId/audio/discard
```

JSON fields are exactly `requestId`, `expectedRevision`, `chunkId`, `format`, `audioSha256`. The hash is identical to the multipart request hash. Result is `{disposition: "unconfirmed" | "committed" | "discarded", session: <current owned safe session>}` inside the Arabic envelope. Unconfirmed means no durable receipt was found; it does not prove no request is in flight.

Discard atomically inserts a no-grade receipt using the existing allowed `audio` operation and reserved `recordingDisposition:"discarded"` receipt metadata. Existing replay projection strips that metadata from learner session responses. No schema, migration, repository write target or provisioned receipt digest changes. In-flight audio commits recheck the exact receipt before CAS: discard winning prevents a late grade, while an already committed grade winning is preserved. Repeated discard is idempotent; changed metadata/digest conflicts. Status never performs speech work. Access revocation/receipt-write failure rolls cancellation back.

No normal progress/usage/reporting writes, destructive resets, content approvals or startup hooks were introduced. Source package and both sealed schemas remain unchanged. All four learner contract copies are synchronized.

## Local verification

- Backend: 453 Jest checks in 15 suites, including 207 Arabic/access/flag checks and 246 unchanged English reading/STEP/NAFS/Primary regressions; 22 source/schema/provisioning checks (475 total backend checks). Real SQL Server guards/locks/plans were not executed.
- Frontend: 21 integrated scenarios with 68 assertions through the actual frontend, Arabic module, JWT/role/DTO/HTTP/session/recovery code; 422 layout assertions across 56 scene/viewport combinations, three synthetic 10/6/9 UI journeys and seven viewport sizes; 30 presentation assertions; ten existing English recording/reading/socket/shared-UI/avatar regression scripts.
- Both application type checks pass. Frontend build, preview/contract type checks, focused lint and four-way contract/privacy checks pass. Backend JS/declarations emit with the established `--preserveSymlinks true` setting. The previously documented default Nest linked-dependency TS2742 limitation is unchanged. Existing frontend pdfjs eval/large-chunk warnings remain unchanged. Compiler-generated tracked cache files are excluded/restored.
- Built frontend JS/CSS/HTML exclude the synthetic Arabic test markers, bootstrap service, fixtures and local preview banner. No actual Azure/AI, microphone, hosted storage, account operation, push or deployment was performed.

The integration tests use real local HTTP/JWT/controller/repository interfaces with synthetic in-memory SQL transactions, mocked codec/speech results, generated narration tone and a fake browser device. They test persistent IndexedDB in a local browser, deliberately lost responses, an accelerated 350ms XHR timeout (while verifying the configured 180000ms upload timeout), offline/reconnect, quota failure, native audio rejection, blob cleanup, multiple tabs, stale revisions, late/cancelled permission streams, client timer auto-stop, corrupt bytes, account replacement/late replies, grant revocation and unchanged LMS counters. These are engineering checks, not actual device/voice/teacher acceptance. Earlier Phase 4 tests separately exercise all five real local audio decoders with generated audio.

For reproducibility, in separate terminals after inspecting the synthetic-only tools:

```text
# Backend worktree; deliberately not the inherited whole application
node -r ts-node/register -r tsconfig-paths/register test/arabic-reading/phase6-local-server.ts --synthetic-local-only
# Frontend worktree; no inherited env file; proxy restricted to the synthetic localhost server
node node_modules/vite/bin/vite.js --config dev/arabic-reading/vite.integration.config.ts
node dev/arabic-reading/integration-check.cjs
```

The tools bind localhost ports 5026/5196, use synthetic-only bootstrap/control endpoints and block external requests. They are not deployed or imported by production code. Local reports stay ignored under `dev/arabic-reading/test-results/`; verification summaries are versioned in `PHASE6_VERIFICATION.json`.

## Remaining work

Phase 7 connects reviewed source quizzes and server check/finish/completion/retake actions. The Phase 6 runtime intentionally leaves those actions disabled; reaching quiz is a real server reading transition, not a fabricated completion. Academic/key/editorial review (including unchanged Q6), real Arabic teacher/voice/microphone/Azure calibration and actual owned-target SQL acceptance remain open. Phases 8–9 provide final regression/acceptance and owner deployment handoff. Do not enable/publish the original draft content based on synthetic tests.
