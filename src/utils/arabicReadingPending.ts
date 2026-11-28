import type { ArabicActivityId, ArabicAudioRecoveryRequest } from '../types/arabic-reading.contract';
import { ARABIC_RECORDING_LIMITS } from '../types/arabic-reading.contract';
import { ArabicClientError } from '../services/arabicReadingService';
export interface ArabicPending extends ArabicAudioRecoveryRequest {
  key:string; ownerKey:string; activityId:ArabicActivityId; sessionId:string; versionId:string; blob:Blob; createdAt:string;
}
export interface ArabicPendingStore {
  load(ownerKey:string,activityId:ArabicActivityId):Promise<ArabicPending|null>;
  save(value:ArabicPending):Promise<void>;
  remove(value:ArabicPending):Promise<void>;
}
export const arabicPendingKey=(owner:string,activity:ArabicActivityId)=>JSON.stringify([owner,activity]);
export async function arabicBlobDigest(blob:Blob){
  try{const bytes=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
    return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  }catch{throw new ArabicClientError('AR_LOCAL_STORAGE');}
}
/** Dedicated Arabic IndexedDB, one immutable pending attempt per owner+activity.
 * Resolve only on transaction completion, never dispatch on storage failure.
 */
export class ArabicIndexedPending implements ArabicPendingStore {
  private open():Promise<IDBDatabase>{
    return new Promise((resolve,reject)=>{
      let finished=false;const request=indexedDB.open('zayd-arabic-reading-recordings',1);
      const fail=()=>{if(finished)return;finished=true;clearTimeout(timer);reject(new ArabicClientError('AR_LOCAL_STORAGE'));};
      const timer=setTimeout(fail,10000);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('pending'))request.result.createObjectStore('pending',{keyPath:'key'});};
      request.onblocked=fail;request.onerror=fail;
      request.onsuccess=()=>{if(finished){request.result.close();return;}finished=true;clearTimeout(timer);resolve(request.result);};
    });
  }
  private async transact<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,set:(v:T)=>void)=>void):Promise<T>{
    const db=await this.open();return new Promise((resolve,reject)=>{
      const tx=db.transaction('pending',mode);let value:T,done=false;
      const end=(error=false)=>{if(done)return;done=true;clearTimeout(timer);db.close();if(error)reject(new ArabicClientError('AR_LOCAL_STORAGE'));else resolve(value);};
      const timer=setTimeout(()=>{try{tx.abort();}catch{/* Already complete. */}end(true);},10000);
      tx.oncomplete=()=>end();tx.onabort=()=>end(true);tx.onerror=()=>end(true);
      try{run(tx.objectStore('pending'),v=>{value=v;});}catch{try{tx.abort();}catch{/* Already aborted. */}end(true);}
    });
  }
  async load(ownerKey:string,activityId:ArabicActivityId):Promise<ArabicPending|null>{
    const record=await this.transact<ArabicPending|null>('readonly',(store,set)=>{const r=store.get(arabicPendingKey(ownerKey,activityId));r.onsuccess=()=>set(r.result??null);});
    if(!record)return null;
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if(record.ownerKey!==ownerKey||record.activityId!==activityId||record.key!==arabicPendingKey(ownerKey,activityId)||
      !(record.blob instanceof Blob)||record.blob.size===0||record.blob.size>ARABIC_RECORDING_LIMITS.maxBytes||
      !/^[0-9a-f]{64}$/.test(record.audioSha256)||!uuid.test(record.sessionId)||!uuid.test(record.versionId)||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/.test(record.chunkId)||
      !uuid.test(record.requestId)||!Number.isInteger(record.expectedRevision)||record.expectedRevision<0||record.expectedRevision>2147483646||
      !['webm','wav','mp3','mp4','ogg'].includes(record.format))throw new ArabicClientError('AR_LOCAL_STORAGE');
    return record;
  }
  save(value:ArabicPending):Promise<void>{
    return this.transact<void>('readwrite',(store,set)=>{store.add(value).onsuccess=()=>set(undefined);});
  }
  remove(value:ArabicPending):Promise<void>{
    return this.transact<void>('readwrite',(store,set)=>{
      const read=store.get(value.key);read.onsuccess=()=>{
        if(read.result?.ownerKey!==value.ownerKey||read.result?.requestId!==value.requestId){set(undefined);return;}
        store.delete(value.key).onsuccess=()=>set(undefined);
      };
    });
  }
}
