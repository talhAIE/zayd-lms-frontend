import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Reusable muted gestures for dynamic Roleplay speech, not generated lip sync. */
export function useAvatarSpeakingVideo(
  videoUrl: string | undefined,
  speaking: boolean,
  stopAudio: () => void,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef(stopAudio);
  stopRef.current = stopAudio;
  const generation = useRef(0);
  const active = useRef(speaking);
  active.current = speaking;
  useEffect(() => {
    const video = videoRef.current;
    if (!videoUrl || !video) return;
    const request = ++generation.current;
    video.muted = true;
    video.loop = true;
    video.playbackRate = 1;
    if (speaking && !document.hidden) {
      void video
        .play()
        .then(() => {
          if (request !== generation.current && !active.current) video.pause();
        })
        .catch((reason) => {
          if (request !== generation.current || reason?.name === "AbortError")
            return;
          stopRef.current();
          video.pause();
          toast.error("The avatar video could not play. Please try again.");
        });
    } else video.pause();
    return () => {
      generation.current++;
      video.pause();
    };
  }, [videoUrl, speaking]);
  useEffect(() => {
    const video = videoRef.current;
    if (!videoUrl || !video) return;
    const hide = () => {
      if (document.hidden) {
        active.current = false;
        generation.current++;
        video.pause();
        stopRef.current();
      }
    };
    const error = () => {
      generation.current++;
      video.pause();
      stopRef.current();
      toast.error("The avatar video could not be loaded.");
    };
    document.addEventListener("visibilitychange", hide);
    video.addEventListener("error", error);
    return () => {
      generation.current++;
      video.pause();
      stopRef.current();
      document.removeEventListener("visibilitychange", hide);
      video.removeEventListener("error", error);
    };
  }, [videoUrl]);
  return videoRef;
}
