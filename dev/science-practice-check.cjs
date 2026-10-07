// Pure external URL boundary checks; no network, browser or credentials.
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.resolve(__dirname, '../src/components/science/sciencePractice.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleValue = { exports: {} };
vm.runInNewContext(compiled, { exports: moduleValue.exports, module: moduleValue, URL });
const validate = moduleValue.exports.validateSciencePractice;
const base = { kind: 'external_practice', activityKey: 'practice', provider: 'kahoot', embedMode: 'preview', embedUrl: 'https://embed.kahoot.it/aa08c9f9-3350-4fcb-85da-2a34eaf58169', detailsUrl: 'https://create.kahoot.it/details/light/aa08c9f9-3350-4fcb-85da-2a34eaf58169' };
const checks = [];
function check(name, run) { run(); checks.push({ name, passed: true }); }
check('Shareable preview URL accepted without claiming assignment', () => assert.equal(validate(base).embedUrl, base.embedUrl));
check('Server-configured assignment query preserved', () => assert.equal(validate({ ...base, embedMode: 'assignment', embedUrl: 'https://embed.kahoot.it/owner-assignment?challenge=example' }).embedUrl, 'https://embed.kahoot.it/owner-assignment?challenge=example'));
for (const url of ['javascript:alert(1)', 'data:text/html,example', 'http://embed.kahoot.it/id', 'https://embed.kahoot.it.evil.test/id', 'https://evil.test/id', 'https://user:password@embed.kahoot.it/id', 'https://embed.kahoot.it:444/id', 'https://embed.kahoot.it/id#other', 'https://embed.kahoot.it/']) {
  check(`Reject unsafe embed: ${url}`, () => assert.throws(() => validate({ ...base, embedUrl: url })));
}
for (const url of ['javascript:alert(1)', 'https://evil.test/details/light/id', 'https://create.kahoot.it/auth/login', 'https://create.kahoot.it/details/light/id?token=example', 'https://create.kahoot.it/details/light/id#fragment']) {
  check(`Reject unsafe fallback: ${url}`, () => assert.throws(() => validate({ ...base, detailsUrl: url })));
}
for (const change of [{ provider: 'other' }, { activityKey: 'lesson-1' }, { embedMode: undefined }, { embedMode: 'verified-by-load' }]) {
  check(`Reject incorrect payload: ${JSON.stringify(change)}`, () => assert.throws(() => validate({ ...base, ...change })));
}
console.log(JSON.stringify({ phase: 6, checks, networkCalls: 0, databaseConnections: 0 }, null, 2));
