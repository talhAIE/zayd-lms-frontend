const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const expected = [
  ['تعلم مخصص', 'يتكيف مع مستوى الطالب واحتياجه.', '100% 0%'],
  ['تغذية راجعة فورية', 'ملاحظات ذكية لتحسين الأداء.', '50% 0%'],
  ['ممارسة التحدث', 'تطور مهارات النطق والتحدث.', '0% 0%'],
  ['تحسين النطق', 'تدريبات لتطوير النطق والطلاقة.', '100% 100%'],
  ['تكرار دون حدود', 'محاولات متكررة حتى الإتقان.', '50% 100%'],
  ['بيئة آمنة للتعلم', 'ممارسة الإنجليزية بثقة دون خوف من الخطأ.', '0% 100%'],
];
const demoNames = [['وضع المحادثة', 'Try Roleplay Mode'], ['وضع الاستماع', 'Try Listening Mode'], ['وضع القراءة', 'Try Reading Mode'], ['وضع القواعد', 'Try Grammar Mode'], ['وضع الكتابة', 'Try Writing Mode'], ['وضع المفردات', 'Try Vocabulary Mode']];
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];
  const demoResults = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#personalized-learning');
    await section.scrollIntoViewIfNeeded();
    await section.locator('.personalized-learning__figure img').evaluate(img => img.decode());
    const data = await section.evaluate(el => ({
      heading: Array.from(el.querySelectorAll('h2 > span'), x => x.textContent),
      subtitle: el.querySelector('.personalized-learning__description').textContent.trim(),
      benefits: Array.from(el.querySelectorAll('.personalized-learning__cards > li'), x => ({ title: x.querySelector('h3').textContent, body: x.querySelector('p').textContent, iconPosition: x.querySelector('.personalized-learning__icon').style.backgroundPosition, iconLoaded: getComputedStyle(x.querySelector('.personalized-learning__icon')).backgroundImage.includes('personalized-feature-icons'), x: x.getBoundingClientRect().x, y: x.getBoundingClientRect().y, controls: x.querySelectorAll('button,a').length })),
      avatar: el.querySelector('.personalized-learning__figure img').getAttribute('src'),
      demoButtons: el.querySelectorAll('.personalized-learning__demo-list button').length,
      proposedClaimsVisible: /CEFR|A1–C2|3D Avatar|شهادات وشارات إنجاز|نقاط ومكافآت تحفيزية/.test(el.textContent),
      overflow: Array.from(el.querySelectorAll('*')).filter(x => { const r = x.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1 || x.scrollWidth > x.clientWidth + 1; }).map(x => x.className),
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
    }));
    const checks = {
      headingPreserved: JSON.stringify(data.heading) === JSON.stringify(['كل طالب يتعلم', 'ويتحدث بطريقته']),
      subtitleExact: data.subtitle === 'يمنح زيد كل طالب تجربة تفاعلية تتكيف مع مستواه، وتساعده على ممارسة الإنجليزية والتحسن باستمرار.',
      allSixBenefitsExact: data.benefits.length === 6 && data.benefits.every((x, i) => x.title === expected[i][0] && x.body === expected[i][1]),
      correctOriginalIcons: data.benefits.every((x, i) => x.iconPosition === expected[i][2] && x.iconLoaded),
      benefitsNotReplacedByDemos: data.benefits.every(x => x.controls === 0) && data.demoButtons === 6,
      avatarPreserved: data.avatar.includes('section5.png'),
      unapprovedAdditionsAbsent: !data.proposedClaimsVisible,
      noOverflow: data.overflow.length === 0 && !data.pageOverflow,
      rtlThreeColumnOrder: width < 560 || (data.benefits[0].x > data.benefits[1].x && data.benefits[1].x > data.benefits[2].x && data.benefits[3].x > data.benefits[4].x && data.benefits[4].x > data.benefits[5].x && data.benefits[3].y > data.benefits[0].y),
      noPageErrors: errors.length === 0,
    };
    await section.screenshot({ path: path.join(__dirname, `personalized-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
    if (width === 320) {
      await page.emulateMedia({ forcedColors: 'active' });
      await section.screenshot({ path: path.join(__dirname, 'personalized-320-forced-colors.png'), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      await page.emulateMedia({ forcedColors: 'none' });
    }
    if (width === 1440 || width === 320) {
      for (const [name, dialogName] of demoNames) {
        const button = section.getByRole('button', { name: new RegExp(name) });
        await button.scrollIntoViewIfNeeded();
        await button.focus();
        await button.press('Enter');
        const dialog = page.getByRole('dialog', { name: dialogName, exact: true });
        await dialog.waitFor({ state: 'visible', timeout: 20000 });
        await dialog.locator('button').nth(1).waitFor({ state: 'visible', timeout: 20000 });
        const content = (await dialog.innerText()).slice(0, 650);
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        // Existing modals are controlled dialogs without Radix Trigger elements;
        // focus restoration is observed, not changed as part of P4.
        demoResults.push({ width, name, dialogName, keyboardOpened: true, renderedContent: content, escapeClosed: true, noPageErrors: errors.length === 0 });
        console.log(`Verified ${width}px ${dialogName}`);
      }
    }
    results.push({ width, checks, data, errors });
    await page.close();
  }
  await browser.close();
  const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-source-hashes.json')));
  const changed = Object.keys(before).filter(f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex') !== before[f]);
  const allowed = ['src/pages/public/personalized-learning-section.tsx', 'src/pages/public/personalized-learning-section.css'];
  const sourceScope = changed.length === 2 && changed.every(f => allowed.includes(f));
  const passed = sourceScope && results.every(x => Object.values(x.checks).every(Boolean)) && demoResults.length === 12 && demoResults.every(x => x.keyboardOpened && x.escapeClosed && x.noPageErrors);
  fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify({ verifiedAtUtc: new Date().toISOString(), results, demoResults, changedExistingSourceFiles: changed, sourceScope, passed }, null, 2));
  console.log(JSON.stringify({ passed, sourceScope, checks: results.map(({ width, checks }) => ({ width, checks })), demoChecks: demoResults.map(({ width, name, keyboardOpened, escapeClosed, noPageErrors }) => ({ width, name, keyboardOpened, escapeClosed, noPageErrors })) }, null, 2));
  process.exitCode = passed ? 0 : 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
