import { test, expect } from '@playwright/test';

// Test data for different user roles
const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'password123',
    role: 'Flex_Admin'
  },
  finance: {
    email: 'finance@example.com', 
    password: 'password123',
    role: 'Finance_Manager'
  },
  agent: {
    email: 'agent@example.com',
    password: 'password123', 
    role: 'Counter_Agent'
  },
  it: {
    email: 'it@example.com',
    password: 'password123',
    role: 'IT_Support'
  }
};

// Helper function to login
async function loginUser(page, user) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
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
async function checkPageNotBlank(page, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  // Check if page has content
  const bodyText = await page.textContent('body');
  const hasContent = bodyText && bodyText.trim().length > 0;
  
  // Check for React error boundaries or error messages
  const errorElements = await page.locator('[data-testid="error-boundary"], .error, [class*="error"]').count();
  
  return {
    hasContent,
    errorCount: errorElements,
    isBlank: !hasContent || errorElements > 0
  };
}

test.describe('React Hooks Fix - All User Roles', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
  });

  test('Admin user can access all pages without React hook errors', async ({ page }) => {
    const user = testUsers.admin;
    await loginUser(page, user);
    
    // Test all admin-accessible pages
    const adminPages = [
      '/dashboard',
      '/users', 
      '/passports',
      '/passports/create',
      '/passports/bulk-upload',
      '/purchases',
      '/purchases/corporate-exit-pass',
      '/purchases/corporate-batch-history',
      '/cash-reconciliation',
      '/quotations',
      '/quotations/create',
      '/reports',
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated',
      '/reports/bulk-passport-uploads',
      '/reports/quotations',
      '/admin/payment-modes',
      '/admin/email-templates',
      '/admin/settings',
      '/admin/login-history',
      '/admin/sms-settings',
      '/corporate-batch-history',
      '/tickets'
    ];

    for (const pageUrl of adminPages) {
      console.log(`Testing admin access to: ${pageUrl}`);
      
      const pageCheck = await checkPageNotBlank(page, pageUrl);
      expect(pageCheck.isBlank).toBeFalsy();
      expect(pageCheck.hasContent).toBeTruthy();
      
      // Wait a bit for any async operations
      await page.waitForTimeout(1000);
    }
  });

  test('Finance Manager can access appropriate pages without errors', async ({ page }) => {
    const user = testUsers.finance;
    await loginUser(page, user);
    
    const financePages = [
      '/dashboard',
      '/passports',
      '/purchases',
      '/purchases/corporate-exit-pass', 
      '/purchases/corporate-batch-history',
      '/cash-reconciliation',
      '/quotations',
      '/quotations/create',
      '/reports',
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated',
      '/reports/bulk-passport-uploads',
      '/reports/quotations'
    ];

    for (const pageUrl of financePages) {
      console.log(`Testing finance access to: ${pageUrl}`);
      
      const pageCheck = await checkPageNotBlank(page, pageUrl);
      expect(pageCheck.isBlank).toBeFalsy();
      expect(pageCheck.hasContent).toBeTruthy();
      
      await page.waitForTimeout(1000);
    }
  });

  test('Counter Agent can access appropriate pages without errors', async ({ page }) => {
    const user = testUsers.agent;
    await loginUser(page, user);
    
    const agentPages = [
      '/dashboard',
      '/agent',
      '/passports',
      '/passports/create',
      '/passports/bulk-upload',
      '/purchases',
      '/purchases/corporate-exit-pass',
      '/purchases/offline-template',
      '/purchases/offline-upload',
      '/cash-reconciliation',
      '/scan'
    ];

    for (const pageUrl of agentPages) {
      console.log(`Testing agent access to: ${pageUrl}`);
      
      const pageCheck = await checkPageNotBlank(page, pageUrl);
      expect(pageCheck.isBlank).toBeFalsy();
      expect(pageCheck.hasContent).toBeTruthy();
      
      await page.waitForTimeout(1000);
    }
  });

  test('IT Support can access appropriate pages without errors', async ({ page }) => {
    const user = testUsers.it;
    await loginUser(page, user);
    
    const itPages = [
      '/dashboard',
      '/users',
      '/purchases/corporate-batch-history',
      '/reports',
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated',
      '/reports/bulk-passport-uploads',
      '/reports/quotations',
      '/admin/login-history',
      '/corporate-batch-history',
      '/tickets'
    ];

    for (const pageUrl of itPages) {
      console.log(`Testing IT access to: ${pageUrl}`);
      
      const pageCheck = await checkPageNotBlank(page, pageUrl);
      expect(pageCheck.isBlank).toBeFalsy();
      expect(pageCheck.hasContent).toBeTruthy();
      
      await page.waitForTimeout(1000);
    }
  });

  test('No React hook errors in console for any user role', async ({ page }) => {
    const users = Object.values(testUsers);
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    for (const user of users) {
      await loginUser(page, user);
      
      // Navigate to a few key pages
      const keyPages = ['/dashboard', '/users', '/passports', '/purchases'];
      
      for (const pageUrl of keyPages) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
    }

    // Filter out React hook errors
    const reactHookErrors = consoleErrors.filter(error => 
      error.includes('Invalid hook call') || 
      error.includes('useState') || 
      error.includes('useEffect') ||
      error.includes('useContext') ||
      error.includes('Cannot read properties of null')
    );

    expect(reactHookErrors).toHaveLength(0);
  });

  test('Users page loads correctly with proper functionality', async ({ page }) => {
    const user = testUsers.admin;
    await loginUser(page, user);
    
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    const pageCheck = await checkPageNotBlank(page, '/users');
    expect(pageCheck.isBlank).toBeFalsy();
    expect(pageCheck.hasContent).toBeTruthy();
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText('Users');
    await expect(page.locator('button:has-text("Add User")')).toBeVisible();
    
    // Test Add User modal
    await page.click('button:has-text("Add User")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
  });

  test('Passports page loads correctly with proper functionality', async ({ page }) => {
    const user = testUsers.admin;
    await loginUser(page, user);
    
    await page.goto('/passports');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    const pageCheck = await checkPageNotBlank(page, '/passports');
    expect(pageCheck.isBlank).toBeFalsy();
    expect(pageCheck.hasContent).toBeTruthy();
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText('Passport Management');
    await expect(page.locator('input[placeholder*="Passport Number"]')).toBeVisible();
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    await expect(page.locator('button:has-text("Create New Passport")')).toBeVisible();
    await expect(page.locator('button:has-text("Scan with Camera")')).toBeVisible();
  });

  test('Dashboard loads correctly with charts and data', async ({ page }) => {
    const user = testUsers.admin;
    await loginUser(page, user);
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    const pageCheck = await checkPageNotBlank(page, '/dashboard');
    expect(pageCheck.isBlank).toBeFalsy();
    expect(pageCheck.hasContent).toBeTruthy();
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('input[type="date"]')).toHaveCount(2); // From and To date inputs
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
  });

  test('Role-based access control works correctly', async ({ page }) => {
    // Test that non-admin users cannot access admin pages
    const agent = testUsers.agent;
    await loginUser(page, agent);
    
    // Try to access admin-only page
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected or show access denied
    const currentUrl = page.url();
    const isRedirected = !currentUrl.includes('/users');
    const hasAccessDenied = await page.locator('text=Access denied, text=Unauthorized, text=403').count() > 0;
    
    expect(isRedirected || hasAccessDenied).toBeTruthy();
  });

  test('No blank pages for any accessible route', async ({ page }) => {
    const user = testUsers.admin;
    await loginUser(page, user);
    
    // Test all routes that should be accessible
    const allRoutes = [
      '/dashboard',
      '/users',
      '/passports', 
      '/passports/create',
      '/passports/bulk-upload',
      '/purchases',
      '/purchases/corporate-exit-pass',
      '/purchases/corporate-batch-history',
      '/cash-reconciliation',
      '/quotations',
      '/quotations/create',
      '/reports',
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated',
      '/reports/bulk-passport-uploads',
      '/reports/quotations',
      '/admin/payment-modes',
      '/admin/email-templates',
      '/admin/settings',
      '/admin/login-history',
      '/admin/sms-settings',
      '/corporate-batch-history',
      '/tickets'
    ];

    for (const route of allRoutes) {
      console.log(`Testing route: ${route}`);
      
      const pageCheck = await checkPageNotBlank(page, route);
      expect(pageCheck.isBlank).toBeFalsy();
      expect(pageCheck.hasContent).toBeTruthy();
      
      await page.waitForTimeout(500);
    }
  });
});
