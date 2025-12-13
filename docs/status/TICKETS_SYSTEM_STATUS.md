# Support Ticketing System - Status Report

## Summary

The support ticketing system exists in the codebase but is **NOT MIGRATED** to PostgreSQL yet. It's still using Supabase, which is why it's not visible or working in production.

## Current State

### Frontend Implementation ✅
**Location:** `/src/pages/Tickets.jsx` and related components

**Components:**
- `src/pages/Tickets.jsx` - Main tickets page
- `src/components/TicketDashboard.jsx` - Dashboard view
- `src/components/CreateTicket.jsx` - Ticket creation form
- `src/components/TicketDetail.jsx` - Ticket detail view
- `src/components/TicketList.jsx` - Tickets list
- `src/components/TicketForm.jsx` - Reusable form component

**Data Layer:**
- `src/lib/ticketStorage.js` - **STILL USING SUPABASE** ⚠️

### Backend Implementation ❌
**Status:** NOT MIGRATED - No PostgreSQL backend route exists

The ticketStorage.js file is still calling Supabase:
```javascript
import { supabase } from './supabaseClient';

export const getTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    // ...
};
```

### Navigation Menu ✅
**Visible to:** IT_Support role only

The menu item exists in `Header.jsx`:
```javascript
IT_Support: [
  // ... other menu items
  {
    to: '/tickets',
    icon: <Ticket className="h-4 w-4" />,
    label: 'Support Tickets'
  }
]
```

### Routing ✅
**Route defined in:** `src/App.jsx`
```javascript
<Route path="tickets" element={<Tickets />} />
```

**No role restriction** - route is accessible to all authenticated users, but menu only shows for IT_Support.

### Database Schema (Supabase) ✅

**Main Tickets Table:**
```sql
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  responses JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Ticket Responses Table:** (from migration 010_ticket_responses.sql)
```sql
create table if not exists public.ticket_responses (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  is_staff_response boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Why It's Not Visible

1. **ticketStorage.js uses Supabase** - It's calling the old Supabase database
2. **No PostgreSQL backend route** - There's no `/api/tickets` endpoint
3. **Frontend deployed without backend** - Current build tries to call Supabase which is not connected

## What Needs To Be Done

### 1. Create PostgreSQL Tables

Create two tables matching the Supabase schema:
- `Ticket` table (main tickets)
- `TicketResponse` table (ticket responses)

### 2. Create Backend Routes

Create `/backend/routes/tickets.js` with:
- `GET /api/tickets` - List all tickets (with role-based filtering)
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket status
- `DELETE /api/tickets/:id` - Delete ticket (admin only)
- `POST /api/tickets/:id/responses` - Add response to ticket

### 3. Update Frontend API Client

Add tickets methods to `src/lib/api/client.js`:
```javascript
tickets: {
  getAll: (params = {}) => fetchAPI(`/tickets?${new URLSearchParams(params)}`),
  getById: (id) => fetchAPI(`/tickets/${id}`),
  create: (data) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/tickets/${id}`, { method: 'DELETE' }),
  addResponse: (id, message, isStaffResponse = false) => fetchAPI(`/tickets/${id}/responses`, {
    method: 'POST',
    body: JSON.stringify({ message, is_staff_response: isStaffResponse }),
  }),
}
```

### 4. Migrate ticketStorage.js

Change from Supabase calls to API client calls (same pattern as paymentModesStorage.js).

### 5. Update Ticket Components

Update components to handle PostgreSQL response format (camelCase vs snake_case).

## Features Available

Once migrated, the system will support:

- ✅ Create support tickets
- ✅ View all tickets (role-based)
- ✅ Update ticket status (open, in_progress, resolved, closed)
- ✅ Set priority levels (low, medium, high, urgent)
- ✅ Add responses/comments to tickets
- ✅ Track ticket history
- ✅ Staff vs user responses
- ✅ Email notifications (when ticket created - already in code)

## Role-Based Access

Based on Supabase RLS policies:

- **All authenticated users:** Can create tickets, view own tickets, add responses to own tickets
- **Flex_Admin & IT_Support:** Can view all tickets, update any ticket, add staff responses
- **Flex_Admin only:** Can delete tickets

## Migration Priority

This should be added to the PostgreSQL migration plan as it's a complete feature that's already built but non-functional.

**Estimated effort:** 3-4 hours
- 1 hour: Database schema creation
- 1 hour: Backend routes
- 1 hour: Frontend API migration
- 1 hour: Testing and fixes
