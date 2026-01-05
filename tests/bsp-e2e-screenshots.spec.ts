import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * BSP Payment E2E Screenshot Documentation
 * Captures every step of the payment flow for documentation
 * Uses BSP Visa Platinum card: 4889750100103462
 */

test('BSP Payment - Complete E2E with Screenshots', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  let screenshotCounter = 1;

  async function takeScreenshot(description: string) {
    const fileName = `${String(screenshotCounter).padStart(2, '0')}-${description.toLowerCase().replace(/\s+/g, '-')}.png`;
    const screenshotPath = path.join(process.cwd(), 'test-screenshots/e2e', fileName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot ${screenshotCounter}: ${description}`);
    screenshotCounter++;
  }

  console.log('\n🎬 BSP Payment E2E Screenshot Documentation\n');
  console.log('📋 Card: BSP Visa Platinum (4889750100103462)\n');

  // ==========================================
  // STEP 1: Navigate to Buy Online Page
  // ==========================================
  console.log('Step 1: Navigate to Buy Online page');
  await page.goto('https://greenpay.eywademo.cloud/buy-online');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await takeScreenshot('Buy-Online-Landing-Page');

  // ==========================================
  // STEP 2: Fill Purchase Form
  // ==========================================
  console.log('Step 2: Fill purchase form');

  // Fill quantity
  await page.fill('input[name="quantity"]', '1');
  await takeScreenshot('Form-Quantity-Filled');

  // Fill passport details
  await page.fill('input[name="passportNumber"]', 'TEST123456');
  await page.fill('input[name="surname"]', 'DOE');
  await page.fill('input[name="givenName"]', 'JOHN');
  await takeScreenshot('Form-Passport-Details-Filled');

  // Fill personal details
  await page.fill('input[name="dateOfBirth"]', '1990-01-01');
  await page.fill('input[name="nationality"]', 'PNG');
  await page.click('input[value="Male"]');
  await takeScreenshot('Form-Personal-Details-Filled');

  // Fill contact details
  await page.fill('input[name="email"]', 'nnik.area9@gmail.com');
  await page.fill('input[name="phone"]', '71234567');
  await takeScreenshot('Form-Contact-Details-Complete');

  // ==========================================
  // STEP 3: Proceed to Payment
  // ==========================================
  console.log('Step 3: Click Proceed to Payment');
  await page.click('button:has-text("Proceed to Payment")');

  // Wait for "slow down" message
  await page.waitForTimeout(3000);
  await takeScreenshot('Slow-Down-Message');

  // ==========================================
  // STEP 4: Payment Method Selection
  // ==========================================
  console.log('Step 4: Wait for payment method selection');
  await page.waitForSelector('button:has-text("Pay with Credit Card")', { timeout: 30000 });
  await takeScreenshot('Payment-Method-Selection');

  console.log('Step 5: Click Pay with Credit Card');
  await page.click('button:has-text("Pay with Credit Card")');
  await page.waitForTimeout(2000);
  await takeScreenshot('After-Credit-Card-Click');

  // ==========================================
  // STEP 5: BSP DOKU Payment Page
  // ==========================================
  console.log('Step 6: Wait for BSP DOKU page to load');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await takeScreenshot('BSP-DOKU-Payment-Page-Loaded');

  // Solve anti-bot verification
  console.log('Step 7: Solve anti-bot verification');
  try {
    const verificationText = await page.locator('label:has-text("What is")').textContent();
    if (verificationText) {
      const match = verificationText.match(/(\d+)\s*\+\s*(\d+)/);
      if (match) {
        const num1 = parseInt(match[1]);
        const num2 = parseInt(match[2]);
        const answer = num1 + num2;
        await page.fill('input[name="humancheck"]', answer.toString());
        console.log(`✅ Solved verification: ${num1} + ${num2} = ${answer}`);
        await takeScreenshot('Anti-Bot-Verification-Solved');
      }
    }
  } catch (e) {
    console.log('⚠️ No anti-bot verification found');
  }

  // ==========================================
  // STEP 6: Fill Card Details
  // ==========================================
  console.log('Step 8: Fill BSP Visa Platinum card details');

  // Card number
  await page.fill('input[name="card.number"]', '4889750100103462');
  await takeScreenshot('Card-Number-Filled');

  // Expiry date
  await page.fill('input[name="card.expiryDate"]', '04/27');
  await takeScreenshot('Card-Expiry-Filled');

  // CVV
  await page.fill('input[name="card.cvv"]', '921');
  await takeScreenshot('Card-CVV-Filled');

  // Cardholder name
  await page.fill('input[name="card.name"]', 'JOHN DOE');
  await takeScreenshot('Card-Details-Complete');

  // ==========================================
  // STEP 7: Submit Payment
  // ==========================================
  console.log('Step 9: Click PAY button');
  await page.click('button:has-text("PAY")');
  await page.waitForTimeout(2000);
  await takeScreenshot('After-Pay-Button-Click');

  // ==========================================
  // STEP 8: OTP Page
  // ==========================================
  console.log('Step 10: Wait for OTP page');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await takeScreenshot('OTP-Page-Loaded');

  // Extract OTP from page
  console.log('Step 11: Extract OTP from page');
  try {
    const otpElement = await page.locator('body').textContent();
    const otpMatch = otpElement?.match(/OTP.*?(\d{6})/i);

    if (otpMatch) {
      const otp = otpMatch[1];
      console.log(`✅ OTP found: ${otp}`);

      // Fill OTP
      await page.fill('input[name="otp"]', otp);
      await takeScreenshot('OTP-Filled');

      // Submit OTP
      console.log('Step 12: Submit OTP');
      await page.click('input[type="submit"][value="SUBMIT"]');
      console.log('✅ OTP submitted, waiting for redirect...');
      await takeScreenshot('After-OTP-Submit');

      // Wait for redirect back to GreenPay
      await page.waitForURL(/greenpay\.eywademo\.cloud/, { timeout: 90000 });
      console.log('✅ Redirected back to application');
      await page.waitForTimeout(2000);
      await takeScreenshot('Redirect-After-OTP');
    } else {
      console.log('⚠️ OTP not found on page, manual OTP may be required');
      await takeScreenshot('OTP-Not-Found');
    }
  } catch (e) {
    console.log('⚠️ Error extracting OTP:', e);
    await takeScreenshot('OTP-Error');
  }

  // ==========================================
  // STEP 9: Success Page
  // ==========================================
  console.log('Step 13: Wait for success page');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await takeScreenshot('Success-Page-Initial');

  // Check for voucher code
  console.log('Step 14: Look for voucher code');
  try {
    const voucherElement = await page.locator('text=/Voucher.*Code/i').first();
    if (await voucherElement.isVisible({ timeout: 5000 })) {
      await takeScreenshot('Voucher-Code-Visible');

      // Try to extract voucher code
      const pageText = await page.locator('body').textContent();
      const voucherMatch = pageText?.match(/([A-Z0-9]{8,})/);
      if (voucherMatch) {
        console.log(`✅ Voucher code found: ${voucherMatch[1]}`);
      }
    }
  } catch (e) {
    console.log('⚠️ Voucher code not immediately visible');
  }

  await takeScreenshot('Success-Page-Final');

  // ==========================================
  // STEP 10: Email Confirmation
  // ==========================================
  console.log('Step 15: Check for email confirmation message');
  try {
    const emailConfirmation = await page.locator('text=/email/i').first();
    if (await emailConfirmation.isVisible({ timeout: 5000 })) {
      await takeScreenshot('Email-Confirmation-Message');
      console.log('✅ Email confirmation message found');
    }
  } catch (e) {
    console.log('⚠️ Email confirmation message not visible');
  }

  console.log(`\n✅ Screenshot documentation complete!`);
  console.log(`📸 Total screenshots: ${screenshotCounter - 1}`);
  console.log(`📁 Location: test-screenshots/e2e/`);
  console.log(`\n🎉 E2E Flow Documentation Complete!`);
});
