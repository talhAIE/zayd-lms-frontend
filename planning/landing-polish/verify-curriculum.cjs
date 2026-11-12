const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
(async () => {
 const browser = await chromium.launch({channel:'chrome', headless:true});
 const results=[];
 try {
 for (const width of [320,390,768,1024,1440]) {
  const page=await browser.newPage({viewport:{width,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/');
  const panel=page.locator('.curriculum-overview__panel');
  await panel.scrollIntoViewIfNeeded(); await page.waitForTimeout(650);
  const initiallyHidden=await panel.locator('img').count()===0;
  const noZoomLink=await panel.getByText('عرض بالحجم الكامل').count()===0;
  const tabs=panel.getByRole('tab'); const sources=[]; let togglesClosed=true; let selfExpressionCorners=false;
  let validPanels=true;
  for(let i=0;i<8;i++) {
   await tabs.nth(i).click();
   const image=panel.locator('img'); await image.evaluate(i=>i.decode());
   await page.waitForTimeout(700);
   sources.push(await image.getAttribute('src'));
   if(i===7) selfExpressionCorners=await panel.locator('.curriculum-overview__screen--self-expression').evaluate(s=>getComputedStyle(s).overflow==='hidden' && getComputedStyle(s).aspectRatio==='auto' && s.querySelector('img').getBoundingClientRect().height<=s.getBoundingClientRect().height+1);
   validPanels=validPanels && await panel.getByRole('tabpanel').count()===1 && await tabs.nth(i).getAttribute('aria-selected')==='true';
   await tabs.nth(i).click(); await page.waitForTimeout(700);
   togglesClosed=togglesClosed && await panel.locator('img').count()===0 && await tabs.nth(i).getAttribute('aria-selected')==='false';
  }
  await tabs.nth(0).focus(); await page.keyboard.press('ArrowLeft');
  const keyboardWorks=await tabs.nth(1).getAttribute('aria-selected')==='true';
  await page.waitForTimeout(750);
  const image=panel.locator('img'); await image.hover(); await page.waitForTimeout(400);
  const noHoverZoom=await image.evaluate(i=>getComputedStyle(i).scale==='1' && getComputedStyle(i).translate==='none');
  const noOverflow=await panel.evaluate(p=>p.getBoundingClientRect().left>=0&&p.getBoundingClientRect().right<=innerWidth&&Array.from(p.querySelectorAll('button')).every(b=>b.scrollWidth<=b.clientWidth+1));
  const revealAnimation=await panel.locator('.curriculum-overview__device').evaluate(d=>getComputedStyle(d).animationName==='curriculum-device-enter');
  await page.emulateMedia({reducedMotion:'reduce'});
  const reducedMotion=await panel.locator('.curriculum-overview__device').evaluate(d=>getComputedStyle(d).animationName==='none');
  if([320,1440].includes(width)) await panel.screenshot({path:__dirname+'/curriculum-'+width+'.png'});
  const checks={initiallyHidden,noZoomLink,validPanels,togglesClosed,selfExpressionCorners,eightUniqueImages:new Set(sources).size===8,keyboardWorks,noHoverZoom,noOverflow,revealAnimation,reducedMotion,noPageErrors:errors.length===0};
  results.push({width,checks}); await page.close();
 }
 const passed=results.every(r=>Object.values(r.checks).every(Boolean));
 fs.writeFileSync(__dirname+'/curriculum-verification.json',JSON.stringify({passed,results},null,2));
 console.log(JSON.stringify({passed,results})); if(!passed)process.exitCode=1;
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
