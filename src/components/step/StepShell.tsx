import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Headphones, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sameStepOwner,
  stepErrorMessage,
  stepOwnerKey,
  type StepOwner,
} from "@/services/stepService";
import { useStepSession } from "./StepSession";
import type { StepSectionKind } from "@/types/step.contract";

export const stepPanel =
  "w-full max-w-[1087px] min-w-0 mx-auto bg-white rounded-none md:rounded-3xl p-4 md:p-8 font-['Outfit',sans-serif] text-[#282828]";
export const stepPrimary =
  "bg-[#232E43] hover:bg-[#1a2333] text-white rounded-lg min-h-11 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
export const stepLink =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#232E43] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1a2333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
export const stepIcon = (kind: StepSectionKind) =>
  kind === "listening" ? Headphones : kind === "reading" ? BookOpen : Languages;
export function StepFrame({
  children,
  backTo = "/student/courses",
  backLabel = "Back to courses",
}: {
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <section className={stepPanel}>
      <Link
        to={backTo}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600 underline focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      {children}
    </section>
  );
}
export function StepLoading() {
  return (
    <StepFrame>
      <p role="status" className="py-8 text-slate-600">
        Loading STEP…
      </p>
    </StepFrame>
  );
}
export function StepFailure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <StepFrame>
      <h1 className="mt-5 text-2xl font-bold">STEP</h1>
      <p role="alert" className="my-5 text-slate-600">
        {stepErrorMessage(error)}
      </p>
      <Button className={stepPrimary} onClick={retry}>
        Try loading again
      </Button>
    </StepFrame>
  );
}
export function useStepResource<T>(
  id: string,
  fetcher: (owner: StepOwner, signal: AbortSignal, id: string) => Promise<T>,
) {
  const owner = useStepSession(),
    resourceKey = `${stepOwnerKey(owner)}:${id}`;
  const [retryCount, setRetry] = useState(0);
  const [value, setValue] = useState<{
    key: string;
    data?: T;
    error?: unknown;
  }>({ key: "" });
  useEffect(() => {
    const controller = new AbortController();
    setValue({ key: resourceKey });
    void fetcher(owner, controller.signal, id)
      .then((data) => {
        if (sameStepOwner(owner, controller.signal))
          setValue({ key: resourceKey, data });
      })
      .catch((error) => {
        if (sameStepOwner(owner, controller.signal))
          setValue({ key: resourceKey, error });
      });
    return () => controller.abort();
  }, [owner, id, fetcher, resourceKey, retryCount]);
  return {
    data: value.key === resourceKey ? value.data : undefined,
    error: value.key === resourceKey ? value.error : undefined,
    retry: () => setRetry((n) => n + 1),
  };
}
