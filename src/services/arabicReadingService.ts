import apiClient from '../config/ApiConfig';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { ARABIC_READING_API, ARABIC_RECORDING_LIMITS } from '../types/arabic-reading.contract';
import type { ArabicActivityId, ArabicAudioRecovery, ArabicAudioRecoveryRequest, ArabicAudioRequest, ArabicDiscovery, ArabicActivityOverview,
  ArabicErrorCode, ArabicHistory, ArabicMediaRequest, ArabicSessionView } from '../types/arabic-reading.contract';
import { ARABIC_ERROR_TEXT } from '../components/arabic-reading/presentation';

export type ArabicClientCode = ArabicErrorCode | 'AR_LOCAL_STORAGE' | 'AR_SESSION_CHANGED' | 'AR_PENDING_RECORDING' | 'AR_OFFLINE';
export const ARABIC_CLIENT_TEXT = {...ARABIC_ERROR_TEXT,
  AR_LOCAL_STORAGE:'تعذر حفظ التسجيل على هذا الجهاز. لن يُرسل قبل حفظه. تحقق من مساحة التخزين ثم حاول مجدداً.',
  AR_SESSION_CHANGED:'تغيّرت الجلسة. لا يمكن إرسال التسجيل إلى جملة أو محاولة مختلفة. يمكنك حذف التسجيل المحفوظ.',
  AR_PENDING_RECORDING:'يوجد تسجيل محفوظ لهذا النص. أعد تحميل المحفوظ قبل إنشاء تسجيل آخر.',
  AR_OFFLINE:'انقطع الاتصال. احتفظ بتسجيلك وأعد المحاولة عند عودة الشبكة.',
} as const;
export class ArabicClientError extends Error {
  constructor(readonly code: ArabicClientCode) { super(ARABIC_CLIENT_TEXT[code]); }
}
export const arabicClientError = (e: unknown) => e instanceof ArabicClientError ? e : new ArabicClientError('AR_UNAVAILABLE');
const id=z.string().min(1).max(96),uuid=z.string().uuid(),text=z.string().min(1).max(20000),count=z.number().int().nonnegative().max(2147483646);
const activityId=z.enum(['ar-reading-01','ar-reading-02','ar-reading-03']);
const profile=z.object({language:z.literal('ar'),direction:z.literal('rtl'),speechLocale:z.literal('ar-SA'),
  voice:z.enum(['ar-SA-HamedNeural','ar-SA-ZariyahNeural']),speakingStyle:z.null(),prosodySupported:z.literal(false)});
const metric=z.number().finite().min(0).max(100).nullable();
const assessment=z.discriminatedUnion('available',[
  z.object({available:z.literal(false),accuracy:z.null(),fluency:z.null(),completeness:z.null(),pronunciation:z.null()}),
  z.object({available:z.literal(true),accuracy:metric,fluency:metric,completeness:metric,pronunciation:metric}),
]);
const feedback=z.object({chunkId:id,status:z.enum(['correct','retry','incorrect']),text:text.max(2000),assessment,
  vocabulary:z.object({words:z.array(text.max(128)).max(35),attemptCount:z.union([z.literal(1),z.literal(2)]),action:z.enum(['glow','open'])}).nullable()});
const message=z.object({id,sequence:count,sender:z.enum(['learner','coach']),text,createdAt:z.string().datetime(),clientAttemptId:id.nullable(),feedback:feedback.nullable()});
const summary=z.object({id:activityId,title:text.max(256),questionCount:count.max(25),state:z.enum(['not_started','listen','reading','quiz','completed']),sessionId:uuid.nullable(),available:z.boolean()});
const base={id:uuid,activityId,title:text.max(256),versionId:uuid,runNumber:count,revision:count,profile,
  passage:z.array(z.object({id,kind:z.enum(['heading','paragraph','list-item']),text,marker:text.max(16).optional()})).min(1).max(100),
  hasListened:z.boolean(),startedAt:z.string().datetime(),lastSavedAt:z.string().datetime(),messages:z.array(message).max(50)};
const sessionSchema=z.discriminatedUnion('phase',[
  z.object({...base,phase:z.literal('listen'),currentChunk:z.null(),feedback:z.null()}),
  z.object({...base,phase:z.literal('reading'),currentChunk:z.object({id,text}),feedback:feedback.nullable(),attemptedCount:count,acceptedCount:count,failedCount:count,totalChunks:count}),
  z.object({...base,phase:z.literal('quiz'),questions:z.array(z.object({id,number:count,prompt:text,options:z.array(z.object({id,label:z.enum(['أ','ب','ج','د']),text})).length(4)})).min(1).max(25),
    checkedAnswers:z.array(z.object({questionId:id,selectedOptionId:id,isCorrect:z.boolean(),responseId:id})).max(25)}),
  z.object({...base,phase:z.literal('completed'),completedAt:z.string().datetime(),result:z.object({correctCount:count,totalQuestions:count})}),
]);
export const parseArabicSession=(value:unknown):ArabicSessionView=>sessionSchema.parse(value);
const prefix=ARABIC_READING_API.slice('/api/v1'.length);
/** Reuses the existing owner-guarded HTTP refresh queue, never the English mode transport. */
export class ArabicReadingApi {
  constructor(private readonly current:()=>boolean, private readonly client:Pick<AxiosInstance,'request'>=apiClient) {}
  private async request(method:'GET'|'POST',path:string,data:unknown,signal:AbortSignal,binary=false) {
    if(!this.current())throw new ArabicClientError('AR_UNAUTHORIZED');
    try {
      const config:AxiosRequestConfig & {scienceSession:()=>boolean}={method,url:prefix+path,data,signal,timeout:binary?60000:data instanceof FormData?180000:30000,
        responseType:binary?'blob':'json',headers:data instanceof FormData?{'Content-Type':undefined}:undefined,scienceSession:this.current};
      const response=await this.client.request(config);
      if(!this.current())throw new ArabicClientError('AR_UNAUTHORIZED');
      if(binary){
        if(!(response.data instanceof Blob)||response.data.size===0||response.data.size>ARABIC_RECORDING_LIMITS.maxBytes||!/^audio\/mpeg(?:;|$)/i.test(String(response.headers['content-type']??'')))
          throw new ArabicClientError('AR_MEDIA_UNAVAILABLE');
        return response.data;
      }
      if(response.data?.status!==true)throw new ArabicClientError(this.code(response.data));
      return response.data.data as unknown;
    } catch(error:unknown) {
      if(error instanceof ArabicClientError)throw error;
      const e=error as {response?:{data?:unknown;status?:number}};let body=e.response?.data;
      if(body instanceof Blob && body.size<16384){try{body=JSON.parse(await body.text());}catch{/* Localized fallback only. */}}
      if(!this.current()||e.response?.status===401)throw new ArabicClientError('AR_UNAUTHORIZED');
      if(e.response)throw new ArabicClientError(this.code(body));
      throw new ArabicClientError('AR_OFFLINE');
    }
  }
  private code(body:unknown):ArabicErrorCode {
    const code=(body as {error?:{code?:unknown}})?.error?.code;
    return typeof code==='string'&&Object.prototype.hasOwnProperty.call(ARABIC_ERROR_TEXT,code)?code as ArabicErrorCode:'AR_UNAVAILABLE';
  }
  async discovery(signal:AbortSignal):Promise<ArabicDiscovery>{return z.object({profile,activities:z.array(summary).length(3)}).parse(await this.request('GET','/activities',undefined,signal));}
  async overview(id:ArabicActivityId,signal:AbortSignal):Promise<ArabicActivityOverview>{return z.object({activity:summary,instructions:z.array(text).max(20),profile}).parse(await this.request('GET',`/activities/${id}`,undefined,signal));}
  async start(id:ArabicActivityId,requestId:string,signal:AbortSignal){return parseArabicSession(await this.request('POST',`/activities/${id}/sessions`,{requestId},signal));}
  async session(id:string,signal:AbortSignal){return parseArabicSession(await this.request('GET',`/sessions/${encodeURIComponent(id)}`,undefined,signal));}
  async listen(id:string,requestId:string,expectedRevision:number,signal:AbortSignal){return parseArabicSession(await this.request('POST',`/sessions/${id}/listen`,{requestId,expectedRevision,playbackEnded:true},signal));}
  async upload(id:string,r:ArabicAudioRequest,blob:Blob,signal:AbortSignal){
    if(blob.size>ARABIC_RECORDING_LIMITS.maxBytes)throw new ArabicClientError('AR_RECORDING_TOO_LARGE');
    const form=new FormData();form.append('audio',blob,`reading.${r.format}`);
    form.append('requestId',r.requestId);form.append('expectedRevision',String(r.expectedRevision));form.append('chunkId',r.chunkId);form.append('format',r.format);
    return parseArabicSession(await this.request('POST',`/sessions/${id}/audio`,form,signal));
  }
  async recover(id:string,r:ArabicAudioRecoveryRequest,signal:AbortSignal,discard=false):Promise<ArabicAudioRecovery>{
    return z.object({disposition:z.enum(['unconfirmed','committed','discarded']),session:sessionSchema}).parse(await this.request('POST',`/sessions/${id}/audio/${discard?'discard':'status'}`,r,signal));
  }
  async media(id:string,target:ArabicMediaRequest,signal:AbortSignal):Promise<Blob>{return await this.request('POST',`/sessions/${id}/media`,target,signal,true) as Blob;}
  async history(id:string,after:number,signal:AbortSignal):Promise<ArabicHistory>{return z.object({messages:z.array(message).max(50),nextSequence:count.nullable()}).parse(await this.request('GET',`/sessions/${id}/messages?afterSequence=${after}&limit=50`,undefined,signal));}
}
