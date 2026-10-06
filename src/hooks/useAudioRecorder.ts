import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface AudioRecordResult {
  audioBase64: string;
  audioUrl: string;
  format: string;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isCanceledRef = useRef(false);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const cleanup = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordTime(0);
  }, []);

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
    try {
      cleanup();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        toast.error('Your browser does not support any required audio formats.');
        cleanup();
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isCanceledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onerror = () => {
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
      let errorMessage = 'An error occurred while accessing the microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone device found.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Microphone is already in use by another application.';
      }
      toast.error(errorMessage);
      cleanup();
    }
  }, [cleanup]);

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

        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const audioUrl = URL.createObjectURL(audioBlob);
          const format = mimeType.split('/')[1]?.split(';')[0] || 'webm';
          resolve({ audioBase64, audioUrl, format });
        } catch {
          toast.error('Could not prepare the recording. Please try again.');
          resolve(null);
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
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    isCanceledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
    }
  }, [cleanup]);

  return {
    isRecording,
    recordTime,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
