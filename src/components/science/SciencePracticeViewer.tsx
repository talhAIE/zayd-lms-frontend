import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ScienceEmbedPlayer } from "./ScienceEmbedPlayer";
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
  const { embedUrl } = validateSciencePractice(content);
  const isSimulation = content.kind === "external_simulation";
  const activityName = isSimulation ? "Simulation" : "Practice";
  const providerName = isSimulation ? "PhET" : "Kahoot";
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
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
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none p-0 bg-white text-slate-900 backdrop:bg-black/50 open:flex open:flex-col md:m-auto md:h-[90dvh] md:w-[94vw] md:max-w-[1440px] md:rounded-2xl"
    >
      <div className="flex h-full w-full flex-col bg-white text-slate-900">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h1 id={titleId} className="text-xl font-bold">
            {isSimulation
              ? "Simulation — Quantum Wave Interference"
              : "Practice — Light"}
          </h1>
          <div className="flex flex-wrap gap-3 items-center text-sm">
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
              Kahoot preview. If playable practice is unavailable here, your
              teacher needs to provide an embedded assignment.
            </p>
          )}
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-slate-50">
          <ScienceEmbedPlayer
            src={embedUrl}
            title={`Science ${activityName} — ${providerName}`}
          />
        </div>
        <footer className="shrink-0 border-t px-4 py-3 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-slate-600">
              Complete the activity here, then use the completion button.
              External scores are not imported.
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
