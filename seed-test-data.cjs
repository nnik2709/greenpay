#!/usr/bin/env node

/**
 * Seed Test Data Script
 * Populates database with test data for Playwright tests
 *
 * Usage: node seed-test-data.js
 */

const db = require('./backend/config/database');

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  try {
    // ===========================================
    // 1. CREATE TEST PASSPORTS
    // ===========================================
    console.log('📘 Creating test passports...');

    const passports = [
      { passportNo: 'P1234567', nationality: 'USA', surname: 'Smith', givenName: 'John', dob: '1990-05-15', sex: 'Male', dateOfExpiry: '2030-12-31' },
      { passportNo: 'P2345678', nationality: 'AUS', surname: 'Johnson', givenName: 'Sarah', dob: '1985-08-22', sex: 'Female', dateOfExpiry: '2029-06-30' },
      { passportNo: 'P3456789', nationality: 'GBR', surname: 'Williams', givenName: 'David', dob: '1978-03-10', sex: 'Male', dateOfExpiry: '2028-11-15' },
      { passportNo: 'P4567890', nationality: 'CAN', surname: 'Brown', givenName: 'Emma', dob: '1992-11-28', sex: 'Female', dateOfExpiry: '2031-03-20' },
      { passportNo: 'P5678901', nationality: 'NZL', surname: 'Jones', givenName: 'Michael', dob: '1988-07-04', sex: 'Male', dateOfExpiry: '2029-09-10' },
      { passportNo: 'P6789012', nationality: 'DEU', surname: 'Garcia', givenName: 'Maria', dob: '1995-01-18', sex: 'Female', dateOfExpiry: '2030-05-25' },
      { passportNo: 'P7890123', nationality: 'FRA', surname: 'Martinez', givenName: 'Carlos', dob: '1982-09-30', sex: 'Male', dateOfExpiry: '2028-08-15' },
      { passportNo: 'P8901234', nationality: 'JPN', surname: 'Anderson', givenName: 'Lisa', dob: '1991-12-05', sex: 'Female', dateOfExpiry: '2031-01-10' },
      { passportNo: 'P9012345', nationality: 'CHN', surname: 'Taylor', givenName: 'Robert', dob: '1987-04-20', sex: 'Male', dateOfExpiry: '2029-07-22' },
      { passportNo: 'P0123456', nationality: 'IND', surname: 'Thomas', givenName: 'Jennifer', dob: '1993-06-14', sex: 'Female', dateOfExpiry: '2030-10-18' }
    ];

    // Get counter agent user ID
    const agentResult = await db.query('SELECT id FROM "User" WHERE email = $1', ['agent@greenpay.com']);
    const agentId = agentResult.rows[0]?.id || 3;

    let passportCount = 0;
    for (const passport of passports) {
      try {
        await db.query(`
          INSERT INTO "Passport" ("passportNo", nationality, surname, "givenName", dob, sex, "dateOfExpiry", "createdById", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT ("passportNo") DO NOTHING
        `, [passport.passportNo, passport.nationality, passport.surname, passport.givenName, passport.dob, passport.sex, passport.dateOfExpiry, agentId]);
        passportCount++;
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.error(`  ⚠️  Error creating passport ${passport.passportNo}:`, err.message);
        }
      }
    }
    console.log(`  ✅ Created ${passportCount} passports\n`);

    // ===========================================
    // 2. CREATE INDIVIDUAL PURCHASE VOUCHERS
    // ===========================================
    console.log('🎫 Creating individual purchase vouchers...');

    const passportIds = await db.query(`
      SELECT id, "passportNo" FROM "Passport"
      WHERE "passportNo" IN ('P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901')
    `);

    const vouchers = [
      { passportNo: 'P1234567', daysAgo: 5, status: 'active', validDays: 90, paymentMode: 'Cash' },
      { passportNo: 'P2345678', daysAgo: 10, status: 'active', validDays: 90, paymentMode: 'EFTPOS' },
      { passportNo: 'P3456789', daysAgo: 3, status: 'active', validDays: 90, paymentMode: 'Credit Card' },
      { passportNo: 'P4567890', daysAgo: 30, status: 'used', validDays: 60, paymentMode: 'Cash' },
      { passportNo: 'P5678901', daysAgo: 180, status: 'expired', validDays: -90, paymentMode: 'EFTPOS' }
    ];

    let voucherCount = 0;
    for (const voucher of vouchers) {
      const passport = passportIds.rows.find(p => p.passportNo === voucher.passportNo);
      if (!passport) continue;

      const voucherCode = `VP-2025-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const purchaseDate = `NOW() - INTERVAL '${voucher.daysAgo} days'`;
      const validFrom = voucher.status === 'used' ? `NOW() - INTERVAL '30 days'` : 'NOW()';
      const validUntil = `NOW() + INTERVAL '${voucher.validDays} days'`;

      try {
        await db.query(`
          INSERT INTO "IndividualPurchase" (
            "voucherCode", "passportId", "purchaseDate", "validFrom", "validUntil",
            amount, status, "paymentMode", "createdBy", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, ${purchaseDate}, ${validFrom}, ${validUntil}, $3, $4, $5, $6, ${purchaseDate}, ${purchaseDate})
        `, [voucherCode, passport.id, 55.00, voucher.status, voucher.paymentMode, agentId]);
        voucherCount++;
        console.log(`  ✓ Created ${voucher.status} voucher: ${voucherCode}`);
      } catch (err) {
        console.error(`  ⚠️  Error creating voucher for ${voucher.passportNo}:`, err.message);
      }
    }
    console.log(`  ✅ Created ${voucherCount} vouchers\n`);

    // ===========================================
    // 3. CREATE INVOICES FROM QUOTATIONS
    // ===========================================
    console.log('📄 Creating invoices from quotations...');

    const quotations = await db.query('SELECT id FROM "Quotation" WHERE status = $1 LIMIT 2', ['draft']);
    const financeResult = await db.query('SELECT id FROM "User" WHERE email = $1', ['finance@greenpay.com']);
    const financeId = financeResult.rows[0]?.id || 2;

    let invoiceCount = 0;

    if (quotations.rows.length > 0) {
      // Create unpaid invoice
      const quotation1 = quotations.rows[0];
      const invoiceNum1 = `INV-2025-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

      try {
        await db.query(`
          INSERT INTO "Invoice" (
            "quotationId", "invoiceNumber", "invoiceDate", "dueDate",
            "totalAmount", "paidAmount", status, "paymentStatus",
            "createdBy", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', $3, 0, 'sent', 'unpaid', $4, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days')
        `, [quotation1.id, invoiceNum1, 6875.00, financeId]);

        await db.query('UPDATE "Quotation" SET status = $1, "updatedAt" = NOW() WHERE id = $2', ['approved', quotation1.id]);
        invoiceCount++;
        console.log(`  ✓ Created unpaid invoice: ${invoiceNum1}`);
      } catch (err) {
        console.error('  ⚠️  Error creating unpaid invoice:', err.message);
      }
    }

    if (quotations.rows.length > 1) {
      // Create paid invoice
      const quotation2 = quotations.rows[1];
      const invoiceNum2 = `INV-2025-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

      try {
        const result = await db.query(`
          INSERT INTO "Invoice" (
            "quotationId", "invoiceNumber", "invoiceDate", "dueDate",
            "totalAmount", "paidAmount", status, "paymentStatus", "vouchersGenerated",
            "createdBy", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, NOW() - INTERVAL '20 days', NOW() + INTERVAL '25 days', $3, $3, 'paid', 'paid', true, $4, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days')
          RETURNING id
        `, [quotation2.id, invoiceNum2, 550.00, financeId]);

        const invoiceId = result.rows[0].id;

        // Try to create payment record
        try {
          const refNum = `TXN-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
          await db.query(`
            INSERT INTO "Payment" (
              "invoiceId", "paymentDate", amount, "paymentMode", "referenceNumber",
              notes, "createdBy", "createdAt", "updatedAt"
            )
            VALUES ($1, NOW() - INTERVAL '5 days', $2, 'Bank Transfer', $3, 'Full payment received', $4, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
          `, [invoiceId, 550.00, refNum, financeId]);
          console.log(`  ✓ Created payment for invoice: ${invoiceNum2}`);
        } catch (err) {
          console.log('  ℹ️  Payment table may not exist, skipping payment creation');
        }

        await db.query('UPDATE "Quotation" SET status = $1, "updatedAt" = NOW() WHERE id = $2', ['approved', quotation2.id]);
        invoiceCount++;
        console.log(`  ✓ Created paid invoice: ${invoiceNum2}`);
      } catch (err) {
        console.error('  ⚠️  Error creating paid invoice:', err.message);
      }
    }

    console.log(`  ✅ Created ${invoiceCount} invoices\n`);

    // Update quotation status (one to 'sent')
    await db.query(`
      UPDATE "Quotation"
      SET status = 'sent', "updatedAt" = NOW()
      WHERE status = 'draft'
        AND id NOT IN (SELECT "quotationId" FROM "Invoice" WHERE "quotationId" IS NOT NULL)
      LIMIT 1
    `);

    // ===========================================
    // 4. SUMMARY
    // ===========================================
    console.log('📊 Test Data Summary:\n');

    const passportSummary = await db.query('SELECT COUNT(*) as count FROM "Passport"');
    console.log(`  • Passports: ${passportSummary.rows[0].count}`);

    const voucherSummary = await db.query('SELECT status, COUNT(*) as count FROM "IndividualPurchase" GROUP BY status ORDER BY status');
    console.log(`  • Vouchers: ${voucherSummary.rows.map(r => `${r.status}(${r.count})`).join(', ')}`);

    const invoiceSummary = await db.query('SELECT COUNT(*) as count FROM "Invoice"');
    console.log(`  • Invoices: ${invoiceSummary.rows[0].count}`);

    const quotationSummary = await db.query('SELECT status, COUNT(*) as count FROM "Quotation" GROUP BY status ORDER BY status');
    console.log(`  • Quotations: ${quotationSummary.rows.map(r => `${r.status}(${r.count})`).join(', ')}`);

    console.log('\n✅ Test data seeding complete!\n');
    console.log('🧪 You can now run: npx playwright test tests/new-features\n');

  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    throw error;
  } finally {
    // Close database connection
    await db.end();
  }
}

// Run the seeding
seedTestData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
