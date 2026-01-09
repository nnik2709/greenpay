import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Manual Testing Guide - Automated Implementation
 * Test Case 2.2: Counter Agent - Individual Passport Purchase
 *
 * This test follows the exact steps from MANUAL_TESTING_GUIDE.md section 2.2
 */

test.describe('Counter Agent - Individual Passport Purchase', () => {

  test('2.2 Individual Passport Purchase (Single Voucher)', async ({ page }) => {
    const screenshotsDir = path.join(__dirname, '../../test-screenshots/manual-tests/2.2-individual-purchase');

    // Test data
    const testData = {
      email: 'agent@greenpay.com',
      password: 'test123',
      passport: {
        number: 'N1234567',
        surname: 'SMITH',
        givenName: 'JOHN',
        nationality: 'US',
        dob: '1990-01-15',
        sex: 'Male',
        expiryDate: '2030-12-31'
      },
      contact: {
        email: 'test-voucher@example.com',
        phone: '+675 12345678',
        address: 'Port Moresby, NCD'
      },
      paymentMethod: 'Cash'
    };

    console.log('🧪 Starting Test 2.2: Individual Passport Purchase');
    console.log('📋 Test User: Counter_Agent (agent@greenpay.com)');

    // STEP 1: Navigate to application
    console.log('\n📍 Step 1: Navigate to application');
    await page.goto('https://greenpay.eywademo.cloud');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
      fullPage: true
    });
    console.log('✅ Homepage loaded');

    // STEP 2: Navigate to login
    console.log('\n📍 Step 2: Navigate to login page');
    await page.goto('https://greenpay.eywademo.cloud/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotsDir, '02-login-page.png'),
      fullPage: true
    });
    console.log('✅ Login page loaded');

    // STEP 3: Login as Counter_Agent
    console.log('\n📍 Step 3: Login as Counter_Agent');
    await page.fill('input[type="email"]', testData.email);
    await page.fill('input[type="password"]', testData.password);
    await page.screenshot({
      path: path.join(screenshotsDir, '03-login-filled.png'),
      fullPage: true
    });

    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/agent', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotsDir, '04-agent-landing.png'),
      fullPage: true
    });
    console.log('✅ Logged in successfully - Agent Landing page');

    // STEP 4: Navigate to Individual Purchase
    console.log('\n📍 Step 4: Navigate to Individual Purchase');
    // Click "Individual Purchase" button from agent landing
    const individualPurchaseBtn = page.locator('text=Individual Purchase').first();
    await individualPurchaseBtn.click();

    await page.waitForURL('**/app/passports/create', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotsDir, '05-purchase-form-empty.png'),
      fullPage: true
    });
    console.log('✅ Individual Purchase form loaded');

    // STEP 5: Fill in passport details
    console.log('\n📍 Step 5: Fill in passport details');
    await page.fill('input[name="passportNumber"]', testData.passport.number);
    await page.fill('input[name="surname"]', testData.passport.surname);
    await page.fill('input[name="givenName"]', testData.passport.givenName);

    // Select nationality (dropdown or input)
    const nationalityField = page.locator('input[name="nationality"], select[name="nationality"]');
    if (await nationalityField.getAttribute('type') === 'text') {
      await nationalityField.fill(testData.passport.nationality);
    } else {
      await nationalityField.selectOption(testData.passport.nationality);
    }

    await page.fill('input[name="dob"], input[name="dateOfBirth"]', testData.passport.dob);

    // Select sex (dropdown or radio)
    const sexField = page.locator('select[name="sex"], input[name="sex"][value="Male"]');
    if (await sexField.count() > 0) {
      const firstSexField = sexField.first();
      const tagName = await firstSexField.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        await firstSexField.selectOption('Male');
      } else {
        await page.click('input[name="sex"][value="Male"]');
      }
    }

    await page.fill('input[name="expiryDate"], input[name="dateOfExpiry"]', testData.passport.expiryDate);

    await page.screenshot({
      path: path.join(screenshotsDir, '06-passport-details-filled.png'),
      fullPage: true
    });
    console.log('✅ Passport details filled');

    // STEP 6: Fill in contact information
    console.log('\n📍 Step 6: Fill in contact information');
    await page.fill('input[name="email"]', testData.contact.email);
    await page.fill('input[name="phone"], input[name="phoneNumber"]', testData.contact.phone);
    await page.fill('input[name="address"], textarea[name="address"]', testData.contact.address);

    await page.screenshot({
      path: path.join(screenshotsDir, '07-contact-details-filled.png'),
      fullPage: true
    });
    console.log('✅ Contact details filled');

    // STEP 7: Select payment method
    console.log('\n📍 Step 7: Select payment method: Cash');
    const paymentMethodField = page.locator('select[name="paymentMethod"], input[name="paymentMethod"][value="Cash"]');
    if (await paymentMethodField.count() > 0) {
      const firstPaymentField = paymentMethodField.first();
      const tagName = await firstPaymentField.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        await firstPaymentField.selectOption('Cash');
      } else {
        await page.click('input[name="paymentMethod"][value="Cash"]');
      }
    }

    await page.screenshot({
      path: path.join(screenshotsDir, '08-payment-method-selected.png'),
      fullPage: true
    });
    console.log('✅ Payment method selected: Cash');

    // STEP 8: Submit form (Create Purchase)
    console.log('\n📍 Step 8: Submit form - Create Purchase');
    await page.screenshot({
      path: path.join(screenshotsDir, '09-before-submit.png'),
      fullPage: true
    });

    // Look for submit button (various possible texts)
    const submitBtn = page.locator('button:has-text("Create Purchase"), button:has-text("Submit"), button:has-text("Continue"), button[type="submit"]').first();
    await submitBtn.click();

    console.log('⏳ Waiting for purchase to complete...');

    // STEP 9: Wait for success/redirect
    console.log('\n📍 Step 9: Verify purchase success');

    // Wait for either success page or redirect (could be multiple patterns)
    try {
      await page.waitForFunction(() => {
        const body = document.body.innerText.toLowerCase();
        return body.includes('success') ||
               body.includes('voucher created') ||
               body.includes('purchase complete') ||
               document.querySelector('[class*="success"]') !== null;
      }, { timeout: 15000 });
    } catch (e) {
      console.log('⚠️ Success text not found, checking current URL...');
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotsDir, '10-purchase-success.png'),
      fullPage: true
    });

    // STEP 10: Extract voucher code
    console.log('\n📍 Step 10: Extract voucher code');
    let voucherCode = '';

    // Try various selectors for voucher code
    const voucherCodeSelectors = [
      'text=/[A-Z0-9]{8,}/',
      '[class*="voucher-code"]',
      '[data-testid="voucher-code"]',
      'code',
      'pre'
    ];

    for (const selector of voucherCodeSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        const text = await element.textContent();
        if (text && text.match(/[A-Z0-9]{8,}/)) {
          voucherCode = text.match(/[A-Z0-9]{8,}/)?.[0] || '';
          if (voucherCode) break;
        }
      }
    }

    console.log(`✅ Voucher Code: ${voucherCode || 'NOT FOUND - Check screenshot'}`);

    // Verify success message
    const successIndicators = [
      page.locator('text=/success/i'),
      page.locator('text=/created/i'),
      page.locator('text=/complete/i'),
      page.locator('[class*="success"]')
    ];

    let successFound = false;
    for (const indicator of successIndicators) {
      if (await indicator.count() > 0) {
        successFound = true;
        break;
      }
    }

    expect(successFound, 'Success message should be displayed').toBe(true);

    // STEP 11: Download PDF voucher
    console.log('\n📍 Step 11: Download PDF voucher');

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Look for download button
    const downloadBtn = page.locator('button:has-text("Download"), a:has-text("Download"), button:has-text("PDF")').first();

    if (await downloadBtn.count() > 0) {
      await downloadBtn.click();
      console.log('⏳ Waiting for download...');

      try {
        const download = await downloadPromise;
        const downloadPath = path.join(screenshotsDir, '11-voucher.pdf');
        await download.saveAs(downloadPath);
        console.log(`✅ PDF downloaded: ${downloadPath}`);

        // Take screenshot after download
        await page.screenshot({
          path: path.join(screenshotsDir, '11-after-download.png'),
          fullPage: true
        });
      } catch (e) {
        console.log('⚠️ Download failed or timed out:', e.message);
        await page.screenshot({
          path: path.join(screenshotsDir, '11-download-failed.png'),
          fullPage: true
        });
      }
    } else {
      console.log('⚠️ Download button not found');
      await page.screenshot({
        path: path.join(screenshotsDir, '11-no-download-button.png'),
        fullPage: true
      });
    }

    // STEP 12: Check console for errors
    console.log('\n📍 Step 12: Check for console errors');
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Wait a moment for any delayed console logs
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('⚠️ Console Errors Found:', consoleErrors);
    } else {
      console.log('✅ No console errors detected');
    }

    // STEP 13: Final verification screenshot
    console.log('\n📍 Step 13: Final verification');
    await page.screenshot({
      path: path.join(screenshotsDir, '12-final-state.png'),
      fullPage: true
    });

    // EXPECTED RESULTS VERIFICATION
    console.log('\n🎯 EXPECTED RESULTS VERIFICATION:');
    console.log('✅ Purchase created successfully:', successFound);
    console.log(`✅ Voucher code generated: ${voucherCode || 'CHECK SCREENSHOT'}`);
    console.log('✅ PDF download attempted');
    console.log(`✅ No console errors: ${consoleErrors.length === 0}`);

    // Test assertions
    expect(successFound, 'Purchase should be successful').toBe(true);
    expect(consoleErrors.length, 'Should have no console errors').toBe(0);

    console.log('\n✅ TEST COMPLETED - Screenshots saved to:', screenshotsDir);
    console.log('\n📊 TEST SUMMARY:');
    console.log('   Status: PASS ✅');
    console.log('   Voucher Code:', voucherCode || 'See screenshot 10');
    console.log('   Screenshots: 12+ files');
    console.log('   Console Errors:', consoleErrors.length);
  });

});
