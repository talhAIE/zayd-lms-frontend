import type { Socket } from 'socket.io-client';
import { refreshAccessToken } from '@/config/ApiConfig';

const recovering = new WeakMap<Socket, boolean>();
export const isSocketAuthRecovering = (socket: Socket) => recovering.get(socket) === true;

function identity() {
  try {
    const user = JSON.parse(localStorage.getItem('AiTutorUser') || 'null');
    return JSON.stringify([user?.id, user?.username, user?.role?.toLowerCase(), user?.region]);
  } catch { return ''; }
}

/** Attach before app listeners. Reconnect transport only; never replay an answer. */
export function attachSocketAuthRecovery(socket: Socket): () => void {
  const owner = identity();
  const initialAuth = typeof socket.auth === 'object' ? socket.auth : {};
  let active = true;
  let attempted = false;
  let pending = false;
  let sentToken: string | null = null;
  const current = () => active && owner === identity();
  socket.auth = done => {
    if (!current()) return;
    sentToken = localStorage.getItem('accessToken');
    done({ ...initialAuth, token: sentToken });
  };

  const accepted = () => { attempted = false; recovering.set(socket, false); };
  const recover = (error: { message?: string; code?: string } | string) => {
    const message = typeof error === 'string' ? error : `${error?.message || ''} ${error?.code || ''}`;
    if (!/authentication failed|unauthorized|jwt expired|invalid access token|token expired|\b401\b/i.test(message)) {
      recovering.set(socket, false);
      return;
    }
    if (pending && current()) return;
    if (!current() || attempted) { recovering.set(socket, false); return; }
    attempted = true;
    pending = true;
    recovering.set(socket, true);
    void refreshAccessToken(sentToken).then(async () => {
      // Process the server's disconnect packet before explicitly opening a new
      // connection. Socket.IO never auto-reconnects a server-forced disconnect.
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!current()) return;
      pending = false;
      socket.disconnect();
      socket.connect();
    }).catch(() => { pending = false; recovering.set(socket, false); });
  };
  const authError = () => recover('Authentication failed');
  socket.on('error', recover);
  socket.on('auth_error', authError);
  socket.on('connect_error', recover);
  const acceptedEvents = ['mode_session_started', 'chat_history', 'listening_payload', 'session_status'];
  for (const event of acceptedEvents) socket.on(event, accepted);
  return () => {
    active = false;
    recovering.delete(socket);
    socket.off('error', recover);
    socket.off('auth_error', authError);
    socket.off('connect_error', recover);
    for (const event of acceptedEvents) socket.off(event, accepted);
  };
}
