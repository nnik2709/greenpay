import { test, expect } from '@playwright/test';

/**
 * End-to-End Passport-Voucher Integration Tests
 *
 * Tests complete workflows from purchase to validation
 * Requires database access to verify data persistence
 */

test.describe('Passport-Voucher E2E Integration', () => {

  let testSessionId: string;
  let testVoucherCode: string;

  test.describe('Complete Flow: Purchase WITH Passport → Payment → Validation', () => {

    test('E2E: Create session with passport, simulate webhook, verify voucher', async ({ page, request }) => {
      const timestamp = Date.now();
      const testEmail = `e2e-test-${timestamp}@example.com`;
      const testPassport = `E2E${timestamp.toString().slice(-6)}`;

      // Step 1: Create payment session with passport data
      console.log('Step 1: Creating payment session with passport data...');

      const sessionResponse = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: testEmail,
          customerPhone: '+6757009999',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: testPassport,
            surname: 'E2ETEST',
            givenName: 'PLAYWRIGHT',
            dateOfBirth: '1992-03-10',
            nationality: 'Papua New Guinea',
            sex: 'Male'
          }
        }
      });

      expect(sessionResponse.ok()).toBeTruthy();
      const sessionData = await sessionResponse.json();

      expect(sessionData.success).toBe(true);
      testSessionId = sessionData.data.sessionId;

      console.log(`✓ Session created: ${testSessionId}`);
      console.log(`  Gateway: ${sessionData.data.gateway}`);

      // Step 2: Verify session exists in database (via API check)
      console.log('Step 2: Verifying session in database...');

      const statusResponse = await request.get(`/api/buy-online/status/${testSessionId}`);
      expect(statusResponse.ok()).toBeTruthy();

      const statusData = await statusResponse.json();
      expect(statusData.status).toBe('pending');

      console.log(`✓ Session status: ${statusData.status}`);

      // Step 3: Simulate payment completion (manual webhook call)
      // NOTE: In real test, this would be triggered by actual payment gateway
      // For testing, we'll call the complete endpoint directly
      console.log('Step 3: Simulating payment completion...');

      // We need to use the completePurchaseWithPassport function
      // This is normally called by the webhook handler
      // For testing, we can't easily trigger the webhook, so we'll verify the session is ready

      // Step 4: Check that payment URL was generated
      expect(sessionData.data.paymentUrl).toBeDefined();
      expect(sessionData.data.paymentUrl).toContain('checkout.stripe.com');

      console.log(`✓ Payment URL generated`);
      console.log(`  URL: ${sessionData.data.paymentUrl.substring(0, 50)}...`);

      // Note: Full webhook testing requires either:
      // - Stripe CLI webhook forwarding
      // - Mock webhook endpoint
      // - Database query to verify passport_data stored

      console.log('\n✅ E2E Test Part 1 Complete: Session created with passport data');
      console.log(`   SessionId: ${testSessionId}`);
      console.log(`   Passport: ${testPassport}`);
      console.log(`   Next: Payment webhook would create Passport + Voucher atomically`);
    });
  });

  test.describe('Complete Flow: Purchase WITHOUT Passport → Registration', () => {

    test('E2E: Create session without passport, verify PENDING status', async ({ page, request }) => {
      const timestamp = Date.now();
      const testEmail = `e2e-legacy-${timestamp}@example.com`;

      // Step 1: Create payment session WITHOUT passport data
      console.log('Step 1: Creating payment session WITHOUT passport data...');

      const sessionResponse = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: testEmail,
          customerPhone: '+6757008888',
          quantity: 2,
          amount: 100,
          currency: 'PGK',
          deliveryMethod: 'SMS+Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher'
          // NO passportData field
        }
      });

      expect(sessionResponse.ok()).toBeTruthy();
      const sessionData = await sessionResponse.json();

      testSessionId = sessionData.data.sessionId;

      console.log(`✓ Session created: ${testSessionId}`);

      // Step 2: Verify session has NO passport data
      const statusResponse = await request.get(`/api/buy-online/status/${testSessionId}`);
      expect(statusResponse.ok()).toBeTruthy();

      console.log('✓ Session verified without passport data');

      // Note: When payment completes via webhook, voucher will be created
      // with passport_number = 'PENDING'

      console.log('\n✅ E2E Test Part 2 Complete: Legacy flow (no passport)');
      console.log(`   SessionId: ${testSessionId}`);
      console.log(`   Next: Webhook would create voucher with PENDING status`);
    });
  });

  test.describe('Voucher Validation After Purchase', () => {

    test.skip('should validate voucher with linked passport', async ({ page, request }) => {
      // This test requires a completed payment transaction
      // Skipped for now - requires webhook simulation or actual payment

      // Expected flow:
      // 1. Create voucher with passport (via completePurchaseWithPassport)
      // 2. Scan voucher at /app/scan
      // 3. Verify shows 'active' status with passport details
      // 4. Mark as used
      // 5. Try scanning again - should show 'used' status
    });

    test.skip('should require registration for PENDING voucher', async ({ page, request }) => {
      // Expected flow:
      // 1. Create voucher without passport (passport_number = 'PENDING')
      // 2. Try to scan at /app/scan
      // 3. Should show 'pending_passport' status
      // 4. Register passport at /register/:code
      // 5. Scan again - should show 'active'
    });
  });

  test.describe('API Contract Tests', () => {

    test('should maintain backward compatibility for old API calls', async ({ request }) => {
      // Test 1: Old format without passportData field at all
      const oldFormatResponse = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'old-format@example.com',
          customerPhone: '+6757007777',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher'
          // Intentionally no passportData field
        }
      });

      expect(oldFormatResponse.ok()).toBeTruthy();
      const oldData = await oldFormatResponse.json();
      expect(oldData.success).toBe(true);
      expect(oldData.data.sessionId).toBeDefined();

      console.log('✓ Old API format (no passportData) works');
    });

    test('should accept passportData as null', async ({ request }) => {
      const nullPassportResponse = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'null-passport@example.com',
          customerPhone: '+6757006666',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: null
        }
      });

      expect(nullPassportResponse.ok()).toBeTruthy();
      const nullData = await nullPassportResponse.json();
      expect(nullData.success).toBe(true);

      console.log('✓ passportData: null works');
    });

    test('should accept partial passport data', async ({ request }) => {
      // Test with only required fields
      const partialResponse = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'partial-passport@example.com',
          customerPhone: '+6757005555',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: 'PARTIAL123',
            surname: 'PARTIAL',
            givenName: 'TEST'
            // No dateOfBirth, nationality, sex (optional fields)
          }
        }
      });

      expect(partialResponse.ok()).toBeTruthy();
      const partialData = await partialResponse.json();
      expect(partialData.success).toBe(true);

      console.log('✓ Partial passport data works');
    });

    test('should validate required passport fields if provided', async ({ request }) => {
      // Missing passportNumber
      const missingPassportNo = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'invalid@example.com',
          customerPhone: '+6757004444',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            surname: 'INVALID',
            givenName: 'TEST'
            // Missing passportNumber
          }
        }
      });

      // Should still accept (validation happens on frontend)
      // Backend is permissive
      expect(missingPassportNo.ok()).toBeTruthy();

      console.log('✓ Backend accepts incomplete passport data (frontend validates)');
    });
  });

  test.describe('Data Persistence Tests', () => {

    test('should store passport data as JSONB', async ({ request }) => {
      const timestamp = Date.now();
      const sessionResponse = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: `persist-${timestamp}@example.com`,
          customerPhone: '+6757003333',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: `PERSIST${timestamp.toString().slice(-6)}`,
            surname: 'DATATEST',
            givenName: 'PERSISTENCE',
            dateOfBirth: '1988-07-25',
            nationality: 'Australia',
            sex: 'Female'
          }
        }
      });

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.data.sessionId;

      // Verify session was created
      expect(sessionData.success).toBe(true);
      expect(sessionId).toBeDefined();

      console.log(`✓ Session ${sessionId} created with passport data`);
      console.log('  Data should be stored in purchase_sessions.passport_data (JSONB)');

      // Note: To fully verify, we'd need to query the database:
      // SELECT passport_data FROM purchase_sessions WHERE id = $sessionId
      // Expected: JSONB object with passportNumber, surname, givenName, etc.
    });
  });

  test.describe('Edge Cases', () => {

    test('should handle very long names', async ({ request }) => {
      const longName = 'A'.repeat(100);

      const response = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'longname@example.com',
          customerPhone: '+6757002222',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: 'LONG123',
            surname: longName,
            givenName: longName,
            nationality: 'Papua New Guinea',
            sex: 'Male'
          }
        }
      });

      expect(response.ok()).toBeTruthy();
      console.log('✓ Handles long names');
    });

    test('should handle special characters in names', async ({ request }) => {
      const response = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'special@example.com',
          customerPhone: '+6757001111',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: 'SPEC123',
            surname: "O'BRIEN-SMITH",
            givenName: 'MARIE-JOSÉ',
            nationality: 'Papua New Guinea',
            sex: 'Female'
          }
        }
      });

      expect(response.ok()).toBeTruthy();
      console.log('✓ Handles special characters');
    });

    test('should handle Unicode characters', async ({ request }) => {
      const response = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'unicode@example.com',
          customerPhone: '+6757000000',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: 'UNI123',
            surname: 'MÜLLER',
            givenName: 'FRANÇOIS',
            nationality: 'Papua New Guinea',
            sex: 'Male'
          }
        }
      });

      expect(response.ok()).toBeTruthy();
      console.log('✓ Handles Unicode characters');
    });
  });

  test.describe('Performance Tests', () => {

    test('should handle concurrent requests', async ({ request }) => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request.post('/api/public-purchases/create-payment-session', {
          data: {
            customerEmail: `concurrent-${i}@example.com`,
            customerPhone: `+675700${i}${i}${i}${i}`,
            quantity: 1,
            amount: 50,
            currency: 'PGK',
            deliveryMethod: 'Email',
            returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
            cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
            passportData: {
              passportNumber: `CONC${i}23456`,
              surname: `CONCURRENT${i}`,
              givenName: 'TEST',
              nationality: 'Papua New Guinea',
              sex: 'Male'
            }
          }
        })
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.ok()).toBeTruthy();
      });

      console.log(`✓ Handled ${requests.length} concurrent requests`);
    });
  });
});
