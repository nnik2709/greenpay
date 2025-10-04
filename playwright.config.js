import { defineConfig, devices } from '@playwright/test';

// Get base URL from environment variable or default to localhost
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
const isRemote = baseURL.includes('eywademo.cloud') || baseURL.includes('195.200.14.62');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // One worker to avoid race conditions
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start web server for localhost testing
  ...(isRemote ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
});
