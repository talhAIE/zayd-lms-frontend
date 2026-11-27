# Arabic Reading Phase 2 frontend contract handoff

The matching `feat/arabic_R` backend defines the independent Arabic API/storage/access boundary. This frontend phase adds only the shared learner contract, compile-time privacy/state examples and offline contract-parity check. No routes, player, transport, course discovery, layout, heartbeat or normal mode code changes.

Canonical contract: backend `src/modules/arabic-reading/arabic-reading.contract.ts`, mirrored in frontend `src/types/arabic-reading.contract.ts` and both repositories' `docs/arabic-reading/api.contract.ts`. Backend `PHASE2_CONTRACT.md` freezes the full route/state/recovery/access design; its synchronized frontend copy is `PHASE2_CONTRACT.md`.

Entry will be `/student/arabic-reading`, with activity/session children, under an isolated Arabic shell. Do not mount StudentLayout engagement effects. Use the current reading design and flow with Arabic copy/RTL. This is planned for Phase 5, not mounted today. Shared sign-in remains unchanged.

The learner contract has Arabic language profile, safe metadata, phase-discriminated session views, nullable unavailable scores, owned history pagination, latest checked selections and bounded private-media access. It excludes private answer keys/snapshots/review records/storage paths and exposes no quiz before the quiz phase. These TypeScript shapes do not replace Phase 3 runtime validation/projection.

Mode progress is only its own session position/result, with no LMS grades, progress, usage, rewards or reports. Both repositories keep the dedicated flag disabled by default; no frontend flag can grant access. The backend rechecks active ROW student status and explicit nonexpired Arabic grants on every read/write/replay/media request. Other testing grants give no Arabic access; there is no regional fallback.

Phase 1 still blocks publication: all three source activities remain draft and unchanged, with 24 inferred candidate keys, unkeyed Q6 and pending Arabic editorial/speech review. Never import authoring data into frontend `src`/`public` or hardcode a key to bypass this gate. Availability can be false while safe metadata cards exist; Start must remain disabled until backend approval.

```text
node dev/arabic-reading/contract-check.cjs
node node_modules/typescript/bin/tsc -p dev/arabic-reading/tsconfig.json
node node_modules/typescript/bin/tsc -p tsconfig.app.json --incremental false
```

The parity checker accepts the matching backend checkout root as an optional argument; its default is the sibling `arabic-backend`, not a historical STEP worktree. No synthetic example contains actual PDF passages or keys. The `@ts-expect-error` examples verify that unapproved private fields and fake unavailable-score zeroes cannot accidentally enter the typed learner interface.

Local checks pass; no hosted UI, real speech or live database acceptance is claimed. The owner deploys later; no push, SQL execution or content import occurred.
