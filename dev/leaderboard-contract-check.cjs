// Execute the actual thunk/reducer against controlled responses. No network or DB.
const fs=require('fs'), path=require('path'), vm=require('vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const toolkit=require('@reduxjs/toolkit');
const source=fs.readFileSync(path.resolve(__dirname,'../src/redux/slices/leaderboardSlice.ts'),'utf8');
async function run(body){
  const moduleValue={exports:{}};
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(js,{module:moduleValue,exports:moduleValue.exports,URLSearchParams,require:key=>{
    if(key==='@reduxjs/toolkit')return toolkit;
    if(key==='@/config/ApiConfig')return {__esModule:true,default:{get:async()=>({data:body})}};
    throw Error('Unexpected import');
  }});
  const store=toolkit.configureStore({reducer:moduleValue.exports.default});
  const action=await store.dispatch(moduleValue.exports.fetchLeaderboard({userId:'controlled-fixture'}));
  const state=store.getState();
  return {action:action.type,isLoading:state.isLoading,error:state.error,leaderboard:state.leaderboard??'<undefined>',currentUser:state.currentUser??'<undefined>'};
}
(async()=>{
  const payload={leaderboard:[{rank:1,username:'controlled-fixture'}],currentUser:{rank:1,username:'controlled-fixture'}};
  for (const body of [payload, {status:true,data:payload}]) {
    const result=await run(body);
    assert.equal(JSON.stringify(result.leaderboard),JSON.stringify(payload.leaderboard));
    assert.equal(JSON.stringify(result.currentUser),JSON.stringify(payload.currentUser));
    assert.equal(result.error,null);
  }
  const invalid=await run({status:true,data:{}});
  assert.match(invalid.action,/rejected$/);
  assert.match(invalid.error,/invalid response/);
  assert.equal(JSON.stringify(invalid.leaderboard),'[]');
  console.log('Leaderboard contract: wrapped, legacy and malformed responses passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
