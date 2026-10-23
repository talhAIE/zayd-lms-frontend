import type { Socket } from 'socket.io-client';
import apiClient from '@/config/ApiConfig';
import { uploadReadingAudio } from '@/utils/readingAudioUpload';
import type { AvatarReadingTransport } from '@/components/avatar-reading/AvatarReadingContext';

export interface AvatarReadingTopic { id: string; title: string; imageUrl: string | null; questionCount: number; completed: boolean }
type Listener = (...args: any[]) => void;
type Event = { event: string; payload: unknown };
const identity = () => localStorage.getItem('AiTutorUser');

export async function avatarAvailability(signal?: AbortSignal) {
  const owner = identity();
  const response = await apiClient.get<{ available: boolean }>('/3d-avatar/availability', {
    signal, ...{ scienceSession: () => identity() === owner },
  });
  return response.data.available;
}
export async function avatarReadingTopics(signal?: AbortSignal, mode: 'reading' | 'listening' = 'reading') {
  const owner = identity();
  const response = await apiClient.get<{ topics: AvatarReadingTopic[] }>(`/3d-avatar/${mode}/topics`, {
    signal, ...{ scienceSession: () => identity() === owner },
  });
  return response.data.topics;
}

/** Event adapter lets the current Reading hook use isolated HTTP endpoints. */
export function createAvatarReadingTransport(userId: string, mode: 'reading' | 'listening' = 'reading'): AvatarReadingTransport {
  const uploadOwner = identity();
  return {
    storagePrefix: `3d-avatar:${userId}:${mode === 'listening' ? 'listening:' : ''}`,
    upload: params => uploadReadingAudio({ ...params, apiPrefix: '/3d-avatar/reading', isCurrent: () => identity() === uploadOwner }),
    connect: () => {
      const handlers = new Map<string, Listener[]>();
      const controller = new AbortController();
      const owner = identity();
      const active = () => !controller.signal.aborted && identity() === owner;
      const deliver = (event: string, payload?: unknown) => {
        if (active()) for (const handler of handlers.get(event) ?? []) handler(payload);
      };
      const transport = {
        connected: false,
        io: { on: () => undefined },
        on(event: string, listener: Listener) {
          handlers.set(event, [...handlers.get(event) ?? [], listener]); return transport;
        },
        listeners: (event: string) => active() ? handlers.get(event) ?? [] : [],
        emit(event: string, body: Record<string, unknown> = {}) {
          if (!active()) return transport;
          if (event === 'session_status' || event === 'reset_activity_timer') {
            deliver('session_status', { remainingSeconds: null }); return transport;
          }
          void apiClient.post<{ events: Event[] }>(`/3d-avatar/${mode}/actions`, { action: event, ...body }, {
            signal: controller.signal, timeout: 180_000, ...{ scienceSession: active },
          }).then(response => {
            for (const item of response.data.events) deliver(item.event, item.payload);
          }).catch(error => {
            if (active()) deliver('error', { message: error.response?.data?.message || 'Unable to load this 3D activity. Please try again.' });
          });
          return transport;
        },
        disconnect() { transport.connected = false; controller.abort(); handlers.clear(); return transport; },
      };
      // Defer until useModeSession has installed its existing event handlers.
      void avatarAvailability(controller.signal).then(available => {
        if (!active()) return;
        if (!available) throw new Error('3D Reading is unavailable for this account.');
        transport.connected = true; deliver('connect');
      }).catch(error => { if (active()) deliver('connect_error', error); });
      return transport as unknown as Socket;
    },
  };
}
