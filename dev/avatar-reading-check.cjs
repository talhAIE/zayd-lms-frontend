// Runs the actual playback hook and HTTP transport with controlled media/HTTP.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const ts = require('typescript');
const source = name => ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
class Media extends EventTarget {
  constructor(url) { super(); this.src = url; this.currentTime = 0; this.duration = 10; this.paused = true; this.ended = false; this.playbackRate = 1; }
  async play() { this.paused = false; this.dispatchEvent(new Event('playing')); }
  pause() { this.paused = true; }
  removeAttribute() {} load() { this.loads = (this.loads || 0) + 1; }
}
async function playback() {
  const effects = [], values = [], refs = [], errors = [];
  const video = new Media('video'); video.duration = 20;
  const document = new EventTarget(); document.hidden = false;
  const react = {
    useRef(value) { const ref = { current: refs.length === 1 ? video : value }; refs.push(ref); return ref; },
    useState(value) { const index = values.length; values.push(value); return [value, next => { values[index] = next; }]; },
    useCallback(fn) { return fn; }, useEffect(fn) { effects.push(fn); },
  };
  const module = { exports: {} };
  vm.runInNewContext(source('components/avatar-reading/useAvatarPassage.ts'), {
    exports: module.exports, module, require: name => name === 'react' ? react : { toast: { error: value => errors.push(value) } }, Audio: Media, document,
  });
  let ended = 0;
  const hook = module.exports.useAvatarPassage('audio', 'video', () => ended++);
  const cleanup = effects.map(fn => fn());
  const audio = refs[0].current;
  assert(video.currentTime > 0 && video.currentTime < .1, 'Prepare a decoded idle frame');
  assert.equal(video.paused, true); assert.equal(audio.paused, true); assert.equal(ended, 0);
  await hook.toggle(); await flush();
  assert.equal(audio.paused, false); assert.equal(video.paused, false); assert.equal(video.playbackRate, 2);
  audio.currentTime = 3; audio.dispatchEvent(new Event('timeupdate'));
  assert.equal(video.currentTime, 6);
  hook.pause(); assert.equal(audio.paused, true); assert.equal(video.paused, true);
  await hook.toggle(); await flush(); assert.equal(audio.currentTime, 3);
  document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(audio.paused, true); assert.equal(video.paused, true);
  document.hidden = false;
  await hook.toggle(); await flush();
  audio.currentTime = 10; audio.ended = true; audio.dispatchEvent(new Event('ended'));
  assert.equal(ended, 1); assert.equal(video.paused, true);
  hook.restart(); assert.equal(audio.currentTime, 0); assert(video.currentTime > 0 && video.currentTime < .1);
  video.dispatchEvent(new Event('error')); assert.equal(errors.length, 1);
  hook.retryVideo(); assert.equal(video.loads, 1); assert.equal(video.paused, true); assert.equal(audio.paused, true);
  for (const fn of cleanup) fn?.();
  assert.equal(audio.paused, true); assert.equal(errors.length, 1);
}
async function transport() {
  let account = 'first-user'; const calls = [], uploads = [], delivered = [];
  const client = {
    get: async () => ({ data: { available: true } }),
    post: async (...args) => { calls.push(args); return { data: { events: [
      { event: 'mode_session_started', payload: { modeSessionId: 'session-1', contentPayload: { content: 'Read this sentence.', contentAudioUrl: 'audio', narrationVideoUrl: 'video' } } },
      { event: 'reading_progress', payload: { phase: 'reading' } },
    ] } }; },
  };
  const module = { exports: {} };
  vm.runInNewContext(source('services/avatarReadingService.ts'), {
    exports: module.exports, module, AbortController,
    localStorage: { getItem: () => account },
    require: name => name.includes('ApiConfig') ? { default: client } : { uploadReadingAudio: async p => uploads.push(p) },
  });
  const options = module.exports.createAvatarReadingTransport('user-1');
  assert.equal(options.storagePrefix, '3d-avatar:user-1:');
  const socket = options.connect(); socket.on('connect', () => delivered.push('connected'));
  socket.on('reading_progress', data => delivered.push(data.phase));
  await flush(); assert.equal(socket.connected, true);
  socket.emit('start_mode_session', { lessonModeId: 'topic-1' }); await flush();
  assert.equal(calls[0][0], '/3d-avatar/reading/actions');
  assert.equal(calls[0][1].action, 'start_mode_session');
  assert.deepEqual(delivered, ['connected', 'reading']);
  await options.upload({ sessionId: 'session-1', attemptId: 'retry-1' });
  assert.equal(uploads[0].apiPrefix, '/3d-avatar/reading');
  assert.equal(uploads[0].isCurrent(), true);
  account = 'second-user'; assert.equal(uploads[0].isCurrent(), false);
  socket.emit('submit_mcqs', {}); await flush(); assert.equal(calls.length, 1);
  socket.disconnect(); assert.equal(socket.connected, false);
}
(async () => { await playback(); await transport(); console.log('3D Reading: synchronized media controls, cleanup, isolated endpoints, recording scope and stale-account cancellation passed.'); })()
  .catch(error => { console.error(error); process.exitCode = 1; });
