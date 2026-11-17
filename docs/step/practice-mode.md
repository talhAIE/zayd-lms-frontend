# STEP practice learner flow

Nouns now opens a page containing the six source subtopics; each opens only its own questions and has independent checked progress and completion. No other Grammar documents were imported. Listening and Reading use the same server-checked practice player with their original audio and passage.

Select an option, then Check Answer for correct/incorrect feedback. Options reuse normal Zayd green pop/confetti and red shake. Source keys stay on the server. An unchecked selection has no correctness display; changing a checked option clears its feedback. Saved feedback renders without replaying an animation. All questions in the subtopic must be checked before completion; incorrect answers can be retried or completed as incorrect. Completion locks the subtopic and preserves its result.

The `/student/step/topics/:topicId` route is the subtopic chooser; `/student/step/attempts/:attemptId?group=<source-group-id>` opens an owned group. Listening/Reading have one activity group. Original submitted assessments still show their immutable final total. A newly completed practice can review its checked responses.

Practice requests use the shared owner-bound bearer/refresh client. Durable checked answers and completions come from the backend. Unchecked choices, position and exact pending mutation requests use owner/region/attempt/group/version-bound tab storage. Unknown outcomes lock editing until the same saved request is confirmed. Conflicts require explicit Use saved choices. A failed recovery preserves the current journal. Account changes dispose requests and audio.

Implementation: `StepPractice.tsx`, `stepPracticeService.ts`, the additive practice contract and the shared `StepPlayer`. The old serial assessment engine remains covered separately; routed tests now exercise practice. Run:

```text
node dev/step-practice/contract-check.cjs
node node_modules/@playwright/test/cli.js test --config dev/step/playwright.config.ts
```

These tests use synthetic API/media fixtures. They do not grade real students or call production. Before deployment, the backend requires the additive STEP receipt constraint/trigger migration described in its `docs/step/practice-mode.md`. No GitHub push, production migration, content import or hosted deployment is part of this local change.
