import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  waitForPageLoad,
  fillFormField
} from '../utils/helpers';

/**
 * Data Seeding - Passports
 * Creates sample passport records for testing
 *
 * Run as: Counter_Agent or Flex_Admin
 */

// Sample passport data
const samplePassports = [
  {
    passportNumber: 'P12345678',
    surname: 'SMITH',
    givenName: 'JOHN MICHAEL',
    nationality: 'USA',
    dob: '1985-03-15',
    gender: 'M',
    expiryDate: '2030-12-31'
  },
  {
    passportNumber: 'P87654321',
    surname: 'JONES',
    givenName: 'SARAH ELIZABETH',
    nationality: 'GBR',
    dob: '1990-07-22',
    gender: 'F',
    expiryDate: '2029-06-30'
  },
  {
    passportNumber: 'P11223344',
    surname: 'CHEN',
    givenName: 'WEI',
    nationality: 'CHN',
    dob: '1988-11-10',
    gender: 'M',
    expiryDate: '2028-03-15'
  },
  {
    passportNumber: 'P55667788',
    surname: 'KUMAR',
    givenName: 'PRIYA',
    nationality: 'IND',
    dob: '1992-05-18',
    gender: 'F',
    expiryDate: '2031-09-20'
  },
  {
    passportNumber: 'P99887766',
    surname: 'GARCIA',
    givenName: 'CARLOS ANTONIO',
    nationality: 'ESP',
    dob: '1987-09-25',
    gender: 'M',
    expiryDate: '2029-12-15'
  }
];

test.describe('Data Seeding - Passports', () => {
  test('should create sample passport records', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting passport data seeding...');

    await page.goto('/passports/create');
    await waitForPageLoad(page);

    let createdCount = 0;

    for (const passport of samplePassports) {
      console.log(`📝 Creating passport: ${passport.passportNumber} (${passport.surname}, ${passport.givenName})`);

      try {
        // Fill passport number
        const passportInput = page.locator('input[name="passportNumber"], input[placeholder*="Passport"]').first();
        await passportInput.fill(passport.passportNumber);
        await page.waitForTimeout(500);

        // Fill surname
        const surnameInput = page.locator('input[name="surname"], input[placeholder*="Surname"]').first();
        await surnameInput.fill(passport.surname);
        await page.waitForTimeout(300);

        // Fill given name
        const givenNameInput = page.locator('input[name="givenName"], input[placeholder*="Given"]').first();
        await givenNameInput.fill(passport.givenName);
        await page.waitForTimeout(300);

        // Fill nationality
        const nationalityInput = page.locator('input[name="nationality"], select[name="nationality"]').first();
        if (await nationalityInput.evaluate(el => el.tagName) === 'SELECT') {
          await nationalityInput.selectOption(passport.nationality);
        } else {
          await nationalityInput.fill(passport.nationality);
        }
        await page.waitForTimeout(300);

        // Fill date of birth
        const dobInput = page.locator('input[name="dob"], input[type="date"]').first();
        await dobInput.fill(passport.dob);
        await page.waitForTimeout(300);

        // Fill gender
        const genderInput = page.locator('select[name="gender"], input[name="gender"]').first();
        if (await genderInput.evaluate(el => el.tagName) === 'SELECT') {
          await genderInput.selectOption(passport.gender);
        } else {
          await genderInput.fill(passport.gender);
        }
        await page.waitForTimeout(300);

        // Fill expiry date
        const expiryInput = page.locator('input[name="expiryDate"], input[name="expiry"]').first();
        await expiryInput.fill(passport.expiryDate);
        await page.waitForTimeout(300);

        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Check for success
        const successMessage = page.locator('text=/passport.*created|success/i');
        if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`  ✅ Created: ${passport.passportNumber}`);
          createdCount++;
        } else {
          console.log(`  ⚠️  May already exist: ${passport.passportNumber}`);
        }

        // Clear form for next entry
        await page.goto('/passports/create');
        await waitForPageLoad(page);

      } catch (error) {
        console.log(`  ❌ Error creating ${passport.passportNumber}:`, error.message);
      }
    }

    console.log(`\n✅ Passport seeding complete: ${createdCount}/${samplePassports.length} created`);

    consoleChecker.assertNoErrors();
  });

  test('should verify passports were created', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/passports');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Count passports in table
    const passportRows = page.locator('table tbody tr');
    const count = await passportRows.count();

    console.log(`📊 Found ${count} passport records in database`);
    expect(count).toBeGreaterThan(0);

    consoleChecker.assertNoErrors();
  });
});
