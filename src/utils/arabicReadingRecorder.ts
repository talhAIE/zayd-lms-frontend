import { ARABIC_RECORDING_LIMITS } from '../types/arabic-reading.contract';
import type { ArabicAudioRequest } from '../types/arabic-reading.contract';
import type { ArabicRecorderView } from '../components/arabic-reading/presentation';

/** The English hook owns English toasts/base64 and cannot safely localize this mode.
 * This isolated device adapter captures a bounded Blob, releases late streams and
 * never uploads, persists, scores or emits normal engagement events.
 */
export class ArabicBrowserRecorder {
  private generation=0;private stream:MediaStream|null=null;private recorder:MediaRecorder|null=null;
  private timer:ReturnType<typeof setInterval>|null=null;private startup:ReturnType<typeof setTimeout>|null=null;
  constructor(private readonly current:()=>boolean,private readonly change:(v:ArabicRecorderView)=>void,
    private readonly ready:(blob:Blob,format:ArabicAudioRequest['format'],seconds:number)=>void,private readonly failure:(code:'AR_NO_SPEECH'|'AR_RECORDING_TOO_LARGE')=>void=()=>{}){}
  private release(){
    if(this.timer)clearInterval(this.timer);this.timer=null;
    if(this.startup)clearTimeout(this.startup);this.startup=null;
    const recorder=this.recorder;this.recorder=null;
    if(recorder){recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;if(recorder.state!=='inactive')try{recorder.stop();}catch{/* Browser already closed. */}}
    this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
  }
  cancel(){this.generation++;this.release();if(this.current())this.change({state:'idle',seconds:0});}
  async start(){
    if(this.recorder||this.startup||!this.current())return;
    const epoch=++this.generation,valid=()=>this.current()&&epoch===this.generation;
    this.change({state:'starting',seconds:0});
    const fail=(denied=false)=>{if(!valid())return;this.generation++;this.release();this.change({state:denied?'denied':'unavailable',seconds:0});};
    this.startup=setTimeout(()=>fail(),20000);
    try{
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error();
      const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(!valid()){stream.getTracks().forEach(track=>track.stop());return;}
      this.stream=stream;
      const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported(t));
      if(!mime)throw new Error();
      const recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:64000});this.recorder=recorder;
      const chunks:Blob[]=[];let size=0;const start=performance.now();
      recorder.ondataavailable=e=>{
        if(!valid()||!e.data?.size)return;size+=e.data.size;
        if(size>ARABIC_RECORDING_LIMITS.maxBytes){this.cancel();this.failure('AR_RECORDING_TOO_LARGE');return;}chunks.push(e.data);
      };
      recorder.onerror=()=>fail();
      recorder.onstop=()=>{
        if(!valid())return;const blob=new Blob(chunks,{type:recorder.mimeType||mime});
        const format=(mime.split('/')[1].split(';')[0]) as ArabicAudioRequest['format'];
        this.release();
        if(!blob.size){this.change({state:'idle',seconds:0});this.failure('AR_NO_SPEECH');return;}
        const seconds=Math.min(ARABIC_RECORDING_LIMITS.maxAssessmentSeconds,Math.floor((performance.now()-start)/1000));
        this.change({state:'uploading',seconds});this.ready(blob,format,seconds);
      };
      if(this.startup)clearTimeout(this.startup);this.startup=null;
      recorder.start(250);this.change({state:'recording',seconds:0});
      this.timer=setInterval(()=>{
        if(!valid()){this.cancel();return;}
        const seconds=(performance.now()-start)/1000;this.change({state:'recording',seconds:Math.floor(seconds)});
        if(seconds>=ARABIC_RECORDING_LIMITS.maxAssessmentSeconds)this.stop();
      },100);
    }catch(error){fail((error as {name?:string})?.name==='NotAllowedError'||(error as {name?:string})?.name==='PermissionDeniedError');}
  }
  stop(){
    if(!this.current()){this.cancel();return;}
    if(this.timer)clearInterval(this.timer);this.timer=null;
    const recorder=this.recorder;if(recorder?.state==='recording')try{recorder.stop();}catch{this.cancel();this.failure('AR_NO_SPEECH');}
  }
  dispose(){this.generation++;this.release();}
}
