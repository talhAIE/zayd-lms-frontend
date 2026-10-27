// Local preview + fixture APIs. Supply AVATAR_QA_VIDEO with a local MP4 when
// the existing offline avatar fixture is unavailable. No production calls.
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
      const errors = [], actions = []; let stage = 'initial', failVideo = false;
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'listening-replay-test', role: 'student' }));
        localStorage.setItem('accessToken', 'fixture-only');
        window.listeningAudio = [];
        window.videoSeeks = [];
        const currentTime = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
        Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', { configurable: true, get: currentTime.get, set(value) {
          if (this.tagName === 'VIDEO') window.videoSeeks.push({ value, duration: this.duration });
          currentTime.set.call(this, value);
        } });
        const Audio = window.Audio;
        window.Audio = function (...args) { const audio = new Audio(...args); window.listeningAudio.push(audio); return audio; };
        window.Audio.prototype = Audio.prototype;
      });
      await page.route('https://listening.test/**', route => failVideo && route.request().url().endsWith('.mp4') ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ body: route.request().url().endsWith('.mp4') ? video : wav,
        contentType: route.request().url().endsWith('.mp4') ? 'video/mp4' : 'audio/wav' }));
      const payload = () => ({ stage, kbAudioUrl: 'https://listening.test/topic.wav', narrationVideoUrl: 'https://listening.test/avatar.mp4',
        narrationText: 'Listen to the story.', narrationAudioUrl: 'https://listening.test/narrator.wav',
        questionText: 'Listen again.', questionAudioUrl: 'https://listening.test/question.wav',
        ...(stage === 'quiz' ? { mcqs: [
          { id: 'q1', question: 'What are duets?', options: ['Two students recording together', 'Two microphones breaking'] },
          { id: 'q2', question: 'Where do they record?', options: ['In the broadcast room', 'In the garden'] },
        ] } : {}) });
      await page.route('**/api/v1/**', route => {
        const url = route.request().url(); let data = {};
        if (url.endsWith('/availability')) data = { available: true };
        if (url.endsWith('/listening/topics')) data = { topics: [{ id: 'replay-topic', title: 'Voices in the Broadcast Room' }] };
        if (url.endsWith('/listening/actions')) {
          const body = route.request().postDataJSON(); actions.push(body.action);
          if (body.action === 'next_listening_stage') stage = stage === 'initial' ? 'question' : 'quiz';
          data = { events: body.action === 'submit_mcqs' ? [{ event: 'mcq_result', payload: { passed: false, message: 'Try again.', correctCount: 0, required: 2 } }] : [
            ...(body.action === 'start_mode_session' ? [{ event: 'mode_session_started', payload: {
              lessonModeId: 'replay-topic', modeSessionId: 'replay-session', modeKey: 'listening-mode', chatHistory: [], isCompleted: false,
            } }] : []), { event: 'listening_payload', payload: payload() },
          ] };
        }
        return route.fulfill({ json: data });
      });
      await page.goto(`${base}/student/3d-avatar/listening/replay-topic`);
      const play = () => page.getByRole('button', { name: 'Play audio', exact: true });
      const pause = () => page.getByRole('button', { name: 'Pause audio', exact: true });
      await page.waitForFunction(() => { const v = document.querySelector('video'); return v?.readyState >= 2 && v.currentTime < .1 && window.videoSeeks.some(seek => seek.value > 0 && seek.value < .1); });
      for (let i = 0; i < 2; i++) {
        await page.getByText('Finish the audio to continue.', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).count(), 0, 'Required listens must still be gated');
        await play().click(); await pause().waitFor();
        await page.evaluate(() => window.listeningAudio.findLast(audio => audio.src.endsWith('/topic.wav')).dispatchEvent(new Event('ended')));
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        if (i === 0) await page.getByText('Listen Again (2 of 2)', { exact: true }).waitFor();
      }
      await page.getByText('What are duets?', { exact: true }).waitFor();
      assert.equal(await play().isEnabled(), true);
      await page.getByText('Two students recording together', { exact: true }).click();
      await page.getByRole('button', { name: 'Next Question', exact: true }).click();
      await page.getByText('In the broadcast room', { exact: true }).click();
      await play().click(); await pause().waitFor(); await page.waitForTimeout(250);
      assert(await page.evaluate(() => !document.querySelector('video').paused), 'Quiz stage must not auto-pause replay');
      await page.getByRole('button', { name: 'Restart audio', exact: true }).click();
      assert.equal(await play().isEnabled(), true);
      await page.getByText('Where do they record?', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Submit Answers', exact: true }).isEnabled(), true, 'Restart must retain all selected answers');
      await play().click(); await pause().waitFor();
      await pause().click();
      await page.getByRole('button', { name: 'Submit Answers', exact: true }).click();
      await page.getByText('What are duets?', { exact: true }).waitFor();
      assert.equal(await play().isEnabled(), true, 'Failed quiz must still allow replay');
      failVideo = true;
      await page.locator('video').evaluate(video => video.load());
      await page.getByText('Avatar unavailable. You can still play the audio.', { exact: true }).waitFor();
      await play().click(); await pause().waitFor();
      assert(await page.evaluate(() => document.querySelector('video').paused), 'Audio-only fallback must not retry a failed video');
      failVideo = false;
      await page.getByRole('button', { name: 'Retry avatar', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2 && !document.body.textContent.includes('Loading avatar…'));
      await play().click(); await pause().waitFor();
      assert(await page.evaluate(() => !document.querySelector('video').paused));
      assert.deepEqual(actions, ['start_mode_session', 'next_listening_stage', 'next_listening_stage', 'submit_mcqs']);
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: decoded idle avatar, two required listens, quiz replay/restart, preserved answers, failed quiz replay, video-error audio fallback and avatar retry`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
