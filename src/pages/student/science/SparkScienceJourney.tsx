import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import type { ScienceOwner } from "@/services/scienceSparkService";
import {
  sparkScienceService as api,
  sparkViewerUrl,
  type SparkActivityKey,
  type SparkCourse,
  type SparkViewer,
  type SparkActivity,
} from "@/services/sparkScienceService";
import { MotionQuiz } from "@/components/science/MotionQuiz";

const unitPath = (unit: number) =>
  `/student/science/spark-science/unit-${unit}`;
const activityPath = (key: SparkActivityKey, unit = 2) =>
  `${unitPath(unit)}/activities/${key}`;
function useUnitNumber() {
  const { unitSlug } = useParams();
  return unitSlug === undefined
    ? 2
    : unitSlug === "unit-2"
      ? 2
      : unitSlug === "unit-3"
        ? 3
        : 0;
}
function useCourse(owner: ScienceOwner, unitNumber?: number) {
  const [course, setCourse] = useState<SparkCourse | null>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCourse(undefined);
    setError("");
    if (unitNumber !== undefined && unitNumber !== 2 && unitNumber !== 3) {
      setError("Unknown Science unit");
      return () => controller.abort();
    }
    void api
      .course(owner, controller.signal, unitNumber)
      .then((result) => {
        if (!controller.signal.aborted) setCourse(result.course);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Spark Science could not load. Please retry.");
      });
    return () => controller.abort();
  }, [owner, attempt, unitNumber]);
  return { course, error, retry: () => setAttempt((n) => n + 1) };
}
function ErrorBox({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
      {error}{" "}
      <button className="underline" onClick={retry}>
        Retry
      </button>
    </div>
  );
}
function Empty({ course }: { course: SparkCourse | null | undefined }) {
  return (
    <p role="status">
      {course === null
        ? "Spark Science is available to American Grade 9 students."
        : "Loading Spark Science…"}
    </p>
  );
}

export function SparkScienceCoursePage() {
  const owner = useOutletContext<ScienceOwner>(),
    { course, error, retry } = useCourse(owner);
  if (error) return <ErrorBox error={error} retry={retry} />;
  if (!course) return <Empty course={course} />;
  return (
    <div className="w-full max-w-[999px] mx-auto bg-white rounded-[24px] border border-gray-100 shadow-sm font-['Outfit',sans-serif] p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 md:p-8 border border-[#E5E7EB] rounded-[16px] gap-4">
        <div>
          <span className="text-[13px] text-[#949494] uppercase">
            Current course
          </span>
          <h1 className="text-[28px] font-bold text-[#282828]">
            {course.title}
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-[#F8FAFC] py-3 px-6 rounded-[12px]">
          <div className="relative w-[72px] h-[72px] flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 72 72"
              aria-hidden="true"
            >
              <circle
                cx="36"
                cy="36"
                r="32"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              <circle
                cx="36"
                cy="36"
                r="32"
                fill="none"
                stroke="#5C9DFF"
                strokeWidth="8"
                strokeDasharray="201"
                strokeDashoffset={201 - (201 * course.progressPct) / 100}
              />
            </svg>
            <span className="font-bold text-xs">{course.progressPct}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Course progress</p>
            <p className="text-[13px] text-[#949494]">
              {course.completedUnits} of {course.units?.length ?? 1} available
              units completed
            </p>
            <p className="text-xs text-[#949494]">
              {course.completedActivities} of {course.totalActivities}{" "}
              activities completed
            </p>
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-[18px] font-bold">Choose a unit</h2>
            <p className="text-[14px] text-[#949494]">
              Explore the available units and continue your learning.
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              disabled
              aria-label="Previous unit"
              className="rounded-full border p-2 text-gray-300"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled
              aria-label="Next unit"
              className="rounded-full border p-2 text-gray-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          {(course.units ?? [course]).map((unit) => (
            <Link
              key={unit.unitKey}
              to={unitPath(unit.unitNumber ?? 2)}
              className="mt-6 flex flex-col justify-between w-full max-w-[260px] min-h-[220px] border-2 border-[#4F8DFB] rounded-[16px] p-5 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between">
                <span className="rounded-full bg-[#EFF6FF] p-3">
                  <BookOpen className="text-[#4F8DFB]" />
                </span>
                <span className="rounded-full bg-[#4F8DFB] text-white text-[11px] font-bold px-3 py-1 h-fit">
                  {unit.status === "completed"
                    ? "Completed"
                    : unit.status === "in_progress"
                      ? "Resume"
                      : "Start"}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[13px] text-gray-500">
                  Unit {unit.unitNumber ?? 2}
                </p>
                <h3 className="text-lg font-bold">{unit.unitTitle}</h3>
                <p className="text-[13px] text-[#949494]">
                  {unit.totalActivities} activities ·{" "}
                  {unit.status.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex justify-between mt-4">
                <span className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs font-bold text-gray-500">
                  <Star size={13} />
                  {unit.progressPct}% Completion
                </span>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SparkScienceUnitPage() {
  const unitNumber = useUnitNumber();
  const owner = useOutletContext<ScienceOwner>(),
    { course, error, retry } = useCourse(owner, unitNumber);
  if (error) return <ErrorBox error={error} retry={retry} />;
  if (!course) return <Empty course={course} />;
  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">{course.unitTitle}</h1>
        <p className="text-sm text-gray-500">
          {course.progressPct}% complete · {course.completedActivities} of{" "}
          {course.totalActivities}
          activities
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {course.activities.map((activity, index) => (
          <Link
            key={activity.key}
            to={activityPath(activity.key, unitNumber)}
            className="rounded-[16px] border border-[#4F8DFB] bg-white p-5 min-h-[220px] flex flex-col justify-between hover:shadow-md"
          >
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${activity.completed ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"}`}
              >
                {activity.completed
                  ? "Completed"
                  : activity.opened
                    ? "Resume"
                    : "Start"}
              </span>
            </div>
            <BookOpen className="text-[#4F8DFB] my-4" />
            <h2 className="text-lg font-bold">{activity.title}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {activity.kind === "lesson"
                ? "Interactive Lesson"
                : activity.kind === "review"
                  ? "Connect the ideas from all three lessons"
                  : "Explore the unit overview"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SparkScienceActivityPage() {
  const owner = useOutletContext<ScienceOwner>(),
    { activityKey = "" } = useParams();
  const unitNumber = useUnitNumber();
  return (
    <Activity
      key={`${owner.sessionKey}:${unitNumber}:${activityKey}`}
      owner={owner}
      activityKey={activityKey}
      unitNumber={Number(unitNumber)}
    />
  );
}
function Activity({
  owner,
  unitNumber,
  activityKey,
}: {
  owner: ScienceOwner;
  activityKey: string;
  unitNumber: number;
}) {
  const navigate = useNavigate(),
    { course, error, retry } = useCourse(owner, unitNumber);
  const activity = course?.activities.find((item) => item.key === activityKey);
  const [searchParams] = useSearchParams();
  const showLesson = searchParams.get("view") === "interactive";
  if (error) return <ErrorBox error={error} retry={retry} />;
  if (!course) return <Empty course={course} />;
  const leaf =
    activity ??
    course.activities
      .flatMap((a) => a.activities ?? [])
      .find((a) => a.key === activityKey);
  if (!leaf) return <p role="alert">This Science activity is unavailable.</p>;
  if (leaf.kind === "lesson" && !showLesson)
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-bold">{leaf.title}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaf.activities?.map((child) => (
            <Link
              key={child.key}
              to={activityPath(child.key, unitNumber)}
              className="text-left flex flex-col justify-between border-2 border-[#4F8DFB] rounded-[16px] p-6 w-full max-w-[300px] min-h-[220px] bg-white hover:shadow-md"
            >
              <BookOpen className="text-[#4F8DFB] h-10 w-10" />
              <div>
                <h2 className="text-xl font-bold mt-5">{child.title}</h2>
                <p className="text-sm text-gray-500 mt-2">
                  {child.kind === "interactive_lesson"
                    ? "Explore the lesson, models, vocabulary and thinking checks."
                    : child.kind === "quiz"
                      ? "Answer the lesson questions and receive feedback."
                      : child.kind === "phet"
                        ? "Explore the supplied simulations."
                        : "Open the lesson Kahoot."}
                </p>
              </div>
              <span className="text-[#4F8DFB] font-semibold flex gap-2 items-center mt-4">
                <Play size={16} />
                {child.completed
                  ? "Completed · Review"
                  : child.opened
                    ? "Resume"
                    : "Start"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    );
  const parent = course.activities.find((a) =>
    a.activities?.some((c) => c.key === leaf.key),
  );
  const back = () =>
    navigate(
      parent ? activityPath(parent.key, unitNumber) : unitPath(unitNumber),
    );
  if (leaf.kind === "quiz")
    return (
      <MotionQuiz
        key={leaf.key}
        owner={owner}
        unitNumber={unitNumber}
        activityKey={leaf.key}
        onReturn={back}
      />
    );
  if (leaf.kind === "kahoot" || leaf.kind === "phet")
    return (
      <ExternalActivity
        key={leaf.key}
        owner={owner}
        unitNumber={unitNumber}
        activity={leaf}
        onReturn={back}
      />
    );
  return (
    <Viewer
      owner={owner}
      activityKey={
        leaf.kind === "lesson" ? leaf.key + "-interactive" : leaf.key
      }
      unitNumber={unitNumber}
      title={leaf.title}
      onReturn={back}
    />
  );
}

function ExternalActivity({
  owner,
  unitNumber,
  activity,
  onReturn,
}: {
  owner: ScienceOwner;
  activity: SparkActivity;
  unitNumber: number;
  onReturn: () => void;
}) {
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [retry, setRetry] = useState(0);
  const life = useRef<AbortController>();
  useEffect(() => {
    const c = new AbortController();
    life.current = c;
    setReady(false);
    setError("");
    void api
      .open(owner, c.signal, activity.key, unitNumber)
      .then(() => {
        if (!c.signal.aborted) setReady(true);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError("Activity could not open. Retry to continue.");
      });
    return () => c.abort();
  }, [owner, activity.key, unitNumber, retry]);
  const complete = async () => {
    if (!life.current || saving || !ready) return;
    setSaving(true);
    setError("");
    try {
      await api.complete(owner, life.current.signal, activity.key, unitNumber);
      onReturn();
    } catch {
      setError("Completion could not save. Please retry.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border bg-white p-6">
      <button className="underline" onClick={onReturn}>
        Back to activities
      </button>
      <h1 className="text-2xl font-bold">{activity.title}</h1>
      <p>Open the activity in a new tab. Return here when you have finished.</p>
      {activity.kind === "phet" && (
        <p>
          Explore each supplied simulation. Some links open a simulation
          information page where you can choose a language and launch the
          player.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {activity.targets?.map((t) => (
          <a
            key={t.key}
            className={`rounded-xl border p-5 font-semibold text-blue-700 ${!ready ? "pointer-events-none opacity-40" : ""}`}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Play {t.title} ↗
          </a>
        ))}
      </div>
      {error && (
        <p role="alert">
          {error}{" "}
          <button className="underline" onClick={() => setRetry((x) => x + 1)}>
            Retry
          </button>
        </p>
      )}
      <p className="text-sm text-gray-500">
        Opening or closing a tab does not mark this activity complete. External
        scores are not imported.
      </p>
      <button
        className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-40"
        disabled={!ready || saving}
        onClick={() => void complete()}
      >
        {saving ? "Saving…" : "Complete and return"}
      </button>
    </section>
  );
}

function Viewer({
  owner,
  unitNumber,
  activityKey,
  title,
  onReturn,
}: {
  owner: ScienceOwner;
  activityKey: SparkActivityKey;
  unitNumber: number;
  title: string;
  onReturn: () => void;
}) {
  const [viewer, setViewer] = useState<SparkViewer>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [loaded, setLoaded] = useState(false),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [navigationBlocked, setNavigationBlocked] = useState(false),
    [frameRevision, setFrameRevision] = useState(0);
  const iframe = useRef<HTMLIFrameElement>(null),
    life = useRef<AbortController>(),
    busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    life.current = controller;
    setViewer(undefined);
    setError("");
    setLoaded(false);
    setNavigationBlocked(false);
    void api
      .viewer(owner, controller.signal, activityKey, unitNumber)
      .then((result) => {
        if (!controller.signal.aborted) {
          if (result.activityKey !== activityKey)
            throw new Error("Unexpected Science viewer");
          sparkViewerUrl(result);
          setViewer(result);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("The lesson could not load. Please retry.");
      });
    return () => controller.abort();
  }, [owner, activityKey, unitNumber, attempt]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data;
      if (
        !viewer ||
        event.source !== iframe.current?.contentWindow ||
        event.origin !== "null" ||
        !data ||
        typeof data !== "object" ||
        data.nonce !== viewer.nonce
      )
        return;
      const fields = Object.keys(data).sort().join(",");
      const blocked =
        data.type === "spark-science-navigation-blocked" &&
        fields === "nonce,type";
      // Older deployed backends send a navigation request. Restore the current
      // viewer instead of following that request or leaving its bridge visible.
      const legacy =
        data.type === "spark-science-navigation" &&
        fields === "activityKey,nonce,type" &&
        [
          "introduction",
          "lesson-1",
          "lesson-2",
          "lesson-3",
          "module-review",
        ].includes(data.activityKey);
      if (!blocked && !legacy) return;
      setNavigationBlocked(true);
      setLoaded(false);
      setFrameRevision((revision) => revision + 1);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [viewer]);
  const complete = useCallback(async () => {
    if (busy.current || !loaded || !life.current || life.current.signal.aborted)
      return;
    busy.current = true;
    setSaving(true);
    setSaveError("");
    const signal = life.current.signal;
    try {
      const result = await api.complete(owner, signal, activityKey, unitNumber);
      if (!signal.aborted) {
        if (
          !result.course?.activities
            .flatMap((item) => item.activities ?? [item])
            .find((item) => item.key === activityKey)?.completed
        )
          throw new Error("Completion not confirmed");
        onReturn();
      }
    } catch {
      if (!signal.aborted)
        setSaveError("Completion could not be saved. Please retry.");
    } finally {
      busy.current = false;
      if (!signal.aborted) setSaving(false);
    }
  }, [owner, activityKey, unitNumber, loaded, onReturn]);
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      {navigationBlocked && (
        <p role="status" className="text-sm text-gray-600">
          Use the blue Next activity button to finish this activity and return
          to Unit {unitNumber}.
        </p>
      )}
      {error ? (
        <ErrorBox error={error} retry={() => setAttempt((n) => n + 1)} />
      ) : !viewer ? (
        <p role="status">Loading lesson…</p>
      ) : (
        <>
          <iframe
            key={`${viewer.nonce}:${frameRevision}`}
            ref={iframe}
            src={sparkViewerUrl(viewer)}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            title={title}
            onLoad={() => setLoaded(true)}
            className="block w-full border-0 rounded-lg"
            style={{ height: "max(420px, calc(100dvh - 184px))" }}
          />
          <div className="sticky bottom-0 z-20 bg-white border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <p className="text-sm text-gray-500">
              When you finish, save this activity and return to Unit 2.
            </p>
            <button
              disabled={!loaded || saving}
              onClick={() => void complete()}
              className="bg-[#4F8DFB] hover:bg-[#3778e6] text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : saveError
                  ? "Retry Next activity"
                  : "Next activity"}
            </button>
            {saveError && (
              <p role="alert" className="w-full text-red-700">
                {saveError}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
