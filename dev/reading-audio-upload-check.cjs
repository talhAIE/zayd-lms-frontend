const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const calls = [];
let fail = false;
const client = { post: async (...args) => { calls.push(args); if (fail) throw new Error('offline'); return { data: { events: [{ event: 'reading_progress', payload: { phase: 'reading' } }] } }; } };
const moduleValue = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/utils/readingAudioUpload.ts'), 'utf8')), {
  exports: moduleValue.exports, module: moduleValue, require: () => ({ default: client }), Uint8Array, atob, Blob, FormData,
});
(async () => {
  const { uploadReadingAudio } = moduleValue.exports;
  const bytes = Buffer.alloc(1500000, 5);
  const params = { sessionId: 'session', attemptId: 'same-attempt', format: 'mp4', base64: bytes.toString('base64') };
  const events = await uploadReadingAudio(params);
  assert.equal(events[0].event, 'reading_progress');
  assert.equal(calls[0][0], '/mode-sessions/session/reading-audio');
  const file = calls[0][1].get('audio');
  assert.equal(file.size, bytes.length);
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), bytes);
  assert.equal(calls[0][1].get('clientAttemptId'), 'same-attempt');
  assert.equal(calls[0][2].headers['Content-Type'], undefined);
  fail = true;
  await assert.rejects(uploadReadingAudio(params), /offline/);
  fail = false;
  await uploadReadingAudio(params);
  assert.equal(calls.at(-1)[1].get('clientAttemptId'), 'same-attempt');
  await assert.rejects(uploadReadingAudio({ ...params, base64: Buffer.alloc(8 * 1024 * 1024 + 1).toString('base64') }), /8 MB/);

  // Execute the real hook's sendAudio callback with a recording above the old
  // cap: it must persist before dispatch and keep the draft available offline.
  const hook = ts.createSourceFile('hook.ts', fs.readFileSync(path.join(root, 'src/hooks/useModeSession.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
  let send;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(hook) === 'sendAudio') send = node.getText(hook); ts.forEachChild(node, visit); }
  visit(hook);
  const pendingAudioRef = { current: null }, timeline = [];
  const sandbox = {
    useCallback: callback => callback, socket: { connected: true }, isAccountBlocked: false, lessonModeId: 'mode', dispatchAudio: () => timeline.push('dispatch'),
    pendingAudioRef, modeKeyRef: { current: 'reading-mode' }, modeSessionIdRef: { current: 'session' }, pendingAudioMessageIdRef: { current: null },
    modeRequestInFlightRef: { current: false }, pendingAudioTimeoutRef: { current: null },
    setHasPendingAudio() {}, setChatHistory() {}, setIsTyping() {},
    savePendingReadingAudio: async draft => { assert.equal(draft.base64, params.base64); timeline.push('persist'); },
    toast: { error: message => { throw Error(message); } }, crypto: { randomUUID: () => 'stable-id' }, setTimeout: () => 1,
  };
  vm.runInNewContext(compile(`const ${send}; globalThis.run = sendAudio;`), sandbox);
  assert.equal(await sandbox.run(params.base64, 'mp4', 'blob:local'), true);
  assert.deepEqual(timeline, ['persist', 'dispatch']);
  assert.equal(pendingAudioRef.current.base64, params.base64);
  console.log('Reading binary upload: large-file transport, byte limits, stable retry IDs and persist-before-dispatch passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
