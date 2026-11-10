import { useEffect, type RefObject } from "react";
import "./landing-motion.css";

/** Screenshot numbering: 1 hero, 2 comparison, 3 curriculum, 4 demos,
 * 5 life, 6 future (static), 7 impact, 8 pricing, 9 schools (static),
 * 10 dashboards, 11 FAQ, 12 final CTA (static), 13 footer (static). */
export function useLandingMotion(root: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;

    function reset() {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }

    function configure() {
      reset();
      if (media.matches || !window.IntersectionObserver || !Element.prototype.animate || !container) return;
      const entries = new Map<Element, { kind: string; delay: number }>();
      const groups = [
        { selector: ".landing-hero__visual, .impact-comparison__illustration", kind: "image", stagger: 0 },
        { selector: ".comparison-card", kind: "blur", stagger: 60 },
        { selector: ".curriculum-overview__panel", kind: "blur", stagger: 0 },
        { selector: ".personalized-learning__demo-list > li, .personalized-learning__features > li", kind: "rise", stagger: 90 },
        { selector: ".zayd-life__scenario", kind: "rise", stagger: 90 },
        { selector: ".impact-comparison__metric", kind: "rise", stagger: 90 },
        { selector: ".pricing-card", kind: "rise", stagger: 90 },
        { selector: ".dashboard-card", kind: "rise", stagger: 90 },
      ];
      groups.forEach(({ selector, kind, stagger }) => {
        container.querySelectorAll(selector).forEach(element => {
          const index = element.parentElement ? Array.from(element.parentElement.children).indexOf(element) : 0;
          entries.set(element, { kind, delay: Math.min(index, 5) * stagger });
        });
      });
      const visible = new Set<Element>();
      const active = new Map<Element, Animation>();
      observer = new IntersectionObserver(changes => {
        changes.forEach(change => {
          if (!change.isIntersecting) { visible.delete(change.target); active.get(change.target)?.cancel(); active.delete(change.target); return; }
          if (visible.has(change.target)) return;
          visible.add(change.target);
          const config = entries.get(change.target)!;
          const frames = config.kind === "blur"
            ? [{ opacity: 0.35, filter: "blur(5px)", translate: "0 8px" }, { opacity: 1, filter: "blur(0px)", translate: "0 0" }]
            : config.kind === "image"
              ? [{ opacity: 0, translate: "0 14px" }, { opacity: 1, translate: "0 -3px", offset: 0.75 }, { opacity: 1, translate: "0 0" }]
              : [{ opacity: 0, translate: "0 16px" }, { opacity: 1, translate: "0 0" }];
          // Individual translate preserves existing component transforms/layout.
          const animation = change.target.animate(frames, {
            duration: config.kind === "blur" ? 500 : config.kind === "image" ? 900 : 650,
            delay: config.delay, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards",
          });
          animations.add(animation);
          active.set(change.target, animation);
          const release = () => { animations.delete(animation); if (active.get(change.target) === animation) active.delete(change.target); };
          animation.onfinish = release;
          animation.oncancel = release;
        });
      }, { rootMargin: "0px 0px -4% 0px", threshold: 0 });
      entries.forEach((_, element) => observer!.observe(element));
    }

    configure();
    media.addEventListener("change", configure);
    return () => { reset(); media.removeEventListener("change", configure); };
  }, [root]);
}
