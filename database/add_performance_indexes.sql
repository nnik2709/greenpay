-- Performance Indexes for GreenPay Database
-- Date: 2025-12-19
-- Purpose: Improve query performance for large datasets
-- Safe to run on production (uses CONCURRENTLY - no table locks)

-- Passports table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passports_created_at
  ON passports(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passports_passport_number
  ON passports(passport_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_passports_full_name
  ON passports(full_name);

-- Individual purchases indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_individual_purchases_passport
  ON individual_purchases(passport_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_individual_purchases_created
  ON individual_purchases(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_individual_purchases_voucher_code
  ON individual_purchases(voucher_code);

-- Corporate vouchers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_corporate_vouchers_passport
  ON corporate_vouchers(passport_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_corporate_vouchers_created
  ON corporate_vouchers(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_corporate_vouchers_voucher_code
  ON corporate_vouchers(voucher_code);

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('passports', 'individual_purchases', 'corporate_vouchers')
ORDER BY tablename, indexname;
