/** STEP v1 learner-only API contract. Canonical copy: backend docs/step.
 * Frontend src/types/step.contract.ts must be byte-identical.
 * Authoring slugs are NOT runtime IDs. Runtime IDs/requestId are UUID strings.
 * No authoring package, keys, hints, strategies, or per-question scores here.
 */
export type StepSectionKind = 'grammar' | 'listening' | 'reading';
export type StepTopicState = 'not_started' | 'in_progress' | 'submitted';
export type StepOptionLabel = 'A' | 'B' | 'C' | 'D';
export interface StepEnvelope<T> { status: true; data: T }
export interface StepError {
  statusCode: number;
  code: 'STEP_DISABLED' | 'STEP_NOT_FOUND' | 'STEP_UNAVAILABLE'
    | 'STEP_INVALID_REQUEST' | 'STEP_INVALID_ANSWER' | 'STEP_REVISION_CONFLICT'
    | 'STEP_REQUEST_CONFLICT' | 'STEP_INCOMPLETE' | 'STEP_SUBMITTED'
    | 'STEP_NOT_SUBMITTED';
  message: string;
  // Only for an owned, enrolled, unfinished attempt; no correctness data.
  missingQuestionIds?: string[];
}
export interface StepCourseSummary {
  id: string;
  title: string;
  sectionCount: number;
  topicCount: number;
  completedTopicCount: number;
}
export interface StepSectionSummary {
  id: string;
  courseId: string;
  kind: StepSectionKind;
  title: string;
  displayOrder: number;
  topicCount: number;
  completedTopicCount: number;
}
export interface StepResult {
  attemptId: string;
  topicId: string;
  state: 'submitted';
  earnedMarks: number;
  totalMarks: number;
  completedAt: string;
}
export interface StepTopicSummary {
  id: string;
  sectionId: string;
  kind: StepSectionKind;
  title: string;
  displayOrder: number;
  questionCount: number;
  totalMarks: number;
  state: StepTopicState;
  attemptId: string | null;
  result: StepResult | null;
}
export interface StepTopicOverview extends StepTopicSummary {
  courseId: string;
  instructions: string[];
  maxAttempts: 1;
  timerSeconds: null;
  requiresAllAnswers: true;
  feedbackPolicy: 'final_total_only';
}
export interface StepCourseView {
  course: StepCourseSummary;
  sections: StepSectionSummary[];
}
export interface StepSectionView {
  section: StepSectionSummary;
  topics: StepTopicSummary[];
}
export interface StepGrouping {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}
export interface StepOption { id: string; label: StepOptionLabel; text: string }
export interface StepQuestion {
  id: string;
  displayOrder: number;
  instruction: string;
  stem: string; // May be empty for a question whose instruction is the full stem.
  grouping: StepGrouping | null;
  options: StepOption[]; // Exactly four; IDs belong only to this question.
}
export interface StepPassage { id: string; title: string; paragraphs: string[] }
export interface StepAudio {
  id: string;
  title: string;
  contentType: 'audio/mpeg' | 'audio/mp4';
  durationMs: number;
}
export interface StepAudioAccess {
  url: string; // Read-only HTTPS blob SAS, scoped to exactly one STEP audio blob.
  expiresAt: string; // At most five minutes. Never persist in a draft or log it.
}
export interface StepSelection { questionId: string; optionId: string }
export interface StepInProgressAttempt {
  id: string;
  topicId: string;
  courseId: string;
  sectionId: string;
  kind: StepSectionKind;
  title: string;
  contentVersion: number;
  state: 'in_progress';
  revision: number;
  startedAt: string;
  lastSavedAt: string | null;
  questions: StepQuestion[];
  passage: StepPassage | null;
  audio: StepAudio | null;
  selections: StepSelection[];
  // Score fields are absent until submission, never guessed or locally graded.
}
export type StepAttemptView = StepInProgressAttempt | StepResult;
export interface StepSaveAnswerRequest {
  optionId: string;
  expectedRevision: number;
  requestId: string;
}
export interface StepSaveAnswerResponse {
  attemptId: string;
  state: 'in_progress';
  revision: number;
  selection: StepSelection;
  savedAt: string;
}
export interface StepSubmitRequest {
  expectedRevision: number;
  requestId: string;
  answers: StepSelection[]; // Exact complete snapshot, one valid option/question.
}
export interface StepCoursesView { courses: StepCourseSummary[] }
