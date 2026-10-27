// Exercise the actual shared submission handler without API/database access.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
} }).outputText;
const source = ts.createSourceFile('ComponentModePlay.tsx', fs.readFileSync(path.join(root, 'src/pages/student/ComponentModePlay.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleComponentSubmit') handler = node.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert(handler);
const fields = ['first', 'second', 'third', 'fourth'].map(id => ({ id, sentence: `Fill ${id}` }));
const activity = { id: 'grammar', componentType: 'fill_in_the_blank', content: { fields }, attempt: null };
async function run(response) {
  const errors = [], submissions = [], focused = [], validation = [];
  const context = {
    components: [activity], setFillInValidationComponentId: id => validation.push(id),
    toast: { error: message => errors.push(message), success() {} },
    document: { querySelectorAll: () => fields.map(field => ({ dataset: { componentId: 'grammar', fillInField: field.id }, focus: () => focused.push(field.id) })) },
    draftSaves: { current: new Map() },
    submitComponentAttempt: async (id, payload) => { submissions.push(payload); return { ...activity, isComplete: false, attempt: { isCorrect: false, status: 'submitted' } }; },
    setComponents() {}, setLocalResponses() {}, setCompletedComponentIds() {}, console,
  };
  vm.createContext(context);
  vm.runInContext(compile(`const ${handler}; globalThis.submit = handleComponentSubmit;`), context);
  await context.submit('grammar', response);
  return { errors, submissions, focused, validation };
}
(async () => {
  for (const fourth of [undefined, '', '   ', 4]) {
    const answers = { first: 'a', second: 'b', third: 'c' };
    if (fourth !== undefined) answers.fourth = fourth;
    const result = await run({ answers });
    assert.equal(result.submissions.length, 0);
    assert.deepEqual(result.errors, ['Please fill in all blanks before submitting.']);
    assert.deepEqual(result.focused, ['fourth']);
    assert.deepEqual(result.validation, ['grammar']);
  }
  assert.deepEqual((await run({})).focused, ['first']);
  const complete = await run({ answers: { first: 'wrong', second: 'wrong', third: 'wrong', fourth: 'wrong' } });
  assert.equal(complete.submissions.length, 1, 'Complete answers must reach grading even when incorrect');

  const loaded = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/components/learning/modes/AdditionalComponents.tsx'), 'utf8')), { require, module: loaded, exports: loaded.exports });
  const markup = renderToStaticMarkup(React.createElement(loaded.exports.FillInTheBlankComponent, {
    component: { ...activity, attempt: { response: { answers: { first: 'a', second: 'b', third: 'c', fourth: ' ' } } } },
    showValidation: true,
  }));
  assert.equal((markup.match(/aria-invalid="true"/g) || []).length, 1, 'Only unanswered fields should be marked invalid');
  assert.match(markup, /data-fill-in-field="fourth" aria-invalid="true"/);
  console.log('PASS: incomplete/blank/whitespace answers blocked, first missing field focused and highlighted, complete answers reach grading.');
})().catch(error => { console.error(error); process.exitCode = 1; });
