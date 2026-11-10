import { useEffect, useRef, useState } from "react";
import { Headphones, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sameStepOwner,
  stepService,
  type StepOwner,
} from "@/services/stepService";
import type { StepAudio } from "@/types/step.contract";

export function StepAudioPlayer({
  owner,
  attemptId,
  audio,
}: {
  owner: StepOwner;
  attemptId: string;
  audio: StepAudio;
}) {
  const ref = useRef<HTMLAudioElement>(null),
    position = useRef(0);
  const [url, setUrl] = useState(""),
    [error, setError] = useState(false),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setUrl("");
    setError(false);
    setReady(false);
    void stepService
      .audio(owner, controller.signal, attemptId, audio.id)
      .then((access) => {
        if (!sameStepOwner(owner, controller.signal)) return;
        const target = new URL(access.url);
        if (
          target.protocol !== "https:" ||
          !target.hostname.endsWith(".blob.core.windows.net") ||
          !target.pathname.startsWith("/step-private-content/step/") ||
          !Number.isFinite(Date.parse(access.expiresAt)) ||
          Date.parse(access.expiresAt) <= Date.now()
        )
          throw new Error("Audio unavailable");
        setUrl(access.url);
      })
      .catch(() => {
        if (sameStepOwner(owner, controller.signal)) setError(true);
      });
    return () => controller.abort();
  }, [owner, attemptId, audio.id, retry]);
  useEffect(() => {
    const player = ref.current;
    return () => {
      if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
    };
  }, [url]);
  return (
    <section
      aria-label="Listening audio"
      className="mb-5 min-w-0 rounded-2xl border border-blue-100 bg-[#EFF5FF] p-4 sm:p-5"
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <Headphones
          className="h-5 w-5 shrink-0 text-[#4F8DFB]"
          aria-hidden="true"
        />
        Listening audio
      </h2>
      <p className="mb-3 mt-1 text-sm text-slate-600">
        Listen to the recording. You can replay it while answering.
      </p>
      {!error && !ready && (
        <p role="status" className="mb-2 text-sm text-slate-600">
          Loading audio…
        </p>
      )}
      {url && (
        <audio
          key={url}
          ref={ref}
          controls
          preload="metadata"
          aria-label={`Audio for ${audio.title}`}
          className="w-full min-w-0"
          src={url}
          onLoadedMetadata={() => {
            if (ref.current) {
              if (
                Number.isFinite(ref.current.duration) &&
                position.current < ref.current.duration
              )
                ref.current.currentTime = position.current;
              setReady(true);
            }
          }}
          onError={() => {
            position.current = ref.current?.currentTime || 0;
            setError(true);
            setReady(false);
          }}
        />
      )}
      {error && (
        <div role="alert" className="mt-3 text-sm text-slate-700">
          <p>Audio could not play. Please load it again.</p>
          <Button
            variant="outline"
            className="mt-2 min-h-11 bg-white"
            onClick={() => {
              position.current = ref.current?.currentTime || position.current;
              setRetry((n) => n + 1);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reload audio
          </Button>
        </div>
      )}
    </section>
  );
}
