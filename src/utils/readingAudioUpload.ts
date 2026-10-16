import apiClient from '@/config/ApiConfig';

export const MAX_READING_AUDIO_BYTES = 8 * 1024 * 1024;
export const READING_AUDIO_TIMEOUT_MS = 180_000;

export async function uploadReadingAudio(params: {
  sessionId: string; attemptId: string; base64: string; format: string; signal?: AbortSignal;
}) {
  const bytes = Uint8Array.from(atob(params.base64), character => character.charCodeAt(0));
  if (bytes.length > MAX_READING_AUDIO_BYTES) throw new Error('The recording exceeds 8 MB. Discard it and record up to 3 minutes again.');
  const form = new FormData();
  form.append('audio', new Blob([bytes], { type: `audio/${params.format}` }), `reading.${params.format}`);
  form.append('format', params.format);
  form.append('clientAttemptId', params.attemptId);
  const response = await apiClient.post<{ events: Array<{ event: string; payload: any }> }>(
    `/mode-sessions/${encodeURIComponent(params.sessionId)}/reading-audio`, form,
    { headers: { 'Content-Type': undefined }, timeout: READING_AUDIO_TIMEOUT_MS, signal: params.signal },
  );
  return response.data.events;
}
