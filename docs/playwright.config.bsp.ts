import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BSP DOKU Payment Tests
 *
 * Separate config to avoid auth setup dependencies
 * Tests public payment flow - no authentication needed
 */
export default defineConfig({
  testDir: './tests/bsp-payment',

  // Run tests in parallel
  fullyParallel: false, // Run sequentially to avoid BSP rate limits

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 1,

  // Use single worker to avoid overwhelming BSP staging
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL - use production URL for BSP tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://greenpay.eywademo.cloud',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 15000,

    // Maximum time navigation can take (BSP redirects can be slow)
    navigationTimeout: 60000,

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Timeout for each test
  timeout: 120000, // 2 minutes per test (includes payment processing)

  // Global timeout for entire test suite
  globalTimeout: 600000, // 10 minutes

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // No authentication needed for public payment flow
      },
    },
  ],

  // Don't start local dev server - tests run against deployed environment
  // webServer: undefined,
});
