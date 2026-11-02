// Executes the real guest transport with controlled network requests; no browser/login mocks.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const requests = [], window = new EventTarget();
const moduleValue = { exports: {} };
let holdStart;
const pending = [];
const fetch = async (url, config) => {
  requests.push({ url, config });
  if (holdStart && url.endsWith('/start')) return new Promise(resolve => pending.push(resolve));
  return { ok: true, json: async () => ({ events: url.endsWith('/close') ? [] : [{ event: 'mode_session_started', payload: { modeSessionId: 'guest-session' } }] }) };
};
const source = fs.readFileSync(path.join(__dirname, '../src/services/readingDemoService.ts'), 'utf8').replace('import.meta.env.VITE_API_BASE_URL', "'http://localhost:4012'");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, {
  module: moduleValue, exports: moduleValue.exports, fetch, window, crypto: require('node:crypto').webcrypto,
  AbortController, DOMException, Uint8Array, Blob, FormData, atob, setTimeout, clearTimeout, queueMicrotask,
  get localStorage() { throw new Error('Guest transport must not read account storage'); },
});
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
(async () => {
  const adapter = moduleValue.exports.createReadingDemoTransport();
  const transport = adapter.connect(), events = [];
  transport.on('connect', () => transport.emit('start_mode_session', { lessonModeId: 'demo' }));
  transport.on('mode_session_started', result => events.push(result));
  await flush();
  assert.equal(events.length, 1);
  assert.equal(requests[0].config.credentials, 'omit');
  assert.equal(requests[0].config.headers.Authorization, undefined);
  const firstToken = requests[0].config.headers['x-demo-token'];
  assert.match(firstToken, /^[a-f0-9]{64}$/);
  await adapter.upload({ sessionId: 'guest-session', attemptId: 'attempt', base64: Buffer.from('audio').toString('base64'), format: 'wav' });
  const upload = requests.at(-1);
  assert.equal(upload.config.body.get('clientAttemptId'), 'attempt');
  assert.equal(upload.config.body.get('audio').size, 5);
  transport.disconnect();
  assert.equal(requests.at(-1).config.keepalive, true);
  assert.equal(requests.at(-1).config.headers['x-demo-token'], firstToken);
  holdStart = true;
  const next = adapter.connect();
  next.on('connect', () => next.emit('start_mode_session'));
  next.on('mode_session_started', () => { throw new Error('Closed demo accepted a delayed response'); });
  await flush();
  assert.notEqual(requests.at(-1).config.headers['x-demo-token'], firstToken);
  window.dispatchEvent(new Event('pagehide'));
  assert.equal(next.connected, false);
  assert.equal(requests.at(-2).config.signal.aborted, true);
  pending[0]({ ok: true, json: async () => ({ events: [{ event: 'mode_session_started', payload: {} }] }) });
  await flush();
  holdStart = false;
  const listeningAdapter = moduleValue.exports.createReadingDemoTransport('listening');
  const listening = listeningAdapter.connect();
  listening.on('connect', () => listening.emit('start_mode_session'));
  await flush();
  assert.equal(requests.at(-1).url, 'http://localhost:4012/api/v1/public-demo/listening/start');
  assert.equal(requests.at(-1).config.credentials, 'omit');
  listening.disconnect();
  assert.equal(requests.at(-1).url, 'http://localhost:4012/api/v1/public-demo/listening/close');
  const roleplay = moduleValue.exports.createReadingDemoTransport('roleplay').connect();
  roleplay.on('connect', () => roleplay.emit('start_mode_session'));
  await flush();
  assert.equal(requests.at(-1).url, 'http://localhost:4012/api/v1/public-demo/roleplay/start');
  roleplay.emit('text', { modeSessionId: 'roleplay-session', textMessage: 'A coffee, please.' });
  await flush();
  assert.equal(JSON.parse(requests.at(-1).config.body).action, 'text');
  roleplay.emit('audio', { modeSessionId: 'roleplay-session', audioBuffer: Buffer.from('voice').toString('base64'), format: 'wav', clientAttemptId: 'voice-id' });
  await flush();
  assert.equal(requests.at(-1).url, 'http://localhost:4012/api/v1/public-demo/roleplay/roleplay-session/audio');
  assert.equal(requests.at(-1).config.body.get('clientAttemptId'), 'voice-id');
  assert.equal(requests.at(-1).config.body.get('audio').size, 5);
  assert.equal(requests.at(-1).config.headers.Authorization, undefined);
  roleplay.disconnect();
  console.log('Reading demo transport passed: no account access, binary upload, fresh tokens, abort/keepalive close, pagehide and stale response isolation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
