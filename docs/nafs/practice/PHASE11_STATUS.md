# Phase 11 — local implementation complete; live rollout deferred

Frontend handover: the new local acceptance runner and browser evidence live in this repository. Provisioning/release scripts, the implementation plan and consolidated verification report referenced below live in `zayd-lms-backend`. No frontend application runtime code was changed or deployed.

The user explicitly selected **“Keep deployment deferred; complete local implementation.”** Eligibility/provisioning/release tooling, normal-roster integration and local acceptance are complete. The original Phase 11 production exit gate remains open: applications have not been deployed, supplied versions have not been published, students have not been granted practice access and live acceptance has not occurred. Source commits stay local on `feat/nafs_PM`.

## Current eligibility, measured read-only

Production previews verified the actual ROW database and current student/account, school, grade, subject and active parent assessment grants. The result happens to match the old roster count; the implementation does not assume it.

| Actual grade | Eligible students | Permitted supplied subjects | Eligible pairs |
| --- | ---: | --- | ---: |
| 3 | 236 | English, Math | 472 |
| 6 | 141 | English, Math, Science | 423 |
| 9 | 127 | English, Math, Science | 381 |
| Total | 504 | Subject-specific existing grants | 1,276 |

Five schools are represented. Separately, three pre-existing synthetic test identities qualify for eight grade/subject pairs. Their deterministic IDs, usernames and dedicated synthetic school ownership are verified; grade-null exceptions apply only to those explicit test identities. Test-purpose access is excluded from the school audience. Inactive/blocked/nonstudent accounts, wrong grade/school/region, unrelated subjects and revoked/conflicting grants are refused.

The production preview confirms zero existing/active practice grants and eight inactive draft/pending versions. No production mutation occurred. Private user scopes and detailed previews remain ignored; versioned evidence contains aggregate groups/counts and audience digests without learner IDs, usernames, tokens or answer keys.

## Implemented locally

- Offline-by-default CLI with separate preview, test-only reviewed publication, scoped school provisioning and read-only verification. Writes require explicit operation/apply/live-authorization controls, physical target/package/audience pins and an exact approval-file hash. Changed eligible audiences fail before creation. All writes are serializable and grants are batched in groups of 100.
- Two-stage release gates: compatible deployed revisions/hosted configuration and explicit version reviews before owned-test publication; complete matching live acceptance before real-school access. Public preflight also rejects an old backend returning 404 for the Practice route. Deployed revision/flag evidence is operator supplied and not inferred from public health probes.
- Separate immutable per-version publication reviews, exact source readback, eight owned-test grants first, no-op repeat, and persistent real-school grants only after controlled acceptance. No source questions, keys, taxonomies, histories or existing Quiz records are rewritten.
- One bounded integration call in each of the five school-roster importers. The shared hook stays inert for drafts and test-only release. After an explicitly marked reviewed package and the accepted real-school rollout's persistent school grant exist, future roster students receive only their actual grade/parent subject access. Revoked/stale grants are never reactivated. The old roster logic is otherwise byte-preserved after removing the inserted hook.
- Local browser acceptance runner for the existing mode chooser, durable practice lifecycle, source formats, mobile/desktop and cross-mode isolation suites. Reports explicitly say synthetic browser responses and `liveAcceptance: false`.
- Invalid-by-default review template, guarded operations runbook, sanitized evidence recorder and offline source/evidence validator. No production approval or fabricated deployment/academic/live acceptance evidence is committed.

## Executed checks

- **9 unit tests** cover eligibility/grade matrices, exact synthetic ownership, revoked/stale grants, offline CLI/apply controls, deployment/live-acceptance/review gates, SQL batch bounds and rejection of an incompatible public Practice route.
- **12 real owned-PostgreSQL integration scenarios** verify preview, reviewed test-only publication, zero-create repeat, test-only roster inactivity, audience drift, scoped school provisioning/repeat, future-subject-only grants, revoked-grant preservation, profile changes and zero learner runs. The entire synthetic transaction rolls back; hashes of all **84 tables** match before/after.
- **23 real local JWT/HTTP tests** pass against the marker-verified loopback database: flags, authentication, grade/school/region/revocation denial, private media, privacy, retries/concurrency, checked history, completion and repeats. Their labeled local fixtures are retained; this is not production acceptance.
- **31 existing Quiz service/repository regressions** pass, including existing learner/teacher scoping and result behavior.
- **34 local browser checks** pass at mobile/desktop sizes, with zero failures, skipped tests or flaky tests. APIs/AI verdicts are synthetic browser fixtures; real hosted login is not claimed.
- Prior Phase 10/package/legacy-source audits and the new five-hook preservation/write-scope/evidence audit pass. Application runtime source, schemas, sealed content and learner contracts are unchanged; no new application build/deployment is claimed for these operational tooling changes.

Evidence: `PHASE11_VERIFICATION.json`; frontend `PHASE11_BROWSER_VERIFICATION.json`; reproducible commands and artifact requirements in `scripts/nafs-practice/access/README.md`. Raw local reports and roster details stay under ignored Phase 11 scratch. The owned database helper is stopped after checks.

## Remaining live gate

Complete the deferred compatible app deployment with Practice Mode off, verify hosted configuration and authenticated Quiz health, obtain explicit publication reviews, release only to owned test users, enable controlled acceptance and record every required live check. Only after that apply/repeat/verify the fresh real-school grant scope. The release preflight remains `releaseReady: false`; the original Phase 11 live exit gate and Phase 12 handover/monitoring are still pending.
