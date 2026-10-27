import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface AudioRecordResult {
  audioBase64: string;
  audioUrl: string;
  format: string;
}

async function isDefinitelySilent(blob: Blob): Promise<boolean> {
  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    // Only discard near-digital silence. Quiet voices and recordings that the
    // browser cannot decode still go to the speech service for assessment.
    const stride = Math.max(1, Math.floor(decoded.sampleRate / 4_000));
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const samples = decoded.getChannelData(channel);
      for (let index = 0; index < samples.length; index += stride) {
        if (Math.abs(samples[index]) > 0.002) return false;
      }
    }
    return true;
  } catch {
    return false;
  } finally {
    if (context) await context.close().catch(() => undefined);
  }
}

export function useAudioRecorder({ detectSilence = false }: { detectSilence?: boolean } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isCanceledRef = useRef(false);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startingRef = useRef(false);
  const startupRequestRef = useRef(0);
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const getSupportedMimeType = (): string | undefined => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return undefined;
  };

  const releaseResources = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      try { recorder.stop(); } catch { /* The browser may already have stopped it. */ }
    }
  }, []);

  const cleanup = useCallback(() => {
    releaseResources();
    if (!mountedRef.current) return;
    setIsRecording(false);
    setRecordTime(0);
  }, [releaseResources]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      startupRequestRef.current++;
      startingRef.current = false;
      if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
      releaseResources();
    };
  }, [releaseResources]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = useCallback(async () => {
    if (startingRef.current || mediaRecorderRef.current || isProcessingRecording) return;
    const request = ++startupRequestRef.current;
    startingRef.current = true;
    setIsStartingRecording(true);
    setRecordingError(null);
    const current = () => mountedRef.current && startupRequestRef.current === request;
    startupTimerRef.current = setTimeout(() => {
      if (!current()) return;
      startupRequestRef.current++;
      startingRef.current = false;
      setIsStartingRecording(false);
      const message = 'The microphone did not open. Check browser microphone permissions, then try again.';
      setRecordingError(message);
      toast.error(message);
    }, 20_000);
    try {
      cleanup();
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Microphone recording is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      // Permission dialogs cannot be aborted. Release late streams after a
      // cancel, timeout or navigation instead of starting a hidden recording.
      if (!current()) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('Your browser does not support any required audio formats.');
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        ...(detectSilence ? { audioBitsPerSecond: 64_000 } : {}),
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isCanceledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onerror = () => {
        if (!current()) return;
        setRecordingError('Recording failed. Please try again.');
        toast.error('Recording failed. Please try again.');
        cleanup();
      };

      recorder.start();
      setIsRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordTime((t) => t + 1);
      }, 1000);
    } catch (err: any) {
      if (!current()) return;
      let errorMessage = err instanceof Error ? err.message : 'An error occurred while accessing the microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone device found.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Microphone is already in use by another application.';
      }
      toast.error(errorMessage);
      setRecordingError(errorMessage);
      cleanup();
    } finally {
      if (current()) {
        if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
        startingRef.current = false;
        setIsStartingRecording(false);
      }
    }
  }, [cleanup, isProcessingRecording, detectSilence]);

  const stopRecording = useCallback((): Promise<AudioRecordResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanup();
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        const wasCanceled = isCanceledRef.current;
        const chunks = [...audioChunksRef.current];
        const mimeType = recorder.mimeType || getSupportedMimeType() || 'audio/webm';
        cleanup();

        if (wasCanceled) {
          resolve(null);
          return;
        }
        if (chunks.length === 0) {
          toast.error('No audio was captured. Please record the sentence again.');
          resolve(null);
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType });
        if (audioBlob.size < 200) {
          toast.error('Recording was too short. Please record the sentence again.');
          resolve(null);
          return;
        }

        setIsProcessingRecording(true);
        try {
          if (detectSilence && await isDefinitelySilent(audioBlob)) {
            toast.error('No speech was detected. Please record the sentence again.');
            resolve(null);
            return;
          }
          const audioBase64 = await blobToBase64(audioBlob);
          const audioUrl = URL.createObjectURL(audioBlob);
          const format = mimeType.split('/')[1]?.split(';')[0] || 'webm';
          resolve({ audioBase64, audioUrl, format });
        } catch {
          toast.error('Could not prepare the recording. Please try again.');
          resolve(null);
        } finally {
          setIsProcessingRecording(false);
        }
      };

      try {
        recorder.stop();
      } catch {
        cleanup();
        toast.error('Could not stop the recording. Please try again.');
        resolve(null);
      }
    });
  }, [cleanup, detectSilence]);

  const cancelRecording = useCallback(() => {
    startupRequestRef.current++;
    startingRef.current = false;
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    startupTimerRef.current = null;
    setIsStartingRecording(false);
    isCanceledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = cleanup;
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
    }
  }, [cleanup]);

  return {
    isRecording,
    isStartingRecording,
    recordingError,
    isProcessingRecording,
    recordTime,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
