/**
 * Jest Test Setup
 *
 * This file runs before all tests to set up the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'greenpay_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests (comment out to see logs)
global.console = {
  ...console,
  log: jest.fn(), // Silence console.log
  debug: jest.fn(), // Silence console.debug
  info: jest.fn(), // Silence console.info
  warn: jest.fn(), // Keep warnings
  error: jest.fn(), // Keep errors
};

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
  await new Promise(resolve => setTimeout(resolve, 500)); // Give time for async operations to finish
});
