# NAFS Practice Phase 3 frontend handoff

Backend Phase 3 is completed locally on 2026-11-13 on `feat/nafs_PM`. Phase 4 frontend course/mode navigation is next. No frontend route, service, player or course-card behavior changes in this handoff.

The frozen learner contract is now implemented by the backend. All four copies remain identical; the header comment now identifies backend runtime delivery. The matching backend `docs/nafs/practice/PHASE3_STATUS.md` documents the endpoints, configuration, recovery rules and executed evidence.

Use the additive `/api/v1/nafs/courses/:courseId/modes` endpoint for the chooser and `/api/v1/nafs/practice` endpoints for independent collection/session state. Practice uses its own flag and both parent assessment and explicit practice grants. Disabled or failed practice discovery must not hide Quiz Mode. Existing quiz routes and final-only results are unchanged.

Save choices separately from Check Answer. Only newly accepted check response IDs should animate. Retain exact pending payload/request ID on uncertain responses; reconcile the same owned session before replaying. Changing a checked selection requires another accepted check before completion. Final marks come from server-confirmed latest checks. Explicit repeat receipts pin a successor and may return its completed summary on replay; never use Start or a new Repeat request as automatic recovery.

Practice snapshot references are persisted version-bound UUIDs. Learner responses contain no hidden Domain/Strand/Outcome/Indicator/provenance fields or private key/path data. Images are authenticated PNG API bytes, never private blob links. Practice requests/drafts must bind user ID, username, role and region, and respect session/version/collection lifetime.

Verification: 110 backend tests passed in eleven suites, including 21 real HTTP/JWT/PostgreSQL cases, 250-question loading, concurrency/replay, rollback, version changes and access isolation. Backend build/types/runtime lint and frontend types/contract checks passed. SQL Server runtime verification remains a pre-production requirement. Only clearly labeled local synthetic fixtures were provisioned; no production settings, client content, real grants, push or deployment changed.
