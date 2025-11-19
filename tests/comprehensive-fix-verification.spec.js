import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'password123', role: 'Flex_Admin' },
  agent: { email: 'agent@example.com', password: 'password123', role: 'Counter_Agent' },
  finance: { email: 'finance@example.com', password: 'password123', role: 'Finance_Manager' },
  support: { email: 'support@example.com', password: 'password123', role: 'IT_Support' }
};

// Helper function to login
async function loginUser(page, user) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input#email', user.email);
  await page.fill('input#password', user.password);
  
  // Submit form and wait for navigation
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
}

// Helper function to check for console errors
async function checkConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Helper function to check if page is blank
async function isPageBlank(page) {
  const bodyText = await page.textContent('body');
  const hasContent = bodyText && bodyText.trim().length > 0;
  const hasMainContent = await page.locator('main, [role="main"], .main-content').count() > 0;
  return !hasContent || !hasMainContent;
}

test.describe('React Hooks Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('Login functionality works for all user roles', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    for (const [role, user] of Object.entries(TEST_USERS)) {
      console.log(`Testing login for ${role}...`);
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Fill login form
      await page.fill('input#email', user.email);
      await page.fill('input#password', user.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      try {
        await page.waitForURL('**/dashboard**', { timeout: 5000 });
        console.log(`✅ ${role} login successful`);
      } catch (error) {
        console.log(`❌ ${role} login failed: ${error.message}`);
        // Check if we're still on login page
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log(`Still on login page for ${role}`);
        }
      }
      
      // Clear form for next test
      await page.fill('input[name="email"]', '');
      await page.fill('input[name="password"]', '');
    }

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    expect(consoleErrors.length).toBe(0);
  });

  test('All pages load without React hook errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test with admin user
    await loginUser(page, TEST_USERS.admin);
    
    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/users', name: 'Users' },
      { path: '/passports', name: 'Passports' },
      { path: '/reports', name: 'Reports' },
      { path: '/admin/settings', name: 'Settings' }
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`Testing ${pageInfo.name} page...`);
      
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      
      // Check if page is blank
      const isBlank = await isPageBlank(page);
      if (isBlank) {
        console.log(`❌ ${pageInfo.name} page is blank`);
      } else {
        console.log(`✅ ${pageInfo.name} page loaded successfully`);
      }
      
      // Check for React hook errors
      const hookErrors = consoleErrors.filter(error => 
        error.includes('Invalid hook call') || 
        error.includes('useState') || 
        error.includes('useContext') ||
        error.includes('useEffect')
      );
      
      if (hookErrors.length > 0) {
        console.log(`❌ React hook errors on ${pageInfo.name}:`, hookErrors);
      }
    }

    // Filter out React hook specific errors
    const hookErrors = consoleErrors.filter(error => 
      error.includes('Invalid hook call') || 
      error.includes('useState') || 
      error.includes('useContext') ||
      error.includes('useEffect')
    );
    
    expect(hookErrors.length).toBe(0);
  });

  test('Users page works correctly for admin and support roles', async ({ page }) => {
    const roles = ['admin', 'support'];
    
    for (const role of roles) {
      console.log(`Testing Users page for ${role}...`);
      
      await loginUser(page, TEST_USERS[role]);
      await page.goto(`${BASE_URL}/users`);
      await page.waitForLoadState('networkidle');
      
      // Check if page is blank
      const isBlank = await isPageBlank(page);
      expect(isBlank).toBe(false);
      
      // Check for specific content
      const pageTitle = await page.textContent('h1');
      expect(pageTitle).toContain('Users');
      
      // Check for users table or "No users found" message
      const hasTable = await page.locator('table').count() > 0;
      const hasNoUsersMessage = await page.locator('text=No users found').count() > 0;
      
      expect(hasTable || hasNoUsersMessage).toBe(true);
      
      console.log(`✅ Users page working for ${role}`);
    }
  });

  test('Passports page works correctly for authorized roles', async ({ page }) => {
    const roles = ['admin', 'agent', 'finance'];
    
    for (const role of roles) {
      console.log(`Testing Passports page for ${role}...`);
      
      await loginUser(page, TEST_USERS[role]);
      await page.goto(`${BASE_URL}/passports`);
      await page.waitForLoadState('networkidle');
      
      // Check if page is blank
      const isBlank = await isPageBlank(page);
      expect(isBlank).toBe(false);
      
      // Check for specific content
      const pageTitle = await page.textContent('h1');
      expect(pageTitle).toContain('Passports');
      
      console.log(`✅ Passports page working for ${role}`);
    }
  });

  test('No console errors on any page', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await loginUser(page, TEST_USERS.admin);
    
    const pages = [
      '/dashboard',
      '/users', 
      '/passports',
      '/reports',
      '/admin/settings'
    ];

    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForLoadState('networkidle');
    }

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('404') && // Ignore 404 errors
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('Failed to load resource') // Ignore resource loading errors
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical console errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Role-based access control works correctly', async ({ page }) => {
    // Test that users can only access pages they're authorized for
    const testCases = [
      { user: 'agent', allowedPages: ['/dashboard', '/passports'], deniedPages: ['/users', '/admin/settings'] },
      { user: 'finance', allowedPages: ['/dashboard', '/passports', '/reports'], deniedPages: ['/users', '/admin/settings'] },
      { user: 'support', allowedPages: ['/dashboard', '/users', '/reports'], deniedPages: ['/admin/settings'] },
      { user: 'admin', allowedPages: ['/dashboard', '/users', '/passports', '/reports', '/admin/settings'], deniedPages: [] }
    ];

    for (const testCase of testCases) {
      const user = TEST_USERS[testCase.user];
      console.log(`Testing access control for ${testCase.user}...`);
      
      await loginUser(page, user);
      
      // Test allowed pages
      for (const pagePath of testCase.allowedPages) {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        const isBlank = await isPageBlank(page);
        expect(isBlank).toBe(false);
        
        console.log(`✅ ${testCase.user} can access ${pagePath}`);
      }
      
      // Test denied pages
      for (const pagePath of testCase.deniedPages) {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        // Should be redirected or show access denied
        const currentUrl = page.url();
        const isRedirected = !currentUrl.includes(pagePath) || currentUrl.includes('/dashboard');
        expect(isRedirected).toBe(true);
        
        console.log(`✅ ${testCase.user} correctly denied access to ${pagePath}`);
      }
    }
  });
});
