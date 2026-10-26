import source from './readingNarrationCues.json';

export interface NarrationCue { start: number; end: number; from: number; to: number }
export interface PassageNarration { cues: NarrationCue[]; position: number }

/** A changed passage, recording or duration must never reuse obsolete timings. */
export function readingNarration(topicId: string, audioUrl: string | undefined, text: string, duration: number, position: number): PassageNarration | undefined {
  const entry = (source as Record<string, { audioUrl: string; text: string; duration: number; cues: NarrationCue[] }>)[topicId];
  if (!entry || entry.audioUrl !== audioUrl || entry.text !== text || !Number.isFinite(duration) || Math.abs(entry.duration - duration) > 0.35) return undefined;
  return { cues: entry.cues, position };
}

export function activeNarrationCue(cues: NarrationCue[], position: number) {
  return cues.findIndex(cue => position >= cue.start && position < cue.end);
}
