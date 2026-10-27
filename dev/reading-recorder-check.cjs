// Ordinary Reading UI with deferred microphone permissions and generated audio.
// Requires the local dev server; never uses a real account or microphone.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.RECORDER_QA_URL || 'http://127.0.0.1:5194';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.micRequests = [];
        navigator.mediaDevices.getUserMedia = () => new Promise((resolve, reject) => {
          window.micRequests.push({ resolve, reject });
        });
        window.openTestMic = index => {
          const request = window.micRequests[index];
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const destination = context.createMediaStreamDestination();
          oscillator.connect(destination); oscillator.start();
          Object.assign(request, { context, oscillator, stream: destination.stream });
          request.resolve(destination.stream);
        };
      });
      await page.goto(`${base}/reading-recorder-harness.html`);
      const mic = page.getByRole('button', { name: 'Record your reading response', exact: true });
      const starting = page.getByRole('button', { name: 'Opening microphone', exact: true });
      const waitForMic = () => page.waitForFunction(() => !document.querySelector('[aria-label="Record your reading response"]')?.disabled);
      await mic.waitFor(); await waitForMic();
      await mic.evaluate(button => { button.click(); button.click(); button.click(); });
      await starting.waitFor();
      assert.equal(await starting.isDisabled(), true);
      assert.equal(await page.evaluate(() => window.micRequests.length), 1);
      assert.match(await page.locator('#reading-recording-instruction').innerText(), /Opening microphone/);
      await page.evaluate(() => window.openTestMic(0));
      await page.getByTitle('Send Recording', { exact: true }).waitFor();
      await page.waitForTimeout(1200);
      assert.match(await page.getByText(/Recording\.\.\./).innerText(), /Recording\.\.\. [1-9]\d*s/);
      await page.getByTitle('Cancel Recording', { exact: true }).click();
      await waitForMic();
      assert(await page.evaluate(() => window.micRequests[0].stream.getTracks().every(track => track.readyState === 'ended')));

      await mic.click();
      await page.evaluate(() => window.micRequests[1].reject(new DOMException('Denied', 'NotAllowedError')));
      await waitForMic();
      assert.match(await page.locator('#reading-recording-instruction').innerText(), /Microphone access denied/);
      await mic.click(); await page.evaluate(() => window.openTestMic(2));
      await page.getByTitle('Send Recording', { exact: true }).waitFor();
      await page.waitForTimeout(1200);
      await page.getByTitle('Send Recording', { exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#reading-recording-instruction')?.textContent.includes('Assessing your recording'));
      assert.equal(await mic.isDisabled(), true);
      await page.evaluate(() => window.recorderHarness.finishAssessment());
      await waitForMic();

      await mic.click(); await starting.waitFor();
      await page.getByRole('button', { name: 'Cancel microphone startup' }).click();
      await page.evaluate(() => window.openTestMic(3));
      await waitForMic();
      assert(await page.evaluate(() => window.micRequests[3].stream.getTracks().every(track => track.readyState === 'ended')));
      assert.equal(await page.getByTitle('Send Recording', { exact: true }).count(), 0);

      await page.clock.install();
      await mic.click(); await starting.waitFor();
      await page.clock.fastForward(20_001);
      await waitForMic();
      assert.match(await page.locator('#reading-recording-instruction').innerText(), /microphone did not open/);
      await page.evaluate(() => window.openTestMic(4));
      assert(await page.evaluate(() => window.micRequests[4].stream.getTracks().every(track => track.readyState === 'ended')));

      await mic.click(); await starting.waitFor();
      await page.evaluate(() => window.recorderHarness.unmount());
      await page.evaluate(() => window.openTestMic(5));
      assert(await page.evaluate(() => window.micRequests[5].stream.getTracks().every(track => track.readyState === 'ended')));
      await page.evaluate(() => Promise.all(window.micRequests.filter(request => request.context).map(request => request.context.close())));
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: startup spinner, rapid taps, recording timer/stop, cancel, permission failure, assessment state, retry, timeout and late-stream/unmount cleanup`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
