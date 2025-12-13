import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Vouchers List Page Object
 * Handles voucher list viewing, searching, and verification
 */
export class VouchersListPage extends BasePage {
  // Selectors
  readonly searchInput = 'input[placeholder*="Search"]';
  readonly voucherRow = (voucherCode: string) => `tr:has-text("${voucherCode}"), div:has-text("${voucherCode}")`;
  readonly voucherTable = 'table, [data-table]';
  readonly noResultsMessage = 'text=No vouchers found, text=No results';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Vouchers List page
   */
  async navigate() {
    await this.goto('/app/vouchers-list');
    await this.waitForPageReady();
  }

  /**
   * Search for a voucher by code
   */
  async searchVoucher(voucherCode: string) {
    await this.fillField(this.searchInput, voucherCode);
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  /**
   * Verify voucher exists in the list
   */
  async verifyVoucherExists(voucherCode: string) {
    const voucherExists = await this.elementExists(this.voucherRow(voucherCode));
    expect(voucherExists).toBeTruthy();
    console.log(`✅ Voucher ${voucherCode} found in list`);
  }

  /**
   * Click on a specific voucher
   */
  async clickVoucher(voucherCode: string) {
    await this.clickElement(this.voucherRow(voucherCode));
    await this.waitForPageReady();
  }

  /**
   * Get all voucher codes from current page
   */
  async getAllVoucherCodes(): Promise<string[]> {
    const rows = await this.page.$$('tr[data-voucher-code], .voucher-item');
    const codes: string[] = [];

    for (const row of rows) {
      const code = await row.textContent();
      if (code) codes.push(code.trim());
    }

    return codes;
  }
}
