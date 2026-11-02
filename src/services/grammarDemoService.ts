import type { ComponentAttemptRequest, JsonObject, LearningComponent, LearningLessonMode, WritingParagraphCompilation, WritingReviewResponse } from './learningService';

export const GRAMMAR_DEMO_ID = '24018217-2c17-442d-8683-41a7d73eb94d';
export const grammarDemoMode: LearningLessonMode = {
  id: GRAMMAR_DEMO_ID, lessonId: GRAMMAR_DEMO_ID, title: 'Grammar Mode',
  description: 'A short practice with am, is, and are.', modeKey: 'grammar-mode', modeSource: 'component',
  legacyTopicId: null, contentId: null, modeSessionId: null, status: 'in_progress',
  isRequired: true, isLocked: false, orderIndex: 0, speaking: null,
};
const apiBase = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api/v1/public-demo`;

/** Ephemeral guest API. No account API client, cookies, storage, or LMS progress. */
export function createComponentDemoApi(mode: 'grammar' | 'writing' | 'vocabulary' = 'grammar') {
  const base = `${apiBase}/${mode}`;
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
  const request = async <T = { components: LearningComponent[]; component: LearningComponent; completed?: boolean }>(path: string, body: Record<string, unknown>): Promise<T> => {
    const session = current;
    if (!session) throw new DOMException('Demo closed', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    session.controller.signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, mode === 'writing' ? 180_000 : 30_000);
    try {
      const response = await fetch(`${base}/${path}`, { method: 'POST', credentials: 'omit',
        signal: controller.signal, headers: { 'Content-Type': 'application/json', 'x-demo-token': session.token },
        body: JSON.stringify(body) });
      const result = await response.json();
      if (current !== session || session.controller.signal.aborted) throw new DOMException('Demo closed', 'AbortError');
      if (!response.ok) throw Object.assign(new Error(typeof result.message === 'string' ? result.message : `Unable to load ${mode} practice.`), { response: { data: result } });
      completed = result.completed === true;
      return result as T;
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
    compile: (_modeId: string) => request<WritingParagraphCompilation>('actions', { action: 'compile', requestId: crypto.randomUUID() }),
    review: (componentId: string, response: JsonObject, options: { idempotencyKey?: string } = {}) => request<WritingReviewResponse>('actions', { action: 'review', componentId, response, requestId: options.idempotencyKey ?? crypto.randomUUID() }),
    reveal: (submissionId: string) => request<WritingReviewResponse>('actions', { action: 'reveal', submissionId }),
    latest: async (componentId: string) => (await request<{ review: WritingReviewResponse | null }>('actions', { action: 'latest', componentId })).review,
    close,
  };
}
export const createGrammarDemoApi = () => createComponentDemoApi('grammar');
export type GrammarDemo = { api: ReturnType<typeof createComponentDemoApi>; onClose: () => void; mode?: LearningLessonMode;
  writing?: Pick<ReturnType<typeof createComponentDemoApi>, 'compile' | 'review' | 'reveal' | 'latest'> };
