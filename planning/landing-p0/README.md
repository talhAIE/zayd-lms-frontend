# Landing page P0 evidence and handover

Status: **P0 preparation complete; application implementation has not started.**

Date: 7 November 2026 (Asia/Karachi). Baseline capture started at 15:00:21 PKT. Current local page: http://127.0.0.1:5174/.

## Source of truth

Current source: `C:/Users/PC/Downloads/Zayd landing page all details.pdf`, 29 pages.

SHA-256: `cde12eb809ca248cfab3bd5f3d908498085f0b0ca58ce11020a2e12d4cdf8aa5`.

The earlier 22-page PDF is historical. The updated PDF's detailed final rows, S6B screenshot mapping, S12B new cards and S15 clarification checklist take precedence over its incomplete opening summary. Full extracted page text and per-page hashes are archived in `source/pdf-text.txt` and `source-manifest.json`. No new PDF or application asset was authored.

The PDF describes proposed business copy and unresolved facts as well as definite implementation requirements. “Specified” means the document states the intended UI/copy; it does not certify that a marketing statistic or capability was independently verified. No person was contacted, no forms were submitted, no demo session was started, and no production data was accessed.

## P0 deliverables

- **Requirements:** `requirements.json` maps all 134 planned work/verification items to P0-P10. Five P0 items are complete; all later-phase items remain unimplemented. The main implementation plan remains the human-readable scope.
- **Frozen source:** `source-manifest.json` records the PDF identity, git HEAD and hashes for 439 application/config files. These establish the no-application-change baseline.
- **Browser baseline:** `baseline/` contains 16 PNGs, three DOM/text snapshots and `baseline-report.json` covering desktop, tablet and mobile. Section crops capture existing video, comparison, curriculum, feature cards, pricing, schools, FAQ and footer.
- **Asset inventory:** `asset-inventory.json` records actual paths, hashes/dimensions, use sites, all eight screenshot references, six audio dependencies, two prompt dependencies, four icon needs and optional S12B graphics.
- **Reference extraction:** `reference-images/` contains the four paired PNGs embedded on PDF pages 10-11. They remain reference evidence, not selected production assets.
- **Decision record:** `decisions.json` tracks D01-D10 and E01-E04, with an owner role, evidence, status, next action and affected phases. Owner for business choices is the user; no colleague's identity or approval is invented.
- **Typed content blueprint:** `content-contract.ts` plus `content-data.json` establishes a planning-only data contract for hero copy, metric subtitles, unresolved/shared counts, impact totals, unit labels, prices, all nine FAQ drafts, banner, contacts, prompts and screenshot mappings. It is outside `src`, has no runtime consumers and does not begin P1.
- **Verification:** `verification.json` records source/PDF integrity, data shape/count checks and the standalone TypeScript contract check.

## Browser baseline

Captured with fresh, unauthenticated headless Chrome 156.0.8078.81 at device scale 1, reduced motion, locale en-US. Browser network was not mocked. App fonts Almarai and IBM Plex Sans Arabic loaded successfully.

- Desktop: 1440 × 1000, HTTP 200, no document-level horizontal overflow, no broken `<img>` elements.
- Tablet: 768 × 1024, HTTP 200, no document-level horizontal overflow, no broken `<img>` elements.
- Mobile: 390 × 844, HTTP 200, no document-level horizontal overflow, no broken `<img>` elements.
- No page exceptions or failed browser requests in the completed capture.
- Ten expected local behaviors were observed successfully: desktop Pricing anchor; FAQ second-item expansion/first-item collapse; FAQ closure; hero CTA to `/login`; tablet and mobile menu opening, Escape closure and Schools-anchor closure.
- One additional observation reproduces an existing defect: pricing requests `/auth/register`, then the SPA catch-all returns to `/`. The script's `passed` field means the observation ran successfully; `expectedProductBehavior:false` identifies that this is not correct conversion behavior.

The first capture-script run had a selector error because the menu button's accessible name changes from “open” to “close.” The capture script was corrected and the full capture rerun. Final evidence contains no selector failures; no application code was changed to achieve that result.

Live demos, microphone, authenticated pages, contact submission and actual audio playback were deliberately not exercised. Mobile/tablet are viewport simulations, not real-device certification. Reduced-motion capture is a stable baseline, not validation of all animations. P10 still owns full 320px, 200% zoom, keyboard/accessibility and real audio interaction checks.

## Existing differences to preserve or resolve in their assigned phases

These are observations, **not user-approved deviations from the PDF**.

1. **B01 — Video, S4:** current standalone heading and dark large player differ from the reference horizontal gradient banner. There is no video source; the play button is deliberately disabled. Preserve during scoped later changes; exact reference alignment/video supply is not silently approved by this P0 report.
2. **B02 — Comparison intro, S5:** current paragraph mentions grammar, speaking regularly and fear of mistakes; the PDF's unchanged reference discusses insufficient individual practice time. Main plan S5-INTRO records this baseline discrepancy for P2; no accepted variance is claimed.
3. **B03 — Comparison placement:** rendered Zayd title starts at x=773, Classroom at x=191 in the 1440px capture. Zayd is visibly on the right, opposite the PDF requirement. Correct in P2.
4. **B04 — Comparison style:** green/rose cards exist, but the white section lacks the specified full-width slate framing, new Zayd treatment and VS badge. Correct in P2.
5. **B05 — Metrics:** current background is a single white strip, not the PDF's three blue cards. The PDF requests updated text while treating the prior card design as baseline. Record this pre-existing visual difference; P1 should not claim pixel parity or introduce an unrelated metric redesign without explicitly accounting for it.
6. **B06 — Curriculum:** pills are static and the last RTL row starts with self-expression; reference order lists form/meaning/function before self-expression. No showcase exists. Preserve body/grade copy; implement intended tabs/mapping in P3.
7. **B07 — Hero tag:** the “جاهز نبدأ” tag shown in the reference is not visible in the captured hero and is not rendered by the current component. Preserve the current scene baseline while explicitly resolving S2-PRESERVE's missing reference tag in P1; do not call it already present.
8. **B08 — Personalized cards:** all six visible cards are demo modes, not the benefit texts defined in the same file. P4 must restore the specified benefits; P5 owns the new inline two-tab demo.
9. **B09 — Pricing:** current outer prices are 99.5 with old 199, Plus is 199.5 with old 399, and every badge says 50%. Correct in P7; preserve annual SAR semantics.
10. **B10 — FAQ:** seven entries; What is Zayd is expanded by default. P9 will add/revise to nine entries while explicitly selecting default expansion by stable ID.
11. **B11 — Footer:** current background is bright blue rather than the PDF's described dark blue; placeholder email/phone remain. Preserve layout/brand/copyright; D10 owns official data. No official contacts were inferred from other sites.
12. **B12 — Language metadata:** document language is `en` while the landing wrapper is RTL and most sections declare Arabic. Record for P10 language/accessibility closure rather than fixing it in P0.
13. **B13 — Missing registration route:** reproduced `/auth/register` → Home fallback. E03 remains a product routing choice for P7/P9. The valid current hero `/login` route is a candidate, not an approved replacement.

Baseline DOM text, links, heading lists and positions are preserved in the three `*-dom.json` files for later comparisons. Screenshots have been visually inspected for the hero at all three sizes and for desktop comparison/video/curriculum/features/footer. Full-page images and remaining section crops are archived as additional evidence; they are not a claim of an exhaustive accessibility audit.

## Asset readiness

**Available:** 19 assets referenced directly by active landing components, including current character/scene/logo images, metrics icons, six-benefit icon sprite, scenario sprite, impact graphic, school composite and footer character. All have measured metadata in the inventory. Twenty-four existing user-guide screenshot candidates are inventoried separately; none is silently substituted for an approved S6B screenshot.

**Available as references:** eight S6B screenshot references represented by four 1834×522 paired images. Individual screenshots have no independent source dimensions because only paired composites were supplied. The reading/debate-to-tabs ambiguity remains D03, and production quality/privacy remains E04.

**Still needed:** six approved dialogue clips and transcripts; exact Reading/Speaking sample text; approved icons for the four added features (library icons are proposed candidates); a selected admin/teacher/leaderboard graphic set if D08 chooses imagery; promotional video if actual S4 playback is later required. The only audio/video file under `src` and `public` is `public/avatar/placeholder.mp4`, which is not a scenario dialogue clip.

Existing guest reading/roleplay transport and recording hooks are implementation capabilities, not proof that the exact new demo prompts or score/word feedback contract is ready. Their server content was not queried in P0.

## Decision readiness and P1 boundary

The user explicitly chose **“Keep this decision unresolved for now”** for D01 (40+/250+ topics). That instruction is recorded as `deferred_by_user`. No 250+ global change is authorized as an approved fact by this record.

P1 **can begin partially**: build the shared content structure and apply independent hero paragraph, bilingual CTA labels, Clock/×10 subtitles and preservation checks. Keep existing topic count until D01 is resolved; do not mark S3-TOPICS or all of P1 complete meanwhile. No other P1 business dependency was discovered. Existing baseline differences must remain explicitly recorded.

D02 has explicit design defaults in the PDF. D07 and D09 have supplied detailed copy plus an outstanding review request. D03-D06, D08 and D10 still need the named inputs/choices. Their details and affected phases are in `decisions.json`. None is treated as a new approval, and none blocks completion of this P0 discovery work.

## Reproducibility and scope

`inventory-source.py` performs initial source/PDF inventory and reference extraction; do not rerun it after application edits as if it were the original baseline. `build-records.cjs` materializes planning records from the plan and inventories. `capture-baseline.cjs` captures the local page and checks local navigation only; it uses this desktop environment's bundled Playwright package and installed Chrome. Re-running it refreshes screenshots, so retain a versioned baseline before later implementation changes.

Application source and configuration hashes are checked against the frozen manifest at P0 closure. No build, dependency update, commit, push or deployment was performed. The local dev server was restarted only to obtain the requested baseline.
