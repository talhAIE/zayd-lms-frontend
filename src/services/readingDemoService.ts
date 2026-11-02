import type { Socket } from 'socket.io-client';
import type { AvatarReadingTransport } from '@/components/avatar-reading/AvatarReadingContext';

export const READING_DEMO_ID = '74baf277-61bd-4f07-bfee-9fe1842cb935';
export const LISTENING_DEMO_ID = 'ae0b7f95-ce37-4689-9a41-4cd3c96267e6';
const apiBase = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api/v1/public-demo`;
type Event = { event: string; payload: any };
type Listener = (...args: any[]) => void;

/** Guest-only transport: never reads account tokens or uses login/refresh interceptors. */
export function createReadingDemoTransport(mode: 'reading' | 'listening' = 'reading'): AvatarReadingTransport {
  const base = `${apiBase}/${mode}`;
  let current: { token: string; controller: AbortController } | undefined;
  const request = async (path: string, body: Record<string, unknown> | FormData, signal?: AbortSignal) => {
    const session = current;
    if (!session || session.controller.signal.aborted) throw new DOMException('Demo closed', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    session.controller.signal.addEventListener('abort', abort, { once: true });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 180_000);
    try {
      const multipart = body instanceof FormData;
      const response = await fetch(`${base}/${path}`, {
        method: 'POST', credentials: 'omit', signal: controller.signal,
        headers: { 'x-demo-token': session.token, ...(multipart ? {} : { 'Content-Type': 'application/json' }) },
        body: multipart ? body : JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw Object.assign(new Error(typeof result.message === 'string' ? result.message : 'The demo request failed.'), { response: { data: result } });
      return result as { events: Event[] };
    } finally {
      clearTimeout(timer);
      session.controller.signal.removeEventListener('abort', abort);
      signal?.removeEventListener('abort', abort);
    }
  };
  return {
    storagePrefix: `public-demo:${mode}:`,
    upload: async params => {
      const bytes = Uint8Array.from(atob(params.base64), c => c.charCodeAt(0));
      if (bytes.length > 3 * 1024 * 1024) throw new Error('Please record a shorter reading attempt (maximum 3 MB).');
      const body = new FormData();
      body.append('audio', new Blob([bytes], { type: `audio/${params.format}` }), `reading.${params.format}`);
      body.append('format', params.format); body.append('clientAttemptId', params.attemptId);
      return (await request(`${encodeURIComponent(params.sessionId)}/reading-audio`, body, params.signal)).events;
    },
    connect: () => {
      const session = { token: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''), controller: new AbortController() };
      current = session;
      const handlers = new Map<string, Listener[]>();
      const active = () => current === session && !session.controller.signal.aborted;
      const deliver = (event: string, payload: unknown) => { if (active()) for (const listener of handlers.get(event) ?? []) listener(payload); };
      const transport = {
        connected: true, io: { on: () => undefined },
        on(event: string, listener: Listener) { handlers.set(event, [...handlers.get(event) ?? [], listener]); return transport; },
        listeners: (event: string) => active() ? handlers.get(event) ?? [] : [],
        emit(event: string, body: Record<string, unknown> = {}) {
          if (!active()) return transport;
          if (event === 'reset_activity_timer') return transport;
          const starting = event === 'start_mode_session';
          void request(starting ? 'start' : 'actions', starting ? {} : { action: event, ...body }).then(result => {
            for (const item of result.events) deliver(item.event, item.payload);
          }).catch(error => {
            if (active()) deliver('error', { message: error.message || 'Unable to load the demo. Please try again.', code: error.response?.data?.code });
          });
          return transport;
        },
        disconnect() {
          if (!active()) return transport;
          transport.connected = false; session.controller.abort(); handlers.clear();
          window.removeEventListener('pagehide', close);
          // Keepalive also handles closing the tab while a request is running.
          void fetch(`${base}/close`, { method: 'POST', credentials: 'omit', keepalive: true, headers: { 'x-demo-token': session.token } }).catch(() => undefined);
          return transport;
        },
      };
      const close = () => { transport.disconnect(); };
      window.addEventListener('pagehide', close);
      queueMicrotask(() => deliver('connect', undefined));
      return transport as unknown as Socket;
    },
  };
}
