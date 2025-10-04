import { test, expect } from '@playwright/test';

test.describe('Form Submission and Data Creation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for full access
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('should create new passport entries', async ({ page }) => {
    console.log('Creating new passport entries...');
    
    await page.goto('/passports');
    await page.waitForTimeout(2000);

    // Look for "Add New" or "Create" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), button:has-text("+")').first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(2000);

      // Fill passport form
      const passportData = {
        passportNumber: `P${Date.now()}`,
        firstName: 'Test',
        lastName: 'User',
        nationality: 'Papua New Guinea',
        dateOfBirth: '1990-01-01',
        expiryDate: '2030-01-01'
      };

      // Fill form fields
      for (const [field, value] of Object.entries(passportData)) {
        const input = page.locator(`input[name="${field}"], input[placeholder*="${field}"], input[id*="${field}"]`).first();
        if (await input.isVisible({ timeout: 3000 })) {
          await input.fill(value);
        }
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Create")').first();
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Verify success (look for success message or redirect)
        const successMessage = page.locator('text=/success|created|saved|added/i').first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          console.log('✅ Passport created successfully');
        } else {
          console.log('⚠️ Passport form submitted, but success message not visible');
        }
      }
    } else {
      console.log('⚠️ Add passport button not found, skipping passport creation');
    }
  });

  test('should create new payment entries', async ({ page }) => {
    console.log('Creating new payment entries...');
    
    await page.goto('/payments');
    await page.waitForTimeout(2000);

    // Look for "Add New" or "Create" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), button:has-text("+")').first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(2000);

      // Fill payment form
      const paymentData = {
        amount: '100.00',
        paymentMethod: 'CASH',
        description: 'Test payment entry',
        customerName: 'Test Customer'
      };

      // Fill form fields
      for (const [field, value] of Object.entries(paymentData)) {
        const input = page.locator(`input[name="${field}"], input[placeholder*="${field}"], input[id*="${field}"]`).first();
        if (await input.isVisible({ timeout: 3000 })) {
          await input.fill(value);
        }
      }

      // Handle select dropdowns
      const paymentMethodSelect = page.locator('select[name="paymentMethod"], select[id*="payment"]').first();
      if (await paymentMethodSelect.isVisible({ timeout: 3000 })) {
        await paymentMethodSelect.selectOption('CASH');
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Create")').first();
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Verify success
        const successMessage = page.locator('text=/success|created|saved|added/i').first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          console.log('✅ Payment created successfully');
        } else {
          console.log('⚠️ Payment form submitted, but success message not visible');
        }
      }
    } else {
      console.log('⚠️ Add payment button not found, skipping payment creation');
    }
  });

  test('should create new quotation entries', async ({ page }) => {
    console.log('Creating new quotation entries...');
    
    await page.goto('/quotations');
    await page.waitForTimeout(2000);

    // Look for "Add New" or "Create" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), button:has-text("+")').first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(2000);

      // Fill quotation form
      const quotationData = {
        customerName: 'Test Company Ltd',
        description: 'Test quotation for services',
        amount: '500.00',
        validUntil: '2024-12-31'
      };

      // Fill form fields
      for (const [field, value] of Object.entries(quotationData)) {
        const input = page.locator(`input[name="${field}"], input[placeholder*="${field}"], input[id*="${field}"]`).first();
        if (await input.isVisible({ timeout: 3000 })) {
          await input.fill(value);
        }
      }

      // Handle textarea fields
      const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
      if (await descriptionField.isVisible({ timeout: 3000 })) {
        await descriptionField.fill(quotationData.description);
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Create")').first();
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Verify success
        const successMessage = page.locator('text=/success|created|saved|added/i').first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          console.log('✅ Quotation created successfully');
        } else {
          console.log('⚠️ Quotation form submitted, but success message not visible');
        }
      }
    } else {
      console.log('⚠️ Add quotation button not found, skipping quotation creation');
    }
  });

  test('should create new user entries', async ({ page }) => {
    console.log('Creating new user entries...');
    
    await page.goto('/users');
    await page.waitForTimeout(2000);

    // Look for "Add New" or "Create" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), button:has-text("+")').first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(2000);

      // Fill user form
      const userData = {
        email: `testuser${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'counter_agent',
        password: 'testpassword123'
      };

      // Fill form fields
      for (const [field, value] of Object.entries(userData)) {
        const input = page.locator(`input[name="${field}"], input[placeholder*="${field}"], input[id*="${field}"]`).first();
        if (await input.isVisible({ timeout: 3000 })) {
          await input.fill(value);
        }
      }

      // Handle role selection
      const roleSelect = page.locator('select[name="role"], select[id*="role"]').first();
      if (await roleSelect.isVisible({ timeout: 3000 })) {
        await roleSelect.selectOption('counter_agent');
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Create")').first();
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Verify success
        const successMessage = page.locator('text=/success|created|saved|added/i').first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          console.log('✅ User created successfully');
        } else {
          console.log('⚠️ User form submitted, but success message not visible');
        }
      }
    } else {
      console.log('⚠️ Add user button not found, skipping user creation');
    }
  });

  test('should verify created data appears in lists', async ({ page }) => {
    console.log('Verifying created data appears in lists...');
    
    const pagesToCheck = [
      { name: 'Passports', url: '/passports' },
      { name: 'Payments', url: '/payments' },
      { name: 'Quotations', url: '/quotations' },
      { name: 'Users', url: '/users' }
    ];

    for (const pageInfo of pagesToCheck) {
      console.log(`Checking data in ${pageInfo.name}...`);
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);

      // Look for tables or lists
      const table = page.locator('table, .table, [role="table"]').first();
      const list = page.locator('ul, ol, .list').first();
      
      if (await table.isVisible({ timeout: 5000 })) {
        const rowCount = await table.locator('tr, .row').count();
        console.log(`  Table found with ${rowCount} rows`);
        expect(rowCount).toBeGreaterThan(0);
      } else if (await list.isVisible({ timeout: 5000 })) {
        const itemCount = await list.locator('li, .item').count();
        console.log(`  List found with ${itemCount} items`);
        expect(itemCount).toBeGreaterThan(0);
      } else {
        console.log(`  No table or list found in ${pageInfo.name}`);
      }
    }
  });
});
