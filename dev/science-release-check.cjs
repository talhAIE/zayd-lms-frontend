// Verify built release artifacts and real pure transport/URL boundaries. No credentials or network.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname,'..');
const checks=[];
const check=(name,passed)=>{checks.push({name,passed});if(!passed)throw new Error(name);};
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
try {
  const dist=files(path.join(root,'dist'));
  check('built_index_exists',dist.includes(path.join(root,'dist/index.html')));
  check('no_harness_entries_or_private_fixture_files',!dist.some(p=>/science-spark-harness|science-spark-journey-harness|science-spark-fixtures/.test(p)));
  check('no_development_API_or_test_account_controls_in_bundle',dist.filter(p=>/\.(js|html)$/.test(p)).every(p=>!/__science-spark-test|__science-spark-fixtures|Current synthetic account/.test(read(p))));
  const canonical=read(path.join(root,'../zayd-lms-backend/src/modules/science-spark/contracts/science-spark.contract.ts'));
  check('canonical_backend_contract_matches',read(path.join(root,'src/types/science-spark.contract.ts')).split('// END GENERATED HEADER\n')[1]===canonical);
  const transport=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'science-service-check.cjs')],{cwd:root,encoding:'utf8'}));
  const practice=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'science-practice-check.cjs')],{cwd:root,encoding:'utf8'}));
  check('eight_real_auth_transport_regressions',transport.pureTransportChecks.length===8 && transport.pureTransportChecks.every(c=>c.passed));
  check('twenty_Practice_provider_URL_boundary_checks',practice.checks.length===20 && practice.checks.every(c=>c.passed));
  const report={phase:7,capturedAtUtc:new Date().toISOString(),checks,transportChecks:transport.pureTransportChecks,practiceChecks:practice.checks,networkCalls:0,databaseConnections:0,productionBuildArtifacts:dist.filter(p=>/\.(js|css|html)$/.test(p)).map(p=>({file:path.relative(path.join(root,'dist'),p).replace(/\\/g,'/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')})),releaseReadiness:'See backend phase7-release-verification.json; prior runtime/playable checks and full generic browser regression remain pending.'};
  fs.writeFileSync(path.join(root,'SCIENCE_SPARK_PHASE7_VERIFICATION.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Science frontend release: ${checks.length} artifact checks, 8 transport checks, 20 Practice checks passed.`);
} catch(e) {console.error(`Science frontend release check failed: ${e.message}`);process.exitCode=1;}
