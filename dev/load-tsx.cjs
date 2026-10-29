const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
// Source loader for local Node regression fixtures; never used by the app.
module.exports = function load(file, overrides = {}) {
  const moduleValue = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(source, { module: moduleValue, exports: moduleValue.exports, window: overrides.window, require(name) {
    if (name in overrides) return overrides[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), `${name}.tsx`), overrides);
    return require(name);
  } }, { filename: file });
  return moduleValue.exports;
};
