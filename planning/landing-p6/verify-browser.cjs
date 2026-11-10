const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const expectedCount = process.env.P6_TOPIC_COUNT || '40';
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const results = [];
    for (const width of [320, 390, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      for (const selector of ['.zayd-life', '.future-skills', '.impact-stats']) {
        const section = page.locator(selector);
        await section.scrollIntoViewIfNeeded();
        for (const img of await section.locator('img').all()) await img.evaluate(el => el.decode());
        await section.screenshot({ path: path.join(__dirname, `${selector.slice(1)}-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      }
      const data = await page.evaluate(async () => {
        const text = selector => document.querySelector(selector).textContent.replace(/\s+/g, ' ').trim();
        const style = selector => getComputedStyle(document.querySelector(selector));
        const frame = style('.zayd-life__container');
        const sprite = style('.zayd-life__artwork').backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
        const image = new Image(); image.src = sprite; await image.decode();
        const selectors = ['.zayd-life', '.future-skills', '.impact-stats'];
        return {
          frame: { background: frame.backgroundImage, border: frame.borderTopColor, borderWidth: frame.borderTopWidth, radius: frame.borderTopLeftRadius, padding: [frame.paddingTop, frame.paddingRight] },
          lifeBadge: text('.zayd-life__eyebrow'), lifeHeading: Array.from(document.querySelectorAll('.zayd-life__heading > span'), x => x.textContent).join(' '), lifeBody: text('.zayd-life__description'),
          lifeCallout: Array.from(document.querySelectorAll('.zayd-life__message > span'), x => x.textContent),
          brands: Array.from(document.querySelectorAll('.zayd-life__description bdi'), x => ({ text: x.textContent, direction: x.dir })),
          scenarios: Array.from(document.querySelectorAll('.zayd-life__scenario'), x => ({ label: x.querySelector('.zayd-life__label').textContent, position: x.querySelector('.zayd-life__artwork').style.backgroundPosition, x: x.getBoundingClientRect().x, y: x.getBoundingClientRect().y })),
          spriteLoaded: image.naturalWidth > 0,
          lifeControls: document.querySelector('.zayd-life').querySelectorAll('button, audio, [tabindex], a').length,
          futureBadge: text('.future-skills__eyebrow'), futureHeading: Array.from(document.querySelectorAll('.future-skills__heading > span'), x => x.textContent).join(' '), futureBody: text('.future-skills__description'),
          futureGradient: style('.future-skills__card').backgroundImage,
          futureTags: Array.from(document.querySelectorAll('.future-skills__tag'), x => ({ text: x.textContent, color: getComputedStyle(x).backgroundColor, x: x.getBoundingClientRect().x, y: x.getBoundingClientRect().y })),
          impactBadge: text('.impact-comparison__eyebrow'), impactHeading: Array.from(document.querySelectorAll('.impact-comparison__heading > span'), x => x.textContent),
          impactBody: text('.impact-comparison__description'), disclaimer: text('.impact-comparison__footnote'), disclaimerSize: parseFloat(style('.impact-comparison__footnote').fontSize),
          disclaimerAfterClaim: document.querySelector('.impact-comparison__description').nextElementSibling.classList.contains('impact-comparison__footnote'),
          impactAsset: document.querySelector('.impact-comparison__illustration > img').getAttribute('src'),
          metrics: Array.from(document.querySelectorAll('.impact-comparison__metric'), x => ({ value: x.querySelector('bdi').textContent, label: x.querySelector('span').textContent, icon: x.querySelector('img').getAttribute('src') })),
          overflow: selectors.flatMap(selector => Array.from(document.querySelector(selector).querySelectorAll('*')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || x.scrollWidth > x.clientWidth + 1); }).map(x => ({ section: selector, class: x.className }))),
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const labels = ['في المطار', 'في المطعم', 'في السوق', 'أثناء السفر', 'في المواقف الاجتماعية', 'ومواقف أخرى كثيرة'];
      const positions = ['100% 0%', '50% 0%', '0% 0%', '100% 100%', '50% 100%', '0% 100%'];
      const tags = ['الدراسة الجامعية', 'المعرفة العالمية', 'سوق العمل', 'التطوير المهني', 'التواصل الدولي'];
      const checks = {
        frameSpecified: data.frame.background === 'linear-gradient(135deg, rgb(240, 253, 250) 0%, rgb(224, 242, 254) 100%)' && data.frame.border === 'rgb(186, 230, 253)' && data.frame.borderWidth === '1px' && data.frame.radius === '28px' && (width < 850 || JSON.stringify(data.frame.padding) === JSON.stringify(['56px', '40px'])),
        lifePreserved: data.lifeBadge === 'من المنهج إلى الحياة' && data.lifeHeading === 'الإنجليزية لا تنتهي عند حدود الكتاب' && data.spriteLoaded && data.scenarios.every((x, i) => x.position === positions[i]),
        lifeBodyExactAtCurrentCount: data.lifeBody === `في Zayd Life و Zayd Plus، تمتد ممارسة الإنجليزية إلى أكثر من ${expectedCount} موضوعًا وموقفًا من الحياة اليومية، لتنمية القدرة على التواصل بثقة في مواقف حقيقية.`,
        calloutExactTwoSpans: JSON.stringify(data.lifeCallout) === JSON.stringify(['لأن الهدف ليس فقط أن يتعلم الإنجليزية،', 'بل القدرة على استخدامها في الحياة.']),
        scenariosExact: JSON.stringify(data.scenarios.map(x => x.label)) === JSON.stringify(labels),
        englishBrandsIsolated: data.brands.length === 2 && data.brands.every(x => x.direction === 'ltr'),
        noNewAudioOrInteraction: data.lifeControls === 0,
        futurePreserved: data.futureBadge === 'مهارة للمستقبل' && data.futureHeading === 'الإنجليزية ليست مادة دراسيــة فقــط' && data.futureGradient === 'linear-gradient(90deg, rgb(91, 212, 199) 0%, rgb(52, 129, 223) 100%)' && data.futureTags.every(x => x.color === 'rgb(255, 255, 255)'),
        futureBodyExact: data.futureBody === 'إتقان الإنجليزية يفتح آفاقًا أوسع للتعليم الجامعي والمعرفة والاستعداد لسوق العمل.',
        futureTagsExact: JSON.stringify(data.futureTags.map(x => x.text)) === JSON.stringify(tags),
        bottomPillsRtl: data.futureTags[3].x > data.futureTags[4].x && data.futureTags[3].y > data.futureTags[0].y,
        impactPreserved: data.impactBadge === 'نتيجــة فارقــة' && data.impactAsset.includes('section7.png'),
        impactHeadlineExact: JSON.stringify(data.impactHeading) === JSON.stringify(['عام واحد مع زيد يعادل نحو', '10 سنوات من ممارسة التحدث']),
        impactBodyExact: data.impactBody === 'يتيح زيد فرصًا مكثفة للتحدث بالإنجليزية، تعادل تقريبًا ما قد يحصل عليه خلال 10 سنوات في الفصل التقليدي.',
        disclaimerExactAdjacentReadable: data.disclaimer === 'المقارنة تتعلق بفرص ممارسة الإنجليزية، وليس بسنوات الدراسة.' && data.disclaimerAfterClaim && data.disclaimerSize >= 12,
        existingCountersPreservedNotNewlyVerified: JSON.stringify(data.metrics.map(({ value, label }) => ({ value, label }))) === JSON.stringify([{ value: '+1,000', label: 'طالب مسجل' }, { value: '+2,200', label: 'ساعة ممارسة' }, { value: '+8,600', label: 'درس منجز' }]),
        noOverflow: !data.overflow.length && !data.pageOverflow,
        noPageErrors: !errors.length,
      };
      if (width === 320) {
        await page.emulateMedia({ forcedColors: 'active' });
        for (const selector of ['.zayd-life', '.future-skills', '.impact-stats']) await page.locator(selector).screenshot({ path: path.join(__dirname, `${selector.slice(1)}-320-forced-colors.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      }
      results.push({ width, checks, data, errors });
      await page.close();
    }
    const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-source-hashes.json')));
    const changed = Object.keys(before).filter(f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex') !== before[f]);
    const allowed = ['zayd-life-section', 'future-skills-section', 'impact-stats-section'].flatMap(name => ['tsx', 'css'].map(ext => `src/pages/public/${name}.${ext}`));
    const sourceScope = changed.length === 6 && changed.every(f => allowed.includes(f));
    const passed = sourceScope && results.every(x => Object.values(x.checks).every(Boolean));
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify({ verifiedAtUtc: new Date().toISOString(), topicCountUnderTest: expectedCount, results, changedExistingSourceFiles: changed, sourceScope, passed, metricStatus: 'Preservation check only; D06 unverified business data is not approved by browser tests.' }, null, 2));
    console.log(JSON.stringify({ passed, sourceScope, viewports: results.map(({ width, checks }) => ({ width, checks })) }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
