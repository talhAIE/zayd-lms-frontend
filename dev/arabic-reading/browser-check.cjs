// Synthetic local-only browser acceptance. No auth/account data, recording or external services.
const { chromium }=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const base=process.env.ARABIC_LAYOUT_QA_URL||'http://127.0.0.1:5195';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local QA target required');
const output=path.join(__dirname,'test-results'),report={scenes:0,journeys:0,assertions:0,viewports:[],screenshots:[],network:[],errors:[]};
const check=(value,message)=>{assert(value,message);report.assertions++;};
(async()=>{
  await fs.mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({locale:'ar-SA',reducedMotion:'reduce'});
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  context.on('page',page=>{page.on('pageerror',error=>report.errors.push(error.message));page.on('request',request=>{
    if(/\/api\/|socket\.io|engagement|heartbeat/i.test(request.url()))report.network.push(request.url());
  });});
  const go=async(page,scene,extra='')=>{await page.goto(`${base}/dev/arabic-reading/index.html?scene=${scene}${extra}`);await page.locator('.ar-view h1').waitFor();};
  const snap=async(page,name)=>{const file=`${name}.png`;await page.screenshot({path:path.join(output,file),fullPage:!name.startsWith('feedback')});report.screenshots.push(file);};
  try{
    for(const [width,height]of [[1440,900],[1280,600],[1024,768],[768,1024],[390,844],[320,568],[844,390]]){
      report.viewports.push([width,height]);const page=await context.newPage();await page.setViewportSize({width,height});
      for(const scene of ['chooser','overview','listen','reading','quiz','completed','loading','error']){
        await go(page,scene,'&long=true');report.scenes++;
        check(await page.locator('.arabic-reading').getAttribute('dir')==='rtl','RTL root');
        check(await page.locator('.arabic-reading').getAttribute('lang')==='ar','Arabic language root');
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No horizontal overflow ${width}/${scene}`);
        check(!/[A-Za-z]/.test(await page.locator('.arabic-reading').innerText()),`Arabic owned visible text ${scene}`);
        check(await page.locator('.arabic-reading [aria-label],.arabic-reading [title],.arabic-reading [placeholder]').evaluateAll(nodes=>nodes.every(node=>
          ['aria-label','title','placeholder'].every(attr=>!/[A-Za-z]/.test(node.getAttribute(attr)||'')))),`Arabic accessible text ${scene}`);
        if(scene==='chooser')check(await page.locator('.ar-topic').count()===3,'Exactly three supplied activity titles');
        if(scene==='listen'){
          const next=page.getByRole('button',{name:'استمع إلى النص للمتابعة'});check(await next.isDisabled(),'Listen gates next');
          await next.scrollIntoViewIfNeeded();check(await next.evaluate(node=>{const r=node.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}),'Listen footer reachable with long text');
        }
        if(scene==='reading'){
          check(await page.locator('.ar-sentence').textContent()==='هٰذا نَصٌّ تَجْرِيبِيٌّ لِفَحْصِ وُضُوحِ الْحُرُوفِ وَالْحَرَكَاتِ. بلغت النسبة ١٢٫٥٪ في عام ٢٠٢٦، ثم ظهرت القيمة 12.5% في المثال.','Source characters/diacritics preserved exactly');
          check(await page.locator('.ar-sentence bdi[dir="ltr"]').count()===3,'Arabic and Western numbers isolated without rewriting');
          const mic=page.getByRole('button',{name:'تسجيل قراءة الجملة',exact:true});await mic.scrollIntoViewIfNeeded();
          check(await mic.evaluate(node=>{const r=node.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.bottom<=innerHeight+1&&!!hit&&(hit===node||node.contains(hit));}),'Mic visible/reachable');
          check(await page.getByRole('button',{name:/كلمات|مفردات/}).count()===0,'No unapproved vocabulary cards');
        }
        if((width===1440&&['chooser','reading'].includes(scene))||(width===390&&['listen','quiz','completed'].includes(scene)))await snap(page,`${scene}-${width}`);
      }
      await page.close();
    }
    const page=await context.newPage();await page.setViewportSize({width:390,height:844});
    for(const state of ['starting','recording','ready','uploading','saved','reconciling','denied','unavailable']){
      await go(page,'reading',`&recorder=${state}`);check(await page.locator('.ar-recorder').innerText().then(t=>!/[A-Za-z]/.test(t)),`Arabic recorder ${state}`);
      if(state==='reconciling')check(await page.getByRole('button',{name:'إعادة إرسال التسجيل',exact:true}).count()===0,'No resend during reconciliation');
    }
    await go(page,'reading');const feedback=page.getByRole('button',{name:'عرض الملاحظات',exact:true});await feedback.click();
    const dialog=page.getByRole('dialog',{name:'ملاحظات القراءة'});await dialog.waitFor();
    for(let i=0;i<6;i++)await page.keyboard.press('Tab');
    check(await dialog.evaluate(node=>node.contains(document.activeElement)),'Native dialog traps keyboard focus');
    check(await dialog.getByText('غير متاح',{exact:true}).count()===4,'Absent scores unavailable, never zero');
    check(await dialog.getByText(/الكلمات المسموعة فقط/).count()===1,'Transcript-only disclosure');
    await snap(page,'feedback-390');await page.keyboard.press('Escape');
    check(await page.getByRole('dialog').count()===0,'Escape closes feedback');check(await feedback.evaluate(node=>node===document.activeElement),'Dialog restores focus');
    await go(page,'quiz');const firstRadio=page.getByRole('radio',{name:'مثال لعرض القراءة العربية',exact:true});await firstRadio.focus();await page.keyboard.press('ArrowDown');
    check(await page.getByRole('radio',{name:'مثال لعرض الحساب',exact:true}).isChecked(),'Native radio arrow-key navigation');
    await page.keyboard.press('Tab');await page.keyboard.press('Tab');
    const grade=page.getByRole('button',{name:'تحقّق من الإجابة',exact:true});await grade.focus();await page.keyboard.press('Enter');
    check(await page.getByText(/الإجابة غير صحيحة/).isVisible(),'Keyboard submits selected answer');
    await firstRadio.focus();await page.keyboard.press('Space');check(await page.getByText(/الإجابة غير صحيحة/).count()===0,'Editing wrong answer clears stale feedback');
    for(const state of ['loading','unavailable']){
      await go(page,'listen',`&audio=${state}`);await page.getByRole('button',{name:'تشغيل الاستماع إلى النص',exact:true}).click();
      check(await page.getByRole('button',{name:'استمع إلى النص للمتابعة'}).isDisabled(),'Loading/unavailable audio cannot unlock listening');
      check(await page.getByText(state==='loading'?'جارٍ تحميل الصوت…':'تعذر تشغيل الصوت. حاول مجدداً.',{exact:true}).isVisible(),`Arabic audio ${state}`);
    }
    await go(page,'reading');
    await page.getByRole('button',{name:'قائمة النصوص'}).click();check(await page.getByRole('navigation',{name:'التنقل في القراءة العربية'}).isVisible(),'Mobile navigation opens');
    await page.getByRole('link',{name:'من نعم الله',exact:true}).click();check(await page.locator('h1').innerText()==='من نعم الله','Independent Arabic route navigation');
    check(await page.getByRole('button',{name:'قائمة النصوص'}).getAttribute('aria-expanded')==='false','Mobile navigation closes on route');
    for(const [activity,total]of [[1,10],[2,6],[3,9]]){
      await go(page,'chooser',`&activity=${activity}`);
      await page.locator('.ar-topic').nth(activity-1).getByRole('button',{name:'ابدأ القراءة'}).click();
      await page.getByRole('button',{name:'الاستماع إلى النص',exact:true}).click(); // overview -> listen
      await page.getByRole('button',{name:'تشغيل الاستماع إلى النص',exact:true}).click(); // explicit synthetic playback completion
      await page.getByRole('button',{name:'التالي: القراءة بصوت عالٍ'}).click();
      await page.getByRole('button',{name:'تسجيل قراءة الجملة'}).click();await page.getByRole('button',{name:'إيقاف التسجيل',exact:true}).click();
      await page.getByRole('button',{name:'إرسال التسجيل',exact:true}).click();await page.getByRole('group',{name:/اختر إجابة/}).waitFor();
      for(let index=0;index<total;index++){
        check(await page.getByRole('button',{name:'تحقّق من الإجابة'}).isDisabled(),'Unchecked selection cannot submit');
        if(index===0){
          await page.getByRole('radio',{name:'مثال لعرض الحساب',exact:true}).check();await page.getByRole('button',{name:'تحقّق من الإجابة'}).click();
          check(await page.getByText(/الإجابة غير صحيحة/).isVisible(),'Incorrect server response displayed');
          check(await page.getByRole('button',{name:'السؤال التالي'}).count()===0,'Incorrect answer cannot advance');
        }
        await page.getByRole('radio',{name:'مثال لعرض القراءة العربية',exact:true}).check();await page.getByRole('button',{name:'تحقّق من الإجابة'}).click();
        check(await page.getByText('إجابة صحيحة. يمكنك المتابعة.',{exact:true}).isVisible(),'Server-checked correct answer');
        if(index<total-1)await page.getByRole('button',{name:'السؤال التالي'}).click();else await page.getByRole('button',{name:'إنهاء النشاط',exact:true}).click();
      }
      check(await page.getByText('أحسنت! أكملت نشاط القراءة.',{exact:true}).isVisible(),'Completion shown only from supplied response');
      await page.getByRole('button',{name:'إعادة النشاط',exact:true}).click();await page.getByRole('button',{name:'إلغاء',exact:true}).click();
      check(await page.getByText('أحسنت! أكملت نشاط القراءة.',{exact:true}).isVisible(),'Retake cancellation preserves result');
      await page.getByRole('button',{name:'إعادة النشاط',exact:true}).click();await page.getByRole('button',{name:'بدء محاولة جديدة',exact:true}).click();
      check(await page.getByRole('button',{name:'استمع إلى النص للمتابعة'}).isDisabled(),'Retake returns to fresh listen gate');report.journeys++;
    }
    await page.goto(base+'/student/arabic-reading');await page.getByText('القراءة العربية غير متاحة حالياً.',{exact:true}).waitFor();
    check(await page.locator('.ar-topic').count()===0,'Default-off production route cannot import synthetic content');
    check(await page.evaluate(()=>localStorage.length)===0,'No auth/progress/usage storage created');
    check(report.network.length===0,'No API/socket/engagement calls');check(report.errors.length===0,'No browser errors');
    await fs.writeFile(path.join(output,'phase5-browser.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:true,scenes:report.scenes,journeys:report.journeys,assertions:report.assertions,viewports:report.viewports.length,screenshots:report.screenshots.length}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
