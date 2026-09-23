import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Node 22+ can define its own global localStorage (on by default from Node 25),
// which shadows jsdom's and is empty without --localstorage-file. Turn it off
// in test workers; older Node doesn't know the flag.
const nodeMajor = Number(process.versions.node.split('.')[0]);
const workerExecArgv = nodeMajor >= 22 ? ['--no-experimental-webstorage'] : [];

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: false,
    testTimeout: 15000,
    poolOptions: {
      forks: { execArgv: workerExecArgv },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx,js,jsx}',
        'src/index.tsx',
        'src/setupTests.ts',
        'src/types/**',
      ],
    },
  },
});
