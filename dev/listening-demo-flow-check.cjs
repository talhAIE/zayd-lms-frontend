const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), assert = require('node:assert/strict');
const source = ts.createSourceFile('Listening.tsx', fs.readFileSync(path.join(__dirname, '../src/pages/student/topics/ListeningModeTopics.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let completed, back, unlocked, quiz, correctness;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'isOptionCorrect') correctness = node.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleQuizAction') quiz = node.initializer.getText(source);
  if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'onCompleted') completed = node.initializer.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'backToTopics') back = node.initializer.getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'nextStageUnlocked') unlocked = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
const bind = (text, values) => new Function(...Object.keys(values), ts.transpileModule(`const callback = ${text};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '; return callback;')(...Object.values(values));
(async () => {
  let closes = 0, demoCompletions = 0, refreshes = 0, modalChanges = 0;
  const context = { demo: { onClose: () => closes++, onComplete: () => demoCompletions++ }, avatar: undefined, refreshLearningProgress: async () => refreshes++, lessonId: 'lesson', courseId: 'course', unitId: 'unit', setIsJustCompleted: () => modalChanges++, setShowCompletionModal: () => modalChanges++ };
  await bind(completed, context)();
  assert.equal(closes, 0); assert.equal(demoCompletions, 1); assert.equal(refreshes, 0); assert.equal(modalChanges, 0);
  await bind(completed, { ...context, demo: undefined })();
  assert.equal(refreshes, 1); assert.equal(modalChanges, 2);
  const navigation = [];
  bind(back, { demo: context.demo, avatar: undefined, navigate: value => navigation.push(value) })();
  assert.equal(closes, 1); assert.equal(demoCompletions, 1); assert.deepEqual(navigation, []);
  bind(back, { demo: undefined, avatar: undefined, navigate: value => navigation.push(value) })();
  assert.deepEqual(navigation, [-1]);
  for (const isQuestionStage of [false, true]) {
    assert.equal(bind(unlocked, { isTranscriptStage: false, hasListenedToAudio: false, isQuestionStage }), false);
    assert.equal(bind(unlocked, { isTranscriptStage: false, hasListenedToAudio: true, isQuestionStage }), true);
  }
  const isOptionCorrect = new Function(ts.transpileModule(correctness, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + '; return isOptionCorrect;')();
  const mcq = { id: 'question', correct: 1, options: ['Wrong', 'Correct'] };
  function runQuiz({ guest = false, correct = false, last = true, answer = 1, blocked = false, checking = false } = {}) {
    const calls = [];
    bind(quiz, { demo: guest ? {} : undefined, isOptionCorrect, isAccountBlocked: blocked, isCheckingMcqAnswer: checking,
      mcqAnswerFeedback: correct ? { question: { isCorrect: true } } : {}, mcqList: [mcq], selectedAnswers: { 0: answer },
      toast: { error: () => calls.push('wrong') }, checkMcqAnswer: () => calls.push('check'),
      submitMcqs: answers => calls.push(['submit', answers]), setCurrentMcqIndex: fn => calls.push(['next', fn(0)]) })(mcq, answer, last);
    return calls;
  }
  assert.deepEqual(runQuiz({ guest: true, answer: 0 }), ['wrong']);
  assert.deepEqual(runQuiz({ guest: true }), [['submit', [1]]], 'Guest quiz must not call the unsupported answer-check endpoint');
  assert.deepEqual(runQuiz({ guest: true, last: false }), [['next', 1]]);
  assert.deepEqual(runQuiz(), ['check'], 'Normal LMS quiz must check with the server first');
  assert.deepEqual(runQuiz({ correct: true }), [['submit', [1]]]);
  assert.deepEqual(runQuiz({ correct: true, last: false }), [['next', 1]]);
  assert.deepEqual(runQuiz({ guest: true, blocked: true }), []);
  assert.deepEqual(runQuiz({ correct: true, checking: true }), []);
  console.log('Listening demo flow passed: full-listen gate, distinct celebration and close, normal completion/navigation unchanged.');
})().catch(error => { console.error(error); process.exitCode = 1; });
