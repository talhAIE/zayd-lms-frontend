import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { nafsErrorMessage, nafsService } from '@/services/nafsService';
import type {
  NafsAssessmentView,
  NafsAttemptView,
  NafsInProgressAttemptView,
  NafsPassageView,
  NafsResultView,
} from '@/types/nafs.contract';
import { useNafsSession } from '@/components/nafs/useNafsSession';
import { NafsMedia } from '@/components/nafs/NafsMedia';
import {
  AttemptSession,
  type AttemptState,
} from '@/components/nafs/attemptSession';

const panel =
  "w-full max-w-[1087px] mx-auto bg-white rounded-3xl p-4 md:p-8 font-['Outfit',sans-serif] text-[#282828]";
const primary =
  'bg-[#232E43] hover:bg-[#1a2333] text-white rounded-lg min-h-11';
function BackToCourses() {
  return (
    <Link
      to="/student/courses"
      className="inline-flex items-center gap-2 text-sm text-slate-600 underline min-h-11"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to courses
    </Link>
  );
}
function Failure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section className={panel}>
      <BackToCourses />
      <p role="alert" className="my-6">
        {message}
      </p>
      <Button onClick={retry} className={primary}>
        Try loading again
      </Button>
    </section>
  );
}
function Loading() {
  return (
    <section className={panel}>
      <p role="status">Loading NAFS quiz…</p>
    </section>
  );
}

export function NafsOverviewPage() {
  const { assessmentId = '' } = useParams();
  return <Overview key={assessmentId} assessmentId={assessmentId} />;
}
function Overview({ assessmentId }: { assessmentId: string }) {
  const owner = useNafsSession();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<NafsAssessmentView>();
  const [title, setTitle] = useState('NAFS quiz');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [starting, setStarting] = useState(false);
  const lifetime = useRef<AbortController>();
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    setError('');
    setAssessment(undefined);
    setStarting(false);
    void Promise.all([
      nafsService.assessment(owner, controller.signal, assessmentId),
      nafsService.courses(owner, controller.signal),
    ])
      .then(([data, list]) => {
        if (controller.signal.aborted) return;
        setAssessment(data.assessment);
        setTitle(
          list.courses.find((c) => c.assessmentId === assessmentId)
            ?.courseTitle || 'NAFS quiz',
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(nafsErrorMessage(e));
      });
    return () => controller.abort();
  }, [owner, assessmentId, retry]);
  async function open() {
    const controller = lifetime.current;
    if (!assessment || !controller || starting) return;
    if (assessment.attemptId) {
      navigate(`/student/nafs/attempts/${assessment.attemptId}`);
      return;
    }
    setStarting(true);
    setError('');
    try {
      const { attempt } = await nafsService.start(
        owner,
        controller.signal,
        assessmentId,
      );
      if (!controller.signal.aborted)
        navigate(
          `/student/nafs/attempts/${attempt.state === 'submitted' ? attempt.attemptId : attempt.id}`,
        );
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(nafsErrorMessage(e));
        setStarting(false);
      }
    }
  }
  if (!assessment)
    return error ? (
      <Failure message={error} retry={() => setRetry((n) => n + 1)} />
    ) : (
      <Loading />
    );
  return (
    <section className={panel}>
      <BackToCourses />
      <div className="rounded-2xl bg-[#EFF5FF] p-6 md:p-8 my-5">
        <ClipboardList
          className="w-10 h-10 text-[#4F8DFB] mb-4"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-blue-700">NAFS</p>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">{title}</h1>
        <p className="mt-2 text-slate-600">
          {assessment.title} · {assessment.questionCount} questions
        </p>
      </div>
      <h2 className="text-lg font-semibold mb-3">Before you begin</h2>
      <ul className="list-disc pl-5 space-y-2 text-slate-600">
        {assessment.instructions.map((instruction, i) => (
          <li key={i}>{instruction}</li>
        ))}
        <li>
          You have one attempt. You can leave and resume your saved quiz before
          finishing.
        </li>
        <li>
          Answer every question. You may change your selections before
          finishing.
        </li>
        <li>There is no time limit. Marks appear only after you finish.</li>
        <li>
          Finishing is final. You cannot change answers or retry afterward.
        </li>
      </ul>
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      <Button
        className={`${primary} mt-6 px-8`}
        disabled={starting}
        onClick={() => void open()}
      >
        {starting
          ? 'Opening quiz…'
          : assessment.state === 'submitted'
            ? 'View marks'
            : assessment.state === 'in_progress'
              ? 'Resume quiz'
              : 'Start quiz'}
      </Button>
    </section>
  );
}

export function NafsAttemptPage() {
  const { attemptId = '' } = useParams();
  return <Attempt key={attemptId} attemptId={attemptId} />;
}
function Attempt({ attemptId }: { attemptId: string }) {
  const owner = useNafsSession();
  const [attempt, setAttempt] = useState<NafsAttemptView>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setAttempt(undefined);
    void nafsService
      .attempt(owner, controller.signal, attemptId)
      .then((data) => {
        if (!controller.signal.aborted) setAttempt(data.attempt);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(nafsErrorMessage(e));
      });
    return () => controller.abort();
  }, [owner, attemptId, retry]);
  if (!attempt)
    return error ? (
      <Failure message={error} retry={() => setRetry((n) => n + 1)} />
    ) : (
      <Loading />
    );
  if (attempt.state === 'submitted') return <Result result={attempt} />;
  return <Quiz initial={attempt} />;
}
function Result({ result }: { result: NafsResultView }) {
  return (
    <section className={`${panel} text-center py-12 md:py-16`}>
      <CheckCircle2
        className="h-14 w-14 text-[#4F8DFB] mx-auto mb-5"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-blue-700">NAFS · Completed</p>
      <h1 className="text-3xl font-bold mt-3">Quiz finished</h1>
      <p className="text-slate-600 mt-3">Your final marks</p>
      <p
        className="text-5xl font-bold my-5"
        aria-label={`${result.earnedMarks} out of ${result.totalMarks} marks`}
      >
        {result.earnedMarks}
        <span className="text-slate-400"> / {result.totalMarks}</span>
      </p>
      <p className="text-sm text-slate-500 mb-6">
        Completed {new Date(result.completedAt).toLocaleString()}
      </p>
      <BackToCourses />
    </section>
  );
}
function Passage({
  passage,
  attemptId,
}: {
  passage: NafsPassageView;
  attemptId: string;
}) {
  return (
    <div className="space-y-4">
      <NafsMedia asset={passage.sourceFacsimile} attemptId={attemptId} />
      <details className="text-sm">
        <summary className="cursor-pointer min-h-10">
          Read passage as text
        </summary>
        <div className="space-y-4 leading-7 mt-3">
          {passage.paragraphs.map((text, i) => (
            <p key={i}>{emphasize(text, passage.emphasisTerms)}</p>
          ))}
        </div>
      </details>
    </div>
  );
}
function emphasize(text: string, terms: string[]) {
  const clean = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!clean.length) return text;
  const escaped = clean.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text
    .split(pattern)
    .map((part, i) =>
      clean.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
        <strong key={i}>{part}</strong>
      ) : (
        part
      ),
    );
}

function Quiz({ initial }: { initial: NafsInProgressAttemptView }) {
  const owner = useNafsSession();
  const [view, setView] = useState<AttemptState>({
    attempt: initial,
    selections: Object.fromEntries(
      initial.selections.map((s) => [s.questionId, s.optionId]),
    ),
    status: 'saved',
    message: '',
  });
  const [index, setIndex] = useState(0);
  const [review, setReview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [passageOpen, setPassageOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('NAFS quiz');
  const session = useRef<AttemptSession>();
  const heading = useRef<HTMLHeadingElement>(null);
  const draftKey = `nafs:draft:${owner.id}:${encodeURIComponent(owner.username)}:${initial.id}`;
  useEffect(() => {
    const controller = new AbortController();
    const engine = new AttemptSession(
      initial,
      {
        read: () => nafsService.attempt(owner, controller.signal, initial.id),
        save: (questionId, request) =>
          nafsService.save(
            owner,
            controller.signal,
            initial.id,
            questionId,
            request,
          ),
        submit: (request) =>
          nafsService.submit(owner, controller.signal, initial.id, request),
      },
      (state) => {
        if (!controller.signal.aborted) setView(state);
      },
      (draft) => {
        try {
          if (Object.keys(draft).length)
            sessionStorage.setItem(draftKey, JSON.stringify(draft));
          else sessionStorage.removeItem(draftKey);
        } catch {
          /* Saving on server still works when browser storage is unavailable. */
        }
      },
    );
    session.current = engine;
    void nafsService
      .courses(owner, controller.signal)
      .then(({ courses }) => {
        if (!controller.signal.aborted)
          setCourseTitle(
            courses.find((c) => c.assessmentId === initial.assessmentId)
              ?.courseTitle || 'NAFS quiz',
          );
      })
      .catch(() => {
        /* The authorized attempt remains usable if optional course metadata fails. */
      });
    try {
      const recovered: unknown = JSON.parse(
        sessionStorage.getItem(draftKey) || '{}',
      );
      if (
        recovered &&
        typeof recovered === 'object' &&
        !Array.isArray(recovered)
      )
        engine.recoverDraft(recovered as Record<string, string>);
    } catch {
      /* Ignore invalid local recovery data. */
    }
    return () => {
      engine.dispose();
      controller.abort();
      session.current = undefined;
    };
  }, [initial, owner, draftKey]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (view.attempt.state === 'in_progress' && view.status !== 'saved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [view.status, view.attempt.state]);
  // Refresh/back navigation can only reload the server's permanently locked summary.
  if (view.attempt.state === 'submitted')
    return <Result result={view.attempt} />;
  const attempt = view.attempt;
  const question = attempt.questions[index];
  const passage = attempt.passages.find((p) => p.id === question.passageId);
  const answered = attempt.questions.filter(
    (q) => view.selections[q.id],
  ).length;
  const locked = ['submitting', 'uncertain', 'conflict'].includes(view.status);
  const canFinish =
    answered === attempt.questions.length && view.status === 'saved';
  function go(next: number) {
    setIndex(next);
    setReview(false);
    setPassageOpen(false);
    window.setTimeout(() => heading.current?.focus(), 0);
  }
  const navigator = (label: string) => (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {attempt.questions.map((q, i) => (
        <button
          key={q.id}
          type="button"
          aria-label={`Question ${i + 1}, ${view.selections[q.id] ? 'answered' : 'unanswered'}`}
          aria-current={i === index && !review ? 'step' : undefined}
          onClick={() => go(i)}
          className={`min-h-11 min-w-11 px-2 rounded-lg border text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${i === index && !review ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'} ${view.selections[q.id] ? 'bg-blue-50 text-blue-800' : 'bg-white text-slate-600'}`}
        >
          {i + 1}
          <span className="sr-only">
            {view.selections[q.id] ? ' answered' : ' unanswered'}
          </span>
        </button>
      ))}
    </nav>
  );
  return (
    <section className={panel}>
      <BackToCourses />
      <div className="flex flex-wrap gap-3 justify-between items-start my-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">{courseTitle}</p>
          <h1 className="text-xl md:text-2xl font-bold mt-1">
            {review
              ? 'Review before finishing'
              : `Question ${index + 1} of ${attempt.questions.length}`}
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          {answered} of {attempt.questions.length} answered
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 mb-5" aria-hidden="true">
        <div
          className="h-full rounded-full bg-[#4F8DFB]"
          style={{ width: `${(answered / attempt.questions.length) * 100}%` }}
        />
      </div>
      <div
        role="status"
        aria-label="Answer saving status"
        aria-live="polite"
        className="mb-5 rounded-xl bg-slate-50 p-3 text-sm flex flex-wrap items-center gap-3"
      >
        <span>
          {view.message ||
            {
              saved: 'All answers saved',
              saving: 'Saving answers…',
              submitting: 'Finishing quiz…',
              error: 'Answers not saved',
              conflict: 'Saved answers changed',
              uncertain: 'Checking submission',
            }[view.status]}
        </span>
        {view.status === 'error' && (
          <Button
            variant="outline"
            onClick={() => void session.current?.retry()}
          >
            Retry saving
          </Button>
        )}
        {view.status === 'conflict' && (
          <>
            <Button
              variant="outline"
              onClick={() => void session.current?.resolveConflict(false)}
            >
              Use saved answers
            </Button>
            <Button
              className={primary}
              onClick={() => void session.current?.resolveConflict(true)}
            >
              Keep my answers
            </Button>
          </>
        )}
        {view.status === 'uncertain' && (
          <Button
            className={primary}
            onClick={() => void session.current?.checkSubmission()}
          >
            Check submission
          </Button>
        )}
      </div>
      {review ? (
        <div className="space-y-6">
          <p className="text-slate-600">
            Choose a question number to review your selection. Answer every
            question before finishing.
          </p>
          {navigator('Review question answers')}
          {answered < attempt.questions.length && (
            <p role="status" className="text-sm text-slate-600">
              Unanswered:{' '}
              {attempt.questions
                .map((q, i) => (!view.selections[q.id] ? i + 1 : null))
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setReview(false)}>
              Back to questions
            </Button>
            <Button
              className={primary}
              disabled={!canFinish}
              onClick={() => setConfirm(true)}
            >
              Finish quiz
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${passage ? 'lg:grid-cols-2' : ''}`}>
            {passage && (
              <aside className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:self-start lg:sticky lg:top-24 lg:max-h-[75dvh] lg:overflow-y-auto">
                <h2 className="font-semibold mb-2">Reading passage</h2>
                <button
                  type="button"
                  aria-expanded={passageOpen}
                  aria-controls="nafs-reading-passage"
                  onClick={() => setPassageOpen(!passageOpen)}
                  className="lg:hidden underline text-blue-700 min-h-11"
                >
                  {passageOpen ? 'Hide passage' : 'Read passage'}
                </button>
                <div
                  id="nafs-reading-passage"
                  className={passageOpen ? 'block' : 'hidden lg:block'}
                >
                  <Passage passage={passage} attemptId={attempt.id} />
                </div>
              </aside>
            )}
            <div className="min-w-0">
              <h2
                ref={heading}
                tabIndex={-1}
                className="text-lg md:text-xl font-semibold leading-relaxed mb-4 outline-none"
              >
                {question.stem}
              </h2>
              {question.sourceFacsimile && (
                <NafsMedia
                  key={question.sourceFacsimile.id}
                  asset={question.sourceFacsimile}
                  attemptId={attempt.id}
                />
              )}
              {question.accessibleVisualText && (
                <details className="my-3 text-sm text-slate-600">
                  <summary className="cursor-pointer min-h-10">
                    Read diagram description
                  </summary>
                  <p className="whitespace-pre-wrap leading-6">
                    {question.accessibleVisualText}
                  </p>
                </details>
              )}
              <fieldset disabled={locked} className="mt-5 space-y-3">
                <legend className="font-semibold mb-3">
                  Choose one answer
                </legend>
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex gap-3 items-start rounded-xl border p-4 ${view.selections[question.id] === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} ${locked ? 'opacity-70' : ''}`}
                  >
                    <input
                      className="h-5 w-5 mt-1 accent-blue-600 shrink-0"
                      type="radio"
                      name={question.id}
                      id={`${question.id}-${option.id}`}
                      value={option.id}
                      checked={view.selections[question.id] === option.id}
                      onChange={() =>
                        session.current?.select(question.id, option.id)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`${question.id}-${option.id}`}
                        className="cursor-pointer block min-h-11 whitespace-pre-wrap"
                      >
                        <span className="font-semibold mr-2">
                          {option.label}.
                        </span>
                        {option.text}
                      </label>
                      {option.image && (
                        <NafsMedia
                          key={option.image.id}
                          asset={option.image}
                          attemptId={attempt.id}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </fieldset>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-3 my-6">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              Previous
            </Button>
            {index < attempt.questions.length - 1 ? (
              <Button className={primary} onClick={() => go(index + 1)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            ) : (
              <Button className={primary} onClick={() => setReview(true)}>
                Review answers
              </Button>
            )}
          </div>
          <div className="border-t pt-5">
            <h2 className="font-semibold mb-3">Questions</h2>
            {navigator('Question navigator')}
            <p className="text-xs text-slate-500 mt-3">
              Blue fill means answered.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setReview(true)}
            >
              Review answers
            </Button>
          </div>
        </>
      )}
      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (view.status !== 'submitting') setConfirm(open);
        }}
      >
        <DialogContent className="rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogTitle>Finish this quiz?</DialogTitle>
          <DialogDescription>
            All {attempt.questions.length} questions are answered. Your answers
            will be locked and your final marks shown. You cannot retry this
            quiz.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep reviewing
            </Button>
            <Button
              className={primary}
              disabled={!canFinish}
              onClick={() => {
                setConfirm(false);
                void session.current?.finish();
              }}
            >
              Confirm finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
