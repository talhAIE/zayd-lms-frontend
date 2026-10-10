// Exercise the full leaderboard page with controlled API state and real React rendering.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const ts = require('typescript'), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
const helper = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync('src/utils/leaderboardLevel.ts', 'utf8')), { exports: helper.exports, module: helper });
const resolve = helper.exports.resolveLeaderboardLevel;
const page = compile(fs.readFileSync('src/pages/student/Leaderboard.tsx', 'utf8'));
const student = (name, rank, level) => ({ username: name, firstName: name, lastName: 'Student', rank, aiCefrLevel: level, cefrLevel: level, totalSeconds: 3600, completedTopics: 2 });
function render(currentUser, signedInUser, scope, leaderboard = []) {
  const state = { leaderboard: { currentUser, scope, leaderboard, error: null, isLoading: false } };
  const moduleObject = { exports: {} };
  const hooks = { ...React, useEffect() {}, useRef: value => ({ current: value }), useState: initial => {
    const value = typeof initial === 'function' ? initial() : initial;
    return [Array.isArray(value) && value.length === 0 ? leaderboard : value, () => {}];
  }};
  const box = props => React.createElement('div', null, props.children);
  vm.runInNewContext(page, {
    module: moduleObject, exports: moduleObject.exports,
    localStorage: { getItem: () => JSON.stringify(signedInUser || {}) },
    window: { innerWidth: 1200 },
    require: name => {
      if (name === 'react') return hooks;
      if (name === '@/utils/leaderboardLevel') return helper.exports;
      if (name === 'react-router-dom') return { useSearchParams: () => [new URLSearchParams(), () => {}], useNavigate: () => () => {} };
      if (name === '@/redux/hooks') return { useAppDispatch: () => () => {}, useAppSelector: selector => selector(state) };
      if (name === '@/redux/slices/leaderboardSlice') return { fetchLeaderboard() {}, formatTime: seconds => `${seconds}s` };
      if (name === 'lucide-react') return { Crown: () => null, Clock: () => null };
      if (name.includes('/skeleton')) return { Skeleton: box };
      if (name.includes('/avatar')) return { Avatar: box, AvatarFallback: box };
      if (name.includes('InteractiveTour')) return { __esModule: true, default: () => null };
      if (name.startsWith('@/assets/')) return 'image.png';
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return renderToStaticMarkup(React.createElement(moduleObject.exports.default));
}
for (const schoolCategory of ['american', 'saudi']) {
  const baseline = { id: 'viewer', schoolCategory, cefrLevel: 'B1', aiCefrLevel: null };
  assert.equal(resolve(baseline), 'B1');
  assert.equal(resolve({ aiCefrLevel: ' a2 ', cefrLevel: 'B1' }), 'A2');
  assert.equal(resolve({ aiCefrLevel: 'unknown', cefrLevel: ' b1 ' }), 'B1');
  assert.match(render(student('Viewer', null, 'B1'), baseline, 'level'), /No rankings are available for your level/);
  assert.match(render(student('Viewer', null, null), baseline, undefined), /No rankings are available for your level/);
  const others = [student('Other A2', 1, 'A2'), student('Other B1', 4, 'B1')];
  const general = render(student('Viewer', null, null), baseline, 'general', others);
  assert.match(general, /General weekly leaderboard/);
  assert.match(general, /Other A2/);
  assert.match(general, /Other B1/);
  assert.match(general, /personal rank is unavailable/);
  assert.equal((general.match(/role="status"/g) || []).length, 1);
  const assessed = render(student('Viewer', 5, 'A2'), baseline, 'level', others);
  assert(!assessed.includes('has not been assessed'));
  assert(!assessed.includes('General weekly leaderboard'));
  const emptyGeneral = render(student('Viewer', null, null), baseline, 'general');
  assert.match(emptyGeneral, /has not been assessed/);
  assert.match(emptyGeneral, /No rankings are available this week/);
}
console.log('Leaderboard page checks passed: general rankings and reminder together, no invented personal rank, assessed level view, empty weeks and legacy fallback for both curricula.');
