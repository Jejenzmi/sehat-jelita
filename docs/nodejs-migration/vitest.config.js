/**
 * SIMRS ZEN - Vitest Configuration
 * Test configuration for Node.js backend
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/config/**', 'tests/**']
    },
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
