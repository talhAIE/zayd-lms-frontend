# Phase 10 — production drafts, deployment deferred

Frontend handover record: no frontend application source changed or deployed in this phase. The operational scripts and four verification reports referenced below live in the `zayd-lms-backend` repository; run verification commands there.

Production schema, private media and draft-content work is complete for the user-approved scope. Application deployment is explicitly deferred. The original full Phase 10 exit gate remains open until compatible backend/frontend builds are deployed with Practice Mode disabled and authenticated Quiz health is verified. Do not publish, grant access or enable Practice Mode in Phase 11 before that gate passes.

The user explicitly requested direct production execution because no isolated SQL Server target was available, then selected **“Keep commits local; defer app deployment.”** All source commits remain local. Production rollback rehearsals are reported as production checks; no isolated SQL Server execution is claimed.

## Production result

- ROW Azure SQL: `tutor-lms-prod-sql` / `zayd_lms_prod`; identity and engine edition verified before writes.
- Twelve additive practice tables, 23 foreign keys, 14 checks, 19 triggers and two filtered unique indexes. Original Phase 2/7 migration hashes remain intact.
- Eight inactive course/Quiz 1 collections with eight draft/pending versions, **701 questions, 701 answer keys, 20 passages and 1,063 asset records**. All classification/provenance and source keys match the sealed package. No Form A versions or questions were replaced.
- Private container `nafs-practice-private-content` in `zaydlmsprodstore2026`; content-addressed PNG objects retain their approved bytes, hashes, dimensions and MIME metadata. Every anonymous asset request was denied with Azure's exact `PublicAccessNotPermitted` response (HTTP 409).
- English/Math for Grade 3; English/Math/Science for Grades 6 and 9. No Science 3 source was supplied or invented.
- Package digest: `5b2707b34cc3dbf7aa258b28321e64048deac70766e444d26321b805ef7ec48b`.
- Repeat import creates zero courses, collections or versions. A separate read-only verification reconciles every question's full content/taxonomy/provenance, key, passage and asset field. All eight versions remain draft/pending; all courses and collections remain inactive.
- Zero practice grants, sessions, selections, responses and mutation receipts. No supplied version was published, no flag/settings were changed and no application was pushed or deployed.

## SQL Server correction

The first two atomic imports rolled back because the SQL Server Unicode `LIKE` predicate rejected valid option IDs such as `option-a` and `option_a`. The original synthetic fixture IDs `a`/`b` did not expose that behavior. Read-only evaluation isolated it; the sealed questions themselves passed the authoring contract.

The separate, hash-pinned `prisma/nafs-practice/phase10/001_sqlserver.sql` changes only `PM_question_options`. It removes literal hyphens before validating the remaining ASCII character class. Original migration files and all package questions/keys/IDs remain unchanged. A rollback rehearsal passed before applying the correction. All 701 questions then passed the deployed SQL predicate, and the SQL integration fixtures were strengthened to use hyphens and underscores.

## Verification and preservation

Both the original schema and the option-validation correction had successful production rollback rehearsals before commit. Twelve SQL Server constraint/history checks passed using distinctly labeled synthetic records, with every write rolled back: two-option single answers, exact-set multi answers, long written answers, incorrect-to-correct retry history, latest-answer completion marks, append-only responses/receipts, published-content freezing, cross-version ownership, duplicate active runs/sequences, correctness enforcement and immutable completed runs.

Twenty-three offline tests passed across importer/production helpers. Prior-phase package, contract, model/provider, legacy-source and create-only importer audits also pass. Application source and the approved 701-question package are unchanged; no new frontend build or authenticated hosted acceptance is claimed in this operational phase.

Retained Azure SQL full/differential/log backup metadata was checked, including a recent log backup. No restore drill was performed. An outer transaction protected each schema application; all eight content versions were one serializable transaction. Raw baseline and operation receipts remain in ignored `tmp/nafs-practice-phase10/`; only sanitized summaries are versioned.

Existing LMS table catalogs remain identical. All original immutable NAFS content, keys, grants and earlier mutation receipts retain their baseline row hashes. Existing attempt/answer tables are live: a baseline attempt changed and new answer/mutation records were observed during the broader production window. These differences are explicitly recorded without claiming audit-trail attribution or repairing learner work. The immediate successful import comparison matched every pre-operation NAFS row, including current attempts and answers. Other LMS row-count changes are recorded as observed production activity; no claim is made that all live LMS data remained frozen.

Public health probes passed: backend root/health and frontend return 200; existing NAFS course discovery requires authentication (401); Practice discovery returns 404 on the currently deployed app. Hosted flags were not inspected. Public reachability is not authenticated Quiz/Practice acceptance.

## Evidence and next gate

- `PHASE10_SCHEMA_VERIFICATION.json`: schema identity, migration hashes/catalog, recovery limits, rollback rehearsals and native SQL constraint/history results.
- `PHASE10_MEDIA_VERIFICATION.json`: dedicated container, byte/MIME/hash verification and all-object anonymous denial.
- `PHASE10_IMPORT_VERIFICATION.json`: first import, no-op repeat, independent final readback, inactive lifecycle/access counts and initial/immediate baseline comparisons.
- `PHASE10_DEPLOYMENT_VERIFICATION.json`: explicit deployment deferral, no push/settings changes and bounded public health evidence.
- `scripts/nafs-practice/production/README.md`: guarded operations, receipt handling and retention-based rollback instructions.

Run `node scripts/nafs-practice/validate-phase10.cjs` for offline evidence verification. The release preflight continues to report `releaseReady: false`. Next complete the deferred compatible application deployment with Practice Mode disabled, verify hosted media settings/flags and authenticated Quiz health, then proceed to Phase 11 publication, grade-specific access and controlled live acceptance. Phase 12 remains handover and monitoring.
