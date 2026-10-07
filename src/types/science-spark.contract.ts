// Generated Phase 1 API types; backend owns the canonical contract and allowlist.
// Canonical source: src/modules/science-spark/contracts/science-spark.contract.ts in zayd-lms-backend.
// END GENERATED HEADER
/** Phase 1 wire contract. No controllers, storage or runtime feature is registered yet. */
export type ScienceSparkCourseKey = 'science-spark';
export type ScienceSparkUnitKey = 'nature-of-science-unit-1';
export type ScienceSparkActivityKey =
  | 'introduction'
  | 'lesson-1'
  | 'lesson-2'
  | 'lesson-3'
  | 'lesson-4'
  | 'practice';
export type ScienceSparkLessonId = 'l1' | 'l2' | 'l3' | 'l4';

export interface ScienceSparkCourse {
  courseKey: ScienceSparkCourseKey;
  title: string;
  description: string;
  subject: 'Science';
  sourceGrade: 'Grade 9 Physical Science';
  unitCount: number;
}

export interface ScienceSparkUnit {
  courseKey: ScienceSparkCourseKey;
  unitKey: ScienceSparkUnitKey;
  title: string;
  orderIndex: number;
  activityCount: number;
}

interface ScienceSparkActivityBase {
  activityKey: ScienceSparkActivityKey;
  title: string;
  orderIndex: number;
  nextActivityKey: ScienceSparkActivityKey | null;
}

export interface ScienceSparkHtmlActivity extends ScienceSparkActivityBase {
  kind: 'local_html';
  lessonId: ScienceSparkLessonId | null;
  entrySectionId: string;
  allowedSectionIds: readonly string[];
}

export interface ScienceSparkPracticeActivity extends ScienceSparkActivityBase {
  kind: 'external_practice';
  provider: 'kahoot';
}

export type ScienceSparkActivity =
  ScienceSparkHtmlActivity | ScienceSparkPracticeActivity;

/** Timestamps are ISO-8601 strings; booleans are derived, never independent state. */
export interface ScienceSparkActivityState {
  activityKey: ScienceSparkActivityKey;
  opened: boolean;
  completed: boolean;
  firstOpenedAt: string | null;
  completedAt: string | null;
}

export interface ScienceSparkActivityItem {
  activity: ScienceSparkActivity;
  state: ScienceSparkActivityState;
}

export interface ScienceSparkEnvelope<T> {
  status: true;
  data: T;
}

export type ScienceSparkCoursesResponse = ScienceSparkEnvelope<{
  available: boolean;
  courses: readonly ScienceSparkCourse[];
}>;
export type ScienceSparkUnitsResponse = ScienceSparkEnvelope<{
  units: readonly ScienceSparkUnit[];
}>;
export type ScienceSparkActivitiesResponse = ScienceSparkEnvelope<{
  unit: ScienceSparkUnit;
  activities: readonly ScienceSparkActivityItem[];
  unitCompleted: boolean;
}>;
export type ScienceSparkOpenResponse =
  ScienceSparkEnvelope<ScienceSparkActivityState>;
export type ScienceSparkCompleteResponse = ScienceSparkEnvelope<{
  state: ScienceSparkActivityState;
  nextActivityKey: ScienceSparkActivityKey | null;
  returnToUnitKey: ScienceSparkUnitKey | null;
}>;

export type ScienceSparkJson =
  | null
  | boolean
  | number
  | string
  | readonly ScienceSparkJson[]
  | { readonly [key: string]: ScienceSparkJson };
export type ScienceSparkAssetPath =
  | 'assets/shared/zayd-logo.png'
  | 'assets/rainbow.png'
  | 'assets/prosthetic.jpg';

export interface ScienceSparkHtmlContent {
  kind: 'local_html';
  activityKey: ScienceSparkActivityKey;
  contentVersion: string;
  entrySectionId: string;
  allowedSectionIds: readonly string[];
  html: string;
  css: string;
  script: string;
  moduleData: ScienceSparkJson;
  assets: Partial<Record<ScienceSparkAssetPath, string>>;
}

export interface ScienceSparkPracticeContent {
  kind: 'external_practice';
  activityKey: 'practice';
  provider: 'kahoot';
  detailsUrl: string;
  embedUrl: string;
}

export type ScienceSparkContentResponse = ScienceSparkEnvelope<
  ScienceSparkHtmlContent | ScienceSparkPracticeContent
>;

/** Route keys and user identity come from authenticated context/path, not body fields. */
export type ScienceSparkMutationBody = Record<string, never>;
