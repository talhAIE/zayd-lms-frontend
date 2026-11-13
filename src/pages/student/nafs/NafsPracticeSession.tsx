import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PracticePlayer,
  practicePanel,
} from "@/components/nafs-practice/PracticePlayer";
import {
  usePracticeOwner,
  practiceOwnerKey,
} from "@/components/nafs-practice/usePracticeOwner";
import { nafsPracticePlayerService as service } from "@/services/nafsPracticePlayerService";
import { practiceDiscoveryMessage } from "@/services/nafsPracticeDiscoveryService";
import type {
  PracticeOwner,
  PracticeSessionView,
  PracticeInProgressSession,
  PracticeCheckRequest,
  PracticeError,
} from "@/types/nafs-practice.contract";

export function NafsPracticeSessionPage() {
  const { sessionId = "" } = useParams();
  const owner = usePracticeOwner();
  return owner ? (
    <Session
      key={`${practiceOwnerKey(owner)}:${sessionId}`}
      owner={owner}
      sessionId={sessionId}
    />
  ) : (
    <section className={practicePanel}>
      <p role="alert">Please sign in again to load your practice access.</p>
      <Link className="underline min-h-11 inline-flex items-center" to="/login">
        Go to sign in
      </Link>
    </section>
  );
}
function Session({
  owner,
  sessionId,
}: {
  owner: PracticeOwner;
  sessionId: string;
}) {
  const [session, setSession] = useState<PracticeSessionView>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setSession(undefined);
    setError("");
    void service
      .session(owner, controller.signal, sessionId)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (
          data.session.state === "in_progress" &&
          (data.session.questions.length < 1 ||
            data.session.questions.length > 500 ||
            data.session.questions.length !== data.session.questionCount)
        )
          throw new Error("Invalid practice session");
        setSession(data.session);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(practiceDiscoveryMessage(e));
      });
    return () => controller.abort();
  }, [owner, sessionId, retry]);
  if (!session)
    return (
      <section className={practicePanel}>
        <Link
          to="/student/courses"
          className="underline min-h-11 inline-flex items-center"
        >
          Back to courses
        </Link>
        {error ? (
          <>
            <p role="alert" className="my-5">
              {error}
            </p>
            <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
              Try loading again
            </Button>
          </>
        ) : (
          <p role="status" className="my-5">
            Loading practice session…
          </p>
        )}
      </section>
    );
  if (session.state === "completed")
    return (
      <section className={`${practicePanel} text-center`}>
        <p className="text-sm text-blue-700 font-semibold">
          NAFS · Practice Mode · Run {session.runNumber}
        </p>
        <h1 className="text-3xl font-bold my-5">Practice finished</h1>
        <p>Your final marks</p>
        <p
          className="text-5xl font-bold my-5"
          aria-label={`${session.earnedMarks} out of ${session.totalMarks} marks`}
        >
          {session.earnedMarks} / {session.totalMarks}
        </p>
        <Link
          to={`/student/nafs/practice/collections/${session.collectionId}`}
          className="underline inline-flex items-center min-h-11"
        >
          Back to practice overview
        </Link>
      </section>
    );
  return (
    <LivePlayer
      key={`${session.id}:${retry}`}
      initial={session}
      owner={owner}
      reload={() => setRetry((n) => n + 1)}
    />
  );
}
// Phase 5 keeps unchecked choices in memory only. Phase 6 adds durable saves,
// conflict merging, draft recovery and completion/repeat orchestration.
function LivePlayer({
  initial,
  owner,
  reload,
}: {
  initial: PracticeInProgressSession;
  owner: PracticeOwner;
  reload: () => void;
}) {
  const [session, setSession] = useState(initial);
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(
      initial.selections.map((s) => [s.questionId, s.optionId]),
    ),
  );
  const [dirty, setDirty] = useState(new Set<string>());
  const [feedbackEvent, setFeedbackEvent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reloadRequired, setReloadRequired] = useState(false);
  const pending = useRef<{
    questionId: string;
    request: PracticeCheckRequest;
  }>();
  const sending = useRef(false);
  const lifetime = useRef<AbortController>();
  const seen = useRef(new Set(initial.latestChecks.map((c) => c.responseId)));
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.size || pending.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function select(questionId: string, optionId: string) {
    if (pending.current || sending.current) return;
    setSelections((s) => ({ ...s, [questionId]: optionId }));
    setDirty((s) => new Set(s).add(questionId));
    setFeedbackEvent(null);
  }
  async function check(questionId: string, replay = false) {
    const controller = lifetime.current;
    if (
      !controller ||
      controller.signal.aborted ||
      sending.current ||
      reloadRequired
    )
      return;
    if (!replay) {
      if (pending.current || !selections[questionId]) return;
      pending.current = {
        questionId,
        request: {
          requestId: crypto.randomUUID(),
          expectedRevision: session.revision,
          optionId: selections[questionId],
        },
      };
    }
    const operation = pending.current;
    if (!operation) return;
    sending.current = true;
    setBusy(true);
    setError("");
    setFeedbackEvent(null);
    try {
      const { checked } = await service.check(
        owner,
        controller.signal,
        session.id,
        operation.questionId,
        operation.request,
      );
      if (controller.signal.aborted) return;
      if (
        checked.sessionId !== session.id ||
        checked.selection.questionId !== operation.questionId ||
        checked.selection.optionId !== operation.request.optionId ||
        checked.check.questionId !== operation.questionId ||
        checked.check.optionId !== operation.request.optionId ||
        typeof checked.check.isCorrect !== "boolean" ||
        !checked.check.responseId
      )
        throw new Error("Unexpected practice check");
      if (!seen.current.has(checked.check.responseId)) {
        if (checked.revision <= operation.request.expectedRevision)
          throw new Error("Unexpected practice revision");
        seen.current.add(checked.check.responseId);
        setSession((s) => ({
          ...s,
          revision: checked.revision,
          checkedCount: checked.checkedCount,
          selections: [
            ...s.selections.filter(
              (v) => v.questionId !== operation.questionId,
            ),
            checked.selection,
          ],
          latestChecks: [
            ...s.latestChecks.filter(
              (v) => v.questionId !== operation.questionId,
            ),
            checked.check,
          ],
        }));
        setDirty((s) => {
          const next = new Set(s);
          next.delete(operation.questionId);
          return next;
        });
        // An uncertain retry can restore feedback but never replay celebration.
        if (!replay) setFeedbackEvent(checked.check.responseId);
      }
      pending.current = undefined;
    } catch (e) {
      if (controller.signal.aborted) return;
      const status = axios.isAxiosError<PracticeError>(e)
        ? e.response?.status
        : undefined;
      if (status && status >= 400 && status < 500) {
        setReloadRequired(true);
        setError(
          "This practice session changed or is no longer available. Reload the saved session before continuing.",
        );
      } else
        setError(
          "The check could not be confirmed. Retry the same check before continuing.",
        );
    } finally {
      sending.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const locked = busy || Boolean(pending.current);
  return (
    <PracticePlayer
      owner={owner}
      session={session}
      selections={selections}
      dirty={dirty}
      feedbackEvent={feedbackEvent}
      locked={locked}
      onSelect={select}
      onCheck={(questionId) => void check(questionId)}
      onNavigate={() => setFeedbackEvent(null)}
      status={
        <div className="mb-5 rounded-xl bg-slate-50 p-3 text-sm space-y-2">
          <p>
            Checked answers are saved. Unchecked choices are saved only when you
            check them.
          </p>
          {busy && <p role="status">Checking answer…</p>}
          {error && (
            <>
              <p role="alert">{error}</p>
              {!reloadRequired && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void check(pending.current?.questionId || "", true)
                  }
                >
                  Retry same check
                </Button>
              )}
              <Button variant="outline" disabled={busy} onClick={reload}>
                Reload saved practice (discard unchecked choices)
              </Button>
            </>
          )}
          <p className="text-slate-500">
            Finishing and starting new runs will be available soon.
          </p>
        </div>
      }
    />
  );
}
