#!/bin/bash
# Deploy script to add optional passport fields to production database

echo "Adding optional fields to Passport table on production database..."

# Run the SQL on the remote server
ssh root@72.61.208.79 "PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay -d greenpay_db -c \"
ALTER TABLE \\\"Passport\\\"
ADD COLUMN IF NOT EXISTS \\\"placeOfBirth\\\" VARCHAR(255),
ADD COLUMN IF NOT EXISTS \\\"placeOfIssue\\\" VARCHAR(255),
ADD COLUMN IF NOT EXISTS \\\"dateOfIssue\\\" DATE,
ADD COLUMN IF NOT EXISTS \\\"email\\\" VARCHAR(255),
ADD COLUMN IF NOT EXISTS \\\"phone\\\" VARCHAR(50);
\""

if [ $? -eq 0 ]; then
    echo "✓ Optional passport fields added successfully!"
else
    echo "✗ Failed to add optional passport fields"
    exit 1
fi
