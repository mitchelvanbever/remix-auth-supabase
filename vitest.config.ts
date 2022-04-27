/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      cleanOnReRun: true,
      reporter: ['text', 'html'],
      inlcude: ['./src/index.ts', './src/handlePromise.ts']
    }
  }
});
