'use strict';
// Actual Courses page, HTTP adapter and React entry; all identities/content/HTTP are local fixtures.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const user={id:'arabic-course-owner',username:'qa.arabic.course.synthetic',role:'student',region:'ROW',firstName:'Synthetic',lastName:'Reader',phoneNumber:'000000000',acceptedTerms:true};
const claims={sub:user.id,username:user.username,role:'STUDENT',region:'ROW',authVersion:'password-v1',exp:4102444800};
const token='fixture.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.fixture';
const profile={language:'ar',direction:'rtl',speechLocale:'ar-SA',voice:'ar-SA-HamedNeural',speakingStyle:null,prosodySupported:false};
const normal={id:'ordinary-course',title:'Existing English course',code:'EN',grade:'9',description:'Ordinary curriculum',progressPct:0,progressStatus:'not_started',isLocked:false};
const report={scenarios:[],assertions:0,errors:[],arabicWrites:[]};
function check(value,message){assert(value,message);report.assertions++;}
(async()=>{
 await fs.mkdir(path.join(__dirname,'test-results'),{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 async function scenario(name,{width=1280,enabled=true,denied=false,ready=false,delayed=false,ordinary=false}={},work){
  const base='http://127.0.0.1:'+(enabled?'5196':'5195');
  const context=await browser.newContext({viewport:{width,height:900}}),requests=[];let release;
  const hold=new Promise(resolve=>{release=resolve;});
  await context.addInitScript(({user,token})=>{localStorage.setItem('AiTutorUser',JSON.stringify(user));localStorage.setItem('accessToken',token);localStorage.setItem('refreshToken','synthetic-refresh');},{user,token});
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());if(!request.url().startsWith(base+'/'))return route.abort();
   if(!url.pathname.startsWith('/api/v1/'))return route.continue();
   const p=url.pathname.slice('/api/v1'.length);requests.push({path:p,method:request.method()});
   const json=data=>route.fulfill({json:{status:true,data}});
   if(p==='/auth/me')return route.fulfill({json:{...user,role:'STUDENT'}});
   if(p==='/learning/courses')return json({courses:ordinary?[normal]:[]});
   if(p.startsWith('/arabic-reading/')){
    if(request.method()!=='GET')report.arabicWrites.push(p);
    if(delayed)await hold;
    if(denied)return route.fulfill({status:404,json:{status:false,error:{code:'AR_NOT_FOUND',message:'غير متاح'}}});
    return json({profile,activities:[10,6,9].map((count,i)=>({id:'ar-reading-0'+(i+1),title:['حنكة طفل','من نعم الله','السُّكَّري'][i],questionCount:count,state:'not_started',sessionId:null,available:ready}))});
   }
   if(p.includes('spark-science'))return json({available:false,course:null,courses:[]});
   if(p==='/step/courses'||p==='/nafs/courses')return json({courses:[]});
   if(p.includes('availability'))return json({available:false});
   return route.fulfill({status:404,json:{status:false,error:{code:'NOT_FOUND'}}});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  try{await page.goto(base+'/student/courses');await page.getByRole('heading',{name:'Enrolled Curriculum'}).waitFor();
   await work({page,requests,release,base});report.scenarios.push(name);console.log('PASS '+name);
  }finally{release();await context.close();}
 }
 try{
  for(const width of [390,1280])await scenario(`authorized draft entry at ${width}px`,{width},async({page,requests,base})=>{
   const card=page.locator('a[href="/student/arabic-reading"]');await card.waitFor();
   check(await card.getAttribute('dir')==='rtl','Arabic card is RTL');check(await card.getByText('النصوص قيد الإعداد للمراجعة.').isVisible(),'Draft state is honest');
   check(await page.getByText('No curriculum courses available.').count()===0,'No false empty course message');
   check(requests.filter(r=>r.path==='/arabic-reading/activities').length===1,'Exactly one read-only Arabic discovery');
   await page.screenshot({path:path.join(__dirname,`test-results/course-entry-${width}.png`),fullPage:true});
   await card.focus();await page.keyboard.press('Enter');await page.waitForURL(base+'/student/arabic-reading');
   await page.getByRole('button',{name:'غير متاح حالياً',exact:true}).first().waitFor();
   check(await page.getByRole('button',{name:'غير متاح حالياً',exact:true}).count()===3,'Navigating to Arabic cannot publish or enable drafts');
  });
  await scenario('published availability preserves existing English cards',{ordinary:true,ready:true},async({page})=>{
   await page.getByText('ابدأ القراءة',{exact:true}).waitFor();check(await page.getByRole('heading',{name:'Existing English course'}).isVisible(),'English course unchanged');
  });
  await scenario('server denies ungranted account',{denied:true,ordinary:true},async({page,requests})=>{
   await page.getByRole('heading',{name:'Existing English course'}).waitFor();await page.waitForFunction(()=>!document.body.textContent.includes('Loading courses...'));
   check(requests.some(r=>r.path==='/arabic-reading/activities'),'Grant checked by backend');check(await page.locator('a[href="/student/arabic-reading"]').count()===0,'No Arabic card after denial');
  });
  await scenario('default-off entry makes no Arabic request',{enabled:false,ordinary:true},async({page,requests})=>{
   await page.getByRole('heading',{name:'Existing English course'}).waitFor();await page.waitForFunction(()=>!document.body.textContent.includes('Loading courses...'));
   check(!requests.some(r=>r.path.startsWith('/arabic-reading/')),'No feature-off request');check(await page.locator('a[href="/student/arabic-reading"]').count()===0,'No feature-off card');
  });
  await scenario('late discovery cannot reveal a previous owner entry',{delayed:true},async({page,requests,release})=>{
   await page.waitForTimeout(300);check(requests.some(r=>r.path==='/arabic-reading/activities'),'Discovery in flight');
   await page.evaluate(()=>{localStorage.removeItem('accessToken');window.dispatchEvent(new StorageEvent('storage',{key:'accessToken'}));});release();
   await page.waitForFunction(()=>!document.body.textContent.includes('Loading courses...'));
   check(await page.locator('a[href="/student/arabic-reading"]').count()===0,'Old owner response hidden');
  });
  check(report.errors.length===0,'No browser errors');check(report.arabicWrites.length===0,'No Arabic learning mutations');
  await fs.mkdir(path.join(__dirname,'test-results'),{recursive:true});await fs.writeFile(path.join(__dirname,'test-results/course-entry.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:true,scenarios:report.scenarios.length,assertions:report.assertions}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
