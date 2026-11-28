# Phase 8 — isolation, regression and local acceptance

Completed locally on 2026-11-28 on both `feat/arabic_R` branches. This phase adds acceptance coverage and repeatable audits; production Arabic/shared runtime, schemas and sealed source content are unchanged from Phase 7. Both feature flags remain default-off. No deployment, push, DB apply, live grant, content publication or external speech operation occurred.

## Results and limits

| Check | Observed result |
| --- | --- |
| Broad backend regression | 759 pass, 17 inherited failures, 25 deliberately skipped; 46 passing suites, 2 failing, 1 skipped |
| Arabic/access/feature checks within that run | 258 pass, including 26 new route-denial cases |
| Other existing backend regressions within that run | 501 pass across reading, speech, avatar, mode sessions, Primary, STEP and NAFS |
| Supplemental inherited HTTP fixtures with current JWT claim | All 17 pass in 2 suites; original fixtures/auth stay unchanged |
| Source/schema/provisioning/isolation Node tests | 26 pass |
| Existing STEP/NAFS frontend transport/session tests | 60 pass; no skips or retries |
| Existing frontend offline regression scripts | 14 pass, including English reading, socket auth, completion/MCQs and avatar reading/listening/roleplay/refresh/narration |
| Existing English recorder browser check | Pass at 390 and 1280 pixels using generated audio, including late permission/unmount and timeout recovery |
| Arabic HTTP/JWT/browser integration | 33 scenarios, 110 assertions; 17 mobile and 16 desktop scenarios |
| Arabic layouts | 422 assertions, 56 scene/viewport combinations, seven sizes, three synthetic 10/6/9-question journeys |
| Presentation and contracts | 30 presentation assertions; four contract copies match and private authoring content is excluded |
| Builds | Full frontend TypeScript/Vite and backend TypeScript pass; full backend JS/declarations emit with `--preserveSymlinks true` |

The broad backend run is **not green**. Its only 17 failures are the baseline STEP HTTP suite (9) and NAFS HTTP suite (8). Their original JWT signing fixtures omit `authVersion: 'password-v1'`, so unchanged production authentication responds with 401 before those flows execute. The isolation audit pins both fixture files, the JWT strategy and password policy to STEP baseline `f876ec6`, with normalized hashes in the verification JSON.

The supplemental run uses `phase8-legacy-jwt-transform.cjs` to add that claim only to the two pinned signing expressions in test memory. It runs the actual existing controllers/guards/assertions: all 17 pass. It does not weaken production auth, edit or skip original tests, or replace the raw failing evidence. Raw and supplemental results are reported separately. Twenty-four optional NAFS-practice DB tests and one Primary DB test were deliberately skipped with real DB settings disabled; they are not passes.

The standard Nest build still fails with inherited TS2742 at unchanged `src/modules/learning/utils/lesson-progress-select.util.ts:4` because this worktree uses linked Prisma dependencies. The symlink-aware compiler emits JS/declarations successfully without shared source/config/client changes. Frontend pdfjs-eval and large-chunk warnings remain. Frontend QA TypeScript lint passes. Backend fixture lint uses explicit existing mock/formatting exceptions; this is not whole-repository lint acceptance. New CJS tools pass syntax checks. Sandbox process restrictions initially prevented Node workers/ffmpeg/Git from spawning; final results above come from reruns permitting only the needed local process execution.

## Isolation evidence

- Thirteen routes each reject disabled and unprovisioned access with Arabic 503/no-store responses **before any storage transaction, codec or speech call**. Existing JWT, role, explicit-region, owner, active-account, revocation, replay and concurrency tests also pass.
- `scripts/arabic-reading/phase8-isolation.cjs` audits the backend against `f876ec6`: only Arabic runtime plus its module registration/two flag entries exist in the production source diff. Parameterized static SQL writes target only `ArabicReadingSession`, `ArabicReadingActiveSession`, `ArabicReadingMessage` and `ArabicReadingMutation`. Negative audit fixtures reject a legacy table write/import/startup hook. This static audit complements repository/HTTP tests; it does not prove actual SQL Server execution plans or locks.
- `dev/arabic-reading/isolation-check.cjs` audits frontend against `c6b4701`: only isolated Arabic runtime and two sibling routes differ. Original recorder, pending audio, uploader, API configuration and StudentLayout match baseline. Arabic stores are separate; no normal progress/session/engagement transport is imported.
- Arabic media remains process-private, bounded (32 MiB/64 narration entries), authenticated and no-store, with owner reauthorization even on cache hits. Upload limits, timeout/protocol restrictions, unavailable scores and duplicate/cancel receipt behavior are covered by existing passing Arabic tests. No public SAS URL or shared media writer was added.
- Integrated browser traffic contains no normal LMS API/engagement/socket request. Default-off UI creates no auth/progress storage or API call. Existing mode/layout/auth sources and sealed content/schema digests remain intact; no shared Prisma client was regenerated.

## Browser and source acceptance boundaries

Local Arabic integration runs real frontend/controller/IndexedDB/transport and Arabic Nest/JWT/DTO/session logic, alternating 390×844 and 1280×800 viewports. All previous recording recovery and quiz mutation uncertainty cases run, including refresh/reconnect, lost replies, interrupted/discarded uploads, storage failure, permission/silence/unclear/unavailable states, account replacement/revocation, all three completions and immutable retakes. Layout checks additionally cover native keyboard radio order, dialog focus/escape, original option order, exact Unicode/diacritics, mixed numerals, narrow/short screens and reduced-motion styling. Desktop reading, mobile quiz and mobile feedback screenshots were inspected; six generated screenshots stay in ignored local test output.

Accounts, grants, keys, SQL transactions, speech/AI/codec results, device bytes and narration in integration are **synthetic**. The English recorder uses browser MediaRecorder with a generated oscillator stream and fake/deferred permission. No actual microphone, learner account, Azure/AI service, actual SQL Server or Arabic teacher acceptance is claimed. Network guards block nonlocal browser requests and nonlocal TCP in backend regression runs; those backend runs reported zero nonlocal attempts. Only the isolated Arabic test module was started, never the inherited application bootstrap/migration path.

The three PDF passages remain pages 5/7/8, with 10/6/9 questions and all 100 source choices. All source/schema tests pass. The 24 candidate keys remain unapproved, Q6 stays present with a null key because its supplied choices conflict with its passage, and Arabic editorial/diacritic/speech reviews remain pending. Original-source publication still fails closed. Synthetic completion is not source activation or client acceptance.

## Reproduction

From the backend worktree, with `PRIMARY_TEST_DATABASE_URL` empty and `NAFS_PRACTICE_REAL_DB=false`:

```text
node --require ./test/arabic-reading/offline-network.cjs node_modules/jest/bin/jest.js --runInBand --silent --testPathPattern="modules/arabic-reading|lms-feature-flags|modules/primary|modules/nafs|modules/step|modules/avatar-reading|modules/mode-sessions|modules/speech" --cacheDirectory tmp/arabic-reading/jest --json --outputFile=tmp/arabic-reading/phase8-jest.json
node --require ./test/arabic-reading/offline-network.cjs node_modules/jest/bin/jest.js --config test/arabic-reading/phase8-legacy-jwt.config.cjs --runInBand --silent
node --test test/arabic-reading/content-package.test.cjs test/arabic-reading/phase2.test.cjs test/arabic-reading/phase7-source.test.cjs test/arabic-reading/phase8-isolation.test.cjs
node scripts/arabic-reading/phase8-isolation.cjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.build.json --preserveSymlinks true --outDir tmp/arabic-reading/phase8-build
```

Start only the synthetic backend on loopback 5026, then the two isolated frontend Vite configs on 5196/5195 (no inherited `.env`):

```text
# Backend, separate terminal
node -r ts-node/register -r tsconfig-paths/register test/arabic-reading/phase6-local-server.ts --synthetic-local-only
# Frontend, separate terminals
node node_modules/vite/bin/vite.js --config dev/arabic-reading/vite.integration.config.ts
node node_modules/vite/bin/vite.js --config dev/arabic-reading/vite.config.ts
# Frontend checks
node dev/arabic-reading/integration-check.cjs --phase8
node dev/arabic-reading/browser-check.cjs
node dev/arabic-reading/recorder-regression.cjs
node node_modules/@playwright/test/cli.js test --config dev/arabic-reading/existing-modes.config.ts
node dev/arabic-reading/presentation-check.cjs
node dev/arabic-reading/contract-check.cjs
node dev/arabic-reading/isolation-check.cjs
node node_modules/typescript/bin/tsc -p dev/arabic-reading/tsconfig.preview.json
npm run build
```

Run the 14 existing `dev/<name>.cjs` regression scripts listed in `PHASE8_VERIFICATION.json`. Restore only generated tracked frontend `tsconfig.app.tsbuildinfo`/`tsconfig.node.tsbuildinfo` after building. Test reports/audio/screenshots/build output remain ignored; matching versioned JSON in both repositories records aggregate results, inherited failures and local report SHA-256 digests. Phase 9 owner deployment handoff is next; real content/speech/device/SQL gates remain open.
