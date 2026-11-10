# P4 — confirmed benefit cards

The authorized six-benefit scope is complete: nine requirements verified. Four proposed additions remain deferred by the user's explicit reply: “Keep unresolved; implement the six confirmed benefits only.” The original thirteen-requirement P4 is therefore not fully closed.

## Changes

Updated `src/pages/public/personalized-learning-section.tsx` with the exact supplied Arabic subtitle and six benefit titles/descriptions from PDF pages 12–13. The feature model now renders actual benefit cards instead of having every benefit replaced with demo-mode copy. The existing two-line heading, tablet character, original icon sprite and responsive benefit layout are preserved. Desktop and tablet order remains three columns in RTL; narrow mobile retains two columns with every benefit.

All six existing demo entry points are in a separate list below the benefits, using their existing Arabic titles/descriptions, icons, lazy modals and click handlers. CSS adds compact entry styling and visible keyboard focus without new animation. No demo modal, service, voice flow or shared stylesheet was modified. No P5 widget was added.

No CEFR, avatar, certificate or reward claims were added. No new artwork, package or application file was necessary. `personalized-learning-section.css` contains the presentation changes. Other sections, including P1/P2 and the undone P3, are preserved.

## Verification

- TypeScript: `node node_modules/typescript/bin/tsc -b` — passed.
- Targeted ESLint: `node node_modules/eslint/bin/eslint.js src/pages/public/personalized-learning-section.tsx` — passed.
- Production build: `node node_modules/vite/bin/vite.js build` — passed; existing pdfjs eval and large-bundle warnings remain. Generated TypeScript build metadata was restored to its tracked pre-task state.
- Browser acceptance: `node planning/landing-p4/verify-browser.cjs` — passed at 320, 390, 768, 1024 and 1440px. Exact Arabic title/subtitle and six card bodies, sprite mapping, RTL ordering, preserved avatar, absent unapproved additions, separate six demo controls, no overflow and no page errors were checked.
- All six existing demos keyboard-opened, rendered mode controls and Escape-closed at both 320px and 1440px: twelve successful modal checks. Evidence records rendered content, not just wrapper titles. No microphone attempt, recording or live assessment was performed; those are not part of P4.
- Desktop, tablet, narrow mobile and forced-colors screenshots were visually reviewed. Header visibility is suppressed only for section screenshot capture to prevent sticky-header overlay; the application header is unchanged.
- Before/after source hashes confirm that only the personalized TSX/CSS changed among existing source files. `git diff --check` passes.

The first browser run used an arbitrary 300-character minimum for loaded demo content and timed out on a short valid mode. Verification was corrected to wait for visible mode controls, then the full responsive and twelve-demo run passed. No application fix was needed for that test assumption.

## Requirement evidence

S7-HEADER, S7-SUBTITLE and S7-BENEFIT1–6 map to the heading/description and `pillars` model in `personalized-learning-section.tsx`. Their exact DOM content, sprite positions and layout coordinates are recorded per viewport in `browser-evidence.json`. S7-RENDERING maps to the independent benefit and demo lists, with twelve modal keyboard checks in the same evidence file. All nine are complete.

S7-CEFR, S7-AVATAR, S7-CERTIFICATES and S7-REWARDS remain unimplemented and unchecked. `decisions.json` records the latest user instruction and the approval/copy/layout dependency. Original P0 evidence remains unchanged.

P2 prerequisites are satisfied by its completed verification record. P3 screenshot work remains undone; it does not block these P4 copy/rendering corrections. P5 is still excluded by the current design/content-only scope and requires explicit authorization, approved prompts (D04), and verification of real guest feedback (E02) before its original live-widget scope can begin. No later phase was started, and nothing was committed, pushed or deployed.
