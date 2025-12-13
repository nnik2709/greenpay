import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * GreenPay Production Test Configuration
 * Comprehensive test suite for https://greenpay.eywademo.cloud
 */
export default defineConfig({
  testDir: './tests/production',

  // Run tests sequentially to avoid conflicts
  fullyParallel: false,

  // Don't allow test.only in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests once
  retries: process.env.CI ? 2 : 1,

  // Run one worker at a time to avoid race conditions
  workers: 1,

  // Timeout for each test (increased for slow backend)
  timeout: 120000,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],

  // Shared settings for all projects
  use: {
    // Production URL
    baseURL: 'https://greenpay.eywademo.cloud',

    // Capture trace on failure
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser options
    headless: true,
    viewport: { width: 1280, height: 720 },

    // Timeouts (increased for slow backend)
    navigationTimeout: 60000,
    actionTimeout: 20000,

    // Ignore HTTPS errors (self-signed certs)
    ignoreHTTPSErrors: true,
  },

  // Test projects
  projects: [
    // Setup authentication for each role
    {
      name: 'setup-flex-admin',
      testMatch: /.*auth-flex-admin\.setup\.ts/,
    },
    {
      name: 'setup-finance-manager',
      testMatch: /.*auth-finance-manager\.setup\.ts/,
    },
    {
      name: 'setup-counter-agent',
      testMatch: /.*auth-counter-agent\.setup\.ts/,
    },
    {
      name: 'setup-it-support',
      testMatch: /.*auth-it-support\.setup\.ts/,
    },

    // Flex_Admin tests
    {
      name: 'flex-admin',
      testMatch: /.*\.flex-admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/flex-admin.json',
      },
      dependencies: ['setup-flex-admin'],
    },

    // Finance_Manager tests
    {
      name: 'finance-manager',
      testMatch: /.*\.finance-manager\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/finance-manager.json',
      },
      dependencies: ['setup-finance-manager'],
    },

    // Counter_Agent tests
    {
      name: 'counter-agent',
      testMatch: /.*\.counter-agent\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/counter-agent.json',
      },
      dependencies: ['setup-counter-agent'],
    },

    // IT_Support tests
    {
      name: 'it-support',
      testMatch: /.*\.it-support\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/it-support.json',
      },
      dependencies: ['setup-it-support'],
    },

    // Smoke tests (run on all roles)
    {
      name: 'smoke',
      testMatch: /.*\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: 'test-results/',
});
