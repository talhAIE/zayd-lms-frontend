import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { openPracticeRun } from "@/components/nafs-practice/practiceRecovery";
import { nafsPracticePlayerService } from "@/services/nafsPracticePlayerService";
import { ArrowLeft, BookOpen, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { useNafsSession } from "@/components/nafs/useNafsSession";
import { nafsService } from "@/services/nafsService";
import {
  nafsPracticeDiscoveryService as discovery,
  practiceDiscoveryMessage,
} from "@/services/nafsPracticeDiscoveryService";
import type { NafsCourseView } from "@/types/nafs.contract";
import type {
  NafsModesView,
  PracticeOwner,
  PracticeCollectionSummary,
} from "@/types/nafs-practice.contract";

const panel =
  "w-full max-w-[1087px] mx-auto bg-white rounded-3xl p-4 md:p-8 font-['Outfit',sans-serif] text-[#282828]";
const card =
  "rounded-2xl border border-slate-200 p-5 md:p-6 flex flex-col gap-4";
const action =
  "inline-flex items-center justify-center min-h-11 px-5 py-3 rounded-lg bg-[#232E43] hover:bg-[#1a2333] text-white font-semibold text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";
function Back({
  to = "/student/courses",
  children = "Back to courses",
}: {
  to?: string;
  children?: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 underline text-sm text-slate-600 min-h-11"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
function Retry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="my-5 space-y-3">
      <p role="alert">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try loading again
      </Button>
    </div>
  );
}
// Captured by a keyed subtree; a region change disposes all practice page data.
function usePracticeOwner(): PracticeOwner | null {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const region = (user as typeof user & { region?: string })?.region;
  const id = user?.id,
    username = user?.username,
    allowed = isAuthenticated && user?.role === "student";
  return useMemo(
    () =>
      allowed && id && username && (region === "ROW" || region === "SAUDI")
        ? { id, username, role: "student", region }
        : null,
    [allowed, id, username, region],
  );
}
function ownerKey(owner: PracticeOwner) {
  return JSON.stringify([owner.id, owner.username, owner.role, owner.region]);
}
function status(collection: PracticeCollectionSummary) {
  return collection.state === "completed"
    ? "Completed practice"
    : collection.state === "in_progress"
      ? "Practice in progress"
      : "Not started";
}

export function NafsCoursePage() {
  const { courseId = "" } = useParams();
  const practiceOwner = usePracticeOwner();
  return (
    <Course
      key={`${practiceOwner ? ownerKey(practiceOwner) : "legacy"}:${courseId}`}
      courseId={courseId}
    />
  );
}
function Course({ courseId }: { courseId: string }) {
  const owner = useNafsSession();
  const [modes, setModes] = useState<NafsModesView>();
  const [legacy, setLegacy] = useState<NafsCourseView>();
  const [failed, setFailed] = useState(false);
  const [oldBackend, setOldBackend] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setModes(undefined);
    setLegacy(undefined);
    setFailed(false);
    setOldBackend(false);
    // Optional course metadata never delays mode availability or the Quiz link.
    void nafsService
      .courses(owner, controller.signal)
      .then(({ courses }) => {
        if (!controller.signal.aborted)
          setLegacy(
            courses.find(
              (c) => c.id === courseId || c.assessmentId === courseId,
            ),
          );
      })
      .catch(() => {
        /* The chooser remains usable without optional metadata. */
      });
    void discovery
      .modes(owner, controller.signal, courseId)
      .then((data) => {
        if (!controller.signal.aborted) setModes(data);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        // Only a known authorized legacy course makes a 404 an old-deployment fallback.
        setOldBackend(
          axios.isAxiosError(error) && error.response?.status === 404,
        );
        setFailed(true);
      });
    return () => controller.abort();
  }, [owner, courseId, retry]);
  if (oldBackend && legacy)
    return (
      <Navigate
        replace
        to={`/student/nafs/assessments/${legacy.assessmentId}`}
      />
    );
  const quizId = modes?.quiz.assessmentId || legacy?.assessmentId || courseId;
  return (
    <section className={panel}>
      <Back />
      <header className="rounded-2xl bg-[#EFF5FF] p-6 md:p-8 my-5">
        <p className="text-sm font-semibold text-blue-700">
          NAFS
          {modes
            ? ` · Grade ${modes.gradeLabel}`
            : legacy
              ? ` · Grade ${legacy.gradeLabel}`
              : ""}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">
          {modes?.courseTitle || legacy?.courseTitle || "NAFS course"}
        </h1>
        <p className="mt-2 text-slate-600">Choose how you want to learn.</p>
      </header>
      {failed && (
        <Retry
          message="Mode availability could not load. You can still open Quiz Mode."
          onRetry={() => setRetry((n) => n + 1)}
        />
      )}
      <div className="grid md:grid-cols-2 gap-5">
        <article className={card}>
          <ClipboardList
            className="w-9 h-9 text-[#4F8DFB]"
            aria-hidden="true"
          />
          <h2 className="text-xl font-bold">Quiz Mode</h2>
          <p className="text-slate-600">
            One attempt. Answer every question and see your final marks after
            finishing. No correct or incorrect feedback while answering.
          </p>
          {legacy && (
            <p className="text-sm text-slate-600">
              {legacy.assessmentTitle} · {legacy.questionCount} questions ·{" "}
              {legacy.state === "submitted"
                ? "Quiz completed"
                : legacy.state === "in_progress"
                  ? "Quiz in progress"
                  : "Quiz not started"}
            </p>
          )}
          <Link
            className={`${action} mt-auto`}
            to={`/student/nafs/assessments/${quizId}`}
          >
            Open Quiz Mode
          </Link>
        </article>
        <article className={card}>
          <BookOpen className="w-9 h-9 text-[#4F8DFB]" aria-hidden="true" />
          <h2 className="text-xl font-bold">Practice Mode</h2>
          <p className="text-slate-600">
            Check each answer for correct or incorrect feedback. Retry questions
            and move at your own pace.
          </p>
          {modes?.practice.available ? (
            <Link
              className={`${action} mt-auto`}
              to={`/student/nafs/courses/${courseId}/practice`}
            >
              Open Practice Mode
            </Link>
          ) : (
            <>
              <p role="status" className="text-sm text-slate-500">
                {failed
                  ? "Practice availability could not be confirmed."
                  : modes
                    ? "Practice is not available for this course yet."
                    : "Loading mode availability…"}
              </p>
              <Button className="mt-auto min-h-11" disabled>
                Open Practice Mode
              </Button>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

export function NafsPracticeCollectionsPage() {
  const { courseId = "" } = useParams();
  const owner = usePracticeOwner();
  return owner ? (
    <Collections
      key={`${ownerKey(owner)}:${courseId}`}
      owner={owner}
      courseId={courseId}
    />
  ) : (
    <MissingRegion />
  );
}
function MissingRegion() {
  return (
    <section className={panel}>
      <Back />
      <p role="alert" className="my-5">
        Please sign in again to load your practice access.
      </p>
      <Link className={action} to="/login">
        Go to sign in
      </Link>
    </section>
  );
}
function Collections({
  owner,
  courseId,
}: {
  owner: PracticeOwner;
  courseId: string;
}) {
  const [collections, setCollections] = useState<PracticeCollectionSummary[]>();
  const [title, setTitle] = useState("NAFS course");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setCollections(undefined);
    setError("");
    void discovery
      .collections(owner, controller.signal, courseId)
      .then((data) => {
        if (!controller.signal.aborted) setCollections(data.collections);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(practiceDiscoveryMessage(e));
      });
    void discovery
      .modes(owner, controller.signal, courseId)
      .then((data) => {
        if (!controller.signal.aborted) setTitle(data.courseTitle);
      })
      .catch(() => {
        /* Collection access does not depend on optional title lookup. */
      });
    return () => controller.abort();
  }, [owner, courseId, retry]);
  return (
    <section className={panel}>
      <Back to={`/student/nafs/courses/${courseId}`}>Back to modes</Back>
      <p className="text-sm font-semibold text-blue-700 mt-5">{title}</p>
      <h1 className="text-2xl md:text-3xl font-bold mt-2">Practice Mode</h1>
      <p className="mt-3 mb-6 text-slate-600">
        Choose a practice collection. Your practice progress is separate from
        Quiz Mode.
      </p>
      {error ? (
        <Retry message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : !collections ? (
        <p role="status">Loading practice collections…</p>
      ) : collections.length === 0 ? (
        <p role="status" className="p-5 bg-slate-50 rounded-xl">
          No practice collections are available for this course yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {collections.map((c) => (
            <article key={c.id} className={card}>
              <h2 className="text-xl font-bold">{c.title}</h2>
              <p className="text-slate-600">
                {c.questionCount} questions · {c.totalMarks} marks
              </p>
              <p className="text-sm text-slate-600">{status(c)}</p>
              <Link
                className={`${action} mt-auto`}
                to={`/student/nafs/practice/collections/${c.id}`}
              >
                View {c.title}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function NafsPracticeOverviewPage() {
  const { collectionId = "" } = useParams();
  const owner = usePracticeOwner();
  return owner ? (
    <Overview
      key={`${ownerKey(owner)}:${collectionId}`}
      owner={owner}
      collectionId={collectionId}
    />
  ) : (
    <MissingRegion />
  );
}
function Overview({
  owner,
  collectionId,
}: {
  owner: PracticeOwner;
  collectionId: string;
}) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const sending = useRef(false);
  const lifetime = useRef<AbortController>();
  const [collection, setCollection] =
    useState<Awaited<ReturnType<typeof discovery.overview>>["collection"]>();
  const [courseTitle, setCourseTitle] = useState("NAFS");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    setCollection(undefined);
    setCourseTitle("NAFS");
    setError("");
    void discovery
      .overview(owner, controller.signal, collectionId)
      .then((data) => {
        if (controller.signal.aborted) return;
        setCollection(data.collection);
        void discovery
          .modes(owner, controller.signal, data.collection.courseId)
          .then((modes) => {
            if (!controller.signal.aborted) setCourseTitle(modes.courseTitle);
          })
          .catch(() => {
            /* Optional title must not block the authorized overview. */
          });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(practiceDiscoveryMessage(e));
      });
    return () => controller.abort();
  }, [owner, collectionId, retry]);
  async function open() {
    const controller = lifetime.current;
    if (!collection || !controller || sending.current) return;
    const existing =
      collection.activeSessionId || collection.latestCompletedSessionId;
    if (existing) {
      navigate(`/student/nafs/practice/sessions/${existing}`);
      return;
    }
    sending.current = true;
    setOpening(true);
    setOpenError("");
    try {
      const result = await openPracticeRun(
        owner,
        "start",
        collectionId,
        undefined,
        () => discovery.overview(owner, controller.signal, collectionId),
        (request) =>
          nafsPracticePlayerService.start(
            owner,
            controller.signal,
            collectionId,
            request,
          ),
      );
      if (!controller.signal.aborted)
        navigate(`/student/nafs/practice/sessions/${result.session.id}`);
    } catch {
      if (!controller.signal.aborted)
        setOpenError(
          "Could not confirm practice. Retry opening practice to reconcile the same request. Browser storage must be available.",
        );
    } finally {
      sending.current = false;
      if (!controller.signal.aborted) setOpening(false);
    }
  }
  return (
    <section className={panel}>
      <Back
        {...(collection
          ? {
              to: `/student/nafs/courses/${collection.courseId}/practice`,
              children: "Back to Practice Mode",
            }
          : {})}
      />
      {error ? (
        <Retry message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : !collection ? (
        <p role="status" className="my-5">
          Loading practice overview…
        </p>
      ) : (
        <>
          <header className="rounded-2xl bg-[#EFF5FF] p-6 md:p-8 my-5">
            <BookOpen
              className="w-10 h-10 text-[#4F8DFB] mb-4"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-blue-700">
              {courseTitle} · Practice Mode
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">
              {collection.title}
            </h1>
            <p className="mt-2 text-slate-600">
              {collection.questionCount} questions · {collection.totalMarks}{" "}
              marks
            </p>
            <p className="text-sm text-slate-600 mt-2">{status(collection)}</p>
          </header>
          <h2 className="text-lg font-semibold mb-3">Before you begin</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            {collection.instructions.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
            <li>
              Select an option, then press Check Answer to see whether it is
              correct or incorrect.
            </li>
            <li>
              You can retry answers. Changing a selection requires another
              check.
            </li>
            <li>Move between questions yourself. There is no time limit.</li>
            <li>
              Check every current answer before finishing. Your final marks use
              each question’s latest checked answer.
            </li>
            <li>
              You can explicitly start a new run after completing practice.
              Earlier runs remain saved.
            </li>
          </ul>
          {openError && (
            <p role="alert" className="mt-6">
              {openError}
            </p>
          )}
          <Button
            disabled={opening}
            className="mt-6 min-h-11"
            onClick={() => void open()}
          >
            {opening
              ? "Opening practice…"
              : openError
                ? "Retry opening practice"
                : collection.state === "completed"
                  ? "View practice result"
                  : collection.state === "in_progress"
                    ? "Resume practice"
                    : "Start practice"}
          </Button>
        </>
      )}
    </section>
  );
}
