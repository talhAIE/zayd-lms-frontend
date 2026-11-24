import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', workers: 1, timeout: 60000,
  use: {baseURL:'http://127.0.0.1:5182',browserName:'chromium',channel:process.platform==='win32'?'msedge':'chromium'},
  reporter: 'list', outputDir:'../../test-results/password-auth',
  webServer: {command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5182 --strictPort',url:'http://127.0.0.1:5182',cwd:'../..',env:{NAFS_BROWSER_QA:'true'},reuseExistingServer:false,timeout:120000},
});
