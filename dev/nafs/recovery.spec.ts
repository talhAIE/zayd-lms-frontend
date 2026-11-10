import { test, expect } from '@playwright/test';
import { installFixture, source } from './browser-fixture';

test('uncertain submission disables changes and safely checks the same submitted attempt', async ({
  page,
}) => {
  const state = await installFixture(page);
  const a = source.assessments[1];
  await page.goto(`/student/nafs/assessments/${a.id}`);
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  for (let i = 0; i < a.questionCount; i++) {
    await page.getByRole('radio').first().check();
    await expect(
      page.getByRole('status', { name: 'Answer saving status' }),
    ).toContainText('All answers saved');
    if (i < a.questionCount - 1)
      await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  state.lostSubmit = true;
  state.failReads = true;
  await page
    .getByRole('button', { name: 'Review answers', exact: true })
    .last()
    .click();
  await page.getByRole('button', { name: 'Finish quiz', exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm finish', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Check submission', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Finish quiz', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Back to questions', exact: true })
    .click();
  for (const radio of await page.getByRole('radio').all())
    await expect(radio).toBeDisabled();
  state.failReads = false;
  await page
    .getByRole('button', { name: 'Check submission', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Quiz finished' }),
  ).toBeVisible();
  expect(state.requests.filter((r) => r.path.endsWith('/submit'))).toHaveLength(
    1,
  );
  expect(
    state.requests.filter(
      (r) => r.path.endsWith('/attempt') && r.method === 'POST',
    ),
  ).toHaveLength(1);
});

test('logout and account switch remove old questions and do not expose the previous local draft', async ({
  page,
}) => {
  const state = await installFixture(page);
  const a = source.assessments[0];
  await page.goto(`/student/nafs/assessments/${a.id}`);
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  const attemptUrl = page.url();
  state.failSaves = 1;
  await page.getByRole('radio').first().check();
  await expect(
    page.getByRole('button', { name: 'Retry saving' }),
  ).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem('AiTutorUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatchEvent(
      new StorageEvent('storage', {
        key: 'logoutEvent',
        newValue: 'synthetic-logout',
      }),
    );
  });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem(
      'AiTutorUser',
      JSON.stringify({
        id: 'different-student',
        username: 'nafs.other',
        role: 'student',
      }),
    );
    localStorage.setItem('accessToken', 'other-synthetic-token');
  });
  state.deny = true;
  await page.goto(attemptUrl);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(
    page.getByText('Unsaved answers were recovered', { exact: false }),
  ).toHaveCount(0);
});
