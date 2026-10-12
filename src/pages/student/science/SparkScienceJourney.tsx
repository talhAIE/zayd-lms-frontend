import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import type { ScienceOwner } from "@/services/scienceSparkService";
import {
  sparkScienceService as api,
  sparkViewerUrl,
  type SparkActivityKey,
  type SparkCourse,
  type SparkViewer,
} from "@/services/sparkScienceService";
import {
  SPARK_COURSE_PATH,
  SPARK_UNIT_PATH,
} from "@/components/science/SparkScienceCourseCard";

const activityPath = (key: SparkActivityKey) =>
  `${SPARK_UNIT_PATH}/activities/${key}`;
function useCourse(owner: ScienceOwner) {
  const [course, setCourse] = useState<SparkCourse | null>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCourse(undefined);
    setError("");
    void api
      .course(owner, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCourse(result.course);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Spark Science could not load. Please retry.");
      });
    return () => controller.abort();
  }, [owner, attempt]);
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
              {course.completedUnits} of 1 available units completed
            </p>
            <p className="text-xs text-[#949494]">
              {course.completedActivities} of 5 activities completed
            </p>
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-[18px] font-bold">Choose a unit</h2>
            <p className="text-[14px] text-[#949494]">
              Explore the available unit and continue your learning.
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
        <Link
          to={SPARK_UNIT_PATH}
          className="mt-6 flex flex-col justify-between w-full max-w-[260px] min-h-[220px] border-2 border-[#4F8DFB] rounded-[16px] p-5 shadow-sm hover:shadow-md"
        >
          <div className="flex justify-between">
            <span className="rounded-full bg-[#EFF6FF] p-3">
              <BookOpen className="text-[#4F8DFB]" />
            </span>
            <span className="rounded-full bg-[#4F8DFB] text-white text-[11px] font-bold px-3 py-1 h-fit">
              {course.status === "completed"
                ? "Completed"
                : course.status === "in_progress"
                  ? "Resume"
                  : "Start"}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[13px] text-gray-500">Unit 1</p>
            <h3 className="text-lg font-bold">{course.unitTitle}</h3>
            <p className="text-[13px] text-[#949494]">
              5 available activities · {course.status.replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex justify-between mt-4">
            <span className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs font-bold text-gray-500">
              <Star size={13} />
              {course.progressPct}% Completion
            </span>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>
      </div>
    </div>
  );
}

export function SparkScienceUnitPage() {
  const owner = useOutletContext<ScienceOwner>(),
    { course, error, retry } = useCourse(owner);
  if (error) return <ErrorBox error={error} retry={retry} />;
  if (!course) return <Empty course={course} />;
  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <Link className="text-sm underline" to={SPARK_COURSE_PATH}>
        Back to Spark Science
      </Link>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">{course.unitTitle}</h1>
        <p className="text-sm text-gray-500">
          {course.progressPct}% complete · {course.completedActivities} of 5
          activities
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {course.activities.map((activity, index) => (
          <Link
            key={activity.key}
            to={activityPath(activity.key)}
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
  return (
    <Activity
      key={`${owner.sessionKey}:${activityKey}`}
      owner={owner}
      activityKey={activityKey}
    />
  );
}
function Activity({
  owner,
  activityKey,
}: {
  owner: ScienceOwner;
  activityKey: string;
}) {
  const navigate = useNavigate(),
    { course, error, retry } = useCourse(owner);
  const activity = course?.activities.find((item) => item.key === activityKey);
  const [showLesson, setShowLesson] = useState(false);
  if (error) return <ErrorBox error={error} retry={retry} />;
  if (!course) return <Empty course={course} />;
  if (!activity)
    return <p role="alert">This Science activity is unavailable.</p>;
  if (activity.kind === "lesson" && !showLesson)
    return (
      <section className="space-y-6">
        <Link className="underline" to={SPARK_UNIT_PATH}>
          Back to Unit 1
        </Link>
        <h1 className="text-3xl font-bold">{activity.title}</h1>
        <button
          onClick={() => setShowLesson(true)}
          className="text-left flex flex-col justify-between border-2 border-[#4F8DFB] rounded-[16px] p-6 w-full max-w-[300px] min-h-[220px] bg-white hover:shadow-md"
        >
          <BookOpen className="text-[#4F8DFB] h-10 w-10" />
          <div>
            <h2 className="text-xl font-bold mt-5">Interactive Lesson</h2>
            <p className="text-sm text-gray-500 mt-2">
              Explore the lesson, models, vocabulary and thinking checks.
            </p>
          </div>
          <span className="text-[#4F8DFB] font-semibold flex gap-2 items-center mt-4">
            <Play size={16} />
            {activity.completed ? "Review lesson" : "Open lesson"}
          </span>
        </button>
      </section>
    );
  return (
    <Viewer
      owner={owner}
      activityKey={activity.key}
      title={activity.title}
      onReturn={() => navigate(SPARK_UNIT_PATH)}
    />
  );
}

function Viewer({
  owner,
  activityKey,
  title,
  onReturn,
}: {
  owner: ScienceOwner;
  activityKey: SparkActivityKey;
  title: string;
  onReturn: () => void;
}) {
  const [viewer, setViewer] = useState<SparkViewer>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [loaded, setLoaded] = useState(false),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [navigationBlocked, setNavigationBlocked] = useState(false);
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
      .viewer(owner, controller.signal, activityKey)
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
  }, [owner, activityKey, attempt]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data;
      if (
        !viewer ||
        event.source !== iframe.current?.contentWindow ||
        event.origin !== "null" ||
        !data ||
        data.type !== "spark-science-navigation-blocked" ||
        data.nonce !== viewer.nonce ||
        Object.keys(data).sort().join(",") !== "nonce,type"
      )
        return;
      setNavigationBlocked(true);
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
      const result = await api.complete(owner, signal, activityKey);
      if (!signal.aborted) {
        if (
          !result.course?.activities.find((item) => item.key === activityKey)
            ?.completed
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
  }, [owner, activityKey, loaded, onReturn]);
  return (
    <section className="space-y-4">
      <Link className="underline" to={SPARK_UNIT_PATH}>
        Back to Unit 1
      </Link>
      <h1 className="text-xl font-bold">{title}</h1>
      {navigationBlocked && (
        <p role="status" className="text-sm text-gray-600">
          Use the blue Next activity button to finish this activity and return to Unit 1.
        </p>
      )}
      {error ? (
        <ErrorBox error={error} retry={() => setAttempt((n) => n + 1)} />
      ) : !viewer ? (
        <p role="status">Loading lesson…</p>
      ) : (
        <>
          <iframe
            key={viewer.nonce}
            ref={iframe}
            src={sparkViewerUrl(viewer)}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            title={title}
            onLoad={() => setLoaded(true)}
            className="block w-full border-0 rounded-lg"
            style={{ height: "max(560px, 78dvh)" }}
          />
          <div className="sticky bottom-0 z-20 bg-white border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <p className="text-sm text-gray-500">
              When you finish, save this activity and return to Unit 1.
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
