// Responsive browser regression. Run with Playwright available on NODE_PATH.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const cues=require('../src/components/avatar-reading/readingNarrationCues.json');
const base=process.env.AVATAR_QA_URL||'http://127.0.0.1:5188';
const out=path.resolve(process.env.AVATAR_QA_OUTPUT||'../outputs/avatar-workspace-qa');fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const context=await browser.newContext();
    await context.addInitScript(()=>{
      window.__avatarAudio=[];
      const Audio=window.Audio;
      window.Audio=function(...args){const audio=new Audio(...args);window.__avatarAudio.push(audio);return audio;};
      window.Audio.prototype=Audio.prototype;
    });
    const page=await context.newPage();const errors=[];
    const assertTextHighlight=async()=>{
      await page.locator('mark[data-avatar-speaking-text]').first().waitFor();
      const state=await page.evaluate(()=>({
        marks:Array.from(document.querySelectorAll('mark[data-avatar-speaking-text]')).map(node=>({display:getComputedStyle(node).display,controls:node.querySelectorAll('button').length,text:node.textContent.trim()})),
        paintedContainers:document.querySelectorAll('.avatar-workspace-panel [class*="ring-amber"], .avatar-workspace-panel [class*="!bg-amber"]').length,
      }));
      assert.equal(state.paintedContainers,0,'Highlight must not paint a container');
      assert(state.marks.every(mark=>mark.display==='inline'&&mark.controls===0&&mark.text),'Only inline spoken text should be highlighted');
    };
    page.on('pageerror',error=>errors.push(error.message));
    // Use the same authored recordings downloaded for offline alignment when available.
    await page.route('**/topic-audio/*.wav',async route=>{
      const entry=Object.entries(cues).find(([,v])=>v.audioUrl===route.request().url());
      const file=entry&&path.resolve('../zayd-lms-backend/outputs/avatar-timings',entry[0]+'.wav');
      if(file&&fs.existsSync(file)) {
        const bytes=fs.readFileSync(file),range=route.request().headers().range?.match(/bytes=(\d+)-(\d*)/);
        if(range){const start=Number(range[1]),end=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);
          await route.fulfill({status:206,body:bytes.subarray(start,end+1),contentType:'audio/wav',headers:{'accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${bytes.length}`}});
        }else await route.fulfill({body:bytes,contentType:'audio/wav',headers:{'accept-ranges':'bytes'}});
      }else await route.continue();
    });
    const cachedVideo=path.join(out,'avatar.mp4');
    if(fs.existsSync(cachedVideo))await page.route('**/*.mp4',async route=>route.fulfill({path:cachedVideo,contentType:'video/mp4'}));
    for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900},{width:844,height:390}]){
      await page.setViewportSize(viewport);
      for(const mode of ['reading','listening','roleplay']){
        await page.goto(`${base}/avatar-workspace-harness.html?mode=${mode}`);
        await page.locator('.avatar-workspace-panel').waitFor();
        const geometry=await page.evaluate(()=>{
          const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height};};
          return{avatar:rect('.avatar-workspace-avatar'),panel:rect('.avatar-workspace-panel'),height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,scrollHeight:document.documentElement.scrollHeight};
        });
        assert(!geometry.overflow,`${mode} horizontal overflow`);
        if(viewport.height>500) {
          const framing=await page.locator('.avatar-workspace-stage').evaluate(node=>{const r=node.getBoundingClientRect();return r.width/r.height;});
          assert(Math.abs(framing-1.42)<0.05,`${mode} framing changed between desktop and mobile: ${framing}`);
        }
        assert(geometry.avatar.bottom<=geometry.panel.top+1,`${mode} avatar moved from above`);
        assert(geometry.panel.height>=65,`${mode} panel too short ${JSON.stringify(geometry)}`);
        assert(geometry.panel.bottom<=viewport.height+1,`${mode} below viewport ${JSON.stringify(geometry)}`);
        const before=await page.locator('.avatar-workspace-avatar').boundingBox();
        await page.locator('.avatar-workspace-panel').evaluate(node=>{node.scrollTop=200;});
        assert.deepEqual(await page.locator('.avatar-workspace-avatar').boundingBox(),before,`${mode} avatar scrolled`);
        if(viewport.width===390){
          if(fs.existsSync(cachedVideo))await page.locator('video').evaluate(video=>new Promise(resolve=>{if(video.readyState>=2)resolve();else video.addEventListener('loadeddata',resolve,{once:true});}));
          await page.screenshot({path:path.join(out,`${mode}-mobile.png`)});
        }
        if(mode==='reading'){
          await page.waitForFunction(()=>window.__avatarAudio.some(a=>Number.isFinite(a.duration)&&a.duration>1));
          await page.evaluate(async()=>{const a=window.__avatarAudio.find(a=>a.src.includes('topic-audio'));await a.play();a.pause();a.currentTime=52;});
          await page.waitForFunction(()=>document.querySelector('[data-narration-sentence="8"][aria-current="true"]'));
          const scroll=await page.locator('[data-avatar-passage-scroll]').evaluate(node=>({top:node.scrollTop,height:node.clientHeight,scrollHeight:node.scrollHeight}));
          if(scroll.scrollHeight>scroll.height+50)await page.waitForFunction(()=>document.querySelector('[data-avatar-passage-scroll]').scrollTop>0);
          assert.deepEqual(await page.locator('.avatar-workspace-avatar').boundingBox(),before,'Highlight moved avatar');
          await page.locator('[data-avatar-passage-scroll]').dispatchEvent('wheel',{deltaY:-80});
          const manualTop=await page.locator('[data-avatar-passage-scroll]').evaluate(node=>{node.scrollTo({top:0,behavior:'instant'});return node.scrollTop;});
          await page.evaluate(()=>{const a=window.__avatarAudio.find(a=>a.src.includes('topic-audio'));a.currentTime=69;});
          await page.waitForFunction(()=>document.querySelector('[data-narration-sentence="11"][aria-current="true"]'));
          assert.equal(await page.locator('[data-avatar-passage-scroll]').evaluate(node=>node.scrollTop),manualTop,'Manual reading was overridden');
          await page.getByRole('button',{name:'Follow narration'}).click();
          await page.evaluate(()=>{const a=window.__avatarAudio.find(a=>a.src.includes('topic-audio'));a.currentTime=0;a.dispatchEvent(new Event('seeked'));});
          await page.waitForFunction(()=>document.querySelector('[data-narration-sentence="0"][aria-current="true"]'));
          if(viewport.width===390)await page.screenshot({path:path.join(out,'reading-highlight-mobile.png')});
        }
        if(mode==='roleplay'){
          await page.getByRole('button',{name:'Play AI response',exact:true}).last().click();
          await page.locator('[data-avatar-message][aria-current="true"]').waitFor();
          await assertTextHighlight();
          assert.deepEqual(await page.locator('.avatar-workspace-avatar').boundingBox(),before,'Roleplay speech moved avatar');
          await page.getByRole('button',{name:'Stop AI response',exact:true}).click();
          await page.waitForFunction(()=>!document.querySelector('[data-avatar-message][aria-current="true"]'));
          assert.equal(await page.locator('mark[data-avatar-speaking-text]').count(),0);
        }
        if(mode==='listening'){
          await page.getByRole('button',{name:'Play narrator text',exact:true}).click();
          await page.locator('.avatar-workspace-panel [aria-current="true"]').waitFor();
          await assertTextHighlight();
          assert.deepEqual(await page.locator('.avatar-workspace-avatar').boundingBox(),before,'Listening instruction moved avatar');
          await page.getByRole('button',{name:'Pause narrator text',exact:true}).click();
          await page.waitForFunction(()=>!document.querySelector('mark[data-avatar-speaking-text]'));
        }
        console.log(`${mode} ${viewport.width}x${viewport.height}: visible avatar + internal workspace passed`);
      }
    }
    // Scenario playback paints only passage text, not its card or Next control.
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${base}/avatar-workspace-harness.html?mode=roleplay&stage=scenario`);
    await page.getByRole('button',{name:'Play roleplay scenario audio',exact:true}).click();
    await assertTextHighlight();
    await page.screenshot({path:path.join(out,'roleplay-scenario-text-highlight.png')});
    await page.getByRole('button',{name:'Pause roleplay scenario audio',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('mark[data-avatar-speaking-text]'));
    // Check the independently aligned second passage too.
    await page.goto(`${base}/avatar-workspace-harness.html?mode=reading&topic=second`);
    await page.waitForFunction(()=>window.__avatarAudio.some(a=>Number.isFinite(a.duration)&&a.duration>1));
    await page.evaluate(async()=>{const a=window.__avatarAudio.find(a=>a.src.includes('topic-audio'));await a.play();a.pause();a.currentTime=22;});
    await page.waitForFunction(()=>document.querySelector('[data-narration-sentence="5"][aria-current="true"]'));
    // Practice uses the same video element, with exclusive passage/AI ownership.
    for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
      await page.setViewportSize(viewport);
      await page.goto(`${base}/avatar-workspace-harness.html?mode=reading&stage=practice`);
      await page.getByRole('button',{name:'Play AI response',exact:true}).waitFor();
      await page.getByRole('button',{name:'Play AI response',exact:true}).click();
      await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.loop&&v.playbackRate===1;});
      await page.getByRole('button',{name:'Pause AI response',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('video').paused);
      await page.getByRole('button',{name:'Play AI response',exact:true}).click();
      await page.waitForFunction(()=>!document.querySelector('video').paused);
      // A learner's recording must not animate the avatar.
      await page.getByRole('button',{name:'Play your spoken response',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('video').paused);
      await page.getByRole('button',{name:'Play passage',exact:true}).click();
      await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&!v.loop;});
      await page.getByRole('button',{name:'Play AI response',exact:true}).click();
      await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.loop&&v.playbackRate===1;});
      await page.getByRole('button',{name:'Pause AI response',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('video').paused);
      if(viewport.width===1440)await page.screenshot({path:path.join(out,'reading-practice-desktop.png')});
      console.log(`Reading practice ${viewport.width}: sentence play/pause/resume, learner exclusion and passage handoff passed`);
    }
    assert.deepEqual(errors,[]);
    console.log('Both authored passages: actual audio duration, cue selection, restart, panel-only scrolling and follow control passed.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
