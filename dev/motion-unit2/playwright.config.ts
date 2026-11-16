import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  workers: 1,
  timeout: 90000,
  reporter: "list",
  outputDir: "../../test-results/motion-unit2",
  use: {
    baseURL: "http://127.0.0.1:5178",
    channel: process.platform === "win32" ? "msedge" : "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5178 --strictPort",
    url: "http://127.0.0.1:5178",
    cwd: "../..",
    reuseExistingServer: false,
  },
});
