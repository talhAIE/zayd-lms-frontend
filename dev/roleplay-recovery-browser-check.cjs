// Browser fixture: no production account, microphone, or live API is used.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:5192';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], attempts = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'recovery-fixture', role: 'student', firstName: 'Test' }));
      localStorage.setItem('accessToken', 'fixture-only');
    });
    await page.route('**/api/v1/**', async route => {
      const url = route.request().url();
      let data = {};
      if (url.endsWith('/availability')) data = { available: true };
      if (url.endsWith('/roleplay/topics')) data = { topics: [{ id: 'recovery-topic', title: 'Conversation', completed: false }] };
      if (url.endsWith('/roleplay/actions')) data = { events: [{ event: 'mode_session_started', payload: {
        lessonModeId: 'recovery-topic', modeSessionId: 'recovery-session', modeKey: 'roleplay-mode',
        contentPayload: { content: 'Talk to a friend.' }, chatHistory: [{ id: 'opening', sender: 'ai', role: 'assistant', content: 'Hello!', createdAt: new Date().toISOString() }],
        roleplayProgress: { requiredTurns: 7, completedTurns: 0, remainingTurns: 7 },
      } }] };
      if (url.endsWith('/recovery-session/audio')) {
        const body = route.request().postDataBuffer().toString();
        attempts.push(body.match(/name="clientAttemptId"\r\n\r\n([^\r]+)/)?.[1]);
        assert.match(body, /name="audio"; filename=/);
        if (attempts.length === 1) return route.fulfill({ status: 503, json: { message: 'Temporary upload failure' } });
        data = { events: [
          { event: 'speech_transcribed', payload: { clientAttemptId: attempts.at(-1), textMessage: 'Hello there.' } },
          { event: 'streaming_complete', payload: { messageId: 'reply', ai_response: 'How are you?', isCompleted: false } },
        ] };
      }
      return route.fulfill({ json: data });
    });
    await page.goto(`${base}/student/3d-avatar/roleplay/recovery-topic`);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByPlaceholder('Write your message...', { exact: true }).waitFor({ timeout: 10000 }).catch(async error => {
      console.error(await page.locator('body').innerText(), errors); throw error;
    });
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('zayd-reading-recordings', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('pending', { keyPath: 'lessonModeId' });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result, transaction = db.transaction('pending', 'readwrite');
          transaction.objectStore('pending').put({
            lessonModeId: '3d-avatar:recovery-fixture:roleplay:recovery-topic', sessionId: 'recovery-session',
            id: '22222222-2222-4222-8222-222222222222', base64: 'YXVkaW8=', format: 'wav', createdAt: new Date().toISOString(),
          });
          transaction.oncomplete = () => { db.close(); resolve(); };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    });
    await page.reload();
    const retry = page.getByRole('button', { name: 'Send this recording again' });
    await retry.waitFor();
    assert.equal(await page.getByPlaceholder('Write your message...', { exact: true }).isDisabled(), true);
    await retry.click();
    await page.getByText('Temporary upload failure', { exact: true }).waitFor();
    await retry.click();
    await page.getByText('How are you?', { exact: true }).waitFor();
    assert.equal(await retry.count(), 0);
    assert.equal(attempts.length, 2); assert.equal(attempts[0], attempts[1]);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('Roleplay browser recovery passed: restored recording, disabled composer, failed HTTP upload, same-ID retry and successful acknowledgement.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
