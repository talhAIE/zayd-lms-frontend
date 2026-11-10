export interface ReadingVocabularyFeedback {
  words: string[];
  attemptCount: number;
  action: 'glow' | 'open';
}

export function readingFeedbackAction(feedback: ReadingVocabularyFeedback | undefined, viewed: boolean) {
  if (viewed || !feedback?.words.length || !Number.isSafeInteger(feedback.attemptCount) || feedback.attemptCount < 1) return undefined;
  return feedback.action === 'glow' || feedback.action === 'open' ? feedback.action : undefined;
}

export function readingFeedbackNeedsAttention(
  feedback: ReadingVocabularyFeedback | undefined,
  target: { status: 'correct' | 'retry' | 'incorrect' } | undefined,
  viewed: boolean,
) {
  if (viewed) return false;
  return readingFeedbackAction(feedback, false) === 'glow'
    || target?.status === 'retry'
    || target?.status === 'incorrect';
}

export function loadViewedReadingFeedback(lessonModeId: string): Set<string> {
  try {
    const ids = JSON.parse(sessionStorage.getItem(`reading-feedback-viewed:${lessonModeId}`) || '[]');
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  } catch { return new Set(); }
}

export function saveViewedReadingFeedback(lessonModeId: string, ids: Set<string>) {
  try { sessionStorage.setItem(`reading-feedback-viewed:${lessonModeId}`, JSON.stringify([...ids])); }
  catch { /* Feedback remains usable when browser storage is unavailable. */ }
}
