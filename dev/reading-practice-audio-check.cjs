// Check the actual playback selectors and browser speech function without providers.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const helpers = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/utils/readingPracticeAudio.ts'), 'utf8')), { exports: helpers.exports, module: helpers });
const { readingPracticeSpeechText, readingPracticeAudioUrl } = helpers.exports;
const target = 'She said, "Stay safe."\nThen she smiled.';
for (const prefix of ['Please read the following sentence aloud', 'Please try reading this sentence again', 'Good job! Now read the next sentence', 'You have completed three attempts on this sentence. Now read the next sentence', "We could not verify that reading after three attempts. Let's continue with the next sentence"]) {
  const legacy = { content: `${prefix}:\n\n"${target}"`, audioUrl: 'old-instruction-audio' };
  assert.equal(readingPracticeSpeechText(legacy), target);
  assert.equal(readingPracticeAudioUrl(legacy), null);
  assert.equal(readingPracticeAudioUrl({ ...legacy, readingSpeechText: target, audioUrl: 'target-only-audio' }), 'target-only-audio');
}
assert.equal(readingPracticeSpeechText({ content: 'Now answer the quiz questions.', readingSpeechText: null }), null);
assert.equal(readingPracticeAudioUrl({ content: 'Now answer the quiz questions.', readingSpeechText: null, audioUrl: 'old' }), null);
const page = ts.createSourceFile('ReadingModeTopics.tsx', fs.readFileSync(path.join(root, 'src/pages/student/topics/ReadingModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let declaration, practiceDeclaration;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(page) === 'toggleInitialReadingPromptSpeech') declaration = node.getText(page);
  if (ts.isVariableDeclaration(node) && node.name.getText(page) === 'togglePracticeAudio') practiceDeclaration = node.getText(page);
  ts.forEachChild(node, visit);
}
visit(page);
assert.ok(declaration);
const spoken = [];
vm.runInNewContext(compile(`const ${declaration}; toggleInitialReadingPromptSpeech('prompt', target);`), {
  target, fallbackSpeechMessageId: null, fallbackSpeechRef: { current: null },
  window: { speechSynthesis: { cancel() {}, speak: utterance => spoken.push(utterance.text) } },
  SpeechSynthesisUtterance: function(text) { this.text = text; },
  stopAudio() {}, setIsFallbackSpeechPaused() {}, setFallbackSpeechMessageId() {}, toast: { error: message => { throw Error(message); } },
});
assert.deepEqual(spoken, [target], 'Browser fallback must preserve the entire target including dialogue quotes');
assert.ok(practiceDeclaration);
const played = [], errors = [];
vm.runInNewContext(compile(`const ${practiceDeclaration}; togglePracticeAudio('sentence', 'tony-hopeful-audio'); togglePracticeAudio('old', null); togglePracticeAudio('initial');`), {
  toggleStoredAudio: (...args) => played.push(args),
  toast: { error: message => errors.push(message) },
  toggleInitialReadingPromptSpeech: () => { throw Error('Practice must never use a browser voice'); },
});
assert.deepEqual(played, [['sentence', 'tony-hopeful-audio']]);
assert.equal(errors.length, 2);
assert.ok(errors.every(message => message.includes('Tony Hopeful')));
console.log('Reading practice audio passed: sentence-only selectors, Tony playback, unavailable-audio retry, and learner transcript speech.');
