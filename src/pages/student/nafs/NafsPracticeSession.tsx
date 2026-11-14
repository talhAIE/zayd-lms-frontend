import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PracticePlayer,
  practicePanel,
} from "@/components/nafs-practice/PracticePlayer";
import {
  usePracticeOwner,
  practiceOwnerKey,
} from "@/components/nafs-practice/usePracticeOwner";
import {
  PracticeSession,
  parsePracticeDraft,
  type PracticeState,
} from "@/components/nafs-practice/practiceSession";
import {
  practiceDraftKey,
  readPracticeRecovery,
  writePracticeRecovery,
  openPracticeRun,
  practiceBackups,
  ignorePracticeBackups,
  shouldOfferPracticeBackups,
  clearCompletedPracticeRecovery,
} from "@/components/nafs-practice/practiceRecovery";
import { nafsPracticePlayerService as service } from "@/services/nafsPracticePlayerService";
import {
  practiceDiscoveryMessage,
  samePracticeOwner,
} from "@/services/nafsPracticeDiscoveryService";
import type {
  PracticeOwner,
  PracticeSessionView,
  PracticeInProgressSession,
  PracticeCompletedSession,
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
    const guard = () => {
      if (!samePracticeOwner(owner, controller.signal)) {
        controller.abort();
        setSession(undefined);
        setError("Practice account changed. Please sign in again.");
      }
    };
    window.addEventListener("storage", guard);
    window.addEventListener("focus", guard);
    document.addEventListener("visibilitychange", guard);
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
    return () => {
      controller.abort();
      window.removeEventListener("storage", guard);
      window.removeEventListener("focus", guard);
      document.removeEventListener("visibilitychange", guard);
    };
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
  return session.state === "completed" ? (
    <PracticeResult session={session} owner={owner} />
  ) : (
    <RecoveryGate initial={session} owner={owner} />
  );
}
function PracticeResult({
  session,
  owner,
}: {
  session: PracticeCompletedSession;
  owner: PracticeOwner;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const lifetime = useRef<AbortController>();
  useEffect(() => {
    const c = new AbortController();
    lifetime.current = c;
    clearCompletedPracticeRecovery(practiceDraftKey(owner, session));
    return () => c.abort();
  }, [owner, session]);
  async function repeat() {
    const c = lifetime.current;
    if (!c || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await openPracticeRun(
        owner,
        "repeat",
        session.id,
        session.revision,
        () => service.session(owner, c.signal, session.id),
        (request) =>
          service.repeat(
            owner,
            c.signal,
            session.id,
            request as { requestId: string; expectedRevision: number },
          ),
      );
      if (samePracticeOwner(owner, c.signal))
        navigate(`/student/nafs/practice/sessions/${result.session.id}`);
    } catch {
      if (!c.signal.aborted)
        setError(
          "Could not confirm the new run. Retry opening practice to reconcile the same request. Browser storage must be available.",
        );
    } finally {
      sending.current = false;
      if (!c.signal.aborted) setBusy(false);
    }
  }
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
      <p className="text-sm text-slate-500 mb-5">
        Completed {new Date(session.completedAt).toLocaleString()}. This result
        is saved permanently.
      </p>
      {error && (
        <p role="alert" className="my-4">
          {error}
        </p>
      )}
      <Button
        disabled={busy}
        className="min-h-11 mb-5"
        onClick={() => void repeat()}
      >
        {busy
          ? "Opening practice…"
          : error
            ? "Retry opening practice"
            : "Practice again"}
      </Button>
      <br />
      <Link
        to={`/student/nafs/practice/collections/${session.collectionId}`}
        className="underline inline-flex items-center min-h-11"
      >
        Back to practice overview
      </Link>
    </section>
  );
}
function RecoveryGate({
  initial,
  owner,
}: {
  initial: PracticeInProgressSession;
  owner: PracticeOwner;
}) {
  const key = practiceDraftKey(owner, initial);
  const [primary] = useState(() =>
    parsePracticeDraft(readPracticeRecovery(key), initial),
  );
  const [backups] = useState(() =>
    primary === undefined && shouldOfferPracticeBackups(key)
      ? practiceBackups(key).filter((b) => parsePracticeDraft(b.value, initial))
      : [],
  );
  const [chosen, setChosen] = useState<{ draft: unknown } | undefined>(() =>
    primary !== undefined || !backups.length ? { draft: primary } : undefined,
  );
  if (chosen)
    return (
      <LivePlayer initial={initial} owner={owner} recovered={chosen.draft} />
    );
  return (
    <section className={practicePanel}>
      <h1 className="text-2xl font-bold mb-4">Recover local practice</h1>
      <p className="text-slate-600 mb-5">
        Recovery copies from previous tabs are available. Choose a copy to
        reconcile, or continue with saved server choices. Other copies stay
        intact until this run is completed.
      </p>
      <div className="space-y-3">
        {backups.map((backup, i) => (
          <div className="border rounded-xl p-4" key={backup.key}>
            <p className="text-sm mb-2">
              Copy {i + 1} · {new Date(backup.updatedAt).toLocaleString()}
            </p>
            <Button
              className="min-h-11"
              onClick={() => {
                ignorePracticeBackups(key);
                setChosen({ draft: backup.value });
              }}
            >
              Recover draft {i + 1}
            </Button>
          </div>
        ))}
      </div>
      <Button
        className="min-h-11 mt-5"
        variant="outline"
        onClick={() => {
          ignorePracticeBackups(key);
          setChosen({ draft: undefined });
        }}
      >
        Use saved server choices
      </Button>
    </section>
  );
}
function LivePlayer({
  initial,
  owner,
  recovered,
}: {
  initial: PracticeInProgressSession;
  owner: PracticeOwner;
  recovered?: unknown;
}) {
  const [view, setView] = useState<PracticeState>({
    session: initial,
    selections: Object.fromEntries(
      initial.selections.map((s) => [s.questionId, s.optionId]),
    ),
    needsCheck: new Set(),
    status: "saved",
    message: "",
    feedbackEvent: null,
  });
  const engine = useRef<PracticeSession>();
  const [confirm, setConfirm] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const draftKey = practiceDraftKey(owner, initial);
  useEffect(() => {
    const c = new AbortController();
    const session = new PracticeSession(
      initial,
      {
        read: () => service.session(owner, c.signal, initial.id),
        save: (q, request) =>
          service.save(owner, c.signal, initial.id, q, request),
        check: (q, request) =>
          service.check(owner, c.signal, initial.id, q, request),
        complete: (request) =>
          service.complete(owner, c.signal, initial.id, request),
      },
      (state) => {
        if (samePracticeOwner(owner, c.signal)) setView(state);
      },
      (draft) =>
        !samePracticeOwner(owner, c.signal) ||
        writePracticeRecovery(draftKey, draft),
      recovered,
    );
    engine.current = session;
    setView(session.state);
    const guard = () => {
      if (!samePracticeOwner(owner, c.signal)) {
        session.dispose();
        c.abort();
        setInvalidated(true);
      }
    };
    window.addEventListener("storage", guard);
    window.addEventListener("focus", guard);
    document.addEventListener("visibilitychange", guard);
    return () => {
      session.dispose();
      c.abort();
      engine.current = undefined;
      window.removeEventListener("storage", guard);
      window.removeEventListener("focus", guard);
      document.removeEventListener("visibilitychange", guard);
    };
  }, [initial, owner, draftKey, recovered]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!["saved", "denied"].includes(view.status)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [view.status]);
  if (invalidated || view.status === "denied")
    return (
      <section className={practicePanel}>
        <p role="alert">
          Practice access changed. Sign in again or return to your courses.
        </p>
        <Link
          to="/student/courses"
          className="underline min-h-11 inline-flex items-center"
        >
          Back to courses
        </Link>
      </section>
    );
  if (view.session.state === "completed")
    return <PracticeResult session={view.session} owner={owner} />;
  const locked = !["saved", "saving"].includes(view.status);
  return (
    <>
      <PracticePlayer
        owner={owner}
        session={view.session}
        selections={view.selections}
        dirty={view.needsCheck}
        feedbackEvent={view.feedbackEvent}
        locked={locked}
        onSelect={(q, o) => engine.current?.select(q, o)}
        onCheck={(q) => void engine.current?.check(q)}
        onNavigate={() => engine.current?.clearAnimation()}
        status={
          <div className="mb-5 rounded-xl bg-slate-50 p-3 text-sm space-y-3">
            <p role="status" aria-label="Practice saving status">
              {view.status === "saved"
                ? "All choices saved."
                : view.status === "saving"
                  ? "Saving choices…"
                  : view.status === "checking"
                    ? "Checking answer…"
                    : view.status === "completing"
                      ? "Finishing practice…"
                      : view.message}
            </p>
            {["uncertain", "denied"].includes(view.status) && (
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => void engine.current?.reconcile()}
              >
                Reconcile saved practice
              </Button>
            )}
            {["conflict", "recovery"].includes(view.status) && (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => engine.current?.resolve(true)}
                >
                  Keep local choices
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => engine.current?.resolve(false)}
                >
                  Use server choices
                </Button>
              </div>
            )}
            <Button
              className="min-h-11"
              disabled={!engine.current?.canFinish()}
              onClick={() => setConfirm(true)}
            >
              Finish practice
            </Button>
          </div>
        }
      />
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-lg [&>button]:min-h-12 [&>button]:min-w-12 [&>button]:flex [&>button]:items-center [&>button]:justify-center">
          <DialogTitle className="pr-12">Finish this practice?</DialogTitle>
          <DialogDescription>
            All current answers have been checked. Your final marks will use
            each question’s latest checked answer. This run will be locked; you
            can explicitly start a new run afterward.
          </DialogDescription>
          <DialogFooter>
            <Button
              className="min-h-11"
              variant="outline"
              onClick={() => setConfirm(false)}
            >
              Keep reviewing
            </Button>
            <Button
              className="min-h-11"
              disabled={!engine.current?.canFinish()}
              onClick={() => {
                setConfirm(false);
                void engine.current?.finish();
              }}
            >
              Confirm finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
