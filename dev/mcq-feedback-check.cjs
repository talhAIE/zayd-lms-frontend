// Exercise the real MCQ hooks/markup across submissions and revisits without
// server credentials, plus the page's actual feedback panel renderer.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
const root = path.resolve(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const icon = name => name;
const icons = { Check: icon('Check'), X: icon('X'), CheckCircle2: icon('CheckCircle2'), CircleAlert: icon('CircleAlert'), Eye: icon('Eye') };
const motion = { button: 'button', div: 'div' };
function harness(reduced = false) {
  const slots = []; let cursor, effects, dirty;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (next !== slots[index]) { slots[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect(effect, deps) {
      const index = cursor++; const old = slots[index];
      if (!old || deps.some((value, i) => !Object.is(value, old[i]))) effects.push(effect);
      slots[index] = deps;
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'src/components/learning/modes/MCQComponent.tsx'), 'utf8')), {
    module, exports: module.exports, require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return jsx;
      if (name === 'lucide-react') return icons;
      if (name === 'framer-motion') return { motion, useReducedMotion: () => reduced };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return props => {
    let tree, passes = 0;
    do {
      cursor = 0; effects = []; dirty = false;
      tree = module.exports.default(props);
      effects.forEach(effect => effect());
      assert(++passes < 10, 'MCQ state must settle');
    } while (dirty);
    return tree;
  };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
const option = (tree, prefix) => nodes(tree).find(node => node.type === 'button' && node.props['aria-label']?.startsWith(`${prefix}.`));
const base = { id: 'question', title: 'Question', content: { prompt: 'Choose the correct answer.' }, options: [{ id: 'a', label: 'A. Correct option' }, { id: 'b', label: 'B. Wrong option' }, { id: 'c', label: 'C. Other wrong option' }], maxAttempts: 2, attempt: null, isComplete: false };
const submitted = (choice, number, correct, exhausted = false) => ({ ...base, isComplete: correct || exhausted, attempt: {
  id: 'attempt', attemptNumber: number, status: exhausted ? 'exhausted' : correct ? 'completed' : 'submitted',
  response: { optionId: choice }, isCorrect: correct, submittedAt: `submission-${number}`, completedAt: correct || exhausted ? 'completed' : null,
  feedback: { submitted: true, canRevealAnswer: exhausted },
} });
const render = harness(); let component = base;
const props = () => ({ component, isSubmitted: component.isComplete, disabled: component.isComplete });
let tree = render(props()); option(tree, 'B').props.onClick(); tree = render(props());
component = submitted('b', 1, false); tree = render(props());
assert.match(option(tree, 'B').props.className, /border-\[#EF4444\]/, 'First wrong choice is red immediately');
assert.match(option(tree, 'B').props['aria-label'], /Incorrect answer/);
assert(option(tree, 'B').props.animate.x.length > 1, 'Fresh incorrect submission has a gentle shake');
option(tree, 'B').props.onAnimationComplete(); tree = render(props());
assert.equal(option(tree, 'B').props.animate.x, 0, 'Shake stops after one result');
option(tree, 'C').props.onClick(); tree = render(props());
assert(!option(tree, 'C').props['aria-label'].includes('Incorrect'), 'New retry choice is not graded by the old answer');
component = submitted('c', 2, false, true); tree = render(props());
assert.match(option(tree, 'C').props.className, /border-\[#EF4444\]/, 'Exhausted choice remains red immediately');
tree = render({ ...props(), approvedAnswers: [{ id: 'option', value: 'A. Correct option' }] });
assert.match(option(tree, 'A').props.className, /border-\[#10B981\]/, 'Only the server-revealed correct option turns green');
assert.match(option(tree, 'C').props.className, /border-\[#EF4444\]/, 'Reveal preserves the wrong choice in red');
assert.equal(option(tree, 'C').props.disabled, true, 'Exhaustion does not grant another attempt');
tree = harness()({ ...props(), approvedAnswers: [{ id: 'option', value: 'A. Correct option' }] });
assert.match(option(tree, 'C').props.className, /border-\[#EF4444\]/, 'Revisiting keeps the same incorrect result');
assert.equal(option(tree, 'C').props.animate.x, 0, 'Revisiting does not replay the shake');
const success = harness(); tree = success({ component: base }); option(tree, 'A').props.onClick();
tree = success({ component: submitted('a', 1, true), isSubmitted: true });
assert.match(option(tree, 'A').props.className, /border-\[#10B981\]/);
assert(nodes(tree).some(node => node.type === 'div' && Array.isArray(node.props.animate?.scale)), 'Fresh success has a pulse');
const reduced = harness(true); tree = reduced({ component: base }); option(tree, 'B').props.onClick();
tree = reduced({ component: submitted('b', 1, false) });
assert.equal(option(tree, 'B').props.animate.x, 0, 'Reduced motion keeps feedback static');

const pageSource = fs.readFileSync(path.join(root, 'src/pages/student/ComponentModePlay.tsx'), 'utf8');
const page = ts.createSourceFile('page.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const panel = page.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'ComponentAttemptFeedback');
assert(panel, 'Feedback panel must exist');
const context = { exports: {}, require: name => name === 'react/jsx-runtime' ? jsx : null, ...icons };
vm.runInNewContext(compile(panel.getText(page)), context);
tree = context.ComponentAttemptFeedback({ component, answers: [], onReveal() {} });
assert.match(tree.props.className, /border-red-200/);
assert(!nodes(tree).some(node => node.type === 'CheckCircle2'), 'Exhausted completion never displays a success check');
assert(nodes(tree).some(node => node.type === 'button'), 'Show Answer remains available');
tree = context.ComponentAttemptFeedback({ component: submitted('a', 1, true), answers: [], onReveal() {} });
assert.match(tree.props.className, /border-emerald-200/);
let submitHandler;
function findSubmit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(page) === 'handleComponentSubmit') submitHandler = node.initializer.getText(page);
  ts.forEachChild(node, findSubmit);
}
findSubmit(page);
assert(submitHandler);
async function checkDraftRace() {
  let finishDraft, didSubmit = false;
  const pendingDraft = new Promise(resolve => { finishDraft = resolve; });
  const submitContext = {
    draftSaves: { current: new Map([['question', pendingDraft]]) },
    submitComponentAttempt: async () => { didSubmit = true; return component; },
    setComponents() {}, setLocalResponses() {}, setCompletedComponentIds() {},
    toast: { error() {}, success() {} }, console,
  };
  const submit = vm.runInNewContext(compile(`(${submitHandler})`), submitContext);
  const pending = submit('question', { optionId: 'c' });
  assert.equal(didSubmit, false, 'Submission waits for the pending draft instead of racing it');
  finishDraft(); await pending;
  assert.equal(didSubmit, true);
}
checkDraftRace().then(() => console.log('MCQ feedback passed: immediate wrong/correct states, retry, exhaustion, reveal, revisit, animations, reduced motion, feedback panel and draft race.')).catch(error => { console.error(error); process.exitCode = 1; });
