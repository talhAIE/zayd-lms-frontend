# NAFS text-first content correction — 2026-11-04

This correction supersedes the full-MCQ-image presentation described in the earlier Phase 4 report. All 63 launch questions now display their text and choices once. The visible learner media consists of 19 essential figures/tables/graphs and 16 individual image choices, cropped without question text or printed answer letters. The three reading passages render directly as text with their emphasis preserved. Fractions render as selectable, stacked text; powers/subscripts remain in the authored text. The Grade 3 missing-addend question includes its addition sentence as text.

The original `learner-content.json`, answer keys, PDFs and full-question crops remain an unchanged source archive. `learner-presentation.json` and generated backend display metadata specify the learner-only figures. The backend matches immutable snapshot question wording and options to this presentation map, so existing unfinished attempts receive the corrected display without rewriting their snapshots, selections, scores, identity or content version. Private image delivery checks the owned unfinished attempt before serving any cropped figure.

`prepare-learner-presentation.py` rebuilds the 35 display PNGs and their metadata from archived source crops. `presentation-media.cjs` installs these PNGs in dedicated private paths; both the content import and the local manual preview startup call it. The original 82 archived PNGs are retained for provenance and are not all displayed to learners.

No tests, browser automation, lint or build were run for this correction, as requested. Browser fixtures were adjusted for text-only questions and cropped figures, but have not been executed. Previous verification JSON describes the previous presentation; it is not evidence of verification of this change. Manual acceptance is pending. The seven academic findings remain unresolved; this is a presentation correction, not academic approval.

## Local manual preview

From the backend, run `npm run nafs:test:bootstrap` if the owned local database is stopped, then `npm run nafs:preview`. From the frontend, run `pnpm run dev:nafs`. Open `http://127.0.0.1:5180/login`, using username only:

| Username | Content |
|---|---|
| `nafs.test.grade3` | English and Mathematics, Grade 3 |
| `nafs.test.grade6` | English, Mathematics and Science, Grade 6 |
| `nafs.test.grade9` | English, Mathematics and Science, Grade 9 |

The preview API listens only on `127.0.0.1:5018`, using the owned local PostgreSQL database and private media. Its login uses the existing AuthController/AuthService/TokenService with a local account allowlist; placeholder contact numbers avoid asking for real phone numbers. Accounts have no real grade, class or school assignment; explicit NAFS grants select their content.

Manual preview questions are separate draft copies. A preview-only repository adapter permits those specific draft-copy IDs in this local runtime; both original and preview versions remain draft/pending. The production NAFS module retains its publication checks. Source-derived test marks use the supplied keys and are not approved assessment results. Starting either runtime does not reset student attempts; previously completed quizzes stay completed. The ordinary backend on port 4000 does not contain these accounts unless separately provisioned, which has not been done.

No production database, `.env`, real account or production feature flag was changed.
