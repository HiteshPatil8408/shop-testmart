import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/TestMart/' : '/',
  plugins: [react(), ...(process.env.VITEST || mode === 'pages' ? [] : [cloudflare()])],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/api/**/*.test.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
}));
