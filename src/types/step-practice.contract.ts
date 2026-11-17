/** STEP practice DTOs. Keys stay server-side; feedback is scoped to checked choices. */
import type { StepInProgressAttempt, StepResult, StepTopicState } from './step.contract';
export interface StepPracticeFeedback {
  questionId: string;
  optionId: string;
  isCorrect: boolean;
  revision: number;
  responseId: string;
}
export interface StepPracticeGroup {
  id: string;
  title: string;
  questionIds: string[];
  checkedCount: number;
  state: 'not_started' | 'in_progress' | 'completed';
  result: { earnedMarks: number; totalMarks: number } | null;
}
export interface StepPracticeTopic {
  topicId: string;
  sectionId: string;
  title: string;
  state: StepTopicState;
  attemptId: string | null;
  groups: StepPracticeGroup[];
}
export interface StepPracticeView {
  attempt: StepInProgressAttempt;
  groups: StepPracticeGroup[];
  feedback: StepPracticeFeedback[];
  result: StepResult | null;
}
export type StepPracticeAttemptView = StepPracticeView | StepResult;
