import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Standalone BSP Payment Screenshot Test
 * No authentication required - tests public registration flow
 */

test('BSP Payment - Complete Flow with Screenshots (Visa Success)', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes

  let screenshotCounter = 1;

  async function takeScreenshot(description: string) {
    const fileName = `${String(screenshotCounter).padStart(2, '0')}-${description.toLowerCase().replace(/\s+/g, '-')}.png`;
    const screenshotPath = path.join(process.cwd(), 'test-screenshots', fileName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot ${screenshotCounter}: ${description}`);
    screenshotCounter++;
  }

  console.log('\n🎬 BSP Payment E2E Screenshot Documentation\n');

  // Step 1: Public Registration Landing
  console.log('Step 1: Navigate to Public Registration');
  await page.goto('https://greenpay.eywademo.cloud/public-registration');
  await page.waitForLoadState('networkidle');
  await takeScreenshot('01-Public-Registration-Landing');

  // Step 2: Fill passport details
  console.log('Step 2: Fill passport details');
  await page.fill('input[name="passportNumber"]', 'TEST123456');
  await page.fill('input[name="fullName"]', 'John Doe Documentation');
  await page.fill('input[name="email"]', 'nnik.area9@gmail.com');
  await page.fill('input[name="phone"]', '+675 7123 4567');
  await takeScreenshot('02-Passport-Details-Filled');

  // Step 3: Submit
  console.log('Step 3: Submit passport details');
  await page.click('button:has-text("Continue to Payment")');
  await page.waitForTimeout(2000);
  await takeScreenshot('03-After-Submit');

  // Step 4: Payment method selection
  console.log('Step 4: Select BSP/DOKU');
  await page.waitForSelector('text=Select Payment Method', { timeout: 10000 });
  await takeScreenshot('04-Payment-Method-Selection');

  const bspButton = page.locator('button:has-text("BSP / DOKU")').first();
  await bspButton.waitFor({ state: 'visible' });
  await bspButton.click();
  await page.waitForTimeout(1000);
  await takeScreenshot('05-BSP-Selected');

  // Step 5: Proceed to payment
  console.log('Step 5: Proceed to BSP gateway');
  const proceedButton = page.locator('button:has-text("Proceed to Payment")').first();
  await proceedButton.click();
  await page.waitForTimeout(3000);
  await takeScreenshot('06-Redirecting-to-Gateway');

  // Step 6: BSP Gateway
  console.log('Step 6: BSP Gateway loaded');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await takeScreenshot('07-BSP-Gateway-Landing');

  // Step 7: Select Credit Card
  console.log('Step 7: Select Credit Card');
  try {
    await page.click('a:has-text("Credit Card"), button:has-text("Credit Card")');
    await page.waitForTimeout(2000);
    await takeScreenshot('08-Credit-Card-Selected');
  } catch (e) {
    console.log('Credit card selector variation, continuing...');
    await takeScreenshot('08-Gateway-State');
  }

  // Step 8: Fill card details
  console.log('Step 8: Fill card details (Visa Success)');

  // Card number
  const cardSelectors = ['input[name="cardNumber"]', 'input[placeholder*="Card"]', 'input[id*="card"]'];
  for (const selector of cardSelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        await page.locator(selector).first().fill('4000000000000002');
        break;
      }
    } catch (e) { continue; }
  }
  await takeScreenshot('09-Card-Number-Entered');

  // Expiry
  const expirySelectors = ['input[name="expiry"]', 'input[placeholder*="MM"]', 'input[id*="expiry"]'];
  for (const selector of expirySelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        await page.locator(selector).first().fill('12/25');
        break;
      }
    } catch (e) { continue; }
  }
  await takeScreenshot('10-Expiry-Entered');

  // CVV
  const cvvSelectors = ['input[name="cvv"]', 'input[placeholder*="CVV"]', 'input[id*="cvv"]'];
  for (const selector of cvvSelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        await page.locator(selector).first().fill('123');
        break;
      }
    } catch (e) { continue; }
  }
  await takeScreenshot('11-CVV-Entered');

  // Name (if present)
  const nameSelectors = ['input[name="cardholderName"]', 'input[placeholder*="Name"]'];
  for (const selector of nameSelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        await page.locator(selector).first().fill('JOHN DOE');
        break;
      }
    } catch (e) { continue; }
  }
  await takeScreenshot('12-All-Card-Details-Complete');

  // Step 9: Submit payment
  console.log('Step 9: Submit payment');
  const submitSelectors = [
    'button:has-text("Pay Now")',
    'button:has-text("Submit")',
    'button:has-text("Proceed")',
    'button[type="submit"]'
  ];
  for (const selector of submitSelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        await page.locator(selector).first().click();
        break;
      }
    } catch (e) { continue; }
  }
  await takeScreenshot('13-Payment-Submitted');

  // Step 10: Processing
  console.log('Step 10: Payment processing');
  await page.waitForTimeout(3000);
  await takeScreenshot('14-Payment-Processing');

  // Step 11: Success
  console.log('Step 11: Wait for success');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  await page.waitForTimeout(2000);
  await takeScreenshot('15-Payment-Complete');

  const url = page.url();
  console.log(`Final URL: ${url}`);
  await takeScreenshot('16-Final-Success-Page');

  console.log(`\n✅ Screenshot documentation complete!`);
  console.log(`📸 Total screenshots: ${screenshotCounter - 1}`);
  console.log(`📁 Location: test-screenshots/`);
});
