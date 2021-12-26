/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    global: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    deps: {
      inline: ['whatwg-fetch'],
    },
  },
})
