import { useLayoutEffect, useRef } from 'react';

/** Keep the avatar above a scrolling workspace, including with the mobile keyboard open. */
export function useAvatarWorkspace(enabled: boolean, keyboardAware = false) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const element = ref.current;
    const viewport = window.visualViewport;
    let fullHeight = Math.max(viewport?.height ?? 0, window.innerHeight);
    let layoutWidth = window.innerWidth;
    let keyboardOpen = false;
    let frame = 0;
    const resize = () => {
      const visibleHeight = viewport?.height ?? window.innerHeight;
      if (layoutWidth !== window.innerWidth) {
        fullHeight = Math.max(window.innerHeight, visibleHeight + (keyboardOpen ? 150 : 0));
        layoutWidth = window.innerWidth;
      }
      fullHeight = Math.max(fullHeight, visibleHeight);
      const focused = element.contains(document.activeElement) &&
        document.activeElement?.matches('input, textarea, [contenteditable="true"]');
      const compact = keyboardAware && Boolean(focused || keyboardOpen) &&
        fullHeight - visibleHeight > 120;
      if (compact) {
        const parent = element.parentElement!;
        const rect = parent.getBoundingClientRect();
        const padding = getComputedStyle(parent);
        const left = parseFloat(padding.paddingLeft) || 0;
        const right = parseFloat(padding.paddingRight) || 0;
        element.style.setProperty('--avatar-keyboard-left', `${Math.max(8, rect.left + left)}px`);
        element.style.setProperty('--avatar-keyboard-width', `${Math.min(rect.width - left - right, window.innerWidth - 16)}px`);
      }
      keyboardOpen = compact;
      element.toggleAttribute('data-keyboard-open', compact);
      element.style.setProperty('--avatar-keyboard-top', `${(viewport?.offsetTop ?? 0) + 8}px`);
      const bottom = visibleHeight + (viewport?.offsetTop ?? 0);
      const height = compact ? visibleHeight - 16 : Math.max(160, bottom - element.getBoundingClientRect().top - 8);
      element.style.setProperty('--avatar-workspace-height', `${height}px`);
    };
    const scheduleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(resize);
    };
    resize();
    window.addEventListener('resize', scheduleResize);
    viewport?.addEventListener('resize', scheduleResize);
    viewport?.addEventListener('scroll', scheduleResize);
    element.addEventListener('focusin', scheduleResize);
    element.addEventListener('focusout', scheduleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleResize);
      viewport?.removeEventListener('resize', scheduleResize);
      viewport?.removeEventListener('scroll', scheduleResize);
      element.removeEventListener('focusin', scheduleResize);
      element.removeEventListener('focusout', scheduleResize);
      element.removeAttribute('data-keyboard-open');
      element.style.removeProperty('--avatar-workspace-height');
      element.style.removeProperty('--avatar-keyboard-top');
      element.style.removeProperty('--avatar-keyboard-left');
      element.style.removeProperty('--avatar-keyboard-width');
    };
  }, [enabled, keyboardAware]);
  return ref;
}
