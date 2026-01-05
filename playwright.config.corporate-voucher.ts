import { defineConfig, devices } from '@playwright/test';

/**
 * Corporate Voucher Registration Flow Test - Production Configuration
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/corporate-voucher-registration-flow.spec.ts',

  // Run tests sequentially for this flow test
  fullyParallel: false,
  workers: 1,

  // No retries for manual verification
  retries: 0,

  // Timeout for entire test suite
  timeout: 120000, // 2 minutes per test

  // Reporter to use
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
  ],

  // Shared settings
  use: {
    // Production URL
    baseURL: 'https://greenpay.eywademo.cloud',

    // Collect trace always for debugging
    trace: 'on',

    // Screenshot always
    screenshot: 'on',

    // Video always for flow verification
    video: 'on',

    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Test on Chrome only for simplicity
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // No auth state - test will login directly
        // Use incognito mode to avoid session conflicts
        launchOptions: {
          args: ['--incognito']
        },
      },
    },
  ],

  // No web server needed (testing production)
});
