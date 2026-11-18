# AI socket authentication recovery

Local `feat/step` fix, 18 November 2026. No UI markup/styles, grading rules, ordinary request deadlines, Azure settings or deployments are changed.

Authenticated lesson, normal-chat and legacy 3D sockets now read the current access token at each handshake. When authentication fails, they join the same owner-bound token rotation promise as HTTP 401 recovery, then explicitly reconnect once. Existing connection listeners restore the same activity/history. The recovery helper never replays an answer or recording and stops when its component is disposed or its account changes. A rejected replacement token cannot cause an endless refresh/reconnect loop. Application-confirmed session restoration permits a later independent expiry to recover.

The shared HTTP refresh path retains its existing timeout and sign-in fallback. It now prevents an old account's HTTP request from being replayed after account replacement. Account switching during refresh cannot overwrite or log out the new account. Blocked/duplicate/network errors retain their existing handling. HTTP-backed avatar transports and guest demo adapters continue through their existing paths.

Validation:

```text
node dev/socket-auth-recovery-check.cjs --loopback
node dev/science-service-check.cjs
node dev/roleplay-upload-recovery-check.cjs
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
```

The authentication check includes a real loopback Socket.IO server that forcefully disconnects an expired credential, accepts one shared refresh, and restores the same lesson/session. Other cases cover shared HTTP/socket refresh, latest-token handshakes, blocked/duplicate failures, unmount, cross-account replacement, late HTTP 401s, rejected fresh credentials and failed refreshes. These tests use synthetic credentials and do not call Azure, external AI or production students.

Final local results: 11 authentication checks passed; 10 existing Science/shared-HTTP transport checks passed; roleplay upload recovery, avatar roleplay, reading audio upload, Science practice, writing review and STEP contract parity checks passed. NAFS frontend regression checks totaled 129 passed, with six opt-in real-database browser tests skipped. One source-layout test initially lacked worktree-local reference files and passed after linking the existing fixtures and rerunning it. Synthetic reading-recorder checks passed at 390px and 1280px. Frontend type checking and the production build passed; the existing bundle-size warning remains.
