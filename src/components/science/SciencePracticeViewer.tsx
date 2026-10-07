import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Atom, Play } from "lucide-react";
import type { ScienceSparkExternalContent } from "@/types/science-spark.contract";
import { validateSciencePractice } from "./sciencePractice";

interface Props {
  content: ScienceSparkExternalContent;
  onClose: () => void;
  onRetry: () => void;
  onComplete: () => void;
  saving: boolean;
  saveError: string;
}

/** A native modal isolates focus/background interaction. Provider DOM/messages are never read. */
export function SciencePracticeViewer({
  content,
  onClose,
  onRetry,
  onComplete,
  saving,
  saveError,
}: Props) {
  const { embedUrl, detailsUrl } = validateSciencePractice(content);
  const isSimulation = content.kind === "external_simulation";
  const activityName = isSimulation ? "Simulation" : "Practice";
  const providerName = isSimulation ? "PhET" : "Kahoot";
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "unavailable">(
    isSimulation ? "loaded" : "loading",
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.showModal();
    close.current?.focus();
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  useEffect(() => {
    const listener = () =>
      setFullscreen(document.fullscreenElement === workspace.current);
    document.addEventListener("fullscreenchange", listener);
    const timer = window.setTimeout(
      () =>
        setStatus((current) =>
          current === "loading" ? "unavailable" : current,
        ),
      20000,
    );
    return () => {
      document.removeEventListener("fullscreenchange", listener);
      window.clearTimeout(timer);
    };
  }, []);
  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (workspace.current?.requestFullscreen)
        await workspace.current.requestFullscreen();
      else throw new Error();
    } catch {
      setFullscreenError(
        "Fullscreen is unavailable in this browser. You can continue in this window.",
      );
    }
  }
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={`m-0 h-[100dvh] max-h-none w-screen max-w-none p-0 bg-white text-slate-900 backdrop:bg-black/50 open:flex open:flex-col md:m-auto md:h-[90dvh] md:w-[94vw] md:max-w-[1440px] md:rounded-2xl ${fullscreen ? "!m-0 !h-[100dvh] !w-screen !max-w-none !rounded-none" : ""}`}
    >
      <div
        ref={workspace}
        className="flex h-full w-full flex-col bg-white text-slate-900"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h1 id={titleId} className="text-xl font-bold">
            {isSimulation
              ? "Simulation — Quantum Wave Interference"
              : "Practice — Light"}
          </h1>
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <button
              type="button"
              className="underline"
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
            <a
              className="underline"
              href={detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open on {providerName}
            </a>
            <button
              ref={close}
              type="button"
              className="rounded-lg border px-3 py-2"
              onClick={onClose}
            >
              Close {activityName}
            </button>
          </div>
        </header>
        {content.kind === "external_practice" &&
          content.embedMode === "preview" && (
            <p role="note" className="shrink-0 bg-amber-50 px-4 py-3 text-sm">
              This is a Kahoot preview. Play may open Kahoot in a new tab;
              individual practice inside Zayd is not available yet.
            </p>
          )}
        {fullscreenError && (
          <p role="status" className="shrink-0 px-4 py-2 text-sm">
            {fullscreenError}
          </p>
        )}
        <div className="relative min-h-0 flex-1 bg-slate-50">
          {isSimulation ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-br from-sky-50 to-blue-100 p-6 text-center">
              <Atom className="h-20 w-20 text-[#4F8DFB]" aria-hidden="true" />
              <h2 className="text-2xl font-bold">Quantum Wave Interference</h2>
              <p className="max-w-md text-slate-600">
                Select Play to open the PhET simulation in a new tab. Return to
                Zayd when you are ready to complete this activity.
              </p>
              <a
                href={detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-[#4F8DFB] px-8 py-4 text-lg font-semibold text-white hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                Play
                <span className="sr-only"> — opens PhET in a new tab</span>
              </a>
            </div>
          ) : (
            <>
              {status === "loading" && (
                <p
                  role="status"
                  className="pointer-events-none absolute top-3 left-4 bg-white p-2 text-sm"
                >
                  Loading {providerName}…
                </p>
              )}
              <iframe
                title={`Science ${activityName} — ${providerName}`}
                src={embedUrl}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="autoplay; fullscreen"
                allowFullScreen
                referrerPolicy="no-referrer"
                onLoad={() => setStatus("loaded")}
                onError={() => setStatus("unavailable")}
              />
            </>
          )}
        </div>
        <footer className="shrink-0 border-t px-4 py-3 space-y-3">
          {status === "unavailable" && (
            <p role="alert" className="text-sm text-amber-800">
              {providerName} could not load. Retry or use Open on {providerName}
              .
            </p>
          )}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-slate-600">
              {isSimulation
                ? "Playing or closing the simulation does not complete this activity. Return here to mark it completed."
                : "If this activity does not start here, use Open on Kahoot. Closing or opening that link does not complete this activity."}
            </p>
            <button
              type="button"
              className="underline text-sm"
              onClick={onRetry}
            >
              Reload {activityName}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onComplete}
              className="rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : saveError
                  ? "Retry completion"
                  : isSimulation
                    ? "Complete and return to Unit 1"
                    : "Complete and Next"}
            </button>
          </div>
          {saveError && (
            <p role="alert" className="text-sm text-red-700">
              Completion was not confirmed. You are still on {activityName}.{" "}
              {saveError}
            </p>
          )}
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
