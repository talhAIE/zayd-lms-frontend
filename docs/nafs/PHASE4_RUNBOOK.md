# NAFS Phase 4 student UI and local verification

Frontend branch: `feat/nafs_f`. Backend companion tooling: `feat/nafs_b`. No production connection or real-school/account mapping is needed for this workflow.

## Student flow

Login -> existing Courses -> granted NAFS subject -> overview -> Start/Resume -> answer questions -> review completion -> confirm Finish -> final marks. Completed cards offer View marks. The normal student layout, sidebar, card styling, typography and buttons are reused. No new sidebar mode is added.

Routes are `/student/nafs/assessments/:assessmentId` and `/student/nafs/attempts/:attemptId`. The latter loads an existing attempt and renders only final marks when submitted; opening the URL or navigating back does not start another attempt. Backend authentication, feature flags and explicit grants remain authoritative. Grade labels never grant access. A disabled or absent discovery API returns no cards; discovery failures provide a NAFS-only reload action and do not hide ordinary cards.

NAFS uses its own service and attempt session, without dispatching normal learning completion, achievements or reporting actions. Shared authentication and refresh interceptors are reused with a request-local identity/abort guard. The layout excludes NAFS quiz routes from normal engagement heartbeat accounting.

## Saving and recovery

Selections stay visible while navigating. One serial writer saves them with server revisions and unique request IDs. The UI distinguishes saving, saved and failed states. Failed requests retain their exact payload for safe replay. Another tab's changes cause a server reread and explicit choice between saved answers and this tab's pending answers; they are not silently overwritten.

Pending selections are recoverable in tab-scoped `sessionStorage`, keyed by student ID, username and attempt ID. Only learner selections are stored, with no keys, correctness or score. A reload rereads the server first, filters any local recovery to valid options in that attempt, and asks before saving recovered differences. Confirmed saves and submission remove the recovery data. Browser storage failure does not prevent server saving. Closing/reloading with unconfirmed work shows the browser's standard unsaved-work warning. The existing application logout behavior is retained; another student's session never reads the prior student's scoped recovery key.

Finish requires every answer and confirmed saves. The session also drains the writer and submits the complete final snapshot. While submission is uncertain, edits are disabled; checking reads the original attempt and, if needed, replays the same immutable request. A new attempt is never used as recovery. Submitted UI contains no questions, keys, explanations, answer review or retry.

Images are fetched as authenticated PNG bytes through constructed NAFS asset routes and rendered as Blob URLs. Tokens never enter image URLs; arbitrary content URLs are not fetched. Requests are aborted and Blob URLs revoked on cleanup. Original facsimiles preserve equations, tables and diagrams. Options retain separate image/text choices. Reading passages stay alongside questions on desktop and open in an accessible panel on mobile, with an optional text transcript and preserved emphasis. Image expansion supports scrolling and device zoom.

## Local browser verification

```powershell
pnpm install --frozen-lockfile
pnpm run qa:nafs
pnpm run build
```

Playwright starts an isolated Vite dev server on `127.0.0.1:5179` with its API origin overridden for that dev process only. Windows uses installed Microsoft Edge (Chromium); other platforms default to Playwright Chromium. Set `NAFS_BROWSER_CHANNEL` to override the channel and install that browser if needed. The tests block external requests. They never use the frontend `.env` API origin.

The source-preview adapter reads only the backend's Phase 1 learner package and PNGs, projects the learner API shape, and checks image hashes before delivery. It never reads private answer keys or publishes database versions. Preview marks are diagnostic values, not verification of source answer correctness. Each of eight forms is exercised at desktop 1440x1000 and mobile 390x844; screenshots cover every original question. Asset decoding/dimensions, no page overflow, native keyboard radio selection, passages, zoom, save/reload, all-required finish, final locking, ordinary course navigation and denied/disabled access are checked. Screenshots/traces and operational JSON are ignored under `test-results` and `dev/.nafs-qa`; do not publish traces containing test authorization headers.

## Real PostgreSQL and Nest browser integration

First prepare the owned Phase 3 target. From the backend:

```powershell
npm run nafs:test:bootstrap
npm run qa:nafs:browser
```

Leave the QA API running. It binds only `127.0.0.1:5019`, uses the verified owned database and real NAFS controllers/services/repository/JWT/role/DTO checks, and creates three explicitly synthetic two-question assessments. Ordinary AppModule integrations and `.env` clients are never started. Only the existing neutral test accounts receive grants; original PDF versions remain draft. A private one-hour QA session file is written under the backend's ignored `tmp/nafs-phase3`, outside the frontend web root.

From the frontend in another terminal:

```powershell
$env:NAFS_REAL_DATABASE_QA='true'
pnpm run qa:nafs
Remove-Item Env:NAFS_REAL_DATABASE_QA
```

Three additional browser cases exercise real persistence: 2/2, 0/2 and 1/2 scores, saved-answer resume, permanent completed state and exact matching teacher API results. The teacher dashboard UI is Phase 5. The real cases are explicitly skipped when not opted in; a default preview run is not evidence of real database integration. Re-running the real cases needs a fresh QA API run because attempts are never reset.

After testing, from the backend:

```powershell
npm run qa:nafs:browser:stop
npm run nafs:test:stop
```

The guarded stop deactivates the three diagnostic assessments, retains attempts, verifies all 44 normal tables are unchanged and original forms remain unpublished, and writes a sanitized `phase4-browser-report.json` under the backend scratch directory. The second command stops only the owned test database; the existing PostgreSQL Windows service remains untouched. No production flags, accounts, storage or databases are changed.

After a full real-database browser run, API shutdown and frontend build, generate sanitized evidence from the frontend with `node dev/nafs/summarize.cjs dev/.nafs-qa/browser-report.json`. It requires all source-preview and real-database cases, verifies 126 source screenshots and bundle boundaries, and writes `docs/nafs/PHASE4_VERIFICATION.json`. Source screenshots are archived under ignored `dev/.nafs-qa/screenshots` before a later focused run can clear Playwright's output. Multiple JSON report paths may be supplied in chronological order for focused final reruns; each case's latest executed result must pass. Skipped real-database cases cannot satisfy the real integration requirement.

Original-content publication still requires the seven academic findings to be resolved. Source preview visual verification does not supply that approval. SQL Server execution remains a separate outstanding provider acceptance step.
