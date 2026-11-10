const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const canonical = process.argv[2] || path.resolve(root, '../stageconv-backend/docs/step/step-api.contract.ts');
const local = path.join(root, 'src/types/step.contract.ts');
assert.equal(fs.readFileSync(local, 'utf8'), fs.readFileSync(canonical, 'utf8'), 'STEP API contract copies differ');
for (const relative of ['src/components/step', 'src/pages/student/step', 'src/services/stepService.ts', 'src/types/step.contract.ts']) {
  const target = path.join(root, relative);
  function inspect(file) {
    if (!fs.existsSync(file)) return;
    if (fs.statSync(file).isDirectory()) return fs.readdirSync(file).forEach(f => inspect(path.join(file, f)));
    if (/\.(ts|tsx|js|json)$/.test(file)) {
      const text = fs.readFileSync(file, 'utf8');
      assert(!/(?:from\s*|import\s*\(|require\s*\()[^;\n]*(?:prisma\/data\/step|\.keys\.json|private\/|content\.json)/.test(text), `Private authoring import: ${file}`);
    }
  }
  inspect(target);
}
console.log('STEP contract parity and private-authoring import checks passed.');
