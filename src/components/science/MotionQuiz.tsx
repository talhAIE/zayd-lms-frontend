import { useCallback, useEffect, useRef, useState } from "react";
import {
  sparkScienceService as api,
  type SparkQuizAttempt,
  type SparkQuestion,
} from "@/services/sparkScienceService";
import type { ScienceOwner } from "@/services/scienceSparkService";

function Figure({
  owner,
  attemptId,
  path,
  alt,
}: {
  owner: ScienceOwner;
  attemptId: string;
  path: string;
  alt: string;
}) {
  const [url, setUrl] = useState(""),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    let objectUrl = "";
    setFailed(false);
    void api
      .image(owner, c.signal, attemptId, path.split("/").pop()!)
      .then((blob) => {
        if (!c.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {
        if (!c.signal.aborted) setFailed(true);
      });
    return () => {
      c.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [owner, attemptId, path, retry]);
  return failed ? (
    <p role="alert">
      Figure could not load.{" "}
      <button className="underline" onClick={() => setRetry((x) => x + 1)}>
        Retry image
      </button>
    </p>
  ) : url ? (
    <img
      className="max-h-[480px] max-w-full object-contain"
      src={url}
      alt={alt}
    />
  ) : (
    <p role="status">Loading figure…</p>
  );
}
export function MotionQuiz({
  owner,
  activityKey,
  unitNumber = 2,
  onReturn,
}: {
  owner: ScienceOwner;
  activityKey: string;
  unitNumber?: number;
  onReturn: () => void;
}) {
  const [attempt, setAttempt] = useState<SparkQuizAttempt>(),
    [draft, setDraft] = useState<SparkQuizAttempt["answers"]>({}),
    [index, setIndex] = useState(0),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [grading, setGrading] = useState(false),
    [conflict, setConflict] = useState(false),
    [retry, setRetry] = useState(0),
    [uncertain, setUncertain] = useState(false);
  const life = useRef<AbortController>(),
    server = useRef<SparkQuizAttempt>(),
    desired = useRef(draft),
    busy = useRef(false),
    blocked = useRef(false),
    journal = useRef(""),
    runningGrade = useRef(false);
  const adopt = useCallback((a: SparkQuizAttempt) => {
    server.current = a;
    setAttempt(a);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    life.current = c;
    blocked.current = false;
    setError("");
    setAttempt(undefined);
    busy.current = false;
    void api
      .startQuiz(owner, c.signal, activityKey, unitNumber)
      .then((a) => {
        if (c.signal.aborted) return;
        adopt(a);
        journal.current = JSON.stringify([
          "motion-v2",
          owner.id,
          owner.region ?? "ROW",
          a.id,
        ]);
        let answers = a.answers;
        try {
          const stored = JSON.parse(
            sessionStorage.getItem(journal.current) || "null",
          );
          if (a.state === "in_progress" && stored?.answers) {
            answers = stored.answers;
            if (
              stored.revision !== a.revision &&
              JSON.stringify(answers) !== JSON.stringify(a.answers)
            ) {
              blocked.current = true;
              setConflict(true);
              setError("Saved answers changed. Choose which answers to keep.");
            }
          }
        } catch {
          /* Server answers remain authoritative if recovery is unavailable. */
        }
        desired.current = answers;
        setDraft(answers);
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError("Quiz could not load. Retry to restore your saved attempt.");
      });
    return () => c.abort();
  }, [owner, activityKey, retry, adopt]);
  const persist = useCallback(
    async function write(): Promise<boolean> {
      const a = server.current,
        c = life.current;
      if (
        !a ||
        !c ||
        c.signal.aborted ||
        blocked.current ||
        a.state !== "in_progress"
      )
        return false;
      if (busy.current) return false;
      if (JSON.stringify(desired.current) === JSON.stringify(a.answers))
        return true;
      busy.current = true;
      setSaving(true);
      const sent = structuredClone(desired.current);
      try {
        let updated: SparkQuizAttempt;
        try {
          updated = await api.save(owner, c.signal, a.id, a.revision, sent);
        } catch (e) {
          const fresh = await api.attempt(owner, c.signal, a.id);
          if (JSON.stringify(fresh.answers) !== JSON.stringify(sent)) throw e;
          updated = fresh;
        }
        if (c.signal.aborted) return false;
        adopt(updated);
        busy.current = false;
        setSaving(false);
        try {
          if (
            JSON.stringify(desired.current) === JSON.stringify(updated.answers)
          )
            sessionStorage.removeItem(journal.current);
        } catch {
          /* Server save is confirmed even if local recovery cleanup fails. */
        }
        return JSON.stringify(desired.current) ===
          JSON.stringify(updated.answers)
          ? true
          : write();
      } catch {
        if (!c.signal.aborted) {
          blocked.current = true;
          setError(
            "Answers could not be confirmed. Retry saving, or reload saved answers if another tab changed this quiz.",
          );
          setConflict(true);
        }
        return false;
      } finally {
        busy.current = false;
        if (!c.signal.aborted) setSaving(false);
      }
    },
    [owner, adopt],
  );
  useEffect(() => {
    const timer = setTimeout(() => void persist(), 500);
    return () => clearTimeout(timer);
  }, [draft, persist]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (
        server.current?.state === "in_progress" &&
        JSON.stringify(desired.current) !==
          JSON.stringify(server.current.answers)
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const change = (question: SparkQuestion, value: Record<string, string>) => {
    const answers = { ...desired.current, [question.id]: value };
    desired.current = answers;
    setDraft(answers);
    try {
      sessionStorage.setItem(
        journal.current,
        JSON.stringify({ revision: server.current?.revision, answers }),
      );
    } catch {
      setError(
        "Recovery storage is unavailable. Keep this page open until answers are saved.",
      );
    }
  };
  const resumeGrading = useCallback(async () => {
    const c = life.current;
    if (!c || runningGrade.current) return;
    runningGrade.current = true;
    setGrading(true);
    setError("");
    try {
      let a = await api.attempt(owner, c.signal, server.current!.id);
      adopt(a);
      while (a.state === "grading" && !c.signal.aborted) {
        const before = a.gradedItems;
        a = await api.grade(owner, c.signal, a.id);
        adopt(a);
        if (a.state === "grading" && a.gradedItems === before)
          await new Promise((r) => setTimeout(r, 1500));
      }
      if (a.state === "submitted")
        try {
          sessionStorage.removeItem(journal.current);
        } catch {
          /* A confirmed result remains available from the server. */
        }
    } catch {
      if (!c.signal.aborted)
        setError(
          "Your submission is saved. Zayd AI grading could not finish yet. Retry grading to continue.",
        );
    } finally {
      runningGrade.current = false;
      if (!c.signal.aborted) setGrading(false);
    }
  }, [owner, adopt]);
  useEffect(() => {
    if (attempt?.state === "grading" && !grading && !error)
      void resumeGrading();
  }, [attempt?.state, grading, error, resumeGrading]);
  const submit = async () => {
    if (
      !server.current ||
      !life.current ||
      !window.confirm("Submit this quiz? Your answers will be final.")
    )
      return;
    if (!(await persist())) {
      setError("Wait for all answers to save before submitting.");
      return;
    }
    setSaving(true);
    setUncertain(true);
    try {
      const a = server.current;
      const result = await api.submit(
        owner,
        life.current.signal,
        a.id,
        a.revision,
        crypto.randomUUID(),
      );
      adopt(result);
      setUncertain(false);
      await resumeGrading();
    } catch {
      try {
        const fresh = await api.attempt(
          owner,
          life.current.signal,
          server.current.id,
        );
        adopt(fresh);
        setUncertain(false);
        if (fresh.state === "grading") {
          setError("");
          await resumeGrading();
        } else if (fresh.state === "in_progress")
          setError(
            "Submission did not complete. Your saved answers are retained; retry submission.",
          );
      } catch {
        setError(
          "Submission could not be confirmed. Check submission before editing or retrying.",
        );
      }
    } finally {
      setSaving(false);
    }
  };
  const resolve = async (keep: boolean) => {
    if (!server.current || !life.current) return;
    try {
      const fresh = await api.attempt(
        owner,
        life.current.signal,
        server.current.id,
      );
      adopt(fresh);
      if (!keep) {
        desired.current = fresh.answers;
        setDraft(fresh.answers);
        sessionStorage.removeItem(journal.current);
      }
      blocked.current = false;
      setConflict(false);
      setError("");
      if (keep) await persist();
    } catch {
      setError(
        "Saved answers could not load. Your device answers are retained.",
      );
    }
  };
  if (!attempt)
    return (
      <div>
        {error ? (
          <p role="alert">
            {error}{" "}
            <button onClick={() => setRetry((x) => x + 1)}>Retry quiz</button>
          </p>
        ) : (
          <p role="status">Restoring quiz…</p>
        )}
      </div>
    );
  const question = attempt.questions[index],
    dirty = JSON.stringify(draft) !== JSON.stringify(attempt.answers),
    complete = attempt.questions.every((q) =>
      q.componentType === "mcq"
        ? !!draft[q.id]?.optionId
        : q.componentType === "open_input"
          ? !!draft[q.id]?.text?.trim()
          : q.fields?.every(
              (f) =>
                draft[q.id]?.[f.id]?.trim() &&
                (f.inputType === "text" ||
                  Number.isFinite(Number(draft[q.id][f.id]))),
            ),
    );
  return (
    <section className="mx-auto max-w-4xl space-y-5 rounded-2xl border bg-white p-4 md:p-8">
      <button className="underline" onClick={onReturn}>
        Back to activities
      </button>
      <h1 className="text-2xl font-bold">{attempt.title}</h1>
      <p>
        {attempt.questions.length} questions · {attempt.maxScore} marks
      </p>
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-3">
          {error}{" "}
          {conflict ? (
            <div className="flex gap-4">
              <button className="underline" onClick={() => void resolve(false)}>
                Use saved answers
              </button>
              <button className="underline" onClick={() => void resolve(true)}>
                Keep device answers
              </button>
            </div>
          ) : (
            <button
              className="underline"
              onClick={() => {
                blocked.current = false;
                setError("");
                void (attempt.state === "grading"
                  ? resumeGrading()
                  : persist());
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {uncertain && (
        <button
          className="rounded border p-3"
          onClick={() => {
            if (life.current)
              void api
                .attempt(owner, life.current.signal, attempt.id)
                .then((a) => {
                  adopt(a);
                  setUncertain(false);
                  setError("");
                })
                .catch(() =>
                  setError(
                    "Submission status is still unavailable. Your answers remain locked.",
                  ),
                );
          }}
        >
          Check submission
        </button>
      )}
      {attempt.state === "submitted" ? (
        <div role="status" className="space-y-4">
          <h2 className="text-3xl font-bold">
            Result: {attempt.score} / {attempt.maxScore}
          </h2>
          <p>Quiz completed. Your result is saved.</p>
          {attempt.questions.map((q) => (
            <div key={q.id} className="border-t py-3">
              <strong>
                Question {q.sourceLabel}: {attempt.feedback?.[q.id]?.score} /{" "}
                {q.points}
              </strong>
              <p>{attempt.feedback?.[q.id]?.feedback}</p>
            </div>
          ))}
          <button
            className="rounded-lg bg-blue-600 px-5 py-3 text-white"
            onClick={onReturn}
          >
            Return to activities
          </button>
        </div>
      ) : attempt.state === "grading" ? (
        <div role="status">
          <h2 className="text-xl font-semibold">
            Zayd AI is grading your responses
          </h2>
          <p>
            {attempt.gradedItems} of {attempt.questions.length} questions
            graded. Answers are saved; you can return later.
          </p>
          <button
            disabled={grading}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
            onClick={() => void resumeGrading()}
          >
            {grading ? "Grading…" : "Continue grading"}
          </button>
        </div>
      ) : (
        <>
          <p role="status">
            {saving
              ? "Saving answers…"
              : dirty
                ? "Unsaved changes"
                : "All answers saved"}
          </p>
          <nav aria-label="Quiz questions" className="flex flex-wrap gap-2">
            {attempt.questions.map((q, i) => (
              <button
                key={q.id}
                aria-current={i === index ? "step" : undefined}
                onClick={() => setIndex(i)}
                className={`min-w-10 rounded border p-2 ${i === index ? "bg-blue-600 text-white" : draft[q.id] ? "bg-blue-50" : ""}`}
              >
                {q.sourceLabel}
              </button>
            ))}
          </nav>
          <fieldset disabled={uncertain} className="space-y-4">
            <h2 className="text-lg font-semibold">
              Question {question.sourceLabel} · {question.points} mark
              {question.points === 1 ? "" : "s"}
            </h2>
            {question.stimuli.map((s, i) =>
              s.type === "image" ? (
                <Figure
                  key={`${question.id}-${i}`}
                  owner={owner}
                  attemptId={attempt.id}
                  path={s.path!}
                  alt={s.alt ?? "Question figure"}
                />
              ) : (
                <div key={i} className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {s.headers?.map((h) => (
                          <th className="border p-2" key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows?.map((r, j) => (
                        <tr key={j}>
                          {r.map((cell, k) => (
                            <td key={k} className="border p-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ),
            )}
            <p className="whitespace-pre-wrap">{question.prompt}</p>
            {question.componentType === "mcq" ? (
              <fieldset className="space-y-2">
                <legend className="sr-only">Choose one answer</legend>
                {question.options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={draft[question.id]?.optionId === o.id}
                      onChange={() => change(question, { optionId: o.id })}
                    />
                    <span>
                      {o.label}. {o.text}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : question.componentType === "open_input" ? (
              <label className="block">
                Your response
                <textarea
                  className="mt-2 block min-h-40 w-full rounded-lg border p-3"
                  maxLength={4000}
                  value={draft[question.id]?.text ?? ""}
                  onChange={(e) => change(question, { text: e.target.value })}
                />
                <span className="text-sm text-gray-500">
                  Explain your reasoning. Zayd AI will evaluate your response
                  after submission.
                </span>
              </label>
            ) : (
              question.fields?.map((f) => (
                <label key={f.id} className="block">
                  {f.label} {f.unit && `(${f.unit})`}
                  <input
                    type="text"
                    inputMode={f.inputType === "text" ? "text" : "decimal"}
                    className="ml-3 rounded border p-3"
                    maxLength={
                      f.inputType === "text" ? (f.maxLength ?? 100) : 32
                    }
                    value={draft[question.id]?.[f.id] ?? ""}
                    onChange={(e) =>
                      change(question, {
                        ...Object.fromEntries(
                          question.fields!.map((x) => [
                            x.id,
                            draft[question.id]?.[x.id] ?? "",
                          ]),
                        ),
                        [f.id]: e.target.value,
                      })
                    }
                  />
                </label>
              ))
            )}
          </fieldset>
          <div className="flex flex-wrap justify-between gap-3">
            <button
              className="rounded border px-4 py-2"
              disabled={!index}
              onClick={() => setIndex((i) => i - 1)}
            >
              Previous
            </button>
            <button
              className="rounded border px-4 py-2"
              disabled={index === attempt.questions.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next question
            </button>
            <button
              className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-40"
              disabled={!complete || dirty || saving || !!error || uncertain}
              onClick={() => void submit()}
            >
              Submit quiz
            </button>
          </div>
        </>
      )}
    </section>
  );
}
