import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173/';
const usesLocalServer =
  new URL(baseURL).hostname === '127.0.0.1' || new URL(baseURL).hostname === 'localhost';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false,
  },
  webServer: usesLocalServer
    ? {
        command: 'npm run dev -- --host 127.0.0.1',
        url: 'http://127.0.0.1:5173/api/v1/categories',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: { baseURL },
    },
    {
      name: 'chromium',
      testMatch: /e2e\/.*\.spec\.ts/,
      testIgnore: /e2e\/mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: /e2e\/mobile\.spec\.ts/,
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'accessibility',
      testMatch: /accessibility\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
