/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    global: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['./src/mocks', './src/test'],
    },
  },
})
