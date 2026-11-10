# P8 — Schools, dashboard cards and practice banner

All supplied P8 UI/copy is implemented for review and browser-verified. Full P8 is not closed: 11 requirements complete; 11 partial for final composition/wording or capability review. No decision is represented as approved without a response.

## Implementation

Updated `schools-section.tsx` with the exact supplied second headline line, paragraph, first two feature pills and CTA label. Preserved the original first headline line, school badge, illustration/free-account caption, teacher explanation/message, third feature, existing school CSS and `/contact-us` destination/arrow.

Added `SmartDashboardsSection.tsx/.css`: three static informational cards with local typed content, existing Lucide icons and distinct blue/teal/purple treatments. All three titles and all nine bullet strings match the updated PDF. Admin → Teacher → Student appears right-to-left on desktop and in the same DOM/reading order when stacked below 850px. English Nudges is isolated LTR. No screenshots, Nudge/Redeem buttons, event handlers, backend or new animation.

Added `PracticeCallout.tsx/.css`: one prominent centered full-width content strip using the detailed updated sentence ending “استخدامها”. `Main.tsx` inserts the proposed review order: Schools → Smart Dashboards → practice banner → existing FAQ. The banner is separate from the existing final CTA. No P9 FAQ, footer or final CTA work was performed.

## Confirmed requirements and review choices

The PDF supplies the exact school and dashboard strings. Its detailed banner row supplies “استخدامها”; the final review checklist still asks for confirmation. D08 leaves dashboard placement and optional images open. Questions were presented in this turn; no replies were received at verification time. The reversible local review uses the P0 proposed standalone order and icons without screenshots. These remain proposed choices, not approved final decisions. P0 snapshots are unchanged; `decisions.json` records the current status.

Dashboard claims are supplied marketing copy, not functionality created in P8. Source inspection found teacher reporting types and weekly/top-20 leaderboard code. It did not establish live school administration, reporting precision, nudge messaging, color classification or classroom reward-redemption support. `capability-review.json` records supporting references and limits. All nine bullets therefore remain partial for full closure, even though their exact rendered content is verified. No internal review notes were added to the customer-facing UI.

## Verification

- TypeScript project build, targeted ESLint on the four edited/new TSX files, and Vite production build passed. Existing pdfjs eval and large-bundle warnings remain. Generated TypeScript metadata was restored to its pre-task tracked state.
- Browser checks pass at 320, 390, 768, 1024 and 1440px: exact school text, preserved illustration/captions, CTA/arrow/focus, three exact card titles/nine bullets, differentiated cards, LTR Nudges, RTL/stacked order, one exact banner in the proposed position, no extra dashboard controls/images, no overflow or page errors.
- Keyboard activation of the school CTA navigated to `/contact-us` and displayed the existing form. Nothing was submitted. This verifies the existing route, not delivery of a school inquiry.
- Eighteen PNGs capture three sections at five widths and forced-colors at 320. Schools desktop/mobile, cards desktop/1024/mobile/forced-colors, and banner desktop/mobile were visually reviewed. The sticky header is hidden only during section screenshots to avoid overlay artifacts; actual header behavior is unchanged.
- Baseline hashes verify only `schools-section.tsx` and `Main.tsx` changed among existing application files; precisely four component/CSS files were added. Previous work, original assets, pricing riyal symbols, FAQ, footer and school CSS are unchanged. `git diff --check` passed.
- First browser attempt found the previous Vite server stopped; it was restarted at `http://127.0.0.1:5174/`. The first completed run used the existing HTML width attribute as the expected image's natural width; the test was corrected to the unchanged PNG's actual 1103×712 dimensions, then the complete run passed. No image or markup change was required.

## Requirement status

Complete: S12-PRESERVE, S12-HEADLINE, S12-BODY, S12-PILL1, S12-PILL2, S12-PILL3, S12-CTA, S12B-HEADING, S12B-ADMIN-TITLE, S12B-TEACHER-TITLE, S12B-STUDENT-TITLE.

Partial: S12-BANNER (D09 wording/D08 composition), S12B-LAYOUT (D08 final placement), and all nine S12B bullet requirements (supplied copy verified; capability approval open). Evidence is recorded per requirement in `verification.json` and per viewport in `browser-evidence.json`.

Independent P9 work can begin when requested, subject to D09 FAQ draft review, D01 topic count, D10 official contact data and E03 final CTA routing. P7's shared pricing model is available. P9 remains unstarted. No commit, push, deployment or other phase implementation was performed.
