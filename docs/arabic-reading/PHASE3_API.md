# Arabic Reading Phase 3 - isolated backend APIs

Date: 2026-11-27. Branch: `feat/arabic_R`. Phase 2 commits: backend `72936a4`, frontend `be61481`.

Status: complete locally for the Phase 3 endpoint scope. The module is registered, feature-disabled by default, and verified using synthetic transactional storage and real local JWT/HTTP boundaries. No database schema, tester grant, source version, media or learner record was applied/imported. There is no deployed acceptance claim.

## Implemented routes

All routes require the existing password-version JWT and STUDENT role, plus the dedicated Arabic flag, explicit region provisioning, current active account and nonexpired Arabic tester grant. All successes/errors receive private/no-store headers and mode-owned failures use the frozen Arabic error envelope.

| Method | `/api/v1/arabic-reading` path | Behavior |
| --- | --- | --- |
| GET | `/activities` | Three safe source metadata cards, availability and mode-owned session state; no attempt creation |
| GET | `/activities/:activityId` | Arabic instructions and safe activity overview |
| POST | `/activities/:activityId/sessions` | Stable-request start or resume, including a completed current run |
| GET | `/sessions/:sessionId` | Owned frozen session view and latest 50 ordered messages |
| GET | `/sessions/:sessionId/messages` | Owned forward keyset history, limit 1-50 |
| POST | `/sessions/:sessionId/listen` | Revision-bound full-playback acknowledgement; atomically enter reading and append a coach message |
| POST | `/sessions/:sessionId/retake` | Explicit successor to the currently pointed-to completed run; preserve prior result/history |

There is intentionally no generic delete/reset endpoint for unfinished runs. This follows Phase 2's explicit completed-run retake contract. An unfinished activity resumes. Audio/media endpoints belong to Phase 4; quiz check/finish writers belong to Phase 7. They are not mounted as fake successes or bypasses in this phase. Completed/quiz projections are implemented and verified with seeded synthetic state; no completion shortcut is exposed through these Phase 3 APIs.

DTOs reject unknown body/query fields, invalid UUIDs/activity IDs, nonnumeric/negative/oversized revisions, false playback acknowledgements and unbounded history queries. No caller-supplied ownership, phase, marks or snapshot is accepted.

## Strict Arabic authorization and no regional fallback

Service preflight checks feature/role/region/provisioning before the Arabic repository is called. Authorization reads current account and Arabic grant inside the serializable transaction and rechecks them, including grant identity, before commit. Revoked/expired access denies exact mutation replay and history as well as new writes. Foreign and absent sessions use the same non-disclosing response.

The existing shared JWT strategy supplies a default ROW region for legacy tokens without a region claim. The Arabic-only `ArabicClaimBoundary` runs after signature/expiry validation and inspects the original verified bearer claims, requiring explicit ROW. It never trusts an unverified token independently and does not alter the shared strategy or any existing mode's behavior. Missing claims and SAUDI cannot inherit the shared ROW fallback.

`ArabicReadingRepository` selects only `getAzureClient()` after explicit ROW provisioning, never the provider fallback getter. Before domain queries it verifies the exact Phase 2 Arabic migration receipt/digest. Missing tables, mismatched receipts and unexpected database errors yield sanitized Arabic unavailability. Constructors perform no SQL or migration work, so registering the disabled module adds no new startup database operation.

## Physical persistence and transaction behavior

All SQL identifiers are static; caller values use `Prisma.sql` parameters. Indexed ASCII identifier/region predicates explicitly cast parameters to the prepared varchar types, avoiding Unicode-to-varchar column conversions; this is a query-shape precaution, not a claim of verified live seek plans. The adapter reads only existing User identity data and Arabic grant/version/session/receipt/message data. It writes only ArabicReadingSession, ArabicReadingActiveSession, ArabicReadingMessage and ArabicReadingMutation. No runtime user/grant/content/schema writer or generic SQL executor is exposed.

Raw parameterized queries use the existing Prisma transaction client without regenerating clients in linked dependency folders. Inserts are count-only and use server-generated UUIDs, avoiding returning-key readbacks. Owned queries bind user/region/grant; version and history relationships remain protected by the prepared Arabic schema. Transactions use Serializable, maxWait 5 seconds, timeout 15 seconds, and a maximum four attempts for recognized unique/deadlock conflicts. Other errors are sanitized, not blindly retried or logged with credentials.

Start inserts a frozen session, initial Arabic message, active pointer and receipt in one transaction. Resume inserts only its new request receipt. Listen compare-and-swaps revision and atomically persists state/message/receipt. Retake validates the current completed predecessor, inserts a reviewed fresh version snapshot and swaps the active pointer with compare-and-swap; old rows are never deleted, reset or updated. Failure of any message, pointer, CAS or receipt rolls the whole transaction back.

Request UUID scope is owner/activity/region across all operations. Canonical payload hashes include operation and route identity. Changed payload/operation reuse conflicts. Exact replay occurs only after current authorization and owned-target validation. Frozen receipt JSON is reprojected recursively rather than parsed and returned directly, including checks against target/version and future-phase forgery. After an unknown response, clients must still reconcile current state and not replace a newer revision with an old frozen receipt.

## Approved content and safe projections

Discovery uses only the three declared titles/counts and may show `available:false`. Actual passage content requires an explicitly published version, all three review flags, complete keys, the original PDF source hash, exact content digest and a reviewer record binding source/content/package hashes. The unapproved Phase 1 package is never imported or automatically treated as published.

The runtime private payload is intentionally separate from the draft authoring file:

- `schemaVersion:1`, source activity ID, title and approved Arabic profile.
- Original passage blocks and ordered chunks with block/UTF-16 source spans; chunks must cover each block exactly, without loss, reordering or more than 35 display words per chunk.
- Original numbered questions/options and complete private `keys` mapping.
- The version row carries source/package/content hashes, publication/review fields and `approvalJson` with matching hashes, `reviewer`, canonical ISO `approvedAt`, and true source/answerKey/speech approvals.

The loader validates bounded JSON, all question counts/numbers/labels/IDs, key membership, complete source spans, Arabic profile capabilities and approval binding. Stored session snapshots are digest-verified and remain independent of later version retirement/replacement. The API does not read the Downloads folder, source PDF, proposed keys or review HTML.

Learner projection explicitly copies safe fields at every level. Passage metadata, correct-option fields, keys, source digests, private snapshots, review metadata, raw assessments and media keys never pass through. Quiz questions appear only in quiz phase; only the learner's checked selections carry correctness. Unavailable assessment scores must be null, and unsupported prosody is omitted. Completed results must agree with all checked-correct source selections. No vocabulary mapping was approved, so vocabulary state/feedback remains disabled rather than inventing definitions or keywords.

The private payload format and schema constraints are engineering prerequisites, not academic approval. Synthetic tests deliberately use generated Arabic text and clearly labeled fake approval records; they never approve the real source. Q6 and the final Arabic editorial/key/speech decisions remain open under Phase 1.

## Verification and limits

Executed results are recorded in `PHASE3_VERIFICATION.json`:

- 92 focused Arabic/access/feature-flag/JWT HTTP checks across six Jest suites.
- 22 retained offline source/schema/provisioning checks.
- 246 existing English reading, STEP, NAFS and Primary service regression checks across four suites.
- Backend full no-emit type check; frontend application/contract type checks; four-way contract parity/privacy check.
- Full backend JavaScript and declaration emit with `tsc -p tsconfig.build.json --preserveSymlinks true --incremental false`; the runtime module and schema receipt manifest are present in the build output.

The ordinary Nest build on this linked-dependency worktree hits TS2742 in the unchanged `src/modules/learning/utils/lesson-progress-select.util.ts`, whose inferred declaration refers to the physical shared dependency directory. The explicit symlink-aware compiler option builds successfully without changing that existing utility, shared tsconfig, dependencies or application behavior. This is a local build-layout limitation, not claimed as a passed default Nest command; a normal isolated dependency install/deployment build remains the owner's later verification step.

The transactional fixture serializes and rolls back cloned synthetic state. It tests domain concurrency/atomicity but does not execute SQL Server locks, CHECK constraints or triggers. Repository tests verify real parameter construction, ownership predicates, CAS counts, receipt pins and retry classification against stubbed drivers. Actual SQL Server/provider/concurrency and hosted/device acceptance remain later owned-target checks. No app startup, live database, real user login, Azure Speech/AI/storage call, push or deployment occurred during this phase.
