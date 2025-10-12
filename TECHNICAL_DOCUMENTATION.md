# PNG GREEN FEES SYSTEM
## TECHNICAL DOCUMENTATION

---

**Document Version:** 1.0  
**Date:** October 2025  
**System Version:** Production Release  
**Prepared by:** PNG Green Fees Development Team

---

## TABLE OF CONTENTS

1. [SYSTEM ARCHITECTURE](#system-architecture)
2. [DATABASE SCHEMA](#database-schema)
3. [API DOCUMENTATION](#api-documentation)
4. [DEPLOYMENT GUIDE](#deployment-guide)
5. [SECURITY IMPLEMENTATION](#security-implementation)
6. [PERFORMANCE OPTIMIZATION](#performance-optimization)
7. [MAINTENANCE PROCEDURES](#maintenance-procedures)
8. [TROUBLESHOOTING GUIDE](#troubleshooting-guide)

---

## SYSTEM ARCHITECTURE

### Technology Stack

**Frontend:**
- React 18.2.0
- Vite 4.5.14
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- React Router DOM
- React Query

**Backend:**
- Supabase (PostgreSQL 15)
- Edge Functions (Deno)
- Row Level Security (RLS)
- Real-time subscriptions
- Authentication & Authorization

**Infrastructure:**
- Cloud hosting (Supabase Cloud)
- CDN for static assets
- Automated backups
- SSL/TLS encryption
- Global edge locations

### System Components

**Frontend Application:**
```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── contexts/           # React contexts
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
└── assets/             # Static assets
```

**Backend Services:**
```
supabase/
├── functions/          # Edge Functions
├── migrations/         # Database migrations
└── config/            # Configuration files
```

### Data Flow Architecture

**Request Flow:**
1. User interacts with React frontend
2. API calls made to Supabase backend
3. Edge Functions process business logic
4. PostgreSQL database stores/retrieves data
5. Real-time updates sent to frontend
6. UI updates automatically

---

## DATABASE SCHEMA

### Core Tables

**Users & Authentication:**
```sql
-- profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('Admin', 'Finance_Manager', 'Counter_Agent', 'Read_Only')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Passport Management:**
```sql
-- passports table
CREATE TABLE passports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_number TEXT UNIQUE NOT NULL,
    surname TEXT NOT NULL,
    given_name TEXT NOT NULL,
    nationality TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    place_of_birth TEXT,
    date_of_issue DATE,
    place_of_issue TEXT,
    file_number TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);
```

**Transaction Management:**
```sql
-- purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    passport_id UUID REFERENCES passports(id),
    service_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_due DECIMAL(10,2) DEFAULT 0,
    receipt_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);
```

**Quotation System:**
```sql
-- quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company_address TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'converted')) DEFAULT 'draft',
    valid_until DATE,
    sent_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);
```

### Relationships

**Foreign Key Relationships:**
- `passports.created_by` → `profiles.id`
- `purchases.passport_id` → `passports.id`
- `purchases.created_by` → `profiles.id`
- `quotations.approved_by` → `profiles.id`
- `quotations.created_by` → `profiles.id`

### Indexes

**Performance Optimization:**
```sql
-- Passport lookups
CREATE INDEX idx_passports_number ON passports(passport_number);
CREATE INDEX idx_passports_created_at ON passports(created_at);

-- Purchase queries
CREATE INDEX idx_purchases_created_at ON purchases(created_at);
CREATE INDEX idx_purchases_passport_id ON purchases(passport_id);

-- Quotation searches
CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);
```

---

## API DOCUMENTATION

### Authentication Endpoints

**Login:**
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

**Logout:**
```http
POST /auth/v1/logout
Authorization: Bearer <access_token>
```

### Passport Management

**Create Passport:**
```http
POST /rest/v1/passports
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "passport_number": "P123456",
    "surname": "Smith",
    "given_name": "John",
    "nationality": "Papua New Guinea",
    "date_of_birth": "1990-01-15",
    "gender": "Male"
}
```

**Get Passports:**
```http
GET /rest/v1/passports?select=*&order=created_at.desc
Authorization: Bearer <access_token>
```

**Search Passports:**
```http
GET /rest/v1/passports?passport_number=eq.P123456
Authorization: Bearer <access_token>
```

### Purchase Processing

**Create Purchase:**
```http
POST /rest/v1/purchases
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "customer_name": "John Smith",
    "passport_id": "uuid-here",
    "service_type": "Green Fee",
    "amount": 50.00,
    "payment_method": "Cash",
    "amount_paid": 100.00,
    "change_due": 50.00
}
```

### Quotation Management

**Create Quotation:**
```http
POST /rest/v1/quotations
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "quotation_number": "Q2025001",
    "customer_name": "ABC Corporation",
    "customer_email": "corporate@abc.com",
    "total_amount": 500.00,
    "status": "draft"
}
```

### Edge Functions

**Bulk Passport Upload:**
```http
POST /functions/v1/bulk-passport-upload
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "fileData": "base64-encoded-csv",
    "fileName": "passports.csv"
}
```

**Send Quotation:**
```http
POST /functions/v1/send-quotation
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "quotationId": "uuid-here",
    "email": "customer@company.com"
}
```

---

## DEPLOYMENT GUIDE

### Environment Setup

**Required Environment Variables:**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application Settings
VITE_APP_NAME=PNG Green Fees System
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### Database Migration

**Apply Migrations:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Frontend Deployment

**Build Process:**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output will be in dist/ directory
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/png-green-fees/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

### Edge Functions Deployment

**Deploy Functions:**
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name
```

**Function Configuration:**
```typescript
// Example Edge Function structure
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200 });
    }

    try {
        // Business logic here
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
```

---

## SECURITY IMPLEMENTATION

### Row Level Security (RLS)

**Profiles Table Policy:**
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );
```

**Passports Table Policy:**
```sql
-- Enable RLS
ALTER TABLE passports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read passports
CREATE POLICY "Authenticated users can read passports" ON passports
    FOR SELECT USING (auth.role() = 'authenticated');

-- Counter agents and admins can insert passports
CREATE POLICY "Agents can insert passports" ON passports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Counter_Agent')
        )
    );
```

### Data Encryption

**At Rest:**
- All data encrypted using AES-256
- Automatic encryption in Supabase
- Encrypted backups

**In Transit:**
- TLS 1.3 for all communications
- HTTPS enforcement
- Certificate pinning

### Authentication Security

**Password Policy:**
- Minimum 8 characters
- Mixed case, numbers, symbols
- Regular rotation requirements
- Account lockout after failed attempts

**Session Management:**
- JWT tokens with expiration
- Refresh token rotation
- Automatic session timeout
- Secure cookie settings

---

## PERFORMANCE OPTIMIZATION

### Database Optimization

**Query Optimization:**
```sql
-- Use proper indexes
CREATE INDEX CONCURRENTLY idx_passports_search 
ON passports USING gin(to_tsvector('english', 
    passport_number || ' ' || surname || ' ' || given_name));

-- Optimize complex queries
EXPLAIN ANALYZE SELECT * FROM passports 
WHERE to_tsvector('english', passport_number || ' ' || surname) 
@@ plainto_tsquery('english', 'search term');
```

**Connection Pooling:**
- Supabase handles connection pooling
- Automatic scaling based on load
- Connection limits per project

### Frontend Optimization

**Code Splitting:**
```javascript
// Lazy load components
const Passports = lazy(() => import('./pages/Passports'));
const Reports = lazy(() => import('./pages/Reports'));

// Route-based splitting
const routes = [
    { path: '/passports', component: Passports },
    { path: '/reports', component: Reports }
];
```

**Caching Strategy:**
```javascript
// React Query for data caching
const { data: passports } = useQuery({
    queryKey: ['passports'],
    queryFn: fetchPassports,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### CDN Configuration

**Static Asset Optimization:**
- Gzip compression enabled
- Brotli compression for modern browsers
- Cache headers for static assets
- Image optimization and WebP support

---

## MAINTENANCE PROCEDURES

### Regular Maintenance Tasks

**Daily:**
- Monitor system performance metrics
- Check error logs and alerts
- Verify backup completion
- Review security logs

**Weekly:**
- Analyze performance trends
- Review user activity logs
- Update security patches
- Clean temporary files

**Monthly:**
- Database maintenance and optimization
- Security audit and review
- Performance analysis and tuning
- Backup restoration testing

### Backup Procedures

**Automated Backups:**
- Daily full database backups
- Incremental backups every 6 hours
- Point-in-time recovery available
- Cross-region backup replication

**Manual Backup:**
```bash
# Create manual backup
supabase db dump --data-only --file backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset --file backup-20250101.sql
```

### Monitoring and Alerting

**Key Metrics:**
- Response time < 2 seconds
- Uptime > 99.9%
- Error rate < 0.1%
- Database connections < 80%

**Alert Conditions:**
- High error rates
- Slow response times
- Database connection issues
- Security incidents

---

## TROUBLESHOOTING GUIDE

### Common Issues

**Database Connection Issues:**
```bash
# Check connection status
supabase status

# Reset database
supabase db reset

# Check logs
supabase logs db
```

**Edge Function Errors:**
```bash
# View function logs
supabase functions logs function-name

# Deploy function
supabase functions deploy function-name

# Test function locally
supabase functions serve
```

**Frontend Build Issues:**
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check dependencies
npm audit
npm audit fix

# Rebuild
npm run build
```

### Performance Issues

**Slow Queries:**
```sql
-- Identify slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM passports WHERE passport_number = 'P123456';
```

**Memory Issues:**
```bash
# Check memory usage
free -h

# Monitor processes
top -p $(pgrep node)

# Clear system cache
echo 3 > /proc/sys/vm/drop_caches
```

### Security Issues

**Unauthorized Access:**
1. Check authentication logs
2. Review user permissions
3. Verify RLS policies
4. Update security patches

**Data Breach Response:**
1. Isolate affected systems
2. Assess scope of breach
3. Notify stakeholders
4. Implement containment measures
5. Conduct forensic analysis

---

**END OF TECHNICAL DOCUMENTATION**

---

*This technical documentation provides comprehensive information for system administrators, developers, and technical support personnel working with the PNG Green Fees System.*

**Document Control:**
- **Version:** 1.0
- **Last Updated:** October 2025
- **Next Review:** January 2026
- **Technical Lead:** PNG Green Fees Development Team
