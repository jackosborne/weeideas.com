import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 20000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8173',
    viewport: { width: 1280, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: '**/site.spec.mjs',
      use: { browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
    },
    { name: 'firefox', testMatch: '**/site.spec.mjs', use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: '**/site.spec.mjs', use: { browserName: 'webkit' } },
    {
      name: 'iphone-webkit',
      testMatch: '**/mobile.spec.mjs',
      use: { ...devices['iPhone 13'], browserName: 'webkit' },
    },
  ],
  webServer: {
    command: 'npm run build:test && node scripts/serve-tests.mjs',
    url: 'http://127.0.0.1:8173',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
