const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), assert = require('node:assert/strict');
const source = ts.createSourceFile('Roleplay.tsx', fs.readFileSync(path.join(__dirname, '../src/pages/student/topics/RolePlayModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let completed, finish, progress;
function visit(node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'onCompleted') completed = node.initializer.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'finishMode') finish = node.initializer.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'getProgressPercentage') progress = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
const bind = (text, values) => new Function(...Object.keys(values), ts.transpileModule(`const callback = ${text};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '; return callback;')(...Object.values(values));
(async () => {
  let closes = 0, refreshes = 0, completions = 0;
  const values = { demo: { onClose: () => closes++ }, avatar: undefined, lessonId: 'lesson', courseId: 'course', unitId: 'unit', refreshLearningProgress: async () => refreshes++, setShowCompletionModal: () => completions++, setIsJustCompleted: () => completions++ };
  await bind(completed, values)(); assert.equal(closes, 1); assert.equal(refreshes, 0); assert.equal(completions, 0);
  await bind(completed, { ...values, demo: undefined })(); assert.equal(refreshes, 1); assert.equal(completions, 2);
  await bind(finish, { ...values, navigate: () => { throw new Error('Demo must not navigate to LMS'); } })(); assert.equal(closes, 2);
  assert.equal(bind(progress, { isCompleted: false, roleplayProgress: { requiredTurns: 3, completedTurns: 1 } })(), 33);
  assert.equal(bind(progress, { isCompleted: false, roleplayProgress: { requiredTurns: 3, completedTurns: 2 } })(), 67);
  assert.equal(bind(progress, { isCompleted: true, roleplayProgress: { requiredTurns: 3, completedTurns: 3 } })(), 100);
  console.log('Roleplay demo flow passed: three-turn progress, close without LMS updates, normal completion retained.');
})().catch(error => { console.error(error); process.exitCode = 1; });
