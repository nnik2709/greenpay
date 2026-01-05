import { defineConfig, devices } from '@playwright/test';

/**
 * Passport-Voucher Integration Test Configuration
 * Standalone config for testing the new passport integration feature
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/passport-voucher*.spec.ts',

  // Run tests sequentially
  fullyParallel: false,
  workers: 1,

  // Retries
  retries: 0,

  // Reporter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-passport', open: 'never' }],
    ['json', { outputFile: 'test-results/passport-results.json' }]
  ],

  // Shared settings
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://greenpay.eywademo.cloud',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
