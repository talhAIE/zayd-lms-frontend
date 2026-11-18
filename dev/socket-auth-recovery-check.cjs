// Offline transport checks with real Axios interception. No learner/AI calls.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), { EventEmitter } = require('node:events');
const ts = require('typescript'), axios = require('axios');
const originalAdapter = axios.defaults.adapter;
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b}); return {promise,resolve,reject}; };
const tick = () => new Promise(r => setTimeout(r, 1));
async function until(check) { for(let i=0;i<200;i++){if(check())return;await tick()}throw Error('Recovery did not settle'); }
const ok = (config,data={}) => ({config,data,status:200,statusText:'OK',headers:{}});
const unauthorized = config => Promise.reject(new axios.AxiosError('Unauthorized','ERR_BAD_REQUEST',config,undefined,{...ok(config),status:401}));
function setup(adapter) {
  const values = new Map(), localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const window={location:{href:''}}; let clears=0;
  axios.defaults.adapter=adapter;
  function load(file,api) {
    const source=fs.readFileSync(path.resolve(__dirname,'../src',file),'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL','"http://offline.test"');
    const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
    const module={exports:{}};
    vm.runInNewContext(js,{module,exports:module.exports,localStorage,window,setTimeout,console,require:key=>{
      if(key==='axios')return axios;
      if(key==='@/config/ApiConfig')return api;
      if(key==='@/utils/tokenUtils')return {clearAuthData:()=>{clears++;values.clear()}};
      throw Error('Unexpected import '+key);
    }});return module.exports;
  }
  const api=load('config/ApiConfig.tsx'), recovery=load('utils/socketAuthRecovery.ts',api);
  function signIn(id='a',access='old-access',refresh='old-refresh') {
    values.set('AiTutorUser',JSON.stringify({id,username:id,role:'student',region:'ROW'}));
    values.set('accessToken',access);values.set('refreshToken',refresh);
  }
  signIn();
  class FakeSocket extends EventEmitter {
    auth={token:'old-access',userId:'a'}; connects=0; disconnects=0; credentials=[];
    connect(){this.connects++;this.handshake();this.emit('connect');return this}
    disconnect(){this.disconnects++;this.emit('disconnect','io client disconnect');return this}
    handshake(){typeof this.auth==='function'?this.auth(data=>this.credentials.push(data)):this.credentials.push(this.auth)}
  }
  const socket=new FakeSocket(), dispose=recovery.attachSocketAuthRecovery(socket);socket.handshake();
  return {api,socket,dispose,recovery,values,window,signIn,clears:()=>clears};
}
async function main(){
  let passed=0;
  async function test(name,run){await run();console.log('PASS '+name);passed++}
  await test('HTTP 401 and server-disconnected socket share one refresh, reconnect with fresh token',async()=>{
    const pending=deferred();let refreshCalls=0,config;
    const f=setup(c=>{if(c.url.endsWith('/auth/refresh')){refreshCalls++;config=c;return pending.promise}return c.headers.Authorization==='Bearer old-access'?unauthorized(c):Promise.resolve(ok(c))});
    let starts=0;f.socket.on('connect',()=>{starts++});
    const http=f.api.default.get('/learning/courses');
    f.socket.emit('error',{message:'Authentication failed'});f.socket.emit('disconnect','io server disconnect');
    await until(()=>!!config);pending.resolve(ok(config,{accessToken:'fresh',refreshToken:'rotated'}));
    await http;await until(()=>f.socket.connects===1);
    assert.equal(refreshCalls,1);assert.equal(f.socket.credentials.at(-1).token,'fresh');assert.equal(starts,1);assert.equal(f.clears(),0);f.dispose();
  });
  await test('ordinary reconnect reads the latest HTTP token and preserves legacy auth fields',async()=>{
    let calls=0;const f=setup(c=>{calls++;return Promise.resolve(ok(c))});
    f.values.set('accessToken','already-refreshed');f.socket.connect();
    assert.equal(f.socket.credentials.at(-1).token,'already-refreshed');assert.equal(f.socket.credentials.at(-1).userId,'a');assert.equal(calls,0);f.dispose();
  });
  await test('duplicate authentication events join recovery without triggering legacy logout',async()=>{
    const pending=deferred();let config,calls=0;const f=setup(c=>{config=c;calls++;return pending.promise});
    let logouts=0;f.socket.on('auth_error',()=>{if(!f.recovery.isSocketAuthRecovering(f.socket))logouts++});
    f.socket.emit('error',{message:'Authentication failed'});f.socket.emit('auth_error',{message:'Invalid or expired token'});
    assert.equal(logouts,0);assert.equal(calls,1);pending.resolve(ok(config,{accessToken:'fresh',refreshToken:'rotated'}));
    await until(()=>f.socket.connects===1);assert.equal(f.clears(),0);f.dispose();
  });
  await test('unmount during refresh prevents reconnect',async()=>{
    const pending=deferred();let config;const f=setup(c=>{config=c;return pending.promise});
    f.socket.emit('error',{message:'Authentication failed'});f.dispose();pending.resolve(ok(config,{accessToken:'fresh',refreshToken:'rotated'}));
    await tick();await tick();assert.equal(f.socket.connects,0);
  });
  await test('account replacement cannot inherit an old socket or late refresh',async()=>{
    const pending=deferred();let config;const f=setup(c=>{config=c;return pending.promise});
    f.socket.emit('error',{message:'Authentication failed'});f.signIn('b','b-access','b-refresh');pending.resolve(ok(config,{accessToken:'a-new',refreshToken:'a-refresh'}));
    await tick();await tick();assert.equal(f.socket.connects,0);assert.equal(f.values.get('accessToken'),'b-access');assert.equal(f.clears(),0);f.socket.handshake();assert.equal(f.socket.credentials.length,1);f.dispose();
  });
  await test('late HTTP 401 cannot replay an old account action as a new account',async()=>{
    const pending=deferred();let config,calls=0;const f=setup(c=>{calls++;config=c;return pending.promise});
    const request=f.api.default.post('/learning/action',{ownedAttempt:'a'});
    const rejected=assert.rejects(request,axios.isCancel);
    await until(()=>!!config);f.signIn('b','b-access','b-refresh');
    pending.reject(new axios.AxiosError('Unauthorized','ERR_BAD_REQUEST',config,undefined,{...ok(config),status:401}));
    await rejected;assert.equal(calls,1);assert.equal(f.clears(),0);f.dispose();
  });
  await test('rejected refreshed token cannot cause an authentication loop',async()=>{
    let calls=0;const f=setup(c=>{calls++;return Promise.resolve(ok(c,{accessToken:'fresh',refreshToken:'rotated'}))});
    f.socket.emit('error',{message:'Authentication failed'});await until(()=>f.socket.connects===1);f.socket.emit('error',{message:'Authentication failed'});await tick();
    assert.equal(calls,1);assert.equal(f.recovery.isSocketAuthRecovering(f.socket),false);f.dispose();
  });
  await test('blocked, duplicate and network failures do not trigger token recovery',async()=>{
    let calls=0;const f=setup(c=>{calls++;return Promise.resolve(ok(c))});
    for(const message of ['User not found or inactive','Account blocked','Already connected from another session','transport error'])f.socket.emit('error',{message});
    await tick();assert.equal(calls,0);assert.equal(f.socket.connects,0);f.dispose();
  });
  await test('accepted session allows a later expiry to recover again',async()=>{
    let calls=0;const f=setup(c=>Promise.resolve(ok(c,{accessToken:'fresh-'+ ++calls,refreshToken:'rotated-'+calls})));
    f.socket.emit('connect_error',{message:'Unauthorized'});await until(()=>f.socket.connects===1);
    f.socket.emit('mode_session_started',{modeSessionId:'same-session'});f.socket.emit('error',{message:'Authentication failed'});await until(()=>f.socket.connects===2);
    assert.equal(calls,2);f.dispose();
  });
  await test('failed refresh keeps existing sign-in fallback and never reconnects',async()=>{
    const f=setup(c=>unauthorized(c));f.socket.emit('auth_error',{message:'Authentication failed'});
    await until(()=>f.clears()===1);assert.equal(f.socket.connects,0);assert.equal(f.window.location.href,'/login');f.dispose();
  });
  if(process.argv.includes('--loopback')) await test('real Socket.IO server disconnect restores the same lesson after refresh',async()=>{
    const http=require('node:http').createServer();
    const {Server}=require('../../step-backend/node_modules/socket.io');
    const {io}=require('socket.io-client');
    const server=new Server(http);let refreshes=0,received;
    const f=setup(c=>{refreshes++;return Promise.resolve(ok(c,{accessToken:'fresh',refreshToken:'rotated'}))});
    f.dispose();
    server.on('connection',socket=>{
      if(socket.handshake.auth.token!=='fresh'){socket.emit('error',{message:'Authentication failed'});socket.disconnect();return}
      socket.on('start_mode_session',body=>socket.emit('mode_session_started',{modeSessionId:'existing-session',lessonModeId:body.lessonModeId}));
    });
    await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
    const socket=io(`http://127.0.0.1:${http.address().port}`,{autoConnect:false,reconnection:false});
    const dispose=f.recovery.attachSocketAuthRecovery(socket);
    socket.on('connect',()=>socket.emit('start_mode_session',{lessonModeId:'owned-lesson'}));
    socket.on('mode_session_started',data=>{received=data});
    try{
      socket.connect();
      for(let i=0;i<2000&&!received;i++)await tick();
      assert.equal(received?.modeSessionId,'existing-session');assert.equal(received.lessonModeId,'owned-lesson');assert.equal(refreshes,1);
    }finally{dispose();socket.disconnect();await new Promise(resolve=>server.close(resolve))}
  });
  console.log(`${passed} socket authentication recovery checks passed`);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{axios.defaults.adapter=originalAdapter});
