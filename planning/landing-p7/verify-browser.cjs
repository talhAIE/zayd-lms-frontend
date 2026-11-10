const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const expected = [
  { name: 'باقة المنهج', description: 'إذا كان هدفك تحسين أدائك في مناهج المدرسة', original: '299', price: '199', discount: 'خصم 33%', featured: false, action: 'ابدأ باقة المنهج', features: ['محتوى متوافق مع المنهج', 'ممارسة التحدث والاستماع والقراءة والكتابة', 'تعلّم مخصص', 'تغذية راجعة بالذكاء الاصطناعي'] },
  { name: 'Zayd Plus', description: 'التجربة الكاملة: المنهج الدراسي، والمواضيع والمواقف الحياتية.', original: '599', price: '299', discount: 'خصم 50%', featured: true, action: 'اختر Zayd Plus', features: ['جميع مزايا باقة المنهج', 'جميع مزايا Zayd Life', 'أكثر من 40 موقفًا حياتيًا', 'تجربة أشمل لبناء الثقة في استخدام اللغة'] },
  { name: 'Zayd Life', description: 'إذا كان هدفك استخدام الإنجليزية في الحياة اليومية', original: '299', price: '199', discount: 'خصم 33%', featured: false, action: 'ابدأ Zayd Life', features: ['أكثر من 40 موضوعًا حياتيًا', 'محادثات في المطعم والسوق والمطار وغيرها', 'ممارسة التحدث في المواقف اليومية', 'تغذية راجعة وتكرار المحاولة'] },
];
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
      const section = page.locator('#pricing');
      await section.scrollIntoViewIfNeeded();
      await section.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
      const data = await section.evaluate(el => {
        const text = x => x.textContent.replace(/\s+/g, ' ').trim();
        return {
          eyebrow: text(el.querySelector('.pricing__eyebrow')),
          heading: text(el.querySelector('h2')),
          subtitle: text(el.querySelector('.pricing__description')),
          cards: Array.from(el.querySelectorAll('article'), card => ({
            name: text(card.querySelector('h3')),
            description: text(card.querySelector('.pricing-card__description')),
            original: text(card.querySelector('del')),
            originalAccessible: card.querySelector('del').getAttribute('aria-label'),
            price: text(card.querySelector('.pricing-card__price strong')),
            annualBilling: text(card.querySelector('.pricing-card__billing')),
            riyalIcons: card.querySelectorAll('.pricing-card__riyal').length,
            numberDirections: Array.from(card.querySelectorAll('.pricing-card__price bdi, del bdi, .pricing-card__discount bdi'), x => x.dir),
            discount: text(card.querySelector('.pricing-card__discount')),
            features: Array.from(card.querySelectorAll('.pricing-card__features li'), text),
            action: text(card.querySelector('a')),
            href: card.querySelector('a').getAttribute('href'),
            featured: card.classList.contains('pricing-card--featured'),
            x: card.getBoundingClientRect().x, y: card.getBoundingClientRect().y,
          })),
          mascot: el.querySelector('.pricing-card__mascot img').getAttribute('src'),
          recommendation: text(el.querySelector('.pricing-card__recommendation')),
          oldPriceVisible: /99\.5|199\.5/.test(el.textContent),
          // The preserved mascot/recommendation intentionally extend outside the
          // featured card. Check visible text bounds and document scrolling,
          // rather than treating decorative overflow or sr-only text as clipping.
          overflow: Array.from(el.querySelectorAll('h2,h3,p,.pricing-card__features li,.pricing-card__action,.pricing-card__price,.pricing-card__discount,.pricing-card__original-price')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || x.scrollWidth > x.clientWidth + 1); }).map(x => x.className),
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const focus = [];
      for (const button of await section.locator('a').all()) {
        await button.focus();
        focus.push(await button.evaluate(el => ({ focused: el === document.activeElement, visibleOutline: getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2 })));
      }
      const checks = {
        preservedHeader: data.eyebrow === 'عرض لفترة محدودة' && data.heading === 'اختر التجربة المناسبة',
        exactSubtitle: data.subtitle === 'خصم يصل إلى 50% حاليًا على الباقات الثلاث للأفراد.',
        exactThreePlans: data.cards.length === 3 && data.cards.every((card, i) => ['name', 'description', 'original', 'price', 'discount', 'featured', 'action'].every(key => card[key] === expected[i][key])),
        existingBenefitsAndCountPreserved: data.cards.every((card, i) => JSON.stringify(card.features) === JSON.stringify(expected[i].features)),
        annualSarAndOriginalPriceText: data.cards.every(card => /^ريال سعودي\s*\/ سنة$/.test(card.annualBilling) && card.riyalIcons === 2 && card.originalAccessible === `السعر السابق: ${card.original} ريال سعودي` && card.numberDirections.every(dir => dir === 'ltr')),
        rtlOrderOrStack: width >= 700 ? data.cards[0].x > data.cards[1].x && data.cards[1].x > data.cards[2].x : data.cards[0].y < data.cards[1].y && data.cards[1].y < data.cards[2].y,
        plusVisualsPreserved: data.mascot.includes('pricing-mascot-reference.png') && data.recommendation === 'الأفضل قيمة' && data.cards[1].featured,
        noOldPrices: !data.oldPriceVisible,
        routingUnchangedAsRequested: data.cards.every(card => card.href === '/auth/register'),
        keyboardFocusVisible: focus.every(x => x.focused && x.visibleOutline),
        noOverflow: data.overflow.length === 0 && !data.pageOverflow,
        noPageErrors: errors.length === 0,
      };
      await section.locator('a').last().evaluate(el => el.blur());
      await section.screenshot({ path: path.join(__dirname, `pricing-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      if (width === 320) {
        await page.emulateMedia({ forcedColors: 'active' });
        await section.screenshot({ path: path.join(__dirname, 'pricing-320-forced-colors.png'), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      }
      results.push({ width, checks, data, focus, errors });
      await page.close();
    }
    const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-source-hashes.json')));
    const changed = Object.keys(before).filter(f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex') !== before[f]);
    const allowed = ['src/pages/public/pricing-section.tsx', 'src/pages/public/landing-content.ts'];
    const sourceScope = changed.length === 2 && changed.every(f => allowed.includes(f));
    const passed = sourceScope && results.every(x => Object.values(x.checks).every(Boolean));
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify({ verifiedAtUtc: new Date().toISOString(), results, changedExistingSourceFiles: changed, sourceScope, passed, routingRequirementComplete: false, routingNote: 'Known missing /auth/register route is preserved per explicit user deferral; preservation test does not certify a working destination.', faqNote: 'Existing package FAQ contains no prices; nine-question P9 FAQ implementation is untouched. P9 must reuse landingPricingPlans for amounts.' }, null, 2));
    console.log(JSON.stringify({ passed, sourceScope, viewports: results.map(({ width, checks }) => ({ width, checks })) }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
