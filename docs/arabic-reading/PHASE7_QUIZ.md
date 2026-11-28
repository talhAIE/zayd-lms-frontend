# Phase 7 — quiz, completion and retake engineering

Implemented locally on 2026-11-28. Engineering exit checks pass. **Original-source activation is still gated by the final answer key and Arabic editorial/speech approval.** The PDF has no marked key; its Q6 has no matching choice. All 25 questions and 100 choices remain unchanged. The 24 proposed keys remain unapproved, and Q6 remains null. The prior instruction to preserve source content is not treated as key approval. This phase does not publish, import, grant access or deploy anything.

## Server-owned quiz and completion

New authenticated Arabic-only routes:

```text
POST /api/v1/arabic-reading/sessions/:sessionId/quiz/check
POST /api/v1/arabic-reading/sessions/:sessionId/finish
```

Check accepts only UUID `requestId`, integer `expectedRevision`, `questionId` and `optionId`. Finish accepts UUID/revision plus the exact array of `{questionId, optionId, responseId}` for all current checked selections. It accepts no client correctness, score, completion, owner or key claim. Nested DTOs reject extra/invalid fields and arrays outside 1–25 items. All existing JWT/role/explicit-region/current account/current Arabic grant/default-off flag boundaries apply. Results/errors are Arabic envelopes with private/no-store headers.

Both operations use the session's immutable source/version snapshot and the existing Arabic serializable/CAS/receipt transaction. Check requires quiz phase and a choice belonging to the supplied source question. Correctness is calculated only from the server-private approved key. Wrong selections can be changed and checked again; accepted selections cannot be downgraded. Rechecking the same accepted choice can acknowledge without rewriting its revision/answer. Feedback is deterministic Arabic, and replies expose only the learner's selected option and verdict, never an unselected correct key.

Finish requires quiz phase, exact current revision, complete reading accounting, every question checked correct, matching current selection/response IDs and an independent comparison of every selection against the frozen key. Missing/duplicate/foreign questions, unowned choices, changed choices, stale check proofs, unchecked/wrong answers and quiz-before-reading attempts fail. It atomically records only the Arabic session result/completed timestamp, one Arabic coach message and its request receipt. Normal course/lesson/mode progress, grades, rewards, usage, reports and other modes are untouched. Repeated identical finishes replay the original safe response; competing different finishes allow one revision winner. Completed rows remain immutable.

The pre-existing completed-run retake API is now connected to the real UI. It rechecks the current completed run, latest approved publication and active pointer, then creates a fresh run, initial listen state and receipt. Original result/history and snapshot are retained. Unreviewed replacement content cannot be used for retake. No destructive reset, unfinished-run bypass or silent overwrite is added.

## Frontend and uncertain mutations

The Arabic API client/controller now supply check, finish and retake actions to the existing RTL screens. Selection alone never creates a verdict. Only the server-checked response unlocks advancement; all-correct state unlocks Finish. Refresh restores the next unchecked question, or the last question when all are checked. Saved accepted choices remain checked/locked; new server response IDs clear stale local drafts. Completion appears only from a current `completed` server session. Retake requires the existing Arabic confirmation dialog.

`arabicReadingMutations.ts` adds a separate metadata-only IndexedDB journal (`zayd-arabic-reading-mutations`) without changing the recording database or existing mode utilities. A single immutable pending intent per owner/activity stores its operation, owner/region scope, session, frozen version, UUID, revision and exact check/proof payload. It contains no token, audio, source key or approval record. Storage transaction completion precedes dispatch; a failed save sends nothing. Conditional deletion checks owner/UUID so an old callback cannot delete another intent.

After a lost reply or refresh, the controller first reads the current authorized session and active pointer. It restores committed state or closes a provably outdated intent without replaying it into a newer revision/run. An already accepted same-choice check is satisfied by current server evidence. A genuinely unconfirmed intent remains locked with an Arabic explicit retry control; refresh/focus/reconnect never automatically checks, finishes or retakes. Deliberate retry uses the exact original UUID/payload, and the backend receipt/CAS boundary prevents duplicate transitions. Receipt snapshots never overwrite a newer UI state. Identity replacement cannot load/send another owner's intent; old pending metadata remains private to its original application scope. The existing shared HTTP refresh/lifetime guard remains unchanged.

## Exact original source integration, still draft-only

`scripts/arabic-reading/prepare-runtime-draft.cjs` validates the sealed Phase 1 package, maps all 10/6/9 source questions, 100 options, source IDs, blocks, Unicode and recording spans to the private runtime format, and binds their digest to the original PDF. Original prompt/choice/order/block text is mechanically compared by the new source tests. Candidate keys are copied only into a clearly marked private draft: all approval flags false, approval JSON/date null, publication disallowed, Q6 present/unkeyed. Speech expansions are not silently promoted to reviewed content. No original package file is modified.

Default execution prints aggregate counts/gates only. `--emit-private-preview` writes a concrete reviewable draft to ignored backend `tmp/arabic-reading/phase7/runtime-draft.private.json`. The tool has no apply/import/publish, environment-loading, database or cloud executor. Frontend source/assets/dev fixtures do not import it. Existing publication validation continues to refuse the unapproved original source.

The approved-version runtime path already enforces exact activity counts, question numbering, four ordered source choices, complete valid private keys and source/speech/key review attestations before sessions begin. The bridge makes the original source mapping concrete; it cannot supply the missing human decision. Synthetic fixture keys used for engineering tests are not an answer key for the PDF.

## Verification

- Backend: 478 Jest checks in 16 suites, including 232 Arabic/access/feature checks and 246 existing English reading/STEP/NAFS/Primary regressions. New tests cover 10/6/9 completions/retakes, wrong edits, stale/foreign proofs, before-quiz attempts, identical/concurrent finishes, immutable history, unapproved replacement refusal, rollback and revocation. Real HTTP tests exercise the strict nested DTO and no-store boundary.
- Offline: 24 source/schema/provisioning checks, including exact 25-question/100-choice runtime draft mapping and Q6 preservation. Backend total: 502 checks. Private draft preview prepared without publication.
- Frontend: 33 integrated local HTTP/JWT scenarios, 110 assertions, including all three full reading/quiz/completion/retake journeys, checked-state resume, lost replies, unconfirmed requests across refresh, storage failure and replacement-owner isolation. The prior 21 recording/media/recovery scenarios are included. Separately, 422 layout assertions across seven viewports/56 scene combinations, 30 presentation checks and ten existing frontend regression scripts pass.
- Full frontend build, application/preview/contract types, scoped lint, contract privacy/parity and synthetic-input exclusion pass. Backend full types and JS/declaration emit use the established symlink-aware compiler setting. Existing default Nest linked-dependency TS2742 and frontend pdfjs eval/large-chunk warnings remain documented; unrelated code/config/dependencies were not changed to hide them.

The local integration server uses real Arabic controllers/JWT/DTO/session logic, synthetic serializable storage/grants/keys/speech results, generated narration and fake device bytes. Browser external requests are blocked. No actual learner account, microphone, Azure/AI service, SQL Server guards/locks, production schema, media upload, push or deployment was used. Real external/teacher/device and owned-SQL acceptance remains pending. Source/schema seals and existing mode/recorder/layout source remain unchanged.

To reproduce locally, start the backend synthetic-only tool and frontend integration Vite config documented in Phase 6, then run `node dev/arabic-reading/integration-check.cjs --phase7`. Detailed aggregate evidence is in `PHASE7_VERIFICATION.json`; browser reports remain ignored. Phase 8 can proceed with final engineering acceptance, while original-content activation still requires the final approved key (including Q6) and Arabic reviews.
