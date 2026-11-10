const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=name=>ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
class Video extends EventTarget{constructor(){super();this.paused=true;this.currentTime=0;}async play(){this.paused=false;}pause(){this.paused=true;}}
async function animation(){
  const refs=[],effects=[],video=new Video(),document=new EventTarget();document.hidden=false;let cursor=0,effectIndex=0,stops=0,errors=0;
  const react={useRef:value=>{const i=cursor++;return refs[i]??(refs[i]={current:i===0?video:value});},useEffect:(fn,deps)=>{const i=effectIndex++,old=effects[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))effects[i]={fn,deps,cleanup:old?.cleanup,changed:true};}};
  const module={exports:{}};
  vm.runInNewContext(source('components/avatar-reading/useAvatarSpeakingVideo.ts'),{exports:module.exports,module,document,require:name=>name==='react'?react:{toast:{error:()=>errors++}}});
  const render=(speaking,url='video')=>{cursor=0;effectIndex=0;module.exports.useAvatarSpeakingVideo(url,speaking,()=>stops++);for(const e of effects)if(e.changed){e.cleanup?.();e.cleanup=e.fn();e.changed=false;}};
  render(false);assert.equal(video.paused,true);
  render(true);await flush();assert.equal(video.paused,false);assert.equal(video.muted,true);assert.equal(video.loop,true);assert.equal(video.playbackRate,1);
  video.currentTime=12;render(false);assert.equal(video.paused,true);render(true);await flush();assert.equal(video.currentTime,12);
  document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(video.paused,true);assert.equal(stops,1);
  document.hidden=false;render(false);render(true);await flush();video.dispatchEvent(new Event('error'));assert.equal(video.paused,true);assert.equal(stops,2);assert.equal(errors,1);
  effects.forEach(e=>e.cleanup?.());assert.equal(video.paused,true);
}
async function transport(){
  let account='first';const calls=[],delivered=[];
  const client={get:async()=>({data:{available:true}}),post:async(...args)=>{calls.push(args);return{data:{events:[{event:'streaming_complete',payload:{ai_response:'Hello'}}]}};}};
  const module={exports:{}};
  vm.runInNewContext(source('services/avatarReadingService.ts'),{module,exports:module.exports,AbortController,FormData,Blob,Uint8Array,atob,localStorage:{getItem:()=>account},require:name=>name.includes('ApiConfig')?{default:client}:{uploadReadingAudio:()=>{throw Error('Unexpected Reading upload');}}});
  const options=module.exports.createAvatarReadingTransport('user','roleplay');assert.equal(options.storagePrefix,'3d-avatar:user:roleplay:');
  const socket=options.connect();socket.on('streaming_complete',v=>delivered.push(v));await flush();
  socket.emit('text',{modeSessionId:'session',textMessage:'Hello'});await flush();assert.equal(calls[0][0],'/3d-avatar/roleplay/actions');assert.equal(delivered.length,1);
  socket.emit('audio',{modeSessionId:'session',audioBuffer:Buffer.from('recording').toString('base64'),format:'wav',clientAttemptId:'attempt'});await flush();
  assert.equal(calls[1][0],'/3d-avatar/roleplay/session/audio');assert.ok(calls[1][1] instanceof FormData);assert.equal(calls[1][1].get('clientAttemptId'),'attempt');assert.equal(calls[1][1].get('audio').size,9);
  account='another';socket.emit('text',{modeSessionId:'session',textMessage:'Stale'});await flush();assert.equal(calls.length,2);socket.disconnect();
}
(async()=>{await animation();await transport();console.log('3D Roleplay: muted speaking animation, pause/resume, visibility/error cleanup, text events, binary recording upload and account isolation passed.');})().catch(e=>{console.error(e);process.exitCode=1;});
