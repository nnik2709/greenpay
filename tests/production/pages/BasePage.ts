import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object
 * Common functionality for all pages
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    // Wait a bit for page to be interactive
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Click an element with wait
   */
  async clickElement(selector: string) {
    await this.waitForElement(selector);
    await this.page.click(selector);
  }

  /**
   * Fill a form field
   */
  async fillField(selector: string, value: string) {
    await this.waitForElement(selector);
    await this.page.fill(selector, value);
  }

  /**
   * Select from dropdown
   */
  async selectOption(selector: string, value: string) {
    await this.waitForElement(selector);
    await this.page.selectOption(selector, value);
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string, timeout: number = 2000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element text
   */
  async getElementText(selector: string): Promise<string> {
    await this.waitForElement(selector);
    const element = await this.page.locator(selector);
    return await element.textContent() || '';
  }

  /**
   * Wait for toast/notification
   */
  async waitForToast(expectedText?: string, timeout = 5000) {
    const toastSelectors = [
      '[data-sonner-toast]',
      '.toast',
      '[role="alert"]',
      '.notification',
    ];

    for (const selector of toastSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 2000 });
        if (expectedText) {
          const text = await this.getElementText(selector);
          if (text.includes(expectedText)) {
            return true;
          }
        } else {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady() {
    await this.page.waitForLoadState('domcontentloaded');
    // Small delay for page to stabilize
    await this.page.waitForTimeout(500);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Log action for email verification
   */
  logEmailSent(description: string, recipient: string = 'nnik.area9@gmail.com') {
    console.log(`\n📧 EMAIL SENT: ${description}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Please check inbox for verification\n`);
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp, timeout = 10000) {
    return await this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }
}
