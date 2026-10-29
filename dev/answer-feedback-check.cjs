const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const load = require('./load-tsx.cjs');
const file = path.resolve(__dirname, '../src/components/learning/AnswerFeedback.tsx');
function harness() {
  const slots = [], pending = new Map(); let cursor, effects, dirty, nextTimer = 0;
  const react = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { if (slots[index] !== value) { slots[index] = value; dirty = true; } }]; },
    useEffect(effect, deps) { const index = cursor++; const old = slots[index]; if (!old || deps.some((v, i) => !Object.is(v, old.deps[i]))) effects.push(() => { old?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; }); },
  };
  const shared = load(file, { react, window: { setTimeout(fn) { pending.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { pending.delete(id); } } });
  const render = props => { let tree, count = 0; do { cursor = 0; effects = []; dirty = false; tree = shared.GradedAnswerButton(props); effects.forEach(fn => fn()); assert(++count < 10); } while (dirty); return tree; };
  return { render, expire() { [...pending.values()].forEach(fn => fn()); pending.clear(); }, unmount() { slots.forEach(s => s?.cleanup?.()); assert.equal(pending.size, 0); } };
}
const fresh = harness();
let tree = fresh.render({ feedbackKey: null, result: null, children: 'Answer' });
assert(!tree.props.className.includes('answer-feedback-pop'));
tree = fresh.render({ feedbackKey: 'attempt-1', result: false, children: 'Answer' });
assert.match(tree.props.className, /answer-feedback-shake/);
assert.equal(tree.props['data-answer-result'], 'false');
fresh.expire(); tree = fresh.render({ feedbackKey: 'attempt-1', result: false });
assert(!tree.props.className.includes('shake'), 'A rerender never repeats an expired animation');
tree = fresh.render({ feedbackKey: 'attempt-2', result: null });
tree = fresh.render({ feedbackKey: 'attempt-2', result: true });
assert.match(tree.props.className, /answer-feedback-pop/, 'A delayed submitted choice still celebrates');
assert(tree.props.children[1], 'A new correct result renders confetti');
tree = fresh.render({ feedbackKey: 'attempt-2', result: null });
tree = fresh.render({ feedbackKey: 'attempt-2', result: true });
assert(!tree.props.className.includes('pop'), 'Restoring edited text does not replay the previous grade');
fresh.expire(); tree = fresh.render({ feedbackKey: 'attempt-2', result: true });
assert.equal(tree.props.children[1], false, 'Particles are removed after the animation');
fresh.unmount();
const saved = harness(); tree = saved.render({ feedbackKey: 'saved-attempt', result: true });
assert(!tree.props.className.includes('pop'), 'A saved correct answer never replays on mount');
assert.equal(tree.props['data-answer-result'], 'true');
tree = saved.render({ feedbackKey: 'saved-attempt', result: null });
assert.equal(tree.props['data-answer-result'], undefined, 'Editing clears old feedback');
saved.unmount();
const css = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf8');
assert.match(css, /prefers-reduced-motion: reduce[\s\S]*answer-feedback-pop[\s\S]*animation: none/);
assert.match(css, /answer-confetti \{ display: none/);
console.log('PASS: fresh correct/wrong results, retries, delayed result synchronization, saved results, edit suppression, cleanup and reduced motion.');
