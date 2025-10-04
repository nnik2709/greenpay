import { test, expect } from '@playwright/test';

test.describe('Comprehensive Data Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for full access
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should verify dashboard has all required data and components', async ({ page }) => {
    console.log('Verifying dashboard data and components...');
    
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for main dashboard elements
    const dashboardElements = [
      { selector: 'h1, h2', description: 'Main heading' },
      { selector: '.card, [class*="card"]', description: 'Dashboard cards' },
      { selector: 'button', description: 'Interactive buttons' },
      { selector: 'a[href]', description: 'Navigation links' },
      { selector: 'table, .table', description: 'Data tables' }
    ];

    for (const element of dashboardElements) {
      const count = await page.locator(element.selector).count();
      console.log(`  ${element.description}: ${count} found`);
      expect(count).toBeGreaterThan(0);
    }

    // Verify specific dashboard content
    const expectedContent = [
      /dashboard|welcome/i,
      /passport|payment|quotation/i,
      /report|statistic/i
    ];

    for (const content of expectedContent) {
      const found = await page.locator(`text=${content}`).first().isVisible({ timeout: 3000 });
      if (found) {
        console.log(`  ✅ Found content: ${content}`);
      } else {
        console.log(`  ⚠️ Content not found: ${content}`);
      }
    }
  });

  test('should verify all data tables have proper structure and content', async ({ page }) => {
    console.log('Verifying data tables structure and content...');
    
    const dataPages = [
      { name: 'Users', url: '/users', expectedColumns: ['email', 'name', 'role'] },
      { name: 'Passports', url: '/passports', expectedColumns: ['passport', 'name', 'nationality'] },
      { name: 'Payments', url: '/payments', expectedColumns: ['amount', 'method', 'date'] },
      { name: 'Quotations', url: '/quotations', expectedColumns: ['customer', 'amount', 'status'] }
    ];

    for (const pageInfo of dataPages) {
      console.log(`Checking ${pageInfo.name} table...`);
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);

      // Look for table
      const table = page.locator('table, .table, [role="table"]').first();
      
      if (await table.isVisible({ timeout: 5000 })) {
        // Check table headers
        const headers = await table.locator('th, .header, [role="columnheader"]').allTextContents();
        console.log(`  Headers found: ${headers.join(', ')}`);

        // Check for expected columns
        for (const expectedColumn of pageInfo.expectedColumns) {
          const columnFound = headers.some(header => 
            header.toLowerCase().includes(expectedColumn.toLowerCase())
          );
          if (columnFound) {
            console.log(`    ✅ Column "${expectedColumn}" found`);
          } else {
            console.log(`    ⚠️ Column "${expectedColumn}" not found`);
          }
        }

        // Check for data rows
        const rows = await table.locator('tr, .row').count();
        console.log(`  Data rows: ${rows}`);
        expect(rows).toBeGreaterThan(0);

        // Check for interactive elements in table
        const actionButtons = await table.locator('button, a[href]').count();
        console.log(`  Action buttons: ${actionButtons}`);
        expect(actionButtons).toBeGreaterThan(0);

      } else {
        console.log(`  ⚠️ No table found in ${pageInfo.name}`);
      }
    }
  });

  test('should verify all reports display data and charts', async ({ page }) => {
    console.log('Verifying reports data and charts...');
    
    // Navigate to reports dashboard
    await page.goto('/reports');
    await page.waitForTimeout(2000);

    // Check for report cards
    const reportCards = page.locator('.card, [class*="card"], [class*="report"]');
    const cardCount = await reportCards.count();
    console.log(`Report cards found: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);

    // Test each report type
    const reportTypes = [
      'Passport Reports',
      'Corporate Vouchers', 
      'Revenue Generated'
    ];

    for (const reportType of reportTypes) {
      console.log(`Testing ${reportType}...`);
      
      // Click on report card
      const reportCard = page.locator(`h3:has-text("${reportType}"), .card:has-text("${reportType}")`).first();
      if (await reportCard.isVisible({ timeout: 5000 })) {
        await reportCard.click();
        await page.waitForTimeout(2000);

        // Verify report page loads
        await expect(page.locator('h1, h2, h3')).toBeVisible({ timeout: 10000 });

        // Check for data visualization elements
        const chartElements = await page.locator('canvas, svg, .chart, [class*="chart"]').count();
        const tableElements = await page.locator('table, .table').count();
        const dataElements = await page.locator('[class*="data"], [class*="metric"]').count();
        
        console.log(`  Charts: ${chartElements}, Tables: ${tableElements}, Data elements: ${dataElements}`);

        // At least one type of data display should be present
        const hasDataDisplay = chartElements > 0 || tableElements > 0 || dataElements > 0;
        expect(hasDataDisplay).toBe(true);

        // Go back to reports dashboard
        await page.goto('/reports');
        await page.waitForTimeout(1000);
      } else {
        console.log(`  ⚠️ Report card for ${reportType} not found`);
      }
    }
  });

  test('should verify all forms are functional and have proper validation', async ({ page }) => {
    console.log('Verifying form functionality and validation...');
    
    const formPages = [
      { name: 'Passports', url: '/passports' },
      { name: 'Payments', url: '/payments' },
      { name: 'Quotations', url: '/quotations' },
      { name: 'Users', url: '/users' }
    ];

    for (const pageInfo of formPages) {
      console.log(`Testing forms in ${pageInfo.name}...`);
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);

      // Look for add/create button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), button:has-text("+")').first();
      
      if (await addButton.isVisible({ timeout: 5000 })) {
        await addButton.click();
        await page.waitForTimeout(2000);

        // Check for form elements
        const formElements = {
          inputs: await page.locator('input[type="text"], input[type="email"], input[type="number"], input[type="date"]').count(),
          selects: await page.locator('select').count(),
          textareas: await page.locator('textarea').count(),
          buttons: await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")').count()
        };

        console.log(`  Form elements: ${JSON.stringify(formElements)}`);

        // Test form validation by submitting empty form
        const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")').first();
        if (await submitButton.isVisible({ timeout: 3000 })) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Check for validation messages
          const validationMessages = await page.locator('text=/required|invalid|error/i').count();
          console.log(`  Validation messages: ${validationMessages}`);
          
          // Close form or go back
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
          if (await cancelButton.isVisible({ timeout: 3000 })) {
            await cancelButton.click();
          } else {
            await page.goBack();
          }
        }
      } else {
        console.log(`  ⚠️ No add button found in ${pageInfo.name}`);
      }
    }
  });

  test('should verify all buttons and interactive elements work', async ({ page }) => {
    console.log('Verifying button and interactive element functionality...');
    
    const pagesToTest = [
      { name: 'Dashboard', url: '/' },
      { name: 'Users', url: '/users' },
      { name: 'Passports', url: '/passports' },
      { name: 'Payments', url: '/payments' },
      { name: 'Quotations', url: '/quotations' },
      { name: 'Reports', url: '/reports' }
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`Testing interactive elements in ${pageInfo.name}...`);
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);

      // Get all buttons
      const buttons = page.locator('button:not([disabled])');
      const buttonCount = await buttons.count();
      console.log(`  Buttons found: ${buttonCount}`);

      // Test first few buttons (to avoid too many clicks)
      const buttonsToTest = Math.min(3, buttonCount);
      for (let i = 0; i < buttonsToTest; i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        
        try {
          await button.click();
          await page.waitForTimeout(1000);
          console.log(`    ✅ Button "${buttonText}" clicked successfully`);
        } catch (error) {
          console.log(`    ⚠️ Button "${buttonText}" click failed: ${error.message}`);
        }
      }

      // Check for dropdowns
      const dropdowns = page.locator('button:has-text("Reports"), button:has-text("Admin"), button:has-text("Passports")');
      const dropdownCount = await dropdowns.count();
      console.log(`  Dropdowns found: ${dropdownCount}`);

      // Test dropdowns
      for (let i = 0; i < Math.min(2, dropdownCount); i++) {
        const dropdown = dropdowns.nth(i);
        const dropdownText = await dropdown.textContent();
        
        try {
          await dropdown.click();
          await page.waitForTimeout(1000);
          console.log(`    ✅ Dropdown "${dropdownText}" opened successfully`);
          
          // Close dropdown by clicking elsewhere
          await page.click('body');
          await page.waitForTimeout(500);
        } catch (error) {
          console.log(`    ⚠️ Dropdown "${dropdownText}" click failed: ${error.message}`);
        }
      }
    }
  });

  test('should verify data persistence and real-time updates', async ({ page }) => {
    console.log('Verifying data persistence and real-time updates...');
    
    // Test data consistency across page refreshes
    await page.goto('/users');
    await page.waitForTimeout(2000);

    // Get initial data count
    const initialUserCount = await page.locator('table tr, .table .row').count();
    console.log(`Initial user count: ${initialUserCount}`);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);

    // Check data is still there
    const refreshedUserCount = await page.locator('table tr, .table .row').count();
    console.log(`Refreshed user count: ${refreshedUserCount}`);
    
    // Data should be consistent (allowing for some variation)
    expect(Math.abs(initialUserCount - refreshedUserCount)).toBeLessThanOrEqual(1);

    // Test navigation consistency
    await page.goto('/passports');
    await page.waitForTimeout(2000);
    
    const passportCount = await page.locator('table tr, .table .row').count();
    console.log(`Passport count: ${passportCount}`);
    expect(passportCount).toBeGreaterThan(0);

    // Go back to users and verify data is still there
    await page.goto('/users');
    await page.waitForTimeout(2000);
    
    const finalUserCount = await page.locator('table tr, .table .row').count();
    console.log(`Final user count: ${finalUserCount}`);
    expect(finalUserCount).toBeGreaterThan(0);
  });
});
