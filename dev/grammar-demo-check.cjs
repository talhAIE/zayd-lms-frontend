// Execute the real guest transport and shared completion handler without an account.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const demoMode = process.argv[2] || 'grammar';
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const source = fs.readFileSync(path.join(root, 'src/services/grammarDemoService.ts'), 'utf8').replace('import.meta.env.VITE_API_BASE_URL', "'http://localhost:4000'");
const calls = [], listeners = new Map(), loaded = { exports: {} };
let pending, completed = false;
vm.runInNewContext(compile(source), {
  module: loaded, exports: loaded.exports, crypto: webcrypto, AbortController, DOMException, Uint8Array, setTimeout, clearTimeout,
  window: { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
  fetch: async (url, options) => {
    calls.push({ url, ...options });
    if (pending && url.endsWith('/actions')) return new Promise(resolve => { pending.resolve = resolve; });
    return { ok: true, json: async () => ({ components: [], component: { id: 'activity' }, completed }) };
  },
});
(async () => {
  const api = loaded.exports.createComponentDemoApi(demoMode);
  await api.open();
  const first = calls[0].headers['x-demo-token'];
  assert.match(first, /^[a-f0-9]{64}$/);
  await api.save('activity', { response: { answers: { i: 'am' } } });
  assert.equal(JSON.parse(calls[1].body).action, 'save');
  pending = {};
  const late = api.components('demo');
  const rejected = assert.rejects(late, { name: 'AbortError' });
  const delayed = pending; pending = undefined;
  api.close();
  assert.equal(calls[2].signal.aborted, true);
  delayed.resolve({ ok: true, json: async () => ({ completed: true, components: [] }) });
  await rejected;
  assert.equal(api.isCompleted(), false, 'A closed request must not update the next opening');
  await api.open();
  assert.notEqual(calls.at(-1).headers['x-demo-token'], first);
  completed = true;
  await api.submit('activity', { response: { optionId: 'choice' } });
  assert.equal(api.isCompleted(), true);
  listeners.get('pagehide')();
  await assert.rejects(api.components('demo'), { name: 'AbortError' });
  assert.equal(listeners.size, 0);
  for (const call of calls) {
    assert.equal(call.credentials, 'omit');
    assert.ok(call.url.startsWith(`http://localhost:4000/api/v1/public-demo/${demoMode}/`));
    assert.equal(call.headers.Authorization, undefined);
  }

  const page = ts.createSourceFile('ComponentModePlay.tsx', fs.readFileSync(path.join(root, 'src/pages/student/ComponentModePlay.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const handlers = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ['handleCompleteMode', 'handleComponentSubmit', 'handleBack'].includes(node.name.getText(page))) handlers[node.name.getText(page)] = node.initializer.getText(page);
    ts.forEachChild(node, visit);
  }
  visit(page);
  let closes = 0, demoCompletions = 0, modeComplete = false;
  const demo = { api: { isCompleted: () => modeComplete, finish: async () => {} }, onClose: () => closes++, onComplete: () => demoCompletions++ };
  const bind = (name, context) => vm.runInNewContext(compile(`(${handlers[name]})`), { demo, ...context });
  await bind('handleCompleteMode', {})();
  bind('handleBack', {})();
  const submit = bind('handleComponentSubmit', {
    components: [{ id: 'quiz', componentType: 'mcq' }], draftSaves: { current: new Map() },
    submitComponentAttempt: async () => ({ id: 'quiz', isComplete: true, attempt: null }),
    setComponents() {}, setCompletedComponentIds() {}, toast: { success() {}, error() {} }, console,
  });
  await submit('quiz', { optionId: 'choice' });
  assert.equal(demoCompletions, 1, 'An intermediate submission does not complete the demo');
  modeComplete = true;
  await submit('quiz', { optionId: 'choice' });
  assert.equal(demoCompletions, 2, 'Confirmed completion shows the celebration');
  assert.equal(closes, 1, 'Only the back action closes the dialog');
  console.log(`${demoMode} demo passed: guest-only API, fresh tokens, abort/late-result cleanup, celebration only on completion.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
