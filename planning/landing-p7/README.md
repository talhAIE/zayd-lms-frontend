# P7 — pricing and package consistency

Independent pricing/copy work is implemented and verified. Seven requirements are complete, three remain partial (two package counts and FAQ-model integration), and routing is blocked by the user's explicit deferral. Full P7 is not complete.

## Changes

`src/pages/public/landing-content.ts` now exports typed `landingPricingPlans` with stable IDs, numeric original/active annual SAR prices, explicit per-plan discount percentages, descriptions, preserved features and action labels. Curriculum/Life are 299 → 199 at 33%; Plus is 599 → 299 at 50%. These are the specified display percentages, not recalculated prices. Existing P1 hero exports remain intact.

`src/pages/public/pricing-section.tsx` consumes that model, renders each plan's discount and applies the exact supplied outer descriptions and “خصم يصل إلى 50% حاليًا على الباقات الثلاث للأفراد.” subtitle. Prices/percentages remain isolated LTR within Arabic. The previous 99.5/199.5 and shared 50% badge no longer appear in pricing.

All four benefits per package, action labels, annual billing, riyal icons, original-price accessible text, centered Plus card, mascot and recommendation are preserved. Pricing CSS is unchanged. No new package, asset, animation, billing/auth implementation or checkout flow was introduced.

## Verification

- TypeScript project build, targeted ESLint (`pricing-section.tsx`, `landing-content.ts`) and Vite production build passed. Existing pdfjs eval and bundle-size warnings remain. Generated TypeScript build metadata was restored to its tracked pre-task state.
- `verify-browser.cjs` passed at 320, 390, 768, 1024 and 1440px. It checks exact header/descriptions, 299/599/299 original amounts, 199/299/199 active amounts, 33/50/33 badges, annual SAR text/icons, LTR numbers, preserved features/action labels, mascot/recommendation, RTL/stacked ordering, visible keyboard focus, no old decimal prices, no visible text/page overflow and no page errors.
- Desktop, mobile, tablet and forced-colors screenshots were visually reviewed. Six PNGs are included. The sticky header is hidden only during section capture; application behavior is unchanged. Focus was checked before blurring for clean screenshots.
- The before/after hashes verify only two existing application files changed. Pricing CSS, all other sections, FAQ, final CTA and original assets match their pre-P7 hashes. `git diff --check` passed.
- Initial browser checks counted intentionally out-of-card mascot decoration and screen-reader-only text as overflow, and assumed a DOM space before the annual slash. Those test assumptions were corrected to check visible text/page overflow and the actual unchanged annual SAR markup. The full rerun passed; no CSS change was needed.

## Requirement/dependency status

Complete: S11-HEADER, S11-CURRICULUM-COPY, S11-CURRICULUM-PRICE, S11-CURRICULUM-KEEP, S11-PLUS-PRICE, S11-LIFE-COPY, S11-LIFE-PRICE. Shared content and `browser-evidence.json` contain per-plan implementation and rendered verification details.

Partial: S11-PLUS-KEEP and S11-LIFE-KEEP preserve every current benefit and CTA, but broader D01 count consistency remains unresolved. Both retain 40; the hero's previously approved +250 is unchanged. No new approval was inferred from a phase implementation request.

Partial: S11-MODEL's shared data and dynamic badges are implemented and verified. The existing package FAQ has no prices; the supplied nine-question FAQ #7 belongs to P9 and remains untouched. P9 should import this model for the same active amounts. No FAQ integration is claimed complete now, and no P9 change was made just to close P7's checklist.

Blocked: S11-ROUTING. User answered: “Keep the destination decision unresolved.” Existing three `/auth/register` hrefs remain unchanged; that route is still missing and falls back to Home. The browser result `routingUnchangedAsRequested` verifies preservation only, not routing correctness. `/login` was proposed but not approved, and its existing page does not support package selection. No unsupported plan query parameters or payment/backend behavior were added.

D07 release-copy review remains open even though the detailed p19 subtitle is implemented and verified. No promotion approval or business signoff is implied. P0 decision snapshots remain unchanged; `decisions.json` records current statuses.

Independent P8 copy/design work can begin when requested, subject to D08 placement/graphics and D09 banner wording decisions. No other phase was implemented, committed, pushed or deployed.
