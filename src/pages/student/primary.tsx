import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { StudentLayout } from '@/components/layouts/student-layout';
import { usePrimaryAccount } from '@/components/primary/PrimaryCourseCard';
import { PrimaryActivity, PrimaryPicture, primaryStepIndex, primarySteps, type PrimarySubmission } from '@/components/primary/PrimaryActivity';
import type { PrimaryApi, PrimaryAttempt, PrimarySnapshot } from '@/services/primaryService';

function errorStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function PrimaryPage() {
  const { lessonId } = useParams();
  const account = usePrimaryAccount();
  if (!account) return <Navigate to="/student/courses" replace />;
  return (
    <StudentLayout>
      <PrimaryLesson key={`${account.key}:${lessonId ?? ''}`} api={account.api} lessonId={lessonId} />
    </StudentLayout>
  );
}

function PrimaryLesson({ api, lessonId }: { api: PrimaryApi; lessonId?: string }) {
  const lifetime = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const pending = useRef<PrimaryAttempt | null>(null);
  const [snapshot, setSnapshot] = useState<PrimarySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [issue, setIssue] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [activityVersion, setActivityVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    async function open() {
      try {
        const assignment = await api.availability(controller.signal);
        if (!assignment.available || (lessonId && assignment.lesson.id !== lessonId)) {
          setUnavailable(true);
          return;
        }
        setSnapshot(await api.open(controller.signal, assignment.lesson.id));
      } catch (error) {
        if (controller.signal.aborted || axios.isCancel(error)) return;
        if ([401, 403, 404].includes(errorStatus(error) ?? 0)) setUnavailable(true);
        else setIssue('The lesson could not load. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void open();
    return () => controller.abort();
  }, [api, lessonId, loadCount]);

  async function update(attempt?: PrimaryAttempt, replay = false) {
    const signal = lifetime.current?.signal;
    if (!snapshot || !signal || signal.aborted || busy.current) return;
    busy.current = true;
    pending.current = attempt ?? null;
    setWorking(true);
    setIssue('');
    try {
      let receiptRevision: number | undefined;
      if (attempt) {
        const result = await api.act(signal, snapshot.sessionId, attempt);
        pending.current = null;
        if (!replay) {
          setSnapshot(result);
          return;
        }
        // A retried receipt can predate changes from another tab.
        receiptRevision = result.revision;
      }
      setRefreshRequired(true);
      const current = await api.snapshot(signal, snapshot.sessionId);
      if (current.revision !== receiptRevision) setActivityVersion((version) => version + 1);
      setSnapshot(current);
      setRefreshRequired(false);
    } catch (error) {
      if (signal.aborted || axios.isCancel(error)) return;
      const status = errorStatus(error);
      if (status === 401 || status === 403 || status === 404) {
        pending.current = null;
        setSnapshot(null);
        setUnavailable(true);
        return;
      }
      if (status === 409) {
        pending.current = null;
        setRefreshRequired(true);
        setIssue('This lesson changed in another tab. Refresh progress to continue.');
      } else if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        pending.current = null;
        setIssue(attempt?.action === 'record' ? 'The recording could not be checked. Please record it again.' : 'This action could not be saved. Please try again.');
      } else {
        setIssue(pending.current ? 'We could not confirm the action was saved. Retry to continue.' : 'Progress could not be refreshed. Please try again.');
      }
    } finally {
      busy.current = false;
      if (!signal.aborted) setWorking(false);
    }
  }

  function send(submission: PrimarySubmission) {
    if (!snapshot?.item || pending.current || refreshRequired || !snapshot.allowedActions.includes(submission.action)) return;
    void update({
      ...submission,
      attemptId: crypto.randomUUID(),
      revision: snapshot.revision,
      itemId: snapshot.item.id,
    });
  }

  const back = <Button asChild variant="outline"><Link to="/student/courses">Back to Courses</Link></Button>;
  const item = snapshot?.item;
  const imageKey = item?.step === 'learn' ? item.slide.imageKey : item?.imageKey;
  const image = imageKey ? snapshot?.media[imageKey] : undefined;
  const step = item ? primaryStepIndex(item.step) : primarySteps.length;

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-4 text-slate-900">
      {loading ? <p role="status">Loading Primary lesson…</p> : unavailable ? (
        <div className="grid justify-items-start gap-4 rounded-2xl border bg-white p-6">
          <p>This Primary lesson is unavailable for your account.</p>
          {back}
        </div>
      ) : !snapshot ? (
        <div className="grid justify-items-start gap-4 rounded-2xl border bg-white p-6">
          <p role="alert">{issue}</p>
          <Button onClick={() => { setLoading(true); setLoadCount((count) => count + 1); }}>Retry loading</Button>
          {back}
        </div>
      ) : (
        <>
          <header className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><BookOpen aria-hidden="true" className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-blue-700">Primary · Grade {snapshot.lesson.grade}</p>
                <h1 className="text-2xl font-bold">{snapshot.lesson.title}</h1>
              </div>
            </div>
            <ol aria-label="Lesson steps" className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {primarySteps.map((name, index) => (
                <li key={name} aria-current={step === index ? 'step' : undefined} className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 font-medium ${step === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {step > index ? <CheckCircle2 aria-label="Completed" className="h-4 w-4 shrink-0 text-teal-700" /> : <span>{index + 1}.</span>}
                  {name}
                </li>
              ))}
            </ol>
            <progress aria-label="Lesson progress" className="h-2 w-full accent-teal-500" value={snapshot.progress.completedItems} max={snapshot.progress.totalItems} />
          </header>
          {working && <p role="status" className="text-sm text-slate-700">Saving progress…</p>}
          {issue && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p role="alert" className="text-sm">{issue}</p>
              {pending.current && <Button size="sm" disabled={working} onClick={() => void update(pending.current ?? undefined, true)}>Retry action</Button>}
              {refreshRequired && <Button size="sm" disabled={working} onClick={() => void update()}>Refresh progress</Button>}
            </div>
          )}
          {item ? (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {imageKey && image?.kind === 'image' && <PrimaryPicture key={imageKey} api={api} sessionId={snapshot.sessionId} imageKey={imageKey} alt={image.alt} />}
              <PrimaryActivity key={`${item.id}:${activityVersion}`} api={api} snapshot={{ ...snapshot, item }}
                blocked={working || Boolean(pending.current) || refreshRequired} send={send} />
            </div>
          ) : (
            <section className="grid justify-items-start gap-3 rounded-2xl border bg-white p-6">
              <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-teal-600" />
              <h2 className="text-xl font-bold">Lesson complete!</h2>
              <p>Great work. You finished all four steps.</p>
              {back}
            </section>
          )}
        </>
      )}
    </div>
  );
}
