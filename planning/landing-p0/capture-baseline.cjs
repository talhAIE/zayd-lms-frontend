// Read-only browser baseline. Does not open live demos or submit forms.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = path.join(__dirname, 'baseline');
const base = process.env.LANDING_BASELINE_URL || 'http://127.0.0.1:5174';
fs.mkdirSync(out, { recursive: true });
const report = { capturedAt: new Date().toISOString(), base, browser: '', account: 'fresh unauthenticated browser context', motion: 'reduced', scope: 'local navigation and FAQ only; no demo session, forms, microphone or authenticated APIs', viewports: [], interactions: [], pageErrors: [], failedRequests: [] };
async function check(name, run) {
  try { report.interactions.push({ name, passed: true, evidence: await run() }); }
  catch (error) { report.interactions.push({ name, passed: false, evidence: error.message }); }
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  report.browser = browser.version();
  try {
    for (const [name, width, height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'en-US' });
      const page = await context.newPage();
      page.on('pageerror', error => report.pageErrors.push({ viewport: name, message: error.message }));
      page.on('requestfailed', request => report.failedRequests.push({ viewport: name, url: request.url().split('?')[0], error: request.failure()?.errorText }));
      const response = await page.goto(base, { waitUntil: 'load', timeout: 30000 });
      await page.locator('.landing-hero').waitFor({ timeout: 15000 });
      await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(resolve => setTimeout(resolve, 10000))]);
      // Scroll the actual page to settle lazy images, then capture without injecting styles.
      for (const section of await page.locator('main > section').all()) await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({ path: path.join(out, `${name}-viewport.png`), animations: 'disabled' });
      await page.screenshot({ path: path.join(out, `${name}-full.png`), fullPage: true, animations: 'disabled' });
      const snapshot = await page.evaluate(() => {
        const box = element => { if (!element) return null; const r=element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
        return {
          title: document.title, documentLanguage: document.documentElement.lang, landingDirection: getComputedStyle(document.querySelector('.public-landing')).direction,
          width: innerWidth, documentWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
          headings: [...document.querySelectorAll('h1,h2,h3')].map(e=>({level:e.tagName,text:e.textContent.trim()})),
          sections: [...document.querySelectorAll('main > section')].map(e=>({id:e.id,className:e.className,heading:e.querySelector('h1,h2')?.textContent.trim(),box:box(e)})),
          comparisons: [...document.querySelectorAll('main > section:nth-of-type(3) h3')].map(e=>({text:e.textContent.trim(),box:box(e)})),
          hero: document.querySelector('.landing-hero')?.innerText,
          faqs: [...document.querySelectorAll('.faq__question')].map(e=>({question:e.textContent.trim(),expanded:e.getAttribute('aria-expanded')})),
          links: [...document.querySelectorAll('.public-landing a')].map(e=>({text:e.textContent.trim(),label:e.getAttribute('aria-label'),href:e.getAttribute('href')})),
          video: {exists:!!document.querySelector('#zayd-demo video'),playDisabled:document.querySelector('#zayd-demo button')?.disabled},
          brokenImages: [...document.images].filter(e=>e.complete && e.naturalWidth===0).map(e=>e.src),
          bodyText: document.querySelector('.public-landing')?.innerText,
        };
      });
      fs.writeFileSync(path.join(out, `${name}-dom.json`), JSON.stringify(snapshot,null,2));
      report.viewports.push({ name,width,height,httpStatus:response.status(),documentWidth:snapshot.documentWidth,overflow:snapshot.documentWidth>width,faqCount:snapshot.faqs.length,video:snapshot.video,brokenImages:snapshot.brokenImages,fonts:await page.evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status}))) });
      if (name==='desktop') {
        for (const [label,selector] of [['video','#zayd-demo'],['comparison','main > section:nth-of-type(3)'],['curriculum','#curriculum'],['features','#personalized-learning'],['pricing','#pricing'],['schools','#schools'],['faq','#faq'],['footer','#footer']]) {
          await page.locator(selector).screenshot({path:path.join(out,`desktop-${label}.png`),animations:'disabled'});
        }
        await check('Desktop pricing anchor', async()=>{await page.getByRole('link',{name:'الأسعار',exact:true}).first().click();return await page.locator('#pricing').evaluate(e=>({top:e.getBoundingClientRect().top,scrollY:window.scrollY}));});
        await check('FAQ second item expands and first collapses',async()=>{const buttons=page.locator('.faq__question');await buttons.nth(1).click();if(await buttons.nth(1).getAttribute('aria-expanded')!=='true'||await buttons.first().getAttribute('aria-expanded')!=='false')throw Error('Unexpected FAQ expansion');return {count:await buttons.count(),secondExpanded:true,firstExpanded:false};});
        await check('FAQ item closes',async()=>{const button=page.locator('.faq__question').nth(1);await button.click();if(await button.getAttribute('aria-expanded')!=='false')throw Error('FAQ did not close');return 'second item collapsed';});
        await check('Hero Try CTA reaches login',async()=>{await page.locator('.landing-hero__button--primary').click();await page.waitForURL('**/login');return new URL(page.url()).pathname;});
        await page.goto(base,{waitUntil:'load'});
        await check('Existing pricing registration route behavior',async()=>{await page.locator('.pricing-card__action').first().click();await page.waitForURL(base+'/',{timeout:10000});return {requested:'/auth/register',observed:new URL(page.url()).pathname,expectedProductBehavior:false,note:'Existing dead conversion path: catch-all returns to Home; observation is not an acceptance pass.'};});
      }
      if(name==='mobile'||name==='tablet') {
        await check(`${name} menu opens`,async()=>{await page.getByRole('button',{name:'فتح القائمة',exact:true}).click();await page.locator('#landing-mobile-navigation').waitFor();await page.screenshot({path:path.join(out,`${name}-menu.png`),animations:'disabled'});return {expanded:await page.getByRole('button',{name:'إغلاق القائمة',exact:true}).getAttribute('aria-expanded'),links:await page.locator('#landing-mobile-navigation a').count()};});
        await check(`${name} menu Escape closes`,async()=>{await page.keyboard.press('Escape');if(await page.locator('#landing-mobile-navigation').count())throw Error('Menu remained open');return 'closed';});
        await check(`${name} Schools anchor closes menu`,async()=>{await page.getByRole('button',{name:'فتح القائمة',exact:true}).click();await page.locator('#landing-mobile-navigation a[href="#schools"]').click();if(await page.locator('#landing-mobile-navigation').count())throw Error('Menu remained open');return await page.locator('#schools').evaluate(e=>({top:e.getBoundingClientRect().top,scrollY:window.scrollY}));});
      }
      await context.close();
    }
  } finally {
    fs.writeFileSync(path.join(out,'baseline-report.json'),JSON.stringify(report,null,2));
    await browser.close();
  }
  console.log(JSON.stringify({base,viewports:report.viewports.map(v=>({name:v.name,status:v.httpStatus,overflow:v.overflow,faqs:v.faqCount})),interactions:report.interactions,pageErrors:report.pageErrors,failedRequests:report.failedRequests},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
