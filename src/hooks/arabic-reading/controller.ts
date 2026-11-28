import type { ArabicActivityId, ArabicAudioRecovery, ArabicAudioRecoveryRequest, ArabicErrorCode, ArabicMediaRequest, ArabicSessionView } from '../../types/arabic-reading.contract';
import type { ArabicPlayback, ArabicRecorderView, ArabicReadingScreen } from '../../components/arabic-reading/presentation';
import { ArabicReadingApi, ArabicClientError, arabicClientError, type ArabicClientCode } from '../../services/arabicReadingService';
import { ArabicIndexedPending, arabicBlobDigest, arabicPendingKey, type ArabicPending, type ArabicPendingStore } from '../../utils/arabicReadingPending';
import { ArabicBrowserRecorder } from '../../utils/arabicReadingRecorder';
import type { ArabicOwner } from '../../utils/arabicReadingIdentity';

export interface ArabicLiveState {screen:ArabicReadingScreen;playback:ArabicPlayback;recorder:ArabicRecorderView;busy:boolean;notice:ArabicClientCode|null}
export const arabicInitialState=():ArabicLiveState=>({screen:{kind:'loading'},playback:{target:null,state:'idle',position:0,duration:0,passageEnded:false},recorder:{state:'idle',seconds:0},busy:false,notice:null});
export type ArabicApiPort=Pick<ArabicReadingApi,'discovery'|'overview'|'start'|'session'|'listen'|'upload'|'recover'|'media'|'history'>;
export class ArabicReadingController {
  state=arabicInitialState();private listeners=new Set<()=>void>();private disposed=false;private requests=new Set<AbortController>();
  private pending:ArabicPending|null=null;private session:ArabicSessionView|null=null;private listenRequest:{requestId:string;expectedRevision:number}|null=null;
  private media:HTMLAudioElement|null=null;private mediaUrl:string|null=null;private mediaEpoch=0;
  private device:ArabicBrowserRecorder;private recordTarget:ArabicSessionView|null=null;private watching:ReturnType<typeof setInterval>|null=null;
  readonly api:ArabicApiPort;
  constructor(readonly owner:ArabicOwner,readonly activityId:ArabicActivityId|undefined,private readonly ownerCurrent:()=>boolean,
    private readonly navigate:(url:string)=>void,private readonly store:ArabicPendingStore=new ArabicIndexedPending(),
    api?:(current:()=>boolean)=>ArabicApiPort,private readonly audioFactory:()=>HTMLAudioElement=()=>new Audio()){
    this.api=api?.(()=>this.current())??new ArabicReadingApi(()=>this.current());
    this.device=new ArabicBrowserRecorder(()=>this.current(),recorder=>this.patch({recorder}),
      (blob,format,seconds)=>{void this.capture(blob,format,seconds);},notice=>this.patch({notice}));
  }
  current=()=>!this.disposed&&this.ownerCurrent();
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>this.listeners.delete(listener);};
  private patch(change:Partial<ArabicLiveState>){if(!this.current())return;this.state={...this.state,...change};this.listeners.forEach(fn=>fn());}
  private async request<T>(work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
    if(!this.current())throw new ArabicClientError('AR_UNAUTHORIZED');const abort=new AbortController();this.requests.add(abort);
    try{const result=await work(abort.signal);if(!this.current())throw new ArabicClientError('AR_UNAUTHORIZED');return result;}finally{this.requests.delete(abort);}
  }
  private fatal(code:ArabicClientCode):code is ArabicErrorCode{return ['AR_DISABLED','AR_UNAUTHORIZED','AR_NOT_FOUND','AR_UNAVAILABLE'].includes(code);}
  private error(error:unknown){
    if(!this.current())return;const {code}=arabicClientError(error);
    if(this.fatal(code)){this.device.cancel();this.stopAudio();this.session=null;this.patch({screen:{kind:'error',code},notice:null});}
    else this.patch({notice:code,recorder:this.pending?{state:'saved',seconds:0}:this.state.recorder});
  }
  private async job(work:()=>Promise<void>){
    if(!this.current()||this.state.busy)return;this.patch({busy:true,notice:null});
    try{await work();}catch(error){this.error(error);}finally{this.patch({busy:false});}
  }
  private adopt(row:ArabicSessionView){
    if(this.activityId&&row.activityId!==this.activityId)throw new ArabicClientError('AR_SESSION_CHANGED');
    if(this.session?.id===row.id&&this.session.versionId!==row.versionId)throw new ArabicClientError('AR_SESSION_CHANGED');
    if(this.session?.id===row.id&&this.session.revision>row.revision)return;
    const runChanged=this.session?.id!==row.id;
    const changed=runChanged||this.session?.versionId!==row.versionId||
      (this.session?.phase==='reading'?this.session.currentChunk.id:null)!==(row.phase==='reading'?row.currentChunk.id:null);
    if(changed){this.stopAudio();if(this.recordTarget)this.device.cancel();this.recordTarget=null;}
    if(runChanged)this.listenRequest=null;
    this.session=row;this.patch({screen:{kind:'session',session:row},playback:{...this.state.playback,passageEnded:row.hasListened||(!runChanged&&this.state.playback.passageEnded)}});
  }
  private async recoverLocal(){
    if(!this.activityId)return;this.pending=await this.store.load(this.owner.key,this.activityId);
    if(this.pending){this.patch({recorder:{state:'reconciling',seconds:0}});await this.reconcile(false,false);}
    else this.patch({recorder:{state:'idle',seconds:0}});
  }
  activate(){
    this.watching=setInterval(()=>{if(!this.current()&&!this.disposed){this.stopAudio();this.device.dispose();this.requests.forEach(r=>r.abort());
      this.state={...arabicInitialState(),screen:{kind:'error',code:'AR_UNAUTHORIZED'}};this.listeners.forEach(fn=>fn());}},500);
    window.addEventListener('online',this.refresh);window.addEventListener('focus',this.refresh);
    window.addEventListener('offline',this.offline);document.addEventListener('visibilitychange',this.visibility);
    void this.load();
  }
  private offline=()=>{this.media?.pause();this.patch({notice:'AR_OFFLINE',playback:{...this.state.playback,state:this.media?'paused':'idle'}});};
  private visibility=()=>{if(document.visibilityState==='hidden'){this.media?.pause();if(this.state.recorder.state==='recording')this.device.stop();if(this.state.recorder.state==='starting')this.device.cancel();}};
  load=()=>this.job(async()=>{
    if(!this.activityId){const data=await this.request(s=>this.api.discovery(s));this.patch({screen:{kind:'chooser',activities:data.activities}});return;}
    const result=await this.request(s=>this.api.overview(this.activityId!,s));
    if(result.activity.id!==this.activityId)throw new ArabicClientError('AR_SESSION_CHANGED');
    if(result.activity.sessionId){this.adopt(await this.request(s=>this.api.session(result.activity.sessionId!,s)));await this.recoverLocal();}
    else this.patch({screen:{kind:'overview',overview:result}});
  });
  start=()=>this.job(async()=>{
    if(!this.activityId)return;const row=await this.request(s=>this.api.start(this.activityId!,crypto.randomUUID(),s));this.adopt(row);await this.recoverLocal();
  });
  choose=(id:ArabicActivityId)=>this.navigate(`/student/arabic-reading/${id}`);
  back=()=>this.navigate('/student/arabic-reading');
  refresh=()=>{
    if(!this.current()||this.state.busy||['starting','recording','uploading'].includes(this.state.recorder.state))return;
    if(!this.session)return void this.load();
    void this.job(async()=>{
      const active=await this.request(s=>this.api.overview(this.activityId!,s));
      if(active.activity.sessionId)this.adopt(await this.request(s=>this.api.session(active.activity.sessionId!,s)));
      if(this.pending)await this.reconcile(false,false);else await this.recoverLocal();
    });
  };
  listen=()=>this.job(async()=>{
    const row=this.session;if(!row||row.phase!=='listen'||!this.state.playback.passageEnded)return;
    this.listenRequest??={requestId:crypto.randomUUID(),expectedRevision:row.revision};
    try{await this.request(s=>this.api.listen(row.id,this.listenRequest!.requestId,this.listenRequest!.expectedRevision,s));}
    catch(error){const latest=await this.request(s=>this.api.session(row.id,s));this.adopt(latest);if(latest.phase==='listen')throw error;}
    this.adopt(await this.request(s=>this.api.session(row.id,s)));this.listenRequest=null;
  });
  private stopAudio(){
    this.mediaEpoch++;if(this.media){this.media.pause();this.media.removeAttribute('src');this.media.load();this.media=null;}
    if(this.mediaUrl)URL.revokeObjectURL(this.mediaUrl);this.mediaUrl=null;
    this.patch({playback:{target:null,state:'idle',position:0,duration:0,passageEnded:this.state.playback.passageEnded}});
  }
  play=async(target:ArabicMediaRequest)=>{
    if(!this.current()||!this.session||this.state.busy||['starting','recording','uploading'].includes(this.state.recorder.state))return;
    const row=this.session;
    const same=JSON.stringify(this.state.playback.target)===JSON.stringify(target);
    const resume=same&&this.state.playback.position<this.state.playback.duration-0.05?this.state.playback.position:0;
    if(JSON.stringify(this.state.playback.target)===JSON.stringify(target)&&this.media&&this.state.playback.state==='playing'){
      this.media.pause();this.patch({playback:{...this.state.playback,state:'paused'}});return;
    }
    this.stopAudio();const epoch=this.mediaEpoch;this.patch({playback:{...this.state.playback,target,state:'loading'}});
    try{
      const blob=await this.request(s=>this.api.media(row.id,target,s));if(epoch!==this.mediaEpoch||!this.current())return;
      const audio=this.audioFactory(),url=URL.createObjectURL(blob);this.media=audio;this.mediaUrl=url;audio.preload='metadata';
      const valid=()=>this.current()&&epoch===this.mediaEpoch&&this.session?.id===row.id;
      const update=()=>{if(!valid())return;this.patch({playback:{...this.state.playback,position:audio.currentTime,duration:Number.isFinite(audio.duration)?audio.duration:0}});};
      audio.onloadedmetadata=()=>{if(valid()&&resume>0)audio.currentTime=Math.min(resume,Number.isFinite(audio.duration)?audio.duration:resume);update();};audio.ontimeupdate=update;
      audio.onended=()=>{if(!valid())return;this.patch({playback:{...this.state.playback,state:'paused',passageEnded:this.state.playback.passageEnded||target.kind==='passage'}});};
      audio.onerror=()=>{if(valid()){this.stopAudio();this.patch({playback:{...this.state.playback,target,state:'unavailable'},notice:'AR_MEDIA_UNAVAILABLE'});}};
      audio.src=url;await audio.play();if(valid())this.patch({playback:{...this.state.playback,target,state:'playing'}});else audio.pause();
    }catch(error){if(epoch!==this.mediaEpoch||!this.current())return;this.stopAudio();const e=error instanceof ArabicClientError?error:new ArabicClientError('AR_MEDIA_UNAVAILABLE');
      if(this.fatal(e.code))this.error(e);else this.patch({playback:{...this.state.playback,target,state:'unavailable'},notice:'AR_MEDIA_UNAVAILABLE'});}
  };
  seek=(position:number)=>{if(this.media&&this.current()&&Number.isFinite(position))this.media.currentTime=Math.max(0,Math.min(position,this.media.duration||0));};
  record=()=>this.job(async()=>{
    if(!this.session||this.session.phase!=='reading')return;
    this.pending=await this.store.load(this.owner.key,this.activityId!);if(this.pending){this.patch({recorder:{state:'saved',seconds:0}});throw new ArabicClientError('AR_PENDING_RECORDING');}
    const previous=this.session,latest=await this.request(s=>this.api.session(previous.id,s));this.adopt(latest);
    if(latest.phase!=='reading'||latest.revision!==previous.revision)throw new ArabicClientError('AR_SESSION_CHANGED');
    this.stopAudio();this.recordTarget=latest;void this.device.start();
  });
  stop=()=>this.device.stop();cancel=()=>{this.recordTarget=null;this.device.cancel();};
  private async capture(blob:Blob,format:ArabicPending['format'],seconds:number){
    if(!this.current())return;const target=this.recordTarget;this.recordTarget=null;
    if(!target||target.phase!=='reading')return;
    this.patch({busy:true});
    try{
      const audioSha256=await arabicBlobDigest(blob);if(!this.current())return;
      if(this.session?.id!==target.id||this.session.versionId!==target.versionId||this.session.revision!==target.revision)throw new ArabicClientError('AR_SESSION_CHANGED');
      const pending:ArabicPending={key:arabicPendingKey(this.owner.key,target.activityId),ownerKey:this.owner.key,activityId:target.activityId,
        sessionId:target.id,versionId:target.versionId,requestId:crypto.randomUUID(),expectedRevision:target.revision,chunkId:target.currentChunk.id,format,blob,audioSha256,createdAt:new Date().toISOString()};
      await this.store.save(pending);if(!this.current())return;this.pending=pending;this.patch({recorder:{state:'ready',seconds}});
    }catch(error){this.patch({recorder:{state:'idle',seconds:0}});this.error(error);}finally{this.patch({busy:false});}
  }
  private recoveryRequest(p:ArabicPending):ArabicAudioRecoveryRequest{return {requestId:p.requestId,expectedRevision:p.expectedRevision,chunkId:p.chunkId,format:p.format,audioSha256:p.audioSha256};}
  private matches(p:ArabicPending,row:ArabicSessionView|null){return row?.id===p.sessionId&&row.versionId===p.versionId&&row.phase==='reading'&&row.currentChunk.id===p.chunkId&&row.revision===p.expectedRevision;}
  private async resolved(p:ArabicPending,result:ArabicAudioRecovery){
    if(result.session.id!==p.sessionId||result.session.versionId!==p.versionId)throw new ArabicClientError('AR_SESSION_CHANGED');
    if(this.session?.id===result.session.id)this.adopt(result.session);
    if(result.disposition==='unconfirmed')return false;
    await this.store.remove(p);if(!this.current())return true;
    this.pending=await this.store.load(this.owner.key,p.activityId);this.patch({recorder:{state:this.pending?'saved':'idle',seconds:0}});return true;
  }
  private async reconcile(send:boolean,discard:boolean){
    const p=this.pending;if(!p)return;
    if(p.ownerKey!==this.owner.key||p.activityId!==this.activityId)throw new ArabicClientError('AR_UNAUTHORIZED');
    if(!discard&&await arabicBlobDigest(p.blob)!==p.audioSha256)throw new ArabicClientError('AR_LOCAL_STORAGE');
    this.patch({recorder:{state:'reconciling',seconds:0}});
    const status=await this.request(s=>this.api.recover(p.sessionId,this.recoveryRequest(p),s));
    if(await this.resolved(p,status))return;
    if(discard){await this.resolved(p,await this.request(s=>this.api.recover(p.sessionId,this.recoveryRequest(p),s,true)));return;}
    if(!send){this.patch({recorder:{state:'saved',seconds:0},notice:this.matches(p,this.session)?null:'AR_SESSION_CHANGED'});return;}
    if(!this.matches(p,this.session))throw new ArabicClientError('AR_SESSION_CHANGED');
    this.patch({recorder:{state:'uploading',seconds:0}});
    try{await this.request(s=>this.api.upload(p.sessionId,this.recoveryRequest(p),p.blob,s));}
    catch(error){
      const e=arabicClientError(error);
      if(['AR_NO_SPEECH','AR_UNCLEAR_SPEECH','AR_RECORDING_TOO_LARGE','AR_RECORDING_TOO_LONG','AR_INVALID_REQUEST'].includes(e.code)){
        await this.resolved(p,await this.request(s=>this.api.recover(p.sessionId,this.recoveryRequest(p),s,true)));throw e;
      }
      // Even a timeout/409 is an unknown outcome until the server receipt is checked.
      const after=await this.request(s=>this.api.recover(p.sessionId,this.recoveryRequest(p),s));
      if(await this.resolved(p,after))return;throw e;
    }
    const after=await this.request(s=>this.api.recover(p.sessionId,this.recoveryRequest(p),s));
    if(!await this.resolved(p,after))throw new ArabicClientError('AR_OFFLINE');
  }
  private recoveryJob(send:boolean,discard:boolean){return this.job(async()=>{
    const work=()=>this.reconcile(send,discard);
    if(navigator.locks)await navigator.locks.request(`arabic-reading:${this.owner.key}:${this.activityId}`,{ifAvailable:true},async lock=>{if(!lock)throw new ArabicClientError('AR_RATE_LIMITED');await work();});
    else await work();
  });}
  send=()=>this.recoveryJob(true,false);discard=()=>this.recoveryJob(false,true);
  dispose(){this.disposed=true;this.device.dispose();this.stopAudio();this.requests.forEach(r=>r.abort());this.requests.clear();
    if(this.watching)clearInterval(this.watching);window.removeEventListener('online',this.refresh);window.removeEventListener('focus',this.refresh);
    window.removeEventListener('offline',this.offline);document.removeEventListener('visibilitychange',this.visibility);this.listeners.clear();}
}
