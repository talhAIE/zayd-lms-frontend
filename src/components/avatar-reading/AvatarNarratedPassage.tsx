import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { activeNarrationCue, type PassageNarration } from './readingNarration';

export function AvatarNarratedPassage({ text, narration, scrollRef, renderText, following, onManualScroll }: {
  text: string;
  narration: PassageNarration;
  scrollRef: RefObject<HTMLDivElement>;
  renderText: (text: string) => ReactNode;
  following: boolean;
  onManualScroll: () => void;
}) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const active = activeNarrationCue(narration.cues, narration.position);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const manual = onManualScroll;
    const key = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) manual();
    };
    const pointer = (event: PointerEvent) => { if (event.target === container) manual(); };
    container.addEventListener('wheel', manual, { passive: true });
    container.addEventListener('touchmove', manual, { passive: true });
    container.addEventListener('keydown', key);
    container.addEventListener('pointerdown', pointer);
    return () => {
      container.removeEventListener('wheel', manual);
      container.removeEventListener('touchmove', manual);
      container.removeEventListener('keydown', key);
      container.removeEventListener('pointerdown', pointer);
    };
  }, [scrollRef, onManualScroll]);
  useEffect(() => {
    const container = scrollRef.current, sentence = activeRef.current;
    if (!following || !container || !sentence) return;
    const parent = container.getBoundingClientRect(), child = sentence.getBoundingClientRect();
    if (child.top < parent.top + 16 || child.bottom > parent.bottom - 16) {
      // Scroll this panel only; scrollIntoView would also move the avatar/page.
      container.scrollTo({ top: container.scrollTop + child.top - parent.top - 24,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }, [active, following, scrollRef]);
  let previous = 0;
  return <>
    <p className="whitespace-pre-wrap">
      {narration.cues.map((cue, index) => {
        const gap = text.slice(previous, cue.from); previous = cue.to;
        return <span key={cue.from}>{gap}<span ref={index === active ? activeRef : undefined}
          aria-current={index === active ? 'true' : undefined} data-narration-sentence={index}
          className={index === active ? 'rounded bg-amber-100 text-slate-950 ring-2 ring-amber-200' : undefined}>
          {renderText(text.slice(cue.from, cue.to))}
        </span></span>;
      })}
      {text.slice(previous)}
    </p>
  </>;
}
