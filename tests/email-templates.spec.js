import { test, expect } from '@playwright/test';

async function loginAsAdmin(page) {
  await page.goto('/');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
}

test.describe('Email Templates', () => {
  test('edit, save, and persist template content', async ({ page, request }) => {
    await loginAsAdmin(page);

    // Navigate to Email Templates
    await page.click('nav :text("Admin")');
    await page.click(':text("Email Templates")');
    await expect(page.locator('h1:has-text("Email Templates")')).toBeVisible({ timeout: 15000 });

    // Select a template
    await page.click('button:has-text("Individual Passport Voucher")');

    // Edit subject and body
    const unique = `TEST-${Date.now()}`;
    await page.fill('input[name="subject"]', `Your PNG Green Fee Voucher ${unique}`);
    await page.fill('textarea[name="html"]', `<p>Updated Body ${unique}</p>`);

    // Save (UI toast content varies; rely on persistence checks below)
    await page.click('button:has-text("Save Template")');

    // Optional: Poll Supabase REST until the subject reflects the new unique marker (if env is provided)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const deadline = Date.now() + 10000; // up to 10s
      let matched = false;
      while (Date.now() < deadline && !matched) {
        const res = await request.get(`${SUPABASE_URL}/rest/v1/email_templates?template_key=eq.individual_voucher&select=subject`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          }
        });
        if (res.ok()) {
          const rows = await res.json();
          const subj = rows?.[0]?.subject || '';
          if (subj.includes(unique)) {
            matched = true;
            break;
          }
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Force a fresh load through the component by switching templates and back
    await page.getByRole('button', { name: 'Welcome Email' }).click();
    await page.getByRole('button', { name: 'Individual Passport Voucher' }).click();

    const subjectValue = await page.inputValue('input[name="subject"]');
    expect(subjectValue).toContain(unique);

    const bodyValue = await page.inputValue('textarea[name="html"]');
    expect(bodyValue).toContain(unique);
  });
});


