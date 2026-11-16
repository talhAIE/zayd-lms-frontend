import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { watchAvatarPreview } from './avatarPreview';

type Track = 'topic' | 'narrator';

/** One audible recording at a time; avatar playback follows the selected track. */
export function useAvatarListeningPlayback(topicUrl: string | undefined, narratorUrl: string | undefined,
  videoUrl: string | undefined, stage: string | undefined, onTopicEnded: () => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tracks = useRef<Partial<Record<Track, HTMLAudioElement>>>({});
  const active = useRef<Track | null>(null);
  const requested = useRef(false);
  const generation = useRef(0);
  const endedCallback = useRef(onTopicEnded);
  endedCallback.current = onTopicEnded;
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoState, setVideoState] = useState<'loading' | 'ready' | 'error'>('loading');
  const videoUnavailable = useRef(false);
  const preview = useRef<ReturnType<typeof watchAvatarPreview> | null>(null);

  const showIdleFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    // A small seek requests a decoded frame on mobile browsers without autoplay.
    video.loop = false;
    video.currentTime = Math.min(0.05, video.duration / 2);
  }, []);

  const pause = useCallback(() => {
    requested.current = false;
    generation.current++;
    Object.values(tracks.current).forEach(audio => audio?.pause());
    videoRef.current?.pause();
    setPlaying(false); setLoading(false);
  }, []);

  const synchronize = useCallback(() => {
    const a = active.current ? tracks.current[active.current] : undefined;
    const v = videoRef.current;
    if (a && active.current === 'topic') { setPosition(a.currentTime); setDuration(Number.isFinite(a.duration) ? a.duration : 0); }
    if (videoUnavailable.current) return;
    if (!a || !v || !Number.isFinite(a.duration) || !a.duration || !Number.isFinite(v.duration) || !v.duration) return;
    // Passage and video recordings have different durations. Fit the complete
    // video to the passage timeline. Short instruction clips use natural gestures.
    const ratio = active.current === 'topic' ? v.duration / a.duration : 1;
    v.loop = active.current === 'narrator';
    v.playbackRate = Math.min(4, Math.max(0.25, ratio));
    const target = active.current === 'topic' ? Math.min(v.duration, a.currentTime * ratio) : a.currentTime % v.duration;
    if (Math.abs(v.currentTime - target) > 0.15) v.currentTime = target;
  }, []);

  useEffect(() => {
    if (!videoUrl) return;
    const cleanup: Array<() => void> = [];
    const error = () => { pause(); toast.error('Listening media could not be played. Please try again.'); };
    for (const [name, url] of Object.entries({topic:topicUrl,narrator:narratorUrl})) {
      if (!url) continue;
      const key = name as Track;
      const audio = new Audio(url);
      audio.preload = 'metadata';
      tracks.current[key] = audio;
      const update = () => { if (active.current === key) synchronize(); };
      const ended = () => {
        if (active.current !== key) return;
        pause(); synchronize();
        active.current = null; setTrack(null); showIdleFrame();
        if (key === 'topic') endedCallback.current();
      };
      const waiting = () => { if (active.current === key && requested.current) { videoRef.current?.pause(); setLoading(true); } };
      const resumed = () => {
        if (active.current !== key || !requested.current) return;
        const request = generation.current;
        synchronize();
        if (videoUnavailable.current) { setPlaying(true); setLoading(false); return; }
        void videoRef.current?.play().then(() => {
          if (request === generation.current && requested.current) {setPlaying(true);setLoading(false);}
        }).catch(reason => {if (request === generation.current && reason?.name !== 'AbortError') error();});
      };
      const handlers = {timeupdate:update,loadedmetadata:update,ended,error,waiting,playing:resumed};
      Object.entries(handlers).forEach(([event, fn]) => audio.addEventListener(event,fn));
      cleanup.push(() => {
        Object.entries(handlers).forEach(([event, fn]) => audio.removeEventListener(event,fn));
        audio.removeAttribute('src'); audio.load();
      });
    }
    const video = videoRef.current;
    const videoWaiting = () => {
      if (!requested.current || !active.current) return;
      tracks.current[active.current]?.pause(); setLoading(true);
    };
    const videoReady = () => {
      if (video && video.readyState >= 2) { videoUnavailable.current = false; setVideoState('ready'); }
      const audio = active.current ? tracks.current[active.current] : undefined;
      const request = generation.current;
      if (requested.current && audio?.paused && !audio.ended) void audio.play().catch(reason => {
        if (request === generation.current && requested.current && reason?.name !== 'AbortError') error();
      });
      else if (requested.current && audio && !audio.paused && video?.paused) {
        void video.play().then(() => {
          if (request === generation.current && requested.current) { setPlaying(true); setLoading(false); }
        }).catch(reason => { if (request === generation.current && reason?.name !== 'AbortError') error(); });
      }
    };
    const videoFailed = () => { videoUnavailable.current = true; error(); };
    video?.addEventListener('waiting',videoWaiting);
    video?.addEventListener('canplay',videoReady);
    video?.addEventListener('loadeddata',videoReady);
    active.current = null; setTrack(null); setPosition(0); setDuration(0);
    videoUnavailable.current = false;
    const watcher = video ? watchAvatarPreview(video, {
      active: () => requested.current,
      state: state => { setVideoState(state); if (state === 'ready') videoUnavailable.current = false; },
      failed: videoFailed,
    }) : null;
    preview.current = watcher;
    return () => {
      watcher?.dispose(); preview.current = null;
      pause(); cleanup.forEach(fn=>fn()); tracks.current = {}; active.current = null;
      video?.removeEventListener('waiting',videoWaiting); video?.removeEventListener('canplay',videoReady);
      video?.removeEventListener('loadeddata',videoReady);
    };
  }, [topicUrl,narratorUrl,videoUrl,stage,pause,synchronize,showIdleFrame]);

  const toggle = useCallback(async (name: Track) => {
    const audio = tracks.current[name], video = videoRef.current;
    if (!audio || !video) {toast.error('The listening media is still loading.');return;}
    if (active.current === name && requested.current) {pause();return;}
    pause();
    if (active.current !== name || audio.ended) {audio.currentTime=0;video.currentTime=0;}
    active.current=name;setTrack(name);requested.current=true;
    const request=++generation.current;setLoading(true);synchronize();
    try {
      if (audio.error) audio.load();
      // An unavailable avatar must not prevent the learner hearing the story.
      await Promise.all([audio.play(),videoUnavailable.current ? Promise.resolve() : video.play()]);
      if (request !== generation.current) {
        // A newer track may already be playing on this same video element.
        if (active.current !== name) audio.pause();
        if (!requested.current) {audio.pause();video.pause();}
        return;
      }
      synchronize();setPlaying(true);setLoading(false);
    } catch (error) {
      if (request !== generation.current) return;
      // Video buffering deliberately pauses audio; canplay resumes both.
      if ((error as {name?:string})?.name === 'AbortError' && requested.current) return;
      console.warn('[3D Listening] Playback failed', error instanceof Error ? `${error.name}: ${error.message}` : 'Media error');
      pause();toast.error('Unable to play listening audio and avatar. Please try again.');
    }
  },[pause,synchronize]);

  const restart = useCallback(() => {
    pause();Object.values(tracks.current).forEach(audio=>{if(audio) audio.currentTime=0;});
    active.current = null; setTrack(null); showIdleFrame();
    setPosition(0);
  },[pause,showIdleFrame]);
  const retryVideo = useCallback(() => {
    restart(); videoUnavailable.current = false; setVideoState('loading');
    preview.current?.retry();
  },[restart]);
  useEffect(() => {
    if (!videoUrl) return;
    const hide=()=>{if(document.hidden) pause();};
    document.addEventListener('visibilitychange',hide);
    return ()=>document.removeEventListener('visibilitychange',hide);
  },[videoUrl,pause]);
  return {videoRef,videoState,retryVideo,track,playing,loading,position,duration,pause,toggle,restart,synchronize};
}
