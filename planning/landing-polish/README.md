# Landing page follow-up — 2026-11-12

Implemented the five changes requested directly by the user:

- Navigation: 16px desktop/mobile menu text, larger action labels, entrance, gradient underline and subtle button lift/focus feedback. Mobile menu behavior preserved; reduced-motion preference disables movement.
- Hero: complete existing Arabic description uses weight 700, with the Zayd name at 800 and darker text.
- Comparison: reveal slowed from 500ms to 850ms, with 90ms stagger. Follow-up reference styling uses warm coral classroom and cool teal Zayd cards, colored edges, soft waves, larger badges and a connecting arrow. Classroom points include timer/group/chart illustrations; Zayd points include chat/target/growth illustrations and a subtle decorative progress path. Existing Arabic copy is retained without new claims; the earlier node diagrams were replaced.
- Certificate: responsive `ZAYD` name overlay occupies the blank recipient field; original artwork, sample label and dialog behavior retained.
- Footer: user-supplied `contact@waaha.ai` / `+966 58 278 8984` replace placeholders using mailto/tel links and LTR display. This supersedes D10's earlier email/phone deferral. No WhatsApp/social accounts were supplied or inferred; unrelated decisions remain open.

Verification: `verify-browser.cjs` and `verification.json` cover widths 320, 390, 768, 820, 1024 and 1440px. All checks passed: navigation fit/menu operation, exact bold hero copy, preserved comparison text, six distinct point illustrations, certificate placement, exact contact destinations, no browser errors, 850ms comparison reveal, navigation motion and reduced-motion handling. PNGs provide visual evidence. Contact links were inspected without invoking mail or calls.

Targeted ESLint, TypeScript, production build and `git diff --check` passed. Build retains existing pdfjs eval and large-chunk warnings. Earlier phase reports and motion screenshots remain historical evidence; the maintained motion regression now expects the requested 850ms comparison timing. No commit, push or deployment performed.


## Curriculum preview follow-up

The user's later request supersedes the initial always-visible preview and full-size-image link: no screenshot is mounted or shown until a skill is selected by pointer or keyboard. The preview expands below the buttons with a 650ms reveal, soft fade/blur and upward entrance. All eight skill previews and both reading views are retained. The first button remains keyboard reachable before selection; RTL arrows/Home/End select and reveal a preview. Full-size link/dialog and their unused styles/imports are removed only from this section. Laptop-image hover scale/translation is disabled; other landing images retain their hover behavior. Panel border/shadow is refined.

`verify-curriculum.cjs` records initial hidden state, eight unique previews, selection, keyboard navigation, removed full-size link, disabled hover zoom, responsive fit, entrance motion and reduced-motion handling in `curriculum-verification.json`, with mobile/desktop screenshots. Earlier phase evidence reflects its original execution state.


## Preview toggle and screenshot corners

Each selected skill button now closes its preview on a second click (including Enter/Space activation); a different button still switches previews. The self-expression screenshot alone uses its natural aspect ratio and a clipped 12px screen corner, preventing its baked-in rounded corners from showing dark/white edge slivers inside a mismatched frame. Other screenshots keep their existing sizing. The curriculum browser check now verifies repeated-click closing for every skill and the scoped corner treatment.


## Pricing card reference follow-up

Pricing CSS now follows the supplied reference: soft white/sky panels, a stronger blue Plus outline/shadow, blue/teal primary action and recommendation badge, bolder headings/prices and rounded mint discount strips. The Plus 50% discount is a shorter green gradient pill (maximum 180px desktop / 170px mobile), placed above the old/current price with decorative side accents. Existing data, content, card order, mascot and unresolved registration links are preserved. `verify-pricing.cjs` / `pricing-verification.json` cover five widths, unchanged prices and feature counts/link destinations, pill size/position and responsive text fit. Decorative pill accents intentionally extend beyond its box.


## Shared pricing format and discount accents

The latest request applies the Plus card format to all three plans: matching blue borders, light panels, gradient actions, blue prices, and compact green discount pills above the original/current price. Existing 33% / 50% / 33% values and all other copy/prices/routes are preserved; only Plus retains its existing recommendation badge and mascot. The inaccurate parallel CSS accent lines are replaced with decorative SVG rays: one horizontal and two diagonal strokes per side. The pricing check now verifies the shared format and both ray groups on every card.


## Restored pricing emphasis and sizing

The latest reference restores the original hierarchy: side cards use 43.8cqw minimum height, pale blue backgrounds, 1px light borders and outlined actions; Plus uses 46.8cqw minimum height, a white background, 2px blue outline/shadow and the original teal/blue action. Original top padding and mobile sizing are restored. Compact green discount pills, corrected rays, all content and prices are retained. The responsive pricing check verifies the taller center card on desktop and appropriate border weights.


## Compact pills, readable original prices and button edges

Discount pills are reduced to a maximum of 156px desktop / 150px mobile. Crossed-out prices now use 16–20px semibold text, including a matching currency size. The Plus action removes its transparent border and clips the gradient within the rounded shape to eliminate end slivers. Card height hierarchy, content, current prices and destinations are preserved. Five-width browser verification passes for compact sizing, original-price readability, clean gradient clipping and responsive text fit; refreshed screenshots are included.


## Slower comparison card reveal

The latest request slows only the two comparison cards from 850ms to 1400ms, using ease-in-out and an explicit midpoint for a visible fade, upward movement and blur-to-clear transition. Their stagger increases from 90ms to 140ms. Scroll re-entry replay and reduced-motion handling remain in place; all other sections retain their timing. Browser motion checks now expect 1400ms.


## Preview-close animation stability

Scroll reveals no longer cancel/reset on every entrance-boundary exit. A separate exit observer rearms a card only when it leaves the viewport plus a 96px buffer; active animations finish normally and cannot overlap. This prevents the reveal's own translation and curriculum-preview layout changes from creating a cancellation/restart loop. All existing reveal durations, reduced-motion cleanup and replay after a full scroll exit remain. `verify-preview-stability.cjs` checks repeated open/close cycles, stable positions after closing, boundary replay counts, replay after a full exit, and reduced motion at mobile/desktop widths.


## Rewards sample styling and celebration

Enhanced only the points/rewards preview: mint/sky reward summary, teal earned-points badge, animated progress based on the existing 200-to-250 sample counter, medal-style rank markers, gold/silver row tones and a teal/blue current-learner highlight. A short decorative confetti burst runs once when 250 is reached. Existing names, sample scores, +50 reward, rank transition, sample disclosure and live announcement are retained. All added decorative elements are hidden from assistive technology; extra motion is disabled for reduced-motion users. `verify-rewards.cjs` / `rewards-verification.json` verify final data/order, progress, modal closing, responsive layout and reduced motion. Screenshots cover 320/390/1440px.


## Latest comparison reference and faster reveal

The latest user reference supersedes the mountain illustration and thick side strips. Comparison cards now use thin tinted borders, pale white/teal and white/rose backgrounds, lower flowing waves with a white bottom rim, softly bordered icon tiles and inset icon columns. Mountain/progress SVG and unused styling are removed. All implemented Arabic headings, descriptions, bullets and badges remain unchanged. Card loading/re-entry uses the existing stable observer with a 700ms fade/rise/blur-to-clear animation (previously 1400ms), a 70ms stagger, and reduced-motion support. Other sections retain their animation timings. Browser checks now expect 700ms and verify preserved copy and responsive fit.


## Onboarding progress bar

Replaced the browser-default gray/green progress styling with a rounded pale-blue track and Zayd-blue gradient fill, a subtle inset highlight and a short width transition that respects reduced motion. Native progress value/max and its localized accessible label are retained. WebKit and Firefox progress pseudo-elements are explicitly styled. `verify-onboarding-progress.cjs` mounts the actual onboarding component as an isolated browser fixture, checks 320/390/1440px fit, rounded corners, blue accent/track and advancement from step 1 to step 2. Screenshots verify the gradient visually; no form is submitted.


## Onboarding control edges and success follow-up

Primary/secondary actions use a single rounded painted edge rather than overlapping borders. Text/email/phone inputs have explicit native appearance reset and a rounded blue border plus soft focus ring; keyboard focus remains visible, including forced-color fallback. On successful save, the exact requested English text `we will contact you soon` appears under the existing success heading with a brief fade/rise animation; reduced-motion users receive static text. No existing copy or submission behavior changed. `verify-onboarding-controls.cjs` tests the actual component in a Dialog provider at 320/390/1440px and reduced motion. The save endpoint is intercepted with `{saved:true}`; no contact data is sent. Focus/success screenshots and `onboarding-controls-verification.json` record the checks.


## Hero CTA opens onboarding page

The specific hero CTA `جرب زيد Zayd الآن` now links to public `/onboarding` instead of `/login`. A standalone branded page reuses the existing onboarding component and bilingual form; language controls update page direction. Its success close action returns home. Demo dialogs retain their existing DialogClose behavior and mode attribution. A direct landing-page entry does not fabricate a completed demo mode: `mode` is optional and its undefined sourceMode is omitted by JSON serialization. All other login/authentication links remain as implemented.

`verify-onboarding-route.cjs` / `onboarding-route-verification.json` exercise the actual hero click, route reload, English switching, complete form with intercepted save, success message and return-home action at 320/390/1440px plus reduced motion. No real contact data is sent. Server acceptance for a direct-entry payload without sourceMode is not verified against a live backend; tests mock the existing save endpoint. TypeScript, targeted ESLint and build checks cover the new public route and shared component.
