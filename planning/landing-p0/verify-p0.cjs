const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname,'../..');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest=read('source-manifest.json'), assets=read('asset-inventory.json'), data=read('content-data.json'), decisions=read('decisions.json'), requirements=read('requirements.json'), baseline=read('baseline/baseline-report.json');
const changed=Object.entries(manifest.applicationAndConfigSha256).filter(([file,hash])=>sha(path.join(root,file))!==hash).map(([file])=>file);
const checked=requirements.requirements.filter(r=>r.status==='planning_complete');
const typed=cp.spawnSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'planning/landing-p0/content-contract.ts','--noEmit','--strict','--skipLibCheck','--target','es2020','--module','esnext','--moduleResolution','bundler','--types','node'],{cwd:root,encoding:'utf8'});
const checks={
  currentPdfHashMatches:sha(manifest.pdf.path)===manifest.pdf.sha256,
  currentPdfHas29Pages:manifest.pdf.pages===29,
  applicationAndConfigUnchanged:changed.length===0,
  all134RequirementsTracked:requirements.requirements.length===134 && new Set(requirements.requirements.map(r=>r.id)).size===134,
  exactlyFiveP0ItemsComplete:checked.length===5 && checked.every(r=>r.phase==='P0'),
  allLaterPhasesRemainUnimplemented:requirements.requirements.filter(r=>r.phase!=='P0').every(r=>r.status==='not_implemented'),
  allTenPdfAndFourEngineeringDecisionsTracked:decisions.decisions.length===14 && decisions.decisions.filter(d=>d.id.startsWith('D')).length===10 && decisions.decisions.every(d=>d.owner&&d.status&&d.nextAction),
  topicDecisionExplicitlyDeferred:decisions.decisions.find(d=>d.id==='D01').status==='deferred_by_user' && data.topicCount.approvedUnified.value===null,
  requiredAssetCategoriesInventoried:assets.requiredScreenshotReferences.length===8 && assets.requiredDialogueClips.length===6 && assets.requiredDemoPrompts.length===2 && assets.requiredNewFeatureIcons.length===4,
  allScreenshotReferenceFilesExist:assets.requiredScreenshotReferences.every(s=>fs.existsSync(path.join(root,s.source.file))),
  allNineFaqDraftsPresent:data.faqEntries.length===9 && data.faqEntries.every(f=>f.question&&f.answerMarkdown.length>80&&f.status==='supplied_draft'),
  threeViewportBaselinesSuccessful:baseline.viewports.length===3 && baseline.viewports.every(v=>v.httpStatus===200 && !v.overflow && !v.brokenImages.length),
  finalBrowserObservationsCompleted:baseline.interactions.length===11 && baseline.interactions.every(i=>i.passed) && !baseline.pageErrors.length && !baseline.failedRequests.length,
  existingConversionDefectRemainsExplicit:baseline.interactions.some(i=>i.evidence?.expectedProductBehavior===false),
  planningTypeScriptContractPasses:typed.status===0,
};
const result={verifiedAtUtc:new Date().toISOString(),scope:'P0 planning/evidence only; no claim of P1 implementation or business approval',checks,allPassed:Object.values(checks).every(Boolean),applicationFilesChecked:Object.keys(manifest.applicationAndConfigSha256).length,changedApplicationFiles:changed,baselinePngCount:fs.readdirSync(path.join(__dirname,'baseline')).filter(f=>f.endsWith('.png')).length,expectedBehaviorObservations:10,knownDefectObservations:1,typeScriptExitCode:typed.status,remainingDecision:'D01 deferred by user; all other unconfirmed decisions retain explicit status',p1Readiness:'Independent P1 work may begin; S3-TOPICS remains blocked pending D01'};
if(typed.status!==0)result.typeScriptDiagnostics=typed.stdout+typed.stderr;
fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(!result.allPassed)process.exitCode=1;
