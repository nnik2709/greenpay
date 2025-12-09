-- Add optional fields to Passport table if they don't exist
ALTER TABLE "Passport"
ADD COLUMN IF NOT EXISTS "placeOfBirth" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "placeOfIssue" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "dateOfIssue" DATE,
ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50);
