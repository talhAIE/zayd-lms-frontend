import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { watchAvatarPreview, type AvatarVideoState } from './avatarPreview';

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
  const preview = useRef<ReturnType<typeof watchAvatarPreview> | null>(null);
  const [videoState, setVideoState] = useState<AvatarVideoState>('loading');
  useEffect(() => {
    const video = videoRef.current;
    if (!videoUrl || !video) return;
    const request = ++generation.current;
    video.muted = true;
    video.loop = true;
    video.playbackRate = 1;
    const play = () => {
      if (!active.current || document.hidden || request !== generation.current) return;
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
    };
    if (speaking && !document.hidden) play();
    else video.pause();
    video.addEventListener('canplay', play);
    return () => {
      generation.current++;
      video.pause();
      video.removeEventListener('canplay', play);
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
    const watcher = watchAvatarPreview(video, {
      active: () => active.current,
      state: setVideoState,
      failed: error,
    });
    preview.current = watcher;
    document.addEventListener("visibilitychange", hide);
    return () => {
      watcher.dispose(); preview.current = null;
      generation.current++;
      video.pause();
      stopRef.current();
      document.removeEventListener("visibilitychange", hide);
    };
  }, [videoUrl]);
  const retryVideo = useCallback(() => {
    active.current = false;
    generation.current++;
    videoRef.current?.pause();
    stopRef.current();
    preview.current?.retry();
  }, []);
  return { videoRef, videoState, retryVideo };
}
