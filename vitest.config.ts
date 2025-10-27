import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { MatrixReporter } from './src/test/matrix-reporter';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Use Matrix-themed reporter for fun, interactive test output
    // Falls back to default reporter if Matrix reporter is not available
    reporters: process.env.VITEST_MATRIX === 'true' ? [new MatrixReporter()] : ['default'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'virtual:pwa-register/react': path.resolve(__dirname, './src/test/mocks/pwa-register.ts'),
    },
  },
});