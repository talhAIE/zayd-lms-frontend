import { useEffect, useRef, useState } from "react";
import "./landing-motion.css";

/** Animate only the numeric portion; preserve approved prefixes, commas and units. */
export function LandingCounter({ value }: { value: string }) {
  const match = value.match(/^([^\d]*)([\d,]+)([^\d]*)$/);
  const target = match ? Number(match[2].replace(/,/g, "")) : 0;
  const [current, setCurrent] = useState(0);
  const element = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!target || !element.current) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    const stop = () => cancelAnimationFrame(frame);
    const settle = () => { if (media.matches) { stop(); setCurrent(target); } };
    if (!window.IntersectionObserver) { setCurrent(target); return; }
    const observer = new IntersectionObserver(changes => {
      const entry = changes[0];
      if (!entry.isIntersecting) { visible = false; stop(); if (!media.matches) setCurrent(0); return; }
      if (visible) return;
      visible = true;
      stop();
      if (media.matches) { setCurrent(target); return; }
      setCurrent(0);
      const started = performance.now();
      function tick(now: number) {
        const progress = Math.min(1, (now - started) / 1500);
        setCurrent(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.1 });
    settle();
    observer.observe(element.current);
    media.addEventListener("change", settle);
    return () => { stop(); observer.disconnect(); media.removeEventListener("change", settle); };
  }, [target]);

  if (!match) return <>{value}</>;
  const number = current === target ? match[2] : match[2].includes(",") ? current.toLocaleString("en-US") : String(current);
  return (
    <span ref={element} className="landing-counter">
      <span className="sr-only">{value}</span>
      <span className="landing-counter__measure" aria-hidden="true">{value}</span>
      <span className="landing-counter__value" aria-hidden="true">{match[1]}{number}{match[3]}</span>
    </span>
  );
}
