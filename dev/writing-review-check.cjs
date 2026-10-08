// Verify the real review UI and submit handlers without network or database access.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const moduleValue = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/components/learning/modes/SemanticReviewComponent.tsx'), 'utf8')), { require, module: moduleValue, exports: moduleValue.exports });
const Component = moduleValue.exports.default;
const component = { id: 'paragraph', title: 'Writing', content: { prompt: 'Write a paragraph', presentation: 'compiled_paragraph' }, attempt: { response: { paragraph: 'My paragraph.' } } };
const render = reviewFeedback => renderToStaticMarkup(React.createElement(Component, { component, reviewFeedback, onRetry() {} }));
const failed = render({ reviewStatus: 'needs_review', retryable: true, comment: 'Your writing is saved.', fieldResults: [] });
assert.match(failed, /Edit and Retry Review/);
assert.match(failed, /Review Needs Attention/);
assert.doesNotMatch(failed, /Review Complete|Task Achieved|Comprehensive Scan Complete/);
const saved = render({ reviewStatus: 'reviewed', retryable: true, completion: { status: 'needs_resubmission', message: 'Your writing changed.' }, fieldResults: [{ key: 'cohesion', label: 'Cohesion', score: 80, feedback: 'Clear connections.' }] });
assert.match(saved, /80%/);
assert.match(saved, /Your writing changed/);
assert.match(saved, /Edit and Retry Review/);

const source = ts.createSourceFile('ComponentModePlay.tsx', fs.readFileSync(path.join(root, 'src/pages/student/ComponentModePlay.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const wanted = new Set(['handleComponentChange', 'submitWritingParagraph', 'handleWritingParagraphSubmit', 'handleWritingRetry']);
const declarations = [];
const visit = node => {
  if (ts.isVariableDeclaration(node) && wanted.has(node.name.getText(source))) declarations.push('const ' + node.getText(source) + ';');
  ts.forEachChild(node, visit);
};
visit(source);
assert.equal(declarations.length, 4);
const events = [];
const savedParagraphs = [];
let releaseSave;
const saveGate = new Promise(resolve => { releaseSave = resolve; });
const noop = () => {};
let localResponses = {};
const dependencies = {
  draftSaves: { current: new Map() }, draftRevisions: { current: new Map() }, writingSubmitInFlight: { current: null }, writingRequestKey: { current: null },
  modeId: 'writing-mode', crypto: require('node:crypto').webcrypto,
  components: [component], setModelAnswerComponentId: noop,
  setLocalResponses: update => { localResponses = update(localResponses); }, setComponents: noop, setWritingReviewFeedback: noop, setIsSubmittingMode: noop,
  saveComponentAttempt: async (_, payload) => { savedParagraphs.push(payload.response.paragraph); events.push('save:start'); await saveGate; events.push('save:end'); return component; },
  compileWritingParagraph: async () => { events.push('compile'); return { paragraphComponent: component }; },
  submitWriting: async () => { events.push('review'); return { id: 'review', status: 'reviewed', review: { rubricMetrics: [] } }; },
  refreshModeState: async () => {}, toast: { error: noop, success: noop, info: noop },
};
const handlers = new Function(...Object.keys(dependencies), compile(declarations.join('\n')) + '; return {handleComponentChange, handleWritingParagraphSubmit, handleWritingRetry};')(...Object.values(dependencies));
(async () => {
  const draft = handlers.handleComponentChange(component.id, { paragraph: 'My paragraph.' });
  await new Promise(resolve => setImmediate(resolve));
  const middleDraft = handlers.handleComponentChange(component.id, { paragraph: 'Intermediate draft' });
  const finalDraft = handlers.handleComponentChange(component.id, { paragraph: 'Final draft' });
  const first = handlers.handleWritingParagraphSubmit(component, 'Final draft');
  const duplicate = handlers.handleWritingParagraphSubmit(component, 'Final draft');
  assert.equal(first, duplicate);
  await handlers.handleComponentChange(component.id, { paragraph: 'Late draft' });
  assert.deepEqual(events, ['save:start']);
  releaseSave();
  await Promise.all([draft, middleDraft, finalDraft, first, duplicate]);
  assert.deepEqual(events, ['save:start', 'save:end', 'save:start', 'save:end', 'compile', 'review']);
  assert.deepEqual(savedParagraphs, ['My paragraph.', 'Final draft']);
  assert.equal(dependencies.writingSubmitInFlight.current, null);
  component.attempt.response = { paragraph: 'A newer saved paragraph.' };
  handlers.handleWritingRetry(component.id);
  assert.equal(localResponses[component.id].paragraph, 'A newer saved paragraph.');
  assert.equal(dependencies.writingRequestKey.current, null);
  console.log('PASS: failed review retry UI, preserved scores, ordered draft saves, blocked late saves, and duplicate submit guard');
})().catch(error => { console.error(error); process.exitCode = 1; });
