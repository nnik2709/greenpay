/**
 * Test All BSP/DOKU Cards - Quick verification test
 * Tests each card to see if it works with BSP staging environment
 */

import { test, expect } from '@playwright/test';
import { TEST_CARDS, TEST_PASSPORTS, TEST_CONFIG } from './test-cards.config';

// Import helper functions from main test file
async function fillPassportForm(page, passportData) {
  await page.fill('#passportNumber', passportData.passportNumber);
  await page.waitForTimeout(500);
  await page.fill('#surname', passportData.surname);
  await page.waitForTimeout(500);
  await page.fill('#givenName', passportData.givenName);
  await page.waitForTimeout(500);
  if (passportData.dateOfBirth) {
    await page.fill('#dateOfBirth', passportData.dateOfBirth);
    await page.waitForTimeout(500);
  }
}

async function fillBSPPaymentForm(page, card) {
  await page.waitForURL(/staging\.doku\.com/, { timeout: 30000 });
  console.log('✅ BSP DOKU payment page loaded');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log(`💳 Filling card: ${card.name} - ${card.cardNumber}`);

  // Take screenshot before filling
  await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-payment-form.png` });

  // Get all visible inputs including password type (for CVV)
  const visibleInputs = await page.locator('input[type="text"], input[type="password"], input:not([type="hidden"])').all();
  console.log(`Found ${visibleInputs.length} visible input fields`);

  // Debug: print field info
  console.log('📋 Debugging input fields:');
  for (let i = 0; i < Math.min(visibleInputs.length, 10); i++) {
    const value = await visibleInputs[i].inputValue().catch(() => '');
    const placeholder = await visibleInputs[i].getAttribute('placeholder').catch(() => '');
    console.log(`  [${i}] value="${value}", placeholder="${placeholder}"`);
  }

  // Fill card details using the correct field mapping
  // Layout: 0=card#, 1=expiry, 2=CVV, 3=name, 4=email, 5=phone

  // Card Number (field 0)
  await visibleInputs[0].fill(card.cardNumber);
  await page.waitForTimeout(500);
  console.log('✅ Filled card number');

  // Expiry Date (field 1)
  await visibleInputs[1].fill(`${card.expiryMonth}/${card.expiryYear.slice(-2)}`);
  await page.waitForTimeout(500);
  console.log('✅ Filled expiry date');

  // CVV (field 2 - password type)
  await visibleInputs[2].fill(card.cvv);
  await page.waitForTimeout(500);
  console.log('✅ Filled CVV');

  // Phone number (field 5)
  if (visibleInputs.length >= 6) {
    await visibleInputs[5].fill('71234567');
    await page.waitForTimeout(500);
    console.log('✅ Filled phone number');
  } else {
    console.log(`⚠️  Only ${visibleInputs.length} fields found, phone field may not exist`);
  }

  // Take screenshot after filling
  await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-form-filled.png` });

  // Click Pay button
  const payButton = page.locator('role=button[name="Pay"]');
  await payButton.click();
  console.log('✅ PAY button clicked');

  await page.waitForTimeout(5000);
}

// Test each card
test.describe('Test All BSP/DOKU Cards', () => {

  test('Card 0 - DOKU Visa (4761...0039)', async ({ page }) => {
    const card = TEST_CARDS[0];
    const passport = TEST_PASSPORTS.valid;

    console.log(`\n🎯 Testing: ${card.name}`);
    console.log(`📇 Card: ${card.cardNumber}`);

    await page.goto('/buy-online');
    await page.waitForLoadState('networkidle');

    await fillPassportForm(page, passport);
    await page.fill('#email', 'test@example.com');

    // Solve anti-bot
    const verificationText = await page.locator('text=/Please solve.*What is/').textContent();
    const match = verificationText?.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const answer = parseInt(match[1]) + parseInt(match[2]);
      await page.fill('#verification', answer.toString());
      console.log(`✅ Solved: ${match[1]} + ${match[2]} = ${answer}`);
    }

    await page.waitForTimeout(3000);
    await page.click('button:has-text("Continue to Payment")');

    await fillBSPPaymentForm(page, card);

    // Wait to see if payment succeeds or fails
    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log(`📍 Final URL: ${currentUrl}`);

    if (currentUrl.includes('success')) {
      console.log('✅ SUCCESS: Payment completed!');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-SUCCESS.png`, fullPage: true });
    } else if (currentUrl.includes('doku.com')) {
      console.log('⚠️  PENDING: Still on BSP/DOKU page');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-PENDING.png`, fullPage: true });
    } else {
      console.log('❌ FAILED: Payment did not complete');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-FAILED.png`, fullPage: true });
    }
  });

  test('Card 1 - DOKU MasterCard (5573...1101)', async ({ page }) => {
    const card = TEST_CARDS[1];
    const passport = { ...TEST_PASSPORTS.valid, passportNumber: 'TEST111111' };

    console.log(`\n🎯 Testing: ${card.name}`);
    console.log(`📇 Card: ${card.cardNumber}`);

    await page.goto('/buy-online');
    await page.waitForLoadState('networkidle');

    await fillPassportForm(page, passport);
    await page.fill('#email', 'test@example.com');

    const verificationText = await page.locator('text=/Please solve.*What is/').textContent();
    const match = verificationText?.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const answer = parseInt(match[1]) + parseInt(match[2]);
      await page.fill('#verification', answer.toString());
      console.log(`✅ Solved: ${match[1]} + ${match[2]} = ${answer}`);
    }

    await page.waitForTimeout(3000);
    await page.click('button:has-text("Continue to Payment")');

    await fillBSPPaymentForm(page, card);

    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log(`📍 Final URL: ${currentUrl}`);

    if (currentUrl.includes('success')) {
      console.log('✅ SUCCESS: Payment completed!');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-SUCCESS.png`, fullPage: true });
    } else if (currentUrl.includes('doku.com')) {
      console.log('⚠️  PENDING: Still on BSP/DOKU page');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-PENDING.png`, fullPage: true });
    } else {
      console.log('❌ FAILED: Payment did not complete');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-FAILED.png`, fullPage: true });
    }
  });

  test('Card 3 - BSP Visa Silver (4889...4185)', async ({ page }) => {
    const card = TEST_CARDS[3];
    const passport = { ...TEST_PASSPORTS.valid, passportNumber: 'TEST222222' };

    console.log(`\n🎯 Testing: ${card.name}`);
    console.log(`📇 Card: ${card.cardNumber}`);

    await page.goto('/buy-online');
    await page.waitForLoadState('networkidle');

    await fillPassportForm(page, passport);
    await page.fill('#email', 'test@example.com');

    const verificationText = await page.locator('text=/Please solve.*What is/').textContent();
    const match = verificationText?.match(/(\d+)\s*\+\s*(\d+)/);
    if (match) {
      const answer = parseInt(match[1]) + parseInt(match[2]);
      await page.fill('#verification', answer.toString());
      console.log(`✅ Solved: ${match[1]} + ${match[2]} = ${answer}`);
    }

    await page.waitForTimeout(3000);
    await page.click('button:has-text("Continue to Payment")');

    await fillBSPPaymentForm(page, card);

    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log(`📍 Final URL: ${currentUrl}`);

    if (currentUrl.includes('success')) {
      console.log('✅ SUCCESS: Payment completed!');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-SUCCESS.png`, fullPage: true });
    } else if (currentUrl.includes('doku.com')) {
      console.log('⚠️  PENDING: Still on BSP/DOKU page');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-PENDING.png`, fullPage: true });
    } else {
      console.log('❌ FAILED: Payment did not complete');
      await page.screenshot({ path: `test-screenshots/card-test-results/card-${card.cardNumber.slice(-4)}-FAILED.png`, fullPage: true });
    }
  });
});
