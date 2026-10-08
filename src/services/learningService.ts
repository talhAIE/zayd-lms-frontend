import apiClient from '@/config/ApiConfig';

export type ProgressStatus = 'locked' | 'not_started' | 'in_progress' | 'completed';
export type CurriculumNavigation = 'lesson_list' | 'unit_activity_sequence';
export type ComponentAttemptStatus = 'in_progress' | 'submitted' | 'completed' | 'exhausted';
export type ResourceInteractionType = 'opened' | 'viewed' | 'played' | 'downloaded';
export type JsonObject = Record<string, any>;

interface ApiEnvelope<T> {
  status: boolean;
  data: T;
}

export interface LearningCourse {
  id: string;
  code: string;
  title: string;
  description: string | null;
  subject: string;
  grade: string | null;
  curriculum: string | null;
  navigation: CurriculumNavigation;
  language: string;
  orderIndex: number;
  status: string;
  enrollmentStatus: string;
  progressPct: number;
  progressStatus: ProgressStatus;
  isLocked: boolean;
  totalUnits: number;
  totalLessons: number;
  completedLessons: number;
}

export interface LearningUnit {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: ProgressStatus;
  progressPct: number;
  completedLessonCount: number;
  totalLessonCount: number;
  isLocked: boolean;
  curriculum: string | null;
  navigation: CurriculumNavigation;
  activityContainerLessonId: string | null;
}

export interface DirectLaunchMode {
  id: string;
  title: string;
  modeKey: string;
  modeSource: string;
  status: ProgressStatus;
  isLocked: boolean;
}

export interface LearningLesson {
  id: string;
  unitId: string;
  title: string;
  description: string | null;
  lessonType: string;
  launchBehavior: 'modes_list' | 'direct_mode' | string;
  orderIndex: number;
  status: ProgressStatus;
  progressPct: number;
  completedRequiredModeCount: number;
  requiredModeCount: number;
  isLocked: boolean;
  directLaunchMode: DirectLaunchMode | null;
}

export interface GuidedSpeakingStep {
  id: string;
  prompt: string;
}

export interface SpeakingConfiguration {
  requiredTurns: number;
  guidedSteps: GuidedSpeakingStep[];
}

export interface LearningLessonMode {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  modeKey: string;
  modeSource: string;
  legacyTopicId: string | null;
  contentId: string | null;
  modeSessionId: string | null;
  status: ProgressStatus;
  isRequired: boolean;
  isLocked: boolean;
  orderIndex: number;
  speaking: SpeakingConfiguration | null;
}

export interface LearningComponentOption {
  id: string;
  label: string;
  value: string | null;
  orderIndex: number;
  metadata: JsonObject | null;
  /** Answer-key data is deliberately never returned to learner clients. */
  isCorrect?: undefined;
}

export interface LearningComponentMatchingItem {
  value: string;
  orderIndex: number;
}

export interface LearningResource {
  id: string;
  componentId?: string;
  title: string;
  resourceType: string;
  url: string;
  description: string | null;
  orderIndex: number;
  metadata: JsonObject | null;
  isRequired?: boolean;
  isComplete?: boolean;
  interactions?: Array<{
    id: string;
    interactionType: ResourceInteractionType;
    createdAt: string;
  }>;
}

export interface LearningComponentAttempt {
  id: string;
  attemptNumber: number;
  status: ComponentAttemptStatus;
  response: JsonObject | null;
  isCorrect: boolean | null;
  score: number | null;
  feedback: JsonObject | null;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
}

export interface LearningComponent {
  id: string;
  lessonModeId: string;
  componentType: string;
  title: string | null;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  contentVersion: number;
  content: JsonObject | null;
  accessibility: JsonObject | null;
  points: number;
  maxAttempts: number | null;
  feedbackPolicy: string;
  completionRule: string;
  options: LearningComponentOption[];
  matchingLeftItems: LearningComponentMatchingItem[];
  matchingRightItems: LearningComponentMatchingItem[];
  resources: LearningResource[];
  attempt: LearningComponentAttempt | null;
  canStart: boolean;
  canSubmit: boolean;
  isComplete: boolean;
}

export interface ComponentAttemptRequest {
  response: JsonObject;
  finalResponse?: JsonObject;
  idempotencyKey?: string;
  timeSpentSec?: number;
}

export interface ReflectionResult {
  componentId: string;
  response: JsonObject;
  isComplete: boolean;
  modeStatus: ProgressStatus;
}

export interface WritingReviewMetric {
  key: string;
  label: string;
  score: number | null;
  feedback: string;
}

export interface WritingReviewResponse {
  id: string;
  componentId: string;
  contentVersion: number;
  submissionNumber: number;
  status: string;
  response: JsonObject | null;
  isFinal: boolean;
  submittedAt: string;
  review: {
    id: string;
    status: string;
    feedback: JsonObject | null;
    rubricMetrics: WritingReviewMetric[];
    moderationStatus: string;
    engine: string;
    engineVersion: string;
    promptVersion: string;
    reviewedAt: string;
  } | null;
  modelAnswer: string | null;
  retryable?: boolean;
  completion?: { status: 'completed' | 'pending' | 'needs_resubmission'; message?: string };
}

export interface WritingParagraphCompilation {
  paragraphComponent: LearningComponent;
  compiledParagraph: string;
  reviewStatus: 'pending';
}

export interface QuizAnswer {
  componentId: string;
  response: JsonObject;
}

export interface QuizAttemptItem {
  id: string;
  componentId: string;
  componentType: string;
  title: string | null;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  contentVersion: number;
  content: JsonObject | null;
  accessibility: JsonObject | null;
  options: LearningComponentOption[];
  matchingLeftItems: LearningComponentMatchingItem[];
  matchingRightItems: LearningComponentMatchingItem[];
  status: string;
  response: JsonObject | null;
  isCorrect: boolean | null;
  score: number | null;
  feedback: JsonObject | null;
  writingSubmissionId: string | null;
  savedAt: string | null;
  submittedAt: string | null;
}

export interface QuizAttempt {
  id: string;
  lessonModeId: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  policy: JsonObject;
  items: QuizAttemptItem[];
}

export interface UnitProjectResponse {
  lessonId: string;
  lessonModeId: string;
  status: ProgressStatus;
  policy: JsonObject;
  writing: JsonObject;
  drafts: JsonObject[];
  canRequestReview: boolean;
  canSubmitFinal: boolean;
  isComplete: boolean;
}

export interface UnitProjectFinalSubmissionResponse {
  project: UnitProjectResponse;
  finalSubmission: WritingReviewResponse;
  isComplete: boolean;
}

const createIdempotencyKey = (prefix: string, id: string): string =>
  `${prefix}-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const fetchCourses = async (): Promise<LearningCourse[]> => {
  const response = await apiClient.get<ApiEnvelope<{ courses: LearningCourse[] }>>('/learning/courses');
  return response.data.data.courses;
};

export const fetchCourseUnits = async (courseId: string): Promise<LearningUnit[]> => {
  const response = await apiClient.get<ApiEnvelope<{ units: LearningUnit[] }>>(`/learning/courses/${courseId}/units`);
  return response.data.data.units;
};

export const fetchUnitLessons = async (unitId: string): Promise<LearningLesson[]> => {
  const response = await apiClient.get<ApiEnvelope<{ lessons: LearningLesson[] }>>(`/learning/units/${unitId}/lessons`);
  return response.data.data.lessons;
};

export const fetchLessonModes = async (lessonId: string): Promise<LearningLessonMode[]> => {
  const response = await apiClient.get<ApiEnvelope<{ modes: LearningLessonMode[] }>>(`/learning/lessons/${lessonId}/modes`);
  return response.data.data.modes;
};

export const startLesson = async (lessonId: string): Promise<LearningLesson> => {
  const response = await apiClient.post<ApiEnvelope<{ lesson: LearningLesson }>>(`/learning/lessons/${lessonId}/start`, {});
  return response.data.data.lesson;
};

export const completeLesson = async (lessonId: string, payload: { score?: number; timeSpentSec?: number } = {}): Promise<LearningLesson> => {
  const response = await apiClient.post<ApiEnvelope<{ lesson: LearningLesson }>>(`/learning/lessons/${lessonId}/complete`, payload);
  return response.data.data.lesson;
};

export const startLessonMode = async (lessonModeId: string, resumeModeSessionId?: string): Promise<LearningLessonMode> => {
  const response = await apiClient.post<ApiEnvelope<{ mode: LearningLessonMode }>>(`/learning/lesson-modes/${lessonModeId}/start`, { resumeModeSessionId });
  return response.data.data.mode;
};

export const completeLessonMode = async (
  lessonModeId: string,
  payload: { modeSessionId?: string; legacyChatId?: string; score?: number; timeSpentSec?: number; metadataJson?: JsonObject } = {},
): Promise<LearningLessonMode> => {
  const response = await apiClient.post<ApiEnvelope<{ mode: LearningLessonMode }>>(`/learning/lesson-modes/${lessonModeId}/complete`, payload);
  return response.data.data.mode;
};

export const fetchLessonModeComponents = async (lessonModeId: string): Promise<LearningComponent[]> => {
  const response = await apiClient.get<ApiEnvelope<{ components: LearningComponent[] }>>(`/learning/lesson-modes/${lessonModeId}/components`);
  return response.data.data.components;
};

export const resetLessonModePractice = async (lessonModeId: string): Promise<LearningComponent[]> => {
  const response = await apiClient.post<ApiEnvelope<{ components: LearningComponent[] }>>(`/learning/lesson-modes/${lessonModeId}/reset-practice`, {});
  return response.data.data.components;
};

export const startLearningComponent = async (componentId: string): Promise<LearningComponent> => {
  const response = await apiClient.post<ApiEnvelope<{ component: LearningComponent }>>(`/learning/components/${componentId}/start`, {});
  return response.data.data.component;
};

export const saveComponentAttempt = async (componentId: string, payload: ComponentAttemptRequest): Promise<LearningComponent> => {
  const response = await apiClient.post<ApiEnvelope<{ component: LearningComponent }>>(`/learning/components/${componentId}/attempt`, {
    response: payload.response,
    idempotencyKey: payload.idempotencyKey ?? createIdempotencyKey('attempt', componentId),
    ...(payload.timeSpentSec === undefined ? {} : { timeSpentSec: payload.timeSpentSec }),
  });
  return response.data.data.component;
};

export const submitComponentAttempt = async (componentId: string, payload: ComponentAttemptRequest): Promise<LearningComponent> => {
  const response = await apiClient.post<ApiEnvelope<{ component: LearningComponent }>>(`/learning/components/${componentId}/submit`, {
    response: payload.finalResponse ?? payload.response,
    ...(payload.finalResponse ? { finalResponse: payload.finalResponse } : {}),
    idempotencyKey: payload.idempotencyKey ?? createIdempotencyKey('submit', componentId),
    ...(payload.timeSpentSec === undefined ? {} : { timeSpentSec: payload.timeSpentSec }),
  });
  return response.data.data.component;
};

export const revealApprovedAnswers = async (componentId: string): Promise<Array<{ id: string; value: string }>> => {
  const response = await apiClient.post<ApiEnvelope<{ revealAnswers: Array<{ id: string; value: string }> }>>(`/learning/components/${componentId}/reveal-answer`, {});
  return response.data.data.revealAnswers;
};

export const fetchModeResources = async (lessonModeId: string): Promise<LearningResource[]> => {
  const response = await apiClient.get<ApiEnvelope<{ resources: LearningResource[] }>>(`/learning/resources/lesson-modes/${lessonModeId}`);
  return response.data.data.resources;
};

export const interactWithResource = async (resourceId: string, interactionType: ResourceInteractionType, idempotencyKey = createIdempotencyKey('resource', resourceId)): Promise<LearningResource[]> => {
  const response = await apiClient.post<ApiEnvelope<{ resources: LearningResource[] }>>(`/learning/resources/${resourceId}/interact`, { interactionType, idempotencyKey });
  return response.data.data.resources;
};

export const submitReflection = async (componentId: string, responsePayload: JsonObject, idempotencyKey = createIdempotencyKey('reflection', componentId)): Promise<ReflectionResult> => {
  const response = await apiClient.post<ApiEnvelope<{ reflection: ReflectionResult }>>(`/learning/reflections/${componentId}/submit`, { response: responsePayload, idempotencyKey });
  return response.data.data.reflection;
};

export const startQuiz = async (lessonModeId: string): Promise<QuizAttempt> => {
  const response = await apiClient.post<ApiEnvelope<{ attempt: QuizAttempt }>>(`/learning/quiz/${lessonModeId}/start`, {});
  return response.data.data.attempt;
};

export const fetchQuizAttempt = async (quizAttemptId: string): Promise<QuizAttempt> => {
  const response = await apiClient.get<ApiEnvelope<{ attempt: QuizAttempt }>>(`/learning/quiz/attempts/${quizAttemptId}`);
  return response.data.data.attempt;
};

export const saveQuizAnswer = async (quizAttemptId: string, componentId: string, responsePayload: JsonObject, idempotencyKey = createIdempotencyKey('quiz-item', componentId)): Promise<QuizAttempt> => {
  const response = await apiClient.post<ApiEnvelope<{ attempt: QuizAttempt }>>(`/learning/quiz/attempts/${quizAttemptId}/items/${componentId}`, { response: responsePayload, idempotencyKey });
  return response.data.data.attempt;
};

export const submitQuiz = async (quizAttemptId: string, answers: QuizAnswer[], options: { idempotencyKey?: string; timeSpentSec?: number } = {}): Promise<QuizAttempt> => {
  const response = await apiClient.post<ApiEnvelope<{ attempt: QuizAttempt }>>(`/learning/quiz/attempts/${quizAttemptId}/submit`, {
    answers,
    idempotencyKey: options.idempotencyKey ?? createIdempotencyKey('quiz-submit', quizAttemptId),
    ...(options.timeSpentSec === undefined ? {} : { timeSpentSec: options.timeSpentSec }),
  });
  return response.data.data.attempt;
};

export const startUnitProject = async (lessonId: string): Promise<UnitProjectResponse> => {
  const response = await apiClient.post<ApiEnvelope<{ project: UnitProjectResponse }>>(`/learning/projects/${lessonId}/start`, {});
  return response.data.data.project;
};

export const fetchUnitProject = async (lessonId: string): Promise<UnitProjectResponse> => {
  const response = await apiClient.get<ApiEnvelope<{ project: UnitProjectResponse }>>(`/learning/projects/${lessonId}`);
  return response.data.data.project;
};

export const saveUnitProjectDraft = async (lessonId: string, responsePayload: JsonObject, idempotencyKey = createIdempotencyKey('project-draft', lessonId)): Promise<UnitProjectResponse> => {
  const response = await apiClient.post<ApiEnvelope<{ project: UnitProjectResponse }>>(`/learning/projects/${lessonId}/drafts`, { response: responsePayload, idempotencyKey });
  return response.data.data.project;
};

export const reviewUnitProjectDraft = async (lessonId: string, idempotencyKey = createIdempotencyKey('project-review', lessonId)): Promise<{ project: UnitProjectResponse; review: WritingReviewResponse }> => {
  const response = await apiClient.post<ApiEnvelope<{ project: UnitProjectResponse; review: WritingReviewResponse }>>(`/learning/projects/${lessonId}/review`, { idempotencyKey });
  return response.data.data;
};

export const submitUnitProject = async (lessonId: string, responsePayload: JsonObject, options: { idempotencyKey?: string; timeSpentSec?: number } = {}): Promise<UnitProjectFinalSubmissionResponse> => {
  const response = await apiClient.post<ApiEnvelope<UnitProjectFinalSubmissionResponse>>(`/learning/projects/${lessonId}/submit`, {
    response: responsePayload,
    idempotencyKey: options.idempotencyKey ?? createIdempotencyKey('project-submit', lessonId),
    ...(options.timeSpentSec === undefined ? {} : { timeSpentSec: options.timeSpentSec }),
  });
  return response.data.data;
};

export const analyzeWriting = async (componentId: string, idempotencyKey = createIdempotencyKey('writing-analyze', componentId)): Promise<WritingReviewResponse> => {
  const response = await apiClient.post<ApiEnvelope<WritingReviewResponse>>(`/learning/writing/${componentId}/analyze`, { idempotencyKey });
  return response.data.data;
};

export const submitWriting = async (componentId: string, responsePayload: JsonObject, options: { idempotencyKey?: string; timeSpentSec?: number } = {}): Promise<WritingReviewResponse> => {
  const response = await apiClient.post<ApiEnvelope<WritingReviewResponse>>(`/learning/writing/${componentId}/submit`, {
    response: responsePayload,
    idempotencyKey: options.idempotencyKey ?? createIdempotencyKey('writing-submit', componentId),
    ...(options.timeSpentSec === undefined ? {} : { timeSpentSec: options.timeSpentSec }),
  }, {
    // Azure can make up to three 60-second attempts, including SDK retries.
    timeout: 210_000,
  });
  return response.data.data;
};

export const fetchWritingSubmission = async (submissionId: string): Promise<WritingReviewResponse> => {
  const response = await apiClient.get<ApiEnvelope<WritingReviewResponse>>(`/learning/writing/submissions/${submissionId}`);
  return response.data.data;
};

export const revealWritingModelAnswer = async (submissionId: string): Promise<WritingReviewResponse> => {
  const response = await apiClient.post<ApiEnvelope<WritingReviewResponse>>(`/learning/writing/submissions/${submissionId}/reveal-model-answer`);
  return response.data.data;
};

export const fetchLatestWritingSubmission = async (componentId: string): Promise<WritingReviewResponse | null> => {
  const response = await apiClient.get<ApiEnvelope<WritingReviewResponse | null>>(`/learning/writing/${componentId}/latest-submission`);
  return response.data.data;
};

export const compileWritingParagraph = async (
  lessonModeId: string,
  idempotencyKey = createIdempotencyKey('writing-compile', lessonModeId),
): Promise<WritingParagraphCompilation> => {
  const response = await apiClient.post<ApiEnvelope<WritingParagraphCompilation>>(
    `/learning/lesson-modes/${lessonModeId}/writing/compile`,
    { idempotencyKey },
  );
  return response.data.data;
};
