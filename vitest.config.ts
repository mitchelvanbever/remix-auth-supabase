/// <reference types="vitest/global" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    global: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['*.ts'],
    },
  },
})
