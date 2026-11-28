'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const backend = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(root, '../arabic-backend');
const canonical = fs.readFileSync(path.join(backend, 'src/modules/arabic-reading/arabic-reading.contract.ts'), 'utf8').replace(/\r\n/g, '\n');
for (const file of [path.join(root, 'src/types/arabic-reading.contract.ts'), path.join(root, 'docs/arabic-reading/api.contract.ts'),
  path.join(backend, 'docs/arabic-reading/api.contract.ts')])
  assert.equal(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), canonical, 'Contract copy drift: ' + file);
for (const relative of ['src/types/arabic-reading.contract.ts', 'src/pages/student/arabic-reading', 'src/components/arabic-reading', 'src/services/arabicReadingService.ts']) {
  function inspect(target) {
    if (!fs.existsSync(target)) return;
    if (fs.statSync(target).isDirectory()) return fs.readdirSync(target).forEach(f => inspect(path.join(target, f)));
    const source = fs.readFileSync(target, 'utf8');
    assert(!/content\/arabic-reading|answer-key|privateContentJson|privateSnapshotJson|sourceSha256|comparisonTokensPreview/.test(source), 'Private authoring material in Arabic learner inputs: ' + target);
  }
  inspect(path.join(root, relative));
}
console.log('Arabic learner contract parity and private-authoring isolation passed.');
