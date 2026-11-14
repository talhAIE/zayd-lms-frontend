# Phase 6 — Durable practice sessions

Implemented locally on `feat/nafs_PM`, 2026-11-14. Practice remains disabled by default on the backend. No deployment, production access, database/storage operation, client upload, publication or grants.

## Learner flow

The collection overview now enables Start practice, Resume practice or View practice result from backend state. Resume/result links open the known owned run without creating another. Start retains its request identity until the target run is confirmed. A completed result offers an explicit Practice again action; repeating names that immutable predecessor and retains its exact request across retry/reload/reopened tabs. It never resets an old run or implicitly repeats from normal Start.

Selections immediately clear their current feedback and autosave through a practice-owned serial writer. Rapid edits coalesce behind any in-flight save. Check Answer drains those saves and checks the intended current option at the next server revision. New deliberate checks animate once; restored/reconciled feedback and receipt replays do not animate. Only latest matching accepted checks count toward Finish; saving alone does not grade and changing back still requires another deliberate check.

Finish requires all current answers checked, no pending/failed writes or conflict, then explicit confirmation. Its request contains only revision and request ID. The immutable server summary supplies the final marks. Prior runs/incorrect checks remain server history. Completing clears recovery only for the matching owner/region/collection/version/run, including that completed run's tab backups.

## Persistence and recovery

- Recovery keys contain account ID, username, student role, physical region, collection, frozen version and session. They are separate from Quiz Mode drafts. Pre-start receipts use their collection scope; repeat receipts use the completed predecessor scope, with the backend binding the resulting version/run.
- A tab keeps its current recovery record in session storage and writes a persistent local-storage backup before dispatching mutations. Each document has a unique backup writer identity, including opener-cloned tabs. One tab cannot overwrite another tab's backup.
- Reopening a tab offers matching recovery copies explicitly. Choosing a copy restores only validated question/option choices, recheck requirements and pending request identity, then requires reconciliation/review. Multiple copies are not silently merged. Use saved server choices leaves other copies intact until that run is completed.
- Drafts contain no questions, passages, answer keys, correctness history, classification, source packages, credentials or image URLs. Malformed, oversized or wrong-snapshot choice/request records are ignored. Corrupt backup entries do not hide valid copies.
- Storage/quota failure freezes new mutations rather than sending an operation without durable recovery identity. The learner can allow storage and reconcile. Server-owned reads/results remain authoritative.
- Uncertain saves/checks/completion freeze dependent edits. Recovery reads the owned run, replays the exact payload if still needed, and reads again. Replayed old receipts cannot regress a newer revision. Lost completion resolves to the stored summary; it never starts a new run as recovery.
- Revision conflicts preserve local choices and load current server state. Keep local choices and Use server choices are explicit decisions; no silent rebase. Offline before acceptance and lost replies after acceptance are both supported. A real two-tab browser test verifies conflict handling.
- Logout/account/role/region change aborts transport and disposes state/media; stale responses cannot update the next account. Existing cross-tab logout can redirect to login. Revoked access hides loaded practice. The shared refresh identity includes role and region so a late refresh cannot rotate another region's tokens.

## Isolation and verification

The existing Quiz player/session/transport/media/text, shared answer effects, teacher results, ordinary Courses aggregates, contracts and backend runtime/schema/migrations are unchanged. The shared Axios refresh change is one identity-expression extension, with a hash-based preservation audit and positive/negative refresh tests. It does not replace the existing authentication/refresh queue.

The final broad run passed **85 tests**, zero failures/skips/flaky tests; a final two-case receipt/closed-tab recheck also passed after lazy writer initialization. Types, lint, build, contract/privacy and preservation checks passed. Final sanitized counts and evidence: backend `docs/nafs/practice/PHASE6_STATUS.md` and `PHASE6_VERIFICATION.json`. Browser verification uses loopback Vite with synthetic API DTOs and a coded PNG. No real student or database is used. Existing Quiz smoke/recovery tests reuse established learner-only fixtures. Screenshots/reports/traces are ignored.

```powershell
node node_modules/@playwright/test/cli.js test --config dev/nafs/playwright.config.ts practice-session.spec.ts practice-service.spec.ts practice-journey.spec.ts practice-player.spec.ts practice-navigation.spec.ts courses.spec.ts recovery.spec.ts service.spec.ts session.spec.ts --workers=3
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/nafs-practice src/pages/student/nafs/NafsPracticeSession.tsx src/pages/student/nafs/NafsNavigation.tsx src/services/nafsPracticePlayerService.ts dev/nafs/practice-session.spec.ts dev/nafs/practice-service.spec.ts dev/nafs/practice-player.fixture.ts dev/nafs/practice-journey.spec.ts dev/nafs/practice-player.spec.ts dev/nafs/practice-navigation.spec.ts
node dev/nafs-practice/contract-check.cjs
node node_modules/vite/bin/vite.js build
```

Backend preservation audit: `node scripts/nafs-practice/validate-phase6.cjs`. It retains the original baseline and additionally verifies that the shared auth file reconstructs exactly to frontend `b02b280` after removing the role/region identity addition.

The shared Axios file has eight existing `no-explicit-any` lint warnings and no errors; new practice code/tests lint cleanly. Vite retains PDF.js eval and large-chunk warnings. No dependencies or lockfiles changed. Persistent browser recovery requires available browser storage; server grant/publication/region rules remain authoritative. SQL Server runtime verification remains a Phase 10 gate.

Next: Phase 7, full development verification/release preparation. Corrected client content still begins in Phase 8.
