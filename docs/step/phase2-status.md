# STEP Phase 2 frontend handoff

Phase 2 is backend storage work. The frontend contract from Phase 1 remains unchanged; no course card, navigation, routes, session player, grading, or existing mode UI is modified here.

The dedicated STEP ROW production schema is applied in `zayd_lms_prod`: 14 tables, including normalized questions/options/private keys, course enrollment, version-pinned attempts, saved selections, retry receipts, and a schema-migration receipt. Content/enrollment/attempt tables remain empty and STEP remains disabled. No STEP content/audio/account upload occurs in this phase.

Backend evidence is in `docs/step/phase2-storage.md` and `docs/step/phase2-evidence`. All 78 pre-existing production tables retained the same schema fingerprint across deployment. Access will use active persistent STEP course enrollment, not a username allowlist or student grade. ROW is the only provisioned region; Saudi access must fail closed.

Phase 3 implements the APIs. Frontend discovery/layout work begins in Phase 5, with autosave/resume/submission in Phase 6. Continue using `src/types/step.contract.ts`, matched to the canonical backend contract; do not invent private-key, per-question score, or retry fields. Runtime IDs will be UUIDs mapped from the source package's authoring slugs by the later importer.

The eleven Nouns academic findings remain open. Schema deployment does not approve those questions or publish the course. No production content may be marked ready until the separate content-publication gate passes.
