// Local browser acceptance only. Never accepts a production URL, token or deployment flag.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { spawn } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const suites = [
  'practice-navigation.spec.ts',
  'practice-journey.spec.ts',
  'practice-formats.spec.ts',
  'phase7-isolation.spec.ts',
];
async function main() {
  const args = process.argv.slice(2);
  assert(
    args.length === 1 && args[0] === '--local',
    'Specify --local; hosted deployment/live acceptance remains deferred',
  );
  const report = path.join(ROOT, 'dev/.nafs-qa/browser-report.json');
  if (fs.existsSync(report)) fs.unlinkSync(report);
  const child = spawn(
    process.execPath,
    [
      path.join(ROOT, 'node_modules/@playwright/test/cli.js'),
      'test',
      '--config',
      'dev/nafs/playwright.config.ts',
      ...suites,
    ],
    {
      cwd: ROOT,
      env: { ...process.env, NAFS_REAL_DATABASE_QA: 'false' },
      stdio: 'inherit',
    },
  );
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', resolve);
  });
  assert.equal(code, 0, 'Local acceptance failed');
  const result = JSON.parse(fs.readFileSync(report));
  assert.equal(result.stats.unexpected, 0);
  assert.equal(result.stats.flaky, 0);
  assert.equal(result.stats.skipped, 0);
  assert(result.stats.expected > 0);
  const names = [];
  function collect(suite) {
    for (const s of suite.specs || []) names.push(s.title);
    for (const s of suite.suites || []) collect(s);
  }
  for (const s of result.suites) collect(s);
  const evidence = {
    phase: 11,
    recordedAt: new Date().toISOString(),
    environment: 'local-browser-fixtures',
    productionAccessed: false,
    liveAcceptance: false,
    deploymentDeferredByUser: true,
    apiAndAiResponses: 'synthetic fixture responses',
    browser: 'configured Chromium/Edge',
    suites,
    passed: result.stats.expected,
    failed: 0,
    flaky: 0,
    skipped: 0,
    cases: names,
  };
  fs.writeFileSync(
    path.join(ROOT, 'docs/nafs/practice/PHASE11_BROWSER_VERIFICATION.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({
      localAcceptancePassed: evidence.passed,
      liveAcceptance: false,
      deploymentDeferred: true,
    }),
  );
}
main().catch((e) => {
  console.error(
    'Phase 11 local browser acceptance failed:',
    e.name === 'AssertionError' ? e.message.split('\n')[0] : e.code || e.name,
  );
  process.exitCode = 1;
});
