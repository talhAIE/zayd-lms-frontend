import {
  selectedPracticeOptions,
  writtenPracticeText,
  practiceMultiToken,
  hasPracticeResponse,
} from "./practiceAnswers";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradedAnswerSurface } from "@/components/learning/AnswerFeedback";
import { NafsText } from "@/components/nafs/NafsText";
import { PracticeMedia } from "./PracticeMedia";
import type {
  PracticeOwner,
  PracticeInProgressSession,
  PracticeCheckView,
} from "@/types/nafs-practice.contract";

export const practicePanel =
  "w-full max-w-[1087px] mx-auto bg-white rounded-3xl p-4 md:p-8 font-['Outfit',sans-serif] text-[#282828]";
const primary = "bg-[#232E43] hover:bg-[#1a2333] text-white min-h-11";
export function PracticeText({
  text,
  emphasisTerms,
}: {
  text: string;
  emphasisTerms: string[];
}) {
  const terms = emphasisTerms
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!terms.length) return <NafsText text={text} />;
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  return (
    <>
      {text.split(pattern).map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <strong key={i}>
            <NafsText text={part} />
          </strong>
        ) : (
          <NafsText key={i} text={part} />
        ),
      )}
    </>
  );
}
export interface PracticePlayerProps {
  owner: PracticeOwner;
  session: PracticeInProgressSession;
  selections: Record<string, string>;
  dirty: Set<string>;
  feedbackEvent: string | null;
  locked: boolean;
  status: ReactNode;
  onSelect: (questionId: string, optionId: string) => void;
  onCheck: (questionId: string) => void;
  onNavigate: () => void;
}
function matchingCheck(
  session: PracticeInProgressSession,
  selections: Record<string, string>,
  dirty: Set<string>,
  questionId: string,
): PracticeCheckView | undefined {
  if (dirty.has(questionId)) return;
  return session.latestChecks.find(
    (c) => c.questionId === questionId && c.optionId === selections[questionId],
  );
}
export function PracticePlayer({
  owner,
  session,
  selections,
  dirty,
  feedbackEvent,
  locked,
  status,
  onSelect,
  onCheck,
  onNavigate,
}: PracticePlayerProps) {
  const [index, setIndex] = useState(0);
  const [passageOpen, setPassageOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusAfterNavigation = useRef(false);
  useEffect(() => {
    if (focusAfterNavigation.current) {
      heading.current?.focus();
      focusAfterNavigation.current = false;
    }
  }, [index]);
  const question = session.questions[index];
  const passage = session.passages.find((p) => p.id === question.passageId);
  const checked = matchingCheck(session, selections, dirty, question.id);
  const checkedCount = session.questions.filter((q) =>
    matchingCheck(session, selections, dirty, q.id),
  ).length;
  function go(next: number) {
    if (locked) return;
    focusAfterNavigation.current = true;
    setPassageOpen(false);
    onNavigate();
    setIndex(next);
  }
  return (
    <section className={practicePanel}>
      <Link
        to={`/student/nafs/practice/collections/${session.collectionId}`}
        className="underline text-sm text-slate-600 inline-flex items-center min-h-11"
      >
        Back to practice overview
      </Link>
      <div className="flex flex-wrap gap-3 justify-between items-start my-5">
        <div>
          <p className="text-sm font-semibold text-blue-700">
            NAFS · Practice Mode · Run {session.runNumber}
          </p>
          <h1
            className="text-xl md:text-2xl font-bold mt-2"
            ref={heading}
            tabIndex={-1}
          >
            Question {index + 1} of {session.questionCount}
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          {checkedCount} of {session.questionCount} checked
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Practice questions checked"
        aria-valuemin={0}
        aria-valuemax={session.questionCount}
        aria-valuenow={checkedCount}
        className="h-1.5 rounded-full bg-slate-100 mb-5"
      >
        <div
          className="h-full rounded-full bg-[#4F8DFB]"
          style={{ width: `${(checkedCount / session.questionCount) * 100}%` }}
        />
      </div>
      {status}
      <div
        key={question.id}
        className={passage ? "grid lg:grid-cols-2 gap-6" : ""}
      >
        {passage && (
          <aside
            aria-label="Reading passage"
            className="min-w-0 rounded-2xl border p-4 md:p-5"
          >
            <Button
              variant="outline"
              className="lg:hidden min-h-11 mb-3"
              aria-expanded={passageOpen}
              aria-controls="practice-passage"
              onClick={() => setPassageOpen((v) => !v)}
            >
              {passageOpen ? "Hide passage" : "Read passage"}
            </Button>
            <div
              id="practice-passage"
              className={`${passageOpen ? "block" : "hidden"} lg:block space-y-4 whitespace-pre-wrap break-words leading-7`}
            >
              <h2 className="font-semibold">Reading passage</h2>
              {passage.paragraphs.map((text, i) => (
                <p key={i}>
                  <PracticeText
                    text={text}
                    emphasisTerms={passage.emphasisTerms}
                  />
                </p>
              ))}
              {passage.figure && (
                <PracticeMedia
                  owner={owner}
                  sessionId={session.id}
                  asset={passage.figure}
                />
              )}
            </div>
          </aside>
        )}
        <div className="min-w-0">
          <h2
            id="practice-question"
            className={
              question.stemIsFigure
                ? "sr-only"
                : "text-lg font-semibold whitespace-pre-wrap break-words leading-8 mb-4"
            }
          >
            <PracticeText
              text={question.stem}
              emphasisTerms={question.emphasisTerms}
            />
          </h2>
          {question.accessibleVisualText && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">
              {question.accessibleVisualText}
            </p>
          )}
          {question.figure && (
            <PracticeMedia
              owner={owner}
              sessionId={session.id}
              asset={question.figure}
            />
          )}
          <fieldset disabled={locked} className="space-y-3 mt-5">
            <legend className="sr-only">
              {question.responseKind === "written"
                ? "Write your answer"
                : question.responseKind === "multi_choice"
                  ? "Select all correct answers"
                  : "Choose one answer"}{" "}
              for question {index + 1}
            </legend>
            {question.responseKind === "written" && (
              <GradedAnswerSurface
                result={checked?.isCorrect ?? null}
                feedbackKey={checked ? feedbackEvent : null}
                className="rounded-xl border p-3"
              >
                <label
                  htmlFor="practice-written"
                  className="block font-semibold mb-2"
                >
                  Your answer
                </label>
                <textarea
                  id="practice-written"
                  className="w-full min-h-40 border rounded-lg p-3"
                  maxLength={4000}
                  value={writtenPracticeText(selections[question.id])}
                  onChange={(e) =>
                    onSelect(
                      question.id,
                      JSON.stringify({ text: e.target.value }),
                    )
                  }
                />
                <p className="text-sm text-slate-500">
                  {writtenPracticeText(selections[question.id]).length} / 4000
                </p>
              </GradedAnswerSurface>
            )}
            {question.responseKind === "multi_choice" && (
              <p className="text-sm">Select all correct answers.</p>
            )}
            <GradedAnswerSurface
              result={
                question.responseKind === "multi_choice"
                  ? checked?.isCorrect
                  : null
              }
              feedbackKey={
                question.responseKind === "multi_choice" && checked
                  ? feedbackEvent
                  : null
              }
              className="space-y-3"
            >
              {question.options.map((option) => {
                const selected = selectedPracticeOptions(
                  selections[question.id],
                ).includes(option.id);
                return (
                  <GradedAnswerSurface
                    key={option.id}
                    result={
                      selected && question.responseKind !== "multi_choice"
                        ? checked?.isCorrect
                        : null
                    }
                    feedbackKey={
                      selected &&
                      checked &&
                      question.responseKind !== "multi_choice"
                        ? feedbackEvent
                        : null
                    }
                    className={`rounded-xl border min-w-0 ${selected ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}
                  >
                    <label className="flex items-start gap-3 p-4 min-h-12 cursor-pointer">
                      <input
                        type={
                          question.responseKind === "multi_choice"
                            ? "checkbox"
                            : "radio"
                        }
                        name={`practice-${question.id}`}
                        value={option.id}
                        checked={selected}
                        aria-label={`${option.label}. ${option.text || option.image?.alt || "Image option"}`}
                        onChange={() =>
                          onSelect(
                            question.id,
                            question.responseKind === "multi_choice"
                              ? practiceMultiToken(
                                  selected
                                    ? selectedPracticeOptions(
                                        selections[question.id],
                                      ).filter((id) => id !== option.id)
                                    : [
                                        ...selectedPracticeOptions(
                                          selections[question.id],
                                        ),
                                        option.id,
                                      ],
                                )
                              : option.id,
                          )
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      />
                      <span className="min-w-0 whitespace-pre-wrap break-words leading-7">
                        <span className="font-semibold mr-2" aria-hidden="true">
                          {option.label}.
                        </span>
                        <PracticeText
                          text={option.text}
                          emphasisTerms={option.emphasisTerms}
                        />
                      </span>
                    </label>
                    {option.image && (
                      <div className="px-4 pb-4">
                        <PracticeMedia
                          owner={owner}
                          sessionId={session.id}
                          asset={option.image}
                        />
                      </div>
                    )}
                  </GradedAnswerSurface>
                );
              })}
            </GradedAnswerSurface>
          </fieldset>
          <p
            role="status"
            aria-label="Answer feedback"
            className="my-4 text-sm font-semibold min-h-6"
          >
            {checked
              ? checked.isCorrect
                ? "Correct!"
                : "Incorrect. You can try again."
              : selections[question.id]
                ? "Check this answer to see your feedback."
                : question.responseKind === "written"
                  ? "Write an answer, then check it."
                  : "Choose an answer, then check it."}
          </p>
          <Button
            className={primary}
            disabled={
              locked || !hasPracticeResponse(question, selections[question.id])
            }
            onClick={() => onCheck(question.id)}
          >
            Check Answer
          </Button>
        </div>
      </div>
      <div className="flex justify-between gap-3 my-6">
        <Button
          variant="outline"
          className="min-h-11"
          disabled={locked || index === 0}
          onClick={() => go(index - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Previous
        </Button>
        <Button
          className={primary}
          disabled={locked || index === session.questionCount - 1}
          onClick={() => go(index + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
        </Button>
      </div>
      <nav aria-label="Practice question navigator" className="border-t pt-5">
        <h2 className="font-semibold mb-3">Questions</h2>
        <div className="flex flex-wrap gap-2">
          {session.questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              disabled={locked}
              aria-label={`Question ${i + 1}, ${matchingCheck(session, selections, dirty, q.id) ? "checked" : "unchecked"}`}
              aria-current={index === i ? "step" : undefined}
              onClick={() => go(i)}
              className={`min-h-11 min-w-11 px-2 rounded-lg border text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${index === i ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"} ${matchingCheck(session, selections, dirty, q.id) ? "bg-blue-50 text-blue-800" : "bg-white text-slate-600"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Blue fill means checked, regardless of whether the answer was correct.
        </p>
      </nav>
    </section>
  );
}
