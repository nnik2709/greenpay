#!/usr/bin/env node

/**
 * Test Scripts for PNG Green Fees Application
 * 
 * This file contains different test configurations that can be run on demand
 * for different purposes (smoke tests, full regression, data creation, etc.)
 */

const { execSync } = require('child_process');

const testConfigurations = {
  // Quick smoke tests - basic functionality
  smoke: {
    description: 'Quick smoke tests - basic functionality only',
    tests: ['tests/auth.spec.js', 'tests/sample-data.spec.js'],
    timeout: 30000
  },

  // Full regression tests - all existing functionality
  regression: {
    description: 'Full regression tests - all existing functionality',
    tests: ['tests/auth.spec.js', 'tests/sample-data.spec.js', 'tests/supabase-connection.spec.js'],
    timeout: 120000
  },

  // Comprehensive menu navigation tests
  navigation: {
    description: 'Comprehensive menu navigation and UI verification',
    tests: ['tests/comprehensive-menu-navigation.spec.js'],
    timeout: 180000
  },

  // Form submission and data creation tests
  dataCreation: {
    description: 'Form submission and data creation tests (adds sample data to DB)',
    tests: ['tests/form-submission-data-creation.spec.js'],
    timeout: 300000
  },

  // Comprehensive data verification tests
  dataVerification: {
    description: 'Comprehensive data verification and UI testing',
    tests: ['tests/data-verification-comprehensive.spec.js'],
    timeout: 240000
  },

  // Full comprehensive test suite
  comprehensive: {
    description: 'Full comprehensive test suite - all tests',
    tests: [
      'tests/auth.spec.js',
      'tests/sample-data.spec.js', 
      'tests/supabase-connection.spec.js',
      'tests/comprehensive-menu-navigation.spec.js',
      'tests/data-verification-comprehensive.spec.js'
    ],
    timeout: 600000
  },

  // Production-specific tests
  production: {
    description: 'Production environment tests',
    tests: ['tests/auth.spec.js', 'tests/sample-data.spec.js', 'tests/supabase-connection.spec.js'],
    timeout: 120000,
    environment: 'production'
  }
};

function runTests(configName, environment = 'local') {
  const config = testConfigurations[configName];
  
  if (!config) {
    console.error(`❌ Unknown test configuration: ${configName}`);
    console.log('Available configurations:', Object.keys(testConfigurations).join(', '));
    process.exit(1);
  }

  console.log(`🚀 Running ${configName} tests...`);
  console.log(`📝 Description: ${config.description}`);
  console.log(`⏱️  Timeout: ${config.timeout}ms`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`📋 Test files: ${config.tests.join(', ')}`);
  console.log('');

  try {
    // Set environment variables
    const env = { ...process.env };
    
    if (environment === 'production') {
      env.PLAYWRIGHT_BASE_URL = 'https://eywademo.cloud';
    } else {
      env.PLAYWRIGHT_BASE_URL = 'http://localhost:3002';
    }

    // Build test command
    const testFiles = config.tests.join(' ');
    const command = `npx playwright test ${testFiles} --timeout=${config.timeout}`;

    console.log(`🔧 Command: ${command}`);
    console.log('');

    // Run tests
    execSync(command, { 
      stdio: 'inherit', 
      env,
      cwd: process.cwd()
    });

    console.log('');
    console.log('✅ Tests completed successfully!');
    console.log('📊 To view the HTML report, run: npx playwright show-report');

  } catch (error) {
    console.error('');
    console.error('❌ Tests failed!');
    console.error('📊 To view the HTML report, run: npx playwright show-report');
    process.exit(1);
  }
}

function showHelp() {
  console.log('🧪 PNG Green Fees Test Scripts');
  console.log('');
  console.log('Usage: node test-scripts.js <configuration> [environment]');
  console.log('');
  console.log('Available configurations:');
  console.log('');
  
  Object.entries(testConfigurations).forEach(([name, config]) => {
    console.log(`  ${name.padEnd(20)} - ${config.description}`);
  });
  
  console.log('');
  console.log('Environments:');
  console.log('  local       - Run tests against localhost:3002 (default)');
  console.log('  production  - Run tests against https://eywademo.cloud');
  console.log('');
  console.log('Examples:');
  console.log('  node test-scripts.js smoke');
  console.log('  node test-scripts.js regression local');
  console.log('  node test-scripts.js production production');
  console.log('  node test-scripts.js dataCreation local');
  console.log('  node test-scripts.js comprehensive production');
}

// Main execution
const args = process.argv.slice(2);
const configName = args[0];
const environment = args[1] || 'local';

if (!configName || configName === 'help' || configName === '--help' || configName === '-h') {
  showHelp();
  process.exit(0);
}

runTests(configName, environment);
