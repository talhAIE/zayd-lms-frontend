import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Fit the complete current demo step, including its footer, into the dialog. */
export default function LandingDemoViewport({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = viewport.current!;
    const surface = content.current!;
    const dialog = frame.closest<HTMLElement>('[role="dialog"]');
    const fit = () => {
      if (dialog && window.visualViewport) {
        dialog.style.setProperty("--demo-visible-height", `${window.visualViewport.height}px`);
        dialog.style.setProperty("--demo-visible-center", `${window.visualViewport.offsetTop + window.visualViewport.height / 2}px`);
      }
      const width = frame.clientWidth;
      const contentHeight = Math.max(1, surface.offsetHeight, surface.scrollHeight);
      // Let the dialog's CSS max-height cap the natural step before scaling.
      // Short steps shrink the window; tall feedback still fits the viewport.
      if (compact) frame.style.height = `${contentHeight}px`;
      const dialogStyle = dialog ? getComputedStyle(dialog) : null;
      const height = compact && dialog && dialogStyle
        ? dialog.clientHeight - parseFloat(dialogStyle.paddingTop) - parseFloat(dialogStyle.paddingBottom)
        : frame.clientHeight;
      if (!width || !height) return;
      const scale = Math.min(1, width / Math.max(width, surface.scrollWidth), height / contentHeight);
      surface.style.setProperty("--demo-fit-scale", String(scale));
      if (compact) frame.style.height = `${Math.min(height, Math.ceil(contentHeight * scale))}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    observer.observe(surface);
    // Text, feedback, and lazy players can change without resizing the frame.
    const mutations = new MutationObserver(fit);
    mutations.observe(surface, { childList: true, subtree: true, characterData: true });
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);
    fit();
    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
    };
  }, [compact]);

  return (
    <div ref={viewport} className={`landing-demo-viewport${compact ? " landing-demo-viewport--compact" : ""}`}>
      <div ref={content} className="landing-demo-viewport__content">{children}</div>
    </div>
  );
}
