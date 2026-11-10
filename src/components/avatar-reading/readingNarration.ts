import source from './readingNarrationCues.json';

export interface NarrationCue { start: number; end: number; from: number; to: number }
export interface PassageNarration { cues: NarrationCue[]; position: number }

/** A changed passage, recording or duration must never reuse obsolete timings. */
export function readingNarration(topicId: string, audioUrl: string | undefined, text: string, duration: number, position: number): PassageNarration | undefined {
  const entry = (source as Record<string, { audioUrl: string; text: string; duration: number; cues: NarrationCue[] }>)[topicId];
  if (!entry || entry.audioUrl !== audioUrl || !Number.isFinite(duration) || Math.abs(entry.duration - duration) > 0.35) return undefined;
  if (entry.text === text) return { cues: entry.cues, position };
  // Presentation may collapse spaces or introduce paragraph breaks. Preserve
  // verified audio timing only when every displayed token is still identical.
  const expected = [...entry.text.matchAll(/\S+/g)], displayed = [...text.matchAll(/\S+/g)];
  if (expected.length !== displayed.length || expected.some((word, i) => word[0] !== displayed[i][0])) return undefined;
  const cues = entry.cues.map(cue => {
    const first = expected.findIndex(word => word.index! >= cue.from);
    let last = first;
    while (last + 1 < expected.length && expected[last + 1].index! < cue.to) last++;
    return { ...cue, from: displayed[first].index!, to: displayed[last].index! + displayed[last][0].length };
  });
  return { cues, position };
}

export function activeNarrationCue(cues: NarrationCue[], position: number) {
  return cues.findIndex(cue => position >= cue.start && position < cue.end);
}
