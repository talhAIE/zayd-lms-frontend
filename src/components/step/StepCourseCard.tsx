import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import {
  stepService,
  sameStepOwner,
  stepOwnerKey,
  type StepOwner,
} from "@/services/stepService";
import type { StepCourseSummary } from "@/types/step.contract";
import { useStepOwner } from "./StepSession";
import { stepLink } from "./StepShell";

export type StepDiscoveryState = "loading" | "hidden" | "available" | "error";
export function StepCourseCard({
  onStatusChange,
}: {
  onStatusChange?: (status: StepDiscoveryState) => void;
}) {
  const owner = useStepOwner();
  useEffect(() => {
    if (!owner) onStatusChange?.("hidden");
  }, [owner, onStatusChange]);
  return owner ? (
    <Card
      key={stepOwnerKey(owner)}
      owner={owner}
      onStatusChange={onStatusChange}
    />
  ) : null;
}
function Card({
  owner,
  onStatusChange,
}: {
  owner: StepOwner;
  onStatusChange?: (status: StepDiscoveryState) => void;
}) {
  const [course, setCourse] = useState<StepCourseSummary>();
  const [state, setState] = useState<StepDiscoveryState>("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    setCourse(undefined);
    onStatusChange?.("loading");
    void stepService
      .courses(owner, controller.signal)
      .then((value) => {
        if (!sameStepOwner(owner, controller.signal)) return;
        const course = value.courses[0];
        const next = course ? "available" : "hidden";
        setCourse(course);
        setState(next);
        onStatusChange?.(next);
      })
      .catch(() => {
        if (sameStepOwner(owner, controller.signal)) {
          setState("error");
          onStatusChange?.("error");
        }
      });
    return () => {
      controller.abort();
      onStatusChange?.("hidden");
    };
  }, [owner, retry, onStatusChange]);
  if (state === "loading")
    return (
      <span role="status" className="sr-only">
        Loading additional courses…
      </span>
    );
  if (state === "error")
    return (
      <div
        role="status"
        className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-600"
      >
        STEP courses could not load.{" "}
        <button
          className="min-h-11 underline focus-visible:ring-2 focus-visible:ring-blue-600"
          onClick={() => setRetry((n) => n + 1)}
        >
          Retry loading STEP
        </button>
      </div>
    );
  if (!course) return null;
  const complete = Math.min(course.completedTopicCount, course.topicCount);
  const progress = course.topicCount
    ? Math.round((complete / course.topicCount) * 100)
    : 0;
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#F1F5F9] bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex h-[168px] items-center justify-center bg-[#EFF5FF]">
        <ClipboardList
          aria-hidden="true"
          className="h-16 w-16 text-[#4F8DFB]"
        />
      </div>
      <div className="flex grow flex-col gap-4 p-5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#4F8DFB]">
          STEP
        </span>
        <h3 className="break-words text-lg font-bold">{course.title}</h3>
        <p className="text-sm text-slate-500">Grammar, Listening and Reading</p>
        <p className="text-sm text-slate-600">
          {complete} of {course.topicCount} activities completed
        </p>
        <div className="mt-auto">
          <div className="mb-2 flex justify-between text-xs font-semibold">
            <span>Completion</span>
            <span className="text-[#4F8DFB]">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#4F8DFB]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Link
          className={`${stepLink} w-full`}
          to={`/student/step/courses/${encodeURIComponent(course.id)}`}
        >
          Open STEP
        </Link>
      </div>
    </article>
  );
}
