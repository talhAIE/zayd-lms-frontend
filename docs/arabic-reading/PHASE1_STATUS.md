# Arabic Reading Phase 1 frontend handoff

Date: 2026-11-27. Branch: `feat/arabic_R`.

Source preparation is complete locally in the matching Arabic backend checkout. Academic approval remains pending. This frontend commit contains documentation and plan updates only: no UI, routes, services, assets or production build changes.

| Activity | Passage page | Questions | Question pages |
| --- | --- | --- | --- |
| حنكة طفل | 5 | 10 | 5-6 |
| من نعم الله | 7 | 6 | 7 |
| السُّكَّري | 8 | 9 | 8-9 |

Total: three passages, 25 questions, 100 choices. Source SHA-256: `cb15678252361fc2447a554cf894235ca0ce041dfe30556851297d3f03bb95d1`. Counts and IDs are authoring evidence, not a frozen learner API contract; that is Phase 2.

The original PDF, page renders, full passages, original choices, candidate keys, review notes and source/speech maps live only in backend `content/arabic-reading/v1`. Do not import them into `src`, `public`, browser fixtures or frontend build inputs. Future UI must receive learner-safe projections through the separate Arabic API.

There is no official marked answer key in the selected reading pages. Q6 has no choice matching the passage and remains unkeyed; the other 24 candidates are unapproved inferences. The owner instructed that original content be retained unchanged, which is recorded in the backend. Final key and Arabic editorial/diacritic/speech approvals remain open; no frontend workaround, hardcoded key, omitted question or fabricated correction is permitted.

The backend prepared fourteen display blocks, 26 recording chunk proposals and five number pronunciation proposals. Their exact source spans are checked mechanically; Arabic-teacher acceptance is not claimed. No vocabulary cards or keyword mappings have been approved. All source numbering, dialogue, paragraphs, percentages, dates and list items must be preserved in the eventual RTL UI.

Local backend validation and twelve offline checks pass; publication preview deliberately refuses this unapproved draft. This is not hosted client acceptance or real Azure/microphone testing. The frontend verification file repeats only aggregate results and explicitly excludes source/key material.

The separate Arabic screen must not trigger the normal StudentLayout heartbeat or LMS progress effects. English reading, NAFS, STEP, Primary and avatar paths are untouched. Local commits only; no push or deployment.
