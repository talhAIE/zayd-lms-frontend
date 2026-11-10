# NAFS launch contract v1

Contract established in Phase 1. The backend is implemented in Phase 2; frontend integration follows in Phases 4-5. The matching frontend copy and `nafs-api.contract.ts` must stay byte-identical between repositories.

## Decisions frozen for implementation

- Eight subject/grade course entries, each opening one Preparation Form A assessment. The content grade is a display label only during testing.
- One mark per correct answer, zero per incorrect answer, no negative marking. Totals: G3 Math 8, G3 English 5; G6/G9 Math 10, Science 10, English 5. This is the documented initial implementation convention; the client specified final marks but did not separately specify weights.
- Fixed source question and option order; no randomization. Subject-local numbering starts at 1. Preserve original PDF numbers in private authoring records.
- No timer. Source section timings are metadata, not student countdowns.
- One attempt per regional user and stable assessment ID across all content versions. Resume unfinished work; never restart submitted work.
- Every question is required. Students may change any selection before finishing. No correctness, feedback, hint, explanation, answer review, running score, pass/fail badge, retry, certificate, or analytics in this module.
- Final result is only earned marks / total marks and completion. NAFS must not modify normal LMS progress, averages, usage, achievements, certificates, or science state.
- Feature flag `LMS_ENABLE_NAFS` defaults off. Initial authorization uses explicit test-student/assessment grants and test-teacher/student/assessment grants within the JWT region, plus existing account/role checks. No automatic school/grade linkage or real-account provisioning.
- An English-only NAFS teacher gets no Math/Science results or additional StudySync access. A teacher/student match without an assessment grant is insufficient.

## State transitions

`not_started -> in_progress -> submitted` only. No student-facing deletion, reset, retry, or reverse transition.

Course actions: Start quiz / Resume quiz / View marks respectively. Opening a course overview alone does not consume the attempt. Start creates the single attempt or returns the existing attempt/result, even with simultaneous starts. Snapshot published content and scoring at first start. Draft/held content is never startable.

## HTTP contract

Existing bearer JWT, regional identity, validation and `{ status: true, data: ... }` envelope apply. IDs in the type file are opaque; source manifest IDs are stable import keys mapped by the backend.

| Method and path | Success data | Notes |
|---|---|---|
| GET `/api/v1/nafs/courses` | `{ courses: NafsCourseView[] }` | Feature off/no test grants returns an empty collection; ordinary courses still load |
| GET `/api/v1/nafs/assessments/:id` | `{ assessment: NafsAssessmentView }` | Overview only; no private source/review data |
| POST `/api/v1/nafs/assessments/:id/attempt` | `{ attempt: NafsAttemptView }` | Empty body; create-or-resume; existing submitted attempt returns result |
| GET `/api/v1/nafs/attempts/:id` | `{ attempt: NafsAttemptView }` | Own unfinished selections/content or submitted final summary; never submitted answers |
| PUT `/api/v1/nafs/attempts/:id/answers/:questionId` | `{ saved: NafsSaveAnswerResponse }` | Body `NafsSaveAnswerRequest` |
| POST `/api/v1/nafs/attempts/:id/submit` | `{ result: NafsResultView }` | Body `NafsSubmitRequest`; final complete answer snapshot |
| GET `/api/v1/nafs/attempts/:id/result` | `{ result: NafsResultView }` | Authorized owner and submitted state only |
| GET `/api/v1/nafs/teacher/results` | `NafsTeacherResultsView` | Query `NafsTeacherResultsQuery`; allowed filters only, default page 1/limit 20, max 100 |
| GET `/api/v1/nafs/attempts/:id/assets/:assetId` | Image bytes | Own unfinished attempt and referenced learner asset only; never source PDFs/private keys |

Unauthorized identity: existing 401 behavior. Foreign region/user/assessment/asset or missing test grant: non-enumerating 404 `NAFS_NOT_FOUND`. Disabled detail/write endpoint: 404 `NAFS_DISABLED`. Existing teacher-role checks still apply. No-grant/disabled teacher collection returns zero rows and zero filter options. Invalid IDs/options/duplicate or foreign question IDs: 400 `NAFS_INVALID_ANSWER`. Missing required answers: 400 `NAFS_INCOMPLETE` with missing IDs for owned work. Attempt not yet submitted on result endpoint: 409. Submitted edits: 409 `NAFS_SUBMITTED`. Stale mutation: 409 `NAFS_REVISION_CONFLICT`.

Phase 2 clarification: the pending-result 409 code is `NAFS_NOT_SUBMITTED`; reusing an accepted request ID with different data returns 409 `NAFS_REQUEST_CONFLICT`; unexpected persistence failures return sanitized 503 `NAFS_UNAVAILABLE`. Parameter/DTO validation and role failures use existing NestJS 400/403 responses. IDs in path parameters are UUIDs. Media URLs require the same bearer token: the frontend must request images through its authenticated API client and render Blob URLs, not attach tokens to query strings or use an unauthenticated image request.

## Saving, concurrent tabs, and finishing

- Each unfinished attempt has a monotonic revision, initially 0. Save/submit must compare `expectedRevision` in the same database transaction as the state check and write. Successful save increments it. No last-write-wins acceptance of stale tabs.
- Frontend serializes/coalesces saves for the entire attempt, shows saving/saved/error state, and retains unsaved local work on failure. Retry the same payload with the same request ID. The backend stores the accepted mutation response/request hash so an identical replay returns the original response before checking the now-stale revision; reuse of a request ID with different data is rejected.
- On revision conflict, fetch server state and show a neutral conflict message. Preserve the unsaved local selection for user review; never silently overwrite accepted answers from another tab. Retry only with a deliberate current-revision save.
- Finish waits for pending saves, sends the full answer snapshot and current revision, and validates exactly one selection per question. Score is calculated privately and persisted atomically with answers, submitted state and completion time. Never trust a client score or client total.
- Submitted state takes precedence over subsequent save attempts. Repeated submit for an already submitted owned attempt returns the stored final result without recalculation or reopening, including recovery after a lost response. Server-side final-state checks are mandatory even if the UI disables controls.
- On a timeout, reconcile via GET attempt; do not start a new attempt. No submitted answer arrays or correctness fields appear in learner or teacher results.

## Learner content projection and visuals

`content/nafs/learner-content.json` is an OFFLINE AUTHORING manifest, not an HTTP response. Backend explicitly projects only fields in `NafsQuestionView`/`NafsPassageView` and resolves authorized asset URLs. Do not serve the authoring manifest, findings, source manifest, or private directory as static content. Frontend receives no answer-key files, PDF files, source crop coordinates/hashes, academic statuses, or grading snapshots.

- Structured-text items: render the stem and four selectable labeled options.
- Source-facsimile items: display the original cropped question, figures/tables/equations and original A-D options as a zoomable image. Below it render four selectable A-D controls. Do not render the full transcript again visibly by default. Offer the stem/option transcript in an accessible text view, and individual image-option crops where present. Visual descriptions are authored accessibility labels and are not source option text.
- Grade 3 Q4's vertical addition, mixed fractions, powers, spinner, pictograph, tables, graph, chemical notation, reflecting telescope, and other geometry remain intact in the crops. Never approximate option diagrams in CSS or replace them with guessed numeric equivalents.
- Each linked passage remains accessible with every related question: desktop side panel, mobile expandable panel. Passage facsimiles preserve illustrations/emphasis; full paragraphs and recorded emphasis terms support accessible text rendering.
- Preserve image aspect ratios; no fixed-height clipping. Expand images without losing the selection; minimum readable desktop/mobile layouts must be checked later in Phase 4. Text descriptions must not explicitly identify correctness.
- For G9 Q17, do not invent the missing DNA illustration. Its academic hold remains until the client supplies it or approves the text-only item.

## Screen specification

1. Existing Courses page: add authorized NAFS cards with title/grade label, question count and Start/Resume/View marks. Failure to fetch NAFS must not hide normal cards.
2. Overview: course + Form A title, count, final-marks policy, one-attempt notice, no timer, and Start/Resume action.
3. Quiz: existing student layout/Outfit typography/Zayd colors and buttons. Course heading, question number, answered count, neutral question navigation, Previous/Next, selection state, saving status. No score, correct/incorrect colors or automatic advance on selection.
4. Finish review: answered/missing question numbers only; jump back to missing work. Enable Finish only when locally complete and saved; server independently validates. Confirm that final submission cannot be changed.
5. Completed: final `earnedMarks/totalMarks`, Completed label, Back to courses. No correct-answer review or retry. Reload/back/direct URL yields this same summary.
6. Existing teacher dashboard: NAFS section, allowed assessment filter, completion filter and paging. Rows show authorized test student, course, completed/not completed, final marks and optional completion time. No score for incomplete work and no impact on ordinary dashboard totals.

## Required later acceptance cases

Eight forms are accessible only to granted test users; missing/foreign grants are denied; grades alone grant nothing. Test all-correct/all-wrong/mixed marks, invalid/missing answers, no score before submit, concurrent start, save replay, revision conflicts, late saves, submit replay, network uncertainty, token refresh, mobile zoom/passages, teacher field scoping, feature-off isolation and normal LMS regressions. Content must pass the offline validator and the later source-to-screen audit. Academic approval is a separate publication gate, not a side effect of structural validation.
