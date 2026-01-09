/**
 * Unit Tests for Email Service
 *
 * Tests the email sending functionality without actually sending emails
 */

const { describe, it, expect, jest, beforeEach, afterEach } = require('@jest/globals');

// Mock nodemailer before importing emailService
jest.mock('nodemailer');
const nodemailer = require('nodemailer');

describe('Email Service', () => {
  let emailService;
  let mockTransporter;

  beforeEach(() => {
    // Reset modules to get a fresh copy
    jest.resetModules();

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    };

    // Mock nodemailer.createTransport
    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Import email service after mocking
    emailService = require('../../../utils/emailService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVoucherEmail', () => {
    it('should send voucher email with PDF attachment', async () => {
      const voucherData = {
        voucher_code: 'TEST1234',
        recipient_email: 'test@example.com',
        passport: 'AB123456',
        full_name: 'John Doe'
      };

      const pdfBuffer = Buffer.from('fake-pdf-content');

      await emailService.sendVoucherEmail(voucherData, pdfBuffer);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: voucherData.recipient_email,
          subject: expect.stringContaining(voucherData.voucher_code),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: `voucher-${voucherData.voucher_code}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            })
          ])
        })
      );
    });

    it('should reject invalid email addresses', async () => {
      const voucherData = {
        voucher_code: 'TEST1234',
        recipient_email: 'invalid-email',  // Invalid format
        passport: 'AB123456',
        full_name: 'John Doe'
      };

      const pdfBuffer = Buffer.from('fake-pdf-content');

      await expect(
        emailService.sendVoucherEmail(voucherData, pdfBuffer)
      ).rejects.toThrow();
    });

    it('should handle SMTP errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const voucherData = {
        voucher_code: 'TEST1234',
        recipient_email: 'test@example.com',
        passport: 'AB123456',
        full_name: 'John Doe'
      };

      const pdfBuffer = Buffer.from('fake-pdf-content');

      await expect(
        emailService.sendVoucherEmail(voucherData, pdfBuffer)
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should send invoice email with PDF attachment', async () => {
      const invoiceData = {
        invoice_number: 'INV-001',
        recipient_email: 'client@example.com',
        company_name: 'Test Company',
        total_amount: 1500.00
      };

      const pdfBuffer = Buffer.from('fake-invoice-pdf');

      await emailService.sendInvoiceEmail(invoiceData, pdfBuffer);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: invoiceData.recipient_email,
          subject: expect.stringContaining(invoiceData.invoice_number),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: `invoice-${invoiceData.invoice_number}.pdf`,
              content: pdfBuffer
            })
          ])
        })
      );
    });
  });

  describe('Email validation', () => {
    const validEmails = [
      'test@example.com',
      'user.name+tag@example.co.uk',
      'valid_email@domain.org'
    ];

    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',  // Space in email
      ''
    ];

    validEmails.forEach(email => {
      it(`should accept valid email: ${email}`, () => {
        expect(emailService.isValidEmail(email)).toBe(true);
      });
    });

    invalidEmails.forEach(email => {
      it(`should reject invalid email: "${email}"`, () => {
        expect(emailService.isValidEmail(email)).toBe(false);
      });
    });
  });
});
