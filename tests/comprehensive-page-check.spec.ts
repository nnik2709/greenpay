import { test, expect } from '@playwright/test';

const pages = [
  { url: '/dashboard', name: 'Dashboard', expectText: 'Overall Revenue' },
  { url: '/users', name: 'Users', expectText: 'Users' },
  { url: '/passports', name: 'Passports', expectText: 'Passports' },
  { url: '/purchases', name: 'Purchases', expectText: 'Purchases' },
  { url: '/quotations', name: 'Quotations', expectText: 'Quotations' },
  { url: '/reports', name: 'Reports', expectText: 'Reports' },
  { url: '/cash-reconciliation', name: 'Cash Reconciliation', expectText: 'Cash Reconciliation' },
  { url: '/scan', name: 'Scan & Validate', expectText: 'Scan' },
  { url: '/individual-purchase', name: 'Individual Purchase', expectText: 'Individual' },
  { url: '/purchases/corporate-exit-pass', name: 'Corporate Exit Pass', expectText: 'Corporate' },
  { url: '/passports/bulk-upload', name: 'Bulk Upload', expectText: 'Bulk' },
  { url: '/admin/payment-modes', name: 'Payment Modes', expectText: 'Payment' },
  { url: '/quotations/create', name: 'Create Quotation', expectText: 'Quotation' },
];

test.describe('Comprehensive Page Check - Admin User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page should load without errors`, async ({ page }) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Monitor console
      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
          // Filter out safe warnings
          if (!text.includes('UNSAFE_componentWillMount') && 
              !text.includes('React DevTools') &&
              !text.includes('Invalid value for prop')) {
            errors.push(text);
          }
        }
      });

      page.on('pageerror', error => {
        errors.push(`Page error: ${error.message}`);
      });

      // Navigate to page
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);

      // Check if page loaded (not blank)
      const bodyText = await page.textContent('body');
      const hasContent = bodyText && bodyText.trim().length > 100;

      // Log results
      console.log(`\n=== ${pageInfo.name.toUpperCase()} ===`);
      console.log(`URL: ${pageInfo.url}`);
      console.log(`Has Content: ${hasContent ? '✅ YES' : '❌ NO'}`);
      console.log(`Console Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach(err => console.log(`  - ${err}`));
      }

      // Take screenshot
      await page.screenshot({ 
        path: `test-results/page-check-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });

      // Verify page has content
      expect(hasContent).toBe(true);
      
      // Verify no real errors
      expect(errors).toHaveLength(0);
    });
  }
});


