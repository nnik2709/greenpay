/**
 * Test Email Notification
 * Run this to verify email setup before making a purchase
 */

require('dotenv').config();
const { sendVoucherNotification } = require('./services/notificationService');

// Test data
const testCustomerData = {
  customerEmail: process.env.TEST_EMAIL || 'test@example.com',
  customerPhone: '+67512345678',
  quantity: 1
};

const testVouchers = [
  {
    voucher_code: 'VCH-TEST-123456789',
    amount: 50,
    valid_from: new Date(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
];

console.log('🧪 Testing Email Notification System...');
console.log('');
console.log('Configuration:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '(not set)');
console.log('  SMTP_USER:', process.env.SMTP_USER || '(not set)');
console.log('  SMTP_FROM:', process.env.SMTP_FROM || '(not set)');
console.log('');
console.log('Test recipient:', testCustomerData.customerEmail);
console.log('');

sendVoucherNotification(testCustomerData, testVouchers)
  .then(result => {
    console.log('');
    console.log('✅ Test completed!');
    console.log('Results:', JSON.stringify(result, null, 2));
    console.log('');
    if (result.email?.success && result.email.provider === 'smtp') {
      console.log('🎉 Email sent successfully!');
      console.log('📬 Check your inbox:', testCustomerData.customerEmail);
    } else if (result.email?.provider === 'mock') {
      console.log('⚠️ Running in mock mode - SMTP not configured');
      console.log('💡 See setup-test-email.md for configuration instructions');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('');
    console.error('❌ Test failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('  1. Check your .env file has SMTP_* variables');
    console.error('  2. Verify Gmail app password is correct (no spaces)');
    console.error('  3. Make sure 2-Step Verification is enabled on Gmail');
    console.error('  4. Try running: npm install nodemailer');
    process.exit(1);
  });
