// Read-only contract/type verification; no UI, server, database or browser startup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const canonical = process.argv[2] || path.resolve(root,
  '../zayd-lms-backend/docs/nafs/practice/api.contract.ts');
const files = [path.join(root, 'src/types/nafs-practice.contract.ts'),
  path.join(root, 'docs/nafs/practice/api.contract.ts')];
const read = file => fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
for (const file of files) assert.equal(read(file), read(canonical), 'Practice contract drift');
const program = ts.createProgram([...files,
  path.join(root, 'docs/nafs/practice/contract.examples.ts')], {
  strict: true, noEmit: true, skipLibCheck: true, types: [],
  target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: file => file, getCurrentDirectory: () => root,
  getNewLine: () => '\n',
}));
for (const file of files) assert(!/^import\b/m.test(read(file)), 'Public types must be self-contained');
console.log('NAFS Practice contract parity and learner privacy type boundaries passed.');
