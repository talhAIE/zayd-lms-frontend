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
const { readingFeedbackAction, loadViewedReadingFeedback, saveViewedReadingFeedback } = helpers.exports;
const page = ts.createSourceFile('ReadingModeTopics.tsx', fs.readFileSync(path.join(root, 'src/pages/student/topics/ReadingModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let effect;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(page) === 'useEffect' && node.arguments[0]?.getText(page).includes('readingFeedbackAction(')) effect = node.arguments[0].getText(page);
  ts.forEachChild(node, visit);
}
visit(page);
assert.ok(effect, 'Reading must consume structured vocabulary feedback');
for (let count = 1; count <= 6; count++) {
  const attention = { words: ['forestall'], attemptCount: count, action: count % 3 === 0 ? 'open' : 'glow' };
  assert.equal(readingFeedbackAction(attention, false), attention.action);
  assert.equal(readingFeedbackAction(attention, true), undefined);
  const calls = [];
  const message = { id: `attempt-${count}`, role: 'assistant', feedback: 'Correct forestall.', readingVocabularyFeedback: attention };
  const run = (chatHistory, viewedFeedbackIds = new Set()) => vm.runInNewContext(compile(`(${effect})();`), {
    chatHistory, viewedFeedbackIds, readingFeedbackAction,
    openReadingFeedback: (...args) => calls.push(args),
  });
  run([message]);
  assert.equal(calls.length, count % 3 === 0 ? 1 : 0);
  calls.length = 0;
  run([message], new Set([message.id]));
  assert.equal(calls.length, 0, 'Viewed feedback must not reopen');
  run([message, { id: 'other', role: 'assistant', feedback: 'Correct the number.' }]);
  assert.equal(calls.length, 0, 'Historical vocabulary feedback must not open on a newer ordinary response');
}
assert.equal(readingFeedbackAction(undefined, false), undefined);
saveViewedReadingFeedback('lesson', new Set(['attempt-3']));
assert.ok(loadViewedReadingFeedback('lesson').has('attempt-3'), 'Reload must remember opened feedback');
assert.equal(loadViewedReadingFeedback('another-lesson').size, 0);
console.log('Reading vocabulary feedback: six-attempt cycle, vocabulary-only behavior and reload acknowledgment passed.');
