const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');

// Execute the production preview controller in the hook harnesses as well.
module.exports = function previewFixture(timers = { setTimeout, clearTimeout }) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/avatar-reading/avatarPreview.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, ...timers });
  return module.exports;
};
