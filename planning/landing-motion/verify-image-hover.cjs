const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
    const results = [];
    const targets = [
      ['hero', '.landing-hero__visual', '.landing-hero__teacher'],
      ['curriculum', '.curriculum-overview__screen img', '.curriculum-overview__screen img'],
      ['personalized', '.personalized-learning__figure img', '.personalized-learning__figure img'],
      ['demo icon', '.personalized-learning__demo-entry', '.personalized-learning__demo-entry img'],
      ['life illustration', '.zayd-life__artwork', '.zayd-life__artwork'],
      ['impact artwork', '.impact-comparison__illustration > img', '.impact-comparison__illustration > img'],
      ['metric icon', '.impact-comparison__metric img', '.impact-comparison__metric img'],
      ['pricing mascot', '.pricing-card__mascot img', '.pricing-card__mascot img'],
      ['school artwork', '.schools__visual img', '.schools__visual img'],
      ['footer mascot', '.site-footer__character img', '.site-footer__character img'],
      ['footer logo', '.site-footer__logo', '.site-footer__logo'],
      ['nav logo', '.public-landing header img', '.public-landing header img'],
    ];
    for (const [name, hoverSelector, imageSelector] of targets) {
      const target = page.locator(hoverSelector).first();
      const image = page.locator(imageSelector).first();
      await target.scrollIntoViewIfNeeded();
      await target.hover();
      await page.waitForTimeout(420);
      const hover = await image.evaluate(el => ({ scale: getComputedStyle(el).scale, translate: getComputedStyle(el).translate, transition: getComputedStyle(el).transitionDuration }));
      await page.mouse.move(5, 5);
      await page.waitForTimeout(420);
      const resting = await image.evaluate(el => ({ scale: getComputedStyle(el).scale, translate: getComputedStyle(el).translate }));
      results.push({ name, hover, resting, passed: hover.scale === '1.025' && resting.scale === 'none' });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.schools__visual img').hover();
    const reduced = await page.locator('.schools__visual img').evaluate(el => getComputedStyle(el).scale === 'none' && getComputedStyle(el).translate === 'none');
    const touch = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
    await touch.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
    const touchStatic = await touch.locator('.landing-hero__teacher').evaluate(el => getComputedStyle(el).scale === 'none');
    const passed = reduced && touchStatic && !errors.length && results.every(x => x.passed);
    fs.writeFileSync(path.join(__dirname, 'image-hover-verification.json'), JSON.stringify({ passed, results, reduced, touchStatic, errors }, null, 2));
    console.log(JSON.stringify({ passed, results, reduced, touchStatic, errors }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
