-- Migration 003: Fix Settings Table Structure
-- Date: 2025-12-19
-- Issue: Settings table has key/value structure, but code expects individual columns
-- Run as: postgres superuser

-- =====================================================
-- BACKUP EXISTING DATA (if any)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings_backup AS SELECT * FROM settings;

-- =====================================================
-- DROP OLD TABLE AND RECREATE WITH CORRECT SCHEMA
-- =====================================================
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    voucher_validity_days INTEGER DEFAULT 30,
    default_amount NUMERIC(10,2) DEFAULT 50.00,
    gst_enabled BOOLEAN DEFAULT true,
    terms_content TEXT,
    privacy_content TEXT,
    refunds_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERT DEFAULT SETTINGS
-- =====================================================
INSERT INTO settings (
    voucher_validity_days,
    default_amount,
    gst_enabled,
    terms_content,
    privacy_content,
    refunds_content
) VALUES (
    30,
    50.00,
    true,
    '',
    '',
    ''
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO greenpay_user;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT * FROM settings;

SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- =====================================================
-- CLEANUP
-- =====================================================
-- Drop backup after verifying (optional)
-- DROP TABLE settings_backup;
