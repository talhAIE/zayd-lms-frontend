// Optional fresh-account login check; not run for the text-first correction.
// Existing login UI against the actual owned local API; no seeded browser JWTs.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  const browser = await chromium.launch({
    channel: process.env.NAFS_BROWSER_CHANNEL || 'msedge',
    headless: true,
  });
  const checks = [];
  try {
    for (const grade of [3, 6, 9]) {
      const context = await browser.newContext();
      await context.route('**/*', (route) =>
        new URL(route.request().url()).hostname === '127.0.0.1'
          ? route.continue()
          : route.abort(),
      );
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5180/login');
      await page
        .getByRole('textbox', { name: 'User Name', exact: true })
        .fill('nafs.test.grade' + grade);
      await page.getByRole('button', { name: 'Log In', exact: true }).click();
      await expect(page).toHaveURL('http://127.0.0.1:5180/student/courses');
      await expect(
        page.getByRole('link', { name: 'Start quiz', exact: true }),
      ).toHaveCount(grade === 3 ? 2 : 3);
      await expect(
        page.getByText('No curriculum courses available.'),
      ).toHaveCount(0);
      await page
        .getByRole('link', { name: 'Start quiz', exact: true })
        .first()
        .click();
      await expect(
        page.getByRole('heading', {
          name: new RegExp('NAFS .*Grade ' + grade),
        }),
      ).toBeVisible();
      await expect(
        page.getByText('LOCAL TEST PREVIEW:', { exact: false }),
      ).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      await context.close();
      checks.push({
        username: 'nafs.test.grade' + grade,
        login: 'passed',
        gradeCourses: grade === 3 ? 2 : 3,
        attemptsStarted: 0,
      });
    }
  } finally {
    await browser.close();
  }
  const folder = path.resolve('dev/.nafs-qa');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(
    path.join(folder, 'manual-login-report.json'),
    JSON.stringify({ status: 'passed', checks }, null, 2),
  );
  console.log(
    'All three grade accounts passed username login and grade-specific content checks; no student quiz attempt was started.',
  );
}
main().catch((error) => {
  console.error('Local login verification failed: ' + error.message);
  process.exitCode = 1;
});
