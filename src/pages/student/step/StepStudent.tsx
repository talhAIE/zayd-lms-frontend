import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sameStepOwner,
  stepErrorMessage,
  stepService,
} from "@/services/stepService";
import type { StepTopicOverview } from "@/types/step.contract";
import {
  StepFailure,
  StepFrame,
  StepLoading,
  stepIcon,
  stepLink,
  stepPrimary,
  useStepResource,
} from "@/components/step/StepShell";
import { useStepSession } from "@/components/step/StepSession";
import { StepAttempt, stepJournalKey } from "@/components/step/StepAttempt";
import { StepResultView } from "@/components/step/StepResult";

export function StepCoursePage() {
  const { courseId = "" } = useParams(),
    { data, error, retry } = useStepResource(courseId, stepService.course);
  if (!data)
    return error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    );
  return (
    <StepFrame>
      <div className="my-5 rounded-2xl bg-[#EFF5FF] p-6">
        <p className="text-sm font-semibold text-blue-700">STEP</p>
        <h1
          dir="auto"
          className="mt-2 text-3xl font-bold [overflow-wrap:anywhere]"
        >
          {data.course.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.course.completedTopicCount} of {data.course.topicCount}{" "}
          activities completed
        </p>
      </div>
      <h2 className="mb-4 text-lg font-semibold">Choose a section</h2>
      {!data.sections.length && (
        <p role="status" className="py-5 text-slate-600">
          No STEP sections are available.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {[...data.sections]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((s) => {
            const Icon = stepIcon(s.kind);
            return (
              <article
                key={s.id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 p-5"
              >
                <Icon className="h-9 w-9 text-[#4F8DFB]" aria-hidden="true" />
                <h3
                  dir="auto"
                  className="text-xl font-semibold [overflow-wrap:anywhere]"
                >
                  {s.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {s.completedTopicCount} of {s.topicCount} activities completed
                </p>
                <Link
                  className={`${stepLink} mt-auto`}
                  to={`/student/step/sections/${encodeURIComponent(s.id)}`}
                >
                  Open {s.title}
                </Link>
              </article>
            );
          })}
      </div>
    </StepFrame>
  );
}
export function StepSectionPage() {
  const { sectionId = "" } = useParams(),
    { data, error, retry } = useStepResource(sectionId, stepService.section);
  if (!data)
    return error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    );
  return (
    <StepFrame
      backTo={`/student/step/courses/${encodeURIComponent(data.section.courseId)}`}
      backLabel="Back to STEP"
    >
      <p className="mt-4 text-sm font-semibold text-blue-700">STEP</p>
      <h1
        dir="auto"
        className="mb-5 mt-2 text-3xl font-bold [overflow-wrap:anywhere]"
      >
        {data.section.title}
      </h1>
      {!data.topics.length && (
        <p role="status" className="py-5 text-slate-600">
          No activities are available in this section.
        </p>
      )}
      <div className="space-y-4">
        {[...data.topics]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((t) => (
            <article
              key={t.id}
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h2
                  dir="auto"
                  className="text-lg font-semibold [overflow-wrap:anywhere]"
                >
                  {t.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t.questionCount} questions · {t.totalMarks} marks
                </p>
                <p className="mt-2 text-sm text-blue-700">
                  {t.state === "submitted"
                    ? "Completed"
                    : t.state === "in_progress"
                      ? "In progress"
                      : "Not started"}
                </p>
              </div>
              <Link
                className={stepLink}
                to={`/student/step/topics/${encodeURIComponent(t.id)}`}
              >
                Open activity
              </Link>
            </article>
          ))}
      </div>
    </StepFrame>
  );
}
export function StepOverviewView({
  topic,
  onOpen,
  opening = false,
}: {
  topic: StepTopicOverview;
  onOpen?: () => void;
  opening?: boolean;
}) {
  const action =
    topic.state === "submitted"
      ? "View result"
      : topic.state === "in_progress"
        ? "Resume activity"
        : "Start activity";
  return (
    <StepFrame
      backTo={`/student/step/sections/${encodeURIComponent(topic.sectionId)}`}
      backLabel="Back to section"
    >
      <div className="my-5 rounded-2xl bg-[#EFF5FF] p-6">
        <ClipboardList
          className="mb-4 h-10 w-10 text-[#4F8DFB]"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold capitalize text-blue-700">
          STEP · {topic.kind}
        </p>
        <h1
          dir="auto"
          className="mt-2 text-3xl font-bold [overflow-wrap:anywhere]"
        >
          {topic.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {topic.questionCount} questions · {topic.totalMarks} marks
        </p>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Before you begin</h2>
      <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600">
        {topic.instructions.map((line, i) => (
          <li dir="auto" className="[overflow-wrap:anywhere]" key={i}>
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-slate-600">
        One attempt · No time limit · Final marks after submission
      </p>
      <div className="mt-6">
        {topic.attemptId && !onOpen ? (
          <Link
            className={stepLink}
            to={`/student/step/attempts/${encodeURIComponent(topic.attemptId)}`}
          >
            {action}
          </Link>
        ) : (
          <Button
            className={`${stepPrimary} px-6`}
            disabled={!onOpen || opening}
            onClick={onOpen}
          >
            {opening ? "Opening activity…" : action}
          </Button>
        )}
      </div>
    </StepFrame>
  );
}
export function StepTopicPage() {
  const { topicId = "" } = useParams(),
    { data, error, retry } = useStepResource(topicId, stepService.overview);
  return !data ? (
    error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    )
  ) : (
    <TopicAction key={data.id} topic={data} />
  );
}
function TopicAction({ topic }: { topic: StepTopicOverview }) {
  const owner = useStepSession(),
    navigate = useNavigate(),
    lifetime = useRef<AbortController>(),
    pending = useRef(false);
  const [opening, setOpening] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);
  async function open() {
    const controller = lifetime.current;
    if (
      !controller ||
      pending.current ||
      !sameStepOwner(owner, controller.signal)
    )
      return;
    pending.current = true;
    setOpening(true);
    setError("");
    try {
      const a = await stepService.start(owner, controller.signal, topic.id);
      if (sameStepOwner(owner, controller.signal))
        navigate(
          `/student/step/attempts/${encodeURIComponent(a.state === "submitted" ? a.attemptId : a.id)}`,
        );
    } catch (e) {
      if (sameStepOwner(owner, controller.signal))
        setError(stepErrorMessage(e));
    } finally {
      pending.current = false;
      if (sameStepOwner(owner, controller.signal)) setOpening(false);
    }
  }
  return (
    <>
      <StepOverviewView
        topic={topic}
        opening={opening}
        onOpen={topic.attemptId ? undefined : () => void open()}
      />
      {error && (
        <p
          role="alert"
          className="mx-auto max-w-[1087px] px-5 pb-5 text-sm text-red-700"
        >
          {error} Retry Start to resume the same attempt.
        </p>
      )}
    </>
  );
}
export function StepAttemptPage() {
  const { attemptId = "" } = useParams();
  return <Attempt key={attemptId} id={attemptId} />;
}
function Attempt({ id }: { id: string }) {
  const owner = useStepSession(),
    { data, error, retry } = useStepResource(id, stepService.attempt),
    key = stepJournalKey(owner, id);
  useEffect(() => {
    if (data?.state === "submitted") {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* No draft to restore after a final result. */
      }
    }
  }, [data, key]);
  if (!data)
    return error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    );
  if (data.state === "submitted") return <StepResultView result={data} />;
  return <StepAttempt key={data.id} owner={owner} initial={data} />;
}
