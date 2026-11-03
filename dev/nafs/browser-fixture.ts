// Local Playwright preview only. Reads learner content, NEVER private keys.
// Original database forms remain draft; this adapter cannot publish anything.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';

export const backend = path.resolve(process.cwd(), '../zayd-lms-backend');
export const source = JSON.parse(
  fs.readFileSync(
    path.join(backend, 'content/nafs/learner-content.json'),
    'utf8',
  ),
);
export const presentation = JSON.parse(
  fs.readFileSync(
    path.join(backend, 'content/nafs/learner-presentation.json'),
    'utf8',
  ),
);
export const user = {
  id: 'nafs-browser-student',
  username: 'nafs.browser.synthetic',
  role: 'student',
  firstName: 'Test',
  lastName: 'Student',
  name: 'Test Student',
};
export const normalCourse = {
  id: 'ordinary-course',
  title: 'Existing English course',
  code: 'EN',
  grade: '9',
  description: 'Ordinary curriculum',
  progressPct: 0,
  progressStatus: 'not_started',
  isLocked: false,
};
const now = () => new Date().toISOString();
export async function installFixture(page: Page) {
  const state = {
    noNormalCourses: false,
    failDiscovery: false,
    available: true,
    deny: false,
    failSaves: 0,
    lostSubmit: false,
    failReads: false,
    conflict: false,
    requests: [] as {
      path: string;
      method: string;
      body: any;
      auth?: string;
    }[],
    media: new Set<string>(),
    attempts: new Map<string, any>(),
    replays: new Map<string, any>(),
  };
  await page.addInitScript((u) => {
    if (!localStorage.getItem('AiTutorUser')) {
      localStorage.setItem('AiTutorUser', JSON.stringify(u));
      localStorage.setItem('accessToken', 'nafs-browser-synthetic');
      localStorage.setItem('refreshToken', 'nafs-browser-synthetic-refresh');
    }
  }, user);
  const asset = (assetId: string | null, attemptId: string) => {
    if (!assetId) return null;
    const a = [...presentation.assets, ...source.assets].find(
      (a: any) => a.id === assetId,
    );
    return {
      id: a.id,
      url: `/api/v1/nafs/attempts/${attemptId}/assets/${a.id}`,
      alt: a.alt,
      width: a.width,
      height: a.height,
    };
  };
  const assessment = (id: string) =>
    source.assessments.find((a: any) => a.id === id);
  const view = (a: any) =>
    a.state === 'submitted' ? a.result : structuredClone(a);
  const overview = (a: any) => {
    const attempt = state.attempts.get(`attempt-${a.id}`);
    return {
      id: a.id,
      courseId: a.id,
      title: a.title,
      instructions: a.instructions,
      questionCount: a.questionCount,
      totalMarks: a.totalMarks,
      state: attempt?.state || 'not_started',
      attemptId: attempt?.id || null,
      maxAttempts: 1,
      timerSeconds: null,
      requiresAllAnswers: true,
      feedbackPolicy: 'final_total_only',
    };
  };
  function create(a: any) {
    const id = `attempt-${a.id}`;
    const current = state.attempts.get(id);
    if (current) return current;
    const qs = source.questions.filter((q: any) => q.assessmentId === a.id);
    const result = {
      id,
      assessmentId: a.id,
      contentVersion: 1,
      state: 'in_progress',
      revision: 0,
      startedAt: now(),
      lastSavedAt: null,
      selections: [],
      questions: qs.map((q: any) => ({
        id: q.id,
        displayOrder: q.displayOrder,
        stem: presentation.questions[q.stem]?.stem ?? q.stem,
        accessibleVisualText: q.accessibleVisualText,
        presentation: q.presentation,
        sourceFacsimile: asset(
          presentation.questions[q.stem]?.visual?.id ?? null,
          id,
        ),
        passageId: q.passageId,
        options: q.options.map((o: any) => ({
          id: o.id,
          label: o.label,
          text: q.id === 'g9-q09' ? o.text.replaceAll('; ', '\n') : o.text,
          image: asset(
            presentation.questions[q.stem]?.optionVisuals[o.label]?.id ?? null,
            id,
          ),
        })),
      })),
      passages: source.passages
        .filter((p: any) => qs.some((q: any) => q.passageId === p.id))
        .map((p: any) => ({
          id: p.id,
          paragraphs: p.paragraphs,
          emphasisTerms: p.emphasisTerms,
          sourceFacsimile: asset(p.sourceFacsimileAssetId, id),
        })),
    };
    state.attempts.set(id, result);
    return result;
  }
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') {
      await route.abort();
      return;
    }
    if (!url.pathname.startsWith('/api/v1/')) {
      await route.continue();
      return;
    }
    const method = request.method(),
      p = url.pathname.slice('/api/v1'.length);
    const body = request.postDataJSON();
    state.requests.push({
      path: p,
      method,
      body,
      auth: request.headers().authorization,
    });
    const json = (data: any, status = 200) =>
      route.fulfill({
        status,
        json: { status: true, data },
        headers: { 'Cache-Control': 'private, no-store' },
      });
    const error = (code: string, status = 409) =>
      route.fulfill({
        status,
        json: { statusCode: status, code, message: code },
      });
    if (!p.startsWith('/nafs/')) {
      if (p === '/learning/courses') {
        await json({ courses: state.noNormalCourses ? [] : [normalCourse] });
        return;
      }
      if (p === '/learning/courses/ordinary-course/units') {
        await json({ units: [] });
        return;
      }
      if (p.includes('spark-science')) {
        await json({ available: false, course: null, courses: [] });
        return;
      }
      await json({}, 404);
      return;
    }
    if (
      request.headers().authorization !== 'Bearer nafs-browser-synthetic' ||
      url.search
    ) {
      await error('NAFS_NOT_FOUND', 403);
      return;
    }
    if (p === '/nafs/courses') {
      if (state.failDiscovery) {
        await error('NAFS_UNAVAILABLE', 503);
        return;
      }
      await json({
        courses:
          state.available && !state.deny
            ? source.assessments.map((a: any) => ({
                ...overview(a),
                assessmentId: a.id,
                courseTitle: a.courseTitle,
                assessmentTitle: a.title,
                subject: a.subject,
                gradeLabel: a.gradeLabel,
                result: null,
              }))
            : [],
      });
      return;
    }
    if (!state.available || state.deny) {
      await error(state.available ? 'NAFS_NOT_FOUND' : 'NAFS_DISABLED', 404);
      return;
    }
    const segments = p.split('/').filter(Boolean);
    if (segments[1] === 'assessments') {
      const a = assessment(segments[2]);
      if (!a) {
        await error('NAFS_NOT_FOUND', 404);
        return;
      }
      if (method === 'POST') await json({ attempt: view(create(a)) });
      else await json({ assessment: overview(a) });
      return;
    }
    const a = state.attempts.get(segments[2]);
    if (!a) {
      await error('NAFS_NOT_FOUND', 404);
      return;
    }
    if (segments[3] === 'assets') {
      if (a.state === 'submitted') {
        await error('NAFS_NOT_FOUND', 404);
        return;
      }
      const info = [...presentation.assets, ...source.assets].find(
        (x: any) => x.id === segments[4],
      );
      if (!info) {
        await error('NAFS_NOT_FOUND', 404);
        return;
      }
      const bytes = fs.readFileSync(
        path.join(backend, 'content/nafs', info.path),
      );
      if (createHash('sha256').update(bytes).digest('hex') !== info.sha256)
        throw Error('Source image hash mismatch');
      state.media.add(info.id);
      await route.fulfill({
        contentType: 'image/png',
        body: bytes,
        headers: { 'Cache-Control': 'private, no-store' },
      });
      return;
    }
    if (method === 'GET') {
      if (state.failReads) await route.abort();
      else await json({ attempt: view(a) });
      return;
    }
    if (a.state === 'submitted') {
      if (segments[3] === 'submit') await json({ result: a.result });
      else await error('NAFS_SUBMITTED');
      return;
    }
    if (state.failSaves && method === 'PUT') {
      state.failSaves--;
      await route.abort();
      return;
    }
    if (state.replays.has(body.requestId)) {
      await json(state.replays.get(body.requestId));
      return;
    }
    if (state.conflict) {
      state.conflict = false;
      a.revision++;
      await error('NAFS_REVISION_CONFLICT');
      return;
    }
    if (body.expectedRevision !== a.revision) {
      await error('NAFS_REVISION_CONFLICT');
      return;
    }
    if (method === 'PUT') {
      const selection = { questionId: segments[4], optionId: body.optionId };
      a.selections = [
        ...a.selections.filter(
          (s: any) => s.questionId !== selection.questionId,
        ),
        selection,
      ];
      a.revision++;
      a.lastSavedAt = now();
      const data = {
        saved: {
          attemptId: a.id,
          state: 'in_progress',
          revision: a.revision,
          selection,
          savedAt: a.lastSavedAt,
        },
      };
      state.replays.set(body.requestId, data);
      await json(data);
      return;
    }
    // Diagnostic score only; source answer keys are never read by this preview.
    a.state = 'submitted';
    a.result = {
      attemptId: a.id,
      assessmentId: a.assessmentId,
      state: 'submitted',
      earnedMarks: body.answers.filter((s: any) => s.optionId.endsWith('-a'))
        .length,
      totalMarks: a.questions.length,
      completedAt: now(),
    };
    if (state.lostSubmit) {
      await route.abort();
      return;
    }
    await json({ result: a.result });
  });
  return state;
}
