// Exercise the actual shared player and Roleplay speech fallback with controlled browser events.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const state = [], sounds = [], timers = new Map();
let timerId = 0;
const setTimer = fn => { timers.set(++timerId, fn); return timerId; };
const clearTimer = id => timers.delete(id);
class Howl {
  constructor(options) { this.options = options; this.active = false; this.loadState = 'loading'; sounds.push(this); }
  play() { return 1; }
  playing() { return this.active; }
  state() { return this.loadState; }
  seek() { return 0; }
  duration() { return 3; }
  off() {}
  unload() { this.unloaded = true; }
  stop() { this.active = false; }
  pause() { this.active = false; this.options.onpause(); }
  start() { this.active = true; this.loadState = 'loaded'; this.options.onplay(1); }
}
const exportsObject = {};
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/hooks/useAudioPlayback.ts'), 'utf8')), {
  exports: exportsObject,
  require: name => name === 'react' ? {
    useState(value) { const index = state.length; state.push(value); return [value, next => { state[index] = next; }]; },
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect() {},
  } : { Howl },
  setTimeout: setTimer, clearTimeout: clearTimer, setInterval: setTimer, clearInterval: clearTimer,
});
const player = exportsObject.useAudioPlayback();
player.toggleAudio('opening', 'https://media/prompt.mp3');
assert.equal(state[1], false, 'Loading is not playback');
assert.equal(state[2], 'opening');
sounds[0].options.onloaderror();
assert.equal(state[2], null);
assert.equal(state[3], 'opening');
assert.equal(sounds[0].unloaded, true);
player.toggleAudio('opening', 'https://media/prompt.mp3');
assert.equal(sounds.length, 2, 'Retry creates a fresh player after failure');
assert.equal(state[1], false, 'Retry cannot display pause until audio actually starts');
sounds[1].start();
assert.equal(state[1], true);
assert.equal(state[2], null);
player.toggleAudio('opening', 'https://media/prompt.mp3');
assert.equal(state[1], false, 'Pause works');
player.toggleAudio('opening', 'https://media/prompt.mp3');
assert.equal(state[1], false, 'Resume waits for playback confirmation');
sounds[1].start();
player.toggleAudio('opening', 'https://media/prompt.mp3?sig=renewed');
assert.equal(sounds.length, 3, 'A renewed URL replaces the old media source');
sounds[1].options.onplayerror();
assert.equal(state[2], 'opening', 'An obsolete player cannot clear a new load');
sounds[2].options.onplayerror();
assert.equal(state[1], false);
assert.equal(state[3], 'opening');
player.toggleAudio('opening', 'https://media/prompt.mp3?sig=renewed');
const timeout = [...timers.values()][0];
assert.ok(timeout);
timeout();
assert.equal(state[2], null, 'Stalled startup must not spin forever');
assert.equal(state[3], 'opening');
player.stopAudio();
assert.equal(state[3], null);

const page = ts.createSourceFile('RolePlayModeTopics.tsx', fs.readFileSync(path.join(root, 'src/pages/student/topics/RolePlayModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let declaration;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(page) === 'toggleMessageSpeech') declaration = node.getText(page);
  ts.forEachChild(node, visit);
}
visit(page);
assert.ok(declaration);
const spoken = [], errors = [], speechTimers = new Map();
const context = {
  fallbackSpeechMessageId: null, pendingSpeechMessageId: null,
  fallbackSpeechRef: { current: null }, fallbackSpeechTimerRef: { current: null },
  setFallbackSpeechMessageId: value => { context.fallbackSpeechMessageId = value; },
  setPendingSpeechMessageId: value => { context.pendingSpeechMessageId = value; },
  stopAudio() {}, toast: { error: value => errors.push(value) },
  SpeechSynthesisUtterance: function(text) { this.text = text; },
  window: { speechSynthesis: { cancel() {}, resume() {}, speak: utterance => spoken.push(utterance) } },
  setTimeout: fn => { speechTimers.set(++timerId, fn); return timerId; }, clearTimeout: id => speechTimers.delete(id),
};
vm.createContext(context);
vm.runInContext(compile(`const ${declaration};`), context);
const speak = id => vm.runInContext(`toggleMessageSpeech('${id}', 'What did you think of the volleyball match today?');`, context);
speak('opening');
assert.equal(context.pendingSpeechMessageId, 'opening');
assert.equal(context.fallbackSpeechMessageId, null, 'Queued browser speech cannot show pause');
spoken[0].onstart();
assert.equal(context.fallbackSpeechMessageId, 'opening');
assert.equal(context.pendingSpeechMessageId, null);
spoken[0].onend();
assert.equal(context.fallbackSpeechMessageId, null);
speak('opening');
spoken[1].onerror();
assert.equal(context.pendingSpeechMessageId, null);
assert.equal(errors.length, 1);
speak('opening');
const stalledSpeech = [...speechTimers.values()][0];
stalledSpeech();
assert.equal(context.pendingSpeechMessageId, null, 'Queued speech timeout restores the play control');
assert.equal(errors.length, 2);
speak('opening');
speak('next');
spoken[3].onend();
assert.equal(context.pendingSpeechMessageId, 'next', 'Cancelled speech cannot clear a newer utterance');
spoken[4].onstart();
assert.equal(context.fallbackSpeechMessageId, 'next');
speak('next');
assert.equal(context.fallbackSpeechMessageId, null, 'Clicking active speech stops it');
assert.equal(context.pendingSpeechMessageId, null);
console.log('Roleplay audio passed: load/play failures, fresh retry, event-driven pause/resume, renewed URLs, stalled startup, browser speech start/end/error/timeout, and stale callback protection.');
