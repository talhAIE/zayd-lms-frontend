// Local browser fixture for the ordinary Reading screen. No backend/microphone access.
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { AvatarReadingContext, type AvatarReadingTransport } from '../src/components/avatar-reading/AvatarReadingContext';
import ReadingModeTopics from '../src/pages/student/topics/ReadingModeTopics';
import '../src/index.css';

if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(location.hostname)) throw Error('Local fixture only');
localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'recording-fixture', role: 'student' }));
localStorage.setItem('accessToken', 'fixture-only');
const { store } = await import('../src/redux/store');
const progress = { hasListenedToPassage: true, phase: 'reading', isRetrying: true,
  currentSentenceIndex: 0, totalSentences: 3, attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], percentComplete: 0 };
const harness = {} as { finishAssessment?: () => void; unmount?: () => void };
(window as unknown as { recorderHarness: typeof harness }).recorderHarness = harness;
const transport: AvatarReadingTransport = {
  storagePrefix: 'recording-fixture:',
  upload: () => new Promise(resolve => {
    harness.finishAssessment = () => resolve([{ event: 'streaming_complete', payload: {
      ai_response: 'Good job! Now read the next sentence: "Birds sing."', feedback: '', isCompleted: false,
    } }]);
  }),
  connect: () => {
    const handlers = new Map<string, Array<(payload?: any) => void>>();
    let active = true;
    const deliver = (event: string, payload?: unknown) => {
      if (active) handlers.get(event)?.forEach(handler => handler(payload));
    };
    const socket = {
      connected: true, io: { on: () => undefined },
      on: (event: string, handler: (payload?: any) => void) => { handlers.set(event, [...handlers.get(event) ?? [], handler]); return socket; },
      listeners: (event: string) => handlers.get(event) ?? [],
      emit: (event: string) => {
        if (event === 'start_mode_session') queueMicrotask(() => deliver('mode_session_started', {
          lessonModeId: 'recording-fixture', modeSessionId: 'fixture-session', modeKey: 'reading-mode',
          contentPayload: { content: 'Read this sentence.', sentences: ['Read this sentence.'] },
          chatHistory: [], readingProgress: progress,
        }));
        return socket;
      },
      disconnect: () => { active = false; handlers.clear(); },
    };
    queueMicrotask(() => deliver('connect'));
    return socket as unknown as Socket;
  },
};
const root = createRoot(document.getElementById('root')!);
harness.unmount = () => root.unmount();
root.render(<Provider store={store}><MemoryRouter initialEntries={['/?modeId=recording-fixture']}>
  <AvatarReadingContext.Provider value={transport}><ReadingModeTopics /></AvatarReadingContext.Provider>
</MemoryRouter></Provider>);
