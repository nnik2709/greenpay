import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Manual Test Automation
 * Simplified config without auth setup dependencies
 */
export default defineConfig({
  testDir: './tests/manual-test-scenarios',

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'reports/manual-tests' }],
    ['json', { outputFile: 'reports/manual-tests/results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'https://greenpay.eywademo.cloud',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  timeout: 120000,
});
