# Arabic Reading Phase 3 frontend handoff

Date: 2026-11-27. Branch: `feat/arabic_R`.

The matching backend now mounts the independent Arabic discovery/overview, start/resume, owned session/history, listen acknowledgement and completed-run retake APIs. This frontend phase is handoff/plan documentation only. The Phase 2 learner contract is unchanged and remains in exact parity. No frontend route, layout, course card or transport has been mounted or changed.

Backend reference: `docs/arabic-reading/PHASE3_API.md` (also copied here). Requests use the frozen `/api/v1/arabic-reading` namespace, strict DTOs, real JWT/role guards, dedicated flag and fresh explicit ROW tester grants. An Arabic-specific claim guard denies missing/SAUDI region claims even where shared legacy authentication supplies a fallback. Errors are Arabic and no-store; never display raw network/framework messages as English mode copy.

Use stable UUID request IDs for Start, listen and retake. Keep the same ID/payload after unknown outcomes. The backend's immutable receipt replay can return an older revision: reconcile the owned session and never overwrite newer state. Start resumes a completed current session; only explicit retake creates its successor, with all old results/messages retained. There is no destructive reset or unfinished-run bypass.

Owned session views include at most 50 recent chronological messages; use the forward keyset history endpoint to retrieve older messages. Private source/key/snapshot/evidence fields are recursively excluded, including receipt replay. No signed-media transport is implemented yet: audio/media belongs to Phase 4, and quiz check/finish writers belong to Phase 7. Do not invent successful responses or attempt to grade in the frontend.

The real three-passage package remains unapproved and unimported. Cards can be unavailable; Start must honor the server's availability/error. No source answers or private authoring records may be bundled. The isolated Arabic shell/reading UI and no-heartbeat requirement remain Phase 5 work; do not reuse StudentLayout engagement effects merely to mount testing routes.

Backend verification: 92 focused checks, 22 retained source/schema checks, 246 existing-mode service regressions and full type checks pass. The backend emits with the documented symlink-aware compiler command; its default local Nest build has the existing linked-dependency TS2742 declaration limitation. No hosted acceptance, SQL Server execution, real speech, source publication or deployment is claimed. Frontend contract checks and application type check pass with no runtime frontend change. The owner deploys later.
