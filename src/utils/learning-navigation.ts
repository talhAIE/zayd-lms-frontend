import { DirectLaunchMode, LearningLesson, LearningLessonMode } from '@/services/learningService';

export interface LearningRouteContext {
  courseId: string;
  unitId: string;
  lessonId: string;
}

type LaunchableMode = Pick<LearningLessonMode | DirectLaunchMode, 'id' | 'modeKey' | 'modeSource'>;

/**
 * Keeps every Section 2 entry point on the same backend-owned mode route.
 * The server decides which modes exist and whether a learner can open them;
 * this function only selects the matching existing frontend experience.
 */
export const getLearningModePath = (
  { courseId, unitId, lessonId }: LearningRouteContext,
  mode: LaunchableMode,
): string => {
  const query = `courseId=${encodeURIComponent(courseId)}&unitId=${encodeURIComponent(unitId)}&lessonId=${encodeURIComponent(lessonId)}&modeId=${encodeURIComponent(mode.id)}`;
  const componentPath = `/student/courses/${courseId}/units/${unitId}/lessons/${lessonId}/modes/${mode.id}`;

  // Assessment and Unit Project modes have dedicated backend contracts. They
  // are direct launches, not a lesson-mode list rendered as normal components.
  if (mode.modeSource === 'quiz' || mode.modeSource === 'writing') {
    return `${componentPath}/direct`;
  }

  if (mode.modeSource !== 'legacy_ai') {
    return componentPath;
  }

  switch (mode.modeKey) {
    case 'reading-mode':
    case 'first-read-mode':
      return `/student/courses/reading-mode?${query}`;
    case 'roleplay-mode':
    case 'speaking-mode':
      return `/student/courses/roleplay-mode?${query}`;
    case 'listening-mode':
      return `/student/courses/listening-mode?${query}`;
    case 'debate-mode':
      return `/student/courses/debate-mode?${query}`;
    default:
      return componentPath;
  }
};

export const isLockedLearningItem = (item: { isLocked: boolean; status: string }): boolean =>
  item.isLocked || item.status === 'locked';

export const getNextLessonPath = (
  { courseId, unitId, lessonId }: LearningRouteContext,
  lessons: LearningLesson[],
): string => {
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const nextLesson = lessons
    .slice(currentIndex + 1)
    .find((lesson) => !isLockedLearningItem(lesson) && lesson.status !== 'completed');

  if (nextLesson?.directLaunchMode) {
    return getLearningModePath(
      { courseId, unitId, lessonId: nextLesson.id },
      nextLesson.directLaunchMode,
    );
  }

  const unitLessonsPath = '/student/courses/' + courseId + '/units/' + unitId;
  return nextLesson ? unitLessonsPath + '/lessons/' + nextLesson.id : unitLessonsPath;
};
