# Phase 8 - complete locally (2026-11-14)

Both repositories remain on `feat/nafs_PM`. Quiz 1 is prepared as a private, versioned backend authoring package. No database was accessed, no content/media was imported or uploaded, and nothing was published, granted, pushed or deployed.

## Delivered package

Backend: `prisma/data/nafs-practice/quiz-1/v1`. Open `review/index.html` locally for all eight private source/key previews. Do not publish this directory. The original PDFs remain read-only outside Git.

| Collection | Source numbered items | Final questions / marks |
| --- | ---: | ---: |
| English 3 | 30 | 30 |
| English 6 | 30 | 30 |
| English 9 | 30 | 30 |
| Math 3 | 70 | 73 |
| Math 6 | 120 | 115 |
| Math 9 | 250 | 250 |
| Science 6 | 55 | 54 |
| Science 9 | 120 | 119 |
| Total | 705 | 701 |

The package inventories eight course PDFs plus the supplied 379-page Math 9 key supplement by SHA-256. All 250 Math 9 Quiz 1 questions are matched by indicator/question context and normalized verbal stems to their supplied keys; unrelated bank questions are excluded. No Grade 3 Science PDF was supplied, so no collection is invented.

Full domain/strand/outcome/indicator descriptions, stable hierarchy IDs, source pages/printed numbers, linked parent/part identities, passages, source labels and key origins are retained privately. Logical question keys are stable; question/passage/asset IDs are scoped to their content version. Science 9's repeated printed Q4 is retained as distinct occurrences, with the second occurrence mapped to its fifth key cell.

Math 3 Indicator 2 Q1/Q3/Q9 become linked one-mark children, adding three responses. The user specifically instructed keeping Q10's verbal part only: retain part b and the printed C key, with part a audited as omitted. One written item uses the printed reference `three thousand twenty - one` and a rubric derived only from its verbal-form instruction.

Seven exact content/key/context repetitions are omitted with surviving identities and omitted hierarchy/source-key records retained: Math 6 Indicator 6 Q6-Q10; Science 6 Indicator 4 Q1; Science 9 Indicator 23 Q1. Repeated numbers or merely similar alternatives are not deduplicated.

All academic source issues remain as supplied under the user's content-as-is instruction. The eight earlier findings each have a recorded disposition. Multipart comma-separated keys are split between child parts. No unsplit multi-answer key set is supplied here; additional plausible answers are not inferred. Generic multi-answer support remains available in the runtime.

## Source fidelity and small runtime accommodation

Plain text is retained wherever it preserves meaning. Essential source fractions/exponents, underlining, diagrams and number lines use authenticated PNG media. PDF table cells define crop boundaries so numerators and figures are not truncated. Source option labels are masked locally and rendered once by the player; original label mappings stay in the audit, including two-option A/C source rows. For these rows a printed C maps to the second displayed option without changing its answer content.

There are 1,063 unique PNG assets and 175 source-notation stems. `stemIsFigure` is optional and preserves old snapshots: the visible image replaces a visually typeset stem while its text remains accessible. Image-only options are allowed only with a valid asset reference. Four matching public contract copies and the backend-only authoring shape are synchronized. No schema migration or mutation protocol changes were needed.

Every retained question has a source-to-hierarchy/key checklist row. Private audits include all Math 9 matches, duplicates, omitted parts, technical label dispositions, source-issue dispositions, and asset crop origins/masks. `source-acceptance.json` binds the precise recipe digest and source hashes to the user's instruction; it certifies source acceptance, not academic correctness or production publication.

## Verification

- All eight immutable snapshot packages pass runtime validation: 701 unique questions/keys with valid taxonomy, passages, order, source and media references; maximum collection 250 questions.
- Every shipped file passes its hash manifest; every PNG passes SHA/signature/dimension checks. Two final builds produce identical hashes for every shipped file.
- All eight private HTML previews render locally, all 1,063 image references decode, and no network requests occur. Source mathematics/graphics were inspected visually, including fraction/exponent cells, number lines, model diagrams, Punnett squares, multipart/two-choice cases, and all collection previews. Rendering defects found during extraction were fixed before finalization.
- Backend: 64 tests passed in six relevant unit suites; the source-visual validation test and malformed-image guards pass. A final validation recheck follows type-only lint cleanup.
- Frontend: 18 player/format browser tests pass, including source-only notation, image-only choices, authenticated media, shared feedback, resume/replay, large navigation and existing Quiz isolation.
- Backend/frontend type checks and production builds pass; changed-code lint passes. Existing PDF.js eval/large-bundle warnings remain.
- Protected source/legacy schemas/phase2 and phase7 migration hashes, four contract copies, response helper parity and practice write scope audits pass. No new runtime dependency was added.

Package digest: `5b2707b34cc3dbf7aa258b28321e64048deac70766e444d26321b805ef7ec48b`.

## Next phase and limits

Phase 9 implements and verifies the practice importer on an isolated local target, with offline dry run, explicit target/apply, idempotency and drift rejection. This package is not a deployed course or proof of database import. Phase 10 handles production schema/draft upload, Phase 11 controlled publication/grants/live acceptance, and Phase 12 handover. SQL Server runtime verification and live AI grading against approved samples remain release gates. Detailed accessibility descriptions for source diagrams should be included in release QA; these crops preserve source notation but do not constitute a full accessibility certification.
