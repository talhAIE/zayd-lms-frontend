# STEP Phase 3 frontend handoff

The separate backend STEP API is implemented locally and remains disabled by default. At Phase 3 completion, production had only the empty schema from Phase 2. Phase 4 now uploads the draft content/audio, documented in `phase4-status.md`; application deployment and accounts/enrollments are still later rollout work. Frontend UI/service implementation remains Phase 5/6 work. Existing mode UI is unchanged.

Use the unchanged `src/types/step.contract.ts`, which matches the canonical backend contract. The complete routes and recovery semantics are documented in backend `docs/step/phase3-api.md`. Responses use `{ status: true, data: ... }` with the DTO directly in `data`, not `data.attempt`/`data.saved` wrappers.

Discovery is course -> ordered sections -> topic overview. Opening an overview does not start an attempt. Explicit Start returns a new/existing attempt, or a final result if already submitted. The three topics are independent. Unfinished responses contain choices, revision, passage/audio metadata and saved selections; they never contain correctness or scores. Submitted responses contain only final marks/completion, with no answer review or retake.

Serialize/coalesce saves and retain stable request IDs for uncertain retries. On revision conflict, reload the owned server state and resolve differences before creating a new mutation ID. Submit only after all saves settle and send the exact complete saved selection set. After an uncertain submit, freeze editing and recover the same attempt/result. Reusing an existing request ID with a different payload/operation conflicts. Clear/abort account-bound views and requests on logout, region/account switch, or access revocation.

Listening access is POST `/api/v1/step/attempts/:id/audio/:assetId/access`, authorized only for an owned, active, unfinished Listening attempt. It returns an HTTPS read-only blob URL expiring after four minutes. Use native audio controls/range seeking, keep the player mounted across questions, refresh access on expiry, and discard/pause the player on account changes. Never persist/log its URL. The backend verifies private-container and blob integrity metadata before signing; actual production playback is a later rollout check.

`STEP_DISABLED` is an expected HTTP 503 while the flag is off. It must not blank other course requests. Enabled students without persistent STEP enrollment get no STEP course. No username `.env` allowlist or grade-based automatic access is used. Saudi remains unprovisioned and is denied before any provider fallback.

All 61 focused STEP tests and the full backend regression suite pass; frontend type check and contract parity pass. These are synthetic/compile checks, not production browser acceptance. The eleven Nouns findings still block publication. No frontend runtime code changed in this phase.
