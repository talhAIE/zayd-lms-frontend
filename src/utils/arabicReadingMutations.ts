import { z } from 'zod';
import { ArabicClientError } from '../services/arabicReadingService';
import type { ArabicActivityId, ArabicCheckRequest, ArabicFinishRequest, ArabicRetakeRequest } from '../types/arabic-reading.contract';
export type ArabicQuizMutation={key:string;ownerKey:string;activityId:ArabicActivityId;sessionId:string;versionId:string;createdAt:string}&(
  {operation:'check';request:ArabicCheckRequest}|{operation:'finish';request:ArabicFinishRequest}|{operation:'retake';request:ArabicRetakeRequest});
const id=z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/),revision=z.number().int().min(0).max(2147483646);
const request={requestId:z.string().uuid(),expectedRevision:revision};
const base={key:z.string(),ownerKey:z.string(),activityId:z.enum(['ar-reading-01','ar-reading-02','ar-reading-03']),sessionId:z.string().uuid(),versionId:z.string().uuid(),createdAt:z.string().datetime()};
const schema=z.discriminatedUnion('operation',[
  z.object({...base,operation:z.literal('check'),request:z.object({...request,questionId:id,optionId:id})}),
  z.object({...base,operation:z.literal('finish'),request:z.object({...request,answers:z.array(z.object({questionId:id,optionId:id,responseId:z.string().uuid()})).min(1).max(25)})}),
  z.object({...base,operation:z.literal('retake'),request:z.object(request)}),
]);
export const arabicMutationKey=(owner:string,activity:ArabicActivityId)=>JSON.stringify([owner,activity]);
/** Independent metadata-only journal; never shares or overwrites audio/normal LMS stores. */
export class ArabicMutationStore {
  private async transaction<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,set:(value:T)=>void)=>void):Promise<T>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{
      let done=false;const r=indexedDB.open('zayd-arabic-reading-mutations',1);
      const fail=()=>{if(done)return;done=true;clearTimeout(timer);reject(new ArabicClientError('AR_MUTATION_STORAGE'));};
      const timer=setTimeout(fail,10000);r.onblocked=fail;r.onerror=fail;
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('pending'))r.result.createObjectStore('pending',{keyPath:'key'});};
      r.onsuccess=()=>{if(done){r.result.close();return;}done=true;clearTimeout(timer);resolve(r.result);};
    });
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('pending',mode);let value:T,done=false;
      const finish=(error=false)=>{if(done)return;done=true;clearTimeout(timer);db.close();if(error)reject(new ArabicClientError('AR_MUTATION_STORAGE'));else resolve(value);};
      const timer=setTimeout(()=>{try{tx.abort();}catch{/* Already closed. */}finish(true);},10000);
      tx.oncomplete=()=>finish();tx.onabort=()=>finish(true);tx.onerror=()=>finish(true);
      try{run(tx.objectStore('pending'),v=>{value=v;});}catch{try{tx.abort();}catch{/* Already closed. */}finish(true);}
    });
  }
  async load(ownerKey:string,activityId:ArabicActivityId):Promise<ArabicQuizMutation|null>{
    const raw=await this.transaction<unknown>('readonly',(store,set)=>{const r=store.get(arabicMutationKey(ownerKey,activityId));r.onsuccess=()=>set(r.result??null);});
    if(raw===null)return null;const parsed=schema.safeParse(raw);
    if(!parsed.success||parsed.data.ownerKey!==ownerKey||parsed.data.activityId!==activityId||parsed.data.key!==arabicMutationKey(ownerKey,activityId))throw new ArabicClientError('AR_MUTATION_STORAGE');
    return parsed.data;
  }
  save(value:ArabicQuizMutation){return this.transaction<void>('readwrite',(store,set)=>{store.add(value).onsuccess=()=>set(undefined);});}
  remove(value:ArabicQuizMutation){return this.transaction<void>('readwrite',(store,set)=>{const r=store.get(value.key);r.onsuccess=()=>{
    if(r.result?.ownerKey!==value.ownerKey||r.result?.request?.requestId!==value.request.requestId){set(undefined);return;}
    store.delete(value.key).onsuccess=()=>set(undefined);
  };});}
}
