// Run the actual final on-view click branch against the pre-render completion closure.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript');
const source = ts.createSourceFile('ComponentModePlay.tsx', fs.readFileSync(path.join(__dirname, '../src/pages/student/ComponentModePlay.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = [];
let onView;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['handleCompleteMode', 'isComponentComplete'].includes(node.name.getText(source))) declarations.push(`const ${node.getText(source)};`);
  if (ts.isIfStatement(node) && node.expression.getText(source) === "currentComp.completionRule === 'on_view'") onView = node.thenStatement.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.equal(declarations.length, 2);
assert.ok(onView);
const compile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
async function run({ otherIncomplete = false, acknowledgementFails = false, resultIncomplete = false } = {}) {
  const review = { id: 'review', isRequired: true, isComplete: false, completionRule: 'on_view', attempt: null };
  const objective = { id: 'objective', isRequired: true, isComplete: !otherIncomplete, attempt: null };
  let rendered = [objective, review];
  const errors = [], events = [];
  const context = {
    modeId: 'mode', lessonId: 'lesson', unitId: 'unit', courseId: 'course',
    currentMode: { status: 'in_progress' }, visibleComponents: [objective, review],
    currentComp: review, currentIndex: 1, totalCount: 2,
    startLearningComponent: async () => {
      if (acknowledgementFails) throw new Error('Request failed');
      return { ...review, isComplete: !resultIncomplete, attempt: resultIncomplete ? null : { completedAt: 'now' } };
    },
    setComponents: update => { rendered = update(rendered); }, setCompletedComponentIds() {},
    setIsSubmittingMode() {}, setCurrentIndex() {}, setResolvedMode() {},
    setIsJustCompleted: value => events.push(['justCompleted', value]),
    setShowCompletionModal: value => events.push(['popup', value]),
    completeLessonMode: value => ({ kind: 'complete', ...value }), getLessonModes: () => ({ kind: 'refresh' }),
    dispatch: action => ({ unwrap: async () => { events.push(action.kind); return [{ id: 'mode', status: 'completed' }]; } }),
    refreshLearningProgress: async () => events.push('progress'),
    toast: { error: message => errors.push(message), success() {} }, console: { error() {} },
  };
  vm.createContext(context);
  vm.runInContext(compile(declarations.join('\n')), context);
  await vm.runInContext(compile(`(async () => ${onView})()`), context);
  return { rendered, errors, events };
}
(async () => {
  const success = await run();
  assert.equal(success.rendered.every(component => component.isComplete), true);
  assert.deepEqual(success.errors, [], 'The last acknowledgement must not produce a stale incomplete-activities error');
  assert.ok(success.events.includes('complete'));
  assert.ok(success.events.includes('refresh'));
  assert.ok(success.events.some(event => Array.isArray(event) && event[0] === 'popup' && event[1]));
  for (const options of [{ otherIncomplete: true }, { resultIncomplete: true }]) {
    const result = await run(options);
    assert.deepEqual(result.errors, ['Complete the required activities before moving on.']);
    assert.ok(!result.events.includes('complete'), 'A genuine incomplete activity must still block completion');
  }
  const failed = await run({ acknowledgementFails: true });
  assert.deepEqual(failed.errors, ['Unable to record this activity step.']);
  assert.equal(failed.rendered[1].isComplete, false);
  assert.ok(!failed.events.includes('complete'));
  console.log('Component completion passed: final Review acknowledgement completes on the first click; genuine incompletion and failed requests remain blocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
