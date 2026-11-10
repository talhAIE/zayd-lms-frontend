# P6 — life scenarios, future skills and impact

Independent P6 design/content changes are implemented and verified. Full P6 remains incomplete: 13 requirements complete, S8-BODY partial pending D01, three counters blocked by D06, and audio previews deferred by the user's existing design/content-only scope.

## Changes

Section 8: applied the PDF's exact teal/sky gradient, 28px radius, 1px sky border and 56×40px desktop padding, with tablet/mobile adaptations. Updated the paragraph and two-part blue callout, plus the fifth/sixth labels. Preserved the existing badge, headline, six original scenario images/positions and first four labels. Brand names remain isolated as LTR. No audio controls, hover animation or new interactive behavior were added.

Section 9: replaced the body and bottom two pills with the exact supplied Arabic. Preserved the existing heading, badge, gradient, first three white pills and RTL order. Added sensible minimum font sizes for body/pills at intermediate widths.

Section 10: updated the headline to “يعادل”, applied the exact supplied paragraph and disclaimer, and retained the original 3D illustration/calendar labels and badge. The disclaimer is immediately adjacent to the claim with a minimum 12px font. Existing counters and their units/icons are unchanged pending data approval.

Application edits are limited to `zayd-life-section.tsx/.css`, `future-skills-section.tsx/.css`, and `impact-stats-section.tsx/.css`. No new assets, dependencies, application modules or services. Earlier P1/P2/P4 work and the comparison reference styling are preserved; P3 remains undone and P5 remains unimplemented.

## Decisions and remaining inputs

D01: the previous +250 confirmation was applied to the hero. Whether it covers the Life/Plus paragraph/catalog remains unresolved. A question was presented during P6; no response was received at verification time. The existing/literal PDF count 40 is retained while the independent surrounding wording is updated. Browser checks verify that rendering, not the underlying entitlement or cross-section consistency. S8-BODY remains partial. No global replacements in pricing or FAQs were made.

D06: approved student/time/lesson totals, time unit, reporting scope/date and completed-lesson replacement remain missing. A question was presented; no response was received at verification time. The original +1,000 / +2,200 hours / +8,600 counters are preserved; they are not newly verified or approved. The proposed 2,500+ and 5,000+ hours/300,000+ minutes were not silently treated as approved. S10-STUDENTS/TIME/LESSONS remain blocked.

S8-PREVIEW/E01: audio and motion additions remain outside current scope. Six clips/transcripts, including the sixth scenario, remain unsupplied in P0. No inert playback button or keyboard-focusable static card was added. No audio or new playback functionality was implemented.

P0 decisions remain unchanged as a historical record; current dependency handling is recorded in `decisions.json`. No unresolved decision is called approved, and no internal review label was added to the customer page.

## Verification

- TypeScript project build, targeted ESLint on all three P6 TSX files and Vite production build passed. Existing pdfjs eval and bundle-size warnings remain. Generated TypeScript metadata was restored to the tracked pre-task state.
- `verify-browser.cjs` passed at 320, 390, 768, 1024 and 1440px: exact copy/labels, frame colors/dimensions, unchanged sprite mapping, decoded images, LTR brands, white future pills/gradient, bottom-pill RTL position, disclaimer adjacency/minimum size, no extra life-section controls, no overflow and no page errors.
- The counter test verifies preservation only; it cannot verify business data. The paragraph test verifies the current value 40 only; it does not close D01. These distinctions are explicit in browser evidence and requirement statuses.
- Eighteen screenshots captured: three sections at five widths plus forced-colors at 320. Life desktop/mobile/1024, future tablet/mobile/forced-colors, and impact desktop/mobile were visually inspected. Sticky header visibility is suppressed only during screenshot capture to avoid overlays; application behavior is unchanged.
- Before/after source hashes confirm exactly six changed application source files, all in P6. `git diff --check` passed.
- The initial browser run compared concatenated `textContent` of existing block heading spans against strings containing spaces. The test was corrected to join those spans with a space, and the full run then passed; no application heading change was necessary for that test assumption.

UI verification was performed on 7 November 2026; that is not a reporting date for impact counters. See `verification.json`, `browser-evidence.json` and screenshots for individual checks.

P7 can proceed with independent work when requested, subject to its own count/pricing-copy/routing decisions. No P7 work, commit, push or deployment was performed.
