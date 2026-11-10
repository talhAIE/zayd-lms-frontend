# STEP production content publication

2026-11-10: the project owner confirmed that the original supplied marked answers must be scored as correct and explicitly requested production publication. The backend recorded that decision in a sealed v2 review without changing questions, choices, keys, passage or source audio.

Production now has the active STEP course and three published/approved v2 activities: Nouns (60), Making Plans (4), Ants (4). The older v1 draft/audit is retained as history. The single `step.test` account has an active production STEP enrollment; its attempts are left untouched for user testing. Backend evidence is in `docs/step/release-v2.md` and `release-v2-evidence` in the matching backend repo.

This is data publication, not a hosted frontend/backend deployment. Both feat/step branches remain local-only until the earlier no-push instruction is clarified. Online testing still requires deploying the compatible application builds and enabling `LMS_ENABLE_STEP` on the backend. No frontend runtime, app settings or deployment was changed in this publication operation; no private source packages are imported into the frontend.
