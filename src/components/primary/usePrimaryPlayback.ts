import { useCallback, useEffect, useRef, useState } from 'react';

export function usePrimaryPlayback() {
  const active = useRef<{ controller: AbortController; audio?: HTMLAudioElement; url?: string } | null>(null);
  const [playback, setPlayback] = useState<{ key: string; timeMs: number } | null>(null);
  const [audioError, setAudioError] = useState('');

  const release = useCallback(() => {
    const current = active.current;
    if (!current) return;
    active.current = null;
    current.controller.abort();
    if (current.audio) {
      current.audio.pause();
      current.audio.removeAttribute('src');
      current.audio.load();
    }
    if (current.url) URL.revokeObjectURL(current.url);
  }, []);
  useEffect(() => release, [release]);

  const stop = useCallback(() => {
    release();
    setPlayback(null);
  }, [release]);

  async function play(key: string, load: (signal: AbortSignal) => Promise<Blob>, onEnded?: () => void) {
    if (playback?.key === key) {
      stop();
      return;
    }
    stop();
    setAudioError('');
    const current: NonNullable<typeof active.current> = { controller: new AbortController() };
    active.current = current;
    setPlayback({ key, timeMs: 0 });
    const failed = () => {
      if (active.current !== current) return;
      stop();
      setAudioError('The audio could not play. Tap Listen to try again.');
    };
    try {
      const blob = await load(current.controller.signal);
      if (active.current !== current) return;
      current.url = URL.createObjectURL(blob);
      const audio = new Audio(current.url);
      current.audio = audio;
      audio.addEventListener('error', failed, { once: true });
      audio.addEventListener('timeupdate', () => {
        if (active.current === current) setPlayback({ key, timeMs: audio.currentTime * 1000 });
      });
      audio.addEventListener('ended', () => {
        if (active.current !== current) return;
        stop();
        onEnded?.();
      }, { once: true });
      await audio.play();
    } catch {
      failed();
    }
  }

  return { play, stop, playback, audioError };
}
