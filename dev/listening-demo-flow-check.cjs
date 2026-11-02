const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), assert = require('node:assert/strict');
const source = ts.createSourceFile('Listening.tsx', fs.readFileSync(path.join(__dirname, '../src/pages/student/topics/ListeningModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let completed, back, unlocked;
function visit(node) {
  if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'onCompleted') completed = node.initializer.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'backToTopics') back = node.initializer.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'nextStageUnlocked') unlocked = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
const bind = (text, values) => new Function(...Object.keys(values), ts.transpileModule(`const callback = ${text};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '; return callback;')(...Object.values(values));
(async () => {
  let closes = 0, refreshes = 0, modalChanges = 0;
  const context = { demo: { onClose: () => closes++ }, avatar: undefined, refreshLearningProgress: async () => refreshes++, lessonId: 'lesson', courseId: 'course', unitId: 'unit', setIsJustCompleted: () => modalChanges++, setShowCompletionModal: () => modalChanges++ };
  await bind(completed, context)();
  assert.equal(closes, 1); assert.equal(refreshes, 0); assert.equal(modalChanges, 0);
  await bind(completed, { ...context, demo: undefined })();
  assert.equal(refreshes, 1); assert.equal(modalChanges, 2);
  const navigation = [];
  bind(back, { demo: context.demo, avatar: undefined, navigate: value => navigation.push(value) })();
  assert.equal(closes, 2); assert.deepEqual(navigation, []);
  bind(back, { demo: undefined, avatar: undefined, navigate: value => navigation.push(value) })();
  assert.deepEqual(navigation, [-1]);
  for (const isQuestionStage of [false, true]) {
    assert.equal(bind(unlocked, { isTranscriptStage: false, hasListenedToAudio: false, isQuestionStage }), false);
    assert.equal(bind(unlocked, { isTranscriptStage: false, hasListenedToAudio: true, isQuestionStage }), true);
  }
  console.log('Listening demo flow passed: full-listen gate, demo completion/close without LMS updates, normal completion/navigation unchanged.');
})().catch(error => { console.error(error); process.exitCode = 1; });
