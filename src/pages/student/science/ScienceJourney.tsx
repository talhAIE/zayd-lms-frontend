import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  scienceSparkService as api,
  scienceError,
  type ScienceOwner,
} from "@/services/scienceSparkService";
import { ScienceHtmlViewer } from "@/components/science/ScienceHtmlViewer";
import { SciencePracticeViewer } from "@/components/science/SciencePracticeViewer";
import { validateSciencePractice } from "@/components/science/sciencePractice";
import type {
  ScienceSparkActivityKey,
  ScienceSparkActivityState,
} from "@/types/science-spark.contract";

const coursePath = "/student/science/courses/science-spark";
const unitPath = (key: string) =>
  `/student/science/units/${encodeURIComponent(key)}`;
const activityPath = (u: string, a: string) =>
  `${unitPath(u)}/activities/${encodeURIComponent(a)}`;
const actionClass =
  "rounded-lg bg-slate-800 px-5 py-3 text-white font-semibold disabled:opacity-50";
function Failure({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <p>{error}</p>
      <button className="mt-3 underline font-semibold" onClick={retry}>
        Retry
      </button>{" "}
      <Link className="ml-4 underline" to="/student/courses">
        Back to courses
      </Link>
    </div>
  );
}
function useRequest<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(undefined);
    setError("");
    void load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(scienceError(e));
      });
    return () => controller.abort();
  }, [load, attempt]);
  return {
    data,
    error,
    retry: useCallback(() => setAttempt((n) => n + 1), []),
  };
}
export function ScienceBadge({ state }: { state: ScienceSparkActivityState }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${state.completed ? "bg-emerald-100 text-emerald-800" : state.opened ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"}`}
    >
      {state.completed ? "Completed" : state.opened ? "Opened" : "Not opened"}
    </span>
  );
}
export function ScienceCoursePage() {
  const owner = useOutletContext<ScienceOwner>();
  const { courseKey = "" } = useParams();
  return (
    <Course
      key={`${owner.sessionKey}:${courseKey}`}
      owner={owner}
      courseKey={courseKey}
    />
  );
}
function Course({
  owner,
  courseKey,
}: {
  owner: ScienceOwner;
  courseKey: string;
}) {
  const load = useCallback(
    (s: AbortSignal) => api.units(owner, s, courseKey),
    [owner, courseKey],
  );
  const { data, error, retry } = useRequest(load);
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link className="underline" to="/student/courses">
        Back to courses
      </Link>
      <h1 className="text-3xl font-bold">Science</h1>
      <p className="text-slate-600">Explore the Nature of Science.</p>
      {error ? (
        <Failure error={error} retry={retry} />
      ) : !data ? (
        <p role="status">Loading Science…</p>
      ) : (
        data.data.units.map((unit) => (
          <Link
            key={unit.unitKey}
            className="block rounded-2xl border bg-white p-6 hover:border-sky-500"
            to={unitPath(unit.unitKey)}
          >
            <h2 className="text-xl font-semibold">{unit.title}</h2>
            <p className="mt-2 text-slate-600">
              Introduction · Four lessons · Practice
            </p>
          </Link>
        ))
      )}
    </section>
  );
}
export function ScienceUnitPage() {
  const owner = useOutletContext<ScienceOwner>();
  const { unitKey = "" } = useParams();
  return (
    <Unit
      key={`${owner.sessionKey}:${unitKey}`}
      owner={owner}
      unitKey={unitKey}
    />
  );
}
function Unit({ owner, unitKey }: { owner: ScienceOwner; unitKey: string }) {
  const load = useCallback(
    (s: AbortSignal) => api.activities(owner, s, unitKey),
    [owner, unitKey],
  );
  const { data, error, retry } = useRequest(load);
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link className="underline" to={coursePath}>
        Back to Science
      </Link>
      {error ? (
        <Failure error={error} retry={retry} />
      ) : !data ? (
        <p role="status">Loading activities…</p>
      ) : (
        <>
          <h1 className="text-3xl font-bold">{data.data.unit.title}</h1>
          <p className="text-slate-600">
            Choose an activity. Complete and Next saves completion; you can
            revisit any lesson.
          </p>
          <ol className="space-y-3">
            {data.data.activities.map(({ activity, state }) => (
              <li key={activity.activityKey}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-5 hover:border-sky-500"
                  to={activityPath(unitKey, activity.activityKey)}
                >
                  <span className="font-semibold">
                    {activity.kind === "local_html" &&
                      activity.lessonId &&
                      `Lesson ${activity.lessonId.slice(1)}: `}
                    {activity.title}
                  </span>
                  <ScienceBadge state={state} />
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
export function ScienceActivityPage() {
  const owner = useOutletContext<ScienceOwner>();
  const { unitKey = "", activityKey = "" } = useParams();
  return (
    <Activity
      key={`${owner.sessionKey}:${unitKey}:${activityKey}`}
      owner={owner}
      unitKey={unitKey}
      activityKey={activityKey}
    />
  );
}
function Activity({
  owner,
  unitKey,
  activityKey,
}: {
  owner: ScienceOwner;
  unitKey: string;
  activityKey: string;
}) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const busy = useRef(false);
  const life = useRef(new AbortController());
  useEffect(() => {
    const controller = new AbortController();
    life.current = controller;
    return () => controller.abort();
  }, []);
  const load = useCallback(
    async (s: AbortSignal) => {
      setReady(false);
      setSaveError("");
      const listing = await api.activities(owner, s, unitKey);
      const selected = listing.data.activities.find(
        (item) => item.activity.activityKey === activityKey,
      );
      if (!selected) throw new Error("Activity unavailable");
      const content = await api.content(owner, s, unitKey, activityKey);
      if (
        content.data.kind !== selected.activity.kind ||
        content.data.activityKey !== activityKey
      )
        throw new Error("Unexpected Science content");
      if (content.data.kind === "external_practice")
        validateSciencePractice(content.data);
      const opened = await api.open(owner, s, unitKey, activityKey);
      return {
        selected,
        content: content.data,
        state: opened.data,
      };
    },
    [owner, unitKey, activityKey],
  );
  const { data, error, retry } = useRequest(load);
  const back = useCallback(
    () => navigate(unitPath(unitKey)),
    [navigate, unitKey],
  );
  const select = useCallback(
    (key: ScienceSparkActivityKey) => navigate(activityPath(unitKey, key)),
    [navigate, unitKey],
  );
  const complete = async () => {
    if (
      busy.current ||
      !data?.content ||
      (data.content.kind === "local_html" && !ready)
    )
      return;
    busy.current = true;
    setSaving(true);
    setSaveError("");
    const signal = life.current.signal;
    try {
      const result = await api.complete(owner, signal, unitKey, activityKey);
      if (signal.aborted) return;
      if (
        !result.data.state.completed ||
        result.data.state.activityKey !== activityKey ||
        result.data.nextActivityKey !== data.selected.activity.nextActivityKey
      )
        throw new Error("Unexpected completion response");
      if (result.data.nextActivityKey) select(result.data.nextActivityKey);
      else if (result.data.returnToUnitKey === unitKey) back();
      else throw new Error("Unexpected next activity");
    } catch (e) {
      if (!signal.aborted) setSaveError(scienceError(e));
    } finally {
      busy.current = false;
      if (!signal.aborted) setSaving(false);
    }
  };
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="underline" to={unitPath(unitKey)}>
          Back to Unit 1
        </Link>
        {data && <ScienceBadge state={data.state} />}
      </div>
      {error ? (
        <Failure error={error} retry={retry} />
      ) : !data ? (
        <p role="status">Loading activity…</p>
      ) : data.content.kind === "external_practice" ? (
        <SciencePracticeViewer
          content={data.content}
          onClose={back}
          onRetry={retry}
          onComplete={() => void complete()}
          saving={saving}
          saveError={saveError}
        />
      ) : (
        <>
          <h1 className="text-xl font-bold">{data.selected.activity.title}</h1>
          <ScienceHtmlViewer
            content={data.content}
            sessionKey={owner.sessionKey}
            onBackToUnit={back}
            onSelectActivity={select}
            onRetry={retry}
            onReadyChange={setReady}
          />
          <div className="sticky bottom-0 z-20 rounded-xl border bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <p className="text-sm text-slate-600">
              Next section explores this lesson. Complete and Next completes
              this activity.
            </p>
            <button
              className={actionClass}
              disabled={!ready || saving}
              onClick={() => void complete()}
            >
              {saving
                ? "Saving…"
                : saveError
                  ? "Retry Complete and Next"
                  : "Complete and Next"}
            </button>
            {saveError && (
              <p role="alert" className="w-full text-red-700">
                Completion was not confirmed. You are still on this activity.{" "}
                {saveError}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
