import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StepInProgressAttempt } from "@/types/step.contract";
import {
  sameStepOwner,
  stepOwnerKey,
  stepService,
  type StepOwner,
} from "@/services/stepService";
import {
  StepAttemptSession,
  type StepAttemptState,
  type StepJournal,
} from "./attemptSession";
import { StepPlayer } from "./StepPlayer";
import { stepPrimary } from "./StepShell";
import { StepResultView } from "./StepResult";

export const stepJournalKey = (owner: StepOwner, attemptId: string) =>
  `step:attempt:v1:${encodeURIComponent(stepOwnerKey(owner))}:${encodeURIComponent(attemptId)}`;
export function StepAttempt({
  owner,
  initial,
}: {
  owner: StepOwner;
  initial: StepInProgressAttempt;
}) {
  const engine = useRef<StepAttemptSession>();
  const [view, setView] = useState<StepAttemptState>({
    attempt: initial,
    selections: Object.fromEntries(
      initial.selections.map((s) => [s.questionId, s.optionId]),
    ),
    index: 0,
    status: "checking",
    message: "Checking device recovery…",
    locked: true,
  });
  const [confirm, setConfirm] = useState(false),
    [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    const controller = new AbortController(),
      key = stepJournalKey(owner, initial.id);
    let journal: StepJournal | undefined;
    try {
      journal = JSON.parse(sessionStorage.getItem(key) || "null") ?? undefined;
    } catch {
      setStorageWarning(true);
    }
    const persist = (value: StepJournal | null) => {
      if (!sameStepOwner(owner, controller.signal)) return;
      try {
        if (value) sessionStorage.setItem(key, JSON.stringify(value));
        else sessionStorage.removeItem(key);
      } catch {
        setStorageWarning(true);
      }
    };
    const transport = {
      read: () => stepService.attempt(owner, controller.signal, initial.id),
      save: (q: string, r: Parameters<typeof stepService.save>[4]) =>
        stepService.save(owner, controller.signal, initial.id, q, r),
      submit: (r: Parameters<typeof stepService.submit>[3]) =>
        stepService.submit(owner, controller.signal, initial.id, r),
    };
    let session: StepAttemptSession;
    try {
      session = new StepAttemptSession(
        initial,
        transport,
        (s) => {
          if (sameStepOwner(owner, controller.signal)) setView(s);
        },
        persist,
        journal,
      );
    } catch {
      setStorageWarning(true);
      session = new StepAttemptSession(
        initial,
        transport,
        (s) => {
          if (sameStepOwner(owner, controller.signal)) setView(s);
        },
        persist,
      );
    }
    engine.current = session;
    session.publish();
    const online = () => {
      if (session.state.status === "error") void session.retry();
      else if (session.state.status === "uncertain")
        void session.checkSubmission();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (session.state.status !== "saved") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", unload);
    return () => {
      session.dispose();
      controller.abort();
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", unload);
    };
  }, [owner, initial]);
  if (view.attempt.state === "submitted")
    return <StepResultView result={view.attempt} />;
  const canFinish = engine.current?.canFinish === true;
  const status = (
    <div className="space-y-2 text-sm">
      <p role="status" aria-live="polite">
        {view.status === "saved"
          ? "All answers saved"
          : view.status === "saving"
            ? "Saving answers…"
            : view.message}
      </p>
      {view.status === "error" && (
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => void engine.current?.retry()}
        >
          Retry saving
        </Button>
      )}
      {view.status === "conflict" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => void engine.current?.resolveConflict(true)}
          >
            Keep my device answers
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => void engine.current?.resolveConflict(false)}
          >
            Use saved answers
          </Button>
        </div>
      )}
      {view.status === "uncertain" && (
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => void engine.current?.checkSubmission()}
        >
          Check submission
        </Button>
      )}
      {storageWarning && (
        <p role="alert">
          Device recovery storage is unavailable. Keep this page open until
          saving and submission are confirmed.
        </p>
      )}
    </div>
  );
  return (
    <>
      <StepPlayer
        owner={owner}
        attempt={view.attempt}
        selections={view.selections}
        currentIndex={view.index}
        onNavigate={(i) => engine.current?.navigate(i)}
        onSelect={(q, o) => engine.current?.select(q, o)}
        onSubmit={() => {
          if (engine.current?.canFinish) setConfirm(true);
        }}
        busy={view.locked}
        submitDisabled={!canFinish}
        saveStatus={status}
      />
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-lg">
          <DialogTitle>Submit this activity?</DialogTitle>
          <DialogDescription>
            All {initial.questions.length} answers are saved. Submission is
            final. You cannot change your answers or take this activity again.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep reviewing
            </Button>
            <Button
              className={stepPrimary}
              disabled={!canFinish}
              onClick={() => {
                setConfirm(false);
                void engine.current?.finish();
              }}
            >
              Confirm submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
