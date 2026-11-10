// Short-screen regression against a local preview. Uses fixture APIs/media and
// deferred microphone permission; no real account or microphone is accessed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.AVATAR_QA_URL || 'http://127.0.0.1:5192';
const content = Array.from({ length: 35 }, (_, i) => `Paragraph ${i + 1}. Read this sentence aloud and practise the vocabulary.`).join('\n\n');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [width, height] of [[1366, 650], [1280, 600], [1024, 600], [844, 390], [390, 640], [320, 480], [1440, 900]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'short-screen-test', role: 'student' }));
        localStorage.setItem('accessToken', 'fixture-only');
        navigator.mediaDevices.getUserMedia = () => new Promise(() => {});
        window.fixtureAudio = [];
        const Audio = window.Audio;
        window.Audio = function (...args) { const audio = new Audio(...args); window.fixtureAudio.push(audio); return audio; };
        window.Audio.prototype = Audio.prototype;
      });
      const progress = { hasListenedToPassage: false, phase: 'reading', currentSentenceIndex: 0,
        totalSentences: 35, attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], isRetrying: false, percentComplete: 0 };
      await page.route('**/api/v1/**', route => {
        const url = route.request().url(); let data = {};
        if (url.endsWith('/availability')) data = { available: true };
        if (url.endsWith('/reading/topics')) data = { topics: [{ id: 'short-topic', title: 'Someone Has to Do It!' }] };
        if (url.endsWith('/reading/actions')) {
          const request = route.request().postDataJSON();
          if (request.action === 'reading_passage_listened') data = { events: [{ event: 'reading_progress', payload: { ...progress, hasListenedToPassage: true } }] };
          else data = { events: [{ event: 'mode_session_started', payload: {
            lessonModeId: 'short-topic', modeSessionId: 'short-session', modeKey: 'reading-mode',
            contentPayload: { content, sentences: content.split('\n\n'), contentAudioUrl: 'https://short.test/passage.wav', narrationVideoUrl: 'https://short.test/avatar.mp4' },
            chatHistory: [], readingProgress: progress,
          } }] };
        }
        return route.fulfill({ json: data });
      });
      await page.route('https://short.test/**', route => route.fulfill({ status: 204 }));
      const reachable = async locator => {
        await locator.scrollIntoViewIfNeeded();
        return locator.evaluate(node => {
          const box = node.getBoundingClientRect();
          const root = document.querySelector('.avatar-workspace').getBoundingClientRect();
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return box.top >= root.top && box.bottom <= Math.min(root.bottom, innerHeight) + 1 && Boolean(hit && (node === hit || node.contains(hit)));
        });
      };
      await page.goto(`${base}/student/3d-avatar/reading/short-topic`);
      const listen = page.getByRole('button', { name: 'Listen to continue', exact: true });
      await listen.waitFor();
      assert(await reachable(listen), 'Listening-stage footer must be reachable');
      const passage = page.locator('.avatar-workspace-panel .custom-scrollbar');
      assert(await passage.evaluate(node => { node.scrollTop = 100; return node.clientHeight >= 44 && node.scrollTop > 0; }), 'Passage text must remain readable and scrollable');
      assert.equal(await page.getByRole('button', { name: 'Record your reading response', exact: true }).count(), 0);
      await page.evaluate(() => window.fixtureAudio.find(audio => audio.src.includes('passage.wav')).dispatchEvent(new Event('ended')));
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      const mic = page.getByRole('button', { name: 'Record your reading response', exact: true });
      await mic.waitFor();
      await page.waitForFunction(() => !document.querySelector('[aria-label="Record your reading response"]').disabled);
      await page.locator('.avatar-workspace-body').evaluate(node => { node.scrollTop = 0; });
      const clipped = await mic.evaluate(node => node.getBoundingClientRect().bottom > document.querySelector('.avatar-workspace').getBoundingClientRect().bottom);
      if (clipped) {
        // Real wheel input must chain out of the chat to reveal the footer;
        // scrollIntoView alone would hide a broken nested-scrolling layout.
        const point = await page.locator('.reading-practice-history').evaluate(node => {
          const r = node.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: Math.min(innerHeight - 24, r.top + 12) };
        });
        await page.mouse.move(point.x, point.y);
        for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(100); }
        assert(await mic.evaluate(node => node.getBoundingClientRect().bottom <= Math.min(innerHeight, document.querySelector('.avatar-workspace').getBoundingClientRect().bottom)), 'Wheel scrolling must reveal the recorder on short screens');
      }
      assert(await reachable(mic), 'Recording button must be inside the visible workspace and clickable');
      const before = await mic.boundingBox();
      await page.locator('.reading-practice-history').evaluate(node => { node.scrollTop = node.scrollHeight; });
      assert.deepEqual(await mic.boundingBox(), before, 'Conversation scrolling must not move the recorder');
      assert(await page.locator('.reading-practice-history').evaluate(node => node.clientHeight >= 44));
      await mic.click();
      const starting = page.getByRole('button', { name: 'Opening microphone', exact: true });
      await starting.waitFor();
      assert(await reachable(starting), 'Microphone startup feedback must also remain reachable');
      await page.getByRole('button', { name: 'Cancel microphone startup', exact: true }).click();
      assert(await reachable(mic));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}x${height}: passage scroll, listening footer, practice recorder, conversation scroll, startup and cancel`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
