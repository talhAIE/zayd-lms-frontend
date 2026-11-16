# NAFS Practice frontend Phase 1 handoff

Phase 1 is complete locally on `feat/nafs_PM`. These are types and specifications only. No course card, route, player, flag, API service, database data or deployed behavior is changed.

Canonical backend specification: sibling `zayd-lms-backend/docs/nafs/practice/README.md`. Its `decisions.json` records the user's explicit "Use these defaults" answer on 2026-11-13. A versioned implementation-plan copy is in the same backend folder; Phase 2 is next.

## Confirmed student journey

Courses -> NAFS subject/grade -> Quiz Mode / Practice Mode -> Practice collection Quiz 1 -> overview -> Start/Resume -> select -> Check Answer -> feedback -> manual navigation -> confirm completion -> final latest-check marks. An explicit Practice again starts the successor run; prior runs remain immutable.

Retries are unlimited in an unfinished run. Changing a selection requires a new check before completion. Correctness is server-confirmed and scoped to the checked choice; no correct-option reveal, explanation, hints or running aggregate score. No timer and no requirement to get every question right. Preserve every check privately for later analysis. Domain/Strand/Outcome/Indicator/provenance remain hidden.

## Implementation contract

- `src/types/nafs-practice.contract.ts` and this directory's `api.contract.ts` match the canonical backend file byte for byte. Compile-only `contract.examples.ts` exercises the intended privacy and state boundaries. Runtime projection/DTO validation is still required in Phase 3; TypeScript alone is not an API privacy filter.
- Keep existing NAFS types/services/player rules unchanged. Existing assessment/attempt bookmarks and final-only Quiz Mode results continue working.
- New course chooser uses the unchanged existing assessment UUID as the launch grouping ID. Mode discovery is additive. Only absence of the new endpoint on an older backend triggers direct legacy-quiz fallback; ordinary errors retain retry and the existing quiz link.
- Practice uses `/api/v1/nafs/practice`, separate owner-bound state and draft keys including user/username/role/region/collection/version/session. Do not reuse the older NAFS owner check without adding region binding for practice.
- Reuse `AnswerFeedback.tsx` for fresh server-confirmed response IDs. Restore saved feedback/colors without replaying animations. No automatic advancement.
- Reuse layout, safe text/math/emphasis, passages and authenticated Blob image patterns. Practice media uses a session-owned API route, never source/private paths or bearer query strings.
- Contract supports 500 questions with bounded snapshots and small per-action payloads. No all-answer submission array is needed; completion derives the score from persisted latest checks.
- Use stable request IDs and revision conflict handling. Preserve unknown-outcome requests and reconcile the same session before replaying; never create a new run as error recovery.
- Keep practice progress separate from existing quiz counts, course completion totals and teacher results. Initial production availability is ROW-only with explicit parent/practice grants; grade labels alone grant nothing.

## Content gate

The eight unapproved PDFs contain 705 preliminary numbered items, not a frozen upload count. Client corrections, multipart/non-MCQ decisions and the actual Math 9 key are pending. No private authoring files, source PDFs, keys or taxonomy data may be copied into frontend assets or public folders. Development through Phase 7 uses synthetic data; corrected-client preparation/upload follows afterward.

Run `node dev/nafs-practice/contract-check.cjs` from the frontend. Supply the canonical backend contract path as its first argument if the sibling layout differs. See `PHASE1_STATUS.md` for the executed checks and their limits.
