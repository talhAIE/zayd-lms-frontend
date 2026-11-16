// Full document reload + avatar retry in every 3D mode, using local media/API only.
const { chromium } = require('@playwright/test');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const base = process.env.AVATAR_QA_URL || 'http://127.0.0.1:5192';
const video = fs.readFileSync(process.env.AVATAR_QA_VIDEO || path.resolve('../outputs/avatar-workspace-qa/avatar.mp4'));
const wav = Buffer.alloc(44 + 8000 * 4 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const mode of ['reading', 'listening', 'roleplay']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = []; let failVideo = false;
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'refresh-fixture', role: 'student' }));
        localStorage.setItem('accessToken', 'fixture-only');
        window.mediaPlays = 0;
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () { window.mediaPlays++; return play.call(this); };
      });
      await page.route('**/refresh-avatar.mp4', route => failVideo ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ body: video, contentType: 'video/mp4' }));
      await page.route('**/refresh-audio.wav', route => route.fulfill({ body: wav, contentType: 'audio/wav' }));
      await page.route('**/api/v1/**', route => {
        const url = route.request().url(); let data = {};
        if (url.endsWith('/availability')) data = { available: true };
        if (url.endsWith('/topics')) data = { topics: [{ id: 'refresh-topic', title: 'Refresh fixture' }] };
        if (url.endsWith('/actions')) data = { events: [{ event: 'mode_session_started', payload: {
          modeSessionId: 'refresh-session', lessonModeId: 'refresh-topic', modeKey: `${mode}-mode`, chatHistory: [],
          contentPayload: { content: 'Hello! How are you?', contentAudioUrl: `${base}/refresh-audio.wav`, narrationVideoUrl: `${base}/refresh-avatar.mp4` },
          readingProgress: { phase: 'reading', hasListenedToPassage: false, currentSentenceIndex: 0, totalSentences: 1, attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], percentComplete: 0 },
          roleplayProgress: { completedTurns: 0, requiredTurns: 7, remainingTurns: 7 },
        } }, ...(mode === 'listening' ? [{ event: 'listening_payload', payload: {
          modeSessionId: 'refresh-session', stage: 'initial', kbAudioUrl: `${base}/refresh-audio.wav`, narrationVideoUrl: `${base}/refresh-avatar.mp4`,
        } }] : [])] };
        return route.fulfill({ json: data });
      });
      const ready = () => page.waitForFunction(() => document.querySelector('video')?.readyState >= 2 && !document.body.textContent.includes('Loading avatar…'));
      await page.goto(`${base}/student/3d-avatar/${mode}/refresh-topic`); await ready();
      await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
      assert.equal(await page.evaluate(() => window.mediaPlays), 0, `${mode}: refresh must not autoplay`);
      assert(await page.locator('video').evaluate(v => v.paused && v.readyState >= 2 && v.videoWidth > 0 && v.currentTime < .1), 'Refresh decodes a paused preview');
      failVideo = true; await page.locator('video').evaluate(v => v.load());
      await page.getByRole('button', { name: 'Retry avatar', exact: true }).waitFor();
      failVideo = false; await page.getByRole('button', { name: 'Retry avatar', exact: true }).click(); await ready();
      assert.equal(await page.evaluate(() => window.mediaPlays), 0, 'Retry must not autoplay');
      assert.deepEqual(errors, []);
      console.log(`PASS ${mode}: mobile full reload, paused preview, visible avatar failure and successful retry`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
