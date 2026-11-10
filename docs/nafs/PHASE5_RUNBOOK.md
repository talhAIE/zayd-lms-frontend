# Phase 5 verification runbook

The teacher section is part of `/teacher/dashboard`; it uses `/api/v1/nafs/teacher/results`. Normal development remains backend `npm run start:dev` and frontend `npm run dev`. Both feature flags and explicit teacher/student/assessment grants must be present before results appear. Existing production student test accounts do not imply a teacher assignment.

## Isolated verification

These steps use only the owned local database and synthetic accounts. They do not read the backend `.env`, connect to production, approve PDF content or reset existing attempts.

1. In the backend, run `npm run nafs:test:bootstrap`, then `npm run qa:nafs:teacher`. Keep the latter running on loopback port 5019. It prepares twelve fresh synthetic forms and the three test-teacher scopes using existing local fixture accounts. Three forms are submitted with diagnostic scores; a fourth stays unfinished.
2. In the frontend PowerShell terminal, run:

   ```powershell
   $env:NAFS_TEACHER_DATABASE_QA='true'
   pnpm exec playwright test --config dev/nafs/playwright.config.ts teacher.spec.ts teacher-real-database.spec.ts service.spec.ts --timeout=30000
   ```

3. In the backend, run `npm run test:nafs -- --silent` and `npm run build`. In the frontend, run `npm run build` and `pnpm exec eslint src/components/nafs/NafsTeacherResults.tsx src/services/nafsService.ts src/pages/teacher/dashboard.tsx src/components/layouts/teacher-layout.tsx`.
4. Stop the diagnostic API with `npm run qa:nafs:teacher:stop`. This verifies unchanged normal LMS table hashes, deactivates only diagnostic forms, retains attempts and shuts down only the owned QA server. Existing development/preview servers are unaffected.

The original Phase 4 browser API command remains available; do not run it at the same time as the Phase 5 API, since both use port 5019.

## Evidence locations

Backend ignored `tmp/nafs-phase3/phase5-teacher.private.json` contains ephemeral QA tokens and is never committed or copied into frontend public assets. Backend ignored `tmp/nafs-phase3/phase5-teacher-report.json` records the post-shutdown database preservation check. Frontend ignored `dev/.nafs-qa/browser-report.json`, `teacher-1440.png` and `teacher-390.png` contain the local synthetic verification report and reviewed screenshots. Traces, if a test fails, remain under ignored `test-results/nafs`.

`docs/nafs/PHASE5_VERIFICATION.json` in each repository summarizes the passing evidence without credentials or private tokens. Testing actual production teacher accounts, original PDF academic approval and real-school assignment are separate authorized steps.
