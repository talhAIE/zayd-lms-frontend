# Zayd landing page: updated PDF analysis and complete implementation plan

Prepared: 7 November 2026. Status: P0 preparation complete; P1 complete (8 of 8 items verified); P2 complete and verified (comparison UI subsequently restyled at user request); P3 changes undone; P4's nine confirmed requirements implemented and verified, four proposed additions deferred by user; P5 unstarted; P6 independent design/content changes verified with D01/D06 open and audio deferred; P7 pricing/copy/model and P9 price-consumer integration verified with count/routing/release-review dependencies open; P8 review UI implemented and verified with placement/wording/capability review open; P9 nine FAQ entries implemented for review with count/copy-review/contact/routing dependencies open; P10 unstarted. The user subsequently confirmed +250 for the hero topic metric; historical D01 deferral no longer blocks that value.

Primary source: `C:/Users/PC/Downloads/Zayd landing page all details.pdf` (29 pages). This plan supersedes the discussion based on the earlier 22-page specification. All 29 pages were text-extracted and rendered for visual inspection. The updated document was compared with the active React landing components and styles.

The PDF contains the requested product requirements, references, proposals and unresolved questions. Its request to send questions to a colleague is reference material, not authorization to contact anyone. No messages have been sent, no deployment has been performed, and no application source was changed for this analysis.

## How to use this plan

Use the PDF's own section numbers S1-S14, plus S6B and S12B, when referring to requirements. `Main.tsx` has older section-number comments that do not match the PDF. S15 is an implementation decision checklist, not a new customer-facing page section.

Every checklist item below has a unique requirement ID, an implementation phase and a PDF page reference. An unchecked box means the requirement is planned, not implemented. Checked P0 items indicate completed planning/evidence work, not application implementation. Preserved elements are included because the specification explicitly requires them to remain unchanged. Completion requires both the requested changes and the preservation checks to pass.

There are eleven implementation phases, P0-P10. Each phase describes scope, code ownership, dependencies and a completion gate. The phases cover the full updated specification, including the additions that the opening executive summary does not enumerate.

**Current implementation scope (user steering after P0):** design and content changes using existing capabilities only. The original PDF interaction requirements remain recorded for traceability but are deferred: no new screenshot-tab functionality, live reading/speaking widget, audio-preview system or dashboard backend. P3 is limited to static screenshot presentation with existing skill pills; P5's new widget is excluded; P6 audio additions are excluded. Existing demos and accordion behavior are preserved. This scope restriction does not mark the deferred full-PDF requirements complete.

### Source interpretation rules

1. Use the updated 29-page PDF for scope. Do not carry forward the earlier conclusion that FAQ answers are missing: all nine answers are now supplied on pages 24-26, although S15 requests review of the supplied drafts.
2. Use detailed final-copy rows and added subsections over the stale opening summary. Do not treat an unresolved item in S15 as an approved fact.
3. Keep Arabic UI copy as native text. English translations in the PDF explain the Arabic to the implementation team; they do not request a complete English-language landing page. Keep bilingual names where expressly requested.
4. Normalize Arabic presentation-form glyphs from extraction to ordinary Unicode characters, preserving spelling, punctuation, diacritics and meaning. Do not paste visually reversed Arabic or insert manual spacing to fix bidirectional rendering. Isolate English names, prices and percentages with appropriate bidi markup.
5. Red pen, yellow highlighter, callout circles and table annotations are review markup. Do not reproduce them as interface decoration. Implement the separately written UI specifications for backgrounds, borders, badges and interactions.
6. Named screens, fixed screenshot scores, progress percentages, timestamps and turn counts describe screenshot content, not live application state or new requirements to rebuild the underlying LMS modes.
7. Marketing presentation of dashboards, CEFR, certificates and rewards is in scope. Building new administrative systems, grading services, reward redemption engines or payment processing is not implicitly requested by this landing-page plan. Verify claimed features against the product before publishing those claims.

## What changed in the updated document

The opening summary retains the earlier 14-section structure, but the detailed pages now include:

- A center hero metric of 250+ topics instead of 40+, with cross-page consistency still explicitly unresolved (p5, p27).
- Concrete comparison-container colors, card treatments and a VS badge (p7).
- Eight clickable curriculum skill tabs and a device-framed screenshot showcase; S6B maps screenshots from referenced PowerPoint slides 5-12 (pp8-11).
- A real two-tab reading/speaking mini-widget, microphone interaction, waveform, pronunciation score and word feedback (p12).
- Four additional feature boxes: CEFR, 3D avatar modes, certificates/badges, and points/rewards. Their Arabic copy and placement are proposals awaiting confirmation (pp13-14, p28).
- A teal/sky framed life-scenarios section with hover effects and audio previews (p15).
- Updated student and practice totals recorded in S15: 2,500+ students and 5,000+ hours or 300,000+ minutes. The detailed impact table still shows older values, and the lessons total remains unresolved (p18, p28).
- An explicit pricing subtitle using “up to 50%” (p19), although the final checklist still requests confirmation.
- A new banner whose detailed final wording ends in استخدامها, and a new three-card Smart Dashboards & Gamification section, S12B (pp22-23).
- Complete Arabic and English answers for all nine FAQs, including changes to existing answers (pp24-26).
- Ten numbered clarification items that must be tracked rather than silently ignored (pp27-29).

## Current implementation and the main gaps

Active page composition is in `src/pages/public/Main.tsx`.

- `hero-section.tsx` contains both the hero and the three key metrics. Current body/CTA/subtitle copy is older; topics still show +40.
- `comparison-section.tsx` has green/rose cards, but the first DOM card is the positive Zayd card. In the RTL grid that can put the positive card on the right, whereas the PDF requires Classroom right / Zayd left. The full-width background, specified badges and VS treatment are not implemented. Its intro also differs from the PDF's unchanged reference text.
- `curriculum-section.tsx` renders eight static list pills. It has no screenshot tabs, screenshot mapping, active panel or device frame. The final two pills are currently ordered differently from the PDF's listed RTL sequence.
- `personalized-learning-section.tsx` defines six benefit pillars but substitutes `demo.title` and `demo.desc` for every one at render time. Visitors see six demo-mode cards instead of the required benefit cards. The existing reading/roleplay/listening/component demos are reusable capabilities, but modal links alone do not meet the new inline two-tab mini-widget specification.
- `zayd-life-section.tsx` renders a static six-image sprite with old copy. There is no audio-preview model or playback UI.
- `future-skills-section.tsx` and `impact-stats-section.tsx` contain older copy; impact still uses تساوي and the older +1,000 / +2,200 / +8,600 totals.
- `pricing-section.tsx` uses 199→99.5 on the outer plans, 399→199.5 in the middle and a hardcoded 50% badge on every card. It needs per-plan discounts and new prices.
- `schools-section.tsx` contains the older school copy. The new practice/use banner and S12B section do not exist.
- `faq-section.tsx` has seven items, older answers and an index-based default expansion.
- `footer.tsx` contains placeholder contact details. The PDF keeps its design but explicitly asks for official contact data in S15.
- `video-showcase-section.tsx` differs from the PDF's unchanged horizontal banner and has no supplied promotional video source. This is a pre-existing baseline difference to record, not a reason to claim a newly implemented video redesign. Preserve it during scoped changes unless reference alignment is chosen in P0.
- Pricing and the final CTA currently link to `/auth/register`; the active router has no such route. Record this existing conversion defect and agree its destination as part of integration. Adding a checkout is not implied.

## P0 — Lock the requirements, decisions, assets and baseline

Purpose: turn the conflicting parts of the document into explicit implementation inputs while preserving work that can proceed independently.

Files/work areas: this plan; a future `src/pages/public/landing-content.ts` content/config module; asset inventory under `src/assets/landing-page/`; baseline screenshots and a decision record.

- [x] **P0-SOURCE** — Freeze the updated PDF as the working source, identify its detailed S6B/S12B additions, and record all S15 decisions. Keep the earlier PDF as historical context only. Source: pp1-29. Evidence: `planning/landing-p0/source-manifest.json`, `source/pdf-text.txt`; current PDF SHA-256 `cde12eb809ca248cfab3bd5f3d908498085f0b0ca58ce11020a2e12d4cdf8aa5`, 29 pages.
- [x] **P0-BASELINE** — Capture current desktop, tablet and mobile landing-page screenshots and interactions. Record pre-existing differences in unchanged sections, especially S4 video and S5 intro, separately from regressions caused by this work. Source: S1/S4/S14, pp2-6, pp26-27. Evidence: `planning/landing-p0/baseline/` (1440×1000, 768×1024, 390×844); `baseline-report.json`; README observations B01-B13. Ten expected behaviors and one existing conversion defect reproduced; no application fixes made.
- [x] **P0-CONTENT** — Establish typed data for supplied copy, topic count, student/practice/lesson totals, unit labels, pricing, FAQ entries and asset mapping, keeping approval status explicit. A single decision must update every dependent occurrence. Avoid a CMS or broad state-management rewrite. Source: p5, pp18-20, pp24-29. Evidence: planning-only `content-contract.ts` and `content-data.json`, outside `src` and not imported by the app; standalone TypeScript check passed. Business approval is not inferred from supplied draft copy.
- [x] **P0-ASSETS** — Inventory all eight screenshot references, six dialogue clips, two demo prompts, four new feature icons, and optional S12B graphics. Record source, dimensions, suitability, caption/alt text, and whether the asset is supplied or still needed. Source: pp9-15, pp22-23. Evidence: `planning/landing-p0/asset-inventory.json` and `reference-images/`; missing assets remain marked missing, not fabricated.
- [x] **P0-DECISIONS** — Track D01-D10 below and the extra engineering questions E01-E04. Unresolved content must not be represented as approved release content. Source: pp27-29. Evidence: `planning/landing-p0/decisions.json` assigns owner/status/evidence/next action. User explicitly deferred D01; all other unconfirmed choices remain unapproved.

P0 closure evidence and P1 handover: [P0 report](planning/landing-p0/README.md). P0 is complete as requirements discovery and preparation; it does not imply that business decisions or later-phase assets are approved. P1 is now complete after the user confirmed +250 for the hero metric. P2 is verified; P3 changes were undone; P4's nine confirmed requirements are verified and four additions remain deferred by user. P5 is unstarted; P6 independent design/content changes are verified with topic/impact-data dependencies open; P7 prices/model and P9 FAQ price integration are verified with count/routing/release review open; P8 review UI is verified with placement/wording/capability review open; P9 FAQ review implementation is verified with count/copy-review/contact/routing dependencies open; P10 is unstarted. The P0 evidence remains an unchanged historical snapshot.

### S15 decision register: all ten PDF items

**D01 — Topic count, p27.** The S3 final row says 250+; S8, S11 and the new package FAQ still say 40+. Proposed direction: use one approved count globally. Product must confirm whether 250 counts the same entitled daily-life topics/situations or a broader content catalog. This affects S3, S8, both relevant pricing bullets, FAQ #7, demo descriptions and any graphics containing the old count. Do not blindly replace every occurrence of the digits 40, since CSS values and unrelated content exist. **Latest status:** user subsequently confirmed 250 for the hero metric. Implemented as +250; desktop/mobile evidence is in planning/landing-p1/topic-count-confirmation.json. P0 records retain the earlier deferral as history. Other-section propagation belongs to those sections when authorized.

**D02 — Visual treatment, pp27-28.** Concrete styles are already supplied on pp7 and 15; use them for the first implementation. A bespoke alternative is optional design feedback, not a reason to stop deterministic copy changes. Proposed baseline: soft slate comparison section and teal/sky life container as specified.

**D03 — Screenshot mapping and language, p28.** The PDF names eight screenshots but maps both discussion and self-expression to the debate screenshot and supplies two reading screenshots. Confirm the eighth-tab mapping and approval of English product UI inside the Arabic marketing page. Implementation can support multiple images per tab; it should not pretend all eight mappings are uniquely established.

**D04 — Demo prompts, p28.** Exact one-to-two English sample sentences/prompts are not supplied. Choose grade-appropriate review drafts or reuse suitable existing demo content; product must settle the final wording. A functioning guest assessment response is also needed for the live result state.

**D05 — Four new feature boxes, p28.** Arabic titles/bodies are supplied as proposals on pp13-14. Confirm them and decide ten integrated cards versus six core cards plus a separate four-card row. Recommended structure: preserve the six core benefits and add a clearly grouped four-card row within S7 so all ten remain readable next to the character/demo.

**D06 — Impact totals, p28.** New proposed totals: 2,500+ registered students, 5,000+ hours OR 300,000+ minutes. These time values are equivalent: 5,000 × 60 = 300,000. Confirm display unit, reporting scope/date and replacement lessons total; do not relabel 5,000 as minutes or imply both time figures are separate achievements. The old 8,600+ lessons is not a newly verified value.

**D07 — Pricing subtitle, p28.** The detailed final row on p19 already provides “خصم يصل إلى 50% حاليًا على الباقات الثلاث للأفراد.” Use that as the proposed implementation, then record confirmation. Outer discounts remain 33%; Plus remains 50%.

**D08 — S12B placement/graphics, pp28-29.** Confirm whether the new three-card section is inside Schools or standalone below it, and whether to include admin/teacher/leaderboard screenshots. Recommended order: Schools card → S12B dashboard cards → full-width practice/use banner → FAQ. This keeps the banner as the transition immediately before FAQ. Placement is a recommendation, not an explicit PDF decision.

**D09 — Banner wording and FAQ approval, p29.** The detailed banner row uses “استخدامها”; the earlier PDF used “ممارستها.” Use the new detailed wording for review, while retaining the final-checklist question as open. All nine FAQ answers are supplied, but the PDF calls them drafted and requests their approval. This is a content-review dependency, not missing answer copy.

**D10 — Official contacts, p29.** Need the approved email, phone/WhatsApp number and social URLs. Preserve footer layout, brand, quick links and copyright. Do not invent official addresses or accounts. Add only supplied social links, with meaningful accessible labels.

### Additional engineering dependencies discovered in this repository

**E01 — Scenario audio.** The PDF requests preview controls on all six cards but names only five scenario categories. Need approved audio files or a documented public-preview endpoint, plus text transcripts. Confirm the sixth “other situations” preview; do not ship a dead audio button or silently omit it.

**E02 — Live vs. sample demo feedback.** The widget is described as a real trial but also as an instant sample-feedback card with “e.g. 92%.” Use actual returned assessment for visitor recordings. If a static illustration is used before recording or offline, label it as a sample. Never present a fixed 92% as the visitor's measured score.

**E03 — Conversion destinations.** Agree where the pricing/final “try” buttons go while `/auth/register` is absent. Recommended immediate destination is the established `/login` flow or an expressly selected demo entry. Preserve labels/design; do not implement registration/payment backend scope by assumption.

**E04 — Screenshot quality/provenance.** No standalone PowerPoint file was supplied in this request. The PDF embeds four paired screenshot images on pp10-11, each 1834×522 pixels including framing. Individual crops are usable for review but may be too small for a large crisp device frame. Prefer original approved exports for production; use the exact embedded references rather than unrelated existing guide images. Sanitize student identity and other private data before using real captures.

P0 completion gate: every required decision has a named owner and status, every asset has an identified source, source-to-component mapping is recorded, and baseline differences are acknowledged. Actual unresolved business choices remain open; unrelated phases can proceed.

## P1 — Shared content, hero and key metrics

Dependencies: P0 structure; D01 affects the final topic value. Other hero copy can proceed independently.

Files: `hero-section.tsx`, `hero-section.css`, proposed `landing-content.ts`; minimal shared layout adjustments only when required by wrapping/bidi.

- [x] **S2-PRESERVE** — Preserve character/preview composition, “جاهز نبدأ” tag, grade badge and two-line H1. Badge: “للطلاب من الأول المتوسط إلى الثالث الثانوي”. H1: “من دراسة الإنجليزية إلى / استخدامها بثقة”, keeping established emphasis treatment. Source: pp3-4, callouts 1-3. Implementation: `hero-section.tsx/.css`; the tag absent in P0 was restored as native text. Existing images, H1, badge and play behavior retained. Evidence: `planning/landing-p1/browser-evidence.json` and five-width screenshots.
- [x] **S2-BODY** — Replace hero paragraph with: “زيد معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه في المدرسة.” Source: p4, callout 4. Implementation: `landing-content.ts`, `hero-section.tsx`; exact rendered body verified at all five widths.
- [x] **S2-PRIMARY** — Primary CTA becomes “جرب زيد Zayd الآن”; retain solid blue pill and meaningful destination. Isolate Zayd as LTR within Arabic. Source: p4, callout 5. Implementation: shared copy plus `<bdi dir="ltr" lang="en">`; existing `/login` destination verified in browser.
- [x] **S2-SECONDARY** — Secondary CTA becomes “زيد Zayd للمدارس”; retain outlined styling and Schools navigation. Source: p4, callout 6. Implementation: shared copy plus isolated English brand; existing Schools scroll and keyboard focus verified.
- [x] **S3-CLOCK** — Keep ساعة and clock; subtitle becomes “أسبوعيًا لممارسة الإنجليزية”. Source: p5, callout 1. Implementation: `landingHeroMetrics` in `landing-content.ts`; icon and value unchanged, rendered copy verified.
- [x] **S3-TOPICS** — Center metric uses +250 and subtitle “موضوعًا وموقفًا من الحياة”. Document/check icon preserved. Source: p5, callout 2. User explicitly confirmed 250 after the initial deferral. Rendered value/subtitle verified at 1440px and 320px with no horizontal overflow; targeted ESLint passed. Evidence: `planning/landing-p1/topic-count-confirmation.json`.
- [x] **S3-MULTIPLIER** — Keep ×10 and chart icon; subtitle becomes “لممارسة الإنجليزية”. Preserve Clock → Topics → ×10 right-to-left card order. Source: p5, callout 3. Implementation: shared metrics; values/icons/order verified at desktop and stacked mobile widths.
- [x] **S1-PRESERVE** — Preserve right-side logo, RTL navigation order, Pricing and Try Zayd buttons, sticky/mobile behavior and anchors. Source: pp2-3, callouts 1-4. `navbar.tsx` is byte-for-byte unchanged from P0; five-link mobile menu opens/closes with Escape; initial-view screenshots at 320-1440px confirm preservation.

P1 evidence: [implementation and verification report](planning/landing-p1/README.md). TypeScript, production build and targeted ESLint passed. Five viewport widths (320/390/768/1024/1440) have no horizontal overflow; existing login, Schools, video and menu behavior verified. P1 is **complete** following the later user-confirmed +250 correction. At P1 closure P2 was not started; its subsequent completion is recorded in the P2 section.

P1 completion gate: exact approved hero/metric strings render without bidi reversals or clipping at 320px and desktop; header behavior still works; all dependent topic copy uses the same chosen content value after D01 closes.

## P2 — Classroom comparison: exact copy, visual distinction and RTL order

Dependencies: P0 baseline; D02 has a concrete proposed style in the PDF.

Files: `comparison-section.tsx`; optional dedicated `comparison-section.css` to keep responsive/RTL rules localized.

- [x] **S5-INTRO** — Preserve the reference intro: “يدرس الإنجليزية لسنوات / لكن كم يتحدث فعليًا؟” and “المشكلة ليست دائمًا في شرح اللغة، بل في أن كل طالب لا يحصل على الوقت الكافي لممارستها بصورة فردية.” Reference intro restored in this phase under the user’s exact-PDF-copy instruction; original question heading/eyebrow retained. Source: p6, callout 1.
- [x] **S5-CONTAINER** — Soft slate/blue container: #F1F5F9 or #EFF6FF, 24px radius, 48px 32px desktop padding; adapt padding on narrow screens. Source: p7, callout 2.
- [x] **S5-CLASSROOM-STYLE** — Classroom card on the RIGHT: warm rose border #FECDD3; badge background #FFE4E6 and text #BE123C; warning icons retained. Source: p7, callout 2.
- [x] **S5-ZAYD-STYLE** — Zayd card on the LEFT: white surface, 2px #0EA5E9 border, soft glow shadow; subtle VS badge between cards. On mobile, stack Classroom then Zayd and position/remove decorative overlap safely. Source: p7, callout 2.
- [x] **S5-CLASSROOM-BODY** — Keep badge “داخل الفصل” and title “معلم واحد ... وعشرات الطلاب”. Body: “مهما بلغت كفاءة المعلم، يظل وقت الحصة محدودًا، مما يقلل فرص ممارسة الإنجليزية بصورة فردية منتظمة لكل طالب.” Source: p7, callout 3.
- [x] **S5-WARNING-1** — “وقت محدود للتحدث والقراءة والاستماع”. Source: p7, callout 4.
- [x] **S5-WARNING-2** — “فرص أقل للتكرار والمحاولة وتحسين الأداء”. Source: p7, callout 4.
- [x] **S5-WARNING-3** — “صعوبة تقديم تغذية راجعة لكل طالب”. Source: p7, callout 4.
- [x] **S5-ZAYD-TITLE** — Badge “مع زيد”; title “لكل طالب مساحة لممارسة الإنجليزية”. Source: p7, callout 5.
- [x] **S5-ZAYD-BODY** — “زيد يعزز دور المعلم، ويمنح لكل طالب فرصًا لممارسة الإنجليزية وفق مستواه وسرعته.” Use زيد, not زايد. Source: p8, callout 6.
- [x] **S5-BENEFIT-1** — “يمارس مهارات اللغة الإنجليزية بتفاعل”. Source: p8, callout 7.
- [x] **S5-BENEFIT-2** — “يتلقى تغذية راجعة فورية لتحسين أدائه”. Source: p8, callout 7.
- [x] **S5-BENEFIT-3** — “يتقدم وفق مستواه مع فرص متكررة للمحاولة”. Source: p8, callout 7.

P2 completion gate: all nine changed copy units are present; classroom/Zayd placement matches RTL reference; contrast is evident without relying only on color; VS does not obscure content, focus or mobile layout.

P2 closure: all 13 items verified in comparison-section.tsx and comparison-section.css; see [P2 implementation report](planning/landing-p2/README.md) and planning/landing-p2/verification.json for requirement-level evidence. TypeScript, targeted lint, production build and five-width browser checks pass. No P2 blockers remain. P3 design/content-only preparation can begin when authorized; screenshot asset/mapping quality decisions remain open. The P1 hero count was subsequently confirmed as +250 and implemented.

## P3 — Curriculum screenshot showcase and all eight skill tabs

Dependencies: screenshot assets/E04; D03 mapping decision. Does not require live authenticated APIs.

Files: `curriculum-section.tsx`, `curriculum-section.css`; proposed `CurriculumScreenshotShowcase.tsx`; approved screenshots under `src/assets/landing-page/curriculum/`; typed mapping in `landing-content.ts`.

- [ ] **S6-COPY** — Preserve badge, grade headline, body and blue tagline. Exact existing intent: “متوافق بالكامل مع المنهج”; “من الأول المتوسط إلى الثالث الثانوي”; “لا يحتاج الطالب إلى منهج جديد. زيد يحوّل ما يدرسه بالفعل إلى تجربة ممارسة شخصية وتفاعلية تساعده على استخدام اللغة، لا مجرد معرفتها.”; “يتعلمها في المنهج... ويمارسها مع زيد.” Source: p9, callouts 2-5.
- [ ] **S6-SHOWCASE** — Replace/augment the static pill panel with a tablet/laptop frame showing real approved Zayd screens. Use screenshot images, not a live authenticated dashboard or a decorative imitation of app data. Source: pp8-9, callout 1.
- [ ] **S6-TABS** — All eight skill labels remain unchanged and become real accessible tabs: الاستماع والمناقشة، القواعد، الاستماع، المحادثة، القراءة، الكتابة، الصيغة والمعنى والاستخدام، التحدث عن الذات. Preserve RTL reading sequence and responsive wrapping. Source: p9, callout 6.
- [ ] **S6B-SLIDE5** — Include practice-reading-aloud screenshot reference: 31% progress; Reading Passage / Practice Reading / Knowledge Quiz; mic sentence and View Assessment. Suitable for Reading secondary panel and S7 illustration. Source: p10, slide 5.
- [ ] **S6B-SLIDE6** — Map Grammar tab to flashcards: Unit 1 Big Changes, 14% complete, first of eight flip cards. Source: p10, slide 6.
- [ ] **S6B-SLIDE7** — Map Listening tab to audio narration: three steps, waveform, first listen 1 of 2, displayed 00:11/02:14. Source: p10, slide 7.
- [ ] **S6B-SLIDE8** — Map Conversation tab to Roleplay: 3/7 meaningful turns, four remaining, feedback/hint/coaching and mic. Source: p10, slide 8.
- [ ] **S6B-SLIDE9** — Include full reading-passage screenshot with Saudi Vision text, Listen button and Listen to continue CTA. Recommended primary Reading image; expose slide 5 through a secondary Reading view so both supplied reading assets are accounted for. Source: p10, slide 9.
- [ ] **S6B-SLIDE10** — Map Writing tab to guided paragraph builder: five questions, hints and student response textareas, 67% complete. Source: p11, slide 10.
- [ ] **S6B-SLIDE11** — Map Form/Meaning/Function tab to grammar reference table for simple past/past progressive with When: Tense, Structure, Example. Source: p11, slide 11.
- [ ] **S6B-SLIDE12** — Include Debate topic-card screenshot for Listening & Discussion. Self-expression mapping remains D03: approved reuse or a supplied dedicated image. All eight tabs must have intentional mappings; do not invent a ninth screenshot from the PDF. Source: p11, slide 12; p28 item 3.
- [ ] **S6-INTERACTION** — Selected tab changes image/caption; implement tablist/tab/tabpanel semantics, visible focus, selected state, RTL-aware arrow keys and Home/End. Reserve image aspect ratio to avoid jumps; offer zoom/lightbox if screenshot text is otherwise unreadable. This accessibility behavior is the implementation method for the required tabs. Source: pp8-11.

P3 completion gate: all eight tabs work with pointer and keyboard; all eight screenshot references have a documented role; labels/body remain intact; English screenshot UI remains LTR; assets are crisp, sanitized and not stretched/cropped through meaningful UI.

## P4 — Personalized learning: six benefits plus four new feature boxes

Dependencies: D05 for proposed Arabic copy/layout. The existing six-card corrections can proceed independently.

Files: `personalized-learning-section.tsx`, `personalized-learning-section.css`; proposed `LandingFeatureGrid.tsx` or an equivalent small local component; content data and new icons.

**Latest D05 user direction:** “Keep unresolved; implement the six confirmed benefits only.” The four additions below remain unchecked and unimplemented; neither their factual claims nor their proposed layout is approved. P0 decisions remain a historical snapshot; the current decision is recorded in `planning/landing-p4/decisions.json`. P2 prerequisites are satisfied by its completed verification record. P3 remains undone and is not required for these independent P4 changes.

- [x] **S7-HEADER** — Preserve “كل طالب يتعلم / ويتحدث بطريقته” and character with tablet. Source: p12, callout 1. Implementation: unchanged header/avatar markup and asset in `personalized-learning-section.tsx`; exact heading and asset checked at all five widths.
- [x] **S7-SUBTITLE** — “يمنح زيد كل طالب تجربة تفاعلية تتكيف مع مستواه، وتساعده على ممارسة الإنجليزية والتحسن باستمرار.” Source: p12, callout 3. Implementation: section description; exact rendered string verified at all five widths.
- [x] **S7-RENDERING** — Render benefit content from the feature model. Stop replacing every feature title/body with demo-mode title/body. Place demo entry separately or inside the dedicated widget; preserve access to the existing six demos without letting them erase the specified benefits. Source: pp12-14; observed current renderer. Implementation: `pillars.map` renders static benefits; separate demo list uses existing handlers/modals. Evidence: all benefits remain visible and all six demos keyboard-open/render/Escape-close at both 320 and 1440px, `planning/landing-p4/browser-evidence.json`.
- [x] **S7-BENEFIT1** — Pink brain, top-right: “تعلم مخصص” / “يتكيف مع مستوى الطالب واحتياجه.” Source: p12, callout 4. Implementation: `pillars[0]`, original sprite at `100% 0%`; exact copy, sprite and RTL position verified.
- [x] **S7-BENEFIT2** — Purple chat, top-center: “تغذية راجعة فورية” / “ملاحظات ذكية لتحسين الأداء.” Source: p13, callout 5. Implementation: `pillars[1]`, original sprite at `50% 0%`; exact copy, sprite and RTL position verified.
- [x] **S7-BENEFIT3** — Speaking head, top-left: “ممارسة التحدث” / “تطور مهارات النطق والتحدث.” Source: p13, callout 6. Implementation: `pillars[2]`, original sprite at `0% 0%`; exact copy, sprite and RTL position verified.
- [x] **S7-BENEFIT4** — Headphones, bottom-right: “تحسين النطق” / “تدريبات لتطوير النطق والطلاقة.” Source: p13, callout 7. Implementation: `pillars[3]`, original sprite at `100% 100%`; exact copy, sprite and RTL position verified.
- [x] **S7-BENEFIT5** — Repeat arrows, bottom-center: “تكرار دون حدود” / “محاولات متكررة حتى الإتقان.” Source: p13, callout 8. Implementation: `pillars[4]`, original sprite at `50% 100%`; exact copy, sprite and RTL position verified.
- [x] **S7-BENEFIT6** — Sprout, bottom-left: “بيئة آمنة للتعلم” / “ممارسة الإنجليزية بثقة دون خوف من الخطأ.” Source: p13, callout 9. Implementation: `pillars[5]`, original sprite at `0% 100%`; exact copy, sprite and RTL position verified.
- [ ] **S7-CEFR** — Proposed new title: “تقييم وفق معيار CEFR العالمي”. Proposed body: “قياس دقيق لمستوى الطالب وفق الإطار الأوروبي المشترك للغات (A1–C2).” Confirm copy and accuracy of advertised assessment scope through D05. Source: pp13-14, callout 10.
- [ ] **S7-AVATAR** — Proposed new title: “شخصيات تفاعلية ثلاثية الأبعاد (3D Avatar)”. Body: “محادثة حية وتفاعلية مع شخصية زيد الذكية في أوضاع تعلم متنوعة.” Source: p14, callout 11.
- [ ] **S7-CERTIFICATES** — Proposed new title: “شهادات وشارات إنجاز”. Body: “شهادات إتمام وشارات تحفيزية توثّق تقدم الطالب وإنجازاته في كل مرحلة.” Source: p14, callout 12.
- [ ] **S7-REWARDS** — Proposed new title: “نقاط ومكافآت تحفيزية”. Body: “نظام نقاط تنافسي ولوحات شرف تكافئ الطالب على الاستمرارية والتفوق.” Source: p14, callout 13.

P4 completion gate: six original benefits and four additions are all visible with the intended icons/order; demo labels no longer replace them; mixed CEFR/A1-C2/3D text is readable; mobile layout retains every card. Supplied proposals remain marked for content review in the decision record, not with internal labels on the customer page.

P4 execution result: **9 of 9 currently authorized requirements verified; 4 of 13 original requirements remain deferred by user.** The current six-benefit scope is complete. The original ten-benefit completion gate remains unmet because S7-CEFR/S7-AVATAR/S7-CERTIFICATES/S7-REWARDS are explicitly unapproved. No proposed feature claims or internal approval labels appear on the customer page. All five viewport checks, TypeScript, targeted ESLint and Vite production build pass; existing pdfjs eval/large-bundle warnings remain. Screenshots and per-requirement evidence: [P4 report](planning/landing-p4/README.md), `planning/landing-p4/verification.json`, `planning/landing-p4/browser-evidence.json`. Only the personalized section TSX/CSS changed in existing application source. No new assets, dependencies or backend functionality were needed.

P5 readiness: its new live widget remains excluded by the earlier design/content-only steering. It cannot begin under current scope; it would require explicit scope authorization plus D04 prompt approval and E02 guest-assessment integration verification. Existing demo entry preservation in P4 does not implement P5 or prove live assessment completion. No other phase was implemented.

## P5 — Real reading/speaking mini-widget

Dependencies: D04 prompts; E02 measured-versus-sample feedback; functioning guest transport and response schema. This is the highest integration-risk phase.

Files: proposed `LandingPracticeDemo.tsx` and local CSS; `personalized-learning-section.tsx`; reuse `services/readingDemoService.ts`, `hooks/useAudioRecorder.ts`, `hooks/useAudioPlayback.ts`, `utils/readingAudioUpload.ts` and existing assessment/highlight components where their contracts fit. Avoid embedding the entire logged-in LMS shell.

- [ ] **S7-DEMO-HEADING** — “جرّب التحدث والقراءة مع زيد الآن” with “(تجربة تفاعلية مباشرة)”. Source: p12, callout 2.
- [ ] **S7-DEMO-TABS** — Inline/in-section widget with two tabs: “تجربة القراءة” and “تجربة التحدث”. Opening existing independent modals alone is insufficient. Source: p12, callout 2.
- [ ] **S7-DEMO-PROMPT** — Display the approved short grade-level English sentence/prompt in LTR; use the chosen one-to-two samples from D04. Keep Arabic instructions RTL. Source: p12; p28 item 4.
- [ ] **S7-DEMO-MIC** — Visible mic control labelled “اضغط للتحدث”; ask for microphone only after visitor action; show real recording/waveform state. Source: p12, callout 2.
- [ ] **S7-DEMO-FEEDBACK** — Show returned pronunciation score and word-by-word assessment highlighting. PDF 92% is an example, not a fixed result. Provide non-color feedback labels so word status remains understandable. Source: p12, callout 2.
- [ ] **S7-DEMO-STATES** — Implement idle → requesting mic → recording → processing → feedback → retry, plus denied permission, unsupported recorder, silence, network failure and cancellation. Stop playback/recording when switching tabs, closing or navigating away. These states make the requested real interaction usable. Source: p12; integration requirements.
- [ ] **S7-DEMO-ISOLATION** — Keep guest data isolated: no account tokens, no student progress writes, no logged-in redirect. Reuse the existing guest transport or add the smallest guest adapter if schema gaps exist. A typed response is not a substitute for the requested voice interaction. Source: pp12,28; existing public-demo service architecture.
- [ ] **S7-DEMO-MOTION** — Waveform/live animations reflect actual playback or recording and respect reduced motion. No autoplay voice, fake ongoing recording, permanently fixed score, or success feedback before assessment completes. Source: p12 and referenced slide 2 note on p28.

P5 completion gate: both tabs complete the intended voice round trip; actual results match the recorded attempt; switching/cancelling leaves no active microphone, stale response or guest session; permission-denial and retry work. If a required assessment endpoint is unavailable, frontend layout may be reviewable, but the live-demo requirement is not complete.

## P6 — Life scenarios with audio, future skills and impact

Dependencies: D01 count; D06 counters; E01 audio/transcripts. Static copy work can proceed while those inputs are resolved.

Files: `zayd-life-section.tsx/.css`, `future-skills-section.tsx/.css`, `impact-stats-section.tsx/.css`; proposed `ScenarioAudioPreview.tsx`; approved audio assets/content data.

**Current P6 boundary:** design/content changes only. Audio controls, playback and new interaction/motion remain deferred under the existing user steering. Questions about D01's P6 count and D06's verified totals/unit/reporting date were asked; no answer has been received at verification time. Preserve 40 in this paragraph and the existing counters pending an answer; this does not resolve their inconsistency or approve them. Updated PDF pages 15–18 and the full P0 record were reviewed. Prior P3/P4/P5 decisions do not block independent P6 copy changes.

- [x] **S8-FRAME** — Use a distinct container with `linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)`, 28px radius, 56px 40px desktop padding and 1px #BAE6FD border; adapt on mobile. Yellow highlighter is not the production border. Source: p15, callout 1. Implementation: `.zayd-life__container` in `zayd-life-section.css`; computed frame geometry/colors verified at five widths.
- [ ] **S8-PREVIEW** — Add subtle hover-lift plus focus-visible equivalent, audio-preview controls to six scenario cards, one-at-a-time playback, loading/error/replay states and text alternatives. Stop on section/page teardown. Resolve sixth clip via E01. Source: p15, callout 1.
- [x] **S8-PRESERVE** — Preserve badge “من المنهج إلى الحياة”, headline “الإنجليزية لا تنتهي عند حدود الكتاب”, scenario images and first four labels/order: في المطار / في المطعم / في السوق / أثناء السفر. Source: pp15-16, callouts 2 and 5. Evidence: badge/headline, all six original sprite positions and decoded image verified in `planning/landing-p6/browser-evidence.json`.
- [ ] **S8-BODY** — “في Zayd Life و Zayd Plus، تمتد ممارسة الإنجليزية إلى أكثر من 40 موضوعًا وموقفًا من الحياة اليومية، لتنمية القدرة على التواصل بثقة في مواقف حقيقية.” The literal final row says 40; substitute the approved global topic count only after D01 resolves. Source: p15, callout 3.
- [x] **S8-CALLOUT** — “لأن الهدف ليس فقط أن يتعلم الإنجليزية، بل القدرة على استخدامها في الحياة.” Preserve two-line emphasis. Source: p15, callout 4. Implementation: two block spans in `zayd-life-section.tsx`; exact text and responsive wrapping verified.
- [x] **S8-SOCIAL** — Fifth label: “في المواقف الاجتماعية”. Source: p16, callout 6. Implementation: fifth `scenarios` item; exact label and original sprite position verified.
- [x] **S8-OTHER** — Sixth label: “ومواقف أخرى كثيرة”. Use the detailed final row; the executive summary's word order differs. Source: p16, callout 7. Implementation: sixth `scenarios` item; exact label and original sprite position verified.
- [x] **S9-PRESERVE** — Preserve gradient banner, “مهارة للمستقبل”, “الإنجليزية ليست مادة دراسية فقط”, and first three white pills: الدراسة الجامعية / المعرفة العالمية / سوق العمل. Source: pp16-17, callouts 1 and 3. Implementation: original heading/badge/gradient/first three tags retained; exact existing heading Unicode, colors and tags verified.
- [x] **S9-BODY** — “إتقان الإنجليزية يفتح آفاقًا أوسع للتعليم الجامعي والمعرفة والاستعداد لسوق العمل.” Source: p16, callout 2. Implementation: description in `future-skills-section.tsx`; exact rendered string verified.
- [x] **S9-TAG4** — Bottom-right pill: “التطوير المهني”. Source: p17, callout 4. Implementation: fourth `futureTags` item; exact label and RTL bottom-row position verified at five widths.
- [x] **S9-TAG5** — Bottom-left pill: “التواصل الدولي”. Source: p17, callout 5. Implementation: fifth `futureTags` item; exact label and RTL bottom-row position verified at five widths.
- [x] **S10-PRESERVE** — Preserve “نتيجة فارقة”, 3D comparison graphic and the one-year/ten-year calendar badges. Do not reinterpret the claim as academic study equivalence. Source: pp17-18, callouts 1 and 6. Implementation: original eyebrow and `section7.png` illustration retained; decoded asset and original source hashes verified, graphic visually reviewed.
- [x] **S10-HEADLINE** — “عام واحد مع زيد يعادل نحو / 10 سنوات من ممارسة التحدث”. Replace تساوي with يعادل. Source: pp17-18, callout 2. Implementation: two heading spans in `impact-stats-section.tsx`; exact text verified.
- [x] **S10-BODY** — “يتيح زيد فرصًا مكثفة للتحدث بالإنجليزية، تعادل تقريبًا ما قد يحصل عليه خلال 10 سنوات في الفصل التقليدي.” Source: p18, callout 3. Implementation: impact paragraph; exact text verified.
- [x] **S10-DISCLAIMER** — “المقارنة تتعلق بفرص ممارسة الإنجليزية، وليس بسنوات الدراسة.” Keep readable adjacent to the claim. Source: p18, callout 4. Implementation: footnote immediately after paragraph, with minimum 12px type; exact text, adjacency and size verified at five widths.
- [ ] **S10-STUDENTS** — Implement approved updated 2,500+ target, label طالب مسجل, using D06 data rather than the stale 1,000+ table. Record verification/source date. Source: p18 callout 5; p28 item 6.
- [ ] **S10-TIME** — Implement either 5,000+ ساعة ممارسة or 300,000+ دقيقة ممارسة according to D06. Ensure numeric formatting, icon and accessible text agree with the selected unit. Source: p28 item 6.
- [ ] **S10-LESSONS** — Resolve and use approved completed-lessons total with درس منجز. Do not declare old 8,600+ newly verified. Source: p18 callout 5; p28 item 6.

P6 completion gate: six working audio previews, no overlapping playback, reduced-motion behavior, consistent topic totals, approved impact data/units and exact future/impact copy. Missing clips or unverified totals keep only their corresponding items open.

P6 implementation evidence: [P6 report](planning/landing-p6/README.md), `planning/landing-p6/verification.json`, `planning/landing-p6/browser-evidence.json`. TypeScript, targeted ESLint, Vite production build and five-width browser checks passed. Source hashes confirm only the six P6 TSX/CSS files changed in existing application source; all artwork, earlier phases, custom comparison styling and existing demos remain unchanged. Future banner body/tag type has a readable minimum at intermediate widths; original gradient/shape is retained.

P6 status: **13 complete; 1 partial (S8-BODY); 3 blocked by D06; 1 deferred by scope (S8-PREVIEW).** S8-BODY's updated wording is implemented and verified with the literal PDF/current value 40; final topic-count consistency remains D01. The hero remains +250. Counters remain +1,000 students / +2,200 hours / +8,600 lessons as pre-existing values, not newly approved data. No reporting date or completed-lessons replacement was invented. Audio/hover-motion controls were not added. These open items keep full P6 incomplete. P7's independent pricing/copy work may begin when requested; its own D01/D07/E03 dependencies remain. No P7 work was performed.

## P7 — Pricing and package consistency

Dependencies: D01 global topic count, D07 subtitle record, E03 CTA destination. Depends on P1 shared content; coordinate with P9 FAQ package answer.

Files: `pricing-section.tsx`, `pricing-section.css`, `landing-content.ts`; shared pricing formatter if useful.

**P7 execution decisions:** P1 shared content is available; updated PDF pp19–20/25 and P0 D01/D07/E03 were reviewed. D01 remains unresolved for Life/Plus, so preserve 40 in both package benefits. User explicitly answered the P7 routing question: “Keep the destination decision unresolved.” Preserve the existing hrefs; do not treat `/login` as approved. D07's detailed “up to 50%” row is implemented for review, with its source review request still open. See `planning/landing-p7/decisions.json`.

- [x] **S11-HEADER** — Preserve “عرض لفترة محدودة” and “اختر التجربة المناسبة”. Subtitle becomes “خصم يصل إلى 50% حاليًا على الباقات الثلاث للأفراد.” Source: p19, callout 1. Implementation: `pricing-section.tsx`; exact rendered heading/badge/subtitle verified at five widths. D07 release review is not marked approved.
- [x] **S11-CURRICULUM-COPY** — Keep باقة المنهج. Description: “إذا كان هدفك تحسين أدائك في مناهج المدرسة”. Source: p19, callout 2. Implementation: `landingPricingPlans[0]` in `landing-content.ts`; exact title/description verified in browser.
- [x] **S11-CURRICULUM-PRICE** — Original 299 SAR, active 199 SAR/year, 33% badge. Preserve annual billing and riyal icon. Source: p19, callout 3. Implementation: numeric shared model and dynamic badge in renderer; amounts, annual SAR text, original-price accessible label, two icons and LTR numbers verified.
- [x] **S11-CURRICULUM-KEEP** — Preserve its four benefits: curriculum-aligned content; speaking/listening/reading/writing practice; personalized learning; AI feedback. CTA remains “ابدأ باقة المنهج”. Source: p19, callout 3. Implementation: existing four strings/action moved unchanged into shared model; exact rendered features/action verified.
- [x] **S11-PLUS-PRICE** — Original 599 SAR, active 299 SAR/year, 50% badge. Preserve center placement, Zayd Plus title, best-value marker/mascot, description and “اختر Zayd Plus” action. Source: p20, callout 4. Implementation: `landingPricingPlans[1]` and preserved featured markup/styles; all amounts/content, center RTL placement, mascot and marker verified.
- [ ] **S11-PLUS-KEEP** — Preserve all Curriculum benefits, all Zayd Life benefits, topic-count benefit and confidence benefit. Make the count follow D01. Source: p20, callout 4.
- [x] **S11-LIFE-COPY** — Keep Zayd Life. Description: “إذا كان هدفك استخدام الإنجليزية في الحياة اليومية”. Source: p20, callout 5. Implementation: `landingPricingPlans[2]`; exact rendered name/description verified.
- [x] **S11-LIFE-PRICE** — Original 299 SAR, active 199 SAR/year, 33% badge. Source: p20, callout 6. Implementation: numeric shared model and dynamic badge; annual SAR amounts, icon/accessible text and LTR numbers verified.
- [ ] **S11-LIFE-KEEP** — Preserve four benefits and “ابدأ Zayd Life” CTA; first bullet includes the correct أ in أكثر. Literal count remains subject to D01. Other benefits: restaurant/market/airport conversations; speaking/daily-life situations; feedback/retrying. Source: p20, callout 6.
- [x] **S11-MODEL** — Replace hardcoded shared 50% badge with explicit per-plan data. Keep outer/center card order Curriculum → Plus → Life in RTL. Use the same active prices in FAQ #7. Discounts are whole-percent display labels from the PDF; do not change the specified prices to force exact percentage arithmetic. Source: pp19-20, p25. Shared model/badges implemented in P7; P9 now consumes that model for FAQ #7 and verifies FAQ/card price equality at five widths. Integration dependency closed by P9; no pricing source changed during P9.
- [ ] **S11-ROUTING** — Wire all three actions to the agreed valid destination with plan intent retained if the target supports it. Preserve labels/style; verify no action falls through `/auth/register` to Home. Source: pricing CTAs pp19-20; existing router gap E03.

P7 completion gate: cards show 299→199 / 599→299 / 299→199, badges show 33/50/33, billing says annual SAR, old 99.5/199.5 amounts and “50% on every plan” claims disappear from this landing flow, and all actions have valid destinations.

P7 original execution status: 7 complete, 3 partial, 1 blocked. **After P9's shared-price integration: 8 complete, 2 partial, 1 blocked.** P7 evidence snapshots retain their original execution status.

- S11-PLUS-KEEP/S11-LIFE-KEEP: all four existing benefits/actions preserved and verified, including correct “أكثر”; count 40 is retained pending D01. Full count consistency is not complete.
- S11-MODEL: typed shared `landingPricingPlans` contains numeric original/active amounts and explicit 33/50/33 discounts in RTL order. Renderer consumes it; no hardcoded shared 50% badge remains. At original P7 closure the FAQ had no prices. P9 has now implemented the package answer using this model and verified matching amounts; this dependency is closed. Topic-count and release-copy decisions remain separate.
- S11-ROUTING: blocked by E03, explicitly deferred by user. All three `/auth/register` destinations remain unchanged and are still known to fall through to Home. Keyboard focus/preservation tests do not certify valid routing. No package-selection query parameter was invented.
- D07: exact detailed subtitle implemented and verified for review, but release-copy confirmation remains open. This is not business approval of promotion terms.
- TypeScript, targeted ESLint, production build and browser checks at 320/390/768/1024/1440 pass. Annual SAR, exact copy, original/active amounts, per-plan badges, preserved features/mascot, RTL/stacked layout, focus and no page/text overflow verified. Only `pricing-section.tsx` and `landing-content.ts` changed in existing app source; CSS, previous sections, FAQ and final CTA remain untouched. See [P7 report](planning/landing-p7/README.md), `planning/landing-p7/browser-evidence.json` and `planning/landing-p7/verification.json`.
- Full P7 remains incomplete due to the above dependencies. Independent P8 school copy/design work can begin when requested, subject to its own D08/D09 decisions. P8 has not started. No commit, push or deployment was performed.

## P8 — Schools, Smart Dashboards section and new banner

Dependencies: D08 layout/assets; D09 final banner word; verify feature claims against product. Static landing content is the scope, not implementation of new dashboard backends.

Files: `schools-section.tsx/.css`; proposed `SmartDashboardsSection.tsx/.css` and `PracticeCallout.tsx/.css`; `Main.tsx` for final ordering; shared content data.

**P8 execution boundary:** updated PDF pp21–23 and P0 D08/D09 reviewed. Scope is static marketing UI only. Placement/imagery and banner wording questions were presented; no reply was received at verification time. The reversible review implementation uses the P0 proposal: Schools → standalone Smart Dashboards cards with icons/no screenshots → banner ending “استخدامها” → FAQ. This is not an approved final composition or wording decision. Supplied dashboard bullet copy is present for review; source inspection does not establish every advertised capability as live. No new admin, nudge or redemption system was implemented.

- [x] **S12-PRESERVE** — Preserve school badge, teacher/dashboard graphic, “حساب خاص للمعلم مجانًا”, teacher account explanation and “زيد لا يستبدل المعلم... بل يوسّع أثره.” Source: p21, callouts 1-2. Implementation: original markup/asset/captions retained in `schools-section.tsx`; exact existing text, loaded original asset and unchanged asset hash verified. The free-account caption remains inside the unchanged artwork.
- [x] **S12-HEADLINE** — Keep “مدرستك تدرّس الإنجليزية”; second line becomes “وزيد يمنح كل طالب فرصة لممارستها.” Source: p21, callout 2. Implementation: second heading span; original first line retained; exact text verified at five widths.
- [x] **S12-BODY** — “يعزز زيد دور المعلم، ويمنح الطلاب فرصًا إضافية لممارسة الإنجليزية، مع تغذية راجعة تدعم تقدمهم.” Source: p21, callout 3. Implementation: school paragraph; exact rendered text verified.
- [x] **S12-PILL1** — “أسعار خاصة للمدارس”. Source: p21, callout 4. Implementation: first school feature; exact label and preserved layout verified.
- [x] **S12-PILL2** — “اشتراكات للمجموعات الطلابية”. Source: p22, callout 5. Implementation: second school feature; exact label and responsive wrapping verified.
- [x] **S12-PILL3** — Preserve “دعم للتطبيق داخل المدرسة”. Source: p22, callout 6. Implementation: unchanged third feature; exact text verified.
- [x] **S12-CTA** — “اطلب عرضًا لمدرستك”, keeping the quote/contact flow and left arrow. Source: p22, callout 7. Implementation: updated label with unchanged `/contact-us` href, arrow and styles; keyboard focus/activation opened the existing visible form. Nothing submitted.
- [ ] **S12-BANNER** — Add a prominent full-width centered strip between Schools-related content and FAQ: “الطالب لا يحتاج إلى مزيد من شرح الإنجليزية بقدر ما يحتاج إلى المزيد من استخدامها.” Detailed new wording uses استخدامها; close D09 before final release. Source: p22, callout 8.
- [x] **S12B-HEADING** — Add “لوحات تحكم ذكية.. قياس دقيق، تدخل أسرع، وتحفيز مستمر”. Source: p22, S12B. Implementation: `SmartDashboardsSection.tsx` H2; exact rendered text verified.
- [x] **S12B-ADMIN-TITLE** — Right card: “للإدارة المدرسية: رؤية شاملة”. Source: p23, card 1. Implementation: first `dashboardCards` item; exact title and rightmost desktop/first mobile position verified.
- [ ] **S12B-ADMIN-1** — “لوحة تحكم إدارية: تتيح لك متابعة أداء جميع الفصول والمعلمين في مكان واحد.” Source: p23, card 1.
- [ ] **S12B-ADMIN-2** — “تقارير فورية: قياس دقيق لمستوى تطور الطلاب ومدى تفاعل المعلمين مع النظام.” Source: p23, card 1.
- [ ] **S12B-ADMIN-3** — “قرارات مبنية على البيانات: اكتشف نقاط الضعف في المنهج وعالجها قبل الاختبارات.” Source: p23, card 1.
- [x] **S12B-TEACHER-TITLE** — Center card: “للمعلم: متابعة أسهل بجهد أقل”. Source: p23, card 2. Implementation: second `dashboardCards` item; exact title and center/second position verified.
- [ ] **S12B-TEACHER-1** — “مؤشرات الألوان: تصنيف ذكي للطلاب (أخضر، أصفر، أحمر) لمعرفة من يحتاج للمساعدة فوراً.” Source: p23, card 2.
- [ ] **S12B-TEACHER-2** — “تنبيهات سريعة: إرسال توجيهات (Nudges) للطلاب المتعثرين بضغطة زر.” Source: p23, card 2.
- [ ] **S12B-TEACHER-3** — “الذكاء الاصطناعي كمساعد: زيد يتولى التصحيح والتقييم، لتتفرغ أنت للتوجيه والدعم.” Source: p23, card 2.
- [x] **S12B-STUDENT-TITLE** — Left card: “للطلاب: متعة الممارسة والتحدي”. Source: p23, card 3. Implementation: third `dashboardCards` item; exact title and leftmost/third position verified.
- [ ] **S12B-STUDENT-1** — “نظام نقاط تنافسي: تحويل الممارسة اليومية إلى تحدٍ ممتع يكافئ الطالب على استمراريته.” Source: p23, card 3.
- [ ] **S12B-STUDENT-2** — “لوحات شرف أسبوعية: إبراز أفضل 20 طالباً لتحفيز التنافس الإيجابي.” Source: p23, card 3.
- [ ] **S12B-STUDENT-3** — “مكافآت قابلة للاستبدال: يمكن للطلاب استبدال نقاطهم بمكافآت أو امتيازات داخل الفصل، مما يحفز المعلمين والطلاب معاً.” Source: p23, card 3.
- [ ] **S12B-LAYOUT** — Render three clearly differentiated informational cards in Admin → Teacher → Student RTL order; stack in the same reading order on mobile. Add approved imagery only if selected under D08. Do not add fake working Nudge/Redeem buttons to a marketing card. Source: pp22-23; pp28-29 item 8.

P8 completion gate: all three titles and all nine bullet points exist, school changes are complete, the new banner appears once in the approved position, and teacher illustration/caption remains intact. Marketing copy about nudges/redemption does not silently expand this phase into backend development.

P8 evidence/status: [P8 report](planning/landing-p8/README.md), `planning/landing-p8/verification.json`, `planning/landing-p8/browser-evidence.json`, `planning/landing-p8/decisions.json` and `planning/landing-p8/capability-review.json`.

- **11 complete, 11 partial:** all P8 UI and supplied copy is implemented and browser-verified. Seven school requirements plus dashboard heading/three titles are complete. Nine dashboard bullets remain unchecked for full closure because advertised capabilities require product review; their exact wording/rendering is verified, not their live availability. Supplied content is not invented, but it is not called approved functionality.
- S12B-ADMIN-1/2/3, S12B-TEACHER-1/2/3 and S12B-STUDENT-1/2/3 map to the three `dashboardCards` arrays in `SmartDashboardsSection.tsx`. All nine full strings, including isolated LTR Nudges and the number 20, are verified at all five widths. Teacher-reporting fields and weekly top-20 leaderboard code provide partial source support; no authenticated/live admin, nudge, classroom-redemption or reporting-accuracy verification was performed.
- S12B-LAYOUT: three differentiated informational cards, icons, Admin → Teacher → Student RTL order and identical mobile reading order are verified. No screenshots, fake Nudge/Redeem buttons or new motion. Proposed standalone placement is implemented for review; D08 remains unresolved, so final layout approval is not complete.
- S12-BANNER: exact updated sentence ending “استخدامها” appears once, centered after the cards and immediately before FAQ. Wording/position are implemented for review; D09 final wording and D08 composition remain unresolved. No FAQ answers or accordion changes were made.
- TypeScript, targeted ESLint, production build and five viewport checks (320/390/768/1024/1440) pass; contact route smoke check passes without submission. Desktop/mobile/forced-colors visual review passes. Only `schools-section.tsx`/`Main.tsx` changed among existing source; four new local component/CSS files added. All prior sections, riyal symbols, original artwork and school CSS preserved by source hashes.
- Full P8 remains open for D08/D09 and dashboard capability review. Independent P9 work may begin when requested, subject to its own draft-review/count/contact/routing dependencies. P9 has not started; no commit, push or deployment performed.

## P9 — All nine FAQs and footer data

Dependencies: D09 copy review; D01 count; P7 shared prices; D10 official contacts; E03 final CTA destination.

Files: `faq-section.tsx/.css`, `footer.tsx/.css`, `final-cta-section.tsx`; shared content. Keep the existing accordion's semantics and improve stable IDs as needed.

**P9 decisions/scope:** all nine supplied drafts are implemented for review per D09; no final business approval is inferred. User explicitly kept D10 official contacts unresolved in this turn, so footer placeholders remain. E03 remains deferred from the earlier explicit user reply; final CTA's missing `/auth/register` destination is preserved and remains unfinished. D01 broader topic count remains unresolved; FAQ #7 retains 40 consistently with current Life/Plus copy, while hero +250 is unchanged. Default expansion is the existing topic “What is Zayd” (now #2), using stable IDs rather than array indices. Prior P8 visual refinements remain intact.

- [x] **S13-HEADER** — Preserve FAQ badge and “كل ما تحتاج معرفته قبل البدء”. Source: p24, callout 1. Implementation: existing header unchanged; exact original Unicode heading/badge verified at five widths.
- [x] **S13-FAQ1** — Add name-origin question/answer as first item. Use Appendix A #1. Source: p24, callout 2. Implementation: `name-origin` item in `faq-section.tsx`; exact supplied question/answer and isolated English brand verified against Appendix A.
- [x] **S13-FAQ2** — Keep “ما هو زيد؟” as second item and replace answer with the four-skill, instant-feedback and school-alignment paragraph. Use Appendix A #2. Source: p24, callout 3. Implementation: `what-is-zayd`; exact supplied copy and default-expanded state verified.
- [x] **S13-FAQ3** — Teacher-replacement question and supplied answer. Use Appendix A #3. Source: p24, callout 4a. Implementation: `teacher-role`; exact supplied copy verified.
- [x] **S13-FAQ4** — Supported-grades question and complete answer spanning pp24-25. Use Appendix A #4. Source: pp24-25, callout 4b. Implementation: `supported-grades`; complete school-and-daily-life paragraph verified.
- [x] **S13-FAQ5** — Weekly usage question and new one-hour-per-week answer, replacing current 15-20 minutes/day and one-to-two hours/week. Use Appendix A #5. Source: p25, callout 5. Implementation: `weekly-usage`; exact one-hour answer verified, old daily-use wording removed from FAQ.
- [x] **S13-FAQ6** — New AI assessment question/answer immediately AFTER usage, as final item #6. Do not follow the stale figure caption's “after FAQ #4” literally. Use Appendix A #6. Source: p25, callout 6. Implementation: `ai-assessment`; full supplied text and sixth position verified. D09 review of supplied claims remains open.
- [ ] **S13-FAQ7** — Package comparison uses 199 / 199 / 299 SAR/year and agreed topic count, matching pricing cards. Use Appendix A #7. Source: p25, callout 7a.
- [x] **S13-FAQ8** — School/group pricing answer refers to the updated “اطلب عرضًا لمدرستك” CTA. Use Appendix A #8. Source: p25, callout 7b. Implementation: `schools-groups`; exact supplied copy matches the school CTA label.
- [x] **S13-FAQ9** — Free teacher account answer for participating schools. Use Appendix A #9. Source: p26, callout 7c. Implementation: `teacher-account`; exact supplied question/answer verified.
- [x] **S13-ACCORDION** — Exactly nine items, stable IDs, keyboard activation, aria-expanded/controls and readable long answers. The updated table calls FAQ #2 “Expanded Card”; proposed default is What is Zayd (#2), preserving the original expanded topic rather than opening #1 merely because its index is zero. Record the chosen behavior. Source: pp24-26. Implementation: `openId` default `what-is-zayd`, stable button/panel IDs and existing native button behavior. All nine Enter-open/Space-close/Tab-order/focus checks passed at all five widths (45 cases). Full answers remain visible without overflow; existing visual/chevron behavior retained.
- [ ] **S14-CTA-PRESERVE** — Preserve final banner copy, gradient layout, both labels and school-trial action. Correct the existing invalid primary destination according to E03 without rewriting its visual/copy treatment. Source: p26, callouts 1-3.
- [x] **S14-FOOTER-PRESERVE** — Preserve brand, “معلّم ذكي لممارسة اللغة الإنجليزية. تعلّم. مارس. أتقن.”, mascot, quick links/order and ©2026 line. Source: p27, callouts 4-6. Implementation: footer TSX/CSS/assets left byte-for-byte unchanged; source hashes, rendered content/links and desktop/mobile screenshots verify preservation of existing spelling/design/copyright.
- [ ] **S14-CONTACTS** — Replace placeholder email/phone only with official D10 values; add supplied WhatsApp/social links if required. Verify mailto/tel/HTTPS destinations and bidi display. This is a data substitution requested by S15, not a footer redesign. Source: p27 callout 6; p29 item 10.

P9 completion gate: nine correct question/answer pairs in the stated order, appropriate default expansion, agreed drafts incorporated, package/count/usage statements consistent, and no invented official contact details. Pending business review is explicitly recorded rather than called complete.

P9 evidence: [P9 report](planning/landing-p9/README.md), `planning/landing-p9/verification.json`, `planning/landing-p9/browser-evidence.json`, `planning/landing-p9/decisions.json` and 15 screenshots.

- **11 implementation requirements complete; 2 partial; 1 blocked.** Completed FAQ checkboxes verify supplied copy/behavior, not approval of D09 drafts. D09 release review remains an overall closure dependency.
- S13-FAQ7: all three supplied package bullets render from P7's numeric prices in Curriculum → Life → Plus order (199/199/299 SAR/year). Exact copy, numbers, annual units, LTR English/numbers and equality with current pricing cards verified. Current count 40 remains subject to D01, so full requirement remains partial. P7 S11-MODEL's FAQ consumer dependency is now satisfied.
- S14-CTA-PRESERVE: final CTA source/assets/styles, copy, labels, gradient and school-trial href remain unchanged. The primary `/auth/register` destination is still absent/unresolved under E03; preservation is verified, routing completion is not.
- S14-CONTACTS: blocked/deferred by user. Current placeholder mailto/tel remain unchanged; no official email, number, social URL or WhatsApp account was invented. D10 needs approved values before substitution.
- TypeScript, targeted ESLint, final production build and five-width browser checks passed. Only FAQ TSX/CSS changed in existing application source; no earlier phase, pricing model, banner/card styling, final CTA, footer, dependency or asset changed. FAQ answer contrast improved and semantic package-list spacing added for readable long answers.
- Full P9 remains incomplete pending D01/D09/D10/E03. P10's independent audit may begin when requested, but full integrated closure requires resolving or explicitly accepting the remaining dependencies/deferred scope. P10 has not started. No commit, push or deployment performed.

## P10 — Integrated verification and requirement closure

Dependencies: P1-P9 outputs and all release-affecting decisions/assets. Local review builds may be produced earlier.

- [ ] **QA-COPY** — Check every changed Arabic string against detailed final rows and Appendix A, including all four proposed feature boxes after approval. Compare normalized content, not PDF's presentation-form encoding. Verify Zayd/Zayd Life/Zayd Plus, CEFR and numbers in mixed RTL/LTR text.
- [ ] **QA-CONSISTENCY** — Search rendered content and source data for old topic counts, prices, discount claims, impact figures, تساوي, old scenario labels and old FAQ usage claims. Review hits contextually; unrelated student-app content is not automatically part of this landing update.
- [ ] **QA-PRESERVATION** — Compare S1 navigation, S4 video, unchanged hero/curriculum/scenario/future/impact elements, teacher artwork and S14 CTA/footer against the captured baseline and accepted variances. Check anchors and sticky offsets after new sections change heights.
- [ ] **QA-INTERACTIVE** — Exercise every screenshot tab, Reading secondary screenshot, demo tab, record/stop/retry/cancel, scenario preview, FAQ and conversion CTA. Verify no dead buttons, overlapping audio or lingering mic streams.
- [ ] **QA-RESPONSIVE** — Inspect 320, 375/390, 768, 1024 and 1440px widths, landscape and 200% zoom. Check long card copy, screenshot device frames, decimal-free new prices, widget controls, banner wrapping and no horizontal overflow.
- [ ] **QA-ACCESSIBILITY** — Verify document/section Arabic language, English prompt/screenshot direction, heading hierarchy, accessible tabs, focus order, dialog focus where existing demos remain, icons/control names, feedback text beyond color, reduced motion and adequate contrast.
- [ ] **QA-PERFORMANCE** — Lazy-load offscreen screenshots/audio and heavy demo code; reserve image dimensions; only request microphone after action; avoid downloading every audio clip on initial load. Compare initial assets/bundle with P0 baseline; do not trade the new showcases for a slower unusable mobile page.
- [ ] **QA-CHECKS** — Run TypeScript, production build, ESLint and relevant existing demo/audio regressions. Add focused interaction checks for eight tabs, all ten benefits, two demo tabs, six previews, nine FAQ items and per-plan pricing; avoid tests that simply duplicate markup strings without testing behavior/data consistency.
- [ ] **QA-TRACEABILITY** — For every requirement ID, attach implementation file(s), verification evidence and final status. A missing asset, unresolved approval or unavailable voice endpoint is still open; “layout implemented” does not equal “requirement complete.”
- [ ] **QA-HANDOVER** — Produce before/after screenshots, a decision log, known limitations, local run instructions and a final coverage audit. No push/deployment is implied by the planning request.

P10 completion gate: every implementation/preservation requirement passes; all S15 decisions are resolved or explicitly accepted as a scoped deferral by the user; final business content is confirmed; no requirement is silently dropped. If anything is deferred, the entire PDF scope must not be reported as fully implemented.

## Phase sequencing and review boundaries

Recommended sequence: P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10. This is a readable delivery order, not a claim that every phase must block the next.

- P1/P2 and the fixed-copy portions of P4/P6/P8 can proceed while assets and decisions are being resolved.
- P3 depends primarily on screenshot quality/mapping; P5 on guest voice/assessment; P6 audio on approved clips. These are separate dependencies and should have separate completion evidence.
- P7 must establish final shared prices before P9 package answers are finalized.
- P8 must settle section placement before final screenshot/anchor QA.
- Review one phase as a coherent change: content foundation, comparison, screenshots, feature grid, voice widget, scenarios/impact, pricing, schools/dashboard, FAQs/footer, then integrated closure. Keep unrelated account-state refactors from the earlier repository audit outside these landing changes unless needed for a demonstrated integration defect.

No calendar promises are attached: asset delivery, backend demo support and pending business decisions materially affect duration. The highest uncertainty is P5 live voice feedback, followed by P3 screenshot mapping and P6 preview audio. Copy/price edits are comparatively straightforward.

## Appendix A — Complete supplied FAQ copy, in final order

The following is transcribed into ordinary Arabic Unicode from the updated PDF. These are supplied draft answers under D09, not new answers invented for this plan. Spaces around Arabic question marks may follow the product's typography convention. D01 may alter the topic count in #7; prices are the updated values.

### 1. لماذا اخترنا اسم "زيد Zayd"؟

يرتبط اسم "زيد" في اللغة العربية بمعنى الزيادة والنماء والتقدّم المستمر؛ وهو ما يمثّله زيد تمامًا، إذ يزيد من فرص الطالب في ممارسة اللغة الإنجليزية، وينمّي مهاراته في التحدث والقراءة والاستماع والكتابة، ويزيد من ثقته في استخدام اللغة في المدرسة والحياة اليومية.

### 2. ما هو زيد؟

زيد معلّم ذكي لممارسة اللغة الإنجليزية يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه طلاب المرحلتين المتوسطة والثانوية في المدرسة.

### 3. هل زيد بديل عن معلم اللغة الإنجليزية؟

لا، زيد لا يستبدل المعلم بل يعزز دوره ويوسّع أثره؛ فهو يمنح كل طالب فرصًا إضافية لممارسة اللغة الإنجليزية بشكل فردي ووفق مستواه وسرعته حول ما يتعلمه بالفعل في المدرسة، مع تغذية راجعة فورية تدعم تقدمه.

### 4. ما الصفوف التي يخدمها زيد حاليًا؟

يخدم زيد حاليًا طلاب المرحلتين المتوسطة والثانوية (من الصف الأول المتوسط إلى الصف الثالث الثانوي)، بمحتوى متناغم مع منهج اللغة الإنجليزية المعتمد في المدرسة، بالإضافة إلى مواضيع ومواقف الحياة اليومية.

### 5. كم يحتاج الطالب إلى استخدام زيد؟

يحتاج الطالب إلى نحو ساعة واحدة أسبوعيًا من الممارسة المنتظمة مع زيد؛ ومع الاستمرار خلال عام دراسي واحد، يحصل الطالب على فرص مكثفة لممارسة التحدث بالإنجليزية تعادل تقريبًا ما قد يحصل عليه خلال 10 سنوات في الفصل التقليدي.

### 6. كيف يستخدم الذكاء الاصطناعي في تقييم الطالب؟

يستخدم زيد الذكاء الاصطناعي للتفاعل مع الطالب في مهارات التحدث والقراءة والاستماع والكتابة، وتقديم ملاحظات ذكية وتغذية راجعة فورية لتحسين النطق والطلاقة والأداء، مع تكييف التمارين تلقائيًا وفق مستوى الطالب واحتياجه ومنحه محاولات متكررة حتى الإتقان.

### 7. ما الفرق بين الباقات الثلاث؟

- باقة المنهج (199 ﷼/سنة): إذا كان هدفك تحسين أدائك في مناهج المدرسة وممارسة مهارات اللغة الأربع.
- باقة Zayd Life (199 ﷼/سنة): إذا كان هدفك استخدام الإنجليزية في الحياة اليومية عبر أكثر من 40 موضوعًا وموقفًا حياتيًا.
- باقة Zayd Plus (299 ﷼/سنة - الأفضل قيمة): التجربة الكاملة التي تجمع مزايا باقة المنهج وجميع مزايا Zayd Life.

### 8. هل توجد أسعار خاصة للمدارس والمجموعات؟

نعم، يوفّر زيد أسعارًا خاصة للمدارس واشتراكات للمجموعات الطلابية، مع دعم متكامل للتطبيق داخل المدرسة. يمكنك طلب عرض خاص عبر زر "اطلب عرضًا لمدرستك".

### 9. هل يدفع المعلم مقابل حسابه؟

لا، لأن المعلم جزء أساسي من تجربة زيد، يحصل معلمو المدارس المشاركة على حساب خاص مجانًا دون أي تكلفة إضافية لمتابعة تقدم طلابهم وتقارير أدائهم.

## Appendix B — Coverage by PDF page range

- pp1-2: opening executive summary; treated as overview, not an exhaustive list of updated additions.
- pp2-3: S1 navigation → P1 preservation + P10.
- pp3-4: S2 hero → P1.
- p5: S3 metrics → P1, D01.
- pp5-6: S4 video → P0 baseline + P10 preservation.
- pp6-8: S5 comparison → P2.
- pp8-9: S6 curriculum copy/pills and showcase → P3.
- pp9-11: S6B eight screenshot references/mappings → P3, D03/E04.
- pp12-14: S7 six benefits, four new boxes and live demo → P4/P5, D04/D05/E02.
- pp14-16: S8 real-life copy, frame and audio previews → P6, D01/E01.
- pp16-17: S9 future skills → P6.
- pp17-18: S10 impact wording/graphics/old data table → P6; p28 updated targets → D06.
- pp18-20: S11 pricing → P7, D01/D07/E03.
- pp20-22: S12 school pitch and new banner → P8, D09.
- pp22-23: S12B dashboard/gamification cards → P8, D08.
- pp23-26: S13 nine complete FAQ items → P9 and Appendix A.
- pp26-27: S14 final CTA/footer → P9 preservation and data substitution.
- pp27-29: S15 ten missing/unclear items → P0 D01-D10, then the named dependent phases.

## Final implementation definition

The scope is complete only when the page contains every required copy change; the eight-tab screenshot experience; six corrected benefits plus four additions; the functioning two-tab voice demo; six working scenario previews; corrected impact copy and confirmed totals; consistent new pricing; school updates; all S12B cards; the new banner; all nine FAQ answers; and official supplied footer contacts, while preserving the stated unchanged elements. Planning these items is complete; implementing and verifying them is subsequent work.
