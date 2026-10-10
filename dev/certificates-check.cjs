// Exercise the actual Certifications loader against in-memory API responses.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = ts.createSourceFile('Rewards.tsx', fs.readFileSync(path.join(root, 'src/pages/student/Rewards.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let loader;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'fetchCertificates') loader = node.initializer.arguments[0].getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(loader);
const compile = code => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
async function run(options = {}, state = { warning: 'previous warning', error: 'previous error' }) {
  const calls = [], owner = { current: options.noUser ? null : 'learner' };
  const sandbox = {
    owner, userId: owner.current,
    setCertificatesError: value => { state.error = value; },
    setCertificatesSyncWarning: value => { state.warning = value; },
    setCertificatesLoading: value => { state.loading = value; },
    setCertificates: value => { state.certificates = value; },
    console: { error() {} },
    apiClient: {
      post: async (url, body) => {
        calls.push(['POST', url]);
        assert.equal(url, '/learning/courses/certificates/sync');
        assert.equal(Object.keys(body).length, 0);
        if (options.switchDuringSync) owner.current = 'other';
        if (options.syncFails) throw Error('sync unavailable');
      },
      get: async url => {
        calls.push(['GET', url]);
        assert.equal(url, '/users/learner/achievements/certificates');
        if (options.switchDuringList) owner.current = 'other';
        if (options.listFails) throw { response: { data: { message: 'List unavailable' } } };
        return { data: { status: 'success', data: { certificates: { earned: [{ id: 'earned', name: 'English', awardedAt: '2026-10-01' }], locked: [] }, user: { firstName: 'Test', lastName: 'Student' } } } };
      },
    },
  };
  await vm.runInNewContext(compile(`(${loader})()`), sandbox);
  return { state, calls };
}
(async () => {
  const success = await run();
  assert.equal(success.calls.length, 2);
  assert.equal(success.state.certificates[0].title, 'English Certificate');
  assert.equal(success.state.warning, null);
  const failure = await run({ syncFails: true });
  assert.equal(failure.calls.length, 2, 'Sync failure must still fetch saved certificates');
  assert.equal(failure.state.certificates[0].id, 'earned');
  assert.equal(failure.state.error, null);
  assert.match(failure.state.warning, /Showing saved certificates/);
  await run({}, failure.state);
  assert.equal(failure.state.warning, null, 'Successful retry must clear the sync warning');
  const listFailure = await run({ listFails: true });
  assert.equal(listFailure.state.error, 'List unavailable');
  assert.equal(listFailure.state.loading, false);
  const changed = await run({ switchDuringSync: true });
  assert.equal(changed.calls.length, 1);
  assert.equal(changed.state.certificates, undefined);
  const changedAfterGet = await run({ switchDuringList: true });
  assert.equal(changedAfterGet.state.certificates, undefined);
  assert.equal((await run({ noUser: true })).calls.length, 0);
  console.log('Certificates checks passed: correct sync URL, saved-data fallback, retry, list failures and account changes.');
})();
