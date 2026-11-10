const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const selectors = ['.landing-hero__visual', '.comparison-card', '.curriculum-overview__panel', '.personalized-learning__demo-list > li', '.personalized-learning__features > li', '.zayd-life__scenario', '.impact-comparison__illustration', '.impact-comparison__metric', '.pricing-card', '.dashboard-card'];
const output = __dirname;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const results = [];
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'no-preference' });
      await context.addInitScript(selectors => {
        window.__motion = [];
        window.__counts = {};
        const animate = Element.prototype.animate;
        Element.prototype.animate = function(frames, options) {
          const matches = selectors.filter(selector => this.matches(selector));
          if (matches.length) window.__motion.push({ matches, frames, duration: options.duration, delay: options.delay || 0 });
          return animate.call(this, frames, options);
        };
        const observed = new WeakSet();
        const attach = () => document.querySelectorAll('.landing-counter').forEach(counter => {
          if (observed.has(counter)) return;
          observed.add(counter);
          const value = counter.querySelector('.landing-counter__value');
          const key = counter.querySelector('.landing-counter__measure').textContent;
          const capture = () => { (window.__counts[key] ||= []).push(value.textContent); };
          capture(); new MutationObserver(capture).observe(value, { subtree: true, characterData: true, childList: true });
        });
        document.addEventListener('DOMContentLoaded', () => { attach(); new MutationObserver(attach).observe(document.body, { childList: true, subtree: true }); });
      }, selectors);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.landing-hero .landing-counter')).every(el => el.querySelector('.landing-counter__value').textContent === el.querySelector('.landing-counter__measure').textContent));
      const hero = await page.locator('.landing-hero .landing-counter__value').allTextContents();
      const replay = [];
      for (const selector of selectors) {
        const target = page.locator(selector).first();
        await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(70);
        const before = await page.evaluate(selector => window.__motion.filter(x => x.matches.includes(selector)).length, selector);
        await target.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1100);
        const first = await page.evaluate(selector => window.__motion.filter(x => x.matches.includes(selector)).length, selector);
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(70);
        if (selector === '.landing-hero__visual') {
          await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(70);
        }
        await target.scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        const second = await page.evaluate(selector => window.__motion.filter(x => x.matches.includes(selector)).length, selector);
        replay.push({ selector, firstEntry: first > before, replay: second > first });
      }
      await page.locator('.impact-comparison__metrics').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1700);
      const impact = await page.locator('.impact-comparison__metric .landing-counter__value').allTextContents();
      await page.locator('#curriculum').scrollIntoViewIfNeeded();
      await page.getByRole('tab', { name: 'القواعد', exact: true }).click();
      const tabAnimation = await page.locator('[role="tabpanel"]:not([hidden]) .curriculum-overview__screen img').evaluate(el => ({ name: getComputedStyle(el).animationName, duration: getComputedStyle(el).animationDuration }));
      await page.getByRole('tab', { name: 'القواعد', exact: true }).press('ArrowLeft');
      const keyboardTab = await page.getByRole('tab', { name: 'الاستماع', exact: true }).getAttribute('aria-selected');
      const faqButton = page.locator('#faq-question-weekly-usage');
      const panel = page.locator('#faq-answer-weekly-usage');
      await faqButton.scrollIntoViewIfNeeded();
      await faqButton.click();
      await page.waitForTimeout(100);
      const opening = await panel.evaluate(el => el.getBoundingClientRect().height);
      await page.waitForTimeout(350);
      const opened = await panel.evaluate(el => el.getBoundingClientRect().height);
      await faqButton.press('Space');
      await page.waitForTimeout(100);
      const closing = await panel.evaluate(el => el.getBoundingClientRect().height);
      await page.waitForTimeout(350);
      const closed = await panel.evaluate(el => el.getBoundingClientRect().height);
      const staticSections = await page.evaluate(() => ['.future-skills', '.schools', '#final-cta', '#footer'].map(selector => ({ selector, animations: document.querySelector(selector).getAnimations({ subtree: true }).length })));
      const motion = await page.evaluate(() => window.__motion);
      const history = await page.evaluate(() => window.__counts);
      const blur = motion.filter(x => x.matches.includes('.comparison-card'));
      const stagger = motion.filter(x => x.matches.includes('.personalized-learning__demo-list > li'));
      const sample = history['+250'] || [];
      const numeric = value => Number(value.replace(/[^\d]/g, ''));
      const checks = {
        heroFinalValues: hero.includes('+250') && hero.includes('×10'),
        realCountUpFrames: sample.some(x => numeric(x) === 0) && sample.some(x => numeric(x) > 0 && numeric(x) < 250) && sample.includes('+250'),
        impactFinalValues: JSON.stringify(impact) === JSON.stringify(['+1,000', '+2,200', '+8,600']),
        allRequestedRevealsReplay: replay.every(x => x.firstEntry && x.replay),
        quickBlur: blur.length > 0 && blur.every(x => x.duration === 500 && x.frames[0].filter === 'blur(5px)'),
        staggeredCards: new Set(stagger.map(x => x.delay)).size >= 2 && stagger.every(x => x.duration === 650),
        tabPreviewMovement: tabAnimation.name === 'landing-preview-enter' && tabAnimation.duration === '0.4s' && keyboardTab === 'true',
        smoothAccordionBothDirections: opening > 0 && opening < opened && closing > 0 && closing < opened && closed === 0,
        staticSectionsUnanimated: staticSections.every(x => x.animations === 0),
        noPageErrors: errors.length === 0,
      };
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(70);
      const reduced = await page.evaluate(selectors => ({ active: selectors.flatMap(selector => Array.from(document.querySelectorAll(selector))).reduce((total, el) => total + el.getAnimations().length, 0), counters: Array.from(document.querySelectorAll('.landing-counter'), el => ({ value: el.querySelector('.landing-counter__value').textContent, target: el.querySelector('.landing-counter__measure').textContent })), tab: getComputedStyle(document.querySelector('.curriculum-overview__screen img')).animationName, dropdown: getComputedStyle(document.querySelector('.faq__answer-collapse')).transitionDuration }), selectors);
      checks.reducedMotionSettlesImmediately = reduced.active === 0 && reduced.counters.every(x => x.value === x.target) && reduced.tab === 'none' && reduced.dropdown === '0s';
      await page.locator('#faq-question-packages').click();
      await page.locator('#faq').screenshot({ path: path.join(output, `motion-faq-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      results.push({ width, checks, replay, hero, impact, history, accordion: { opening, opened, closing, closed }, reduced, staticSections, errors });
      await context.close();
    }
    const reducedPage = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    await reducedPage.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
    const reducedOnLoad = await reducedPage.locator('.landing-counter').evaluateAll(elements => elements.every(el => el.querySelector('.landing-counter__value').textContent === el.querySelector('.landing-counter__measure').textContent));
    await reducedPage.close();
    const passed = reducedOnLoad && results.every(r => Object.values(r.checks).every(Boolean));
    fs.writeFileSync(path.join(output, 'landing-motion-verification.json'), JSON.stringify({ passed, reducedOnLoad, results }, null, 2));
    console.log(JSON.stringify({ passed, reducedOnLoad, results: results.map(({ width, checks, replay, accordion }) => ({ width, checks, replay, accordion })) }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
