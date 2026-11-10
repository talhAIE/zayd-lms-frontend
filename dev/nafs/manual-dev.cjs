// Local-only manual preview; never changes .env or production build values.
const path = require('node:path');
const { spawn } = require('node:child_process');
const vite = path.join(
  path.dirname(require.resolve('vite/package.json')),
  'bin/vite.js',
);
const child = spawn(
  process.execPath,
  [vite, '--host', '127.0.0.1', '--port', '5180', '--strictPort'],
  {
    env: { ...process.env, NAFS_MANUAL_PREVIEW: 'true' },
    stdio: 'inherit',
    windowsHide: true,
  },
);
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.once('error', () => {
  console.error('Could not start local NAFS preview');
  process.exitCode = 1;
});
process.once('SIGINT', () => child.kill());
process.once('SIGTERM', () => child.kill());
