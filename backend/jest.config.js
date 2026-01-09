module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],

  // Coverage configuration
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**'
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true
};
