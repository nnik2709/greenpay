import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Create Passport / Individual Purchase Page Object
 * Handles passport form entry and purchase workflow
 */
export class CreatePassportPage extends BasePage {
  // Step 1: Passport Details Form Selectors
  readonly searchInput = 'input[placeholder*="Enter Passport Number"]';
  readonly searchButton = 'button:has-text("Search")';

  readonly passportNumberInput = 'input[name="passportNumber"], input#passportNumber';
  readonly nationalityInput = 'input[name="nationality"], input#nationality';
  readonly surnameInput = 'input[name="surname"], input#surname';
  readonly givenNameInput = 'input[name="givenName"], input#givenName';
  readonly dobInput = 'input[name="dob"], input#dob';
  readonly sexSelect = 'button[role="combobox"]'; // Shadcn Select trigger
  readonly dateOfExpiryInput = 'input[name="dateOfExpiry"], input#dateOfExpiry';

  readonly proceedToPaymentButton = 'button:has-text("Proceed to Payment")';

  // Step 2: Payment Selectors
  readonly paymentModeRadio = (mode: string) => `label:has-text("${mode}")`;
  readonly amountInput = 'input[type="number"]';
  readonly proceedToVoucherButton = 'button:has-text("Process Payment")';

  // Step 3: Voucher Confirmation
  readonly voucherCode = 'text=VCH-';
  readonly printVoucherButton = 'button:has-text("Print Voucher")';
  readonly downloadPdfButton = 'button:has-text("Download PDF")';
  readonly createAnotherButton = 'button:has-text("Create Another"), button:has-text("New Purchase")';

  // Success messages
  readonly successToast = 'text=Success, text=Voucher generated successfully, text=Voucher Generated Successfully';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to Individual Purchase / Create Passport page
   */
  async navigate() {
    await this.goto('/app/passports/create');
    await this.waitForPageReady();
  }

  /**
   * Fill passport details form
   */
  async fillPassportDetails(passportData: {
    passportNumber: string;
    nationality: string;
    surname: string;
    givenName: string;
    dob: string;
    sex: string;
    dateOfExpiry: string;
  }) {
    // Fill basic fields
    await this.fillField(this.passportNumberInput, passportData.passportNumber);
    await this.fillField(this.nationalityInput, passportData.nationality);
    await this.fillField(this.surnameInput, passportData.surname);
    await this.fillField(this.givenNameInput, passportData.givenName);
    await this.fillField(this.dobInput, passportData.dob);
    await this.fillField(this.dateOfExpiryInput, passportData.dateOfExpiry);

    // Select sex from dropdown
    await this.page.click(this.sexSelect);
    await this.page.click(`[role="option"]:has-text("${passportData.sex}")`);
  }

  /**
   * Search for existing passport
   */
  async searchPassport(passportNumber: string) {
    await this.fillField(this.searchInput, passportNumber);
    await this.clickElement(this.searchButton);

    // Wait for either success or not found message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Proceed to payment step
   */
  async proceedToPayment() {
    await this.clickElement(this.proceedToPaymentButton);
    await this.waitForPageReady();
  }

  /**
   * Select payment mode and complete payment
   */
  async completePayment(paymentMode: string = 'CASH', amount?: number) {
    // Wait for payment step to load
    await this.page.waitForTimeout(2000);

    // Select payment mode (radio button)
    const paymentLabel = this.paymentModeRadio(paymentMode);
    await this.clickElement(paymentLabel);

    // Amount should be auto-filled to 50.00, but can override if needed
    if (amount) {
      await this.fillField(this.amountInput, amount.toString());
    }

    // Complete payment
    await this.clickElement(this.proceedToVoucherButton);

    // Wait for success message or voucher generation (increased for slow backend)
    await this.page.waitForTimeout(8000);
  }

  /**
   * Verify voucher was created successfully
   */
  async verifyVoucherCreated() {
    // Toast messages may disappear quickly, so check with longer timeout
    // or just verify voucher is displayed (which is the main indicator of success)
    const voucherVisible = await this.elementExists(this.voucherCode, 15000);
    expect(voucherVisible).toBeTruthy();

    // Also check for success banner (the green "Voucher Generated Successfully!" header)
    const successBannerExists = await this.elementExists('text=Voucher Generated Successfully', 10000);
    expect(successBannerExists).toBeTruthy();
  }

  /**
   * Get the generated voucher code
   */
  async getVoucherCode(): Promise<string> {
    const voucherElement = await this.page.waitForSelector(this.voucherCode);
    const voucherCode = await voucherElement.textContent();
    return voucherCode?.trim() || '';
  }

  /**
   * Complete entire purchase workflow
   */
  async completePurchase(passportData: {
    passportNumber: string;
    nationality: string;
    surname: string;
    givenName: string;
    dob: string;
    sex: string;
    dateOfExpiry: string;
  }, paymentMode: string = 'CASH') {
    await this.navigate();
    await this.fillPassportDetails(passportData);
    await this.proceedToPayment();
    await this.completePayment(paymentMode);
    await this.verifyVoucherCreated();

    const voucherCode = await this.getVoucherCode();
    console.log(`✅ Voucher created successfully: ${voucherCode}`);

    return voucherCode;
  }

  /**
   * Print voucher
   */
  async printVoucher() {
    await this.clickElement(this.printVoucherButton);
    // Wait for print dialog
    await this.page.waitForTimeout(1000);
  }

  /**
   * Download voucher PDF
   */
  async downloadVoucherPdf() {
    // Set up download listener
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickElement(this.downloadPdfButton);
    const download = await downloadPromise;

    console.log(`📥 PDF downloaded: ${await download.path()}`);
    return download;
  }

  /**
   * Create another purchase
   */
  async createAnother() {
    await this.clickElement(this.createAnotherButton);
    await this.waitForPageReady();
  }
}
