import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for User Guide Flow Tests
 * These tests handle authentication in their beforeEach hooks
 */
export default defineConfig({
  testDir: './tests/user-guide-flows',

  // Run tests sequentially to avoid conflicts
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // One test at a time
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-screenshots/user-guide-flows/report' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Always capture screenshots
    screenshot: 'on',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 15000,

    // Maximum time navigation can take
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
