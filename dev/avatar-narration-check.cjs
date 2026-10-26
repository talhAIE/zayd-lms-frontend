const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const cues=require('../src/components/avatar-reading/readingNarrationCues.json');
const moduleObject={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/avatar-reading/readingNarration.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,
  {module:moduleObject,exports:moduleObject.exports,require:()=>cues});
const {readingNarration,activeNarrationCue}=moduleObject.exports;
for(const [id,entry] of Object.entries(cues)){
  const narration=readingNarration(id,entry.audioUrl,entry.text,entry.duration,0);
  assert(narration);
  let end=0,offset=0;
  entry.cues.forEach((cue,index)=>{
    assert(cue.start>=end&&cue.end>cue.start&&cue.end<=entry.duration);
    assert(cue.from>=offset&&cue.to>cue.from&&cue.to<=entry.text.length);
    assert(!entry.text.slice(offset,cue.from).trim(),'Unaligned passage text');
    assert.equal(activeNarrationCue(entry.cues,(cue.start+cue.end)/2),index);
    assert.equal(activeNarrationCue(entry.cues,cue.end),-1,'Silence must not highlight a sentence');
    offset=cue.to;end=cue.end;
  });
  assert(!entry.text.slice(offset).trim());
  assert.equal(activeNarrationCue(entry.cues,entry.duration),-1);
  assert.equal(readingNarration(id,'changed.wav',entry.text,entry.duration,0),undefined);
  assert.equal(readingNarration(id,entry.audioUrl,entry.text+' changed',entry.duration,0),undefined);
  assert.equal(readingNarration(id,entry.audioUrl,entry.text,entry.duration+2,0),undefined);
  assert.equal(readingNarration(id,entry.audioUrl,entry.text,NaN,0),undefined);
}
assert.equal(readingNarration('unknown','audio','text',1,0),undefined);
console.log('Both 3D Reading cue maps: complete text coverage, ordered timestamps, silence/end boundaries and changed-asset rejection passed.');
