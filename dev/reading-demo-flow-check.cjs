// Run the actual completion/quiz callbacks with demo and normal LMS dependencies.
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), assert = require('node:assert/strict');
const source = ts.createSourceFile('Reading.tsx', fs.readFileSync(path.join(__dirname, '../src/pages/student/topics/ReadingModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let quiz, completed;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0]?.getText(source).includes('demoSubmitted.current')) quiz = node.arguments[0].getText(source);
  if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'onCompleted') completed = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(quiz && completed);
const bind = (text, values) => new Function(...Object.keys(values), ts.transpileModule(`const callback = ${text};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '; return callback;')(...Object.values(values));
(async () => {
  const answers = [], submitted = { current: false };
  const dependencies = { demo: {}, demoSubmitted: submitted, mcqList: [{ id: 'question' }], mcqAnswerFeedback: { question: { isCorrect: false } }, selectedAnswers: { 0: 1 }, submitMcqs: value => answers.push(value) };
  const callback = bind(quiz, dependencies);
  callback(); assert.equal(answers.length, 0);
  dependencies.mcqAnswerFeedback.question.isCorrect = true;
  callback(); callback(); assert.deepEqual(answers, [[1]], 'One correct quiz answer must auto-submit exactly once');
  let closes = 0, demoCompletions = 0, refreshes = 0, completions = 0;
  const context = { demo: { onClose: () => closes++, onComplete: () => demoCompletions++ }, avatar: undefined, refreshLearningProgress: async () => refreshes++, lessonId: 'lesson', courseId: 'course', unitId: 'unit', setIsJustCompleted: () => completions++, setShowCompletionModal: () => completions++ };
  await bind(completed, context)();
  assert.equal(closes, 0); assert.equal(demoCompletions, 1); assert.equal(refreshes, 0); assert.equal(completions, 0);
  await bind(completed, { ...context, demo: undefined })();
  assert.equal(refreshes, 1); assert.equal(completions, 2);
  submitted.current = false;
  bind(quiz, { ...dependencies, demo: undefined })();
  assert.equal(answers.length, 1, 'Normal LMS quiz behavior must remain manual');
  console.log('Reading demo flow passed: correct-answer auto-submit, celebration without LMS updates, normal lesson completion unchanged.');
})().catch(error => { console.error(error); process.exitCode = 1; });
