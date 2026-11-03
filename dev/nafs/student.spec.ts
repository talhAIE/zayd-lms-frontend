import { test, expect } from '@playwright/test';
import { installFixture, source } from './browser-fixture';

for (const [name, width, height] of [
  ['desktop', 1440, 1000],
  ['mobile', 390, 844],
] as const) {
  for (const a of source.assessments) {
    test(`${name}: ${a.id}, source images, save/resume/finish and locked marks`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height });
      const state = await installFixture(page);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('/student/courses');
      await expect(
        page.getByRole('heading', { name: 'Existing English course' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Start quiz', exact: true }),
      ).toHaveCount(8);
      await page.goto(`/student/nafs/assessments/${a.id}`);
      await expect(
        page.getByRole('heading', { name: a.courseTitle }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Start quiz', exact: true })
        .click();
      await expect(
        page.getByRole('heading', {
          name: `Question 1 of ${a.questionCount}`,
          exact: true,
        }),
      ).toBeVisible();
      // Final review cannot finish an incomplete quiz.
      await page
        .getByRole('button', { name: 'Review answers', exact: true })
        .last()
        .click();
      await expect(
        page.getByRole('button', { name: 'Finish quiz', exact: true }),
      ).toBeDisabled();
      await page
        .getByRole('button', { name: 'Question 1, unanswered', exact: true })
        .click();
      const questions = source.questions.filter(
        (q: any) => q.assessmentId === a.id,
      );
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await expect(
          page.getByRole('heading', { name: q.stem, exact: true }),
        ).toBeVisible();
        await expect(page.getByRole('radio')).toHaveCount(4);
        if (q.passageId && name === 'mobile')
          await page
            .getByRole('button', { name: 'Read passage', exact: true })
            .click();
        if (q.passageId)
          await expect(
            page.getByRole('heading', { name: 'Reading passage' }),
          ).toBeVisible();
        const images = page.locator('section img');
        await expect
          .poll(async () =>
            images.evaluateAll(
              (imgs) =>
                imgs.length > 0 &&
                imgs.every(
                  (img) =>
                    (img as HTMLImageElement).complete &&
                    (img as HTMLImageElement).naturalWidth > 0,
                ),
            ),
          )
          .toBe(true);
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        // Image source bytes were hash-checked by the fixture; dimensions are
        // checked after real authenticated Blob decoding in Chromium.
        await images.evaluateAll((imgs) => {
          for (const img of imgs as HTMLImageElement[])
            if (
              img.naturalWidth !== Number(img.getAttribute('width')) ||
              img.naturalHeight !== Number(img.getAttribute('height'))
            )
              throw Error('Image dimensions differ from source');
        });
        await page.screenshot({
          path: testInfo.outputPath(`${q.id}.png`),
          fullPage: true,
        });
        if (i === 0) {
          await page
            .getByRole('button', { name: 'Enlarge image' })
            .last()
            .click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await page.keyboard.press('Escape');
        }
        // Native radios remain keyboard operable and visibly selected.
        const choice = page.getByRole('radio').nth(i % 4);
        await choice.focus();
        await page.keyboard.press('Space');
        await expect(choice).toBeChecked();
        await expect(
          page.getByRole('status', { name: 'Answer saving status' }),
        ).toContainText('All answers saved');
        await expect(
          page.getByText(/correct answer!|your final marks|earnedMarks/i),
        ).toHaveCount(0);
        if (i === 0) {
          await page.reload();
          await expect(page.getByRole('radio').first()).toBeChecked();
          await expect(
            page.getByRole('status', { name: 'Answer saving status' }),
          ).toContainText('All answers saved');
        }
        if (i < questions.length - 1)
          await page.getByRole('button', { name: 'Next', exact: true }).click();
      }
      await page
        .getByRole('button', { name: 'Review answers', exact: true })
        .last()
        .click();
      await page
        .getByRole('button', { name: 'Finish quiz', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Confirm finish', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Quiz finished' }),
      ).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /retry|answer review|start quiz/i }),
      ).toHaveCount(0);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Quiz finished' }),
      ).toBeVisible();
      await page.goto(`/student/nafs/assessments/${a.id}`);
      await page
        .getByRole('button', { name: 'View marks', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Quiz finished' }),
      ).toBeVisible();
      const expectedAssets = new Set(
        questions
          .flatMap((q: any) => [
            q.sourceFacsimileAssetId,
            ...q.options.map((o: any) => o.assetId),
          ])
          .concat(
            source.passages
              .filter((p: any) =>
                questions.some((q: any) => q.passageId === p.id),
              )
              .map((p: any) => p.sourceFacsimileAssetId),
          )
          .filter(Boolean),
      );
      expect([...state.media].sort()).toEqual([...expectedAssets].sort());
      expect(errors).toEqual([]);
      expect(
        state.requests.filter((r) =>
          /engagement|complete|achievement/.test(r.path),
        ),
      ).toEqual([]);
      expect(
        state.requests.filter(
          (r) =>
            r.path.startsWith('/nafs/') &&
            r.method === 'POST' &&
            r.path.endsWith('/attempt'),
        ),
      ).toHaveLength(1);
      await page.goto('/student/courses');
      await expect(
        page.getByRole('link', { name: 'View marks', exact: true }),
      ).toHaveCount(1);
      await page
        .getByRole('button', { name: 'Start Course', exact: true })
        .click();
      await expect(page).toHaveURL(/\/student\/courses\/ordinary-course$/);
    });
  }
}

test('network failure retains local selections across reload and requires explicit recovery', async ({
  page,
}) => {
  const state = await installFixture(page);
  const a = source.assessments[0];
  await page.goto(`/student/nafs/assessments/${a.id}`);
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click();
  state.failSaves = 1;
  await page.getByRole('radio').nth(2).check();
  await expect(
    page.getByRole('button', { name: 'Retry saving' }),
  ).toBeVisible();
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
  page.on('dialog', (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByText('Unsaved answers were recovered', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep my answers' }).click();
  await expect(
    page.getByRole('status', { name: 'Answer saving status' }),
  ).toContainText('All answers saved');
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
  state.conflict = true;
  await page.getByRole('radio').nth(1).check();
  await expect(
    page.getByText('This quiz changed in another tab.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Use saved answers' }).click();
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
});

test('lost submission response recovers the locked result without a fresh attempt', async ({
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
  await page
    .getByRole('button', { name: 'Review answers', exact: true })
    .last()
    .click();
  await page.getByRole('button', { name: 'Finish quiz', exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm finish', exact: true })
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

for (const mode of ['disabled', 'no-grant'] as const) {
  test(`${mode}: ordinary courses remain usable and direct NAFS URLs do not expose content`, async ({
    page,
  }) => {
    const state = await installFixture(page);
    if (mode === 'disabled') state.available = false;
    else state.deny = true;
    await page.goto('/student/courses');
    await expect(
      page.getByRole('heading', { name: normalName() }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Start quiz', exact: true }),
    ).toHaveCount(0);
    await page.goto(`/student/nafs/assessments/${source.assessments[0].id}`);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Start quiz', exact: true }),
    ).toHaveCount(0);
  });
}
function normalName() {
  return 'Existing English course';
}
