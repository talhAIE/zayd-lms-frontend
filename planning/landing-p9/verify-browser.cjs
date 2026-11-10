const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const normalize = text => text.replace(/\s+/g, ' ').trim();
const plan = fs.readFileSync(path.join(root, 'LANDING_PAGE_IMPLEMENTATION_PLAN.md'), 'utf8');
const appendix = plan.split('## Appendix A — Complete supplied FAQ copy, in final order')[1].split('## Appendix B')[0];
const expected = Array.from(appendix.matchAll(/### (\d+)\. ([^\r\n]+)\r?\n\r?\n([\s\S]*?)(?=\r?\n### |$)/g), match => ({ question: normalize(match[2]), answer: normalize(match[3]), packages: Number(match[1]) === 7 ? match[3].trim().split(/\r?\n/).filter(x => x.startsWith('- ')).map(x => normalize(x.slice(2))) : undefined }));
if (expected.length !== 9) throw Error('Expected nine source FAQ entries');
const ids = ['name-origin', 'what-is-zayd', 'teacher-role', 'supported-grades', 'weekly-usage', 'ai-assessment', 'packages', 'schools-groups', 'teacher-account'];
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
      const faq = page.locator('#faq');
      await faq.scrollIntoViewIfNeeded();
      const data = await faq.evaluate(el => {
        const text = x => x.textContent.replace(/\s+/g, ' ').trim();
        return {
          badge: text(el.querySelector('.faq__eyebrow')), heading: Array.from(el.querySelectorAll('h2 > span'), text),
          defaultExpanded: Array.from(el.querySelectorAll('button[aria-expanded="true"]'), x => x.id),
          items: Array.from(el.querySelectorAll('.faq__item'), item => { const button = item.querySelector('button'), panel = item.querySelector('[role="region"]'); return { question: text(button), answer: text(panel), buttonId: button.id, controls: button.getAttribute('aria-controls'), panelId: panel.id, labelledBy: panel.getAttribute('aria-labelledby'), hidden: panel.hidden, packages: Array.from(panel.querySelectorAll('li'), li => ({ id: li.dataset.plan, text: text(li), price: li.querySelector('.faq__package-price bdi').textContent })) }; }),
          brands: Array.from(el.querySelectorAll('bdi[lang="en"]'), x => ({ text: x.textContent, direction: x.dir })),
          pricing: Array.from(document.querySelectorAll('.pricing-card'), x => ({ name: text(x.querySelector('h3')), price: text(x.querySelector('.pricing-card__price strong')) })),
          finalCta: { text: text(document.querySelector('#final-cta')), links: Array.from(document.querySelectorAll('#final-cta a'), x => ({ label: text(x), href: x.getAttribute('href') })) },
          footer: { text: text(document.querySelector('#footer')), links: Array.from(document.querySelectorAll('#footer a'), x => ({ label: text(x), href: x.getAttribute('href') })) },
        };
      });
      const interaction = [];
      for (const [index, id] of ids.entries()) {
        const button = page.locator(`#faq-question-${id}`);
        await button.focus();
        await button.press('Enter');
        const panel = page.locator(`#faq-answer-${id}`);
        const visible = await panel.isVisible();
        const expandedCount = await faq.locator('button[aria-expanded="true"]').count();
        const state = await button.getAttribute('aria-expanded');
        const focusVisible = await button.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2);
        const overflow = await faq.evaluate(el => Array.from(el.querySelectorAll('*')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || x.scrollWidth > x.clientWidth + 1); }).map(x => x.className));
        if (id === 'packages') await faq.screenshot({ path: path.join(__dirname, `faq-packages-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
        await button.press('Space');
        const closed = !(await panel.isVisible()) && await button.getAttribute('aria-expanded') === 'false';
        let tabOrder = true;
        if (index < ids.length - 1) { await button.press('Tab'); tabOrder = await page.locator(`#faq-question-${ids[index + 1]}`).evaluate(el => el === document.activeElement); }
        interaction.push({ id, opened: visible && state === 'true' && expandedCount === 1, closed, focusVisible, tabOrder, overflow });
      }
      await page.locator('#faq-question-what-is-zayd').click();
      await faq.screenshot({ path: path.join(__dirname, `faq-default-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      if (width === 320) {
        await page.emulateMedia({ forcedColors: 'active' });
        await faq.screenshot({ path: path.join(__dirname, 'faq-320-forced-colors.png'), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
        await page.emulateMedia({ forcedColors: 'none' });
      }
      if (width === 320 || width === 1440) {
        for (const selector of ['#final-cta', '#footer']) await page.locator(selector).screenshot({ path: path.join(__dirname, `${selector.slice(1)}-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      }
      const copyMatches = data.items.length === 9 && data.items.every((item, i) => item.question === expected[i].question && (i === 6 ? JSON.stringify(item.packages.map(x => x.text)) === JSON.stringify(expected[i].packages) : item.answer === expected[i].answer));
      const prices = data.items[6].packages;
      const checks = {
        nineExactQuestionsAndSuppliedAnswers: copyMatches,
        defaultWhatIsZaydPreserved: JSON.stringify(data.defaultExpanded) === JSON.stringify(['faq-question-what-is-zayd']),
        stableUniqueAssociations: new Set(data.items.flatMap(x => [x.buttonId, x.panelId])).size === 18 && data.items.every((x, i) => x.buttonId === `faq-question-${ids[i]}` && x.controls === x.panelId && x.labelledBy === x.buttonId),
        headerPreserved: data.badge === 'الأسئلــة الشائعــة' && JSON.stringify(data.heading) === JSON.stringify(['كل ما تحتاج معرفته', 'قبـــــــــــل البـــــــــــدء']),
        sharedPricesMatchCards: prices[0].id === 'curriculum' && prices[1].id === 'life' && prices[2].id === 'plus' && prices[0].price === data.pricing[0].price && prices[1].price === data.pricing[2].price && prices[2].price === data.pricing[1].price,
        englishNamesIsolated: data.brands.length >= 4 && data.brands.every(x => x.direction === 'ltr'),
        keyboardAccordionAllNine: interaction.every(x => x.opened && x.closed && x.focusVisible && x.tabOrder),
        noClippedAnswers: interaction.every(x => x.overflow.length === 0),
        priorCtaDestinationsPreserved: JSON.stringify(data.finalCta.links.map(x => x.href)) === JSON.stringify(['/auth/register', '/contact-us']),
        contactPlaceholdersPreserved: data.footer.links.some(x => x.href === 'mailto:info@youruniversity.com') && data.footer.links.some(x => x.href === 'tel:+966500000000'),
        noPageErrors: errors.length === 0,
      };
      results.push({ width, checks, data, interaction, errors });
      await page.close();
    }
    const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-source-hashes.json')));
    const changed = Object.keys(before).filter(f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex') !== before[f]);
    const allowed = ['src/pages/public/faq-section.tsx', 'src/pages/public/faq-section.css'];
    const sourceScope = changed.length === 2 && changed.every(f => allowed.includes(f));
    const passed = sourceScope && results.every(r => Object.values(r.checks).every(Boolean));
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify({ verifiedAtUtc: new Date().toISOString(), expectedCopySource: 'Updated PDF Appendix A transcription, ordinary Unicode; original P0 draft approval remains open.', results, changedApplicationFiles: changed, sourceScope, passed, businessApprovalImplied: false, invalidPrimaryRouteFixed: false, officialContactsSupplied: false }, null, 2));
    console.log(JSON.stringify({ passed, sourceScope, viewports: results.map(({ width, checks }) => ({ width, checks })) }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
