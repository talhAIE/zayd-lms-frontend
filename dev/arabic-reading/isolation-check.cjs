'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),baseline='c6b4701',norm=s=>s.replace(/\r\n/g,'\n');
const git=(...args)=>norm(execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}));
const changed=git('diff','--name-only',baseline,'--','src').trim().split('\n').filter(Boolean);
const allowed=p=>p==='src/routes/index.tsx'||p==='src/types/arabic-reading.contract.ts'||p==='src/services/arabicReadingService.ts'||
  p.startsWith('src/components/arabic-reading/')||p.startsWith('src/pages/student/arabic-reading/')||p.startsWith('src/hooks/arabic-reading/')||/^src\/utils\/arabicReading(?:Identity|Pending|Recorder|Mutations)\.ts$/.test(p);
assert(changed.every(allowed),'Unrelated frontend source changed');
const read=p=>norm(fs.readFileSync(path.join(root,p),'utf8'));
const routes=read('src/routes/index.tsx'),stripped=routes.split('\n').filter(l=>!l.includes('ArabicReadingPage')&&!l.includes('Isolated Arabic shell')).join('\n');
assert.equal(stripped,git('show',baseline+':src/routes/index.tsx'),'Existing routes/layout changed');
const walk=directory=>fs.readdirSync(path.join(root,directory),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(directory+'/'+e.name):[directory+'/'+e.name]);
const files=[...walk('src/components/arabic-reading'),...walk('src/pages/student/arabic-reading'),...walk('src/hooks/arabic-reading'),
  'src/services/arabicReadingService.ts','src/utils/arabicReadingIdentity.ts','src/utils/arabicReadingPending.ts','src/utils/arabicReadingRecorder.ts','src/utils/arabicReadingMutations.ts'];
for(const file of files){
  const s=read(file);
  assert(!/content\/arabic-reading|answer-key\.proposed|privateSnapshotJson|privateContentJson|from\s+['"][^'"]*dev\//.test(s),'Private/test import in runtime: '+file);
  for(const m of s.matchAll(/from\s+['"]([^'"]+)['"]/g))assert(!/StudentLayout|layouts\/student-layout|useModeSession|useLearningProgressRefresh|services\/(learning|step|nafs)|components\/(nafs|step|avatar-reading)/.test(m[1]),'Existing mode effect imported: '+file);
  assert(!/sendBeacon|\/engagement\/|\/mode-sessions\//.test(s),'Normal usage/session endpoint in Arabic runtime: '+file);
}
assert(read('.env.example').includes('VITE_LMS_ENABLE_ARABIC_READING=false'));
assert(read('src/utils/arabicReadingPending.ts').includes("indexedDB.open('zayd-arabic-reading-recordings',1)"));
assert(read('src/utils/arabicReadingMutations.ts').includes("indexedDB.open('zayd-arabic-reading-mutations',1)"));
for(const file of ['src/hooks/useAudioRecorder.ts','src/utils/pendingReadingAudio.ts','src/utils/readingAudioUpload.ts','src/components/layouts/student-layout.tsx','src/config/ApiConfig.tsx'])assert.equal(read(file),git('show',baseline+':'+file),'Shared recorder/auth/layout changed: '+file);
console.log(JSON.stringify({passed:true,baseline,runtimeFiles:files.length,existingModeRecorderAuthLayoutSourceUnchanged:true,routeChanges:'two separate Arabic sibling routes only',defaultOff:true,separateStores:true,privateRuntimeImportAbsent:true,liveOperations:0}));
