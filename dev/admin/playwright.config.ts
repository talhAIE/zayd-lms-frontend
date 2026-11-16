import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: "list",
  outputDir: "../../test-results/admin",
  use: {
    baseURL: "http://127.0.0.1:5178",
    browserName: "chromium",
    channel: process.platform === "win32" ? "msedge" : "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5178 --strictPort",
    url: "http://127.0.0.1:5178",
    cwd: "../..",
    env: { NAFS_BROWSER_QA: "true" },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
