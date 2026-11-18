import { useEffect, useRef, useState } from "react";

/** Cross-origin players never mark LMS completion or supply trusted scores. */
export function ScienceEmbedPlayer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "slow">(
    "loading",
  );
  const [fullscreenError, setFullscreenError] = useState("");
  const workspace = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setStatus("loading");
    const timer = window.setTimeout(
      () => setStatus((current) => (current === "loading" ? "slow" : current)),
      30000,
    );
    return () => window.clearTimeout(timer);
  }, [src, revision]);
  async function fullscreen() {
    try {
      setFullscreenError("");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await workspace.current!.requestFullscreen();
    } catch {
      setFullscreenError(
        "Fullscreen is unavailable. Continue in the player below.",
      );
    }
  }
  return (
    <div
      ref={workspace}
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white fullscreen:h-screen fullscreen:rounded-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            className="underline"
            onClick={() => setRevision((n) => n + 1)}
          >
            Reload player
          </button>
          <button
            type="button"
            className="underline"
            onClick={() => void fullscreen()}
          >
            Fullscreen
          </button>
        </div>
      </div>
      {fullscreenError && (
        <p role="status" className="px-4 py-2 text-sm">
          {fullscreenError}
        </p>
      )}
      {status === "loading" && (
        <p role="status" className="px-4 py-2 text-sm">
          Loading activity…
        </p>
      )}
      {status === "slow" && (
        <p role="status" className="px-4 py-2 text-sm text-amber-800">
          The activity is taking longer to load. Check your connection or reload
          the player.
        </p>
      )}
      <iframe
        key={`${src}:${revision}`}
        title={title}
        src={src}
        className="h-[70dvh] min-h-[480px] w-full flex-1 border-0 bg-slate-50"
        sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-pointer-lock"
        allow="autoplay; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("slow")}
      />
    </div>
  );
}
