import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import type { SparkQuestionFeedback } from "@/services/sparkScienceService";

export function ScienceQuizFeedback({
  feedback,
  yourAnswer,
}: {
  feedback?: SparkQuestionFeedback;
  yourAnswer: string;
}) {
  const correct = feedback ? feedback.score === feedback.maxScore : null;
  const partial = !!feedback && feedback.score > 0 && !correct;
  const Icon = correct ? CheckCircle2 : partial ? MinusCircle : XCircle;
  const title = correct
    ? "Correct"
    : partial
      ? "Partially correct"
      : "Incorrect";
  return (
    <div
      hidden={!feedback}
      data-science-explanation
      className={`relative overflow-hidden rounded-xl border-l-4 p-4 space-y-3 ${correct ? "border-green-600 bg-green-50 text-green-950" : partial ? "border-amber-600 bg-amber-50 text-amber-950" : "border-red-600 bg-red-50 text-red-950"}`}
    >
      {feedback && (
        <>
          <div
            className="flex items-center justify-between gap-3"
            role="status"
            aria-live="polite"
          >
            <h3 className="flex items-center gap-2 font-bold">
              <Icon aria-hidden="true" size={22} />
              {title}
            </h3>
          </div>
          <p className="whitespace-pre-wrap break-words">
            <strong>Your answer: </strong>
            {yourAnswer}
          </p>
          {feedback.correctAnswer && (
            <p className="whitespace-pre-wrap break-words">
              <strong>Correct answer: </strong>
              {feedback.correctAnswer}
            </p>
          )}
          {feedback.feedback &&
            !/^(Correct\.|Incorrect\.|Partially correct\.)$/.test(
              feedback.feedback,
            ) && <p className="whitespace-pre-wrap">{feedback.feedback}</p>}
          {feedback.contentExplanation && (
            <div className="space-y-1">
              <h4 className="font-bold">Content explanation</h4>
              <p className="whitespace-pre-wrap break-words">
                {feedback.contentExplanation}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
