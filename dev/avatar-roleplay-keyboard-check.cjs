// Local regression: emulate visual-only keyboard resizing (Safari) separately
// from layout viewport resizing (Android). All API traffic uses fixtures.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.AVATAR_QA_URL || 'http://127.0.0.1:5192';
const output = path.resolve('../outputs/roleplay-keyboard-qa');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 768]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'keyboard-fixture', role: 'student', firstName: 'Test' }));
        localStorage.setItem('accessToken', 'fixture-only');
        const viewport = new EventTarget();
        Object.assign(viewport, { width: 390, height: 844, offsetTop: 0, offsetLeft: 0, scale: 1 });
        Object.defineProperty(window, 'visualViewport', { get: () => viewport });
        window.__keyboardViewport = viewport;
      });
      const history = Array.from({ length: 20 }, (_, i) => ({
        id: `message-${i}`, sender: i % 2 ? 'user' : 'ai', role: i % 2 ? 'user' : 'assistant',
        content: `Conversation message ${i + 1}. Tell me about your favourite sports.`, createdAt: new Date().toISOString(),
      }));
      let starts = 0;
      await page.route('**/api/v1/**', async route => {
        const url = route.request().url(); let data = {};
        if (url.endsWith('/availability')) data = { available: true };
        if (url.endsWith('/roleplay/topics')) data = { topics: [{ id: 'keyboard-topic', title: 'Sports Day', completed: false }] };
        if (url.endsWith('/roleplay/actions')) {
          const body = route.request().postDataJSON();
          if (body.action === 'start_mode_session') {
            starts++;
            data = { events: [{ event: 'mode_session_started', payload: {
              lessonModeId: 'keyboard-topic', modeSessionId: 'keyboard-session', modeKey: 'roleplay-mode',
              contentPayload: { content: 'Talk to a friend about Sports Day.' }, chatHistory: history,
              roleplayProgress: { requiredTurns: 7, completedTurns: 1, remainingTurns: 6 },
            } }] };
          } else data = { events: [{ event: 'streaming_complete', payload: { ai_response: 'Which sport would you like to try next?', feedback: '', isCompleted: false } }] };
        }
        return route.fulfill({ json: data });
      });
      await page.goto(`${base}/student/3d-avatar/roleplay/keyboard-topic`);
      const input = page.getByPlaceholder('Write your message...', { exact: true });
      await input.waitFor();
      const resize = async (height, offsetTop = 0) => {
        await page.evaluate(({ height, offsetTop }) => {
          Object.assign(window.__keyboardViewport, { height, offsetTop });
          window.__keyboardViewport.dispatchEvent(new Event('resize'));
          window.__keyboardViewport.dispatchEvent(new Event('scroll'));
        }, { height, offsetTop });
        await page.waitForTimeout(150);
      };
      const geometry = () => page.evaluate(() => {
        const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
        const history = document.querySelector('.roleplay-history');
        return { root: rect('.avatar-workspace'), avatar: rect('.avatar-workspace-avatar'), scenario: rect('.roleplay-scenario'),
          panel: rect('.avatar-workspace-panel'), history: rect('.roleplay-history'), input: rect('.roleplay-composer input'),
          remainingScroll: history.scrollHeight - history.scrollTop - history.clientHeight,
          compact: document.querySelector('.avatar-workspace').hasAttribute('data-keyboard-open'),
          layoutHeight: innerHeight, layoutWidth: innerWidth, visualHeight: visualViewport.height,
          messages: history.children.length, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      for (const [cycle, height] of [330, 260, 430].entries()) {
        await input.focus();
        await input.fill(`Draft ${cycle}`);
        const offset = cycle === 2 ? 50 : 0;
        await resize(height, offset);
        const state = await geometry();
        assert(state.compact);
        assert(state.avatar.height >= 36 && state.avatar.top >= offset);
        assert(state.scenario.height > 20);
        assert(state.history.height >= 40, JSON.stringify(state));
        assert(state.input.top >= state.history.bottom - 1);
        assert(state.input.bottom <= height + offset && state.input.bottom <= state.panel.bottom);
        assert(state.root.top >= offset && state.root.bottom <= offset + height);
        assert(state.remainingScroll < 2, 'Keep the latest conversation in view');
        assert.equal(state.messages, 20);
        assert(!state.overflow);
        await page.screenshot({ path: path.join(output, `keyboard-${width}-${height}.png`) });
        if (cycle === 2) {
          await page.locator('.roleplay-history').evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
          await resize(height - 20, offset);
          assert.equal(await page.locator('.roleplay-history').evaluate(node => node.scrollTop), 0, 'Resizing must preserve a learner reading older messages');
        }
        await input.blur(); await resize(844);
        assert.equal(await input.inputValue(), `Draft ${cycle}`);
        const restored = await geometry();
        assert(!restored.compact && restored.avatar.height > 180, JSON.stringify(restored));
      }
      await input.focus(); await resize(330);
      await page.setViewportSize({ width: 844, height: 390 }); await resize(240);
      assert((await geometry()).input.bottom <= 240, 'Keep the input above a landscape keyboard');
      await input.blur(); await resize(390);
      assert(!(await geometry()).compact, 'Restore normal layout after rotating and dismissing');
      await page.setViewportSize({ width, height: 844 }); await resize(844);
      // The same layout must work when Android resizes both viewports.
      await input.focus();
      await page.setViewportSize({ width, height: 360 });
      await resize(360);
      assert((await geometry()).input.bottom <= 360);
      await input.fill('I would like to play basketball.');
      await input.press('Enter');
      await page.getByText('Which sport would you like to try next?', { exact: true }).waitFor();
      await input.blur();
      await page.setViewportSize({ width, height: 844 }); await resize(844);
      assert(!(await geometry()).compact);
      assert.equal(starts, 1, 'Keyboard events must not reload the session');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: three keyboard cycles, viewport panning, latest message, preserved drafts/history, Android resize, send and dismissal`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
