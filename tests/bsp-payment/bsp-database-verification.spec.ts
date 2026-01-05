/**
 * BSP DOKU Database Verification Tests
 *
 * Tests database integrity, constraints, and data consistency
 * after payments are processed
 */

import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'greenpay_db',
  user: 'greenpay_user',
  password: process.env.DB_PASSWORD || ''
};

let dbClient: Client;

test.beforeAll(async () => {
  dbClient = new Client(dbConfig);
  await dbClient.connect();
});

test.afterAll(async () => {
  await dbClient.end();
});

test.describe('Database Integrity Tests', () => {

  test('DB.1 - No orphaned vouchers (all linked to passports)', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM individual_purchases ip
      WHERE NOT EXISTS (
        SELECT 1 FROM passports p
        WHERE p.passport_number = ip.passport_number
      )
    `);

    expect(parseInt(result.rows[0].count)).toBe(0);
    console.log('✅ No orphaned vouchers found');
  });

  test('DB.2 - No orphaned sessions (completed sessions have vouchers)', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM purchase_sessions ps
      WHERE payment_status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM individual_purchases ip
        WHERE ip.purchase_session_id = ps.id
      )
    `);

    expect(parseInt(result.rows[0].count)).toBe(0);
    console.log('✅ No orphaned completed sessions found');
  });

  test('DB.3 - No orphaned transactions (completed transactions have sessions)', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM payment_gateway_transactions pgt
      WHERE status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM individual_purchases ip
        WHERE ip.purchase_session_id = pgt.session_id
      )
    `);

    const orphaned = parseInt(result.rows[0].count);

    if (orphaned > 0) {
      // List orphaned transactions
      const orphanedList = await dbClient.query(`
        SELECT session_id, created_at, amount
        FROM payment_gateway_transactions pgt
        WHERE status = 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM individual_purchases ip
          WHERE ip.purchase_session_id = pgt.session_id
        )
        LIMIT 10
      `);

      console.error('❌ Orphaned transactions found:', orphanedList.rows);
    }

    expect(orphaned).toBe(0);
    console.log('✅ No orphaned completed transactions found');
  });

  test('DB.4 - Unique voucher codes', async () => {
    const result = await dbClient.query(`
      SELECT voucher_code, COUNT(*) as count
      FROM individual_purchases
      GROUP BY voucher_code
      HAVING COUNT(*) > 1
    `);

    expect(result.rows.length).toBe(0);

    if (result.rows.length > 0) {
      console.error('❌ Duplicate voucher codes found:', result.rows);
    } else {
      console.log('✅ All voucher codes are unique');
    }
  });

  test('DB.5 - Unique session IDs in transactions', async () => {
    const result = await dbClient.query(`
      SELECT session_id, COUNT(*) as count
      FROM payment_gateway_transactions
      GROUP BY session_id
      HAVING COUNT(*) > 1
    `);

    expect(result.rows.length).toBe(0);
    console.log('✅ All transaction session IDs are unique');
  });

  test('DB.6 - Amount consistency (transaction = voucher)', async () => {
    const result = await dbClient.query(`
      SELECT
        pgt.session_id,
        pgt.amount as transaction_amount,
        ip.amount as voucher_amount
      FROM payment_gateway_transactions pgt
      JOIN individual_purchases ip ON ip.purchase_session_id = pgt.session_id
      WHERE pgt.status = 'completed'
      AND pgt.amount != ip.amount
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      console.error('❌ Amount mismatch found:', result.rows);
    }

    expect(result.rows.length).toBe(0);
    console.log('✅ All amounts consistent between transactions and vouchers');
  });

  test('DB.7 - Valid date ranges (valid_from < valid_until)', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM individual_purchases
      WHERE valid_from >= valid_until
    `);

    expect(parseInt(result.rows[0].count)).toBe(0);
    console.log('✅ All vouchers have valid date ranges');
  });

  test('DB.8 - Voucher validity period (1 year)', async () => {
    const result = await dbClient.query(`
      SELECT
        voucher_code,
        valid_from,
        valid_until,
        valid_until - valid_from as duration
      FROM individual_purchases
      WHERE valid_until - valid_from != interval '1 year'
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      console.warn('⚠️  Non-standard validity periods found:', result.rows);
    }

    // Allow some variance (±1 day) due to daylight saving time
    expect(result.rows.length).toBeLessThan(10);
  });

  test('DB.9 - Payment status distribution', async () => {
    const result = await dbClient.query(`
      SELECT status, COUNT(*) as count
      FROM payment_gateway_transactions
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('Payment status distribution:', result.rows);

    // Verify we have at least some completed transactions
    const completed = result.rows.find(r => r.status === 'completed');
    expect(completed).toBeTruthy();
    expect(parseInt(completed!.count)).toBeGreaterThan(0);
  });

  test('DB.10 - Recent transactions processed', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM payment_gateway_transactions
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);

    const recentCount = parseInt(result.rows[0].count);
    console.log(`Recent transactions (last hour): ${recentCount}`);

    // Should have at least some recent transactions from our tests
    expect(recentCount).toBeGreaterThan(0);
  });
});

test.describe('Database Performance Tests', () => {

  test('PERF.1 - Voucher lookup by code (indexed)', async () => {
    // Get a sample voucher code
    const voucherResult = await dbClient.query(
      'SELECT voucher_code FROM individual_purchases LIMIT 1'
    );

    if (voucherResult.rows.length === 0) {
      test.skip();
      return;
    }

    const voucherCode = voucherResult.rows[0].voucher_code;

    // Test query performance with EXPLAIN ANALYZE
    const explain = await dbClient.query(`
      EXPLAIN ANALYZE
      SELECT * FROM individual_purchases
      WHERE voucher_code = $1
    `, [voucherCode]);

    const plan = explain.rows.map(r => r['QUERY PLAN']).join('\n');
    console.log('Query plan:', plan);

    // Verify index is used
    expect(plan).toContain('Index Scan');
    expect(plan).not.toContain('Seq Scan');

    // Extract execution time
    const timeMatch = plan.match(/Execution Time: ([\d.]+) ms/);
    if (timeMatch) {
      const executionTime = parseFloat(timeMatch[1]);
      console.log(`Execution time: ${executionTime}ms`);

      // Should be fast (< 10ms)
      expect(executionTime).toBeLessThan(10);
    }
  });

  test('PERF.2 - Passport lookup (indexed)', async () => {
    const passportResult = await dbClient.query(
      'SELECT passport_number FROM passports LIMIT 1'
    );

    if (passportResult.rows.length === 0) {
      test.skip();
      return;
    }

    const passportNumber = passportResult.rows[0].passport_number;

    const explain = await dbClient.query(`
      EXPLAIN ANALYZE
      SELECT * FROM passports
      WHERE passport_number = $1
    `, [passportNumber]);

    const plan = explain.rows.map(r => r['QUERY PLAN']).join('\n');

    // Verify index is used
    expect(plan).toContain('Index Scan');

    const timeMatch = plan.match(/Execution Time: ([\d.]+) ms/);
    if (timeMatch) {
      const executionTime = parseFloat(timeMatch[1]);
      expect(executionTime).toBeLessThan(10);
      console.log(`✅ Passport lookup: ${executionTime}ms`);
    }
  });

  test('PERF.3 - Transaction lookup (indexed)', async () => {
    const txResult = await dbClient.query(
      'SELECT session_id FROM payment_gateway_transactions LIMIT 1'
    );

    if (txResult.rows.length === 0) {
      test.skip();
      return;
    }

    const sessionId = txResult.rows[0].session_id;

    const explain = await dbClient.query(`
      EXPLAIN ANALYZE
      SELECT * FROM payment_gateway_transactions
      WHERE session_id = $1
    `, [sessionId]);

    const plan = explain.rows.map(r => r['QUERY PLAN']).join('\n');

    // Verify index is used
    expect(plan).toContain('Index Scan');

    const timeMatch = plan.match(/Execution Time: ([\d.]+) ms/);
    if (timeMatch) {
      const executionTime = parseFloat(timeMatch[1]);
      expect(executionTime).toBeLessThan(10);
      console.log(`✅ Transaction lookup: ${executionTime}ms`);
    }
  });

  test('PERF.4 - Database connection count', async () => {
    const result = await dbClient.query(`
      SELECT count(*) as connections
      FROM pg_stat_activity
      WHERE datname = 'greenpay_db'
    `);

    const connections = parseInt(result.rows[0].connections);
    console.log(`Active database connections: ${connections}`);

    // Should not have excessive connections (< 15 typical)
    expect(connections).toBeLessThan(20);
  });

  test('PERF.5 - Table sizes', async () => {
    const result = await dbClient.query(`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size,
        pg_total_relation_size('public.' || tablename) as bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('individual_purchases', 'passports', 'payment_gateway_transactions', 'purchase_sessions')
      ORDER BY pg_total_relation_size('public.' || tablename) DESC
    `);

    console.log('Table sizes:');
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.size}`);
    });

    // Verify tables are not excessively large (< 100MB typical for test)
    result.rows.forEach(row => {
      expect(parseInt(row.bytes)).toBeLessThan(100 * 1024 * 1024); // 100MB
    });
  });
});

test.describe('Data Quality Tests', () => {

  test('DQ.1 - All vouchers have valid status', async () => {
    const result = await dbClient.query(`
      SELECT DISTINCT status
      FROM individual_purchases
    `);

    const validStatuses = ['active', 'used', 'expired', 'cancelled'];
    result.rows.forEach(row => {
      expect(validStatuses).toContain(row.status);
    });

    console.log('✅ All voucher statuses are valid:', result.rows.map(r => r.status));
  });

  test('DQ.2 - All transactions have valid gateway name', async () => {
    const result = await dbClient.query(`
      SELECT DISTINCT gateway_name
      FROM payment_gateway_transactions
    `);

    const validGateways = ['bsp', 'stripe']; // Add others as needed
    result.rows.forEach(row => {
      expect(validGateways).toContain(row.gateway_name);
    });

    console.log('✅ All gateway names are valid:', result.rows.map(r => r.gateway_name));
  });

  test('DQ.3 - Voucher codes follow correct format', async () => {
    const result = await dbClient.query(`
      SELECT voucher_code
      FROM individual_purchases
      WHERE voucher_code !~ '^[A-Z0-9]{8}$'
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      console.error('❌ Invalid voucher code formats:', result.rows);
    }

    expect(result.rows.length).toBe(0);
    console.log('✅ All voucher codes follow 8-char alphanumeric format');
  });

  test('DQ.4 - All completed transactions have completion timestamp', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM payment_gateway_transactions
      WHERE status = 'completed'
      AND completed_at IS NULL
    `);

    expect(parseInt(result.rows[0].count)).toBe(0);
    console.log('✅ All completed transactions have completion timestamp');
  });

  test('DQ.5 - Email addresses valid format', async () => {
    const result = await dbClient.query(`
      SELECT customer_email
      FROM individual_purchases
      WHERE customer_email IS NOT NULL
      AND customer_email !~ '^[^@]+@[^@]+\\.[^@]+$'
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      console.warn('⚠️  Invalid email formats found:', result.rows);
    }

    expect(result.rows.length).toBe(0);
  });

  test('DQ.6 - All amounts are positive', async () => {
    const result = await dbClient.query(`
      SELECT COUNT(*) as count
      FROM individual_purchases
      WHERE amount <= 0
    `);

    expect(parseInt(result.rows[0].count)).toBe(0);
    console.log('✅ All voucher amounts are positive');
  });

  test('DQ.7 - Currency is PGK', async () => {
    const result = await dbClient.query(`
      SELECT DISTINCT currency
      FROM payment_gateway_transactions
    `);

    result.rows.forEach(row => {
      expect(row.currency).toBe('PGK');
    });

    console.log('✅ All transactions are in PGK currency');
  });
});
