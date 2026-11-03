import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.resolve(
          process.cwd(),
          'dev/.nafs-qa/browser-report.json',
        ),
      },
    ],
  ],
  outputDir: path.resolve(process.cwd(), 'test-results/nafs'),
  use: {
    baseURL: 'http://127.0.0.1:5179',
    browserName: 'chromium',
    channel:
      process.env.NAFS_BROWSER_CHANNEL ||
      (process.platform === 'win32' ? 'msedge' : 'chromium'),
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 5179 --strictPort',
    url: 'http://127.0.0.1:5179',
    cwd: '../..',
    env: { NAFS_BROWSER_QA: 'true' },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
