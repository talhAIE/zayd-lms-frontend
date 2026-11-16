// Offline regression for the mobile cold-load and first-gesture media races.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), ts = require('typescript');
const previewFixture = require('./avatar-preview-fixture.cjs');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
class Media extends EventTarget {
  constructor(url) {
    super(); Object.assign(this, { src: url, duration: 20, currentTime: 0, paused: true,
      ended: false, readyState: 1, loads: 0, plays: 0 });
  }
  play() { this.plays++; this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
  pause() { this.paused = true; this.rejectPlay?.(Object.assign(new Error('buffering pause'), { name: 'AbortError' })); this.rejectPlay = null; }
  load() { this.loads++; this.readyState = 0; this.dispatchEvent(new Event('emptied')); this.dispatchEvent(new Event('loadstart')); }
  removeAttribute() {}
}
function harness(mode, readyState = 1) {
  const video = new Media('video'); video.readyState = readyState;
  const audios = [], errors = [], refs = [], states = [], effects = [], callbacks = [], timers = new Map();
  let r = 0, s = 0, e = 0, c = 0, timerId = 0, stops = 0;
  const document = new EventTarget(); document.hidden = false;
  const clock = {
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
  };
  const react = {
    useRef: value => { const i = r++; return refs[i] ||= { current: i === (mode === 'reading' ? 1 : 0) ? video : value }; },
    useState: value => { const i = s++; if (!(i in states)) states[i] = value; return [states[i], next => { states[i] = next; }]; },
    useCallback: (fn, deps) => {
      const i = c++, old = callbacks[i];
      if (!old || deps.some((v, j) => v !== old.deps[j])) callbacks[i] = { fn, deps };
      return callbacks[i].fn;
    },
    useEffect: (fn, deps) => {
      const i = e++, old = effects[i];
      if (!old || deps.some((v, j) => v !== old.deps[j])) effects[i] = { fn, deps, cleanup: old?.cleanup, changed: true };
    },
  };
  class Audio extends Media { constructor(url) { super(url); audios.push(this); } }
  const names = { reading: 'useAvatarPassage', listening: 'useAvatarListeningPlayback', roleplay: 'useAvatarSpeakingVideo' };
  const name = names[mode], module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, `../src/components/avatar-reading/${name}.ts`), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Audio, document,
    require: name => name === 'react' ? react : name === './avatarPreview' ? previewFixture(clock) : { toast: { error: message => errors.push(message) } } });
  const render = (speaking = false, url = 'video') => {
    r = s = e = c = 0;
    const hook = mode === 'reading' ? module.exports[name]('audio', url, () => {})
      : mode === 'listening' ? module.exports[name]('topic', 'narrator', url, 'initial', () => {})
        : module.exports[name](url, speaking, () => stops++);
    for (const effect of effects) if (effect.changed) {
      effect.cleanup?.(); effect.cleanup = effect.fn(); effect.changed = false;
    }
    return hook;
  };
  return { video, audios, errors, timers, document, render, stops: () => stops,
    tick: () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
    dispose: () => effects.forEach(effect => effect.cleanup?.()),
  };
}
async function loading(mode) {
  const h = harness(mode); let hook = h.render();
  assert.equal(h.render().videoState, 'loading');
  assert.equal(h.video.plays, 0, `${mode}: preview must not autoplay`);
  assert(h.video.currentTime > 0 && h.video.currentTime < .1, 'Metadata-only load requests a decoded frame');
  h.tick(); assert.equal(h.video.loads, 1, `${mode}: stalled idle preview reloads once`);
  h.tick(); assert.equal(h.render().videoState, 'error', `${mode}: spinner is bounded`);
  assert.equal(h.errors.length, 1);
  hook = h.render(); hook.retryVideo(); assert.equal(h.video.loads, 2);
  h.video.readyState = 2; h.video.dispatchEvent(new Event('seeked'));
  assert.equal(h.render().videoState, 'ready'); assert.equal(h.timers.size, 0);
  assert.equal(h.video.plays, 0, 'Retry must not autoplay or award passage credit');
  h.dispose(); assert.equal(h.timers.size, 0);
  h.video.dispatchEvent(new Event('error')); assert.equal(h.errors.length, 1, 'Removed listeners cannot affect a later topic');
}
async function firstTap(mode) {
  const h = harness(mode); const hook = h.render(), audio = h.audios[0];
  const toggle = () => mode === 'reading' ? hook.toggle() : hook.toggle('topic');
  const play = audio.play.bind(audio); let cold = true;
  audio.play = () => {
    if (!cold) return play();
    cold = false; audio.paused = false;
    const pending = new Promise((_, reject) => { audio.rejectPlay = reject; });
    // Browser buffering pauses the other owner while both first play calls are pending.
    queueMicrotask(() => h.video.dispatchEvent(new Event('waiting')));
    return pending;
  };
  await toggle(); await flush();
  assert.equal(audio.paused, true); assert.equal(h.errors.length, 0, 'Buffering is not a fatal playback failure');
  h.video.readyState = 4; h.video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(audio.paused, false, `${mode}: first gesture resumes audio without a second tap`);
  assert.equal(h.video.paused, false);
  assert.equal(h.render().loading, false); assert.equal(h.render().playing, true);
  h.video.dispatchEvent(new Event('waiting')); hook.pause();
  h.video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(audio.paused, true, 'Intentional pause cancels recovery'); assert.equal(h.video.paused, true);
  // An interrupted video play also recovers when audio is already running.
  const videoPlay = h.video.play.bind(h.video); let blocked = true;
  h.video.play = () => blocked ? Promise.reject(Object.assign(new Error('seek interrupted play'), { name: 'AbortError' })) : videoPlay();
  await toggle(); await flush(); assert.equal(h.errors.length, 0);
  blocked = false; h.video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(audio.paused, false); assert.equal(h.video.paused, false);
  h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
  h.video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(audio.paused, true); assert.equal(h.video.paused, true, 'Hidden pages cannot resume media');
  h.dispose(); assert.equal(h.timers.size, 0);
}
async function roleplay() {
  const h = harness('roleplay', 2); h.render();
  const play = h.video.play.bind(h.video); let blocked = true;
  h.video.play = () => blocked ? Promise.reject(Object.assign(new Error('loading'), { name: 'AbortError' })) : play();
  h.render(true); await flush(); assert.equal(h.errors.length, 0);
  blocked = false; h.video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(h.video.paused, false, 'Roleplay gestures resume after an interrupted load');
  h.render(false); h.video.dispatchEvent(new Event('canplay')); await flush(); assert.equal(h.video.paused, true);
  h.render(true); await flush(); h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
  h.video.dispatchEvent(new Event('canplay')); await flush(); assert.equal(h.video.paused, true);
  h.dispose(); assert.equal(h.timers.size, 0);
}
async function sourceChange(mode) {
  const h = harness(mode); h.render(); h.render(false, 'next-video');
  assert.equal(h.timers.size, 1, `${mode}: source changes dispose the old loading deadline`);
  h.dispose(); assert.equal(h.timers.size, 0);
}
(async () => {
  for (const mode of ['reading', 'listening', 'roleplay']) { await loading(mode); await sourceChange(mode); }
  for (const mode of ['reading', 'listening']) await firstTap(mode);
  await roleplay();
  console.log('PASS: all 3D modes bound metadata-only loading, retry without autoplay, and dispose old sources; Reading/Listening first-tap buffering recovery and pause/visibility cancellation; Roleplay interrupted-play recovery.');
})().catch(error => { console.error(error); process.exitCode = 1; });
