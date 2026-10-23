const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=name=>ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const flush=async()=>{for(let i=0;i<10;i++) await Promise.resolve();};
class Media extends EventTarget {
  constructor(url){super();this.src=url;this.duration=url==='video'?80:100;this.currentTime=0;this.paused=true;this.ended=false;this.playbackRate=1;}
  async play(){this.paused=false;this.dispatchEvent(new Event('playing'));}
  pause(){this.paused=true;}removeAttribute(){}load(){}
}
async function playback(){
  const effects=[],refs=[],values=[],errors=[],media=[];
  const video=new Media('video'),document=new EventTarget();document.hidden=false;
  const react={useRef:value=>{const ref={current:refs.length===0?video:value};refs.push(ref);return ref;},useState:value=>{const i=values.length;values.push(value);return[value,next=>values[i]=next];},useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
  class Audio extends Media {constructor(url){super(url);media.push(this);}}
  const module={exports:{}};
  vm.runInNewContext(source('components/avatar-reading/useAvatarListeningPlayback.ts'),{module,exports:module.exports,Audio,document,require:name=>name==='react'?react:{toast:{error:value=>errors.push(value)}}});
  let listened=0;
  const hook=module.exports.useAvatarListeningPlayback('topic','narrator','video','initial',()=>listened++);
  const cleanup=effects.map(fn=>fn());const [topic,narrator]=media;
  await hook.toggle('topic');await flush();
  assert.equal(topic.paused,false);assert.equal(video.paused,false);assert.equal(video.playbackRate,.8);
  topic.currentTime=40;topic.dispatchEvent(new Event('timeupdate'));assert.equal(video.currentTime,32);
  hook.pause();assert.equal(topic.paused,true);assert.equal(video.paused,true);
  await hook.toggle('topic');await flush();assert.equal(topic.currentTime,40);
  await hook.toggle('narrator');await flush();assert.equal(topic.paused,true);assert.equal(narrator.paused,false);assert.equal(video.loop,true);assert.equal(video.playbackRate,1);
  narrator.ended=true;narrator.dispatchEvent(new Event('ended'));assert.equal(listened,0);assert.equal(video.paused,true);
  await hook.toggle('topic');await flush();topic.ended=true;topic.dispatchEvent(new Event('ended'));assert.equal(listened,1);assert.equal(video.paused,true);
  topic.ended=false;await hook.toggle('topic');await flush();document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(topic.paused,true);assert.equal(video.paused,true);
  hook.restart();assert.equal(topic.currentTime,0);assert.equal(narrator.currentTime,0);assert.equal(video.currentTime,0);
  // A buffering pause can reject an in-flight play request. canplay must
  // recover it without clearing the user's playback request or showing errors.
  const play=topic.play.bind(topic);let bufferOnce=true;
  topic.play=()=>{if(bufferOnce){bufferOnce=false;const error=new Error('buffering');error.name='AbortError';return Promise.reject(error);}return play();};
  await hook.toggle('topic');video.dispatchEvent(new Event('canplay'));await flush();
  assert.equal(topic.paused,false);assert.equal(video.paused,false);assert.equal(errors.length,0);
  hook.pause();
  document.hidden=false;await hook.toggle('topic');await flush();video.dispatchEvent(new Event('error'));assert.equal(topic.paused,true);assert.equal(video.paused,true);assert.equal(errors.length,1);
  cleanup.forEach(fn=>fn?.());assert.equal(video.paused,true);
}
async function transport(){
  const calls=[],client={get:async()=>({data:{available:true}}),post:async(...args)=>{calls.push(args);return{data:{events:[]}};}};
  const module={exports:{}};
  vm.runInNewContext(source('services/avatarReadingService.ts'),{module,exports:module.exports,AbortController,localStorage:{getItem:()=> 'test-account'},require:name=>name.includes('ApiConfig')?{default:client}:{uploadReadingAudio:()=>{throw Error('Unexpected upload');}}});
  const options=module.exports.createAvatarReadingTransport('user','listening');assert.equal(options.storagePrefix,'3d-avatar:user:listening:');
  const socket=options.connect();await flush();socket.emit('start_listening',{modeSessionId:'id'});await flush();
  assert.equal(calls[0][0],'/3d-avatar/listening/actions');assert.equal(calls[0][1].action,'start_listening');socket.disconnect();
}
(async()=>{await playback();await transport();console.log('3D Listening: audio/video synchronization, track switching, pause/resume, completion, hidden-page cleanup, media errors and isolated transport passed.');})().catch(e=>{console.error(e);process.exitCode=1;});
