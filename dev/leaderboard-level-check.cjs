// Render the actual empty-state branch with real CEFR resolution, without network or accounts.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const ts = require('typescript'), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync('src/utils/leaderboardLevel.ts', 'utf8')), { exports: moduleObject.exports, module: moduleObject });
const resolve = moduleObject.exports.resolveLeaderboardLevel;
const source = ts.createSourceFile('Leaderboard.tsx', fs.readFileSync('src/pages/student/Leaderboard.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let branch;
function visit(node) {
  if (ts.isIfStatement(node) && node.expression.getText(source) === '!leaderboard || leaderboard.length === 0') branch = node.thenStatement.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(branch);
function render(currentUser, signedInUser) {
  const context = { React, leaderboard: [], currentUser, currentUserLevel: resolve(currentUser, signedInUser) };
  vm.createContext(context);
  const markup = vm.runInContext(compile(`function EmptyState() ${branch}\nReact.createElement(EmptyState);`), context);
  return renderToStaticMarkup(markup);
}
for (const schoolCategory of ['american', 'saudi']) {
  const baseline = { schoolCategory, cefrLevel: 'B1', aiCefrLevel: null };
  assert.equal(resolve(baseline), 'B1');
  assert.equal(resolve({ aiCefrLevel: ' a2 ', cefrLevel: 'B1' }), 'A2');
  assert.equal(resolve({ aiCefrLevel: 'unknown', cefrLevel: ' b1 ' }), 'B1');
  assert.match(render(baseline), /No rankings are available/);
  assert.match(render({ aiCefrLevel: null }, baseline), /No rankings are available/);
  assert.match(render({ aiCefrLevel: 'A2' }, baseline), /No rankings are available/);
  assert.match(render({ aiCefrLevel: null, cefrLevel: null }), /has not been assessed/);
  assert.match(render({ aiCefrLevel: 'unknown', cefrLevel: '' }), /has not been assessed/);
}
console.log('Leaderboard checks passed: American/Saudi baseline and AI levels, older API responses, normalization and genuine unassessed states.');
