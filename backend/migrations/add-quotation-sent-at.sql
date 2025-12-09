-- Add sent_at column to quotations table
-- This allows tracking when quotations are emailed to clients

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;

-- Add comment to document the column purpose
COMMENT ON COLUMN quotations.sent_at IS 'Timestamp when quotation was sent via email';

-- Optional: Update existing 'sent' quotations to have a sent_at date
-- (using created_at as fallback for historical records)
UPDATE quotations
SET sent_at = created_at
WHERE status = 'sent' AND sent_at IS NULL;
