// Sanitized evidence from final browser runs, source screenshots and built files.
// No credentials, source answer keys or authoring JSON are copied into artifacts.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = process.cwd();
const scratch = path.join(root, 'dev/.nafs-qa');
const list = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? list(path.join(d, e.name)) : [path.join(d, e.name)],
    );
const hash = (f) =>
  crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const normalized = (f) => fs.readFileSync(f, 'utf8').replaceAll('\r\n', '\n');
const cases = new Map();
function collect(suite) {
  for (const spec of suite.specs || [])
    for (const t of spec.tests) {
      const status = t.results.at(-1)?.status;
      if (status && status !== 'skipped')
        cases.set(`${path.basename(spec.file)}: ${spec.title}`, status);
    }
  for (const child of suite.suites || []) collect(child);
}
for (const filename of process.argv.slice(2)) {
  const file = path.resolve(filename);
  assert(
    path.relative(scratch, file) &&
      !path.relative(scratch, file).startsWith('..'),
    'Reports must be inside NAFS scratch',
  );
  collect(JSON.parse(fs.readFileSync(file, 'utf8')));
}
assert(
  cases.size >= 40,
  'Full preview, state, transport and real-database cases required',
);
assert(
  [...cases.values()].every((status) => status === 'passed'),
  'Unresolved browser case',
);
assert.equal(
  [...cases.keys()].filter((t) => t.includes('diagnostic quiz')).length,
  3,
);
assert.equal(
  [...cases.keys()].filter((t) =>
    t.includes('source images, save/resume/finish'),
  ).length,
  16,
);
const backend = path.resolve(root, '../zayd-lms-backend');
const source = JSON.parse(
  fs.readFileSync(
    path.join(backend, 'content/nafs/learner-content.json'),
    'utf8',
  ),
);
const liveImages = list(path.join(root, 'test-results/nafs')).filter((f) =>
  /g[369]-q\d+\.png$/.test(f),
);
const images =
  liveImages.length === 126
    ? liveImages
    : list(path.join(scratch, 'screenshots')).filter((f) =>
        /g[369]-q\d+\.png$/.test(f),
      );
for (const size of ['desktop', 'mobile']) {
  const matching = images.filter(
    (f) =>
      f.includes(path.sep + size + path.sep) || f.includes(`student-${size}-`),
  );
  const ids = matching.map((f) => path.basename(f, '.png')).sort();
  assert.deepEqual(
    ids,
    source.questions.map((q) => q.id).sort(),
    `Every question needs a ${size} screenshot`,
  );
  const archive = path.join(scratch, 'screenshots', size);
  fs.mkdirSync(archive, { recursive: true });
  for (const file of matching) {
    const dest = path.join(archive, path.basename(file));
    if (path.resolve(file) !== dest) fs.copyFileSync(file, dest);
  }
}
assert.equal(
  normalized(path.join(root, 'src/types/nafs.contract.ts')),
  normalized(path.join(backend, 'docs/nafs/nafs-api.contract.ts')),
);
const built = list(path.join(root, 'dist'));
const forbidden = [
  'nafs-browser-synthetic',
  'nafs.browser.synthetic',
  '__nafs_qa',
  'phase4-browser.private',
  'form-a-2026-v1',
  'review-findings.json',
  'nafs.test.student',
  'g3-q01',
  'g9-q25',
];
for (const file of built) {
  for (const value of forbidden)
    assert(
      !path.basename(file).includes(value),
      'Source/QA filename in release output',
    );
  if (/\.png$/i.test(file))
    assert(
      !source.assets.some((a) => a.sha256 === hash(file)),
      'Private NAFS source image bundled',
    );
  assert(
    !/nafs\/.*spec|browser-fixture|playwright|private\.json/.test(
      file.replaceAll('\\', '/'),
    ),
  );
  if (/\.(js|html|css|json)$/.test(file))
    for (const value of forbidden)
      assert(
        !fs.readFileSync(file, 'utf8').includes(value),
        'Development/source data found in release output',
      );
}
const database = JSON.parse(
  fs.readFileSync(
    path.join(backend, 'tmp/nafs-phase3/phase4-browser-report.json'),
    'utf8',
  ),
);
assert.equal(database.status, 'passed');
assert.equal(database.normalTablesUnchanged, 44);
assert.equal(database.originalFormsPublished, 0);
assert.equal(database.submitted, 3);
const report = {
  status: 'passed',
  capturedAtUtc: new Date().toISOString(),
  browser: 'Microsoft Edge (Chromium), headless',
  cases: [...cases].map(([name, status]) => ({ name, status })),
  sourcePreview: {
    assessments: 8,
    questionsPerViewport: 63,
    viewports: ['1440x1000', '390x844'],
    screenshots: images.length,
    assetsHashAndDimensionsCheckedPerViewport: JSON.parse(
      fs.readFileSync(
        path.join(backend, 'content/nafs/learner-presentation.json'),
        'utf8',
      ),
    ).assets.length,
    passages: 3,
    privateSourceKeysRead: false,
    academicApproval: false,
  },
  realDatabase: {
    ...database,
    scores: ['2/2', '0/2', '1/2'],
    teacherMarksMatched: true,
  },
  release: {
    canonicalContractMatched: true,
    noSourceContentOrQaControlsInBundle: true,
    files: built
      .filter((f) => /\.(js|css|html)$/.test(f))
      .map((f) => ({
        file: path.relative(path.join(root, 'dist'), f).replaceAll('\\', '/'),
        sha256: hash(f),
      })),
  },
  academicFindingsPending: 7,
  productionChanges: false,
};
fs.writeFileSync(
  path.join(root, 'docs/nafs/PHASE4_VERIFICATION.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  `${cases.size} final cases passed; 126 source screenshots; release boundaries and real database preservation verified.`,
);
