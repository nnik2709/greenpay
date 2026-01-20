-- ================================================================
-- Multi-Voucher Performance Indexes Migration
-- ================================================================
-- Date: 2026-01-13
-- Purpose: Add performance indexes for buy-online multi-voucher system
-- Related: SECURITY_AUDIT_FIXES.md
-- ================================================================

-- 🔒 SECURITY & PERFORMANCE: Indexes for multi-voucher queries

-- Index for purchase_session_id lookup (most common query pattern)
-- Used by: Webhook handler, recovery endpoint, admin queries
CREATE INDEX IF NOT EXISTS idx_individual_purchases_session
ON individual_purchases(purchase_session_id);

-- Index for status + session lookup (filtered queries)
-- Used by: Status-specific queries (PENDING, ACTIVE, USED)
CREATE INDEX IF NOT EXISTS idx_individual_purchases_status_session
ON individual_purchases(status, purchase_session_id);

-- Index for email lookup (voucher recovery, customer support)
-- Used by: Recovery endpoint, support queries
CREATE INDEX IF NOT EXISTS idx_individual_purchases_email
ON individual_purchases(customer_email);

-- Index for purchase_sessions email lookup (recovery endpoint)
-- Used by: /api/buy-online/recover endpoint
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_email
ON purchase_sessions(customer_email);

-- Index for purchase_sessions payment_status (monitoring queries)
-- Used by: Admin reporting, monitoring dashboards
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_status
ON purchase_sessions(payment_status);

-- Composite index for session + email lookup (security validation)
-- Used by: Recovery endpoint security check
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_id_email
ON purchase_sessions(id, customer_email);

-- ================================================================
-- Performance Validation Queries
-- ================================================================
-- Run these queries AFTER migration to verify index usage:
--
-- 1. Voucher lookup by session (should use idx_individual_purchases_session):
-- EXPLAIN ANALYZE SELECT * FROM individual_purchases WHERE purchase_session_id = 'PGKO-123';
--
-- 2. PENDING vouchers by session (should use idx_individual_purchases_status_session):
-- EXPLAIN ANALYZE SELECT * FROM individual_purchases WHERE status = 'PENDING' AND purchase_session_id = 'PGKO-123';
--
-- 3. Recovery endpoint query (should use idx_purchase_sessions_id_email):
-- EXPLAIN ANALYZE SELECT * FROM purchase_sessions WHERE id = 'PGKO-123' AND customer_email = 'test@example.com';
--
-- 4. Customer support lookup (should use idx_individual_purchases_email):
-- EXPLAIN ANALYZE SELECT * FROM individual_purchases WHERE customer_email = 'test@example.com';
-- ================================================================

-- Verify indexes created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('individual_purchases', 'purchase_sessions')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
