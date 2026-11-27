import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// Isolated local QA: no inherited .env, proxy, remote API or auth fixture.
export default defineConfig({
  root:path.resolve(__dirname,'../..'),envDir:path.resolve(__dirname,'test-results/empty-env'),
  cacheDir:path.resolve(__dirname,'test-results/vite-cache'),plugins:[react()],
  define:{'import.meta.env.VITE_LMS_ENABLE_ARABIC_READING':JSON.stringify('false'),'import.meta.env.VITE_API_BASE_URL':JSON.stringify('')},
  resolve:{alias:{'@':path.resolve(__dirname,'../../src')}},
  server:{host:'127.0.0.1',port:5195,strictPort:true},
});
