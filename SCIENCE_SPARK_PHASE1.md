# Science Spark — Phase 1

Phase 1 provides API types only. There are no Science routes, course cards, viewers, network calls or persistence changes in this frontend yet.

Working branch: `feat/sciencespark`, based on `fix/accgrade10` at `c0215be9d871436e3b17c6dade77ef13091020f9`.

`src/types/science-spark.contract.ts` is generated from the backend's canonical contract at `src/modules/science-spark/contracts/science-spark.contract.ts`. Do not hand-edit the generated copy. The backend alone owns the exact twelve-user allowlist; frontend eligibility will come from its authenticated availability response in Phase 5.

From the backend checkout, run:

```powershell
npm run science-spark:sync-contract
npm run science-spark:sync-contract -- --check
```

The sync command expects the sibling checkout `zayd-ai-frontend-accgrade10`; provide `--frontend-dir=<path>` for another checkout. Phase 1 preflight also checks contract parity. It requires the client package in the workspace for content inventory; deployed content packaging belongs to Phase 4.

Contract decisions:

- One Science course and Unit 1; six activities: Introduction, Lessons 1–4, Practice. Quiz omitted.
- Source remains the client's file-based Grade 9 Physical Science package, shared by all twelve pilot testers regardless of account grade/curriculum.
- Lesson section navigation is separate from top-level explicit completion.
- Opened/completed flags derive from first-opened/completed timestamps, with no percentage, score, answer or usage-time fields.
- Practice returns to Unit 1. Provider details/embed URLs are distinct; playable embedding remains to be validated in Phase 6.
- The content contract distinguishes isolated local HTML payloads from external Practice configuration. Frontend never receives a token for use inside the content iframe.
- Normal Nest HTTP exceptions represent failure; successful responses use `status: true` and typed `data`.

Read-only account findings, file hashes, detailed API/configuration decisions and the versioned implementation plan are in the backend repository's `docs/science-spark/` directory. No supplied content is imported into database course/component models.
