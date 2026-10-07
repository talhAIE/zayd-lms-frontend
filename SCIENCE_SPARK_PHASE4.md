# Science Spark Phase 4 viewer

Implemented locally on `feat/sciencespark`. `src/components/science/ScienceHtmlViewer.tsx` renders an authenticated, activity-scoped payload in an opaque script-enabled frame with safe JSON/CSS assembly, a restrictive CSP, embedded images, validated source/nonce/activity messages and visible Retry. It never handles completion or receives a JWT.

Callers must pass a stable content object, a `sessionKey` that changes with account/session identity, and parent-owned back/select/retry callbacks. Changing content/session remounts the frame with a new nonce. Unmount the viewer on logout or authorization loss. Full API loading/course/unit/completion integration belongs to Phase 5; no production Science routes/cards are mounted yet.

The dev harness is `science-spark-harness.html` with source under `dev/`. From the backend, build then run `npm run qa:science-spark:phase4:runtime` to generate ignored fixtures from real private Azure blobs. Start frontend Vite on loopback port 5180 and open the harness. Its fixture middleware is restricted to local/loopback requests and development; generated files stay under `dev/.science-spark-fixtures` and are absent from production builds.

Application/harness typechecks and frontend build passed. Browser evidence covers all 30 lesson sections, 16 local checks, vocabulary, read mode, four calculators, graph toggles, images, invalid hashes, 18 bridge/escaping assertions, Retry recovery and desktop/mobile layout. Detailed results and screenshots are versioned in the backend's `docs/science-spark/PHASE4.md` and related Phase 4 reports.

Docker is unavailable locally. The compiled backend loader was verified from an empty working directory against private blobs; actual production-image execution remains a release check. Nothing is pushed or deployed.
