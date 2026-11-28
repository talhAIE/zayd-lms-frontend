import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// Isolated local QA: no inherited .env, proxy, remote API or auth fixture.
export default defineConfig({
  root:path.resolve(__dirname,'../..'),envDir:path.resolve(__dirname,'test-results/empty-env'),
  cacheDir:path.resolve(__dirname,'test-results/vite-cache'),plugins:[react(),{
    name:'arabic-phase8-local-regression-entry',configureServer(server){
      server.middlewares.use(async(request,response,next)=>{
        if(request.url!=='/reading-recorder-harness.html'){next();return;}
        if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress??'')||request.headers['x-forwarded-for']){response.statusCode=403;response.end();return;}
        response.setHeader('Content-Type','text/html');response.setHeader('Cache-Control','no-store');
        response.end(await server.transformIndexHtml(request.url,'<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/dev/reading-recorder-harness.tsx"></script></body></html>'));
      });
    },
  }],
  define:{'import.meta.env.VITE_LMS_ENABLE_ARABIC_READING':JSON.stringify('false'),'import.meta.env.VITE_API_BASE_URL':JSON.stringify('')},
  resolve:{alias:{'@':path.resolve(__dirname,'../../src')}},
  server:{host:'127.0.0.1',port:5195,strictPort:true},
});
