# P9 — nine FAQs and preserved final CTA/footer

Nine supplied FAQs are implemented for review with stable accordion behavior. Eleven implementation requirements complete, two partial, one blocked. Full P9 remains open for draft review (D09), the broader topic count (D01), official contacts (D10) and final CTA routing (E03).

## Changes

`src/pages/public/faq-section.tsx`: added name-origin FAQ #1 and AI-assessment FAQ #6; applied the full supplied ordinary-Unicode Arabic copy to all nine questions/answers in the specified order. The supported-grades answer includes its continuation about daily-life topics. Usage now says about one hour per week. Package comparison uses semantic list items and consumes P7's `landingPricingPlans` amounts in Curriculum → Life → Plus FAQ order: 199 / 199 / 299 SAR/year. All current brands/amounts are kept in Arabic context with isolated LTR English/numbers.

Accordion state uses stable string IDs. “ما هو زيد؟” remains the default expanded topic as item #2. Only one answer opens at a time; each native button retains Enter/Space activation, visible keyboard focus and linked `aria-expanded`/`aria-controls`/`aria-labelledby`. Original header, card treatment and chevron behavior are preserved.

`src/pages/public/faq-section.css`: kept layout and styling, improved answer text contrast to the page's existing gray, and added semantic package-list spacing, including clearance below the focus outline. No redesign, new library, asset, route or backend behavior.

Final CTA/footer TSX/CSS/assets are unchanged. This preserves the final banner copy, both labels, school trial link, brand/tagline, mascot, quick links and copyright. Contact placeholders remain as explicitly requested. Existing primary CTA routing remains unresolved; a preservation check does not call it fixed. All earlier sections, shared pricing content and latest card/banner styling remain unchanged.

## Verification

- TypeScript project build and targeted ESLint passed. Production build passed, including after the final package-list spacing change. Existing pdfjs eval/large-bundle warnings remain. Generated TypeScript metadata was restored to its tracked pre-task state.
- `verify-browser.cjs` extracts its independent expected questions/answers from Appendix A, transcribed from updated PDF pp24–26. It passed at 320, 390, 768, 1024 and 1440px: all nine exact entries, expected order/default topic, unique stable associations, LTR brand text, preserved FAQ header, pricing-card/FAQ amount equality, preserved CTA destinations and contact placeholders, no page errors or clipped answers.
- All nine items at every width were opened with Enter and closed with Space, with single-open state, visible focus and Tab progression checked: 45 keyboard cases. Shared package prices were verified against the rendered pricing cards at every width; pricing source was not modified.
- Fifteen screenshots capture default/package states at five widths, forced-colors at 320, and final CTA/footer at desktop/mobile. Desktop default, mobile package, forced-colors and mobile footer were visually inspected. The first visual review led to adding 8px clearance above the package list so the question's keyboard outline does not touch its first line; the full check was rerun. Sticky header visibility is suppressed only during screenshots to prevent overlays.
- Baseline hashes verify only FAQ TSX/CSS changed among existing application source files. Footer/final CTA source, CSS, assets and prior phase changes are preserved. `git diff --check` passed.

## Remaining decisions

D09: all answers were supplied as drafts. Exact rendering is verified, but no final business approval was inferred from this implementation request. Supplied name/usage/AI/teacher claims remain part of that content review.

D01: existing Life/Plus count 40 remains in package FAQ; hero +250 stays unchanged. Full topic-count consistency is unresolved. FAQ #7's price integration is complete, count approval is not. P7's prior model-consumer dependency is now closed through P9; historical P7 evidence is unchanged.

D10: user answered “keep unresolved” in this turn. No contact details were supplied or invented. Existing `info@youruniversity.com` and `+966500000000` placeholders remain. No new WhatsApp/social links were added.

E03: prior explicit routing deferral persists. Final primary `/auth/register` remains absent and falls back to Home; it is not a completed conversion destination. School-trial `/contact-us` remains unchanged. No contact message or form was submitted.

P10's independent audit can begin when requested, but full closure still requires decisions or accepted scope deferrals. No P10 implementation, commit, push or deployment was performed.
