const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const results = [];
    for (const width of [320, 390, 768, 820, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const nav = page.locator('.landing-nav');
      const navData = await nav.evaluate(el => ({
        actions: Array.from(el.querySelectorAll('.landing-nav__action'), x => ({ label: x.textContent.trim(), font: parseFloat(getComputedStyle(x).fontSize), height: x.getBoundingClientRect().height })),
        links: Array.from(el.querySelectorAll('.landing-nav__link'), x => ({ font: parseFloat(getComputedStyle(x).fontSize), rect: { x: x.getBoundingClientRect().x, width: x.getBoundingClientRect().width } })),
        bounds: Array.from(el.querySelectorAll('*')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || (x.scrollWidth > x.clientWidth + 1 && !(x.matches('.comparison-card') && getComputedStyle(x).overflow === 'hidden'))); }).map(x => x.className),
      }));
      const hero = await page.locator('.landing-hero__description').evaluate(el => ({ text: el.textContent.replace(/\s+/g, ' ').trim(), weight: getComputedStyle(el).fontWeight, brandWeight: getComputedStyle(el.querySelector('strong')).fontWeight }));
      let menuWorking = true;
      if (width < 820) {
        const toggle = nav.getByRole('button', { name: 'فتح القائمة' });
        await toggle.click();
        menuWorking = await page.locator('#landing-mobile-navigation').isVisible();
        if (width === 320 || width === 390) await nav.screenshot({ path: path.join(__dirname, `nav-menu-${width}.png`), animations: 'disabled' });
        await page.keyboard.press('Escape');
        menuWorking = menuWorking && await nav.getByRole('button', { name: 'فتح القائمة' }).getAttribute('aria-expanded') === 'false';
      }
      await nav.screenshot({ path: path.join(__dirname, `nav-${width}.png`), animations: 'disabled' });
      const comparison = page.locator('.classroom-comparison');
      await comparison.scrollIntoViewIfNeeded();
      const comparisonData = await comparison.evaluate(el => ({
        headings: Array.from(el.querySelectorAll('article h3'), x => x.textContent),
        diagrams: el.querySelectorAll('.comparison-card__illustration').length,
        connections: Array.from(el.querySelectorAll('.comparison-card__illustration svg'), x => x.getAttribute('class')),
        body: Array.from(el.querySelectorAll('.comparison-card__description'), x => x.textContent.replace(/\s+/g, ' ').trim()),
        overflow: Array.from(el.querySelectorAll('*')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || (x.scrollWidth > x.clientWidth + 1 && !(x.matches('.comparison-card') && getComputedStyle(x).overflow === 'hidden'))); }).map(x => typeof x.className === 'string' ? x.className : x.tagName),
      }));
      if ([320, 1024, 1440].includes(width)) await comparison.screenshot({ path: path.join(__dirname, `comparison-${width}.png`), animations: 'disabled', style: '.landing-nav { visibility: hidden !important; }' });
      await page.getByRole('button', { name: 'شاهد نموذج الشهادة' }).click();
      const dialog = page.getByRole('dialog', { name: 'شهادة تقدير وشارة إنجاز' });
      await dialog.waitFor({ state: 'visible' });
      await dialog.locator('img').evaluate(img => img.decode());
      const certificate = await dialog.evaluate(el => {
        const name = el.querySelector('.personalized-learning__certificate-name');
        const image = el.querySelector('.personalized-learning__certificate img');
        const n = name.getBoundingClientRect(), i = image.getBoundingClientRect();
        return { name: name.textContent, visible: getComputedStyle(name).visibility === 'visible', x: n.x, y: n.y, bottom: n.bottom, font: getComputedStyle(name).fontSize, image: { x: i.x, y: i.y, width: i.width, height: i.height }, inside: n.left >= i.left && n.right <= i.right && n.top >= i.top && n.bottom <= i.bottom, aboveNameLine: n.bottom <= i.top + i.height * .616 + 2 };
      });
      if (width === 320 || width === 1440) await dialog.screenshot({ path: path.join(__dirname, `certificate-${width}.png`), animations: 'disabled' });
      await page.keyboard.press('Escape');
      const contacts = await page.locator('.site-footer__contact a').evaluateAll(links => links.map(x => ({ text: x.textContent.trim(), href: x.getAttribute('href'), dir: x.querySelector('span').dir })));
      if (width === 320 || width === 1440) await page.locator('#footer').screenshot({ path: path.join(__dirname, `footer-${width}.png`), animations: 'disabled' });
      const checks = {
        largerReadableNav: navData.actions.length === 2 && navData.actions.every(x => x.font >= 13 && x.height >= 36) && navData.links.every(x => x.font === 16),
        navFits: navData.bounds.length === 0,
        mobileMenuWorks: menuWorking,
        exactHeroCopyBold: hero.text === 'زيد معلّم ذكي لممارسة اللغة الإنجليزية، يمنح كل طالب تجربة مخصصة للتحدث والقراءة والاستماع والكتابة، مع تغذية راجعة فورية ومحتوى متناغم مع ما يتعلمه في المدرسة.' && Number(hero.weight) >= 700 && Number(hero.brandWeight) >= 800,
        comparisonInfographicsDiffer: comparisonData.diagrams === 6 && comparisonData.connections[0] !== comparisonData.connections[3],
        comparisonCopyPreserved: JSON.stringify(comparisonData.headings) === JSON.stringify(['معلم واحد ... وعشرات الطلاب', 'لكل طالب مساحة لممارسة الإنجليزية']) && comparisonData.body[0] === 'مهما بلغت كفاءة المعلم، يظل وقت الحصة محدودًا، مما يقلل فرص ممارسة الإنجليزية بصورة فردية منتظمة لكل طالب.' && comparisonData.body[1] === 'زيد يعزز دور المعلم، ويمنح لكل طالب فرصًا لممارسة الإنجليزية وفق مستواه وسرعته.',
        comparisonFits: !comparisonData.overflow.length,
        certificateNameCorrect: certificate.name === 'ZAYD' && certificate.visible && certificate.inside && certificate.aboveNameLine,
        suppliedContactsExact: contacts.length === 2 && contacts[0].text === 'contact@waaha.ai' && contacts[0].href === 'mailto:contact@waaha.ai' && contacts[1].text === '+966 58 278 8984' && contacts[1].href === 'tel:+966582788984' && contacts.every(x => x.dir === 'ltr'),
        noPageErrors: !errors.length,
      };
      results.push({ width, checks, navData, hero, comparisonData, certificate, contacts, errors });
      await page.close();
    }
    const motion = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await motion.addInitScript(() => { window.comparisonTimings = []; const animate = Element.prototype.animate; Element.prototype.animate = function(frames, options) { if (this.matches('.comparison-card')) window.comparisonTimings.push(options.duration); return animate.call(this, frames, options); }; });
    await motion.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
    const navEnter = await motion.locator('.landing-nav').evaluate(el => getComputedStyle(el).animationName === 'landing-nav-enter');
    const button = motion.locator('.landing-nav__action').last();
    await button.hover(); await motion.waitForTimeout(300);
    const buttonMotion = await button.evaluate(el => getComputedStyle(el).translate === '0px -2px');
    await motion.locator('.comparison-card').first().scrollIntoViewIfNeeded();
    await motion.waitForTimeout(1800);
    const slower = await motion.evaluate(() => window.comparisonTimings.length > 0 && window.comparisonTimings.every(x => x === 700));
    await motion.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await motion.locator('.landing-nav').evaluate(el => getComputedStyle(el).animationName === 'none');
    const passed = results.every(r => Object.values(r.checks).every(Boolean)) && navEnter && buttonMotion && slower && reduced;
    fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify({ passed, results, motion: { navEnter, buttonMotion, slowerComparison: slower, reduced }, contactActionsInvoked: false }, null, 2));
    console.log(JSON.stringify({ passed, motion: { navEnter, buttonMotion, slower, reduced }, results: results.map(({ width, checks }) => ({ width, checks })) }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
