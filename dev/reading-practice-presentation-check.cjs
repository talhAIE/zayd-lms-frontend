const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/readingPracticePresentation.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports});
const parse=mod.exports.readingPracticePresentation;
const text='Louis Armstrong, known as “Satchmo,” played his horn.';
for(const content of [
  `Please read the following sentence aloud:\n\n"${text}"`,
  `Please read the following sentence aloud:\n\n“${text}”\n  `,
  `Good job! Now read the next sentence:\n"${text}"\n`,
  `Please try reading this sentence again:\n"${text}"\r\n`,
]){
  assert.equal(parse(content,text).sentence,text);
  assert(!parse(content,text).instruction.includes('Louis'));
}
assert.equal(parse('Please read the following sentence aloud:\n“His music is **contagious**.”\n','His music is contagious.').sentence,'His music is contagious.');
assert.equal(parse(`Please read the following sentence aloud: “${text}”`,null).sentence,text);
assert.equal(parse('Now take the quiz.',null),null);
assert.equal(parse('Your target is ready.',text).sentence,text);
console.log('Practice target rendering: straight/curly quotes, trailing whitespace, markdown vocabulary and missing legacy metadata passed.');
