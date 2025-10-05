import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Environment setup
    environment: 'node',

    // Test files
    include: ['**/__tests__/**/*.test.js', '**/*.test.js'],
    exclude: ['node_modules', 'dist', '.vercel'],

    // Global setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.vercel/**',
        '**/*.test.js',
        '**/__tests__/**',
        'test-server.js',
        'vitest.config.js'
      ],
      // Target 90%+ for critical paths
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },

    // Timeout for async tests
    testTimeout: 10000,

    // Mock environment variables
    env: {
      NODE_ENV: 'test'
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@lib': path.resolve(__dirname, './lib'),
      '@api': path.resolve(__dirname, './api')
    }
  }
});
