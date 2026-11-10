import { type ReactNode, useEffect, useRef } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepInProgressAttempt, StepPassage } from "@/types/step.contract";
import type { StepOwner } from "@/services/stepService";
import { StepAudioPlayer } from "./StepAudioPlayer";
import { StepFrame, stepPrimary } from "./StepShell";

export interface StepPlayerProps {
  owner: StepOwner;
  attempt: StepInProgressAttempt;
  selections: Readonly<Record<string, string>>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSelect?: (questionId: string, optionId: string) => void;
  onSubmit?: () => void;
  busy?: boolean;
  saveStatus?: ReactNode;
}
function Passage({ passage }: { passage: StepPassage }) {
  return (
    <>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <BookOpen className="h-5 w-5 text-[#4F8DFB]" aria-hidden="true" />
        Reading passage
      </h2>
      <h3 dir="auto" className="mb-3 font-semibold [overflow-wrap:anywhere]">
        {passage.title}
      </h3>
      <div className="space-y-4 text-[15px] leading-7 text-slate-700">
        {passage.paragraphs.map((p, i) => (
          <p
            key={i}
            dir="auto"
            className="whitespace-pre-wrap [overflow-wrap:anywhere]"
          >
            {p}
          </p>
        ))}
      </div>
    </>
  );
}
// Controlled presentation only: the session driver owns durable choices and submission.
export function StepPlayer({
  owner,
  attempt,
  selections,
  currentIndex,
  onNavigate,
  onSelect,
  onSubmit,
  busy = false,
  saveStatus,
}: StepPlayerProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const index = Math.max(
      0,
      Math.min(currentIndex, attempt.questions.length - 1),
    ),
    question = attempt.questions[index];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [index]);
  if (!question)
    return (
      <StepFrame>
        <p role="alert" className="py-6">
          This activity has no available questions.
        </p>
      </StepFrame>
    );
  const answered = attempt.questions.filter((q) =>
    q.options.some((o) => o.id === selections[q.id]),
  ).length;
  const readOnly = !onSelect;
  const go = (next: number) => {
    if (!busy)
      onNavigate(Math.max(0, Math.min(attempt.questions.length - 1, next)));
  };
  return (
    <StepFrame
      backTo={`/student/step/topics/${encodeURIComponent(attempt.topicId)}`}
      backLabel="Back to activity"
    >
      <div className="mb-5 mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold capitalize text-blue-700">
            STEP · {attempt.kind}
          </p>
          <h1
            dir="auto"
            className="mt-1 text-2xl font-bold md:text-3xl [overflow-wrap:anywhere]"
          >
            {attempt.title}
          </h1>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
          One attempt · No time limit
        </span>
      </div>
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
          <span role="status" aria-live="polite">
            {answered} of {attempt.questions.length} answered
          </span>
          {saveStatus && <span role="status">{saveStatus}</span>}
        </div>
        <progress
          aria-label="Answered questions"
          value={answered}
          max={attempt.questions.length}
          className="h-2 w-full appearance-none overflow-hidden rounded-full bg-slate-100 [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-[#4F8DFB] [&::-moz-progress-bar]:bg-[#4F8DFB]"
        />
      </div>
      {attempt.kind === "listening" && attempt.audio && (
        <StepAudioPlayer
          owner={owner}
          attemptId={attempt.id}
          audio={attempt.audio}
        />
      )}
      <div
        className={`grid min-w-0 gap-5 ${attempt.passage ? "lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" : ""}`}
      >
        {attempt.passage && (
          <>
            <aside
              aria-label="Reading passage panel"
              className="hidden min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:sticky lg:top-5 lg:block lg:max-h-[75vh] lg:overflow-y-auto"
            >
              <Passage passage={attempt.passage} />
            </aside>
            <details className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:hidden">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600">
                Read passage
              </summary>
              <div className="pt-3">
                <Passage passage={attempt.passage} />
              </div>
            </details>
          </>
        )}
        <div className="min-w-0 rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h2
            id="step-question-heading"
            tabIndex={-1}
            ref={heading}
            className="mb-3 text-lg font-bold outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Question {index + 1} of {attempt.questions.length}
          </h2>
          {question.grouping && (
            <p
              dir="auto"
              className="mb-3 text-xs font-semibold text-blue-700 [overflow-wrap:anywhere]"
            >
              {question.grouping.title} · {question.grouping.level}
            </p>
          )}
          {question.instruction && (
            <p
              dir="auto"
              className="mb-3 whitespace-pre-wrap text-sm text-slate-600 [overflow-wrap:anywhere]"
            >
              {question.instruction}
            </p>
          )}
          {question.stem && (
            <p
              dir="auto"
              className="mb-5 whitespace-pre-wrap text-base font-medium leading-7 [overflow-wrap:anywhere]"
            >
              {question.stem}
            </p>
          )}
          <fieldset
            aria-labelledby="step-question-heading"
            className="min-w-0 space-y-3"
          >
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option) => {
              const selected = selections[question.id] === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex min-h-14 min-w-0 items-start gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 ${selected ? "border-[#4F8DFB] bg-[#EFF5FF]" : "border-slate-200 bg-white"} ${readOnly || busy ? "" : "cursor-pointer hover:border-blue-300"}`}
                >
                  <input
                    type="radio"
                    name={`step-${question.id}`}
                    value={option.id}
                    aria-label={`${option.label}. ${option.text}`}
                    checked={selected}
                    disabled={readOnly || busy}
                    onChange={() => onSelect?.(question.id, option.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#4F8DFB]"
                  />
                  <span className="shrink-0 font-semibold text-slate-600">
                    {option.label}.
                  </span>
                  <span
                    dir="auto"
                    className="min-w-0 whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]"
                  >
                    {option.text}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div className="mt-6 flex justify-between gap-3">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busy || index === 0}
              onClick={() => go(index - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busy || index === attempt.questions.length - 1}
              onClick={() => go(index + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      <nav aria-label="Question navigation" className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Questions</h2>
        <div className="flex flex-wrap gap-2">
          {attempt.questions.map((q, i) => {
            const done = q.options.some((o) => o.id === selections[q.id]);
            return (
              <button
                type="button"
                key={q.id}
                disabled={busy}
                aria-label={`Question ${i + 1}, ${done ? "answered" : "unanswered"}`}
                aria-current={i === index ? "step" : undefined}
                onClick={() => go(i)}
                className={`flex h-11 min-w-11 items-center justify-center rounded-lg border px-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${i === index ? "border-[#232E43] bg-[#232E43] text-white" : done ? "border-blue-200 bg-[#EFF5FF] text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </nav>
      <footer className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {readOnly
            ? "Your saved answers are shown above."
            : "Answer every question. Marks appear after submission."}
        </p>
        <Button
          className={`${stepPrimary} px-6`}
          onClick={onSubmit}
          disabled={
            !onSubmit ||
            readOnly ||
            busy ||
            answered !== attempt.questions.length
          }
        >
          Submit activity
        </Button>
      </footer>
    </StepFrame>
  );
}
