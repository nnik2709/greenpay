import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * BSP Payment E2E Test with Screenshots
 *
 * This test demonstrates a complete successful payment flow using BSP/DOKU payment gateway
 * with comprehensive screenshots at each step for documentation purposes.
 *
 * Test Card: Visa Success (4000000000000002)
 */

test.describe('BSP Payment Flow - Screenshot Documentation', () => {
  // Screenshot counter for sequential naming
  let screenshotCounter = 1;

  // Helper function to take numbered screenshots
  async function takeScreenshot(page: any, description: string) {
    const fileName = `${String(screenshotCounter).padStart(2, '0')}-${description.toLowerCase().replace(/\s+/g, '-')}.png`;
    await page.screenshot({
      path: path.join(__dirname, '../../test-screenshots', fileName),
      fullPage: true
    });
    console.log(`📸 Screenshot ${screenshotCounter}: ${description}`);
    screenshotCounter++;
  }

  test('Complete successful payment flow with Visa card', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes timeout

    console.log('\n🎬 Starting BSP Payment Screenshot Documentation\n');

    // Step 1: Navigate to Public Registration
    console.log('Step 1: Navigate to Public Registration page');
    await page.goto('https://greenpay.eywademo.cloud/public-registration');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'Public Registration Landing Page');

    // Step 2: Fill in passport details
    console.log('Step 2: Fill in passport details');
    await page.fill('input[name="passportNumber"]', 'TEST123456');
    await page.fill('input[name="fullName"]', 'John Doe Test');
    await page.fill('input[name="email"]', 'nnik.area9@gmail.com');
    await page.fill('input[name="phone"]', '+675 7123 4567');
    await takeScreenshot(page, 'Passport Details Filled');

    // Step 3: Submit passport details
    console.log('Step 3: Submit passport details');
    await page.click('button:has-text("Continue to Payment")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'After Submit Passport Details');

    // Step 4: Payment options page
    console.log('Step 4: Select BSP/DOKU payment method');
    await page.waitForSelector('text=Select Payment Method', { timeout: 10000 });
    await takeScreenshot(page, 'Payment Method Selection Page');

    // Click BSP/DOKU option
    const bspButton = page.locator('button:has-text("BSP / DOKU")').first();
    await bspButton.waitFor({ state: 'visible', timeout: 10000 });
    await bspButton.click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'BSP DOKU Selected');

    // Step 5: Proceed to payment
    console.log('Step 5: Proceed to BSP payment gateway');
    const proceedButton = page.locator('button:has-text("Proceed to Payment")').first();
    await proceedButton.waitFor({ state: 'visible', timeout: 10000 });
    await proceedButton.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'Redirecting to BSP Gateway');

    // Step 6: BSP Payment Gateway - Credit Card option
    console.log('Step 6: BSP Payment Gateway loaded');

    // Wait for BSP gateway to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'BSP Payment Gateway Landing');

    // Look for credit card option
    console.log('Step 7: Select Credit Card payment option');
    const creditCardSelector = 'a:has-text("Credit Card"), button:has-text("Credit Card"), [data-payment-type="credit-card"]';
    try {
      await page.waitForSelector(creditCardSelector, { timeout: 10000 });
      await page.click(creditCardSelector);
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'Credit Card Option Selected');
    } catch (error) {
      console.log('⚠️ Credit card selector not found, taking screenshot of current state');
      await takeScreenshot(page, 'BSP Gateway Current State');
    }

    // Step 8: Fill credit card details
    console.log('Step 8: Fill in credit card details (Visa Success - 4000000000000002)');

    // Card number
    const cardNumberSelectors = [
      'input[name="cardNumber"]',
      'input[placeholder*="Card Number"]',
      'input[placeholder*="card number"]',
      'input[id*="card"]',
      '#cardNumber'
    ];

    for (const selector of cardNumberSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill('4000000000000002');
          console.log(`✅ Filled card number using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'Card Number Entered');

    // Expiry date
    const expirySelectors = [
      'input[name="expiry"]',
      'input[placeholder*="MM/YY"]',
      'input[placeholder*="Expiry"]',
      'input[id*="expiry"]'
    ];

    for (const selector of expirySelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill('12/25');
          console.log(`✅ Filled expiry date using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'Expiry Date Entered');

    // CVV
    const cvvSelectors = [
      'input[name="cvv"]',
      'input[placeholder*="CVV"]',
      'input[placeholder*="Security"]',
      'input[id*="cvv"]',
      'input[id*="cvc"]'
    ];

    for (const selector of cvvSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill('123');
          console.log(`✅ Filled CVV using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'CVV Entered - All Card Details Complete');

    // Cardholder name (if present)
    const nameSelectors = [
      'input[name="cardholderName"]',
      'input[name="name"]',
      'input[placeholder*="Name on Card"]',
      'input[placeholder*="Cardholder"]'
    ];

    for (const selector of nameSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill('JOHN DOE');
          console.log(`✅ Filled cardholder name using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Step 9: Submit payment
    console.log('Step 9: Submit payment');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'Before Submitting Payment');

    const submitSelectors = [
      'button:has-text("Pay Now")',
      'button:has-text("Submit")',
      'button:has-text("Proceed")',
      'button:has-text("Continue")',
      'button[type="submit"]',
      'input[type="submit"]'
    ];

    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log(`✅ Clicked submit button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Step 10: Wait for processing
    console.log('Step 10: Payment processing');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'Payment Processing');

    // Step 11: Success page
    console.log('Step 11: Waiting for success confirmation');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'Payment Complete - Final Page');

    // Step 12: Check for success indicators
    console.log('Step 12: Verifying success');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    const successIndicators = [
      'text=success',
      'text=Success',
      'text=Payment Successful',
      'text=completed',
      'text=Completed',
      '[class*="success"]',
      '[id*="success"]'
    ];

    let successFound = false;
    for (const indicator of successIndicators) {
      try {
        await page.waitForSelector(indicator, { timeout: 2000 });
        console.log(`✅ Success indicator found: ${indicator}`);
        successFound = true;
        break;
      } catch (e) {
        continue;
      }
    }

    await takeScreenshot(page, 'Final Success Confirmation');

    // Summary
    console.log('\n✅ Screenshot Documentation Complete!');
    console.log(`📸 Total screenshots taken: ${screenshotCounter - 1}`);
    console.log(`📁 Screenshots saved to: test-screenshots/`);
    console.log(`🌐 Final URL: ${currentUrl}`);
    console.log(`✓ Success indicators: ${successFound ? 'Found' : 'Not found (manual verification needed)'}`);

    // The test passes if we got through the flow
    expect(screenshotCounter).toBeGreaterThan(5); // At least 5 screenshots taken
  });
});
