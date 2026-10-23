import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/** The authored WAV is the clock; the muted video follows its position. */
export function useAvatarPassage(audioUrl: string | undefined, videoUrl: string | undefined, onEnded: () => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const generation = useRef(0);
  const requested = useRef(false);
  const callback = useRef(onEnded);
  callback.current = onEnded;
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const pause = useCallback(() => {
    requested.current = false;
    generation.current++;
    audio.current?.pause(); videoRef.current?.pause(); setPlaying(false); setLoading(false);
  }, []);
  const synchronize = useCallback(() => {
    const a = audio.current, v = videoRef.current;
    if (!a || !v || !Number.isFinite(a.duration) || !a.duration || !Number.isFinite(v.duration) || !v.duration) return;
    const ratio = v.duration / a.duration;
    v.playbackRate = Math.min(4, Math.max(0.25, ratio));
    const target = Math.min(v.duration, a.currentTime * ratio);
    if (Math.abs(v.currentTime - target) > 0.15) v.currentTime = target;
    setPosition(a.currentTime); setDuration(a.duration);
  }, []);
  useEffect(() => {
    if (!audioUrl || !videoUrl) return;
    const a = new Audio(audioUrl); audio.current = a;
    const update = () => synchronize();
    const ended = () => { pause(); synchronize(); callback.current(); };
    const error = () => { pause(); toast.error('Passage media could not be loaded. Please try again.'); };
    const waiting = () => { videoRef.current?.pause(); setLoading(true); };
    const resumed = () => {
      if (!requested.current) return;
      synchronize();
      void videoRef.current?.play().then(() => { if (requested.current) { setLoading(false); setPlaying(true); } }).catch(error);
    };
    const video = videoRef.current;
    const videoWaiting = () => { if (requested.current) { a.pause(); setLoading(true); } };
    const videoReady = () => { if (requested.current && a.paused && !a.ended) void a.play().catch(error); };
    a.addEventListener('timeupdate', update); a.addEventListener('loadedmetadata', update);
    a.addEventListener('ended', ended); a.addEventListener('error', error); a.addEventListener('waiting', waiting);
    a.addEventListener('playing', resumed);
    video?.addEventListener('waiting', videoWaiting); video?.addEventListener('canplay', videoReady);
    setPosition(0); setDuration(0);
    return () => {
      pause();
      a.removeEventListener('timeupdate', update); a.removeEventListener('loadedmetadata', update);
      a.removeEventListener('ended', ended); a.removeEventListener('error', error); a.removeEventListener('waiting', waiting);
      a.removeEventListener('playing', resumed); video?.removeEventListener('waiting', videoWaiting); video?.removeEventListener('canplay', videoReady);
      a.removeAttribute('src'); a.load(); audio.current = null;
    };
  }, [audioUrl, videoUrl, pause, synchronize]);

  const toggle = useCallback(async () => {
    const a = audio.current, v = videoRef.current;
    if (!a || !v) { toast.error('The topic media is still loading.'); return; }
    if (!a.paused || loading) { pause(); return; }
    const request = ++generation.current;
    requested.current = true;
    if (a.ended) { a.currentTime = 0; v.currentTime = 0; }
    setLoading(true);
    try {
      // Both play calls stay in the user gesture. There is only one audible source.
      await Promise.all([a.play(), v.play()]);
      if (request !== generation.current) { a.pause(); v.pause(); return; }
      synchronize(); setPlaying(true); setLoading(false);
    } catch {
      if (request !== generation.current) return;
      pause(); toast.error('Unable to play the passage and avatar. Tap Listen to try again.');
    }
  }, [loading, pause, synchronize]);
  const restart = useCallback(() => {
    pause(); if (audio.current) audio.current.currentTime = 0;
    if (videoRef.current) videoRef.current.currentTime = 0;
    setPosition(0);
  }, [pause]);
  useEffect(() => {
    if (!audioUrl || !videoUrl) return;
    const hide = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [audioUrl, videoUrl, pause]);
  return { videoRef, playing, loading, position, duration, toggle, pause, restart, synchronize };
}
