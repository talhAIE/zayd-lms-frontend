const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = ts.createSourceFile('recorder.ts', fs.readFileSync(path.join(__dirname, '../src/hooks/useAudioRecorder.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const detector = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'isDefinitelySilent');
let samples = [0], closed = 0, decodeFails = false;
const context = {
  AudioContext: class {
    async decodeAudioData() {
      if (decodeFails) throw new Error('Unsupported codec');
      return { sampleRate: 4000, numberOfChannels: 1, getChannelData: () => samples };
    }
    async close() { closed++; }
  },
};
vm.runInNewContext(ts.transpileModule(detector.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
const blob = { arrayBuffer: async () => new ArrayBuffer(0) };
(async () => {
  assert.equal(await context.isDefinitelySilent(blob, 0.00001), true, 'Digital silence must still be rejected');
  samples = [0, 0.0005, -0.0004, 0];
  assert.equal(await context.isDefinitelySilent(blob, 0.00001), false, 'Quiet demo audio must reach the speech engine');
  assert.equal(await context.isDefinitelySilent(blob), true, 'Normal LMS default threshold must remain unchanged');
  samples = [0, 0.03, -0.02];
  assert.equal(await context.isDefinitelySilent(blob), false);
  decodeFails = true;
  assert.equal(await context.isDefinitelySilent(blob, 0.00001), false, 'Codec uncertainty must defer to the backend');
  assert.equal(closed, 5, 'Audio decoder resources must always be released');
  console.log('Demo silence checks passed: quiet audio forwarded, digital silence rejected, normal threshold unchanged, decoder cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
