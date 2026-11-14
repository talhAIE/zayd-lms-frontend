import { test, expect } from '@playwright/test';
import { installFixture, source } from './browser-fixture';

test('NAFS-only students see their courses without an empty-curriculum message and get accurate resume counts', async ({
  page,
}) => {
  const state = await installFixture(page);
  state.noNormalCourses = true;
  await page.goto('/student/courses');
  await expect(
    page.getByRole('link', { name: 'Open course', exact: true }),
  ).toHaveCount(8);
  await expect(page.getByText('No curriculum courses available.')).toHaveCount(
    0,
  );
  await page.goto(`/student/nafs/assessments/${source.assessments[0].id}`);
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(4);
  await page
    .getByRole('link', { name: 'Back to courses', exact: true })
    .click();
  await expect(
    page.getByText('Quiz in progress · Continue your saved quiz', { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByText(/1 course in progress/)).toBeVisible();
  await expect(page.getByText('No curriculum courses available.')).toHaveCount(
    0,
  );
});

test('NAFS discovery failure preserves ordinary cards and can reload NAFS independently', async ({
  page,
}) => {
  const state = await installFixture(page);
  state.failDiscovery = true;
  await page.goto('/student/courses');
  await expect(
    page.getByRole('heading', { name: 'Existing English course' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry loading NAFS' }),
  ).toBeVisible();
  state.failDiscovery = false;
  await page.getByRole('button', { name: 'Retry loading NAFS' }).click();
  await expect(
    page.getByRole('link', { name: 'Open course', exact: true }),
  ).toHaveCount(8);
  await expect(
    page.getByRole('heading', { name: 'Existing English course' }),
  ).toBeVisible();
});
