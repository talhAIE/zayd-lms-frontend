// Execute the real shared hook callbacks against controlled transport failures.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/hooks/useModeSession.ts'), 'utf8');
const tree = ts.createSourceFile('hook.ts', source, ts.ScriptTarget.Latest, true);
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const declarations = {}, handlers = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['dispatchAudio', 'sendAudio', 'retryAudio', 'discardAudio'].includes(node.name.getText(tree))) declarations[node.name.getText(tree)] = node.getText(tree);
  if (ts.isFunctionDeclaration(node) && ['showPendingAudioInHistory', 'hasCompletedAudioAttempt'].includes(node.name?.text)) declarations[node.name.text] = node.getText(tree);
  if (ts.isCallExpression(node) && node.expression.getText(tree) === 'newSocket.on' && ts.isStringLiteral(node.arguments[0])) handlers[node.arguments[0].text] = node.arguments[1].getText(tree);
  ts.forEachChild(node, visit);
}
visit(tree);
const flush = () => new Promise(resolve => setImmediate(resolve));
const uploads = [], errors = [], revoked = [], emitted = [];
let history = [], draft = null, fail = true, pending = false;
const noop = () => {}, ref = current => ({ current });
const sandbox = {
  isSocketAuthRecovering: () => false, newSocket: {},
  console: { log: noop, warn: noop }, ephemeral: false, avatarTransport: undefined,
  useCallback: fn => fn, lessonModeId: 'mode', recordingStorageKey: 'mode',
  isAccountBlocked: false, localAudioUrls: ref(new Set()), readingUploadRef: ref(null),
  pendingAudioRef: ref(null), pendingAudioMessageIdRef: ref(null), pendingAudioTimeoutRef: ref(null),
  modeKeyRef: ref('roleplay-mode'), modeSessionIdRef: ref('session'), modeRequestInFlightRef: ref(false),
  reconcilingAudioRef: ref(false), reconciliationTimeoutRef: ref(null), restartCompletedRef: ref(false),
  discardedAudioAttemptIdsRef: ref(new Set()), completionHandledRef: ref(false), audioConnectionWarningShownRef: ref(false),
  setHasPendingAudio: value => { pending = value; }, setChatHistory: fn => { history = typeof fn === 'function' ? fn(history) : fn; },
  setIsTyping: noop, setReadingProgress: noop, setRoleplayProgress: noop, setSessionLoadError: noop,
  setIsSessionLoading: noop, setIsCheckingMcqAnswer: noop, setLastNewRecordingAttemptId: noop,
  setModeSessionId: noop, setIsReconcilingAudio: noop, setIsCompleted: noop, setIsSocketConnected: noop,
  savePendingReadingAudio: async value => { draft = value; },
  loadPendingReadingAudio: async () => draft,
  removePendingReadingAudio: async (_key, id) => { if (draft?.id === id) draft = null; },
  createPendingAudioUrl: () => 'blob:restored', URL: { revokeObjectURL: url => revoked.push(url) },
  crypto: { randomUUID: () => 'stable-attempt' }, toast: { error: message => errors.push(message) },
  setTimeout: () => 1, clearTimeout: noop, AbortController,
  uploadReadingAudio: async params => {
    uploads.push(params);
    assert.equal(draft?.base64, params.base64, 'Persist before uploading');
    if (fail) throw Error('offline');
    return [
      { event: 'speech_transcribed', payload: { textMessage: 'Hello there.', clientAttemptId: params.attemptId } },
      { event: 'streaming_complete', payload: { ai_response: 'How are you?', messageId: 'reply' } },
    ];
  },
};
const callbacks = {};
sandbox.socket = { connected: true, emit: (...args) => emitted.push(args), listeners: event => callbacks[event] ? [callbacks[event]] : [] };
vm.createContext(sandbox);
for (const [name, text] of Object.entries(declarations)) vm.runInContext(compile(`${text.startsWith('function ') ? text : `const ${text};`} globalThis.${name} = ${name};`), sandbox);
for (const event of ['speech_transcribed', 'streaming_complete', 'error', 'chat_history', 'mode_session_started', 'disconnect']) callbacks[event] = vm.runInContext(compile(`globalThis.callback = ${handlers[event]};`), sandbox);

(async () => {
  await sandbox.sendAudio('YXVkaW8=', 'mp4', 'blob:original'); await flush();
  assert.equal(uploads[0].audioRoute, 'roleplay-audio');
  assert.equal(emitted.length, 0, 'Authenticated Roleplay uses binary HTTP');
  assert.equal(pending, true); assert.equal(history[0].deliveryStatus, 'failed');
  callbacks.disconnect();
  assert.equal(history[0].deliveryStatus, 'failed');
  callbacks.speech_transcribed({ clientAttemptId: 'stable-attempt', textMessage: 'Hello there.' });
  assert.equal(pending, true, 'Transcription alone must not discard recovery');

  // Refresh: recover the same bytes and attempt ID from the saved browser copy.
  sandbox.pendingAudioRef.current = null; sandbox.pendingAudioMessageIdRef.current = null; history = [];
  callbacks.mode_session_started({ lessonModeId: 'mode', modeSessionId: 'session', modeKey: 'roleplay-mode', chatHistory: [] }); await flush();
  assert.equal(sandbox.pendingAudioRef.current.id, 'stable-attempt');
  assert.equal(history[0].deliveryStatus, 'failed');
  sandbox.socket.connected = false; sandbox.retryAudio(); assert.equal(uploads.length, 1);
  sandbox.socket.connected = true; sandbox.reconcilingAudioRef.current = true; sandbox.retryAudio(); assert.equal(uploads.length, 1);
  sandbox.reconcilingAudioRef.current = false; fail = false; sandbox.retryAudio(); await flush();
  assert.equal(uploads[1].attemptId, uploads[0].attemptId);
  assert.equal(uploads[1].base64, uploads[0].base64);
  assert.equal(pending, false); assert.equal(draft, null);
  assert.equal(history.filter(m => m.role === 'assistant').length, 1);

  fail = true; await sandbox.sendAudio('YXVkaW8=', 'mp4', 'blob:discard'); await flush();
  await sandbox.discardAudio('stable-attempt');
  assert.equal(pending, false); assert.equal(draft, null); assert.ok(revoked.includes('blob:discard'));
  // Guest demos retain their existing isolated adapter and do not use LMS HTTP.
  sandbox.ephemeral = true; sandbox.dispatchAudio('guest', 'YQ==', 'wav', 'session');
  assert.equal(emitted.at(-1)[0], 'audio'); assert.equal(uploads.length, 3);

  const page = fs.readFileSync(path.join(root, 'src/pages/student/topics/RolePlayModeTopics.tsx'), 'utf8');
  assert.match(page, /onClick={retryAudio}/); assert.match(page, /discardAudio\(msg.id\)/);
  assert.match(page, /disabled={cooldown \|\| isTyping \|\| hasPendingAudio/);
  console.log('Roleplay recovery passed: HTTP upload, interrupted upload, refresh recovery, reconnect guards, stable retries, acknowledgement, discard and guest isolation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
