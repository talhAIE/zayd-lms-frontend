# NAFS Phase 1 frontend handoff

These are design artifacts, not application routes or a working quiz. Continue normal frontend behavior unchanged until Phase 4 integration.

- `PHASE1_CONTRACT.md`: agreed implementation contract for API, attempt states, concurrency/recovery, visual rendering, screen flow and teacher results.
- `nafs-api.contract.ts`: learner-safe DTO declarations. Kept byte-identical to backend `docs/nafs/nafs-api.contract.ts`; the backend offline validator checks drift. No answer-key or private authoring types belong in this file.
- Complete source package/checklist/offline preview: sibling backend `content/nafs/`. Do not import that directory into this frontend or copy it into `public`.
- Backend `docs/nafs/PHASE1_STATUS.md` records verification and seven unresolved academic content decisions. All prepared content is draft; source fidelity is not academic approval.

Reuse the existing student/teacher layouts, course cards, Outfit font, Zayd colors, buttons and responsive patterns. Add a separate NAFS service, state and quiz pages later; do not redirect normal quizzes into NAFS or change normal scores, certificates, progress or science functionality.

The local content proof supports reviewing every source question/passage; it is not a claim that the final frontend has passed desktop/mobile, keyboard or network-recovery checks. Those checks follow implementation.
