import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, FlaskConical, Ruler, ChartNoAxesCombined, Cpu, Gamepad2, Atom, Play } from "lucide-react";
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
              Introduction · Four lessons · Practice · Simulation
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
            Explore each activity, then select Complete and Next to continue.
          </p>
          <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-[#282828]">Lesson activities</h2>
            <p className="mt-1 mb-4 text-sm text-[#64748B]">Introduction · Four lessons · Practice · Simulation</p>
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {data.data.activities.map(({ activity, state }, index) => {
                const Icon = activity.kind === "external_simulation" ? Atom : activity.kind === "external_practice"
                  ? Gamepad2
                  : activity.lessonId === "l1" ? FlaskConical
                  : activity.lessonId === "l2" ? Ruler
                  : activity.lessonId === "l3" ? ChartNoAxesCombined
                  : activity.lessonId === "l4" ? Cpu : BookOpen;
                const label = activity.kind === "external_simulation" ? "PhET Simulation" : activity.kind === "external_practice"
                  ? "Practice" : activity.lessonId ? `Lesson ${activity.lessonId.slice(1)}` : "Introduction";
                return <li key={activity.activityKey} className="flex min-w-0">
                  <Link
                    className="flex min-h-[224px] w-full flex-col justify-between rounded-[16px] border border-[#4F8DFB] bg-white p-4 text-left transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4F8DFB]"
                    to={activityPath(unitKey, activity.activityKey)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#94A3B8]">{String(index + 1).padStart(2, "0")}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${state.completed ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#EFF6FF] text-[#2563EB]"}`}>
                        {state.completed ? "Completed" : state.opened ? "Resume" : "Start"}
                      </span>
                    </div>
                    <div className="my-4">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
                        <Icon className="h-6 w-6 text-[#4F8DFB]" aria-hidden="true" />
                      </div>
                      <h3 className="text-[16px] font-bold leading-tight text-[#282828]">{activity.title}</h3>
                      <p className="mt-1 text-xs font-medium text-[#4F8DFB]">{label}</p>
                      <p className="mt-2 text-xs text-[#64748B]">Nature of Science · Unit 1</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 text-xs font-semibold text-[#64748B]">
                      <span>{state.completed ? "Completed" : state.opened ? "Opened" : "Not opened"}</span>
                      <Play className="h-4 w-4 shrink-0 fill-current text-[#4F8DFB]" aria-hidden="true" />
                    </div>
                  </Link>
                </li>;
              })}
            </ol>
          </div>
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
      if (content.data.kind !== "local_html")
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
      ) : data.content.kind !== "local_html" ? (
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
