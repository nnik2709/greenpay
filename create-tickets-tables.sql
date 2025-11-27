-- Create Tickets tables for PostgreSQL backend
-- Run this on the production database

-- Main Tickets table
CREATE TABLE IF NOT EXISTS "Ticket" (
  id SERIAL PRIMARY KEY,
  "ticketNumber" VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  "createdBy" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ticket Responses table
CREATE TABLE IF NOT EXISTS "TicketResponse" (
  id SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  "isStaffResponse" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON "Ticket" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "Ticket_id_seq" TO greenpay_user;

GRANT SELECT, INSERT, UPDATE, DELETE ON "TicketResponse" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "TicketResponse_id_seq" TO greenpay_user;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_ticket_number" ON "Ticket"("ticketNumber");
CREATE INDEX IF NOT EXISTS "idx_ticket_status" ON "Ticket"(status);
CREATE INDEX IF NOT EXISTS "idx_ticket_created_by" ON "Ticket"("createdBy");
CREATE INDEX IF NOT EXISTS "idx_ticket_created_at" ON "Ticket"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_ticket_response_ticket_id" ON "TicketResponse"("ticketId");
CREATE INDEX IF NOT EXISTS "idx_ticket_response_user_id" ON "TicketResponse"("userId");
CREATE INDEX IF NOT EXISTS "idx_ticket_response_created_at" ON "TicketResponse"("createdAt");

-- Comments
COMMENT ON TABLE "Ticket" IS 'Support tickets for system issues and requests';
COMMENT ON TABLE "TicketResponse" IS 'Responses and comments on support tickets';

COMMENT ON COLUMN "Ticket"."ticketNumber" IS 'Unique ticket identifier displayed to users (e.g., TKT-ABC123)';
COMMENT ON COLUMN "Ticket".priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN "Ticket".status IS 'Current status: open, in_progress, resolved, closed';

COMMENT ON COLUMN "TicketResponse"."isStaffResponse" IS 'True if response is from staff/admin, false if from ticket creator';

-- Show created tables
SELECT
  'Tables created successfully' as status,
  (SELECT COUNT(*) FROM "Ticket") as ticket_count,
  (SELECT COUNT(*) FROM "TicketResponse") as response_count;
