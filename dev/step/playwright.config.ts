import { defineConfig } from "@playwright/test";
import path from "node:path";
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts/,
  workers: 1,
  timeout: 45000,
  reporter: [
    ["list"],
    ["json", { outputFile: path.resolve("dev/.step-qa/report.json") }],
  ],
  outputDir: path.resolve("test-results/step"),
  use: {
    baseURL: "http://127.0.0.1:5181",
    channel: process.platform === "win32" ? "msedge" : "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5181 --strictPort",
    url: "http://127.0.0.1:5181",
    cwd: "../..",
    env: { STEP_BROWSER_QA: "true" },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
