import type { ReactNode } from 'react';

/** Inline paint follows the text's line boxes, never the card or its controls. */
export function AvatarSpeechHighlight({ active, children }: { active: boolean; children: ReactNode }) {
  return active ? <mark data-avatar-speaking-text="" className="rounded bg-amber-100 text-inherit [box-decoration-break:clone]">{children}</mark> : <>{children}</>;
}
