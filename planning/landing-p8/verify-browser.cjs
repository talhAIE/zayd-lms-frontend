const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const expectedCards = [
  { title: 'للإدارة المدرسية: رؤية شاملة', points: ['لوحة تحكم إدارية: تتيح لك متابعة أداء جميع الفصول والمعلمين في مكان واحد.', 'تقارير فورية: قياس دقيق لمستوى تطور الطلاب ومدى تفاعل المعلمين مع النظام.', 'قرارات مبنية على البيانات: اكتشف نقاط الضعف في المنهج وعالجها قبل الاختبارات.'] },
  { title: 'للمعلم: متابعة أسهل بجهد أقل', points: ['مؤشرات الألوان: تصنيف ذكي للطلاب (أخضر، أصفر، أحمر) لمعرفة من يحتاج للمساعدة فوراً.', 'تنبيهات سريعة: إرسال توجيهات (Nudges) للطلاب المتعثرين بضغطة زر.', 'الذكاء الاصطناعي كمساعد: زيد يتولى التصحيح والتقييم، لتتفرغ أنت للتوجيه والدعم.'] },
  { title: 'للطلاب: متعة الممارسة والتحدي', points: ['نظام نقاط تنافسي: تحويل الممارسة اليومية إلى تحدٍ ممتع يكافئ الطالب على استمراريته.', 'لوحات شرف أسبوعية: إبراز أفضل 20 طالباً لتحفيز التنافس الإيجابي.', 'مكافآت قابلة للاستبدال: يمكن للطلاب استبدال نقاطهم بمكافآت أو امتيازات داخل الفصل، مما يحفز المعلمين والطلاب معاً.'] },
];
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const results = [];
    let contactCheck;
    for (const width of [320, 390, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const schools = page.locator('#schools');
      await schools.scrollIntoViewIfNeeded();
      await schools.locator('img').evaluate(img => img.decode());
      const cta = schools.getByRole('link', { name: 'اطلب عرضًا لمدرستك' });
      await cta.focus();
      const focusVisible = await cta.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2);
      await cta.evaluate(el => el.blur());
      for (const selector of ['.schools', '.smart-dashboards', '.practice-callout']) {
        await page.locator(selector).screenshot({ path: path.join(__dirname, `${selector.slice(1)}-${width}.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      }
      const data = await page.evaluate(() => {
        const text = x => x.textContent.replace(/\s+/g, ' ').trim();
        const schools = document.querySelector('#schools');
        const cards = document.querySelector('.smart-dashboards');
        const banner = document.querySelector('.practice-callout');
        const targets = [schools, cards, banner];
        return {
          schoolBadge: text(schools.querySelector('.schools__eyebrow')),
          schoolHeading: Array.from(schools.querySelectorAll('h2 > span'), text),
          schoolBody: text(schools.querySelector('.schools__description')),
          schoolPills: Array.from(schools.querySelectorAll('.schools__features li'), text),
          ctaLabel: text(schools.querySelector('a')), href: schools.querySelector('a').getAttribute('href'), arrow: !!schools.querySelector('.lucide-arrow-left'),
          teacherAsset: schools.querySelector('img').getAttribute('src'),
          teacherImageLoaded: schools.querySelector('img').complete && schools.querySelector('img').naturalWidth === 1103 && schools.querySelector('img').naturalHeight === 712,
          teacherNote: text(schools.querySelector('.schools__teacher-note')), teacherMessage: text(schools.querySelector('.schools__teacher-message')),
          dashboardHeading: text(cards.querySelector('h2')),
          dashboardCards: Array.from(cards.querySelectorAll('article'), x => ({ title: text(x.querySelector('h3')), points: Array.from(x.querySelectorAll('li'), text), background: getComputedStyle(x).backgroundColor, x: x.getBoundingClientRect().x, y: x.getBoundingClientRect().y, icons: x.querySelectorAll('.dashboard-card__icon svg').length })),
          dashboardControls: cards.querySelectorAll('button,a,input,[tabindex]').length,
          dashboardImages: cards.querySelectorAll('img').length,
          nudgesDirection: cards.querySelector('bdi').dir,
          banner: text(banner), bannerCount: document.querySelectorAll('.practice-callout').length,
          proposedOrderCorrect: schools.nextElementSibling === cards && cards.nextElementSibling === banner && banner.nextElementSibling.id === 'faq',
          overflow: targets.flatMap(el => Array.from(el.querySelectorAll('*')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || x.scrollWidth > x.clientWidth + 1); }).map(x => x.className)),
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const checks = {
        schoolHeader: JSON.stringify(data.schoolHeading) === JSON.stringify(['مدرستـــك تدرّس الإنجليزيــة', 'وزيد يمنح كل طالب فرصة لممارستها.']),
        schoolBodyExact: data.schoolBody === 'يعزز زيد دور المعلم، ويمنح الطلاب فرصًا إضافية لممارسة الإنجليزية، مع تغذية راجعة تدعم تقدمهم.',
        schoolPillsExact: JSON.stringify(data.schoolPills) === JSON.stringify(['أسعار خاصة للمدارس', 'اشتراكات للمجموعات الطلابية', 'دعم للتطبيق داخل المدرسة']),
        schoolCtaExactAndPreserved: data.ctaLabel === 'اطلب عرضًا لمدرستك' && data.href === '/contact-us' && data.arrow && focusVisible,
        originalSchoolContentPreserved: data.schoolBadge === 'زيد للمدارس والمجموعات' && data.teacherAsset.includes('section9.png') && data.teacherImageLoaded && data.teacherNote === 'لأن المعلم جزء أساسي من تجربة زيـــد يحصل معلمو المدارس المشاركة على حساب خاص دون تكلفة إضافية.' && data.teacherMessage === 'زيـــد لا يستبدل المعلم.. بل يوسّع أثره.',
        dashboardHeadingExact: data.dashboardHeading === 'لوحات تحكم ذكية.. قياس دقيق، تدخل أسرع، وتحفيز مستمر',
        allThreeTitlesNineBulletsExact: data.dashboardCards.length === 3 && data.dashboardCards.every((card, i) => card.title === expectedCards[i].title && JSON.stringify(card.points) === JSON.stringify(expectedCards[i].points)),
        informationalCardsOnly: data.dashboardControls === 0 && data.dashboardImages === 0 && data.nudgesDirection === 'ltr',
        distinctCards: new Set(data.dashboardCards.map(x => x.background)).size === 3 && data.dashboardCards.every(x => x.icons === 1),
        rtlOrStackedOrder: width >= 850 ? data.dashboardCards[0].x > data.dashboardCards[1].x && data.dashboardCards[1].x > data.dashboardCards[2].x : data.dashboardCards[0].y < data.dashboardCards[1].y && data.dashboardCards[1].y < data.dashboardCards[2].y,
        bannerExactOnce: data.banner === 'الطالب لا يحتاج إلى مزيد من شرح الإنجليزية بقدر ما يحتاج إلى المزيد من استخدامها.' && data.bannerCount === 1,
        proposedOrderVerifiedNotApproved: data.proposedOrderCorrect,
        noOverflow: !data.overflow.length && !data.pageOverflow,
        noPageErrors: errors.length === 0,
      };
      if (width === 320) {
        await page.emulateMedia({ forcedColors: 'active' });
        for (const selector of ['.schools', '.smart-dashboards', '.practice-callout']) await page.locator(selector).screenshot({ path: path.join(__dirname, `${selector.slice(1)}-320-forced-colors.png`), animations: 'disabled', style: '.public-landing > header { visibility: hidden !important; }' });
      }
      if (width === 1440) {
        await cta.focus();
        await cta.press('Enter');
        await page.waitForURL('**/contact-us');
        await page.locator('form').waitFor({ state: 'visible', timeout: 20000 });
        contactCheck = { destination: new URL(page.url()).pathname, formVisible: true, submitted: false };
      }
      results.push({ width, checks, data, errors });
      await page.close();
    }
    const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-source-hashes.json')));
    const hash = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
    const changed = Object.keys(before).filter(f => hash(f) !== before[f]);
    const allowed = ['src/pages/public/schools-section.tsx', 'src/pages/public/Main.tsx'];
    const files = [];
    function walk(dir) { for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) { const file = `${dir}/${e.name}`; if (e.isDirectory()) walk(file); else files.push(file); } }
    walk('src');
    const added = files.filter(f => !(f in before));
    const expectedAdded = ['SmartDashboardsSection.tsx', 'SmartDashboardsSection.css', 'PracticeCallout.tsx', 'PracticeCallout.css'].map(f => `src/pages/public/${f}`);
    const sourceScope = changed.length === 2 && changed.every(f => allowed.includes(f)) && added.length === 4 && added.every(f => expectedAdded.includes(f));
    const passed = sourceScope && results.every(r => Object.values(r.checks).every(Boolean)) && contactCheck.formVisible;
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify({ verifiedAtUtc: new Date().toISOString(), results, contactCheck, changedExistingSourceFiles: changed, addedApplicationFiles: added, sourceScope, passed, approvalNote: 'Checks verify supplied copy and proposed composition only; D08/D09 and dashboard capability approval are separate.' }, null, 2));
    console.log(JSON.stringify({ passed, sourceScope, contactCheck, viewports: results.map(({ width, checks }) => ({ width, checks })) }, null, 2));
    process.exitCode = passed ? 0 : 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
