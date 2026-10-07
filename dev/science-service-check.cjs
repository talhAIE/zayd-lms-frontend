// Pure transport regression checks with real Axios interceptors and a controlled adapter.
// No browser automation, network, credentials or database connection.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const axios = require('axios');
const results = [];
const originalAdapter = axios.defaults.adapter;
function setup(adapter) {
  const values = new Map();
  const localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  const window = { location: { href: '' } };
  let clearCount = 0;
  axios.defaults.adapter = adapter;
  const load = (file, apiClient) => {
    const source = fs.readFileSync(path.resolve(__dirname, '../src', file), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', '"http://science.local"');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(js, { exports: module.exports, module, localStorage, window, console: { warn() {} }, require: key => {
      if (key === 'axios') return axios;
      if (key === '@/config/ApiConfig') return { default: apiClient, __esModule: true };
      if (key === '@/utils/tokenUtils') return { clearAuthData: () => { clearCount++; values.clear(); } };
      throw new Error('Unexpected runtime import');
    } }, { filename: file });
    return module.exports;
  };
  const api = load('config/ApiConfig.tsx').default;
  const service = load('services/scienceSparkService.ts', api).scienceSparkService;
  const owner = { id: 'qa-a', username: 'qa.full.american.g7', sessionKey: 'local-test' };
  function signIn(id = owner.id, username = owner.username, token = 'old-access', refresh = 'old-refresh') {
    values.set('AiTutorUser', JSON.stringify({ id, username }));
    values.set('accessToken', token); values.set('refreshToken', refresh);
  }
  signIn();
  return { api, service, owner, signIn, values, window, cleared: () => clearCount };
}
const ok = (config, data = { status: true, data: { available: true, courses: [] } }) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const unauthorized = config => Promise.reject(new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { ...ok(config), status: 401 }));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise(r => setImmediate(r));
async function until(check) { for (let i = 0; i < 100; i++) { if (check()) return; await tick(); } throw new Error('Expected request did not arrive'); }
async function test(name, run) { await run(); results.push({ name, passed: true }); }
async function main() {
  await test('Science mutations send only empty body, authenticated path and bounded timeout', async () => {
    let sent; const env = setup(async c => { sent = c; return ok(c); });
    await env.service.open(env.owner, new AbortController().signal, 'nature-of-science-unit-1', 'lesson-1');
    assert.equal(sent.url, '/science-spark/units/nature-of-science-unit-1/activities/lesson-1/open');
    assert.equal(sent.data, '{}'); assert.equal(sent.timeout, 30000); assert.equal(sent.headers.Authorization, 'Bearer old-access');
  });
  await test('Canceled/foreign owner cannot dispatch a Science request', async () => {
    let calls = 0; const env = setup(async c => { calls++; return ok(c); });
    env.signIn('qa-b', 'qa.full.saudi.g7');
    await assert.rejects(env.service.courses(env.owner, new AbortController().signal), axios.isCancel);
    assert.equal(calls, 0);
  });
  await test('Late content response is rejected after account change', async () => {
    const pending = deferred(); let config; const env = setup(c => { config = c; return pending.promise; });
    const request = env.service.content(env.owner, new AbortController().signal, 'nature-of-science-unit-1', 'lesson-1');
    const rejected = assert.rejects(request, axios.isCancel); await until(() => !!config);
    env.signIn('qa-b', 'qa.full.saudi.g7', 'new-user-access', 'new-user-refresh');
    pending.resolve(ok(config)); await rejected; assert.equal(env.values.get('accessToken'), 'new-user-access');
  });
  await test('Concurrent generic/Science 401s share one refresh and both retry', async () => {
    const refresh = deferred(); let refreshConfig, refreshCalls = 0, oldCalls = 0;
    const env = setup(c => {
      if (c.url.endsWith('/auth/refresh')) { refreshCalls++; refreshConfig = c; return refresh.promise; }
      if (c.headers.Authorization === 'Bearer old-access') { oldCalls++; return unauthorized(c); }
      return Promise.resolve(ok(c));
    });
    const science = env.service.courses(env.owner, new AbortController().signal);
    const generic = env.api.get('/learning/courses');
    await until(() => refreshConfig && oldCalls === 2); await tick();
    refresh.resolve(ok(refreshConfig, { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' }));
    await Promise.all([science, generic]); assert.equal(refreshCalls, 1); assert.equal(env.cleared(), 0);
  });
  await test('Account switch during refresh neither overwrites nor logs out new account', async () => {
    const refresh = deferred(); let config;
    const env = setup(c => c.url.endsWith('/auth/refresh') ? (config = c, refresh.promise) : unauthorized(c));
    const pending = env.service.courses(env.owner, new AbortController().signal);
    const rejected = assert.rejects(pending, axios.isCancel); await until(() => !!config);
    env.signIn('qa-b', 'qa.full.saudi.g7', 'new-user-access', 'new-user-refresh');
    refresh.resolve(ok(config, { accessToken: 'old-user-fresh', refreshToken: 'old-user-refresh' }));
    await rejected; assert.equal(env.values.get('accessToken'), 'new-user-access'); assert.equal(env.cleared(), 0); assert.equal(env.window.location.href, '');
  });
  await test('Aborted queued Science request cannot retry while generic refresh succeeds', async () => {
    const refresh = deferred(); let config, oldCalls = 0, scienceFreshCalls = 0;
    const env = setup(c => {
      if (c.url.endsWith('/auth/refresh')) { config = c; return refresh.promise; }
      if (c.headers.Authorization === 'Bearer old-access') { oldCalls++; return unauthorized(c); }
      if (c.url.includes('/science-spark')) scienceFreshCalls++;
      return Promise.resolve(ok(c));
    });
    const generic = env.api.get('/learning/courses'); const controller = new AbortController();
    const pending = env.service.courses(env.owner, controller.signal); const rejected = assert.rejects(pending, axios.isCancel);
    await until(() => config && oldCalls === 2); await tick(); controller.abort();
    refresh.resolve(ok(config, { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' }));
    await generic; await rejected; assert.equal(scienceFreshCalls, 0);
  });
  await test('Failed refresh clears current session; retry count is bounded', async () => {
    let calls = 0; const env = setup(c => { calls++; return unauthorized(c); });
    await assert.rejects(env.service.courses(env.owner, new AbortController().signal));
    assert.equal(env.cleared(), 1); assert.equal(env.window.location.href, '/login'); assert.equal(calls, 2);
  });
  await test('Missing refresh token does not leave the shared queue stuck', async () => {
    const env = setup(c => c.url.endsWith('/auth/refresh') ? Promise.resolve(ok(c, { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' })) : c.headers.Authorization === 'Bearer fresh-access' ? Promise.resolve(ok(c)) : unauthorized(c));
    env.values.delete('refreshToken'); await assert.rejects(env.service.courses(env.owner, new AbortController().signal));
    env.signIn(); await env.service.courses(env.owner, new AbortController().signal); assert.equal(env.values.get('accessToken'), 'fresh-access');
  });
  console.log(JSON.stringify({ phase: 5, pureTransportChecks: results, networkCalls: 0, databaseConnections: 0 }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { axios.defaults.adapter = originalAdapter; });
