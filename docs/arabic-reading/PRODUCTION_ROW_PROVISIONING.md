# Production ROW private content and tester provisioning

On 2026-11-28 the owner explicitly requested: “upload the content in production ROW and also create test accoutns in it so client can test it”. This authorizes the production preparation described here; no hosted application deployment or content approval is inferred.

## Applied and verified

- Azure SQL server: `tutor-lms-prod-sql.database.windows.net`, database `zayd_lms_prod`, region ROW. The connection used verified encrypted transport, physical server/database/engine checks and retained Azure full/log backup metadata before changes.
- Seven isolated Arabic tables and migration receipt `arabic-reading-phase2-001` were created. All six SQL trigger definitions match the reviewed artifact and are enabled; all eight check constraints are enabled and trusted.
- The three original passages are private **draft** versions in `ArabicReadingVersion`: `ar-reading-01` / حنكة طفل (10 questions), `ar-reading-02` / من نعم الله (6), `ar-reading-03` / السُّكَّري (9). Read-back verifies the exact private Unicode JSON, all 25 questions and all 100 choices. Source PDF SHA-256 remains `cb15678252361fc2447a554cf894235ca0ce041dfe30556851297d3f03bb95d1`.
- Three new active ROW/STUDENT accounts: `qa.arabic.reading.01`, `qa.arabic.reading.02`, `qa.arabic.reading.03`. Each has its own bcrypt credential and explicit active Arabic grant. A new dedicated Arabic testing school/category satisfies existing account relations. No existing account/school/category was overwritten, reactivated or reclassified.
- Provisioning committed atomically: schema, receipt, drafts, new school/category, three users, password hashes and Arabic grants. Independent read-back verified content, account state, scope and bcrypt passwords. No hosted HTTP login was executed; login/device/Azure acceptance is not claimed.
- Existing non-Arabic table/column catalog digest stayed `0615b5929388ffe0e41d209feb6429f97e2d7f19a093ad81eae0805fbad82411`. This is a column-catalog fingerprint, not proof that unrelated production activity stopped. No existing learner rows, course enrollments, normal progress/sessions/stats, STEP/NAFS/Primary grants or LmsTestAccount program records were written by this operation. The new accounts have zero normal enrollment/session/progress/stats records at read-back.

Passwords are in ignored local `tmp/arabic-reading/production/test-accounts.private.json` and the shareable `test-accounts.private.md`; they are excluded from commits and public evidence. The planned entry path after compatible deployment is `/student/arabic-reading`.

## SQL correction and evidence

The first real SQL execution revealed six incorrectly escaped `SHA2_256` string literals inside two dynamic trigger bodies. Two diagnostic attempts failed with SQL syntax error 102 and rolled back; subsequent preflight verified no Arabic tables, target users or dedicated school/category remained. The correction only doubles those six literals in each of the canonical guard and assembled migration files. No models, private source content, shared schema definitions or normal application behavior changed. A regression test now verifies all six dynamic trigger batches remain intact and decode to valid hash literals.

The guard/assembled SQL artifact pins were refreshed. The runtime already reads the same manifest, so the deployed backend must include this updated manifest. Do not deploy an older checkout carrying the original digest.

| Artifact | SHA-256 |
| --- | --- |
| Previous unapplied SQL (invalid dynamic quoting) | `c91dbd593d2e8aa8ec52d2753ad8657840266a4eea7e05fdfdf63af055d84a09` |
| Corrected SQL / production migration receipt | `8ad2944fba3190922a573bbe0c5ea6932bd6d23ebcbf5dc92af522f4e1f20b77` |
| Corrected guard source | `999a1ea86a0c96e5cadf6f1fd13651c3fe66f0bef4104151180d48b90eb57917` |
| Reviewed target/baseline-pinned execution SQL | `d486d8cdd16a7ba9df9ac0809bb75ee0588b4d386ff1f27f4bdaa7f4918c79b9` |
| Applied private plan (includes credentials; not versioned) | `c62e307a1afbaeb41136bb36a872de9a7bbf0d754651b6563d103161b2c9b453` |

31 offline content/schema/provisioning/isolation checks and 258 Arabic/access/flag Jest checks pass after the fix. Backend Jest used the offline TCP guard and reported zero nonlocal attempts; this test run is separate from the explicitly authorized real SQL operation. The production tool was syntax checked. Model clients were not regenerated. Matching sanitized verification JSON records the actual production read-back; ignored private inspection/plan/SQL/receipt files retain detailed evidence. Previous phase verification documents remain historical records of their own offline runs, not current production status.

## What still prevents client testing

This is an upload and account setup, **not a client-ready hosted release**. Original-source content has not been published: all source/key/speech approvals remain false, approval JSON and published timestamp are null. The 24 proposed keys remain candidates; Q6 remains null because the passage says the money is under the pillow but none of its four choices matches. No answer was invented, source choice changed or approval fabricated.

Before actual client use:

1. Obtain the approved source key, including an explicit Q6 decision, and Arabic editorial/diacritic/speech review. Publish only an approved version through an explicitly reviewed operation.
2. Deploy compatible Arabic backend/frontend commits, including the corrected migration manifest. No branch was pushed/deployed here, and no hosted flags were changed. Frontend entry remains the isolated Arabic route; normal course enrollment is unnecessary.
3. Configure Arabic ROW provisioned-region/feature and external speech settings deliberately, then perform real narrator/microphone/Azure and owned SQL concurrency acceptance. Current receipt/read-back is storage acceptance, not full real-session acceptance.

Phase 9 deployment handoff is still pending. No other mode was enabled, no Saudi database was contacted, and no cloud content/media objects or synthesized speech were uploaded.

## Tool behavior

`scripts/arabic-reading/production-provision.cjs` requires an explicit production environment file. Its default command connects read-only to prepare a private concrete plan; it has no automatic environment loading or application bootstrap. `--apply --plan-sha <reviewed-sha>` verifies the exact source/schema/target/catalog, refuses any existing Arabic schema/account/school/category and applies one atomic transaction. It deliberately cannot publish or enable flags. It refuses repeat application rather than resetting users, credentials, grants or sessions.

After application, use only the read-only verification command from the backend worktree:

```text
node scripts/arabic-reading/production-provision.cjs --env-file ../../zayd-lms-backend/.env --verify
```

The environment path above is this workspace's existing production configuration; credentials and connection strings are never printed. Keep the private plan locally to support exact read-back; do not commit or deploy it. Read-back also works without starting Nest or its inherited startup migration hooks.
