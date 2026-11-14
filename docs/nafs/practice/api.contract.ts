/** NAFS Practice v1 learner contract, extended compatibly in Phase 7.
 * Keep byte-identical backend and frontend copies. Private taxonomy, provenance,
 * keys and immutable authoring snapshots belong exclusively on the backend.
 */
export const NAFS_PRACTICE_LIMITS = {
  maxQuestions: 500,
  optionsPerQuestion: 4,
  maxWrittenAnswerLength: 4000,
  maxMutationBytes: 64 * 1024,
  maxLearnerSnapshotBytes: 8 * 1024 * 1024,
  maxPrivateSnapshotBytes: 16 * 1024 * 1024,
  maxImageBytes: 20 * 1024 * 1024,
  maxRequestIdLength: 96,
} as const;

export type PracticeSubject = 'math' | 'english' | 'science';
export type PracticeGrade = '3' | '6' | '9';
export type PracticeRegion = 'ROW' | 'SAUDI';
export type PracticeOptionLabel = 'A' | 'B' | 'C' | 'D';
export type PracticeProgress = 'not_started' | 'in_progress' | 'completed';
export type PracticeFeedbackPolicy = 'checked_option_correctness_only';

export interface PracticeEnvelope<T> { status: true; data: T }
export interface PracticeOwner {
  id: string;
  username: string;
  role: 'student';
  region: PracticeRegion;
}
export type PracticeErrorCode =
  | 'NAFS_PRACTICE_DISABLED'
  | 'NAFS_PRACTICE_UNAVAILABLE'
  | 'NAFS_PRACTICE_NOT_FOUND'
  | 'NAFS_PRACTICE_INVALID_REQUEST'
  | 'NAFS_PRACTICE_INVALID_ANSWER'
  | 'NAFS_PRACTICE_REVISION_CONFLICT'
  | 'NAFS_PRACTICE_REQUEST_CONFLICT'
  | 'NAFS_PRACTICE_INCOMPLETE'
  | 'NAFS_PRACTICE_NOT_COMPLETED'
  | 'NAFS_PRACTICE_COMPLETED';
export interface PracticeError {
  statusCode: number;
  code: PracticeErrorCode;
  message: string;
  /** Only on an owned in-progress session's incomplete completion response. */
  uncheckedQuestionIds?: string[];
}

export interface NafsModesView {
  courseId: string;
  courseTitle: string;
  subject: PracticeSubject;
  gradeLabel: PracticeGrade;
  /** Existing assessment identity and routes; no correctness fields added. */
  quiz: { assessmentId: string; feedbackPolicy: 'final_total_only' };
  practice: { available: boolean };
}
export interface PracticeCoursesView {
  courses: Array<Pick<NafsModesView,
    'courseId' | 'courseTitle' | 'subject' | 'gradeLabel'>>;
}
export interface PracticeCollectionSummary {
  id: string;
  courseId: string;
  title: string;
  questionCount: number;
  totalMarks: number;
  state: PracticeProgress;
  activeSessionId: string | null;
  latestCompletedSessionId: string | null;
}
export interface PracticeCollectionsView {
  courseId: string;
  collections: PracticeCollectionSummary[];
}
export interface PracticePolicy {
  checkAction: 'explicit';
  retries: 'unlimited';
  progression: 'manual';
  completion: 'all_current_selections_checked';
  repeat: 'explicit_new_run_after_completion';
  scoring: 'latest_checked_answer_one_mark';
  feedback: PracticeFeedbackPolicy;
  timerSeconds: null;
}
export interface PracticeCollectionOverview extends PracticeCollectionSummary {
  instructions: string[];
  policy: PracticePolicy;
}

export interface PracticeAssetView {
  id: string;
  /** Relative, authenticated, session-owned API image route; never a blob URL. */
  url: string;
  alt: string;
  width: number;
  height: number;
}
export interface PracticeOptionView {
  id: string;
  label: PracticeOptionLabel;
  text: string;
  image: PracticeAssetView | null;
  emphasisTerms: string[];
  /** Selectable native typesetting for source equations; never an image. */
  textLayout?: PracticeTextLayout;
}
export interface PracticeTextLayout {
  /** All coordinates are in em units, independent of viewport/pixel density. */
  width: number;
  height: number;
  glyphs: Array<{
    text: string; x: number; y: number; width: number; size: number;
    serif: boolean; italic: boolean; bold: boolean;
  }>;
  rules: Array<{ x: number; y: number; length: number; angle: number }>;
}
export type PracticeResponseKind = 'single_choice' | 'multi_choice' | 'written';
export interface PracticeQuestionView {
  /** Missing on historical v1 content means single_choice. */
  responseKind?: PracticeResponseKind;
  /** Essential source notation replaces the visible stem; text remains accessible. */
  stemIsFigure?: boolean;
  id: string;
  displayOrder: number;
  stem: string;
  stemLayout?: PracticeTextLayout;
  emphasisTerms: string[];
  accessibleVisualText: string | null;
  figure: PracticeAssetView | null;
  passageId: string | null;
  options: PracticeOptionView[];
}
export interface PracticePassageView {
  id: string;
  paragraphs: string[];
  emphasisTerms: string[];
  figure: PracticeAssetView | null;
}
/** optionId retains its v1 name: an option id, canonical JSON array of selected ids,
 * or canonical JSON {text:string} for written responses. Never a grading key. */
export interface PracticeSelection { questionId: string; optionId: string }
export interface PracticeCheckView extends PracticeSelection {
  /** Stable accepted event identity; fresh responses animate, restores do not. */
  responseId: string;
  sequence: number;
  isCorrect: boolean;
  checkedAt: string;
}
export interface PracticeInProgressSession {
  id: string;
  courseId: string;
  collectionId: string;
  contentVersion: number;
  runNumber: number;
  state: 'in_progress';
  revision: number;
  startedAt: string;
  lastSavedAt: string | null;
  questionCount: number;
  questions: PracticeQuestionView[];
  passages: PracticePassageView[];
  selections: PracticeSelection[];
  /** Latest accepted check per question, not the full response history. */
  latestChecks: PracticeCheckView[];
  /** Count only selections that match their latest accepted check. */
  checkedCount: number;
  policy: PracticePolicy;
}
export interface PracticeCompletedSession {
  id: string;
  courseId: string;
  collectionId: string;
  contentVersion: number;
  runNumber: number;
  state: 'completed';
  revision: number;
  questionCount: number;
  checkedCount: number;
  earnedMarks: number;
  totalMarks: number;
  completedAt: string;
}
export type PracticeSessionView = PracticeInProgressSession | PracticeCompletedSession;

export interface PracticeStartRequest { requestId: string }
export interface PracticeMutationRequest {
  requestId: string;
  expectedRevision: number;
}
export interface PracticeSaveSelectionRequest extends PracticeMutationRequest {
  optionId: string;
}
export interface PracticeCheckRequest extends PracticeMutationRequest {
  optionId: string;
}
export interface PracticeSavedSelection {
  sessionId: string;
  revision: number;
  selection: PracticeSelection;
  savedAt: string;
  checkedCount: number;
}
export interface PracticeCheckedAnswer {
  sessionId: string;
  revision: number;
  selection: PracticeSelection;
  check: PracticeCheckView;
  checkedCount: number;
}
export type PracticeCompleteRequest = PracticeMutationRequest;
/** Path session is the completed predecessor. Repeating this request returns
 * its recorded successor even if that successor has subsequently completed. */
export type PracticeRepeatRequest = PracticeMutationRequest;

/** Documentation of transport envelopes; controllers are introduced in Phase 3. */
export interface PracticeApiResponses {
  modes: PracticeEnvelope<NafsModesView>;
  courses: PracticeEnvelope<PracticeCoursesView>;
  collections: PracticeEnvelope<PracticeCollectionsView>;
  overview: PracticeEnvelope<{ collection: PracticeCollectionOverview }>;
  session: PracticeEnvelope<{ session: PracticeSessionView }>;
  save: PracticeEnvelope<{ saved: PracticeSavedSelection }>;
  check: PracticeEnvelope<{ checked: PracticeCheckedAnswer }>;
  complete: PracticeEnvelope<{ session: PracticeCompletedSession }>;
}
