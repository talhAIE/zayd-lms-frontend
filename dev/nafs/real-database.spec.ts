import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

test.describe('real owned PostgreSQL and Nest API through the student frontend', () => {
  test.skip(
    process.env.NAFS_REAL_DATABASE_QA !== 'true',
    'Start the owned local QA API and opt in with NAFS_REAL_DATABASE_QA=true.',
  );
  const file = path.resolve(
    process.cwd(),
    '../zayd-lms-backend/tmp/nafs-phase3/phase4-browser.private.json',
  );
  for (const [index, expected] of [
    [0, 2],
    [1, 0],
    [2, 1],
  ]) {
    test(`diagnostic quiz ${index + 1}: ${expected}/2, resume, locked result and exact teacher marks`, async ({
      page,
      request,
    }) => {
      const session = JSON.parse(fs.readFileSync(file, 'utf8'));
      expect(session.baseUrl).toBe('http://127.0.0.1:5019');
      await page.addInitScript(
        ({ user, accessToken }) => {
          localStorage.setItem('AiTutorUser', JSON.stringify(user));
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem(
            'refreshToken',
            'local-synthetic-refresh-unused',
          );
        },
        { user: session.user, accessToken: session.accessToken },
      );
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== '127.0.0.1') {
          await route.abort();
          return;
        }
        if (url.pathname.startsWith('/api/v1/nafs/')) {
          const response = await route.fetch({
            url: session.baseUrl + url.pathname,
          });
          await route.fulfill({ response });
          return;
        }
        if (url.pathname.startsWith('/api/')) {
          await route.fulfill({ status: 404, json: { status: false } });
          return;
        }
        await route.continue();
      });
      const assessmentId = session.fixtures[index];
      await page.goto(`/student/nafs/assessments/${assessmentId}`);
      await expect(
        page.getByRole('heading', {
          name: `Synthetic browser quiz ${index + 1}`,
        }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Start quiz', exact: true })
        .click();
      await page
        .getByRole('radio')
        .nth(index === 1 ? 1 : 0)
        .check();
      await expect(
        page.getByRole('status', { name: 'Answer saving status' }),
      ).toContainText('All answers saved');
      await page.reload();
      await expect(
        page.getByRole('radio').nth(index === 1 ? 1 : 0),
      ).toBeChecked();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page
        .getByRole('radio')
        .nth(index === 0 ? 0 : 1)
        .check();
      await expect(
        page.getByRole('status', { name: 'Answer saving status' }),
      ).toContainText('All answers saved');
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
      await expect(page.getByLabel(`${expected} out of 2 marks`)).toBeVisible();
      await page.reload();
      await expect(page.getByLabel(`${expected} out of 2 marks`)).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      const attemptId = new URL(page.url()).pathname.split('/').pop();
      const studentResponse = await request.get(
        `${session.baseUrl}/api/v1/nafs/attempts/${attemptId}/result`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      expect(studentResponse.status()).toBe(200);
      const result = (await studentResponse.json()).data.result;
      expect(result.earnedMarks).toBe(expected);
      expect(result.totalMarks).toBe(2);
      const teacherResponse = await request.get(
        `${session.baseUrl}/api/v1/nafs/teacher/results?assessmentId=${assessmentId}`,
        { headers: { Authorization: `Bearer ${session.teacherToken}` } },
      );
      expect(teacherResponse.status()).toBe(200);
      const teacher = (await teacherResponse.json()).data.results;
      expect(teacher).toHaveLength(1);
      expect(teacher[0].earnedMarks).toBe(expected);
      expect(teacher[0].state).toBe('completed');
      expect(JSON.stringify({ result, teacher })).not.toMatch(
        /correctOptionId|snapshotJson|answerKey/,
      );
      await page.goBack();
      await page
        .getByRole('button', { name: 'View marks', exact: true })
        .click();
      await expect(page.getByLabel(`${expected} out of 2 marks`)).toBeVisible();
    });
  }
});
