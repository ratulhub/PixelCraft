import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  esbuild: {
    target: 'esnext',
    supported: {
      'import-source': false,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    exclude: ['@uswriting/exiftool', 'libheif-js', 'rawconvert-wasm', 'wasm-feature-detect'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [
        /^data:application\/wasm/,
      ],
    },
  },
  worker: {
    format: 'es',
  },
});
