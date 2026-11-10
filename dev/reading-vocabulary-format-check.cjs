// Local preview regression for authored emphasis in initial and saved prompts.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.AVATAR_QA_URL || 'http://127.0.0.1:5192';
const raw = 'Parents often **complain** that they always have to remind their teenage children to do **chores**.';
const plain = raw.replace(/\*\*/g, '');
const terms = ['complain', 'chores', 'they', 'their'];
const card = { word: 'complain', partOfSpeech: 'verb', definition: 'Say that something is unsatisfactory.', example: 'They complain about chores.' };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('AiTutorUser', JSON.stringify({ id: 'format-fixture', role: 'student' }));
        localStorage.setItem('accessToken', 'fixture-only');
      });
      let variant = 'initial';
      await page.route('https://format.test/**', route => route.fulfill({ status: 204 }));
      await page.route('**/api/v1/**', route => {
        const url = route.request().url(); let data = {};
        if (url.endsWith('/availability')) data = { available: true };
        if (url.endsWith('/reading/topics')) data = { topics: [{ id: 'format-topic', title: 'Someone Has to Do It!' }] };
        if (url.endsWith('/reading/actions')) data = { events: [{ event: 'mode_session_started', payload: {
          lessonModeId: 'format-topic', modeSessionId: 'format-session', modeKey: 'reading-mode',
          contentPayload: { content: raw, sentences: [raw], contentAudioUrl: 'https://format.test/passage.wav', narrationVideoUrl: 'https://format.test/avatar.mp4',
            readingPresentation: { vocabularyTerms: variant === 'no-metadata' ? [] : variant === 'initial' ? ['they', 'their'] : terms,
              vocabularyCards: variant === 'no-metadata' ? [] : [card] } },
          chatHistory: variant === 'saved' || variant === 'legacy' ? [{ id: 'saved-prompt', sender: 'ai', role: 'assistant',
            content: `Please read the following sentence aloud:\n\n${variant === 'legacy' ? '“' : '"'}${raw}${variant === 'legacy' ? '”' : '"'}`,
            ...(variant === 'saved' ? { readingSpeechText: raw } : {}), createdAt: new Date().toISOString() }] : [],
          readingProgress: { hasListenedToPassage: true, phase: 'reading', isRetrying: true, currentSentenceIndex: 0,
            totalSentences: 1, attemptedSentenceIndexes: [], acceptedSentenceIndexes: [], percentComplete: 0 },
        } }] };
        return route.fulfill({ json: data });
      });
      for (variant of ['initial', 'no-metadata', 'saved', 'legacy']) {
        await page.goto(`${base}/student/3d-avatar/reading/format-topic`);
        const history = page.locator('.reading-practice-history');
        await history.waitFor();
        const displayed = await history.innerText();
        assert(!displayed.includes('**'), `${variant}: raw emphasis leaked`);
        assert(displayed.includes(plain), `${variant}: sentence wording changed`);
        const emphasized = await history.locator('span.font-semibold, button.font-semibold').allTextContents();
        for (const word of variant === 'no-metadata' ? ['complain', 'chores'] : terms) {
          assert(emphasized.includes(word), `${variant}: ${word} lost its highlight`);
        }
        if (variant !== 'no-metadata') {
          await history.getByRole('button', { name: 'Open vocabulary flashcard for complain', exact: true }).click();
          await page.getByRole('dialog').waitFor();
          await page.getByRole('dialog').getByRole('heading', { name: 'complain', exact: true }).waitFor();
          await page.keyboard.press('Escape');
        }
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: initial prompt, missing vocabulary metadata, saved prompt, legacy quotes, unchanged wording and flashcards`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
