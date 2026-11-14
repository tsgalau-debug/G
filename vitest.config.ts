import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'GEMINI_API_KEY': '"test_key"'
  },
  test: {
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        execArgv: ['--expose-gc'],
      },
    },
    globals: false,
    include: ['src/**/*.spec.ts', 'rag-topology-standalone/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
      exclude: ['**/*.d.ts', '**/types/**', 'tests/**'],
    },
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    fakeTimers: {
      toFake: ['setTimeout', 'setInterval', 'Date'],
    },
  },
});
