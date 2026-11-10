# Landing animation follow-up — 11 November 2026

This is the user's new animation request on `feat/step`, using the red section numbers in the supplied screenshots rather than PDF section numbers. It authorizes these visual effects despite the earlier design/content-only phase scope. The user's subsequent request for slightly slower animation is included.

- 1 Hero: gentle 900ms image entrance, 1500ms counters from zero to existing +250 and ×10. The nonnumeric hour label stays unchanged.
- 2 Comparison: 500ms blur-to-clear entrance with short stagger.
- 3 Curriculum: 500ms load/blur-to-clear reveal of the whole screenshot/tab card on viewport entry (including repeat entry from either direction), plus the existing 400ms moving screenshot transition and 240ms selected-pill lift. Keyboard tab semantics and full-size images remain unchanged.
- 4 Personalized demos/features: 650ms entrances, staggered by 90ms in existing DOM/RTL order.
- 5 Life scenarios: the same light card reveal on entry.
- 6 Future banner: no animation added.
- 7 Impact: hero-style image entrance and count-ups to the existing displayed totals; metric card reveals. No business figure was changed or approved by this work.
- 8 Pricing: staggered 650ms card entrances.
- 9 Schools: no animation added.
- 10 Dashboard cards: staggered 650ms entrances.
- 11 FAQ: smooth 360ms opening/closing, preserving state, IDs, copy and native keyboard activation. Closed regions are immediately aria-hidden; visual visibility is removed when the close finishes.
- 12 Final CTA and 13 Footer: no animation added. The unnumbered promotional video is unchanged.

Reveals replay only after leaving and re-entering the viewport, from either scroll direction. There are no continuous loops. Existing transforms are preserved using individual translate. Finished/cancelled animations and counter frames are cleaned up; offscreen counters restart when revisited. Reduced-motion mode immediately exposes final numbers/content and disables new movement, blur and dropdown transitions, including when that preference changes at runtime. Counter width is reserved with hidden final-value measurement; assistive technology receives the final value rather than every frame.

Implementation: `useLandingMotion.ts`, `landing-motion.tsx/.css`, integration in `Main.tsx`, hero/impact counters, keyed curriculum previews and the FAQ's CSS grid collapse wrapper. Content, prices, destinations, imagery, demo services and business decisions are unchanged.

Verification: targeted ESLint, TypeScript project build and production build pass; existing pdfjs eval/large-bundle warnings remain. Browser checks at 1440 and 390 verify real intermediate/final counter frames, all nine reveal target groups replaying, stagger timings, quick blur, tab image movement and keyboard selection, measured intermediate opening/closing FAQ heights, static sections remaining unanimated, runtime reduced-motion switching, and reduced-motion on fresh load. No page errors. See `verification.json` and `verify-browser.cjs` (uses the local Codex Playwright runtime, with Vite at port 5174).

No commit, push, deployment or unrelated phase work was performed.

## Image-hover follow-up

The user subsequently requested small hover movement across all landing imagery, including the previously static Schools/footer artwork. This adds hover-only treatment rather than new scroll reveals to those sections. Marketing images, scenario background artwork, mascots, screenshots and logos receive a 2.5% scale and 3px lift over 350ms; the hero teacher lifts 4px while its background scales 1.5%. Paired hero layers and non-interactive pricing artwork are covered. Existing layout transforms and scroll entrances are retained. Keyboard focus on image links/demo buttons has an equivalent effect. Authenticated demo content and videos are not restyled.

Fine-pointer/hover and no-reduced-motion media conditions gate the effect; it returns smoothly on pointer exit and does not activate for touch-only or reduced-motion users. Browser checks passed for 12 representative image targets, including hero, curriculum, demo icons, scenario artwork, impact, pricing, Schools, footer and navigation; entry and reset were checked. Reduced-motion and touch checks pass, with no page errors. Production build passes. See `image-hover-verification.json` and `verify-image-hover.cjs`.
