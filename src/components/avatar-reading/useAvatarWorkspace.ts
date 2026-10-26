import { useLayoutEffect, useRef } from 'react';

/** Keep the avatar above a scrolling workspace, including with the mobile keyboard open. */
export function useAvatarWorkspace(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const element = ref.current;
    const viewport = window.visualViewport;
    const resize = () => {
      const bottom = (viewport?.height ?? window.innerHeight) + (viewport?.offsetTop ?? 0);
      const height = Math.max(160, bottom - element.getBoundingClientRect().top - 8);
      element.style.setProperty('--avatar-workspace-height', `${height}px`);
    };
    resize();
    window.addEventListener('resize', resize);
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    return () => {
      window.removeEventListener('resize', resize);
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', resize);
      element.style.removeProperty('--avatar-workspace-height');
    };
  }, [enabled]);
  return ref;
}
