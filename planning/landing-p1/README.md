# P1: hero and key metrics implementation

Date: 7 November 2026. Current status: **all 8 P1 checklist items complete following user confirmation of +250.** The original +40 verification below is historical; see the amendment at the end.

P0 prerequisites were read and satisfied for independent work. D01 explicitly remains deferred by the user; no new business facts or approvals were inferred. This phase follows the agreed design/content-only scope and adds no live interactions, endpoints, recording or animation system.

## Changes

- `src/pages/public/landing-content.ts`: readonly shared hero and metric copy. The topic value remains +40 with an explicit D01 comment. This is P1 data only; no pricing, FAQ or later-phase content has been changed.
- `src/pages/public/hero-section.tsx`: exact four-skill paragraph, bilingual primary/secondary CTA labels, English brand isolated with `<bdi dir="ltr" lang="en">`, and updated metric subtitles. Existing links and scroll/focus handlers are retained.
- `src/pages/public/hero-section.css`: small tilted blue “جاهز نبدأ” tag restored because P0 observed that required reference element was missing. Its mobile font/padding adapts to narrow widths. Removed the obsolete nowrap rule belonging to the old curriculum phrase.
- `LANDING_PAGE_IMPLEMENTATION_PLAN.md`: seven completed P1 items marked with evidence; the topic item remains unchecked and explicitly partial.

Existing H1, grade badge, images, icons, CTA visual treatments, navbar, metric layout and navigation behavior remain intact. P0's white-strip-vs-blue-card baseline difference was not redesigned. Only hero TSX/CSS and the new P1 content module changed application source; every other frozen application/config file matches P0.

## Verification

- TypeScript: `node node_modules/typescript/bin/tsc -b` passed.
- Production: `node node_modules/vite/bin/vite.js build` passed (4,425 modules). Existing PDF-library eval and large-bundle warnings remain; this phase does not address them.
- ESLint on `hero-section.tsx` and `landing-content.ts`: passed with no diagnostics.
- Browser: local HTTP 200, headless Chrome 156.0.8078.81, reduced-motion capture, fresh unauthenticated context.
- Checked 1440, 1024, 768, 390 and 320px widths: no document horizontal overflow or overflowing in-flow hero content. Exact rendered body/CTA/subtitle strings, English bidi direction, preserved heading/grade/images and +40 value recorded in `browser-evidence.json`.
- Existing primary CTA reaches `/login`. Schools and video links scroll to their existing destinations and transfer focus. Five-link mobile menu opens and closes with Escape. No page errors occurred.
- `viewport-*.png` captures actual top-of-page views; `hero-*.png` captures the full hero after scrolling it into view. The sticky header can overlay the top of a scrolled section crop; the viewport captures separately verify the initial header/grade/H1 presentation. Desktop and narrow/mobile captures were visually inspected.
- Build-generated tracked tsbuildinfo changes were restored to their initially clean contents. No dependency changes, commit, push or deployment.

Evidence: `browser-evidence.json`, ten PNGs, and `verification.json`. P0 snapshots were not regenerated or overwritten.

## Requirement outcomes

- Complete: S2-PRESERVE, S2-BODY, S2-PRIMARY, S2-SECONDARY, S3-CLOCK, S3-MULTIPLIER, S1-PRESERVE.
- Partial: S3-TOPICS. New subtitle is present; document icon is preserved; numeric value stays +40. D01 must resolve before this item or all of P1 can be complete.
- P2 may proceed independently when requested. No P2 edits were made during P1.

## Subsequent user confirmation: +250

The user explicitly requested 250 instead of 40 for the displayed hero topic metric. Updated `landingHeroMetrics` to +250 and retained “موضوعًا وموقفًا من الحياة”. Verified the live local page at 1440px and 320px with no horizontal overflow; targeted ESLint passed. Evidence: `topic-count-confirmation.json`. S3-TOPICS and P1 are now complete. Earlier +40 observations are historical, not current instructions. No other section or phase was changed by this correction.
