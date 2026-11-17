const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const frontend = path.resolve(__dirname, '../../src/types/step-practice.contract.ts');
const backend = process.argv[2] || path.resolve(__dirname, '../../../step-backend/docs/step/step-practice.contract.ts');
const canonical = fs.readFileSync(backend, 'utf8').replace("from './step-api.contract'", "from './step.contract'");
assert.equal(fs.readFileSync(frontend, 'utf8'), canonical);
console.log('STEP practice learner contracts match (local assessment import name normalized).');
