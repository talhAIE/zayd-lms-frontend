# Al Forqan American roster and course-specific teachers

## Applied production changes

Authorized by the user after reviewing the client workbook and clarifying independent NAFS/regular course teachers. The user also approved replacing AMR's English assignment for the twenty Grade 9G students and deferring regular English for Grades 3 and 6 until content exists.

Source: `Zayd Accounts Al Forqan (American) - new.xlsx`, sheet `English Students`, data rows 3–116. Source SHA-256: `27644ec6a649ca1b571f3a68925ca383f20de93a35a262af5668d265b8abd0d7`. The source workbook was not modified. National IDs and full student rosters are not committed to Git.

The verified Azure SQL database `zayd_lms_prod` now contains:

| Grade | Classes | Students | Account action |
|---|---|---:|---|
| 3 | 3A | 25 | Created |
| 6 | 6A, 6B, 6C | 47 | Created |
| 9 | 9A, 9G | 42 | Reused without resetting progress |

Eight new teachers were created; `mohhmd122` was reused. All workbook usernames were preserved. New accounts use normal username login and normal phone/terms onboarding; no invented contact numbers, passwords or consent were supplied.

| Teacher | NAFS subject | Assigned students | Additional program |
|---|---|---:|---|
| `ae3114399` | English, Grade 3 | 25 | Regular English pending content |
| `ibrahimelhadad704` | Math, Grade 3 | 25 | None |
| `ibra.salama2` | English, Grade 6A | 16 | Regular English pending content |
| `abdelaziz.me3` | English, Grade 6B/6C | 31 | Regular English pending content |
| `etch2020.hy` | Math, Grade 6 | 47 | None |
| `ashrafflefl2030` | Science, Grade 6 | 47 | None |
| `mohhmd122` | English, Grade 9 | 42 | Existing Grade 9 English |
| `mohammed.zaky810` | Math, Grade 9 | 42 | None |
| `sherifbedair227` | Science, Grade 9 | 42 | Spark Science Motion |

Exactly 317 active student NAFS grants and 317 matching teacher NAFS grants were created with purpose `school`. Fifty grants are for Grade 3, 141 for Grade 6 and 126 for Grade 9. Neither grade nor school alone grants access. The separate test accounts/grants remain intact.

Forty-two regular English grants and forty-two Spark Science grants were added in the dedicated `TeacherCourseGrant` table. The existing forty-two Grade 9 English enrollments were preserved. Broad legacy English assignments for these students were deactivated and replaced with exact course grants: twenty-two for `mohhmd122` were migrated, and AMR's twenty Grade 9G assignments were replaced by `mohhmd122`. Assignment history was retained; AMR's unrelated learners were not changed. Inactive history uses unique `inactive:<assignment-id>` keys because SQL Server's existing unfiltered unique index permits only one NULL.

Before commit, hashes of all affected existing students' rows in eleven enrollment/progress/session/attempt tables matched exactly before and after provisioning. No quiz attempts were opened, reset, deleted, rescored or submitted. The first row-by-row attempts rolled back on a uniqueness error and then timeout; the successful batched account/grant transaction committed the complete roster atomically.

## Implemented permission behavior

`TeacherCourseGrant` is an additive table with a unique teacher/student/program/course key, active state and foreign keys to both users. Schema parity and SQL patches exist for SQL Server and PostgreSQL. The SQL Server patch has been applied to the verified production database; the PostgreSQL patch was applied only to the owned local test database. Other regional databases require the additive patch before deploying this code there.

The existing teacher repository resolves explicit course grants in addition to legacy assignments. Explicit grants take precedence for that pair. Legacy assignments elsewhere retain their existing behavior. Dashboard curriculum lists, filter options, profiles, progress totals, quiz summaries, writing summaries and speech graphs respect the allowed curriculum course IDs. Science-only teachers cannot open English curriculum profiles. Global streaks, points and awards are suppressed in course-scoped projections; unrelated whole-student analytics are not exposed. Course time totals come from the assigned curriculum lessons. Existing daily usage records cannot be separated by course, so the scoped daily usage response explicitly reports `available=false` rather than releasing whole-student usage.

New report requests for course-scoped teachers include a fingerprint of their current authorized student/course set. Generation and download recheck this fingerprint. Report data uses the same restricted profile projection as the dashboard. Previously generated broad reports without a matching fingerprint cannot be downloaded after the teacher is switched to course-specific access. A change to course assignments requires generating a fresh report.

The new protected `GET /api/v1/teacher/me/program-results` endpoint releases only Spark Science Motion progress for explicit active `spark-science` grants. It checks teacher role/activity, same-school active students, Grade 9, the exact program key, exact unit and five known activity keys. It returns completion/progress only, never student answers or private content. A separate responsive Science progress section appears in the existing teacher dashboard only when assigned, with completion filtering, pagination and refresh. Account/request lifetime guards also apply to this transport.

NAFS now accepts explicit `school` grants in addition to existing `test` grants. Teacher results additionally require the student to be in the teacher's school. Student and teacher grants remain independent by assessment: assigning NAFS English does not assign regular English, Math or Science. If regular and NAFS teachers differ, grant each only the relevant program. The workbook currently uses the same English teacher for regular/NAFS and the same Grade 9 science teacher for Spark/NAFS; the data model supports different teachers later.

## What still needs deployment or content

The account and permission records are in production, but no main branch was merged and no Azure application settings were changed by this task. Deploy the updated backend and frontend feature branches to use the new teacher permission table and Science section. Until that deployment, the old backend cannot resolve the new course grants; migrated English teachers can temporarily have an empty ordinary dashboard. Do not recreate broad assignments as a workaround.

Keep `LMS_ENABLE_TEACHER_PORTAL=true` for the teacher portal and `LMS_ENABLE_NAFS=true` for NAFS. Normal Spark Science runtime enablement remains subject to its existing feature setting. The private media settings are documented in `PRODUCTION_TEST_ENABLEMENT.md`.

**The eight NAFS forms are still draft/pending with seven unresolved academic findings. Real school accounts deliberately do not inherit the three fixed test students' draft-preview exception.** Creating real accounts/grants does not academically approve the content. Publish an academically reviewed content version before opening NAFS quizzes to these real students. No source key was changed and no academic approval was fabricated. The existing three student/teacher test accounts can continue their explicitly configured preview.

Grades 3 and 6 have no regular American English course in production. The user agreed to defer those enrollments. All seventy-two pending student/regular-English teacher mappings are retained in the ignored provisioning report for later enrollment once correct content is supplied. No empty placeholder English courses, unrelated grade content or additional science courses were created.

## Verification and repeatable tools

- 101 focused backend tests passed across NAFS, teacher, course-scope and teacher-report suites.
- Backend build and changed runtime lint passed.
- Frontend build/type check passed; existing PDF `eval` and large-bundle warnings remain. Changed runtime lint has zero errors; five existing warnings remain in the ordinary teacher dashboard.
- 21 browser/transport checks passed, including NAFS regressions and desktop/mobile Science filtering, pagination, revocation and error isolation. Screenshots at 1440px and 390px were visually reviewed.
- Real local PostgreSQL verification passed for course grants, restricted profile data, broad-report rejection, revoked grants and Science-only access. Test mutations rolled back.
- Read-only verification against production checked all 114 students, all nine teachers, exact 317/317 NAFS grants, 42/42 regular-English/Science grants, wrong-program denial, twenty Grade 9G replacements and the real-student draft gate.

Commands from the backend:

```powershell
# Read-only roster preview (explicit paths required).
npm run nafs:alforqan -- --workbook '<workbook.xlsx>' --python '<python.exe>'
# Mutating production import, only when explicitly authorized.
npm run nafs:alforqan -- --workbook '<workbook.xlsx>' --python '<python.exe>' --apply --target production
# Read-only verification of the completed import.
npm run nafs:alforqan:verify
# Verified owned local database diagnostic; all mutations roll back.
npm run test:teacher:course-grants
```

The importer reads the workbook with the standard-library Python extractor, verifies workbook headers/shape/counts, rejects formulas in identity/permission fields, checks existing usernames and national-ID conflicts, refuses differing/revoked grants and uses bounded bulk writes. Repeating a valid import does not duplicate accounts/grants or reset attempts. Its private source/provision/verification records remain under ignored `tmp/nafs-phase3/`. `ALFORQAN_VERIFICATION.json` summarizes results without student identities or credentials.
