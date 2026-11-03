# Phase 4 student experience delivery

Implemented locally on 2026-11-04. Frontend branch `feat/nafs_f`; backend companion QA tooling on `feat/nafs_b`. Student UI implementation and local verification are delivered. Original-form publication and final launch acceptance remain pending the seven academic findings; this work does not approve those forms.

## Delivered behavior

- Granted NAFS course cards appear in the existing Courses grid with the normal Zayd layout, colors, typography and buttons. NAFS-only students do not see an empty-curriculum message; saved NAFS quizzes contribute accurately to the visible in-progress course count. Ordinary cards and their destinations remain intact.
- The overview explains question count, one attempt, resume, all-answers-required, no timer and permanent final submission. Actions are Start, Resume or View marks according to backend state.
- Dedicated NAFS routes display one question at a time, Previous/Next, answered-count progress, a neutral question navigator, selectable text/image options, exact source facsimiles, diagram descriptions, image expansion and reading passages with accessible text/emphasis. Passage access stays available alongside questions on desktop and through a panel on mobile.
- Selections persist during navigation and save serially with visible saving/saved/error states. Reload resumes server state. Account/attempt-scoped tab storage can recover unconfirmed selections with an explicit choice; no answer keys or correctness are stored in the browser.
- Revision conflicts reread the saved attempt and require a choice. Failed requests retain stable request IDs for replay. Finish drains pending saves and sends the complete final snapshot. Uncertain submissions freeze editing and recover the same attempt rather than offering a restart.
- Final screens show completion and earned/total marks only. No question review, correctness, explanations or retry are exposed after submission. Reload, direct URLs and browser back preserve the completed state.
- Backend feature flags and grants remain authoritative. No new school/grade eligibility mapping is introduced. NAFS does not use the normal learning Redux slice or send normal lesson-completion, engagement-heartbeat or achievement events from its quiz routes.
- Private media uses authenticated API requests and revocable Blob URLs. No token is placed in an image URL, and content-supplied external URLs are not followed.

## Validation

The final result combines the full content/browser run and focused final checks, with each case's latest result required to pass. The sanitized evidence is `PHASE4_VERIFICATION.json`.

| Verification | Result |
|---|---|
| Frontend browser/state/transport cases | 43 final cases passed |
| Source content previews | All eight forms at 1440x1000 and 390x844 |
| Question screenshots | 63 per viewport; 126 total |
| Original image fidelity | All 82 assets hash-checked and decoded with matching dimensions in each viewport |
| Reading passages | All three rendered; desktop/mobile access checked |
| Real Nest + owned PostgreSQL + frontend | 2/2, 0/2, 1/2 diagnostic scores; exact teacher API matches |
| Frontend/backend builds | Passed |
| New NAFS runtime ESLint | Passed with no errors/warnings |
| Full frontend ESLint | Passed with warnings; no errors |
| Existing frontend Science transport/practice and writing-review checks | Passed |
| Existing focused backend NAFS tests | 43 passed |
| Phase 1 source/contract integrity | Passed; source package unchanged; seven holds retained |
| Production bundle boundary checks | Contract matches backend; no NAFS source content, private authoring data or QA controls bundled |

The browser was installed Microsoft Edge (Chromium), running headless. Automated checks cover native keyboard selection, no horizontal page overflow, authenticated Blob images, option and passage associations, zoom, save/reload, incomplete finish prevention, permanent locking, network failures, revision conflicts, lost/uncertain submissions, account switching, disabled/denied access, normal course navigation and discovery failures. Representative screenshots were also manually inspected for diagram, mathematics, passage and mobile layout. This is not a new independent academic assessment or a claim of manual inspection of every source PDF page in this phase.

The source preview adapter reads learner content and PNGs only; it never reads private source keys. Its diagnostic preview scores do not certify PDF grading. Real grading/browser verification uses three separate, labeled synthetic assessments through real JWT/role/DTO checks, real NAFS services and PostgreSQL. The existing login screen is unchanged; these automated sessions seed short-lived local test JWTs rather than exercising production authentication integrations.

After real QA, all 44 ordinary LMS tables were unchanged, all original forms remained unpublished, and the three diagnostic assessments were deactivated with submitted attempts retained. Test API and owned local database were stopped. The existing PostgreSQL Windows service remained running. Frontend/backend `.env` files, production flags, real accounts, real school/grade links, normal LMS data and live storage were untouched. Nothing was pushed or deployed.

## Remaining gates

All eight original forms remain drafts. The seven Phase 1 academic findings must be resolved with source-bound evidence before students can start those forms through the actual API. Their presentation is verified in an isolated local source preview; published original-form student acceptance remains pending. SQL Server runtime verification remains outstanding from Phase 3. Teacher dashboard UI is Phase 5; broader end-to-end acceptance is Phase 6.

See `PHASE4_RUNBOOK.md` for reproducible preview and real-database commands. Backend full regression retains Phase 3's documented missing external Spark Science fixture limitation; it is not claimed green here. The existing frontend build also retains its large-chunk warning.
