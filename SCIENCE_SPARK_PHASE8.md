# Science Spark Phase 8 — Vercel handover

The user requested Phase 8 on 2026-10-07 and confirmed the frontend provider is **Vercel**. Local preflight/handover is prepared on `feat/sciencespark`; **production rollout remains pending**.

`npm run qa:science-spark:phase8:preflight` verifies four local checks: existing Vercel SPA rewrite, passing release/auth/Practice URL evidence, the backend's user-confirmed Vercel record and zero production mutations while blocked. It writes `SCIENCE_SPARK_PHASE8_VERIFICATION.json`. `--require-ready` exits 2 while rollout is pending. This tool never deploys and does not add a gate to a cloud workflow.

The exact cloud project/domain, linked release ref, production API origin and deployed version are unverified. Local Vercel metadata is absent; this does not establish whether a cloud project exists. The Netlify development-tunnel redirect is not the selected production configuration and was left untouched. No environment values, hosting credentials, provider settings or production feature code were changed.

Verify the real Vercel project's production `VITE_API_BASE_URL` against the matched reviewed LMS production backend origin, without `/api/v1`, because `ApiConfig` appends the suffix. Review the actual deployment ref to ensure it contains Science commits. Capture the currently deployed last-good version for rollback. Do not guess project IDs, domains or API origins.

Backend fresh preflight passed eight existing production schema/account checks and loaded all 31 scoped sections from private storage without local content files, database writes or uploads. Nine backend preflight checks passed. Actual image execution, playable Kahoot assignment, full generic-course browser regression and actual 200% zoom still block Phase 7 readiness. The exact hosting project and authenticated deployment/current-version configuration checks also remain pending.

See backend `docs/science-spark/PHASE8.md`, `RELEASE.md` and `phase8-preflight-verification.json`. No push, deployment, production configuration change or pilot enablement occurred. The Phase 8 request authorizes work once the dependencies are verified; this handover does not claim Phase 8 is complete.
