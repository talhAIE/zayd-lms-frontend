// Compile-only contract checks. Contains no private source content or keys.
import type { StepAttemptView, StepAudioAccess, StepEnvelope, StepError, StepInProgressAttempt, StepOption, StepQuestion, StepResult, StepSaveAnswerRequest, StepSubmitRequest } from '../../src/types/step.contract';

export const save: StepSaveAnswerRequest = {
  optionId: '11111111-1111-4111-8111-111111111111', expectedRevision: 0,
  requestId: '22222222-2222-4222-8222-222222222222',
};
export const submit: StepSubmitRequest = { expectedRevision: 1, requestId: save.requestId, answers: [{ questionId: '33333333-3333-4333-8333-333333333333', optionId: save.optionId }] };
export const final: StepEnvelope<StepResult> = { status: true, data: {
  attemptId: '44444444-4444-4444-8444-444444444444', topicId: '55555555-5555-4555-8555-555555555555',
  state: 'submitted', earnedMarks: 3, totalMarks: 4, completedAt: '2026-11-10T00:00:00.000Z',
} };
export const incomplete: StepError = { statusCode: 409, code: 'STEP_INCOMPLETE', message: 'Answer every question.', missingQuestionIds: ['33333333-3333-4333-8333-333333333333'] };
export const audioAccess: StepAudioAccess = { url: 'https://example.invalid/short-lived-audio', expiresAt: '2026-11-10T00:05:00.000Z' };

type Assert<T extends true> = T;
type Forbidden = 'correctOptionId' | 'isCorrect' | 'answerKey' | 'hint' | 'explanation' | 'source' | 'sha256';
export type QuestionHasNoPrivateFields = Assert<Extract<keyof StepQuestion, Forbidden> extends never ? true : false>;
export type OptionsHaveNoPrivateFields = Assert<Extract<keyof StepOption, Forbidden> extends never ? true : false>;
export type UnsubmittedHasNoScore = Assert<Extract<keyof StepInProgressAttempt, 'earnedMarks' | 'result'> extends never ? true : false>;
export type SubmittedHasNoAnswerReview = Assert<Extract<keyof StepResult, 'questions' | 'selections' | 'correctAnswers'> extends never ? true : false>;

export function completedScore(attempt: StepAttemptView): number | null {
  if (attempt.state === 'submitted') return attempt.earnedMarks;
  // @ts-expect-error Scores are unavailable before final submission.
  const prematureScore: number = attempt.earnedMarks;
  void prematureScore;
  return null;
}
// @ts-expect-error Immediate correctness is forbidden by the assessment contract.
export const invalidOption: StepOption = { id: 'example', label: 'A', text: 'Example', isCorrect: true };
