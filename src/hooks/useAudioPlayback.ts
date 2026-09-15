import { useState, useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type));
};



export function useAudioPlayback() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const soundRef = useRef<Howl | null>(null);
  const playbackIdRef = useRef<number | null>(null);
  const loadedAudioUrlRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onEndCalledRef = useRef(false);
  const pausedPositionRef = useRef(0);

  // Keep a ref of the current playing ID to access inside callbacks
  const currentPlayingIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentPlayingIdRef.current = playingAudioId;
  }, [playingAudioId]);

  const clearAudioProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current as unknown as number);
      progressIntervalRef.current = null;
    }
    setAudioProgress(0);
    setAudioDuration(0);
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
        loadedAudioUrlRef.current = null;
        playbackIdRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current as unknown as number);
      }
    };
  }, []);

  const toggleAudio = useCallback(
    (
      id: string,
      audioUrl: string | undefined,
      onEnd?: () => void,
      onPlayStart?: () => void
    ) => {
      if (!audioUrl) return;

      if (
        soundRef.current &&
        currentPlayingIdRef.current === id
      ) {
        const isPlayingNow = playbackIdRef.current 
          ? soundRef.current.playing(playbackIdRef.current)
          : soundRef.current.playing();
          
        if (isPlayingNow) {
          const pausedAt = playbackIdRef.current
            ? soundRef.current.seek(playbackIdRef.current)
            : soundRef.current.seek();
          pausedPositionRef.current =
            typeof pausedAt === 'number' ? pausedAt : 0;
          if (playbackIdRef.current) {
            soundRef.current.pause(playbackIdRef.current);
          } else {
            soundRef.current.pause();
          }
          setIsCurrentlyPlaying(false);
        } else {
          const playbackId = playbackIdRef.current
            ? soundRef.current.play(playbackIdRef.current)
            : soundRef.current.play();
          playbackIdRef.current = playbackId;
          if (pausedPositionRef.current > 0) {
            soundRef.current.seek(pausedPositionRef.current, playbackId);
          }
          setIsCurrentlyPlaying(true);
          // if it resumes, we reset onEndCalled just in case
          onEndCalledRef.current = false;
        }
        return;
      }

      if (soundRef.current) {
        soundRef.current.off();
        soundRef.current.stop();
        soundRef.current.unload();
        loadedAudioUrlRef.current = null;
        playbackIdRef.current = null;
      }

      currentPlayingIdRef.current = id;
      setPlayingAudioId(id);
      setIsCurrentlyPlaying(false);
      setLoadingAudioId(id);
      clearAudioProgress();
      onEndCalledRef.current = false;
      pausedPositionRef.current = 0;

      const isBlob = audioUrl.startsWith('blob:');
      let format: string | undefined;
      if (isBlob) {
        const mimeType = getSupportedMimeType();
        if (mimeType) {
          format = mimeType.split('/')[1]?.split(';')[0];
        }
        if (!format) {
          format = 'webm';
        }
      }

      const sound = new Howl({
        src: [audioUrl],
        html5: true,
        ...(format ? { format: [format] } : {}),
        onplay: (playbackId) => {
          playbackIdRef.current = playbackId;
          currentPlayingIdRef.current = id;
          setPlayingAudioId(id);
          setIsCurrentlyPlaying(true);
          setLoadingAudioId(null);
          if (onPlayStart) {
            onPlayStart();
          }
          onEndCalledRef.current = false;
          
          setAudioDuration(sound.duration());
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = setInterval(() => {
            const seek = playbackId ? sound.seek(playbackId) : sound.seek();
            setAudioProgress((seek || 0) as number);
            if (
              sound.duration() > 0 &&
              ((seek || 0) as number) >= sound.duration() - 0.1 &&
              onEnd &&
              !onEndCalledRef.current
            ) {
              onEndCalledRef.current = true;
              onEnd();
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current as unknown as number);
              }
              progressIntervalRef.current = null;
            }
          }, 100);
        },
        onpause: () => {
          const pausedAt = playbackIdRef.current
            ? sound.seek(playbackIdRef.current)
            : sound.seek();
          pausedPositionRef.current =
            typeof pausedAt === 'number' ? pausedAt : pausedPositionRef.current;
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          if (currentPlayingIdRef.current === id) {
            setIsCurrentlyPlaying(false);
          }
        },
        onend: () => {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          if (currentPlayingIdRef.current === id) {
            setIsCurrentlyPlaying(false);
          }
          setAudioProgress(0);
          pausedPositionRef.current = 0;
          if (onEnd && !onEndCalledRef.current) {
            onEndCalledRef.current = true;
            onEnd();
          }
        },
        onloaderror: () => {
          setLoadingAudioId(null);
        },
        onplayerror: () => {
          setLoadingAudioId(null);
          setIsCurrentlyPlaying(false);
        }
      });

      soundRef.current = sound;
      loadedAudioUrlRef.current = audioUrl;
      playbackIdRef.current = sound.play();
    },
    [playingAudioId, clearAudioProgress]
  );

  const stopAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.off();
      soundRef.current.stop();
      soundRef.current.unload();
      soundRef.current = null;
    }
    loadedAudioUrlRef.current = null;
    playbackIdRef.current = null;
    pausedPositionRef.current = 0;
    currentPlayingIdRef.current = null;
    setPlayingAudioId(null);
    setIsCurrentlyPlaying(false);
    setLoadingAudioId(null);
    clearAudioProgress();
    onEndCalledRef.current = false;
  }, [clearAudioProgress]);

  const pauseAudio = useCallback(() => {
    if (soundRef.current) {
      if (playbackIdRef.current) {
        soundRef.current.pause(playbackIdRef.current);
      } else {
        soundRef.current.pause();
      }
    }
    setIsCurrentlyPlaying(false);
  }, []);

  return {
    playingAudioId,
    isCurrentlyPlaying,
    loadingAudioId,
    audioProgress,
    audioDuration,
    toggleAudio,
    stopAudio,
    pauseAudio,
    clearAudioProgress,
  };
}
