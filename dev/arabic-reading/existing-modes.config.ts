import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=fileURLToPath(new URL('.',import.meta.url));
// Node-level transport/session regressions only. No server, credentials or browser required.
export default defineConfig({testDir:path.resolve(directory,'..'),workers:1,
  testMatch:[/[/\\](step|nafs)[/\\](service|session|practice-service|practice-session)\.spec\.ts$/],
  timeout:30000,reporter:[['list'],['json',{outputFile:path.resolve(directory,'test-results/phase8-existing-modes.json')}]],
  outputDir:path.resolve(directory,'test-results/existing-modes'),use:{trace:'off'}});
