// Vercel handover verification only: no hosting credentials, deployment or production config mutation.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(p,'utf8');
const checks=[];
const check=(name,passed)=>{checks.push({name,passed});if(!passed)throw new Error(name);};
try {
  const configPath=path.join(root,'vercel.json');
  const config=JSON.parse(read(configPath));
  check('Vercel_SPA_rewrite_present',config.rewrites.some(r=>r.source==='/(.*)' && r.destination==='/'));
  const artifacts=JSON.parse(read(path.join(root,'SCIENCE_SPARK_PHASE7_VERIFICATION.json')));
  check('recorded_release_artifact_auth_and_URL_checks_passed',artifacts.checks.every(c=>c.passed) && artifacts.transportChecks.length===8 && artifacts.practiceChecks.length===20);
  const backend=JSON.parse(read(path.join(root,'../zayd-lms-backend/docs/science-spark/phase8-preflight-verification.json')));
  check('Phase8_record_respects_user_confirmed_Vercel_provider',backend.phase===8 && backend.userAuthorization.frontendProvider==='vercel');
  check('blocked_rollout_has_no_production_mutations',backend.readyForRollout===false && Object.values(backend.productionMutations).every(v=>v===0));
  const report={phase:8,capturedAtUtc:new Date().toISOString(),status:'local_Vercel_handover_verified_rollout_pending',provider:'vercel',providerSource:'Human user confirmation',checks,configurationSha256:crypto.createHash('sha256').update(fs.readFileSync(configPath)).digest('hex'),hostingProjectVerified:false,deployedFrontendVersion:null,matchedProductionBackendOriginVerified:false,productionDeploymentPerformed:false,netlifyConfigurationChanged:false,blockers:backend.blockers};
  fs.writeFileSync(path.join(root,'SCIENCE_SPARK_PHASE8_VERIFICATION.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Science Phase 8 frontend: ${checks.length} local handover checks passed; production rollout remains pending.`);
  if(process.argv.includes('--require-ready'))process.exitCode=2;
} catch {console.error('Science Phase 8 frontend preflight failed; diagnostic details suppressed.');process.exitCode=1;}
