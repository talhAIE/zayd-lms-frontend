import apiClient from '@/config/ApiConfig';
import { AssessmentGraphData } from '@/types/dashboard';

type CompletionStatus = 'completed' | 'in_progress' | 'not_started';
type TeacherTimeFilter = 'weekly' | 'monthly' | 'all';
type TeacherSort = 'name' | 'usage' | 'points' | 'lessons' | 'progress';

interface ApiEnvelope<T> {
  status: 'success' | boolean;
  data: T;
}

interface LmsModeSummary {
  completed: number;
  inProgress: number;
  notStarted: number;
  locked: number;
  total: number;
}

interface LmsStudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  grade: string | null;
  class: string | null;
  cefrLevel: string | null;
  currentStreak: number;
  totalUsageSec: number;
  weeklyUsageSec: number;
  totalPoints: number;
  progress: {
    status: CompletionStatus;
    progressPct: number;
    completedCourses: number;
    totalCourses: number;
    completedUnits: number;
    totalUnits: number;
    completedLessons: number;
    totalLessons: number;
    completedLessonModes: number;
    totalLessonModes: number;
  };
  assessment: {
    attempts: number;
    passedAttempts: number;
    unitAssessmentAttempts: number;
    passedUnitAssessmentAttempts: number;
  };
  writing: { submissions: number; safelyReviewedSubmissions: number };
  achievements: { badges: number; certificates: number };
  visibleCourseIds: string[];
  visibleUnitIds: string[];
  lessonModesByKey: Record<string, LmsModeSummary>;
}

interface LmsDashboardResponse {
  teacher: TeacherInfo;
  summary: LmsDashboardAggregate;
  students: LmsStudentSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface LmsDashboardAggregate {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalUsageSec: number;
  totalCompletedLessons: number;
  totalCompletedLessonModes: number;
  averageProgressPct: number;
}

interface LmsStudentProfileResponse {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: string | null;
    class: string | null;
    cefrLevel: string | null;
    schoolName: string | null;
  };
  summary: LmsStudentSummary;
  courses: unknown[];
}

interface LmsUsageResponse {
  totalSeconds: number;
  usage: Array<{ date: string; duration: number }>;
}

interface LmsReportJob {
  id: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  errorCode: string | null;
  fileName: string | null;
}

export interface TeacherInfo {
  id: string;
  name: string;
  username: string;
}

/** The reference UI consumes this flattened, LMS-derived learner projection. */
export interface TeacherStudent {
  id: string;
  studentName: string;
  class: string;
  cefrLevel: string;
  currentStreak: number;
  usage: number;
  totalPoints: number;
  completedLessons: number;
  totalLessons: number;
  completedLessonModes: number;
  totalLessonModes: number;
  progressPct: number;
  modeSummary: Record<string, LmsModeSummary>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface TeacherDashboardSummary {
  totalStudentCount: number;
  totalUsageHours: number;
  activeStudentsCount: number;
  inactiveStudentsCount: number;
  totalLessons: number;
  completedLessons: number;
  totalLessonModes: number;
  completedLessonModes: number;
  mostUsedMode: string;
  leastUsedMode: string;
  averageProgressPct: number;
}

export interface TeacherDashboardData {
  teacherInfo: TeacherInfo;
  students: TeacherStudent[];
  totalStudents: number;
  pagination: PaginationInfo;
  summary: TeacherDashboardSummary;
}

export interface UsageGraphData {
  date: string;
  duration: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointValue: number;
  awardedAt: string;
  iconUrl: string;
  category: string;
}

export interface LessonModesByKey {
  completed: number;
  incomplete: number;
  total: number;
}

export type LessonModesProgress = Record<string, LessonModesByKey>;

export interface StudentProfileData {
  id: string;
  studentName: string;
  class: string;
  schoolName: string;
  cefrLevel: string;
  totalPoints: number;
  usage: number;
  currentStreak: number;
  usageGraphData: UsageGraphData[];
  assessmentGraphData?: AssessmentGraphData[];
  achievements: Achievement[];
  lessonModesByKey: LessonModesProgress;
  completedLessons: number;
  totalLessons: number;
  completedLessonModes: number;
  totalLessonModes: number;
  progressPct: number;
  assessmentAttempts: number;
  passedAssessmentAttempts: number;
  safelyReviewedWritingSubmissions: number;
}

export interface TeacherDashboardFilters {
  grade?: string;
  class?: string;
  courseId?: string;
  unitId?: string;
  completionStatus?: CompletionStatus;
  sortBy?: TeacherSort;
  sortOrder?: 'asc' | 'desc';
  timeFilter?: TeacherTimeFilter;
  page?: number;
  limit?: number;
}

export interface TeacherDashboardFilterValues {
  grades: string[];
  classes: string[];
  courses: Array<{ id: string; title: string }>;
  units: Array<{ id: string; title: string; courseId: string }>;
  completionStatuses: CompletionStatus[];
}

export interface BulkPdfGenerationResponse {
  status: boolean;
  data?: {
    zipUrl?: string;
    zipName?: string;
    results: Array<{ studentId: string; studentName: string; success: boolean }>;
    summary: {
      totalStudents: number;
      successfulGenerations: number;
      failedGenerations: number;
      processingTimeMs: number;
      methodsUsed: string[];
    };
  };
  message?: string;
  error?: string;
}

const unwrap = <T>(response: { data: ApiEnvelope<T> }): T => {
  if (response.data.status !== 'success' && response.data.status !== true) {
    throw new Error('The LMS returned an invalid teacher response.');
  }
  return response.data.data;
};

const toError = (error: unknown, fallback: string): Error => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return new Error(typeof message === 'string' ? message : fallback);
};

const queryParams = (filters: TeacherDashboardFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params;
};

const modeLabel = (key: string) =>
  key.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const toStudent = (student: LmsStudentSummary): TeacherStudent => ({
  id: student.id,
  studentName: `${student.firstName} ${student.lastName}`.trim(),
  class: student.class ?? student.grade ?? 'Not assigned',
  cefrLevel: student.cefrLevel ?? 'Not assessed',
  currentStreak: student.currentStreak,
  usage: student.totalUsageSec,
  totalPoints: student.totalPoints,
  completedLessons: student.progress.completedLessons,
  totalLessons: student.progress.totalLessons,
  completedLessonModes: student.progress.completedLessonModes,
  totalLessonModes: student.progress.totalLessonModes,
  progressPct: student.progress.progressPct,
  modeSummary: student.lessonModesByKey,
});

const aggregateModes = (students: LmsStudentSummary[]) => {
  const totals = new Map<string, number>();
  students.forEach((student) => {
    Object.entries(student.lessonModesByKey).forEach(([key, value]) => {
      // A mode is active when a learner has started or completed it.  The
      // legacy API exposed topic counts here; total assigned modes is not a
      // usage measure in the LMS.
      totals.set(key, (totals.get(key) ?? 0) + value.completed + value.inProgress);
    });
  });
  const ordered = Array.from(totals.entries()).sort((left, right) => right[1] - left[1]);
  return {
    mostUsedMode: ordered[0] ? modeLabel(ordered[0][0]) : 'No lesson modes',
    leastUsedMode: ordered.length ? modeLabel(ordered[ordered.length - 1][0]) : 'No lesson modes',
  };
};

const toDashboard = (data: LmsDashboardResponse): TeacherDashboardData => {
  const modeNames = aggregateModes(data.students);
  return {
    teacherInfo: data.teacher,
    students: data.students.map(toStudent),
    totalStudents: data.pagination.total,
    pagination: {
      currentPage: data.pagination.page,
      totalPages: data.pagination.totalPages,
      limit: data.pagination.limit,
      hasNext: data.pagination.page < data.pagination.totalPages,
      hasPrevious: data.pagination.page > 1,
    },
    summary: {
      totalStudentCount: data.summary.totalStudents,
      totalUsageHours: data.summary.totalUsageSec / 3600,
      activeStudentsCount: data.summary.activeStudents,
      inactiveStudentsCount: data.summary.inactiveStudents,
      totalLessons: data.students.reduce((total, student) => total + student.progress.totalLessons, 0),
      completedLessons: data.summary.totalCompletedLessons,
      totalLessonModes: data.students.reduce((total, student) => total + student.progress.totalLessonModes, 0),
      completedLessonModes: data.summary.totalCompletedLessonModes,
      averageProgressPct: data.summary.averageProgressPct,
      ...modeNames,
    },
  };
};

/** The teacher identity is taken from JWT; this argument remains for reference-UI callers. */
export const fetchTeacherStudents = async (
  _teacherId: string,
  filters: TeacherDashboardFilters = {},
): Promise<TeacherDashboardData> => {
  try {
    const response = await apiClient.get<ApiEnvelope<LmsDashboardResponse>>('/teacher/me/dashboard', {
      params: queryParams(filters),
    });
    return toDashboard(unwrap(response));
  } catch (error) {
    throw toError(error, 'Failed to load the LMS teacher dashboard.');
  }
};

export const fetchTeacherDashboardFilters = async (
  _teacherId: string,
): Promise<TeacherDashboardFilterValues> => {
  try {
    return unwrap(await apiClient.get<ApiEnvelope<TeacherDashboardFilterValues>>('/teacher/me/filters'));
  } catch (error) {
    throw toError(error, 'Failed to load LMS dashboard filters.');
  }
};

export const fetchAllTeacherStudents = async (
  teacherId: string,
  filters: Omit<TeacherDashboardFilters, 'page' | 'limit'> = {},
): Promise<TeacherStudent[]> => {
  const students: TeacherStudent[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const dashboard = await fetchTeacherStudents(teacherId, { ...filters, page, limit: 100 });
    students.push(...dashboard.students);
    totalPages = dashboard.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return students;
};

const toLessonModesProgress = (modes: Record<string, LmsModeSummary>): LessonModesProgress =>
  Object.fromEntries(Object.entries(modes).map(([key, value]) => [key, {
    completed: value.completed,
    incomplete: value.inProgress + value.notStarted + value.locked,
    total: value.total,
  }]));

export const fetchStudentProfile = async (
  _teacherId: string,
  studentId: string,
  timeFilter: 'weekly' | 'monthly' | 'all' = 'all',
): Promise<StudentProfileData> => {
  try {
    const usageDays = timeFilter === 'weekly' ? 7 : 30;
    const [profileResponse, usageResponse] = await Promise.all([
      apiClient.get<ApiEnvelope<LmsStudentProfileResponse>>(`/teacher/me/students/${studentId}`),
      apiClient.get<ApiEnvelope<LmsUsageResponse>>(`/teacher/me/students/${studentId}/usage`, { params: { days: usageDays } }),
    ]);
    const profile = unwrap(profileResponse);
    const usage = unwrap(usageResponse);
    const { student, summary } = profile;
    return {
      id: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      class: student.class ?? student.grade ?? 'Not assigned',
      schoolName: student.schoolName ?? 'Not assigned',
      cefrLevel: student.cefrLevel ?? 'Not assessed',
      totalPoints: summary.totalPoints,
      usage: usage.totalSeconds,
      currentStreak: summary.currentStreak,
      // The LMS stores DailyUsage.duration in seconds; the retained chart is
      // explicitly labelled in minutes.
      usageGraphData: usage.usage.map((record) => ({
        date: record.date,
        duration: Math.round(record.duration / 60),
      })),
      assessmentGraphData: [],
      achievements: [],
      lessonModesByKey: toLessonModesProgress(summary.lessonModesByKey),
      completedLessons: summary.progress.completedLessons,
      totalLessons: summary.progress.totalLessons,
      completedLessonModes: summary.progress.completedLessonModes,
      totalLessonModes: summary.progress.totalLessonModes,
      progressPct: summary.progress.progressPct,
      assessmentAttempts: summary.assessment.attempts,
      passedAssessmentAttempts: summary.assessment.passedAttempts,
      safelyReviewedWritingSubmissions: summary.writing.safelyReviewedSubmissions,
    };
  } catch (error) {
    throw toError(error, 'Failed to load this LMS learner profile.');
  }
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const waitForReport = async (reportId: string): Promise<LmsReportJob> => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const job = unwrap(await apiClient.get<ApiEnvelope<LmsReportJob>>(`/teacher/me/reports/${reportId}`));
    if (job.status === 'completed') return job;
    if (job.status === 'failed') throw new Error('The LMS could not generate this report.');
    await wait(5_000);
  }
  throw new Error('The report is still being prepared. Please try again in a moment.');
};

const createAndDownloadReport = async (
  studentIds: string[] | undefined,
  outputFormat: 'individual' | 'zip',
) => {
  const created = unwrap(await apiClient.post<ApiEnvelope<LmsReportJob>>('/teacher/me/reports/bulk', {
    ...(studentIds?.length ? { studentIds } : {}),
    outputFormat,
    timeFilter: 'all',
  }));
  const job = await waitForReport(created.id);
  return unwrap(await apiClient.get<ApiEnvelope<{ url: string; fileName: string }>>(
    `/teacher/me/reports/${job.id}/download`,
  ));
};

export const generateBulkPdfReports = async (
  _teacherId: string,
  studentIds?: string[],
): Promise<BulkPdfGenerationResponse> => {
  try {
    const download = await createAndDownloadReport(studentIds, 'zip');
    const total = studentIds?.length ?? 0;
    return {
      status: true,
      data: {
        zipUrl: download.url,
        zipName: download.fileName,
        results: [],
        summary: {
          totalStudents: total,
          successfulGenerations: total,
          failedGenerations: 0,
          processingTimeMs: 0,
          methodsUsed: ['lms-teacher-report'],
        },
      },
    };
  } catch (error) {
    throw toError(error, 'Failed to generate the LMS learner reports.');
  }
};

export const generateIndividualStudentPdf = async (
  teacherIdOrStudentId: string,
  maybeStudentId?: string,
): Promise<{ blobUrl: string; filename: string }> => {
  const studentId = maybeStudentId ?? teacherIdOrStudentId;
  try {
    const download = await createAndDownloadReport([studentId], 'individual');
    return { blobUrl: download.url, filename: download.fileName };
  } catch (error) {
    throw toError(error, 'Failed to generate the LMS learner report.');
  }
};
