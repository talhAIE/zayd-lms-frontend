import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CheckCircle2, Save, Send, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchLessonModes,
  fetchUnitLessons,
  LearningComponent,
  QuizAnswer,
  QuizAttempt,
  QuizAttemptItem,
  saveQuizAnswer,
  startQuiz,
  startUnitProject,
  submitQuiz,
  saveUnitProjectDraft,
  reviewUnitProjectDraft,
  submitUnitProject,
  UnitProjectResponse,
  WritingReviewResponse,
  JsonObject,
} from '@/services/learningService';
import { useAppDispatch } from '@/redux/hooks';
import { getLessonModes } from '@/redux/slices/learningSlice';
import { useLearningProgressRefresh } from '@/hooks/useLearningProgressRefresh';
import { getLearningModePath, getNextLessonPath } from '@/utils/learning-navigation';
import {
  DropdownComponent,
  FillInTheBlankComponent,
  MatchComponent,
  MCQComponent,
  SemanticReviewComponent,
  TrueFalseComponent,
  UnavailableComponent,
} from '@/components/learning/modes';

type DirectModeKind = 'quiz' | 'project';

const asRecord = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};

const displayText = (value: unknown): string => typeof value === 'string' ? value : '';

function toQuizComponent(item: QuizAttemptItem, attempt: QuizAttempt): LearningComponent {
  const itemComplete = item.status === 'completed';
  return {
    id: item.componentId,
    lessonModeId: attempt.lessonModeId,
    componentType: item.componentType,
    title: item.title,
    description: item.description,
    orderIndex: item.orderIndex,
    isRequired: item.isRequired,
    contentVersion: item.contentVersion,
    content: item.content,
    accessibility: item.accessibility,
    points: 0,
    maxAttempts: null,
    feedbackPolicy: 'after_submit',
    completionRule: 'on_submit',
    options: item.options,
    matchingLeftItems: item.matchingLeftItems,
    matchingRightItems: item.matchingRightItems,
    resources: [],
    attempt: {
      id: item.id,
      attemptNumber: attempt.attemptNumber,
      status: itemComplete ? 'completed' : 'in_progress',
      response: item.response,
      isCorrect: item.isCorrect,
      score: item.score,
      feedback: item.feedback,
      startedAt: attempt.startedAt,
      lastSavedAt: item.savedAt,
      submittedAt: item.submittedAt,
      completedAt: itemComplete ? attempt.completedAt : null,
    },
    canStart: attempt.status === 'in_progress',
    canSubmit: attempt.status === 'in_progress',
    isComplete: itemComplete,
  };
}

export default function DirectActivityPlay() {
  const { courseId, unitId, lessonId, modeId } = useParams<{
    courseId: string;
    unitId: string;
    lessonId: string;
    modeId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const refreshLearningProgress = useLearningProgressRefresh();
  const [modeKind, setModeKind] = useState<DirectModeKind | null>(null);
  const [title, setTitle] = useState('Activity');
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [project, setProject] = useState<UnitProjectResponse | null>(null);
  const [projectText, setProjectText] = useState('');
  const [review, setReview] = useState<WritingReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAllProgress = async () => {
    if (!lessonId) return [];
    const updatedModes = await dispatch(getLessonModes(lessonId)).unwrap();
    await refreshLearningProgress(lessonId, { unitId, courseId });
    return updatedModes;
  };

  useEffect(() => {
    let active = true;
    async function load() {
      if (!lessonId || !modeId) return;
      setLoading(true);
      setError(null);
      try {
        const modes = await fetchLessonModes(lessonId);
        const mode = modes.find((item) => item.id === modeId);
        if (!mode || (mode.modeSource !== 'quiz' && mode.modeSource !== 'writing')) {
          throw new Error('This activity is not available as a direct activity.');
        }
        if (!active) return;
        setTitle(mode.title || 'Activity');
        if (mode.modeSource === 'quiz') {
          setModeKind('quiz');
          const attempt = await startQuiz(modeId);
          if (active) setQuiz(attempt);
        } else {
          const lessons = unitId ? await fetchUnitLessons(unitId) : [];
          const lesson = lessons.find((item) => item.id === lessonId);
          if (lesson?.lessonType === 'unit_project') {
            const result = await startUnitProject(lessonId);
            if (!active) return;
            setModeKind('project');
            setProject(result);
            const latestDraft = result.drafts[0];
            setProjectText(displayText(asRecord(asRecord(latestDraft).response).text));
          } else throw new Error('Direct Writing is only available for published Unit Project lessons.');
        }
        await refreshAllProgress();
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load this activity.';
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
    // The route identifiers define the activity. Progress refresh is intentionally
    // invoked after the direct endpoint starts/resumes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, modeId, unitId]);

  const quizResponses = useMemo(() => Object.fromEntries(
    (quiz?.items || []).filter((item) => item.response).map((item) => [item.componentId, item.response as JsonObject]),
  ) as Record<string, JsonObject>, [quiz]);

  const saveQuizResponse = async (componentId: string, response: JsonObject) => {
    if (!quiz || quiz.status !== 'in_progress') return;
    try {
      const updated = await saveQuizAnswer(quiz.id, componentId, response);
      setQuiz(updated);
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save this answer.';
      toast.error(message);
    }
  };

  const finishQuiz = async () => {
    if (!quiz) return;
    const requiredUnanswered = quiz.items.some((item) => item.isRequired && !quizResponses[item.componentId]);
    if (requiredUnanswered) {
      toast.error('Answer every required assessment item before submitting.');
      return;
    }
    setWorking(true);
    try {
      const answers: QuizAnswer[] = quiz.items
        .filter((item) => quizResponses[item.componentId])
        .map((item) => ({ componentId: item.componentId, response: quizResponses[item.componentId] }));
      const updated = await submitQuiz(quiz.id, answers);
      setQuiz(updated);
      await refreshAllProgress();
      toast.success(updated.passed === false ? 'Assessment submitted. Review your feedback.' : 'Assessment completed.');
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to submit the assessment.';
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

  const saveProjectDraft = async () => {
    if (!lessonId || !projectText.trim()) return;
    setWorking(true);
    try {
      const updated = await saveUnitProjectDraft(lessonId, { text: projectText });
      setProject(updated);
      toast.success('Project draft saved.');
    } catch (draftError: unknown) {
      toast.error(draftError instanceof Error ? draftError.message : 'Unable to save this draft.');
    } finally {
      setWorking(false);
    }
  };

  const requestProjectReview = async () => {
    if (!lessonId) return;
    setWorking(true);
    try {
      const result = await reviewUnitProjectDraft(lessonId);
      setProject(result.project);
      setReview(result.review);
      toast.success('Project feedback is ready.');
    } catch (reviewError: unknown) {
      toast.error(reviewError instanceof Error ? reviewError.message : 'Save a draft before requesting feedback.');
    } finally {
      setWorking(false);
    }
  };

  const submitProject = async () => {
    if (!lessonId || !projectText.trim()) return;
    setWorking(true);
    try {
      const result = await submitUnitProject(lessonId, { text: projectText });
      setProject(result.project);
      setReview(result.finalSubmission);
      await refreshAllProgress();
      toast.success(result.project.isComplete ? 'Unit Project completed.' : 'Project submitted for review.');
    } catch (submitError: unknown) {
      toast.error(submitError instanceof Error ? submitError.message : 'Unable to submit the project.');
    } finally {
      setWorking(false);
    }
  };

  const handleBack = () => {
    if (courseId && unitId) {
      navigate(`/student/courses/${courseId}/units/${unitId}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const continueFromCompletedMode = async () => {
    if (!lessonId || !modeId) return;
    if (!courseId || !unitId) {
      handleBack();
      return;
    }
    try {
      const modes = await refreshAllProgress();
      const nextMode = modes.find((mode) => !mode.isLocked && mode.status !== 'completed' && mode.id !== modeId);
      if (nextMode && courseId && unitId) {
        navigate(getLearningModePath({ courseId, unitId, lessonId }, nextMode), { replace: true });
        return;
      }
      const lessons = await fetchUnitLessons(unitId);
      navigate(getNextLessonPath({ courseId, unitId, lessonId }, lessons), { replace: true });
    } catch {
      navigate(`/student/courses/${courseId}/units/${unitId}`, { replace: true });
    }
  };

  const activityComplete = modeKind === 'quiz'
    ? quiz?.status === 'passed' || Boolean(quiz?.completedAt)
    : project?.isComplete === true;

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 pb-16 font-['Outfit',sans-serif]">
      <header className="flex flex-col justify-between gap-4 rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3"><button type="button" onClick={handleBack} title="Back to Lessons" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50 transition-all cursor-pointer"><ChevronLeft className="h-5 w-5" /></button><div><h1 className="text-xl font-extrabold text-[#0F172A]">{title}</h1><p className="mt-1 text-sm font-medium text-[#64748B]">{modeKind === 'quiz' ? 'Unit Assessment' : 'Unit Project'}</p></div></div>
        {activityComplete && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Completed</span>}
      </header>

      {loading && <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-12 text-center text-sm font-medium text-[#64748B]">Loading this activity…</section>}
      {error && !loading && <section className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">{error}</section>}
      {!loading && !error && modeKind === 'quiz' && quiz && <QuizActivity attempt={quiz} onSave={saveQuizResponse} />}
      {!loading && !error && modeKind === 'project' && project && <ProjectActivity project={project} text={projectText} review={review} onTextChange={setProjectText} onSaveDraft={saveProjectDraft} onRequestReview={requestProjectReview} onSubmit={submitProject} working={working} />}

      {!loading && !error && <footer className="flex justify-end rounded-[18px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
        {activityComplete ? <button type="button" onClick={continueFromCompletedMode} className="rounded-full bg-[#4F8DFB] px-6 py-3 text-sm font-bold text-white">Next Activity →</button> : modeKind === 'quiz' ? <button type="button" disabled={working} onClick={finishQuiz} className="rounded-full bg-[#4F8DFB] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{working ? 'Submitting…' : 'Submit Assessment'}</button> : null}
      </footer>}
    </div>
  );
}

function QuizActivity({ attempt, onSave }: { attempt: QuizAttempt; onSave: (componentId: string, response: JsonObject) => Promise<void> }) {
  const locked = attempt.status !== 'in_progress';
  return <div className="flex flex-col gap-6">{[...attempt.items].sort((left, right) => left.orderIndex - right.orderIndex).map((item) => {
    const component = toQuizComponent(item, attempt);
    const saveOption = (optionId: string) => onSave(item.componentId, { optionId });
    switch (item.componentType) {
      case 'mcq': return <MCQComponent key={item.id} component={component} onAnswerChange={saveOption} onSubmit={saveOption} isSubmitted={locked} disabled={locked} />;
      case 'true_false': return <TrueFalseComponent key={item.id} component={component} onAnswerChange={saveOption} onSubmit={saveOption} isSubmitted={locked} disabled={locked} />;
      case 'dropdown': return <DropdownComponent key={item.id} component={component} onAnswerChange={(answers) => onSave(item.componentId, { optionId: Object.values(answers)[0] || '' })} onSubmit={(answers) => onSave(item.componentId, { optionId: Object.values(answers)[0] || '' })} isSubmitted={locked} disabled={locked} />;
      case 'fill_in_the_blank': return <FillInTheBlankComponent key={item.id} component={component} onAnswerChange={(response) => onSave(item.componentId, response)} onSubmit={(response) => onSave(item.componentId, response)} isSubmitted={locked} />;
      case 'match_column': return <MatchComponent key={item.id} component={component} onAnswerChange={(pairs) => onSave(item.componentId, { matches: Object.entries(pairs).map(([leftValue, rightValue]) => ({ leftValue, rightValue })) })} onSubmit={(pairs) => onSave(item.componentId, { matches: Object.entries(pairs).map(([leftValue, rightValue]) => ({ leftValue, rightValue })) })} isSubmitted={locked} disabled={locked} />;
      case 'open_input': return <SemanticReviewComponent key={item.id} component={component} onAnswerChange={(text) => onSave(item.componentId, { text })} onSubmit={(text) => onSave(item.componentId, { text })} isSubmitted={locked} disabled={locked} />;
      default: return <UnavailableComponent key={item.id} component={component} />;
    }
  })}</div>;
}

function ProjectActivity({ project, text, review, onTextChange, onSaveDraft, onRequestReview, onSubmit, working }: { project: UnitProjectResponse; text: string; review: WritingReviewResponse | null; onTextChange: (value: string) => void; onSaveDraft: () => void; onRequestReview: () => void; onSubmit: () => void; working: boolean }) {
  const content = asRecord(project.writing);
  const prompt = displayText(asRecord(content.content).prompt) || displayText(content.description);
  const minimumCharacters = asRecord(content.content).minimumCharacters;
  const canSubmit = text.trim().length > 0 && project.canSubmitFinal && !project.isComplete;
  return <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-sm md:p-8"><h2 className="text-xl font-extrabold text-[#0F172A]">{displayText(content.title) || 'Your Unit Project'}</h2>{prompt && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">{prompt}</p>}{typeof minimumCharacters === 'number' && <p className="mt-3 text-xs font-semibold text-[#64748B]">Minimum length: {minimumCharacters} characters</p>}<textarea value={text} disabled={project.isComplete} onChange={(event) => onTextChange(event.target.value)} className="mt-5 min-h-64 w-full rounded-xl border border-[#CBD5E1] p-4 text-sm leading-relaxed outline-none focus:border-[#4F8DFB] disabled:bg-slate-50" placeholder="Write your project response here…" />{review && <ReviewSummary review={review} />}<div className="mt-5 flex flex-wrap gap-3">{!project.isComplete && <button type="button" disabled={working || !text.trim()} onClick={onSaveDraft} className="inline-flex items-center gap-2 rounded-lg border border-[#4F8DFB] px-4 py-2.5 text-sm font-bold text-[#2563EB] disabled:opacity-60"><Save className="h-4 w-4" />Save Draft</button>}{!project.isComplete && <button type="button" disabled={working || !project.canRequestReview} onClick={onRequestReview} className="inline-flex items-center gap-2 rounded-lg border border-[#A78BFA] px-4 py-2.5 text-sm font-bold text-[#6D28D9] disabled:opacity-60"><Sparkles className="h-4 w-4" />Get Feedback</button>}{!project.isComplete && <button type="button" disabled={working || !canSubmit} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-lg bg-[#4F8DFB] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Send className="h-4 w-4" />Submit Final</button>}</div>{!project.canSubmitFinal && <p className="mt-3 text-sm text-amber-700">Complete the required draft review before submitting your final project.</p>}</section>;
}

function ReviewSummary({ review }: { review: WritingReviewResponse }) {
  const feedback = asRecord(review.review?.feedback);
  return <section className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4"><h3 className="font-bold text-violet-950">Writing feedback</h3>{displayText(feedback.message) && <p className="mt-2 text-sm text-violet-900">{displayText(feedback.message)}</p>}{review.review?.rubricMetrics.map((metric) => <div key={metric.key} className="mt-2 text-sm text-violet-900"><strong>{metric.label}{metric.score !== null ? `: ${metric.score}` : ''}</strong>{metric.feedback && <span> — {metric.feedback}</span>}</div>)}</section>;
}
