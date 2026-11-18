import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { stepPracticeService } from "@/services/stepPracticeService";
import {
  sameStepOwner,
  stepOwnerKey,
  stepService,
  type StepOwner,
} from "@/services/stepService";
import type {
  StepPracticeView,
  StepPracticeAttemptView,
} from "@/types/step-practice.contract";
import type { StepSaveAnswerRequest } from "@/types/step.contract";
import {
  StepFrame,
  StepLoading,
  StepFailure,
  stepLink,
  useStepResource,
} from "./StepShell";
import { useStepSession } from "./StepSession";
import { StepPlayer } from "./StepPlayer";
import { StepResultView } from "./StepResult";

export function StepPracticeTopicPage() {
  const { topicId = "" } = useParams();
  const owner = useStepSession();
  const navigate = useNavigate();
  const { data, error, retry } = useStepResource(
    topicId,
    stepPracticeService.topic,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [issue, setIssue] = useState("");
  const lifetime = useRef<AbortController>();
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, [owner, topicId]);
  async function open(groupId: string) {
    const signal = lifetime.current?.signal;
    if (!data || !signal || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setIssue("");
    try {
      const attempt = data.attemptId
        ? { id: data.attemptId }
        : await stepService.start(owner, signal, topicId);
      if (sameStepOwner(owner, signal))
        navigate(
          `/student/step/attempts/${encodeURIComponent("id" in attempt ? attempt.id : attempt.attemptId)}?group=${encodeURIComponent(groupId)}`,
        );
    } catch {
      if (sameStepOwner(owner, signal))
        setIssue(
          "This activity could not open. Try again to resume the same progress.",
        );
    } finally {
      busyRef.current = false;
      if (sameStepOwner(owner, signal)) setBusy(false);
    }
  }
  if (!data)
    return error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    );
  return (
    <StepFrame
      backTo={`/student/step/sections/${encodeURIComponent(data.sectionId)}`}
      backLabel="Back to section"
    >
      <h1 className="text-3xl font-bold my-5">{data.title}</h1>
      <p className="text-slate-600 mb-5">
        {data.groups.length > 1
          ? "Choose a subtopic to practise. Each subtopic has its own questions and completion."
          : "Check each answer for correct or incorrect feedback. You can try again before completing."}
      </p>
      {issue && (
        <p role="alert" className="text-red-700 my-4">
          {issue}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-5">
        {data.groups.map((group) => (
          <article
            className="rounded-2xl border border-slate-200 p-5 space-y-3"
            key={group.id}
          >
            {group.id !== "activity" && (
              <p className="text-sm font-semibold text-blue-700">{group.id}</p>
            )}
            <h2 className="text-xl font-semibold">{group.title}</h2>
            <p>{group.questionIds.length} questions</p>
            <p>
              {group.state === "completed"
                ? "Completed"
                : group.state === "in_progress"
                  ? "In progress"
                  : "Not started"}{" "}
              · {group.checkedCount} checked
            </p>
            {group.result && (
              <p>
                {group.result.earnedMarks} / {group.result.totalMarks} marks
              </p>
            )}
            <Button
              disabled={busy}
              className={stepLink}
              onClick={() => void open(group.id)}
            >
              {group.state === "completed"
                ? "View subtopic"
                : group.state === "in_progress"
                  ? "Resume subtopic"
                  : data.groups.length > 1
                    ? "Start subtopic"
                    : "Start activity"}
            </Button>
          </article>
        ))}
      </div>
    </StepFrame>
  );
}
export function StepPracticeAttemptPage() {
  const { attemptId = "" } = useParams();
  const [params] = useSearchParams();
  const groupId = params.get("group");
  const owner = useStepSession();
  const { data, error, retry } = useStepResource(
    attemptId,
    stepPracticeService.attempt,
  );
  if (!data)
    return error ? (
      <StepFailure error={error} retry={retry} />
    ) : (
      <StepLoading />
    );
  if ("state" in data) return <StepResultView result={data} />;
  const group =
    data.groups.find((g) => g.id === groupId) ??
    (!groupId && data.groups.length === 1 ? data.groups[0] : undefined);
  if (!group)
    return (
      <StepFrame
        backTo={`/student/step/topics/${encodeURIComponent(data.attempt.topicId)}`}
        backLabel="Back to subtopics"
      >
        <p className="my-5">Choose a subtopic to continue.</p>
      </StepFrame>
    );
  return (
    <PracticeSession
      key={`${stepOwnerKey(owner)}:${attemptId}:${group.id}`}
      owner={owner}
      initial={data}
      groupId={group.id}
    />
  );
}
type Pending =
  | { kind: "check"; questionId: string; body: StepSaveAnswerRequest }
  | { kind: "complete"; body: { requestId: string; expectedRevision: number } };
function PracticeSession({
  owner,
  initial,
  groupId,
}: {
  owner: StepOwner;
  initial: StepPracticeView;
  groupId: string;
}) {
  const [view, setView] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initial.attempt.selections.map((s) => [s.questionId, s.optionId]),
    ),
  );
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const pending = useRef<Pending | null>(null);
  const [needsRetry, setNeedsRetry] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [issue, setIssue] = useState("");
  const [animationKey, setAnimationKey] = useState<string | null>(null);
  const lifetime = useRef<AbortController>();
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const storageKey = `step:practice:v1:${encodeURIComponent(stepOwnerKey(owner))}:${initial.attempt.id}:${groupId}`;
  const group = view.groups.find((g) => g.id === groupId)!;
  const questions = view.attempt.questions.filter((q) =>
    group.questionIds.includes(q.id),
  );
  const completed = group.state === "completed" || !!view.result;
  const position = Math.min(Math.max(index, 0), questions.length - 1);
  const question = questions[position];
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    try {
      const draft = JSON.parse(
        sessionStorage.getItem(storageKey) || "null",
      ) as {
        version: number;
        choices: Record<string, string>;
        index: number;
        pending: Pending | null;
      } | null;
      if (draft && draft.version === initial.attempt.contentVersion) {
        const choices = Object.fromEntries(
          Object.entries(draft.choices ?? {}).filter(([qid, oid]) =>
            questions.some(
              (q) => q.id === qid && q.options.some((o) => o.id === oid),
            ),
          ),
        );
        if (!completed) setSelections((saved) => ({ ...saved, ...choices }));
        if (Number.isInteger(draft.index))
          setIndex(Math.max(0, Math.min(draft.index, questions.length - 1)));
        const request = draft.pending;
        if (
          request &&
          !completed &&
          Number.isInteger(request.body?.expectedRevision) &&
          typeof request.body?.requestId === "string" &&
          (request.kind === "complete" ||
            (request.kind === "check" &&
              questions.some(
                (q) =>
                  q.id === request.questionId &&
                  q.options.some((o) => o.id === request.body.optionId),
              )))
        ) {
          const recovered =
            request.kind === "check" &&
            initial.feedback.some(
              (r) => r.responseId === request.body.requestId,
            );
          if (recovered)
            setSelections(
              Object.fromEntries(
                initial.attempt.selections.map((s) => [
                  s.questionId,
                  s.optionId,
                ]),
              ),
            );
          else {
            pending.current = request;
            setNeedsRetry(true);
            setIssue(
              "An interrupted check or completion needs to be confirmed. Retry the saved request.",
            );
          }
        }
      }
    } catch {
      setStorageWarning(true);
    }
    setReady(true);
    return () => controller.abort();
    // Initial state and group are owned by this keyed session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, initial, storageKey]);
  const persist = useCallback(
    (request: Pending | null = pending.current) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            version: view.attempt.contentVersion,
            choices: selections,
            index: position,
            pending: request,
          }),
        );
      } catch {
        setStorageWarning(true);
      }
    },
    [storageKey, view.attempt.contentVersion, selections, position],
  );
  useEffect(() => {
    if (ready) persist();
  }, [ready, persist]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (pending.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  async function mutate(request: Pending) {
    const signal = lifetime.current?.signal;
    if (!signal || !sameStepOwner(owner, signal) || busyRef.current) return;
    busyRef.current = true;
    pending.current = request;
    persist(request);
    setBusy(true);
    setNeedsRetry(false);
    setIssue("");
    setConflict(false);
    try {
      const result: StepPracticeAttemptView =
        request.kind === "check"
          ? await stepPracticeService.check(
              owner,
              signal,
              view.attempt.id,
              request.questionId,
              request.body,
            )
          : await stepPracticeService.complete(
              owner,
              signal,
              view.attempt.id,
              groupId,
              request.body,
            );
      if (!sameStepOwner(owner, signal)) return;
      if ("state" in result)
        throw new Error("Practice was replaced by a final result");
      setView(result);
      if (request.kind === "check") {
        const checked = result.feedback.find(
          (f) =>
            f.questionId === request.questionId &&
            f.responseId === request.body.requestId,
        );
        if (!checked) {
          setConflict(true);
          setIssue(
            "Server progress changed in another tab. Load saved choices before continuing.",
          );
        } else {
          setSelections((old) => ({
            ...old,
            [request.questionId]: checked.optionId,
          }));
          setAnimationKey(checked.responseId);
        }
      }
      pending.current = null;
      persist(null);
      setNeedsRetry(false);
    } catch (error) {
      if (!sameStepOwner(owner, signal)) return;
      if (
        axios.isAxiosError(error) &&
        [400, 403, 404, 409].includes(error.response?.status ?? 0)
      ) {
        setConflict(true);
        setIssue(
          "Server progress or access changed. Load saved choices before continuing.",
        );
      } else {
        setNeedsRetry(true);
        setIssue(
          "The result could not be confirmed. Retry to check the same saved request.",
        );
      }
    } finally {
      busyRef.current = false;
      if (sameStepOwner(owner, signal)) setBusy(false);
    }
  }
  async function reload() {
    const signal = lifetime.current?.signal;
    if (!signal || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await stepPracticeService.attempt(
        owner,
        signal,
        view.attempt.id,
      );
      if (!sameStepOwner(owner, signal)) return;
      if ("state" in result) {
        setIssue(
          "This activity has already been submitted. Return to the topic to view its result.",
        );
        return;
      }
      setView(result);
      setSelections(
        Object.fromEntries(
          result.attempt.selections.map((s) => [s.questionId, s.optionId]),
        ),
      );
      pending.current = null;
      setNeedsRetry(false);
      setConflict(false);
      setIssue("");
      setAnimationKey(null);
      sessionStorage.removeItem(storageKey);
    } catch {
      if (sameStepOwner(owner, signal))
        setIssue("Saved progress could not load. Please try again.");
    } finally {
      busyRef.current = false;
      if (sameStepOwner(owner, signal)) setBusy(false);
    }
  }
  const locked = busy || !ready || needsRetry || conflict;
  const allChecked = questions.every((q) =>
    view.feedback.some(
      (r) => r.questionId === q.id && r.optionId === selections[q.id],
    ),
  );
  if (!question)
    return (
      <StepFrame>
        <p role="alert">This subtopic has no questions.</p>
      </StepFrame>
    );
  return (
    <>
      {(issue || storageWarning) && (
        <div className="mx-auto max-w-[1087px] rounded-xl border bg-amber-50 p-4 space-y-3">
          {issue && <p role="alert">{issue}</p>}
          {needsRetry && (
            <Button
              disabled={busy}
              onClick={() => pending.current && void mutate(pending.current)}
            >
              Retry saved request
            </Button>
          )}
          {conflict && (
            <Button disabled={busy} onClick={() => void reload()}>
              Use saved choices
            </Button>
          )}
          {storageWarning && (
            <p>
              Device recovery storage is unavailable. Keep this page open until
              the check is confirmed.
            </p>
          )}
        </div>
      )}
      {completed && (
        <div
          className="mx-auto max-w-[1087px] rounded-xl bg-green-50 p-4"
          role="status"
        >
          Subtopic completed
          {group.result
            ? ` · ${group.result.earnedMarks} / ${group.result.totalMarks} marks`
            : ""}
          .{" "}
          <Link
            className="underline"
            to={`/student/step/topics/${encodeURIComponent(view.attempt.topicId)}`}
          >
            Back to {view.attempt.title}
          </Link>
        </div>
      )}
      <StepPlayer
        owner={owner}
        attempt={{ ...view.attempt, title: group.title, questions }}
        selections={selections}
        currentIndex={position}
        practice
        feedback={view.feedback}
        feedbackKey={animationKey}
        completed={completed}
        backTo={`/student/step/topics/${encodeURIComponent(view.attempt.topicId)}`}
        backLabel={`Back to ${view.attempt.title}`}
        onNavigate={(i) => {
          setIndex(i);
          setAnimationKey(null);
        }}
        onSelect={
          completed
            ? undefined
            : (qid, oid) => {
                setSelections((old) => ({ ...old, [qid]: oid }));
                setAnimationKey(null);
              }
        }
        busy={locked}
        onCheck={() =>
          void mutate({
            kind: "check",
            questionId: question.id,
            body: {
              optionId: selections[question.id],
              expectedRevision: view.attempt.revision,
              requestId: crypto.randomUUID(),
            },
          })
        }
        checkDisabled={completed}
        onSubmit={
          completed
            ? undefined
            : () => {
                if (allChecked) setConfirm(true);
              }
        }
        submitDisabled={!allChecked || completed}
        saveStatus={
          <span>
            {busy
              ? "Saving checked progress…"
              : `${questions.filter((q) => view.feedback.some((r) => r.questionId === q.id && r.optionId === selections[q.id])).length} of ${questions.length} checked`}
          </span>
        }
      />
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>Complete this subtopic?</DialogTitle>
          <DialogDescription>
            Your checked answers will be final for this subtopic. You can keep
            practising before completing.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep practising
            </Button>
            <Button
              disabled={locked || !allChecked}
              onClick={() => {
                setConfirm(false);
                void mutate({
                  kind: "complete",
                  body: {
                    expectedRevision: view.attempt.revision,
                    requestId: crypto.randomUUID(),
                  },
                });
              }}
            >
              Confirm completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
