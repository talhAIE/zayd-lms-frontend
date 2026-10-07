import * as  path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';

export default defineConfig({
  plugins: [react(), {
    name: 'science-spark-development-harness',
    configureServer(server) {
      // Dev-only fixtures never enter public/ or the production build.
      server.middlewares.use('/__science-spark-fixtures', async (request, response, next) => {
        const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '') && /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(request.headers.host ?? '') && !request.headers['x-forwarded-for'];
        if (!local) { response.statusCode = 403; response.end('Local development only'); return; }
        const name = request.url?.replace(/^\//, '');
        if (request.method !== 'GET' || !name || !/^(introduction|lesson-[1-4])\.json$/.test(name)) { next(); return; }
        try {
          const bytes = await readFile(path.resolve(__dirname, 'dev/.science-spark-fixtures', name));
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'private, no-store');
          response.end(bytes);
        } catch { response.statusCode = 503; response.end('Science fixture unavailable'); }
      });
    },
  }],
  server: {
    watch: {
      usePolling: false,
      interval: 1000,
    },
    allowedHosts: ["4c46-2407-aa80-314-8e9f-6523-ce3-b327-cd04.ngrok-free.app", "29fd5cec1a0b.ngrok-free.app"],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
