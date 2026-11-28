import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// Local synthetic backend only. No inherited .env, proxy fallback or production account.
export default defineConfig({root:path.resolve(__dirname,'../..'),envDir:path.resolve(__dirname,'test-results/empty-env'),
  cacheDir:path.resolve(__dirname,'test-results/integration-vite-cache'),plugins:[react()],
  define:{'import.meta.env.VITE_LMS_ENABLE_ARABIC_READING':JSON.stringify('true'),'import.meta.env.VITE_API_BASE_URL':JSON.stringify('')},
  resolve:{alias:{'@':path.resolve(__dirname,'../../src')}},
  server:{host:'127.0.0.1',port:5196,strictPort:true,proxy:{'/api/v1':{target:'http://127.0.0.1:5026'},'/__arabic-test':{target:'http://127.0.0.1:5026'}}},
});
