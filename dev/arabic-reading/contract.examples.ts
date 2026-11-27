import type { ArabicQuestion, ArabicSessionView, ArabicAssessment, ArabicAudioRequest } from '../../src/types/arabic-reading.contract';

const question: ArabicQuestion = {
  id: 'synthetic-q', number: 1, prompt: 'سؤال تجريبي',
  options: [{id: 'synthetic-option', label: 'أ', text: 'خيار تجريبي'}],
};
const questionWithKey: ArabicQuestion = {
  ...question,
  // @ts-expect-error Learner questions never expose the correct option.
  correctOptionId: 'private-key',
};
const unavailable: ArabicAssessment = {
  available: false, accuracy: null, fluency: null, completeness: null, pronunciation: null,
};
// @ts-expect-error Unavailable assessment must not masquerade as a score of zero.
const fabricatedZero: ArabicAssessment = {
  available: false,
  accuracy: 0, fluency: null, completeness: null, pronunciation: null,
};
const audio: ArabicAudioRequest = {requestId: 'request-uuid', expectedRevision: 0, chunkId: 'chunk', format: 'webm'};
function narrowSession(session: ArabicSessionView) {
  if (session.phase === 'listen') {
    // @ts-expect-error No quiz is disclosed before the quiz phase.
    void session.questions;
  }
  if (session.phase === 'quiz') {
    void session.checkedAnswers;
    // @ts-expect-error Private frozen source is server-owned.
    void session.privateSnapshotJson;
  }
  if (session.phase === 'completed') void session.result.correctCount;
}
void [questionWithKey, unavailable, fabricatedZero, audio, narrowSession];
