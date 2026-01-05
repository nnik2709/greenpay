import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal config for role-based smoke + auth setup against a deployed base URL.
 * Set PLAYWRIGHT_BASE_URL to target prod/stage (default: https://greenpay.eywademo.cloud).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-smoke', open: 'never' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://greenpay.eywademo.cloud',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'setup-flex-admin',
      testMatch: /auth-flex-admin\.setup\.mjs/,
    },
    {
      name: 'setup-finance-manager',
      testMatch: /auth-finance-manager\.setup\.mjs/,
    },
    {
      name: 'setup-counter-agent',
      testMatch: /auth-counter-agent\.setup\.mjs/,
    },
    {
      name: 'setup-it-support',
      testMatch: /auth-it-support\.setup\.mjs/,
    },
    {
      name: 'smoke',
      testMatch: /user-testing-smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [
        'setup-flex-admin',
        'setup-finance-manager',
        'setup-counter-agent',
        'setup-it-support',
      ],
    },
    {
      name: 'role-activities',
      testMatch: /role-activities\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [
        'setup-flex-admin',
        'setup-finance-manager',
        'setup-counter-agent',
        'setup-it-support',
      ],
    },
    {
      name: 'todo-finance',
      testMatch: /todo-batch-finance-manager\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [
        'setup-finance-manager',
        'setup-flex-admin',
        'setup-counter-agent',
        'setup-it-support',
      ],
    },
    {
      name: 'todo-counter',
      testMatch: /todo-batch-counter-agent\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [
        'setup-counter-agent',
        'setup-flex-admin',
        'setup-finance-manager',
        'setup-it-support',
      ],
    },
    {
      name: 'todo-flexadmin-public',
      testMatch: /todo-batch-flexadmin-public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [
        'setup-flex-admin',
        'setup-finance-manager',
        'setup-counter-agent',
        'setup-it-support',
      ],
    },
    {
      name: 'todo-errors',
      testMatch: /todo-batch-errors-public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: [
        'setup-counter-agent',
        'setup-finance-manager',
        'setup-flex-admin',
        'setup-it-support',
      ],
    },
  ],
});

