# Phase 4 — Course and mode navigation

Completed locally on 2026-11-13 on `feat/nafs_PM`. This phase adds read-only navigation. Practice remains disabled by default on the backend; no deployment, production access, client content upload or grant changes occurred.

## Implemented behavior

- Existing NAFS subject/grade cards open `/student/nafs/courses/:courseId` with Quiz Mode and Practice Mode cards.
- Quiz Mode opens the unchanged assessment overview. Assessment/attempt bookmarks and locked results remain unchanged. A chooser 404 falls back only when the existing course list confirms the authorized legacy assessment; network/503 failures offer retry and a Quiz link.
- `/student/nafs/courses/:courseId/practice` lists only backend-returned collections with title, question count, total marks and practice state. It does not hard-code Quiz 1 or infer access by grade.
- `/student/nafs/practice/collections/:collectionId` shows collection instructions, confirmed practice rules, backend counts/state and navigation back to its parent course. Optional course-title failures do not block the overview.
- Loading, unavailable, disabled, empty, denied and retry states are separate. NAFS discovery failure does not block ordinary courses. The ordinary empty-curriculum message waits for NAFS discovery and is suppressed on a discovery error.
- The existing Courses aggregate still counts each NAFS quiz at most once; practice runs, marks and progress are never added. Course-card counts/status explicitly say Quiz Mode; practice state appears only on practice pages.
- Reuses the student layout, Outfit typography, existing buttons, blue headers, rounded panels, responsive grids, focus styles and 44px minimum navigation targets. No taxonomy or private authoring data is rendered.
- Discovery uses shared bearer authentication/refresh, bounded requests and abort lifetimes. Practice reads additionally bind to account ID, username, student role and physical region. Missing region asks for a fresh login; it never defaults to ROW. Late responses after owner/region changes are rejected.

## Phase boundary

The overview's Start/Resume/View result button is intentionally disabled with a learner-facing availability message. No practice session route or mutation is registered by this phase. Phase 5 implements question presentation/animations; Phase 6 connects durable start/resume/completion/repeat behavior. These disabled actions must be connected before release acceptance in Phase 7. Viewing a course, list or overview cannot create a run or consume an existing Quiz attempt.

## Verification

All **58 distinct checks** passed: 15 final navigation cases and 43 existing course/Quiz/recovery/transport/session regressions. The broad run passed 56 tests; the final navigation rerun passed 15 (71 passing executions total, zero failures/skips). Types, production build, changed-code lint, contract parity, source preservation and bundle-marker checks also passed. Desktop/mobile screenshots were inspected. Vite reports PDF.js `eval` and large-chunk warnings.

See the execution record in backend `docs/nafs/practice/PHASE4_STATUS.md`. Browser verification uses loopback Vite with synthetic API DTOs. Practice fixtures contain no client questions or private keys. Existing Quiz regressions use the established learner-only fixtures; no database is contacted.

Repeat commands from the frontend root:

```powershell
node node_modules/@playwright/test/cli.js test --config dev/nafs/playwright.config.ts practice-navigation.spec.ts courses.spec.ts student.spec.ts recovery.spec.ts service.spec.ts session.spec.ts --reporter=list
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
node dev/nafs-practice/contract-check.cjs
node node_modules/eslint/bin/eslint.js src/pages/student/nafs/NafsNavigation.tsx src/services/nafsPracticeDiscoveryService.ts src/components/nafs/NafsCourseCards.tsx src/pages/student/courses.tsx src/routes/index.tsx dev/nafs/practice-navigation.spec.ts
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
```

Current source preservation audit from the backend root:

```powershell
node scripts/nafs-practice/validate-phase3.cjs --phase4
```

The original no-argument Phase 3 audit deliberately rejects Phase 4's course-card, course-discovery status and route integrations. The explicit Phase 4 option reverses only those reviewed edits before comparing original hashes. It does not refresh or relax the frozen baseline.

Next: Phase 5, player and answer animations. SQL Server runtime migration verification remains a Phase 10 pre-apply gate.
