/** NAFS launch contract v1. Backend implemented in Phase 2; frontend integration follows.
 * Identical copy lives in frontend docs/nafs. Never import authoring manifests
 * or private answer keys into the frontend. IDs are opaque API identifiers.
 */
export type NafsAttemptState = 'not_started' | 'in_progress' | 'submitted';
export type NafsSubject = 'math' | 'english' | 'science';
export type NafsOptionLabel = 'A' | 'B' | 'C' | 'D';

export interface NafsEnvelope<T> { status: true; data: T }
export interface NafsError {
  statusCode: number;
  code: 'NAFS_DISABLED' | 'NAFS_NOT_FOUND' | 'NAFS_SUBMITTED' |
    'NAFS_REVISION_CONFLICT' | 'NAFS_INCOMPLETE' | 'NAFS_INVALID_ANSWER' |
    'NAFS_NOT_SUBMITTED' | 'NAFS_REQUEST_CONFLICT' | 'NAFS_UNAVAILABLE';
  message: string;
  // Only for an owned, authorized unfinished attempt; never correctness data.
  missingQuestionIds?: string[];
}
export interface NafsAssetView {
  id: string;
  // Access-checked media route or short-lived URL; never private authoring paths.
  url: string;
  alt: string;
  width: number;
  height: number;
}
export interface NafsCourseView {
  id: string;
  assessmentId: string;
  courseTitle: string;
  assessmentTitle: string;
  subject: NafsSubject;
  gradeLabel: string; // Content label, never an authorization grant.
  questionCount: number;
  totalMarks: number;
  state: NafsAttemptState;
  attemptId: string | null;
  result: NafsResultView | null; // Non-null only after submission.
}
export interface NafsAssessmentView {
  id: string;
  courseId: string;
  title: string;
  instructions: string[];
  questionCount: number;
  totalMarks: number;
  state: NafsAttemptState;
  attemptId: string | null;
  maxAttempts: 1;
  timerSeconds: null;
  requiresAllAnswers: true;
  feedbackPolicy: 'final_total_only';
}
export interface NafsOptionView {
  id: string;
  label: NafsOptionLabel;
  text: string;
  image: NafsAssetView | null;
}
export interface NafsQuestionView {
  id: string;
  displayOrder: number;
  stem: string;
  accessibleVisualText: string | null;
  presentation: 'structured_text' | 'source_facsimile';
  sourceFacsimile: NafsAssetView | null;
  passageId: string | null;
  options: NafsOptionView[];
  // No correct option ID, isCorrect, marks earned, feedback, issue or key data.
}
export interface NafsPassageView {
  id: string;
  paragraphs: string[];
  emphasisTerms: string[];
  sourceFacsimile: NafsAssetView;
}
export interface NafsSelection { questionId: string; optionId: string }
export interface NafsInProgressAttemptView {
  id: string;
  assessmentId: string;
  contentVersion: number;
  state: 'in_progress';
  revision: number;
  startedAt: string;
  lastSavedAt: string | null;
  questions: NafsQuestionView[];
  passages: NafsPassageView[];
  selections: NafsSelection[];
  // Score absent, not zero/null: it has not been released yet.
}
export interface NafsResultView {
  attemptId: string;
  assessmentId: string;
  state: 'submitted';
  earnedMarks: number;
  totalMarks: number;
  completedAt: string;
}
export type NafsAttemptView = NafsInProgressAttemptView | NafsResultView;
export interface NafsSaveAnswerRequest {
  optionId: string;
  expectedRevision: number;
  requestId: string;
}
export interface NafsSaveAnswerResponse {
  attemptId: string;
  state: 'in_progress';
  revision: number;
  selection: NafsSelection;
  savedAt: string;
}
export interface NafsSubmitRequest {
  expectedRevision: number;
  requestId: string;
  answers: NafsSelection[]; // Exactly one valid selection for every question.
}
export interface NafsTeacherResultRow {
  student: { id: string; displayName: string; username: string };
  assessment: { id: string; courseTitle: string; totalMarks: number };
  state: 'not_completed' | 'completed';
  earnedMarks: number | null;
  completedAt: string | null;
}
export interface NafsTeacherResultsView {
  results: NafsTeacherResultRow[];
  assessments: Array<{ id: string; courseTitle: string }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface NafsTeacherResultsQuery {
  assessmentId?: string;
  completion?: 'not_completed' | 'completed';
  page?: number;
  limit?: number;
}
