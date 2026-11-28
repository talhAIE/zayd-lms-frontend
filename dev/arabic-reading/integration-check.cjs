// Real frontend + real Arabic/JWT HTTP routes, synthetic SQL/speech/device only.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const base=process.env.ARABIC_INTEGRATION_QA_URL||'http://127.0.0.1:5196';assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const report={checks:0,scenarios:[],errors:[],forbidden:[]},check=(v,m)=>{assert(v,m);report.checks++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  async function scenario(name,work){
    const context=await browser.newContext({locale:'ar-SA',viewport:{width:390,height:844}});
    await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    await context.request.post(base+'/__arabic-test/reset');const bootstrap=await(await context.request.get(base+'/__arabic-test/bootstrap')).json();
    await context.addInitScript(data=>{
      if(!localStorage.getItem('accessToken')){localStorage.setItem('AiTutorUser',JSON.stringify(data.user));localStorage.setItem('accessToken',data.accessToken);localStorage.setItem('refreshToken',data.refreshToken);}
      window.__micMode='ok';window.__tracksStopped=0;window.__micCalls=0;
      window.__urls=new Set();const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
      URL.createObjectURL=blob=>{const url=create(blob);window.__urls.add(url);return url;};URL.revokeObjectURL=url=>{window.__urls.delete(url);revoke(url);};
      const stream=()=>({getTracks:()=>[{stop:()=>{window.__tracksStopped++;}}]});
      Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{window.__micCalls++;if(window.__micMode==='denied')throw new DOMException('synthetic','NotAllowedError');if(window.__micMode==='deferred')return new Promise(resolve=>{window.__releaseMic=()=>resolve(stream());});return stream();}}});
      window.MediaRecorder=class{
        static isTypeSupported(type){return type.startsWith('audio/webm');}state='inactive';mimeType='audio/webm;codecs=opus';
        constructor(_stream,options){window.__recorderOptions=options;}
        start(){this.state='recording';}
        stop(){if(this.state==='inactive')return;this.state='inactive';queueMicrotask(()=>{const bytes=new Uint8Array(512);bytes.set([0x1a,0x45,0xdf,0xa3]);this.ondataavailable?.({data:new Blob([bytes],{type:this.mimeType})});this.onstop?.();});}
      };
    },bootstrap);
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{const p=new URL(r.url()).pathname;
      if((p.startsWith('/api/v1/')&&!p.startsWith('/api/v1/arabic-reading/')&&p!=='/api/v1/auth/refresh')||p.startsWith('/socket.io/'))report.forbidden.push(r.url());});
    const control=async data=>context.request.post(base+'/__arabic-test/configure',{data});
    const state=async()=> (await context.request.get(base+'/__arabic-test/state')).json();
    const pending=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('zayd-arabic-reading-recordings',1);r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains('pending')){db.close();resolve([]);return;}const tx=db.transaction('pending'),get=tx.objectStore('pending').getAll();get.onsuccess=()=>{const values=get.result.map(p=>({ownerKey:p.ownerKey,requestId:p.requestId,sessionId:p.sessionId,versionId:p.versionId,chunkId:p.chunkId,digest:p.audioSha256,size:p.blob.size}));tx.oncomplete=()=>{db.close();resolve(values);};};r.onerror=reject;};}));
    const open=async()=>{await page.goto(base+'/student/arabic-reading');await page.locator('.ar-topic').first().getByRole('button',{name:'ابدأ القراءة'}).click();await page.getByRole('button',{name:'الاستماع إلى النص',exact:true}).click();};
    const listen=async()=>{await page.getByRole('button',{name:'تشغيل الاستماع إلى النص',exact:true}).click();await page.getByRole('button',{name:'التالي: القراءة بصوت عالٍ'}).click();await page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();};
    const capture=async()=>{await page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).click();await page.getByRole('button',{name:'إيقاف التسجيل',exact:true}).click();await page.getByRole('button',{name:'إرسال التسجيل',exact:true}).waitFor();};
    const send=async()=>{await page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.ar-view')?.getAttribute('aria-busy')?.includes('true'));};
    try{await work({page,context,control,state,pending,open,listen,capture,send,bootstrap});report.scenarios.push(name);console.log('PASS '+name);}finally{await context.close();}
  }
  try{
    await scenario('owned chooser/listen/recording and server sentence/feedback resume',async t=>{
      await t.open();check(await t.page.getByRole('button',{name:'استمع إلى النص للمتابعة'}).isDisabled(),'Listen initially gated');await t.listen();
      check((await t.state()).sessions[0].phase==='reading','Listen acknowledgement persisted');await t.capture();check((await t.pending()).length===1,'Persisted before dispatch');
      await t.send();await t.page.getByText('بلغت النسبة ١٢٪.',{exact:true}).waitFor();check((await t.pending()).length===0,'Receipt-confirmed upload removes pending');
      check((await t.state()).evaluations===1,'One validated upload');await t.page.reload();await t.page.getByText('بلغت النسبة ١٢٪.',{exact:true}).waitFor();
      check(await t.page.getByRole('button',{name:'عرض الملاحظات'}).count()===1,'Feedback restored');
      await t.capture();await t.send();await t.page.getByText('قرأ الطفل النص بوضوح.',{exact:true}).waitFor();await t.capture();await t.send();await t.page.locator('.ar-quiz').waitFor();
      check((await t.state()).evaluations===3,'Three chunks graded exactly once');check(await t.page.getByRole('button',{name:'تحقّق من الإجابة'}).isDisabled(),'Quiz writer left to Phase 7');
      check(JSON.stringify((await t.state()).legacy)===JSON.stringify({progress:117,usage:31,nafs:53,step:29}),'No LMS effects');
    });
    await scenario('refresh recovers exact pending bytes and deliberate resend',async t=>{
      await t.open();await t.listen();await t.capture();const before=(await t.pending())[0];await t.page.reload();
      await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).waitFor();const after=(await t.pending())[0];check(JSON.stringify(before)===JSON.stringify(after),'Stable bound pending ID/digest/bytes');
      check((await t.state()).evaluations===0,'Refresh does not auto-grade');await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).click();await t.page.getByText('بلغت النسبة ١٢٪.',{exact:true}).waitFor();
      check((await t.state()).evaluations===1,'Recovered attempt graded once');
    });
    await scenario('lost upload response reconciles receipt without a second grade',async t=>{
      await t.open();await t.listen();await t.capture();await t.control({drop:1});await t.send();await t.page.getByText('بلغت النسبة ١٢٪.',{exact:true}).waitFor();
      check((await t.state()).evaluations===1,'Lost response did not regrade');check((await t.pending()).length===0,'Unknown outcome cleared only after receipt');
    });
    await scenario('discard after reload cancels an upload still in flight',async t=>{
      await t.open();await t.listen();await t.capture();await t.control({hold:true});await t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();
      for(let i=0;i<100&&(await t.state()).waiting===0;i++)await sleep(25);check((await t.state()).waiting===1,'External work in flight');
      await t.page.reload();await t.page.getByRole('button',{name:'حذف التسجيل والمحاولة مجدداً',exact:true}).click();
      await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();check((await t.pending()).length===0,'Discard receipt confirmed before local deletion');
      await t.control({release:true});await sleep(100);const s=await t.state();check(s.sessions[0].revision===1,'Late cloud completion cannot grade discarded attempt');check(s.receipts.some(r=>r.discarded),'Sealed discard receipt');
    });
    for(const mode of ['silence','unclear'])await scenario(mode+' permits a fresh recording without a validated attempt',async t=>{
      await t.open();await t.listen();await t.capture();await t.control({mode});await t.send();await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();
      check((await t.state()).sessions[0].revision===1,'No validated attempt consumed');check((await t.pending()).length===0,'Rejected attempt safely closed');
      check(await t.page.getByRole('alert').innerText().then(text=>!/[A-Za-z]/.test(text)),'Arabic rejection');
    });
    await scenario('speech unavailable retains pending; reconnect never auto-resends',async t=>{
      await t.open();await t.listen();await t.capture();await t.control({mode:'unavailable'});await t.send();await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).waitFor();
      check((await t.pending()).length===1,'Provider failure retains recording');await t.control({mode:'correct'});await t.page.evaluate(()=>window.dispatchEvent(new Event('online')));await sleep(150);
      check((await t.state()).evaluations===1,'Reconnect reconciles without auto-grading');await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).click();await t.page.getByText('بلغت النسبة ١٢٪.',{exact:true}).waitFor();
    });
    await scenario('accelerated upload timeout retains the exact attempt until atomic discard',async t=>{
      await t.open();await t.listen();await t.capture();const before=(await t.pending())[0];await t.control({hold:true});
      await t.page.evaluate(()=>{
        window.__timeouts=[];const proto=XMLHttpRequest.prototype,open=proto.open,timeout=Object.getOwnPropertyDescriptor(proto,'timeout');
        proto.open=function(method,url,...args){this.__arabicUrl=String(url);return open.call(this,method,url,...args);};
        Object.defineProperty(proto,'timeout',{get:timeout.get,set(value){if(this.__arabicUrl?.endsWith('/audio')){window.__timeouts.push(value);timeout.set.call(this,350);}else timeout.set.call(this,value);}});
      });
      await t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).waitFor();
      check(await t.page.evaluate(()=>window.__timeouts.includes(180000)),'Upload config retains the 180-second transport timeout');
      check(JSON.stringify((await t.pending())[0])===JSON.stringify(before),'Timeout never creates a fresh attempt ID or bytes');
      await t.page.getByRole('button',{name:'حذف التسجيل والمحاولة مجدداً',exact:true}).click();await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();
      await t.control({release:true});await sleep(100);check((await t.state()).sessions[0].revision===1,'Timed-out work cannot grade after discard');
    });
    await scenario('storage failure prevents upload and reports Arabic fallback',async t=>{
      await t.open();await t.listen();await t.page.evaluate(()=>{IDBObjectStore.prototype.add=function(){throw new DOMException('synthetic quota','QuotaExceededError');};});
      await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).click();await t.page.getByRole('button',{name:'إيقاف التسجيل',exact:true}).click();
      await t.page.getByText(/تعذر حفظ التسجيل على هذا الجهاز/).waitFor();check((await t.state()).evaluations===0,'No dispatch before successful IndexedDB commit');
      check((await t.pending()).length===0,'Failed save leaves no fabricated pending state');
    });
    await scenario('offline pending recording survives reconnect without auto-upload',async t=>{
      await t.open();await t.listen();await t.capture();const before=(await t.pending())[0];await t.context.setOffline(true);await t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();
      await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).waitFor();check(JSON.stringify((await t.pending())[0])===JSON.stringify(before),'Offline exact-byte retention');
      await t.context.setOffline(false);await sleep(150);check((await t.state()).evaluations===0,'Online event reconciles only');
      await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).click();await t.page.getByText('بلغت النسبة ١٢٪.',{exact:true}).waitFor();
    });
    await scenario('narration errors remain Arabic and retry uses authenticated binary media',async t=>{
      await t.open();await t.page.route('**/api/v1/arabic-reading/sessions/*/media',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({status:false,error:{code:'AR_MEDIA_UNAVAILABLE',message:'provider detail must not surface'}})}));
      await t.page.getByRole('button',{name:'تشغيل الاستماع إلى النص',exact:true}).click();await t.page.getByText('تعذر تشغيل الصوت. حاول مجدداً.',{exact:true}).waitFor();
      check(await t.page.getByRole('button',{name:'استمع إلى النص للمتابعة'}).isDisabled(),'Failed media cannot unlock listen');
      check(!/provider detail/.test(await t.page.locator('.arabic-reading').innerText()),'Raw provider messages never displayed');
      await t.page.unroute('**/api/v1/arabic-reading/sessions/*/media');await t.page.getByRole('button',{name:'إعادة تحميل الاستماع إلى النص',exact:true}).click();
      await t.page.getByRole('button',{name:'التالي: القراءة بصوت عالٍ'}).waitFor();
      check(await t.page.locator('audio[src*="token"],audio[src^="http"]').count()===0,'Narration never exposes bearer or public media URL');
    });
    await scenario('browser playback rejection can retry without losing the owned session',async t=>{
      await t.open();await t.page.evaluate(()=>{window.__originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('synthetic autoplay','NotAllowedError'));});
      await t.page.getByRole('button',{name:'تشغيل الاستماع إلى النص',exact:true}).click();await t.page.getByText('تعذر تشغيل الصوت. حاول مجدداً.',{exact:true}).waitFor();
      check(await t.page.locator('.ar-passage').isVisible(),'Native play failure does not become an authorization failure');
      check(await t.page.evaluate(()=>window.__urls.size)===0,'Failed playback blob revoked');await t.page.evaluate(()=>{HTMLMediaElement.prototype.play=window.__originalPlay;});
      await t.page.getByRole('button',{name:'إعادة تحميل الاستماع إلى النص',exact:true}).click();await t.page.getByRole('button',{name:'التالي: القراءة بصوت عالٍ'}).click();await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();
      check(await t.page.evaluate(()=>window.__urls.size)===0,'Phase transition revokes narration URL');
    });
    await scenario('two tabs share one exact pending attempt without duplicate grading',async t=>{
      await t.open();await t.listen();await t.capture();const second=await t.context.newPage();second.on('pageerror',e=>report.errors.push(e.message));
      await second.goto(base+'/student/arabic-reading/ar-reading-01');await second.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).waitFor();
      await Promise.all([t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click(),second.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).click()]);
      for(let i=0;i<100&&(await t.state()).sessions[0].revision<2;i++)await sleep(25);
      check((await t.state()).evaluations===1,'Cross-tab lock/idempotency prevent a duplicate assessment');check((await t.state()).sessions[0].revision===2,'Single state transition across tabs');
    });
    await scenario('a different server revision never receives an old pending recording',async t=>{
      await t.open();await t.listen();await t.capture();const p=(await t.pending())[0],bytes=Buffer.alloc(512);bytes.set([0x1a,0x45,0xdf,0xa3]);
      const result=await t.context.request.post(base+`/api/v1/arabic-reading/sessions/${p.sessionId}/audio`,{headers:{Authorization:'Bearer '+t.bootstrap.accessToken},multipart:{
        audio:{name:'synthetic.webm',mimeType:'audio/webm',buffer:bytes},requestId:crypto.randomUUID(),expectedRevision:'1',chunkId:'chunk0',format:'webm'}});
      check(result.ok(),'Other tab synthetic grade accepted');await t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();await t.page.getByText(/لا يمكن إرسال التسجيل إلى جملة/).waitFor();
      check((await t.state()).evaluations===1,'Old revision cannot create another grade');check((await t.pending()).length===1,'Mismatched recording retained for explicit discard');
      await t.page.getByRole('button',{name:'حذف التسجيل والمحاولة مجدداً',exact:true}).click();await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();
      check((await t.state()).sessions[0].revision===2,'Discard cannot roll back newer state');
    });
    await scenario('pending cleanup remains available after another client reaches quiz',async t=>{
      await t.open();await t.listen();await t.capture();const p=(await t.pending())[0],bytes=Buffer.alloc(512);bytes.set([0x1a,0x45,0xdf,0xa3]);
      for(let i=0;i<3;i++){const r=await t.context.request.post(base+`/api/v1/arabic-reading/sessions/${p.sessionId}/audio`,{headers:{Authorization:'Bearer '+t.bootstrap.accessToken},multipart:{
        audio:{name:'synthetic.webm',mimeType:'audio/webm',buffer:bytes},requestId:crypto.randomUUID(),expectedRevision:String(i+1),chunkId:'chunk'+i,format:'webm'}});check(r.ok(),'Synthetic competing chunk grade');}
      await t.page.reload();await t.page.locator('.ar-quiz').waitFor();await t.page.getByRole('button',{name:'حذف التسجيل والمحاولة مجدداً',exact:true}).click();
      await t.page.waitForFunction(()=>!document.querySelector('.ar-recorder'));check((await t.pending()).length===0,'Outdated pending can be discarded from quiz');
      check((await t.state()).sessions[0].phase==='quiz','Cleanup does not regress the authoritative phase');
    });
    await scenario('permission denial and cancelled late stream are localized and released',async t=>{
      await t.open();await t.listen();await t.page.evaluate(()=>{window.__micMode='denied';});await t.page.getByRole('button',{name:'تسجيل قراءة الجملة'}).click();
      await t.page.getByText(/لم يُسمح باستخدام الميكروفون/).waitFor();check((await t.pending()).length===0,'Denied microphone never persisted or sent');
      await t.page.evaluate(()=>{window.__micMode='deferred';});await t.page.getByRole('button',{name:'تسجيل قراءة الجملة'}).click();await t.page.getByRole('button',{name:'إلغاء طلب الميكروفون'}).click();
      await t.page.evaluate(()=>window.__releaseMic());await sleep(50);check(await t.page.evaluate(()=>window.__tracksStopped)===1,'Late permission stream stopped');check((await t.state()).evaluations===0,'No mic failure upload');
    });
    await scenario('30-second client limit auto-stops and releases the synthetic microphone',async t=>{
      await t.open();await t.listen();await t.page.evaluate(()=>{window.__clock=0;performance.now=()=>window.__clock;});await t.page.getByRole('button',{name:'تسجيل قراءة الجملة'}).click();await t.page.getByRole('button',{name:'إيقاف التسجيل',exact:true}).waitFor();
      await t.page.evaluate(()=>{window.__clock=30010;});await t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).waitFor();
      check(await t.page.evaluate(()=>window.__tracksStopped)===1,'Client timer released microphone tracks');check((await t.state()).evaluations===0,'Auto-stop persists only, no automatic grade');
    });
    await scenario('corrupted local bytes are never uploaded and can be safely discarded',async t=>{
      await t.open();await t.listen();await t.capture();await t.page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('zayd-arabic-reading-recordings',1);r.onsuccess=()=>{
        const db=r.result,tx=db.transaction('pending','readwrite'),s=tx.objectStore('pending'),get=s.getAll();get.onsuccess=()=>{const p=get.result[0];p.blob=new Blob([new Uint8Array([1,2,3,4])]);s.put(p);};tx.oncomplete=()=>{db.close();resolve();};};}));
      await t.page.reload();await t.page.getByText(/تعذر حفظ التسجيل على هذا الجهاز/).waitFor();check((await t.state()).evaluations===0,'Digest mismatch blocked upload');
      await t.page.getByRole('button',{name:'حذف التسجيل والمحاولة مجدداً',exact:true}).click();await t.page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true}).waitFor();
      check((await t.pending()).length===0,'Stored original digest cancels corrupt pending safely');
    });
    await scenario('account replacement cannot recover or send the previous account recording',async t=>{
      await t.open();await t.listen();await t.capture();const old=(await t.pending())[0];const second=await(await t.context.request.get(base+'/__arabic-test/bootstrap?user=2')).json();
      await t.page.evaluate(data=>{localStorage.setItem('AiTutorUser',JSON.stringify(data.user));localStorage.setItem('accessToken',data.accessToken);window.dispatchEvent(new StorageEvent('storage',{key:'accessToken',newValue:data.accessToken}));},second);
      await t.page.getByRole('button',{name:'الاستماع إلى النص',exact:true}).waitFor();check(await t.page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).count()===0,'Other owner cannot see resend');
      check((await t.state()).evaluations===0,'Other owner cannot replay upload');check((await t.pending())[0].requestId===old.requestId,'Original recording remains scoped privately');
    });
    await scenario('late old-account response cannot update or replay as the replacement account',async t=>{
      await t.open();await t.listen();await t.capture();await t.control({hold:true});await t.page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();
      for(let i=0;i<100&&(await t.state()).waiting===0;i++)await sleep(25);const second=await(await t.context.request.get(base+'/__arabic-test/bootstrap?user=2')).json();
      await t.page.evaluate(data=>{localStorage.setItem('AiTutorUser',JSON.stringify(data.user));localStorage.setItem('accessToken',data.accessToken);window.dispatchEvent(new StorageEvent('storage',{key:'accessToken',newValue:data.accessToken}));},second);
      await t.page.getByRole('button',{name:'الاستماع إلى النص',exact:true}).waitFor();await t.control({release:true});await sleep(100);
      check(await t.page.locator('.ar-current-sentence').count()===0,'Old response cannot display old content as replacement user');
      check((await t.state()).sessions.every(s=>s.userId===t.bootstrap.user.id),'No old upload created a replacement-account session');
      check((await t.pending()).length===1,'Old owner recording remains bound for later reconciliation');
    });
    await scenario('revoked access hides session and keeps private pending unsent',async t=>{
      await t.open();await t.listen();await t.capture();await t.control({revoked:true});await t.send();await t.page.getByText('هذا النشاط غير متاح لهذا الحساب.',{exact:true}).waitFor();
      check((await t.state()).evaluations===0,'Revoked grant rejected before cloud');check((await t.pending()).length===1,'Revoked pending not erased/rebound');check(await t.page.locator('.ar-current-sentence').count()===0,'Revoked content hidden');
    });
    check(report.errors.length===0,'No browser exceptions');check(report.forbidden.length===0,'No normal LMS endpoints/heartbeat/socket');
    await fs.mkdir(path.join(__dirname,'test-results'),{recursive:true});await fs.writeFile(path.join(__dirname,'test-results/phase6-integration.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:true,checks:report.checks,scenarios:report.scenarios.length}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
