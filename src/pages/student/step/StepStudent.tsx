import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stepService } from "@/services/stepService";
import type { StepResult, StepTopicOverview } from "@/types/step.contract";
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
import { StepPlayer } from "@/components/step/StepPlayer";

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
    <StepOverviewView topic={data} />
  );
}
export function StepResultView({ result }: { result: StepResult }) {
  return (
    <StepFrame
      backTo={`/student/step/topics/${encodeURIComponent(result.topicId)}`}
      backLabel="Back to activity"
    >
      <div className="py-12 text-center">
        <CheckCircle2
          className="mx-auto mb-5 h-14 w-14 text-[#4F8DFB]"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold">Activity completed</h1>
        <p className="mt-4 text-4xl font-bold">
          {result.earnedMarks} / {result.totalMarks}
        </p>
        <p className="mt-3 text-sm text-slate-600">Final marks</p>
      </div>
    </StepFrame>
  );
}
export function StepAttemptPage() {
  const { attemptId = "" } = useParams();
  return <Attempt key={attemptId} id={attemptId} />;
}
function Attempt({ id }: { id: string }) {
  const owner = useStepSession(),
    { data, error, retry } = useStepResource(id, stepService.attempt),
    [index, setIndex] = useState(0);
  if (!data)
    return error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    );
  if (data.state === "submitted") return <StepResultView result={data} />;
  // Read-side shell. Phase 6 supplies durable selection/submission callbacks.
  return (
    <StepPlayer
      owner={owner}
      attempt={data}
      currentIndex={index}
      onNavigate={setIndex}
      selections={Object.fromEntries(
        data.selections.map((s) => [s.questionId, s.optionId]),
      )}
      saveStatus="Saved answers"
    />
  );
}
