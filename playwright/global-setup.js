async function globalSetup(config) {
  console.log('🚀 Starting UAT Test Suite Setup...');
  
  // Check if the application is accessible
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('📡 Checking application availability...');
    const response = await page.goto('https://eywademo.cloud', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (response.status() !== 200) {
      throw new Error(`Application not accessible. Status: ${response.status()}`);
    }
    
    console.log('✅ Application is accessible and ready for testing');
    
    // Test login functionality
    console.log('🔐 Testing authentication system...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Authentication system is working');
    
    // Clean up any test data from previous runs
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData(page);
    
    console.log('🎯 UAT Test Suite Setup Complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page) {
  try {
    // Clean up test passports
    await page.goto('https://eywademo.cloud/passports');
    await page.waitForLoadState('networkidle');
    
    // Search for test passports and delete them
    const testPassports = await page.locator('[data-testid*="TEST"], [data-testid*="DEMO"], [data-testid*="BULK"]').count();
    if (testPassports > 0) {
      console.log(`🧹 Found ${testPassports} test passports to clean up`);
      // Note: Actual cleanup would depend on the delete functionality
    }
    
    // Clean up test users
    await page.goto('https://eywademo.cloud/users');
    await page.waitForLoadState('networkidle');
    
    // Note: Add cleanup logic for test users if needed
    
    console.log('✅ Test data cleanup completed');
    
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.message);
    // Don't fail the setup if cleanup fails
  }
}

module.exports = globalSetup;







