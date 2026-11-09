import axios from 'axios';
import apiClient from '@/config/ApiConfig';

export interface PrimaryOwner {
  id: string;
  username: string;
}

export interface PrimaryLesson {
  id: string;
  grade: 1 | 2 | 3;
  title: string;
  contentVersion: number;
}

export interface SpokenText {
  text: string;
  audioKey: string;
}

interface Choice extends SpokenText {
  id: string;
}

interface Vocabulary {
  meaning: string;
  example: string;
  termAudioKey: string;
  meaningAudioKey: string;
  exampleAudioKey: string;
}

export interface WordCue {
  offset: number;
  length: number;
  startMs: number;
  endMs: number;
}

export type PrimaryItem =
  | {
      id: string;
      step: 'learn';
      slide: { id: string; imageKey: string; text: string; listenAudioKey: string; vocabulary: Record<string, string> };
      sentence: { id: string; text: string; shadowAudioKey: string };
      sentenceIndex: number;
      sentenceCount: number;
      vocabulary: Record<string, Vocabulary>;
      independentPrompt: SpokenText;
    }
  | { id: string; step: 'practice'; imageKey: string; prompt: SpokenText; options: Choice[] }
  | { id: string; step: 'talk'; imageKey: string; prompt: SpokenText; models: Choice[] }
  | { id: string; step: 'life-intro'; imageKey: string; title: string; partner: string; intro: SpokenText }
  | { id: string; step: 'life'; imageKey: string; partner: string; prompt: SpokenText; hint: SpokenText };

export type PrimaryAction = 'confirm-listen' | 'select-model' | 'choose' | 'start-conversation' | 'submit' | 'advance';
type Media = { kind: 'image'; alt: string } | { kind: 'audio'; durationMs: number; wordCues?: WordCue[] };

export interface PrimarySnapshot {
  sessionId: string;
  revision: number;
  lesson: PrimaryLesson;
  progress: { completedItems: number; totalItems: number; completed: boolean };
  item: PrimaryItem | null;
  feedback: { text: string; audioKey?: string; transcript?: string; accepted?: boolean } | null;
  selectedModelId: string | null;
  draftId: string | null;
  allowedActions: (PrimaryAction | 'record')[];
  media: Record<string, Media>;
}

export type Availability = { available: false } | { available: true; lesson: PrimaryLesson };
export type PrimaryAttempt = { attemptId: string; revision: number; itemId: string } &
  ({ action: PrimaryAction; value?: string } | { action: 'record'; audio: Blob; format: string });

export function primaryOwnerMatches(owner: PrimaryOwner) {
  try {
    const user = JSON.parse(localStorage.getItem('AiTutorUser') || 'null');
    return user?.id === owner.id && user?.username === owner.username && user?.role === 'student';
  } catch {
    return false;
  }
}

export function primaryApi(owner: PrimaryOwner) {
  async function request<T>(signal: AbortSignal, path: string, data?: unknown, media = false) {
    // Bind initial requests and shared auth refresh retries to this account.
    const current = () => !signal.aborted && primaryOwnerMatches(owner);
    if (!current()) throw new axios.CanceledError();
    const config = {
      url: `/primary${path}`,
      method: data === undefined ? 'GET' : 'POST',
      data,
      signal,
      scienceSession: current,
      timeout: data instanceof FormData ? 120000 : 30000,
      responseType: media ? 'blob' as const : 'json' as const,
      headers: data instanceof FormData ? { 'Content-Type': undefined } : undefined,
    };
    const response = await apiClient.request<T>(config);
    if (!current()) throw new axios.CanceledError();
    return response.data;
  }

  const sessionPath = (id: string) => `/sessions/${encodeURIComponent(id)}`;
  return {
    availability: (signal: AbortSignal) => request<Availability>(signal, '/availability'),
    open: (signal: AbortSignal, id: string) =>
      request<PrimarySnapshot>(signal, `/lessons/${encodeURIComponent(id)}/session`, {}),
    snapshot: (signal: AbortSignal, id: string) => request<PrimarySnapshot>(signal, sessionPath(id)),
    media: (signal: AbortSignal, id: string, key: string) =>
      request<Blob>(signal, `${sessionPath(id)}/media/${encodeURIComponent(key)}`, undefined, true),
    act(signal: AbortSignal, id: string, attempt: PrimaryAttempt) {
      if (attempt.action !== 'record') {
        return request<PrimarySnapshot>(signal, `${sessionPath(id)}/actions`, attempt);
      }
      const data = new FormData();
      data.append('attemptId', attempt.attemptId);
      data.append('revision', String(attempt.revision));
      data.append('itemId', attempt.itemId);
      data.append('format', attempt.format);
      data.append('audio', attempt.audio, `recording.${attempt.format}`);
      return request<PrimarySnapshot>(signal, `${sessionPath(id)}/recording`, data);
    },
  };
}

export type PrimaryApi = ReturnType<typeof primaryApi>;
