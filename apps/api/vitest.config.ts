import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    // Run tests sequentially to avoid DB conflicts
    isolate: false,
    sequence: {
      concurrent: false,
    },
  },
});
