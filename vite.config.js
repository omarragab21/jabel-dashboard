import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  define: {
    // vue-i18n compiles messages with new Function() by default, which the
    // admin's CSP (script-src 'self', no 'unsafe-eval') blocks. JIT mode
    // interprets the message AST instead, so no eval is needed.
    __INTLIFY_JIT_COMPILATION__: true,
  },
  server: {
    port: 5174,
    cors: true,
    fs: { allow: [projectRoot, path.resolve(projectRoot, '..')] },
    proxy: {
      '/api': { target: 'https://backend-jabal.be-kite.com', changeOrigin: true, secure: false },
      '/storage': { target: 'https://backend-jabal.be-kite.com', changeOrigin: true, secure: false },
      // Same-origin backend images so the crop modal can export them from a canvas.
      '/public/storage': { target: 'https://backend-jabal.be-kite.com', changeOrigin: true, secure: false },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/chart.js')) return 'chart-vendor';
          const match = id.match(/\/src\/views\/([^/]+)\.vue$/);
          return match ? `admin-${match[1].replace(/View$/, '').toLowerCase()}` : undefined;
        },
      },
    },
  },
});
