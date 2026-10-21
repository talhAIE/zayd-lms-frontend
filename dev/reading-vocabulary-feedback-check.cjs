// Exercise the real attention helper and Reading page auto-open effect.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const storage = new Map();
const helpers = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/utils/readingVocabularyFeedback.ts'), 'utf8')), {
  exports: helpers.exports, module: helpers,
  sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
});
const { readingFeedbackAction, readingFeedbackNeedsAttention, loadViewedReadingFeedback, saveViewedReadingFeedback } = helpers.exports;
const page = ts.createSourceFile('ReadingModeTopics.tsx', fs.readFileSync(path.join(root, 'src/pages/student/topics/ReadingModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(page) === 'useEffect' && node.arguments[0]?.getText(page).includes('readingFeedbackAction(')) effect = node.arguments[0].getText(page);
  ts.forEachChild(node, visit);
}
visit(page);
assert.ok(effect, 'Reading must consume structured vocabulary feedback');
for (let count = 1; count <= 2; count++) {
  const attention = { words: ['forestall'], attemptCount: count, action: count === 2 ? 'open' : 'glow' };
  assert.equal(readingFeedbackAction(attention, false), attention.action);
  assert.equal(readingFeedbackAction(attention, true), undefined);
  const calls = [];
  const target = { sentenceIndex: 4, text: 'We forestall delays.', words: ['forestall'], status: 'retry' };
  const message = { id: `attempt-${count}`, role: 'assistant', feedback: 'Correct forestall.', readingVocabularyFeedback: attention, readingFeedbackTarget: target };
  const run = (chatHistory, viewedFeedbackIds = new Set()) => vm.runInNewContext(compile(`(${effect})();`), {
    chatHistory, viewedFeedbackIds, readingFeedbackAction,
    openReadingFeedback: (...args) => calls.push(args),
  });
  run([message]);
  assert.equal(calls.length, count === 2 ? 1 : 0);
  if (count === 2) assert.deepEqual(calls[0], [message.id, message.feedback, target], 'Popup must carry this attempt’s text rather than an earlier or next sentence');
  calls.length = 0;
  run([message], new Set([message.id]));
  assert.equal(calls.length, 0, 'Viewed feedback must not reopen');
  run([message, { id: 'other', role: 'assistant', feedback: 'Correct the number.' }]);
  assert.equal(calls.length, 0, 'Historical vocabulary feedback must not open on a newer ordinary response');
}
assert.equal(readingFeedbackAction(undefined, false), undefined);
for (const status of ['retry', 'incorrect']) {
  assert.equal(readingFeedbackNeedsAttention(undefined, { status }, false), true, `${status} feedback needs attention without vocabulary metadata`);
  assert.equal(readingFeedbackNeedsAttention(undefined, { status }, true), false, 'Opening feedback stops its pulse');
}
assert.equal(readingFeedbackNeedsAttention(undefined, { status: 'correct' }, false), false);
assert.equal(readingFeedbackNeedsAttention(undefined, undefined, false), false);
assert.equal(readingFeedbackNeedsAttention({ words: ['forestall'], attemptCount: 1, action: 'glow' }, undefined, false), true);
assert.equal(readingFeedbackNeedsAttention({ words: ['forestall'], attemptCount: 1, action: 'glow' }, undefined, true), false);
const pageText = page.getFullText();
assert.match(pageText, /const feedbackNeedsAttention = readingFeedbackNeedsAttention\(msg\.readingVocabularyFeedback, msg\.readingFeedbackTarget, viewedFeedbackIds\.has\(msg\.id\)\)/);
assert.match(pageText, /feedbackNeedsAttention \? 'reading-vocabulary-feedback-glow' : ''/, 'The shared desktop/mobile button must consume the attention state');
const css = require('postcss').parse(fs.readFileSync(path.join(root, 'src/index.css'), 'utf8'));
const animation = css.nodes.find(node => node.type === 'atrule' && node.name === 'keyframes' && node.params === 'reading-vocabulary-feedback-glow');
assert.ok(animation);
const backgrounds = animation.nodes.map(frame => frame.nodes.find(declaration => declaration.prop === 'background-color')?.value);
assert.equal(new Set(backgrounds).size, 2, 'The button background must visibly pulse, not only its shadow');
const attentionRule = css.nodes.find(node => node.type === 'rule' && node.selector === '.reading-vocabulary-feedback-glow');
assert.ok(attentionRule?.nodes.some(declaration => declaration.prop === 'animation' && declaration.value.includes('infinite')), 'Animation must be available at every viewport width');
const reducedMotion = css.nodes.find(node => node.type === 'atrule' && node.params === '(prefers-reduced-motion: reduce)');
assert.ok(reducedMotion?.nodes.some(rule => rule.nodes?.some(declaration => declaration.prop === 'animation' && declaration.value === 'none')), 'Reduced motion must retain a static highlight');
saveViewedReadingFeedback('lesson', new Set(['attempt-3']));
assert.ok(loadViewedReadingFeedback('lesson').has('attempt-3'), 'Reload must remember opened feedback');
assert.equal(loadViewedReadingFeedback('another-lesson').size, 0);
console.log('Reading feedback: sentence corrections pulse, opening stops attention, visible all-width styling, reduced motion, vocabulary popup, attempt target and reload acknowledgment passed.');
