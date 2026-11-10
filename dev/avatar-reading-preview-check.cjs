// Local media/API fixture. Supply AVATAR_QA_VIDEO if the offline MP4 isn't present.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.AVATAR_QA_URL || 'http://127.0.0.1:5192';
const video = fs.readFileSync(process.env.AVATAR_QA_VIDEO || path.resolve('../outputs/avatar-workspace-qa/avatar.mp4'));
const wav = Buffer.alloc(44 + 8000 * 12 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < 8000 * 12; i++) wav.writeInt16LE(Math.round(Math.sin(i * Math.PI * 440 / 4000) * 1000), 44 + i * 2);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; let pendingVideo, holdVideo = true, failVideo = false;
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'reading-preview-test', role: 'student' }));
        localStorage.setItem('accessToken', 'fixture-only');
        window.mediaPlays = [];
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () { window.mediaPlays.push(this.tagName); return play.call(this); };
      });
      await page.route('**/fixture-reader.mp4', route => {
        if (holdVideo) { pendingVideo = route; return; }
        return failVideo ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ body: video, contentType: 'video/mp4' });
      });
      await page.route('**/fixture-reader.wav', route => route.fulfill({ body: wav, contentType: 'audio/wav' }));
      await page.route('**/api/v1/**', route => {
        const url = route.request().url(); let data = {};
        if (url.endsWith('/availability')) data = { available: true };
        if (url.endsWith('/reading/topics')) data = { topics: [{ id: 'preview-topic', title: 'Someone Has to Do It!' }] };
        if (url.endsWith('/reading/actions')) data = { events: [{ event: 'mode_session_started', payload: {
          lessonModeId: 'preview-topic', modeSessionId: 'preview-session', modeKey: 'reading-mode', chatHistory: [],
          contentPayload: { content: 'Read this sentence.', contentAudioUrl: `${base}/fixture-reader.wav`, narrationVideoUrl: `${base}/fixture-reader.mp4` },
          readingProgress: { hasListenedToPassage: false, phase: 'reading', currentSentenceIndex: 0, totalSentences: 1,
            attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], isRetrying: false, percentComplete: 0 },
        } }] };
        return route.fulfill({ json: data });
      });
      await page.goto(`${base}/student/3d-avatar/reading/preview-topic`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Loading avatar…', { exact: true }).waitFor();
      for (let i = 0; !pendingVideo && i < 100; i++) await page.waitForTimeout(25);
      assert(pendingVideo, 'Video must preload without clicking Play');
      holdVideo = false; await pendingVideo.fulfill({ body: video, contentType: 'video/mp4' });
      await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2 && !document.body.textContent.includes('Loading avatar…'));
      assert.deepEqual(await page.evaluate(() => window.mediaPlays), [], 'Preview must not autoplay audio or video');
      assert(await page.locator('video').evaluate(v => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
        const context = canvas.getContext('2d'); context.drawImage(v, 0, 0, 64, 64);
        const pixels = context.getImageData(0, 0, 64, 64).data;
        let min = 255, max = 0;
        for (let i = 0; i < pixels.length; i += 4) { min = Math.min(min, pixels[i]); max = Math.max(max, pixels[i]); }
        return v.paused && max - min > 30;
      }), 'Idle preview must contain decoded image pixels');
      assert.equal(await page.getByRole('button', { name: 'Listen to continue', exact: true }).isDisabled(), true);
      await page.getByRole('button', { name: 'Play passage', exact: true }).click();
      await page.getByRole('button', { name: 'Pause passage', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Pause passage', exact: true }).click();
      await page.getByRole('button', { name: 'Restart passage', exact: true }).click();
      assert(await page.locator('video').evaluate(v => v.paused && v.currentTime < .1));
      assert.equal(await page.getByRole('button', { name: 'Listen to continue', exact: true }).isDisabled(), true);
      failVideo = true; await page.locator('video').evaluate(v => v.load());
      await page.getByRole('button', { name: 'Retry avatar', exact: true }).waitFor();
      failVideo = false; await page.getByRole('button', { name: 'Retry avatar', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2 && !document.body.textContent.includes('Loading avatar…'));
      assert(await page.locator('video').evaluate(v => v.paused));
      await page.getByRole('button', { name: 'Play passage', exact: true }).click();
      await page.getByRole('button', { name: 'Pause passage', exact: true }).waitFor();
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: loading, decoded idle avatar before interaction, no autoplay/progress credit, play/pause/restart, video error and retry`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
