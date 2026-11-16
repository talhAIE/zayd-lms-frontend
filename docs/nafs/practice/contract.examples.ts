/** Compile-only boundary cases. No app startup, fixture accounts or authored keys. */
import type {
  PracticeCheckView, PracticeCompletedSession, PracticeQuestionView,
  PracticeSessionView, PracticeCheckRequest, PracticeCompleteRequest,
  PracticePolicy,
} from './api.contract';
import { NAFS_PRACTICE_LIMITS } from './api.contract';

export const confirmedPolicy: PracticePolicy = {
  checkAction: 'explicit', retries: 'unlimited', progression: 'manual',
  completion: 'all_current_selections_checked',
  repeat: 'explicit_new_run_after_completion', scoring: 'latest_checked_answer_one_mark',
  feedback: 'checked_option_correctness_only', timerSeconds: null,
};
export const enoughForMath9: boolean = NAFS_PRACTICE_LIMITS.maxQuestions >= 250;

export function privacyBoundary(question: PracticeQuestionView, checked: PracticeCheckView) {
  // @ts-expect-error The learner never receives the private scoring key.
  question.correctOptionId;
  // @ts-expect-error Classification stays private even though grading is visible.
  question.classification;
  // @ts-expect-error Source filenames/pages belong to backend provenance only.
  question.provenance;
  // @ts-expect-error No answer reveal is included in a graded response.
  checked.correctOptionId;
  return checked.isCorrect;
}
export function completedBoundary(session: PracticeSessionView) {
  if (session.state === 'completed') {
    // @ts-expect-error Completed results do not expose a question/answer review.
    session.questions;
    return session.earnedMarks;
  }
  // @ts-expect-error In-progress runs expose checks, not a running aggregate score.
  session.earnedMarks;
  return session.latestChecks.length;
}
export function mutationBoundary(check: PracticeCheckRequest, complete: PracticeCompleteRequest) {
  // @ts-expect-error Client cannot grade its own checked selection.
  check.isCorrect;
  // @ts-expect-error Completion never accepts client marks.
  complete.earnedMarks;
  // @ts-expect-error Completion derives all choices from persisted checked state.
  complete.answers;
  return [check.expectedRevision, complete.requestId];
}
export function resultBoundary(result: PracticeCompletedSession) {
  // @ts-expect-error Hidden indicator analysis is not part of this release.
  result.indicatorResults;
  return `${result.earnedMarks}/${result.totalMarks}`;
}
