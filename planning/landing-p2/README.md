# P2: classroom comparison implementation

Date: 7 November 2026. Status: **all 13 P2 checklist items complete and verified**. No P3 implementation was started.

The first line of the request mentioned P1, but its implementation scope, completion report and stopping instruction explicitly selected P2. This work followed P2. P0 baseline and D02 were read before editing. D02 supplies concrete default styles, so no new business decision blocks this phase. P1's deferred D01 topic count remains untouched.

## Changes and requirement references

- `src/pages/public/comparison-section.tsx`: restores the PDF's reference intro (S5-INTRO), keeps the existing eyebrow/question heading, and applies all nine changed copy units: classroom body, three warnings, Zayd title/body and three benefits (S5-CLASSROOM-BODY, S5-WARNING-1/2/3, S5-ZAYD-TITLE/BODY, S5-BENEFIT-1/2/3). The user's request for exact PDF copy resolves the previously recorded intro-baseline mismatch in favor of the reference; no unapproved variance is claimed.
- The first semantic article is Classroom and the second is Zayd. The RTL two-column grid puts Classroom on the right and Zayd on the left. Below 1024px they stack Classroom first. Named articles, warning/check icons and explicit badges convey the distinction beyond color.
- `src/pages/public/comparison-section.css`: local slate #F1F5F9 container, 24px radius, 48px/32px desktop padding (S5-CONTAINER); rose classroom border/badge/text #FECDD3/#FFE4E6/#BE123C (S5-CLASSROOM-STYLE); white Zayd surface, 2px #0EA5E9 border and soft shadow (S5-ZAYD-STYLE). The decorative VS badge fits entirely in the desktop card gap and is hidden on stacked layouts; it cannot intercept input.
- Mobile padding/type size adapt to 320px. Arabic heading line height allows glyphs/diacritics room. Forced-color styling preserves card boundaries; labels and icon shapes remain present.
- The main implementation plan marks only P2's 13 items complete and records the evidence. Earlier P1 changes were preserved; other page components were not edited.

## Verification

- TypeScript `tsc -b`: passed.
- Targeted ESLint on `comparison-section.tsx`: passed with no diagnostics.
- Vite production build: passed. Rebuilt after the final CSS line-height adjustment. Existing PDF-library eval and large-bundle warnings remain outside this phase.
- Browser, local HTTP 200: inspected 1440, 1024, 768, 390 and 320px widths. No horizontal overflow or measured text clipping; no page errors. Desktop card positions and mobile reading order verified from bounding boxes.
- Exact nine changed copy units, reference intro, badges and classroom title verified against the requirements. Desktop frame dimensions/colors and card borders/badges match the stated spec.
- VS occupies only the desktop gap; it is hidden on tablet/mobile and has `aria-hidden` plus `pointer-events:none`. The section has no focusable controls to obscure.
- Captured six section PNGs: five widths plus 320px forced colors. Desktop, narrow and forced-color results were visually inspected. To avoid a full-section screenshot artifact, the unrelated sticky site header is hidden **only in screenshot rendering**; application source and page layout are not changed by that capture style.
- P1's rendered paragraph/CTA labels and +40 topic count are unchanged. Source hashes taken at this turn's start confirm that only `comparison-section.tsx` and its new CSS changed this turn. Build-generated tsbuildinfo changes were restored.

Evidence: `browser-evidence.json`, `verification.json`, `comparison-*.png`, and `before-source-hashes.json`. P0/P1 snapshots were not regenerated. No dependency changes, commits, pushes or deployments.

## Remaining dependencies and next phase

No P2 requirements remain open. D01 is still deferred and belongs to P1/topic consistency; it is not a P2 blocker.

P3 can begin independent **design/content-only** screenshot presentation when requested. The user's later scope excludes building new screenshot-tab functionality, live demos and audio-preview systems. Selecting suitable screenshot assets and closing the relevant D03/E04 mapping/quality questions are still necessary before claiming final screenshot readiness. No P3 code or checklist completion is included here.
