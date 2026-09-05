import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, CircleAlert, Eye, RotateCcw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getLessonModes, 
  startLessonMode, 
  completeLessonMode,
  getLessons,
  getUnits,
} from '@/redux/slices/learningSlice';
import { 
  fetchLessonModeComponents,
  resetLessonModePractice,
  submitComponentAttempt,
  saveComponentAttempt,
  startLearningComponent,
  fetchModeResources,
  interactWithResource,
  submitReflection,
  revealApprovedAnswers,
  compileWritingParagraph,
  submitWriting,
  revealWritingModelAnswer,
  fetchLatestWritingSubmission,
  LearningResource,
  ResourceInteractionType,
  LearningComponent,
  LearningLessonMode,
} from '@/services/learningService';
import { AppDispatch, RootState } from '@/redux/store';
import { toast } from 'sonner';
import { getLearningModePath } from '@/utils/learning-navigation';
import { useLearningProgressRefresh } from '@/hooks/useLearningProgressRefresh';
import TopicCompletionModal from '@/components/ui/TopicCompletionModal';

import {
  DropdownComponent,
  MCQComponent,
  MatchComponent,
  SemanticReviewComponent,
  TrueFalseComponent,
  TextVariationComponent,
  MediaComponent,
  FlashcardsComponent,
  FillInTheBlankComponent,
  ReflectionComponent,
  ResourceComponent,
  TextComponent,
  UnavailableComponent,
  WritingTableComponent,
} from '@/components/learning/modes';

// Only these activities ask the learner to change and re-submit an answer.
// Review/view activities (such as flashcards) complete through their own
// interaction and must never be presented as an answer retry.
const RETRYABLE_COMPONENT_TYPES = new Set([
  'mcq',
  'dropdown',
  'true_false',
  'fill_in_the_blank',
  'match_column',
  'open_input',
  'writing_table',
]);

export default function ComponentModePlay() {
  const { courseId, unitId, lessonId, modeId } = useParams<{
    courseId: string;
    unitId: string;
    lessonId: string;
    modeId: string;
  }>();

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { modes, lessons, units } = useSelector((state: RootState) => state.learning);
  const [components, setComponents] = useState<LearningComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingMode, setIsSubmittingMode] = useState(false);
  const [localResponses, setLocalResponses] = useState<Record<string, any>>({});
  const [writingReviewFeedback, setWritingReviewFeedback] = useState<Record<string, Record<string, unknown>>>({});
  const [modelAnswerComponentId, setModelAnswerComponentId] = useState<string | null>(null);
  // A direct Saudi lesson launch can reach this screen before Redux has the
  // lesson's modes. Keep the mode resolved from the route's lesson so the
  // Writing Mode workflow never falls back to generic open-input handling.
  const [resolvedMode, setResolvedMode] = useState<LearningLessonMode | null>(null);
  const [, setCompletedComponentIds] = useState<Set<string>>(new Set());
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, Array<{ id: string; value: string }>>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const startedModeIdRef = useRef<string | null>(null);
  const refreshLearningProgress = useLearningProgressRefresh();

  const currentUnit = units.find((u) => u.id === unitId);
  const currentLesson = lessons.find((l) => l.id === lessonId);
  const currentMode = resolvedMode ?? modes.find((m) => m.id === modeId);

  useEffect(() => {
    if (unitId && lessons.length === 0) {
      dispatch(getLessons(unitId));
    }
  }, [dispatch, unitId, lessons.length]);

  useEffect(() => {
    if (courseId && units.length === 0) {
      dispatch(getUnits(courseId));
    }
  }, [dispatch, courseId, units.length]);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isJustCompleted, setIsJustCompleted] = useState(false);

  const handleBack = () => {
    const isDirectLesson = currentLesson?.launchBehavior === 'direct_mode' || modes.length <= 1;
    if (isDirectLesson && courseId && unitId) {
      navigate(`/student/courses/${courseId}/units/${unitId}`);
    } else if (courseId && unitId && lessonId) {
      navigate(`/student/courses/${courseId}/units/${unitId}/lessons/${lessonId}`);
    } else {
      navigate(-1);
    }
  };

  const handleResetMode = async () => {
    if (!modeId) return;
    setIsSubmittingMode(true);
    try {
      if (startedModeIdRef.current) startedModeIdRef.current = null;
      const data = await resetLessonModePractice(modeId);
      const sorted = [...data].sort((a, b) => a.orderIndex - b.orderIndex);
      
      setComponents(sorted);
      setLocalResponses({});
      setWritingReviewFeedback({});
      setRevealedAnswers({});
      setModelAnswerComponentId(null);
      setCompletedComponentIds(new Set());
      setCurrentIndex(0);
      
      toast.success('Mode progress reset! You can now practice from the beginning.');
    } catch (err: any) {
      console.error('Failed to reset mode:', err);
      toast.error('Unable to reset mode.');
    } finally {
      setIsSubmittingMode(false);
      setShowCompletionModal(false);
      setIsJustCompleted(false);
    }
  };

  const refreshModeState = useCallback(async () => {
    if (!modeId || !lessonId) return [];

    const mode = resolvedMode ?? modes.find((m) => m.id === modeId);
    
    const [modeComponents, modeResources, refreshedModes] = await Promise.all([
      fetchLessonModeComponents(modeId),
      mode?.modeKey === 'resource' ? fetchModeResources(modeId).catch(() => [] as LearningResource[]) : Promise.resolve([] as LearningResource[]),
      dispatch(getLessonModes(lessonId)).unwrap(),
    ]);
    setResolvedMode(refreshedModes.find((candidate) => candidate.id === modeId) ?? null);
    const resourcesByComponent = new Map<string, LearningResource[]>();
    modeResources.forEach((resource) => {
      if (!resource.componentId) return;
      resourcesByComponent.set(resource.componentId, [
        ...(resourcesByComponent.get(resource.componentId) || []),
        resource,
      ]);
    });
    const onlyResourceComponent = modeComponents.filter((component) => component.componentType === 'resource');
    setComponents(modeComponents.sort((left, right) => left.orderIndex - right.orderIndex).map((component) => ({
      ...component,
      resources: resourcesByComponent.get(component.id)
        || (onlyResourceComponent.length === 1 && component.componentType === 'resource' ? modeResources : component.resources),
    })));
    await refreshLearningProgress(lessonId, { unitId, courseId });
    return refreshedModes;
  }, [courseId, dispatch, lessonId, modeId, modes, refreshLearningProgress, resolvedMode, unitId]);

  // Load components & initialize mode session
  useEffect(() => {
    async function loadData() {
      if (!modeId) return;
      setLoading(true);
      setError(null);
      setResolvedMode(null);
      try {
        // Direct-launch Saudi lessons do not visit the lesson-modes list.
        // Fetch it here before rendering so title, access state, and the
        // specialised Writing Mode path all use the real mode definition.
        const loadedModes = lessonId
          ? await dispatch(getLessonModes(lessonId)).unwrap()
          : [];
        const mode = loadedModes.find((candidate) => candidate.id === modeId);
        setResolvedMode(mode ?? null);
        if (!mode) {
          throw new Error('This learning mode is no longer available in the lesson.');
        }

        // Attempt to start lesson mode (non-blocking if already in progress or server transient 500)
        const shouldStartMode = startedModeIdRef.current !== modeId;
        if (shouldStartMode) startedModeIdRef.current = modeId;
        const startPromise = shouldStartMode
          ? dispatch(startLessonMode({ lessonModeId: modeId }))
              .unwrap()
              .catch((startErr) => {
                console.warn('startLessonMode non-critical error:', startErr);
              })
          : Promise.resolve();

        const [data, resources] = await Promise.all([
          fetchLessonModeComponents(modeId),
          mode?.modeKey === 'resource' ? fetchModeResources(modeId).catch(() => [] as LearningResource[]) : Promise.resolve([] as LearningResource[]),
          startPromise
        ]);
        // Start on-view components as they become visible. The backend then owns
        // acknowledgement completion instead of the UI inventing it locally.
        const initialized = [...data].sort((a, b) => a.orderIndex - b.orderIndex);
        const resourcesByComponent = new Map<string, LearningResource[]>();
        resources.forEach((resource) => {
          if (!resource.componentId) return;
          resourcesByComponent.set(resource.componentId, [
            ...(resourcesByComponent.get(resource.componentId) || []),
            resource,
          ]);
        });
        const resourceComponents = initialized.filter((component) => component.componentType === 'resource');
        const sorted = initialized.sort((a, b) => a.orderIndex - b.orderIndex).map((component) => ({
          ...component,
          resources: resourcesByComponent.get(component.id)
            || (resourceComponents.length === 1 && component.componentType === 'resource' ? resources : component.resources),
        }));
        setComponents(sorted);

        const paragraphComponent = sorted.find(
          (component) =>
            component.componentType === 'open_input' &&
            component.content?.presentation === 'compiled_paragraph',
        );
        if (paragraphComponent) {
          const latestSubmission = await fetchLatestWritingSubmission(
            paragraphComponent.id,
          ).catch(() => null);
          // Feedback is a content-versioned artefact. Do not show an older
          // five-category review after the Saudi rubric changes to the
          // approved three-category version.
          if (
            latestSubmission &&
            latestSubmission.contentVersion === paragraphComponent.contentVersion
          ) {
            const feedback = latestSubmission.review?.feedback;
            const comment =
              feedback &&
              typeof feedback === 'object' &&
              typeof (feedback as Record<string, unknown>).feedback === 'string'
                ? (feedback as Record<string, unknown>).feedback as string
                : latestSubmission.status === 'reviewed'
                  ? 'Your writing review is ready.'
                  : 'Your response has been saved for instructor review.';
            const metrics = latestSubmission.review?.rubricMetrics ?? [];
            const scores = metrics
              .map((metric) => metric.score)
              .filter((score): score is number => typeof score === 'number');
            setWritingReviewFeedback((current) => ({
              ...current,
              [paragraphComponent.id]: {
                submissionId: latestSubmission.id,
                comment,
                fieldResults: metrics,
                modelAnswer: latestSubmission.modelAnswer,
                ...(scores.length > 0
                  ? { score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) }
                  : {}),
              },
            }));
          }
        }

        // Pre-fill completed components from attempt status
        const completedIds = new Set<string>();
        let firstIncomplete = -1;
        sorted.forEach((c, index) => {
          if (c.isComplete || c.attempt?.completedAt) {
            completedIds.add(c.id);
          } else if (firstIncomplete === -1) {
            firstIncomplete = index;
          }
        });
        setCompletedComponentIds(completedIds);
        
        // Jump to first uncompleted component, or the last one if all are complete
        if (sorted.length > 0) {
          setCurrentIndex(firstIncomplete === -1 ? sorted.length - 1 : firstIncomplete);
        } else {
          setCurrentIndex(0);
        }

        const isAllComponentsCompleted = sorted.length > 0 && firstIncomplete === -1;
        if (mode?.status === 'completed' && isAllComponentsCompleted) {
          setShowCompletionModal(true);
        }
      } catch (err: any) {
        console.error('Failed to load components:', err);
        setError(err.response?.data?.message || 'Failed to load lesson mode components.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dispatch, lessonId, modeId]);

  // Handle component answer submissions
  const handleComponentSubmit = async (componentId: string, response: any) => {
    try {
      const formattedResponse =
        typeof response === 'object' && response !== null ? response : { value: response };

      const result = await submitComponentAttempt(componentId, {
        response: formattedResponse,
        finalResponse: formattedResponse,
      });

      setComponents((currentComponents) =>
        currentComponents.map((component) => component.id === componentId ? result : component),
      );
      if (!result.isComplete && !result.attempt?.completedAt) {
        // An incorrect response starts a fresh learner-controlled retry. Do not
        // let the Continue button silently submit the previous response again.
        setLocalResponses((current) => {
          const next = { ...current };
          delete next[componentId];
          return next;
        });
      }
      setCompletedComponentIds((previousIds) => {
        const nextIds = new Set(previousIds);
        if (result.isComplete || result.attempt?.completedAt) {
          nextIds.add(componentId);
        } else {
          nextIds.delete(componentId);
        }
        return nextIds;
      });
      toast.success(result.isComplete ? 'Activity completed!' : 'Response submitted.');
      return result;
    } catch (err: any) {
      console.error('Failed to submit component response:', err);
      toast.error(err.response?.data?.message || 'Failed to submit response.');
      throw err;
    }
  };

  const handleComponentChange = async (componentId: string, response: any) => {
    setLocalResponses((current) => ({ ...current, [componentId]: response }));
    try {
      const result = await saveComponentAttempt(componentId, { response });
      setComponents((currentComponents) => currentComponents.map((component) => component.id === componentId ? result : component));
    } catch {
      // Draft saving is best-effort; the final submit still validates server-side.
    }
  };

  const handleRevealAnswer = async (component: LearningComponent) => {
    if (component.attempt?.status !== 'exhausted' || component.attempt?.feedback?.canRevealAnswer !== true) return;
    try {
      const answers = await revealApprovedAnswers(component.id);
      setRevealedAnswers((current) => ({ ...current, [component.id]: answers }));
    } catch (revealError: any) {
      toast.error(revealError.response?.data?.message || 'Answers are not available for this activity.');
    }
  };

  const handleResourceInteraction = async (resource: LearningResource, interactionType: ResourceInteractionType) => {
    try {
      const updatedResources = await interactWithResource(resource.id, interactionType);
      setComponents((currentComponents) => currentComponents.map((component) =>
        component.resources.some((item) => item.id === resource.id)
          ? { ...component, resources: updatedResources }
          : component,
      ));
      await refreshModeState();
    } catch {
      toast.error('Unable to record this resource interaction.');
    }
  };

  const handleReflectionSubmit = async (componentId: string, response: Record<string, unknown>) => {
    try {
      const result = await submitReflection(componentId, response);
      setComponents((currentComponents) => currentComponents.map((component) =>
        component.id === componentId ? { ...component, isComplete: result.isComplete } : component,
      ));
      setCompletedComponentIds((previousIds) => {
        const nextIds = new Set(previousIds);
        if (result.isComplete) nextIds.add(componentId);
        return nextIds;
      });
      await refreshModeState();
      toast.success('Reflection submitted.');
      return result;
    } catch (submitError: any) {
      toast.error(submitError.response?.data?.message || 'Unable to submit reflection.');
      throw submitError;
    }
  };

  const handleLocalComponentChange = (componentId: string, response: any) => {
    setLocalResponses((current) => ({ ...current, [componentId]: response }));
  };

  const handleWritingParagraphSubmit = async (
    component: LearningComponent,
    paragraph: string,
  ) => {
    if (!modeId) throw new Error('Writing Mode is unavailable.');
    if (!paragraph.trim()) {
      toast.error('Build your paragraph before requesting feedback.');
      throw new Error('Writing paragraph is empty.');
    }

    try {
      const compilation = await compileWritingParagraph(modeId);
      setComponents((currentComponents) =>
        currentComponents.map((item) =>
          item.id === compilation.paragraphComponent.id
            ? compilation.paragraphComponent
            : item,
        ),
      );
      const review = await submitWriting(component.id, { paragraph });
      const reviewFeedback = review.review?.feedback;
      const feedbackText =
        reviewFeedback && typeof reviewFeedback === 'object' &&
        typeof (reviewFeedback as Record<string, unknown>).feedback === 'string'
          ? (reviewFeedback as Record<string, unknown>).feedback as string
          : review.status === 'reviewed'
            ? 'Your writing review is ready.'
            : 'Your response has been saved for instructor review.';
      const rubricMetrics = review.review?.rubricMetrics ?? [];
      const scores = rubricMetrics
        .map((metric) => metric.score)
        .filter((score): score is number => typeof score === 'number');
      setWritingReviewFeedback((current) => ({
        ...current,
        [component.id]: {
          submissionId: review.id,
          comment: feedbackText,
          fieldResults: rubricMetrics,
          modelAnswer: review.modelAnswer,
          ...(scores.length > 0
            ? { score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) }
            : {}),
        },
      }));
      await refreshModeState();

      toast.success(
        review.status === 'reviewed'
          ? 'Writing feedback is ready.'
          : 'Your writing has been sent for review.',
      );
      return {
        feedback: {
          comment: feedbackText,
          fieldResults: review.review?.rubricMetrics ?? [],
          modelAnswer: review.modelAnswer,
        },
      };
    } catch (submitError: any) {
      toast.error(
        submitError.response?.data?.message ||
          'Unable to build and review your paragraph.',
      );
      throw submitError;
    }
  };

  const handleWritingModelAnswerReveal = async (component: LearningComponent) => {
    const review = writingReviewFeedback[component.id];
    const submissionId = review?.submissionId;
    if (typeof submissionId !== 'string') {
      toast.error('Your writing review is still loading. Please try again.');
      return;
    }

    const revealed = await revealWritingModelAnswer(submissionId);
    setWritingReviewFeedback((current) => ({
      ...current,
      [component.id]: {
        ...current[component.id],
        submissionId: revealed.id,
        modelAnswer: revealed.modelAnswer,
      },
    }));
    setModelAnswerComponentId(component.id);
    await refreshModeState();
    toast.success('Model answer revealed. You can now finish this activity.');
  };

  const handleCompleteNavigation = (updatedModesList?: any[]) => {
    const activeModes = updatedModesList ?? modes;
    const currentModeIndex = activeModes.findIndex((m: any) => m.id === modeId);
    const nextMode = currentModeIndex !== -1 && currentModeIndex < activeModes.length - 1 
      ? activeModes[currentModeIndex + 1] 
      : null;

    if (nextMode && !nextMode.isLocked && courseId && unitId && lessonId) {
      navigate(getLearningModePath({ courseId, unitId, lessonId }, nextMode));
    } else if (courseId && unitId) {
      navigate(`/student/courses/${courseId}/units/${unitId}`);
    } else {
      handleBack();
    }
  };

  // Complete the entire mode and progress to next mode or lesson roadmap
  const handleCompleteMode = async () => {
    if (!modeId || !lessonId) return;
    const isModeAlreadyCompletedOnBackend = currentMode?.status === 'completed';
    
    if (!isModeAlreadyCompletedOnBackend && !requiredComponentsComplete) {
      toast.error('Complete the required activities before moving on.');
      return;
    }
    setIsSubmittingMode(true);
    try {
      const updatedModes = isModeAlreadyCompletedOnBackend
        ? await dispatch(getLessonModes(lessonId)).unwrap()
        : await dispatch(completeLessonMode({ lessonModeId: modeId! })).unwrap().then(() => dispatch(getLessonModes(lessonId)).unwrap());
      setResolvedMode(updatedModes.find((candidate) => candidate.id === modeId) ?? null);
      await refreshLearningProgress(lessonId, { unitId, courseId });

      toast.success('Mode completed successfully!');
      setIsJustCompleted(true);
      setShowCompletionModal(true);
    } catch (err: any) {
      console.error('Failed to complete mode:', err);
      toast.error('Failed to complete mode.');
    } finally {
      setIsSubmittingMode(false);
    }
  };

  const visibleComponents = components.filter((comp) => {
    const isUnitOverviewVariation = comp.componentType === 'text_variation' && comp.content?.presentation === 'unit_overview';
    const overviewVariations = components.filter((item) => item.componentType === 'text_variation' && item.content?.presentation === 'unit_overview');
    if (isUnitOverviewVariation && overviewVariations[0]?.id !== comp.id) {
      return false;
    }
    return true;
  });

  const totalCount = visibleComponents.length;
  const currentComp = visibleComponents[currentIndex];
  
  const completedCount = visibleComponents.filter((component) => component.isComplete || Boolean(component.attempt?.completedAt)).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const isComponentComplete = (component: LearningComponent): boolean =>
    component.isComplete ||
    Boolean(component.attempt?.completedAt) ||
    component.attempt?.status === 'exhausted' ||
    (component.componentType === 'open_input' &&
      component.completionRule !== 'manual_review' &&
      Boolean(component.attempt?.response));
  const canAdvanceFromCurrent = Boolean(
    currentComp
      ? !currentComp.isRequired || isComponentComplete(currentComp)
      : true,
  );
  const requiredComponentsComplete = visibleComponents
    .filter((component) => component.isRequired)
    .every(isComponentComplete);
  const canAdvanceMode = Boolean(currentMode?.status === 'completed' || requiredComponentsComplete);
  const currentWritingReview = currentComp
    ? writingReviewFeedback[currentComp.id]
    : undefined;
  const canRevealCurrentWritingModelAnswer = Boolean(
    currentComp &&
      currentComp.componentType === 'open_input' &&
      currentComp.content?.presentation === 'compiled_paragraph' &&
      typeof currentWritingReview?.submissionId === 'string' &&
      typeof currentWritingReview?.modelAnswer === 'string',
  );
  const currentComponentSupportsRetry = Boolean(
    currentComp && RETRYABLE_COMPONENT_TYPES.has(currentComp.componentType),
  );
  const needsFreshRetryResponse = Boolean(
    currentComp &&
      currentComponentSupportsRetry &&
      currentComp.attempt?.status === 'submitted' &&
      !isComponentComplete(currentComp) &&
      !canRevealCurrentWritingModelAnswer &&
      !localResponses[currentComp.id],
  );

  return (
    <div className="w-full max-w-[1040px] mx-auto pb-16 flex flex-col gap-6 font-['Outfit',sans-serif]">
      {/* Mode Header Card with Back and Reset Buttons */}
      <div className="w-full bg-white rounded-none md:rounded-[20px] border border-[#E2E8F0] shadow-sm p-4 md:p-6 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#282828] hover:bg-gray-50 transition-all cursor-pointer shadow-sm flex-shrink-0"
            title={currentLesson?.launchBehavior === 'direct_mode' || modes.length <= 1 ? 'Back to Lessons' : 'Back to Lesson'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[20px] md:text-[24px] font-extrabold text-[#0F172A] tracking-[-0.3px] truncate">
              {currentMode?.title || 'Learning Mode'}
            </h1>

            <span className="text-[13px] font-semibold text-[#64748B] truncate">
              {currentUnit?.title || 'Unit'}
              {currentLesson ? ` • ${currentLesson.title}` : ''}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsJustCompleted(false);
            setShowCompletionModal(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-bold text-[#5C9DFF] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#5C9DFF]/30 rounded-full transition-colors cursor-pointer shadow-sm shrink-0"
          title="Reset Lesson"
        >
          <RotateCcw className="w-4 h-4 text-[#5C9DFF]" />
          <span className="hidden sm:inline">Reset Mode</span>
        </button>
      </div>

      {/* Top Progress Bar */}
      {!loading && !error && totalCount > 0 && (
        <div className="w-full flex flex-col gap-1.5 px-1">
          <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[13px] font-bold text-[#10B981]">{progressPct}% Complete</span>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="w-full bg-white rounded-[20px] p-12 border border-[#E2E8F0] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-[#4F8DFB] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#64748B] font-medium text-[14px]">Loading interactive mode components...</p>
        </div>
      )}

      {error && !loading && (
        <div className="w-full bg-red-50 rounded-[20px] p-6 border border-red-200 text-red-700 text-center">
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Components List */}
      {!loading && !error && components.length === 0 && (
        <div className="w-full bg-white rounded-[20px] p-8 border border-[#E2E8F0] text-center text-[#64748B]">
          No components available in this mode.
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          {currentComp && (() => {
            const comp = currentComp;
            const isCompleted = comp.isComplete || Boolean(comp.attempt?.completedAt);
            const isTerminal = isCompleted || comp.attempt?.status === 'exhausted';
            const isDisabled = !comp.canSubmit || isTerminal;
            const overviewVariations = components.filter((item) => item.componentType === 'text_variation' && item.content?.presentation === 'unit_overview');

            switch (comp.componentType) {
              case 'dropdown':
                return (
                  <DropdownComponent
                    key={comp.id}
                    component={comp}
                    onAnswerChange={(ans) => handleComponentChange(comp.id, ans)}
                    isSubmitted={isTerminal}
                    disabled={isDisabled}
                  />
                );

              case 'mcq':
                return (
                  <MCQComponent
                    key={comp.id}
                    component={comp}
                    onAnswerChange={(val) => handleComponentChange(comp.id, { optionId: val })}
                    isSubmitted={isTerminal}
                    disabled={isDisabled}
                  />
                );

              case 'match_column':
                return (
                  <MatchComponent
                    key={comp.id}
                    component={comp}
                    onAnswerChange={(pairs) => handleLocalComponentChange(comp.id, { matches: Object.entries(pairs).map(([leftValue, rightValue]) => ({ leftValue, rightValue })) })}
                    isSubmitted={isTerminal}
                    disabled={isDisabled}
                  />
                );

              case 'open_input': {
                // `compiled_paragraph` is the dedicated Writing workflow,
                // rather than a generic text response. Checking its content
                // contract also keeps an old direct URL safe if Redux reloads.
                const isWritingParagraph =
                  comp.content?.presentation === 'compiled_paragraph';
                let defaultText = '';
                if (comp.content?.presentation === 'compiled_paragraph') {
                  const tableComp = components.find(c => c.componentType === 'writing_table');
                  if (tableComp && tableComp.attempt?.response?.rows) {
                    const rows = tableComp.attempt.response.rows as any[];
                    defaultText = rows.map(r => String(r.sentence || '')).filter(s => s.trim().length > 0).join(' ');
                  }
                }
                return (
                  <SemanticReviewComponent
                    key={comp.id}
                    component={comp}
                    onAnswerChange={(val) => handleComponentChange(comp.id, comp.content?.presentation === 'compiled_paragraph' ? { paragraph: val } : { text: val })}
                    onSubmit={(val) =>
                      isWritingParagraph
                        ? handleWritingParagraphSubmit(comp, val)
                        : handleComponentSubmit(
                            comp.id,
                            comp.content?.presentation === 'compiled_paragraph'
                              ? { paragraph: val }
                              : { text: val },
                          )
                    }
                    reviewFeedback={writingReviewFeedback[comp.id]}
                    showModelAnswer={modelAnswerComponentId === comp.id}
                    onViewModelAnswer={
                      canRevealCurrentWritingModelAnswer
                        ? () => handleWritingModelAnswerReveal(comp)
                        : undefined
                    }
                    isSubmitted={
                      isWritingParagraph
                        ? isTerminal || Boolean(writingReviewFeedback[comp.id])
                        : isTerminal || Boolean(comp.attempt?.status === 'submitted')
                    }
                    disabled={isDisabled}
                    defaultText={defaultText}
                  />
                );
              }

              case 'true_false':
                return (
                  <TrueFalseComponent
                    key={comp.id}
                    component={comp}
                    onAnswerChange={(val) => handleComponentChange(comp.id, { optionId: val })}
                    isSubmitted={isTerminal}
                    disabled={isDisabled}
                  />
                );

              case 'flashcards':
                return (
                  <FlashcardsComponent
                    key={comp.id}
                    component={comp}
                    onSubmit={(response) => handleComponentSubmit(comp.id, response)}
                    isSubmitted={isTerminal}
                  />
                );

              case 'media':
                return <MediaComponent key={comp.id} component={comp} />;

              case 'text':
                return <TextComponent key={comp.id} component={comp} />;

              case 'text_variation':
                return <TextVariationComponent key={comp.id} component={comp} groupedComponents={comp.content?.presentation === 'unit_overview' ? overviewVariations : undefined} />;

              case 'fill_in_the_blank':
                return <FillInTheBlankComponent key={comp.id} component={comp} onAnswerChange={(response) => handleComponentChange(comp.id, response)} isSubmitted={isTerminal} />;

              case 'writing_table':
                return <WritingTableComponent key={comp.id} component={comp} onAnswerChange={(response) => handleLocalComponentChange(comp.id, response)} onDraftSave={(response) => { void handleComponentChange(comp.id, response); }} onSubmit={(response) => handleComponentSubmit(comp.id, response)} onBusyChange={setIsSubmittingMode} isSubmitted={isTerminal} />;

              case 'resource':
                return <ResourceComponent key={comp.id} component={comp} onInteract={handleResourceInteraction} />;

              case 'reflection':
                return <ReflectionComponent key={comp.id} component={comp} onSubmit={(response) => handleReflectionSubmit(comp.id, response)} isSubmitted={isTerminal} />;

              default:
                return <UnavailableComponent key={comp.id} component={comp} />;
            }
          })()}

          <div className="flex flex-col gap-3">
            {currentComp && currentComp.componentType !== 'flashcards' && currentComp.content?.presentation !== 'compiled_paragraph' && (
              <ComponentAttemptFeedback
                key={`feedback-${currentComp.id}`}
                component={currentComp}
                answers={revealedAnswers[currentComp.id] || []}
                onReveal={() => handleRevealAnswer(currentComp)}
              />
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="w-full bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm p-4 md:px-6 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <button
              type="button"
              onClick={() => setCurrentIndex((curr) => Math.max(0, curr - 1))}
              disabled={currentIndex === 0 || isSubmittingMode}
              className="w-full sm:w-auto bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 disabled:opacity-50 px-7 py-3 rounded-full font-bold text-[14px] transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={async () => {
                if (isSubmittingMode) return;

                if (canRevealCurrentWritingModelAnswer && currentComp) {
                  setIsSubmittingMode(true);
                  try {
                    await handleWritingModelAnswerReveal(currentComp);
                  } catch (revealError: any) {
                    toast.error(
                      revealError.response?.data?.message ||
                        'Unable to reveal the model answer.',
                    );
                  } finally {
                    setIsSubmittingMode(false);
                  }
                  return;
                }
                
                if (!canAdvanceFromCurrent && currentComp) {
                  // Flashcards submit their completion automatically once all
                  // cards have been revealed. They are review activities, not
                  // answer attempts, so a generic retry action is both
                  // misleading and unable to do anything useful.
                  if (currentComp.componentType === 'flashcards') {
                    toast.info('Reveal every flashcard to continue.');
                    return;
                  }

                  if (currentComp.completionRule === 'on_view') {
                    setIsSubmittingMode(true);
                    try {
                      // Reading a text is acknowledged deliberately: opening a
                      // mode must not increase progress before the learner
                      // chooses Next/Continue.
                      const result = await startLearningComponent(currentComp.id);
                      setComponents((currentComponents) =>
                        currentComponents.map((component) =>
                          component.id === result.id ? result : component,
                        ),
                      );
                      setCompletedComponentIds((previousIds) => {
                        const nextIds = new Set(previousIds);
                        if (result.isComplete || result.attempt?.completedAt) {
                          nextIds.add(result.id);
                        }
                        return nextIds;
                      });

                      if (currentIndex < totalCount - 1) {
                        setCurrentIndex((index) => index + 1);
                      } else {
                        await handleCompleteMode();
                      }
                    } catch (startError: any) {
                      toast.error(
                        startError.response?.data?.message ||
                          'Unable to record this activity step.',
                      );
                    } finally {
                      setIsSubmittingMode(false);
                    }
                    return;
                  }

                  let currentResponse = currentComp.componentType === 'match_column'
                    ? localResponses[currentComp.id]
                    : localResponses[currentComp.id] ?? currentComp.attempt?.response;
                  const isWritingParagraph =
                    currentComp.componentType === 'open_input' &&
                    currentComp.content?.presentation === 'compiled_paragraph';
                  if (isWritingParagraph) {
                    const paragraph =
                      typeof currentResponse?.paragraph === 'string'
                        ? currentResponse.paragraph
                        : '';
                    if (!paragraph.trim()) {
                      toast.error('Build your paragraph before requesting feedback.');
                      return;
                    }
                    setIsSubmittingMode(true);
                    try {
                      await handleWritingParagraphSubmit(currentComp, paragraph);
                    } catch {
                      // The writing workflow displays its own learner-safe error.
                    } finally {
                      setIsSubmittingMode(false);
                    }
                    return;
                  }
                  const isInput = ['mcq', 'dropdown', 'open_input', 'true_false', 'fill_in_the_blank', 'match_column', 'writing_table', 'reflection'].includes(currentComp.componentType);
                  
                  if (isInput) {
                    if (!currentResponse || (typeof currentResponse === 'object' && Object.keys(currentResponse).length === 0)) {
                      toast.error('Please answer the question before submitting.');
                      return;
                    }
                    if (
                      currentComp.componentType === 'match_column' &&
                      (!Array.isArray(currentResponse.matches) || currentResponse.matches.length !== currentComp.matchingLeftItems.length)
                    ) {
                      toast.error('Match every term before submitting.');
                      return;
                    }
                  } else {
                    currentResponse = currentResponse || {};
                  }
                  setIsSubmittingMode(true);
                  try {
                    if (currentComp.componentType === 'reflection') {
                      await handleReflectionSubmit(currentComp.id, currentResponse);
                    } else {
                      await handleComponentSubmit(currentComp.id, currentResponse);
                    }
                  } catch {
                    // Handled in submit helpers
                  } finally {
                    setIsSubmittingMode(false);
                  }
                  return;
                }

                if (currentIndex < totalCount - 1) {
                  setCurrentIndex((curr) => curr + 1);
                } else {
                  handleCompleteMode();
                }
              }}
              disabled={isSubmittingMode || needsFreshRetryResponse || (!canAdvanceMode && currentIndex === totalCount - 1 && canAdvanceFromCurrent)}
              className={`
                w-full sm:w-auto bg-[#4F8DFB] hover:bg-[#3B82F6] active:scale-[0.98] text-white px-7 py-3 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer
                ${isSubmittingMode ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSubmittingMode ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>
                {!canAdvanceFromCurrent
                  ? isSubmittingMode
                    ? 'Submitting...'
                    : needsFreshRetryResponse
                    ? currentComp?.componentType === 'match_column'
                      ? 'Build New Matches'
                      : 'Choose Another Answer'
                    : canRevealCurrentWritingModelAnswer
                    ? 'View System Model Answer'
                    : currentComp?.componentType === 'match_column'
                    ? 'Submit Matches'
                    : (currentComp && !['mcq', 'dropdown', 'open_input', 'true_false', 'fill_in_the_blank', 'writing_table', 'reflection'].includes(currentComp.componentType) ? 'Continue' : 'Check Answer')
                  : currentIndex < totalCount - 1
                  ? 'Next'
                  : isSubmittingMode
                  ? 'Completing...'
                  : 'Finish Mode →'}
              </span>
            </button>
          </div>
        </div>
      )}

      <TopicCompletionModal 
        isOpen={showCompletionModal}
        isJustCompleted={isJustCompleted}
        onFinish={() => {
          setShowCompletionModal(false);
          handleCompleteNavigation();
        }}
        onRetake={() => {
          setShowCompletionModal(false);
          setIsJustCompleted(false);
          handleResetMode();
        }}
      />
    </div>
  );
}

function ComponentAttemptFeedback({
  component,
  answers,
  onReveal,
}: {
  component: LearningComponent;
  answers: Array<{ id: string; value: string }>;
  onReveal: () => void;
}) {
  const attempt = component.attempt;
  const feedback = attempt?.feedback;
  const fieldResults = Array.isArray(feedback?.fieldResults) ? feedback.fieldResults : [];
  const canReveal = attempt?.status === 'exhausted' && feedback?.canRevealAnswer === true;
  const message = typeof feedback?.message === 'string'
    ? feedback.message
    : typeof feedback?.scoreMessage === 'string'
      ? feedback.scoreMessage
      : null;
  const hint = typeof feedback?.hint === 'string' ? feedback.hint : null;

  if (!attempt || (!feedback && !answers.length)) return null;

  const successful = component.isComplete || Boolean(attempt.completedAt);
  return (
    <section className={`rounded-[14px] border p-4 text-sm ${successful ? 'border-emerald-200 bg-emerald-50' : attempt.status === 'exhausted' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-start gap-2">
        {successful ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
        <div className="min-w-0">
          <p className="font-bold text-[#0F172A]">{component.title || 'Activity feedback'}</p>
          <p className="mt-1 text-[#475569]">Attempt {attempt.attemptNumber}{component.maxAttempts ? ` of ${component.maxAttempts}` : ''} · {attempt.status.replace('_', ' ')}</p>
          {message && <p className="mt-2 text-[#166534]">{message}</p>}
          {hint && <p className="mt-2 text-[#92400E]">Hint: {hint}</p>}
          {fieldResults.length > 0 && <ul className="mt-3 space-y-1">{fieldResults.map((result) => {
            const field = result as Record<string, unknown>;
            const textSuffix = typeof field.feedback === 'string' && field.feedback 
              ? field.feedback 
              : typeof field.hint === 'string' && field.hint 
                ? field.hint 
                : '';
            return <li key={String(field.id)} className="text-xs text-[#475569]">{field.isCorrect === true ? 'Correct' : 'Review'}{textSuffix ? `: ${textSuffix}` : ''}</li>;
          })}</ul>}
          {canReveal && !answers.length && <button type="button" onClick={onReveal} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#92400E] px-3 py-2 text-xs font-bold text-white"><Eye className="h-4 w-4" />Show Answer</button>}
          {answers.length > 0 && <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3"><p className="font-bold text-amber-900">Approved answers</p>{answers.map((answer) => <p key={answer.id} className="mt-1 text-[#475569]">{answer.value}</p>)}</div>}
        </div>
      </div>
    </section>
  );
}
