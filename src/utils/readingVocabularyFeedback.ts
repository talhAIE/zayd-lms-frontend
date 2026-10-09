export interface ReadingVocabularyFeedback {
  words: string[];
  attemptCount: number;
  action: 'glow' | 'open';
}

export function readingFeedbackAction(feedback: ReadingVocabularyFeedback | undefined, viewed: boolean) {
  if (viewed || !feedback?.words.length || !Number.isSafeInteger(feedback.attemptCount) || feedback.attemptCount < 1) return undefined;
  return feedback.action === 'glow' || feedback.action === 'open' ? feedback.action : undefined;
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
