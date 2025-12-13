import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 * Handles all login functionality
 */
export class LoginPage extends BasePage {
  // Selectors
  readonly emailInput = 'input[type="email"], input[name="email"]';
  readonly passwordInput = 'input[type="password"], input[name="password"]';
  readonly loginButton = 'button[type="submit"]';
  readonly errorMessage = 'text=Login Failed';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/login');
  }

  /**
   * Perform login
   */
  async login(email: string, password: string) {
    await this.navigate();
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.clickElement(this.loginButton);

    // Wait for navigation (increased timeout for slow backend - can take 4-5 seconds for login)
    // Use 'commit' instead of 'load' to not wait for all resources
    await this.page.waitForURL('**/app/**', { timeout: 60000, waitUntil: 'commit' });
    await this.waitForPageReady();
  }

  /**
   * Verify successful login by checking for dashboard or user menu
   */
  async verifyLoginSuccess() {
    // Should be redirected to /app/* route
    expect(this.page.url()).toContain('/app/');

    // Check for user avatar button (rounded button with user's initial)
    // The avatar shows first letter of email in a rounded button
    const userAvatarExists = await this.elementExists('button.rounded-full, button:has-text("Dashboard"), nav a:has-text("Dashboard")');
    expect(userAvatarExists).toBeTruthy();
  }

  /**
   * Attempt login with invalid credentials
   */
  async loginWithInvalidCredentials(email: string, password: string) {
    await this.navigate();
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.clickElement(this.loginButton);

    // Wait for error message
    await this.waitForElement(this.errorMessage, 5000);
  }

  /**
   * Verify login error is displayed
   */
  async verifyLoginError() {
    const errorExists = await this.elementExists(this.errorMessage);
    expect(errorExists).toBeTruthy();
  }

  /**
   * Logout
   */
  async logout() {
    // Click user menu
    const userMenuSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      '[data-logout]',
      'a[href*="logout"]',
    ];

    for (const selector of userMenuSelectors) {
      if (await this.elementExists(selector)) {
        await this.clickElement(selector);
        break;
      }
    }

    // Wait for redirect to login
    await this.page.waitForURL('**/login**', { timeout: 5000 });
  }
}
