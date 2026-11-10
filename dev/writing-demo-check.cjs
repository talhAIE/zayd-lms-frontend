// Exercise the actual Writing guest API: no auth client, persistent storage, or LMS endpoints.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/services/grammarDemoService.ts'), 'utf8').replace('import.meta.env.VITE_API_BASE_URL', "'http://localhost:4000'");
const calls = [], listeners = new Map(), loaded = { exports: {} };
let delayed;
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, {
  module: loaded, exports: loaded.exports, crypto: require('node:crypto').webcrypto, AbortController, DOMException, Uint8Array, setTimeout, clearTimeout,
  window: { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
  fetch: async (url, options) => {
    calls.push({ url, ...options });
    const body = options.body ? JSON.parse(options.body) : {};
    if (delayed && body.action === 'review') return new Promise(resolve => { delayed.resolve = resolve; });
    return { ok: true, json: async () => ({ components: [], component: { id: 'paragraph' }, paragraphComponent: { id: 'paragraph' }, compiledParagraph: 'My routine.',
      ...(body.action === 'latest' ? { review: { id: 'submission' } } : {}), id: 'submission' }) };
  },
});
(async () => {
  const api = loaded.exports.createComponentDemoApi('writing');
  await api.open(); const first = calls.at(-1).headers['x-demo-token'];
  await api.start('teaching');
  await api.save('table', { response: { rows: [] } });
  await api.submit('table', { response: { rows: [{ questionId: 'morning', sentence: 'I wake up early.' }] } });
  assert.equal((await api.compile('mode')).compiledParagraph, 'My routine.');
  const key = 'writing-idempotency-key';
  await api.review('paragraph', { paragraph: 'My routine.' }, { idempotencyKey: key });
  assert.equal(JSON.parse(calls.at(-1).body).requestId, key);
  assert.equal((await api.latest('paragraph')).id, 'submission');
  await api.reveal('submission'); await api.components('mode');
  delayed = {};
  const review = api.review('paragraph', { paragraph: 'Another routine.' });
  const rejection = assert.rejects(review, { name: 'AbortError' });
  const inFlight = calls.at(-1), pending = delayed; delayed = undefined;
  api.close(); assert.equal(inFlight.signal.aborted, true);
  pending.resolve({ ok: true, json: async () => ({ id: 'late-review', completed: true }) }); await rejection;
  assert.equal(api.isOpen(), false); assert.equal(api.isCompleted(), false);
  await api.open(); assert.notEqual(calls.at(-1).headers['x-demo-token'], first);
  await api.finish(); listeners.get('pagehide')(); assert.equal(listeners.size, 0);
  for (const call of calls) {
    assert.ok(call.url.startsWith('http://localhost:4000/api/v1/public-demo/writing/'));
    assert.equal(call.credentials, 'omit'); assert.equal(call.headers.Authorization, undefined);
  }
  const page = ts.createSourceFile('ComponentModePlay.tsx', fs.readFileSync(path.join(__dirname, '../src/pages/student/ComponentModePlay.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let submit;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(page) === 'submitWritingParagraph') submit = node.initializer.getText(page);
    ts.forEachChild(node, visit);
  }
  visit(page); assert.ok(submit);
  const errors = [];
  const context = { demo: { api: { isOpen: () => false } }, modeId: 'demo', draftSaves: { current: new Map() },
    compileWritingParagraph: async () => { throw new DOMException('Closed', 'AbortError'); }, toast: { error: message => errors.push(message) } };
  const handler = vm.runInNewContext(ts.transpileModule(`(${submit})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  await handler({ id: 'paragraph' }, 'My routine.');
  assert.deepEqual(errors, [], 'Closing a review must not show a late error toast');
  console.log('Writing guest API passed: compile/review/reveal/finish use only public endpoints, stable review keys, fresh sessions, abort and late-result cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
