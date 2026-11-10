import { CheckCircle2 } from "lucide-react";
import type { StepResult } from "@/types/step.contract";
import { StepFrame } from "./StepShell";
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
