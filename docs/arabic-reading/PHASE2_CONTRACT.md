# Arabic Reading Phase 2 contract and isolation design

Branch: `feat/arabic_R`. Prepared 2026-11-27. Status: local contract/storage preparation only; no database connection, schema apply, grant creation, import, API registration or deployment.

## Scope and language profile

The testing mode is independent of English reading, NAFS, STEP, Primary and avatar sessions. Its only activities are the three source IDs `ar-reading-01`, `ar-reading-02`, `ar-reading-03`, with 10/6/9 source questions. All source content remains unchanged and draft under the Phase 1 academic gate. In particular, Q6 has no source-supported choice and no inferred key has become official.

Language is `ar`, direction `rtl`, recognition/assessment locale `ar-SA`. The frozen initial candidate voice is `ar-SA-HamedNeural`, with no speaking style and no prosody support. Actual voice audition, Arabic editorial/narration approval, supported assessment evidence and the over-30-second assessment handling remain Phase 4 gates. `ar-SA-ZariyahNeural` is the other allowed voice candidate, not a switch made silently after content caching. Cache identity must include version, language, locale, selected voice, style and text hash.

The canonical learner contract is `src/modules/arabic-reading/arabic-reading.contract.ts`; the backend docs and frontend `src/types`/docs copies match it. Types constrain development only: Phase 3 still must implement runtime DTO validation, bounded strings/arrays, phase guards and explicit response projection. They do not establish a privacy filter by themselves.

## Authentication, access and regional boundary

Reuse existing signed JWT/password authentication. There is no public Arabic learner endpoint and no username list, existing test-program inheritance, grade-based grant or admin bypass. Every Arabic discovery, history, mutation, replay and media request requires:

1. A current identity, dedicated `LMS_ENABLE_ARABIC_READING=true`, and explicit storage configuration exactly `ARABIC_READING_PROVISIONED_REGIONS=ROW`.
2. Identity region ROW and role STUDENT. SAUDI, missing region, mixed/malformed provisioning and disabled configuration deny before selecting storage or querying the account reader.
3. A fresh read of the account matching identity ID, region, student role, active status and current username when supplied by the token.
4. A matching active, nonexpired `ArabicReadingGrant` for that user/region. Missing, revoked, malformed or expired grants deny. Recheck inside the same transaction before committing mutations; a previous authorization is not a permanent lease.

`ArabicReadingAccess` implements these checks against an injected read interface. Its account/grant reader will be supplied by the Phase 3 Arabic repository. `selectArabicRowClient` calls the physical Azure client only after explicit region/provisioning checks; it never calls shared `getClient('SAUDI')` or inherits Saudi-to-ROW fallback. The module is not registered in `AppModule` in this phase.

The shared flag service adds one independent default-off key; missing, malformed and `1` are false. `.env.example` has no deployed configuration change. No actual region is declared provisioned by the manifest merely because schema files exist.

## Direct client-testing entry and routes

Frontend entry: `/student/arabic-reading`; proposed child routes `/activities/:activityId` and `/sessions/:sessionId`. These are a contract for Phase 5, not mounted routes today. Use an isolated Arabic shell with Zayd's existing visual design. It must not mount StudentLayout's engagement heartbeat or import progress/achievement/reporting effects. Do not change normal course discovery or enroll testers into normal lessons.

All API routes are under `/api/v1/arabic-reading`:

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| GET | `/activities` | none | `ArabicDiscovery` |
| GET | `/activities/:activityId` | none | `ArabicActivityOverview` |
| POST | `/activities/:activityId/sessions` | `ArabicStartRequest` | `ArabicSessionView` |
| GET | `/sessions/:sessionId` | none | `ArabicSessionView` |
| GET | `/sessions/:sessionId/messages` | optional `afterSequence`, limit 1-50 | `ArabicHistory` |
| POST | `/sessions/:sessionId/listen` | `ArabicListenRequest` | `ArabicSessionView` |
| POST | `/sessions/:sessionId/audio` | multipart audio + `ArabicAudioRequest` | `ArabicSessionView` |
| POST | `/sessions/:sessionId/quiz/check` | `ArabicCheckRequest` | `ArabicSessionView` |
| POST | `/sessions/:sessionId/finish` | `ArabicFinishRequest` | `ArabicSessionView` |
| POST | `/sessions/:sessionId/retake` | `ArabicRetakeRequest` | `ArabicSessionView` |
| POST | `/sessions/:sessionId/media/access` | `ArabicMediaRequest` | `ArabicMediaAccess` |

Envelopes are `{status:true,data}` or `{status:false,error:{code,message}}`. Learner messages and deterministic errors are Arabic. Use private/no-store responses. Do not reveal whether another student's session exists. Expected statuses: authentication 401, disabled/unavailable 503, inaccessible/not-found 404, invalid request 400, revision/request/phase conflicts 409, unapproved content 409, rate limit 429. Translate shared guard/network failure display through Arabic frontend fallbacks; do not globally alter existing English guards.

Discovery may show the three safe metadata cards with `available:false` while no approved version exists; no source snapshots, authoring findings or private keys accompany them. Starting requires a fully approved published version. Existing frozen owned sessions may continue after version retirement, subject to live access checks. No partial key or unapproved content bypass is allowed for the testing flag.

## Learner-safe state and lifecycle

The session union exposes only fields appropriate to `listen`, `reading`, `quiz` or `completed`. Before quiz, no MCQs/keys are in the response. Quiz includes question/choice text and only the learner's latest checked selections/correctness. A completed run exposes final correct/total counts for that Arabic run, not LMS marks or grades. No source hashes, private snapshots, raw evidence, review notes, answer keys, storage keys or permanent media URLs enter learner contracts.

- Start has a stable UUID request ID. If an active pointer exists, resume it, including a completed run. A fresh request does not implicitly restart a completed session.
- New run begins in `listen`, revision 0, with a validated frozen content/key snapshot and digest. Full-playback acknowledgement moves to reading. The acknowledgement records browser completion, not proof of attention.
- Recording request binds the expected revision and current chunk ID. Keep the existing two validated ordinary attempts and reviewed-vocabulary-only keyword fallback. Silence/unclear audio rejected before validation does not consume a validated attempt. Persist verdict, next state and message pair atomically.
- Arabic assessment has an explicit availability discriminator. Missing metrics are null; they are not converted to learner zeroes. Word-specific feedback requires actual evidence. No unsupported prosody is invented.
- Complete sentence practice before moving to `quiz`. Quiz checks accept only IDs from the pinned source snapshot. Changing a choice invalidates its prior feedback. Finish independently verifies every latest choice/check is correct and matches the current revision; it cannot be called early or supplied with forged marks.
- Mark `completed` once and retain immutable state/result/history. Retake requires the currently pointed-to completed run and its revision. Insert a successor and atomically swap the active pointer; never delete/reset a prior run. An unfinished session resumes rather than getting abandoned implicitly. No generic reset bypass is designed here.

Return at most the latest 50 messages with a session; obtain older history through the owned keyset endpoint. Media access authorizes an owned passage/chunk/message, returns a read-only signed URL for at most 240 seconds, and accepts no caller-controlled blob path. Do not store or log signed URLs or tokens in browser journals.

## Revisions, transactions and unknown outcomes

Scope request UUIDs to `(userId, activityId, region, requestId)` across start, listen, audio, quiz-check, finish and retake. Hash canonical operation + route IDs + expected revision + payload; hash recording bytes rather than trusting a browser digest. A reused UUID with changed payload/operation is a request conflict. Validate live access before replay, then return the immutable prior learner-safe receipt for exact replay without another write.

Use serializable transactions, bounded conflict retries and compare-and-swap revisions. Writes to session state, messages, active pointers and receipt are one transaction. Receipt insertion failure rolls everything back. New sessions and active slots have database uniqueness; predecessor/run-number constraints prevent concurrent retake forks. Select all owned rows using user/region scope, not session ID alone.

Do not hold a SQL transaction while calling speech/AI. Speech work may be repeated after an unknown provider outcome; exactly-once external billing is not promised. Before committing a computed result, recheck receipt, revision, current chunk and current account/grant in the transaction. Only one result may advance the session. Do not persist an acknowledged learner transcript in a separate partial transaction before its state/feedback is ready, as that would strand retries.

Owner/region/activity/session/version-bound journals retain exact pending request IDs and recordings. On reconnect, reconcile the same session/receipt; never start another run as recovery. Frozen receipt responses may have older revisions: the UI must not replace newer state with them and should read current owned state after recovery. Account replacement aborts pending transport and clears the old view. Revocation blocks replay, media and history as well as writes.

## Arabic-only persistence

| Table | Purpose and boundary |
| --- | --- |
| ArabicReadingGrant | Explicit user/ROW tester grant and optional expiry; no existing grant table reused |
| ArabicReadingVersion | Private draft/published/retired version, original source hash, review flags and complete key count |
| ArabicReadingSession | Owned version/grant-bound frozen snapshot, state, revision, run number and predecessor |
| ArabicReadingActiveSession | One pointer per user/activity/region; retained through completion until explicit retake |
| ArabicReadingMessage | Append-only ordered learner/coach messages, optional private evidence and Arabic media key |
| ArabicReadingMutation | Immutable owner/activity-scoped request receipt, payload hash, source/target session bindings |
| ArabicReadingSchemaMigration | Explicit migration digest, pre-change catalog digest and operator receipt |

No foreign key or inverse field is added to existing User/Course/Lesson models. User IDs are external identity references revalidated through read-only lookup; deletion/reclassification of a user denies later access without cascading deletion into Arabic history. Arabic composite foreign keys bind grant, version, predecessor, active slot and receipt target to their proper owner/activity/region.

Both full regional Prisma schemas retain their exact pre-Arabic definitions (normalized line endings) and append only the seven models. The SQL Server migration additionally contains region/JSON/phase/publication checks and append-only/snapshot/revision/terminal guards inside the same transaction. Published private JSON is compared by binary SHA-256 to avoid collation-based false equality. PostgreSQL SQL is a parity/design reference only: Saudi application/provisioning remains disallowed and no live PostgreSQL release is claimed.

## Forbidden writes and regression surface

Allowed future Arabic writers: only the seven Arabic tables and private `arabic-reading/v1/` media namespace. Shared User is read-only to Arabic access/provisioning. Do not invoke normal ModeSession/Message, LessonProgress, LessonModeProgress, CourseEnrollment, ComponentAttempt, quiz/writing results, engagement/heartbeat/stats, achievements, notifications, teacher/admin reports, STEP, NAFS, Primary or avatar writers. Do not extend LmsTestAccount programs to grant Arabic access.

Normal shared login may still perform its existing authentication/session logging; Arabic requests must not add learning usage, heartbeat or progress records. This phase changes no authentication logic or layout. Verify no Arabic module import appears in AppModule and no Arabic route is mounted until its own later phase. Feature-flag tests ensure existing modes do not enable Arabic and Arabic does not enable them.

## Prepared operations and checks

See `prisma/arabic-reading/phase2/README.md` for offline generation, schema metadata fingerprints and explicit SQL emission. No tool here can apply SQL or publish content. Shared model hashes, migration artifact hashes, source-package validation, contract parity/privacy examples, access denial/expiry/revocation tests and mutation-target scans are local engineering checks. SQL Server constraints/triggers have not been executed on a database; isolation/concurrency acceptance against an explicitly owned database is a later verification gate, not a claim of this phase.
