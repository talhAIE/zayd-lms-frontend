// Against a local Vite server; all API responses and media are test fixtures.
// Run with Playwright on NODE_PATH. No real account or microphone is used.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.AVATAR_QA_URL || 'http://127.0.0.1:5192';
const output = path.resolve('../outputs/reading-retake-qa');
const topic = { id: 'retake-topic', title: 'Someone Has to Do It!', completed: true, imageUrl: null, questionCount: 1 };
const progress = { hasListenedToPassage: false, phase: 'reading', currentSentenceIndex: 0, totalSentences: 1,
  attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], isRetrying: false, rejectedAttemptCount: 0, percentComplete: 0 };
const payload = { content: 'Birds sing in the trees.', narrationVideoUrl: 'https://reading.test/avatar.mp4',
  contentAudioUrl: 'https://reading.test/passage.wav',
  readingPresentation: { format: 'paragraph', title: topic.title, vocabularyTerms: ['Birds'],
    vocabularyCards: [{ word: 'Birds', partOfSpeech: 'noun', definition: 'Animals with feathers.', example: 'Birds sing.' }] } };
const started = content => ({ events: [{ event: 'mode_session_started', payload: {
  lessonModeId: topic.id, modeSessionId: 'fresh-session', modeKey: 'reading-mode', isCompleted: false,
  chatHistory: [], contentPayload: content, readingProgress: progress,
} }] });

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'retake-test', role: 'student', firstName: 'Test' }));
        localStorage.setItem('accessToken', 'test-only');
        window.__readingAudio = [];
        const Audio = window.Audio;
        window.Audio = function (...args) { const audio = new Audio(...args); window.__readingAudio.push(audio); return audio; };
        window.Audio.prototype = Audio.prototype;
      });
      const page = await context.newPage();
      const errors = [], requests = [], pending = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://reading.test/**', route => route.fulfill({ status: 204 }));
      await page.route('**/api/v1/**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/3d-avatar/availability')) return route.fulfill({ json: { available: true } });
        if (url.pathname.endsWith('/3d-avatar/reading/topics')) return route.fulfill({ json: { topics: [topic] } });
        if (url.pathname.endsWith('/3d-avatar/reading/actions')) {
          const body = route.request().postDataJSON(); requests.push(body);
          if (body.action === 'reading_passage_listened') return route.fulfill({ json: { events: [{ event: 'reading_progress', payload: { ...progress, hasListenedToPassage: true } }] } });
          pending.push(route); return;
        }
        return route.fulfill({ json: {} });
      });
      const takeRequest = async () => {
        for (let i = 0; !pending.length && i < 100; i++) await page.waitForTimeout(50);
        assert(pending.length, 'Missing session request'); return pending.shift();
      };
      await page.goto(`${base}/student/3d-avatar/reading`);
      await page.getByText('Practise again', { exact: true }).click();
      let route = await takeRequest();
      assert.equal(requests.at(-1).restartCompleted, true);
      await page.getByText('Loading reading practice…', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Play passage', exact: true }).isVisible(), false);
      await route.fulfill({ status: 503, json: { message: 'Reading is temporarily unavailable.' } });
      await page.getByRole('alert').filter({ hasText: 'Reading is temporarily unavailable.' }).waitFor();
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      route = await takeRequest();
      assert.equal(requests.at(-1).restartCompleted, true, 'A failed retake must keep its intent');
      await route.fulfill({ json: started({}) });
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      route = await takeRequest();
      await route.fulfill({ json: started(payload) });
      await page.getByRole('button', { name: 'Play passage', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Play passage', exact: true }).isEnabled(), true);
      assert.equal(await page.locator('.avatar-workspace video').getAttribute('src'), payload.narrationVideoUrl);
      await page.locator('.avatar-workspace-panel p').filter({ hasText: 'Birds sing in the trees.' }).first().waitFor();
      assert(await page.getByRole('button', { name: 'Open vocabulary flashcard for Birds' }).count());
      await page.evaluate(() => window.__readingAudio.find(audio => audio.src.includes('/passage.wav')).dispatchEvent(new Event('ended')));
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Record your reading response', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Record your reading response', exact: true }).isEnabled(), true);
      await page.screenshot({ path: path.join(output, `ready-${width}.png`) });
      await page.reload();
      route = await takeRequest();
      assert.equal(requests.at(-1).restartCompleted, undefined, 'Refreshing must resume the fresh attempt');
      await route.fulfill({ json: started(payload) });
      await page.getByRole('button', { name: 'Play passage', exact: true }).waitFor();
      // A direct first attempt continues to use the ordinary start/resume action.
      await page.goto(`${base}/student/3d-avatar/reading/${topic.id}`);
      route = await takeRequest();
      assert.equal(requests.at(-1).restartCompleted, undefined);
      if (width === 390) {
        // Exercise the real XHR timeout, not just an immediate network failure.
        const before = Date.now();
        await page.getByRole('button', { name: 'Retry', exact: true }).waitFor({ timeout: 35_000 });
        assert(Date.now() - before >= 28_000, 'Session request should have a bounded 30-second timeout');
      } else {
        await route.abort('timedout');
        await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      }
      await page.getByRole('button', { name: 'Back to topics', exact: true }).click();
      await page.waitForURL('**/student/3d-avatar/reading');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: retake, loading, error/retry, invalid payload, content, vocabulary, recording controls, refresh/resume, timeout and back`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
