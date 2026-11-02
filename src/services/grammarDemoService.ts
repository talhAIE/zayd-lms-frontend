import type { ComponentAttemptRequest, LearningComponent, LearningLessonMode } from './learningService';

export const GRAMMAR_DEMO_ID = '24018217-2c17-442d-8683-41a7d73eb94d';
export const grammarDemoMode: LearningLessonMode = {
  id: GRAMMAR_DEMO_ID, lessonId: GRAMMAR_DEMO_ID, title: 'Grammar Mode',
  description: 'A short practice with am, is, and are.', modeKey: 'grammar-mode', modeSource: 'component',
  legacyTopicId: null, contentId: null, modeSessionId: null, status: 'in_progress',
  isRequired: true, isLocked: false, orderIndex: 0, speaking: null,
};
const base = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api/v1/public-demo/grammar`;

/** Ephemeral guest API. No account API client, cookies, storage, or LMS progress. */
export function createGrammarDemoApi() {
  let current: { token: string; controller: AbortController } | undefined;
  let completed = false;
  const close = () => {
    const session = current;
    current = undefined;
    window.removeEventListener('pagehide', close);
    if (!session) return;
    session.controller.abort();
    void fetch(`${base}/close`, { method: 'POST', credentials: 'omit', keepalive: true,
      headers: { 'x-demo-token': session.token } }).catch(() => undefined);
  };
  const request = async (path: string, body: Record<string, unknown>) => {
    const session = current;
    if (!session) throw new DOMException('Demo closed', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    session.controller.signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 30_000);
    try {
      const response = await fetch(`${base}/${path}`, { method: 'POST', credentials: 'omit',
        signal: controller.signal, headers: { 'Content-Type': 'application/json', 'x-demo-token': session.token },
        body: JSON.stringify(body) });
      const result = await response.json();
      if (current !== session || session.controller.signal.aborted) throw new DOMException('Demo closed', 'AbortError');
      if (!response.ok) throw Object.assign(new Error(typeof result.message === 'string' ? result.message : 'Unable to load grammar practice.'), { response: { data: result } });
      completed = result.completed === true;
      return result as { components: LearningComponent[]; component: LearningComponent; completed?: boolean };
    } finally {
      clearTimeout(timeout);
      session.controller.signal.removeEventListener('abort', abort);
    }
  };
  const answer = async (action: 'save' | 'submit', componentId: string, value: ComponentAttemptRequest) =>
    (await request('actions', { action, componentId, response: value.finalResponse ?? value.response, requestId: crypto.randomUUID() })).component;
  return {
    async open() {
      close(); completed = false;
      current = { token: Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join(''), controller: new AbortController() };
      window.addEventListener('pagehide', close);
      return (await request('start', {})).components;
    },
    components: async (_modeId: string) => (await request('actions', { action: 'components' })).components,
    start: async (componentId: string) => (await request('actions', { action: 'start', componentId })).component,
    save: (componentId: string, value: ComponentAttemptRequest) => answer('save', componentId, value),
    submit: (componentId: string, value: ComponentAttemptRequest) => answer('submit', componentId, value),
    finish: async () => { await request('actions', { action: 'finish' }); },
    isCompleted: () => completed,
    isOpen: () => Boolean(current),
    close,
  };
}
export type GrammarDemo = { api: ReturnType<typeof createGrammarDemoApi>; onClose: () => void };
