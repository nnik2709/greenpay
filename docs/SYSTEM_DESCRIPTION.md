# PNG Green Fees System - Comprehensive System Description

**Version:** 1.0
**Last Updated:** December 15, 2024
**Domain:** greenpay.eywademo.cloud

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Authentication & Authorization](#authentication--authorization)
6. [Backend API Architecture](#backend-api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Key Features & Workflows](#key-features--workflows)
9. [Payment Integration](#payment-integration)
10. [Hardware Integration](#hardware-integration)
11. [Testing Strategy](#testing-strategy)
12. [Deployment & Infrastructure](#deployment--infrastructure)
13. [Security Considerations](#security-considerations)
14. [Code Metrics](#code-metrics)

---

## Executive Summary

The PNG Green Fees System is a comprehensive government application designed for the Papua New Guinea Department of Immigration to manage passport-based green fee vouchers and payments. The system streamlines the collection of airport exit fees through a modern web-based platform.

### Primary Objectives
- Digitize passport-based green fee collection
- Enable online and counter-based voucher purchases
- Provide corporate bulk voucher management
- Generate detailed financial reports and analytics
- Ensure secure, role-based access control
- Support multiple payment methods including online gateways

### Target Users
- **Counter Agents**: Airport and immigration counter staff
- **Finance Managers**: Financial oversight and reporting
- **IT Support**: Technical support and user management
- **System Administrators**: Full system configuration
- **Corporate Customers**: Bulk voucher purchases
- **Individual Customers**: Online voucher purchases

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐          │
│  │   Staff    │  │  Corporate │  │   Public     │          │
│  │   Portal   │  │   Portal   │  │   Portal     │          │
│  └────────────┘  └────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                      │
│  - React 18 + React Router 6                                │
│  - Vite Build System                                         │
│  - Tailwind CSS + shadcn/ui                                  │
│  - Role-Based UI Components                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  - Express.js REST API                                       │
│  - JWT Authentication                                        │
│  - Role-Based Middleware                                     │
│  - Rate Limiting & Security                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  - User Management & Roles                                   │
│  - Passport & Voucher Records                                │
│  - Transaction & Payment History                             │
│  - Audit Logs & Reports                                      │
└─────────────────────────────────────────────────────────────┘
```

### Service Integration Layer

```
Backend API
    │
    ├── Payment Gateways
    │   ├── Stripe (Testing/POC)
    │   ├── Kina Bank Internet Payment Gateway (Primary)
    │   └── BSP Payment Gateway (Future)
    │
    ├── Email Service
    │   ├── Nodemailer (Primary)
    │   └── SMTP Configuration
    │
    ├── SMS Service
    │   └── SMS Gateway Integration (Future)
    │
    └── Document Generation
        ├── PDFKit (Vouchers, Invoices)
        └── QRCode Generation
```

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.2.0 | UI component library |
| **Routing** | React Router | 6.16.0 | Client-side routing |
| **Build Tool** | Vite | 4.4.5 | Fast build system |
| **Styling** | Tailwind CSS | 3.3.3 | Utility-first CSS |
| **UI Components** | shadcn/ui | Latest | Radix UI + Tailwind |
| **State Management** | React Context | Built-in | Auth & global state |
| **Animation** | Framer Motion | 10.16.4 | UI animations |
| **Charts** | Recharts | 2.12.7 | Data visualization |
| **PDF Generation** | jsPDF | 3.0.3 | Client-side PDFs |
| **QR Codes** | qrcode | 1.5.4 | QR code generation |
| **Barcode** | JsBarcode | 3.12.1 | Barcode generation |
| **Scanner** | html5-qrcode | 2.3.8 | QR code scanning |
| **OCR** | Tesseract.js | 6.0.1 | Text recognition |
| **Spreadsheet** | xlsx | 0.18.5 | Excel file handling |

### Backend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | Latest | JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | Web framework |
| **Database** | PostgreSQL | 8.11.3 | Relational database |
| **Authentication** | JWT | 9.0.2 | Token-based auth |
| **Password Hashing** | bcryptjs | 2.4.3 | Password security |
| **Validation** | express-validator | 7.0.1 | Input validation |
| **Email** | Nodemailer | 7.0.11 | Email service |
| **PDF Generation** | PDFKit | 0.17.2 | Server-side PDFs |
| **QR Codes** | qrcode | 1.5.3 | QR code generation |
| **Rate Limiting** | express-rate-limit | 8.2.1 | API rate limiting |
| **Logging** | Morgan | 1.10.0 | HTTP request logging |
| **File Compression** | Archiver | 7.0.1 | ZIP file creation |

### Development & Testing

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Testing Framework** | Playwright | 1.55.1 | E2E testing |
| **Process Manager** | PM2 | Latest | Production process mgmt |
| **Web Server** | Nginx | Latest | Reverse proxy & SSL |
| **Version Control** | Git | Latest | Source control |

---

## Database Design

### Database Schema Overview

The system uses PostgreSQL with a normalized relational schema consisting of 15+ tables.

#### Core Tables

**User Management**
```sql
User
├── id (UUID, PK)
├── name (TEXT)
├── email (TEXT, UNIQUE)
├── passwordHash (TEXT)
├── roleId (INTEGER, FK → Role)
├── isActive (BOOLEAN)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

Role
├── id (SERIAL, PK)
├── name (TEXT) -- Flex_Admin, Finance_Manager, Counter_Agent, IT_Support
└── description (TEXT)

login_events
├── id (SERIAL, PK)
├── user_id (UUID, FK → User)
├── email (TEXT)
├── login_time (TIMESTAMP)
├── ip_address (TEXT)
├── user_agent (TEXT)
├── status (TEXT) -- 'success' or 'failed'
└── failure_reason (TEXT, nullable)
```

**Passport & Voucher Management**
```sql
Passport
├── id (SERIAL, PK)
├── passportNumber (TEXT, UNIQUE)
├── givenName (TEXT)
├── surname (TEXT)
├── nationality (TEXT)
├── dateOfBirth (DATE)
├── gender (TEXT)
├── expiryDate (DATE)
├── issuingCountry (TEXT)
├── mrzLine1 (TEXT) -- Machine Readable Zone
├── mrzLine2 (TEXT)
├── createdBy (UUID, FK → User)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

individual_purchases
├── id (SERIAL, PK)
├── passportId (INTEGER, FK → Passport)
├── voucherCode (TEXT, UNIQUE)
├── amount (NUMERIC)
├── currency (TEXT) -- 'PGK'
├── paymentMode (TEXT)
├── status (TEXT) -- 'pending', 'paid', 'used', 'refunded'
├── validUntil (DATE)
├── issuedBy (UUID, FK → User)
├── issuedDate (TIMESTAMP)
├── usedDate (TIMESTAMP, nullable)
└── createdAt (TIMESTAMP)

corporate_vouchers
├── id (SERIAL, PK)
├── batchId (TEXT)
├── companyName (TEXT)
├── voucherCode (TEXT, UNIQUE)
├── amount (NUMERIC)
├── currency (TEXT)
├── quantity (INTEGER)
├── status (TEXT)
├── passportNumber (TEXT, nullable)
├── registeredAt (TIMESTAMP, nullable)
├── createdBy (UUID, FK → User)
└── createdAt (TIMESTAMP)
```

**Financial Management**
```sql
Quotation
├── id (SERIAL, PK)
├── quotationNumber (TEXT, UNIQUE)
├── customerId (INTEGER, FK → Customer)
├── companyName (TEXT)
├── items (JSONB) -- Array of line items
├── subtotal (NUMERIC)
├── tax (NUMERIC)
├── total (NUMERIC)
├── status (TEXT) -- 'draft', 'sent', 'approved', 'rejected'
├── validUntil (DATE)
├── sentAt (TIMESTAMP, nullable)
├── createdBy (UUID, FK → User)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

Invoice
├── id (SERIAL, PK)
├── invoiceNumber (TEXT, UNIQUE)
├── customerId (INTEGER, FK → Customer)
├── quotationId (INTEGER, FK → Quotation, nullable)
├── items (JSONB)
├── subtotal (NUMERIC)
├── gst (NUMERIC) -- 10% GST for PNG
├── total (NUMERIC)
├── status (TEXT) -- 'unpaid', 'paid', 'overdue', 'cancelled'
├── dueDate (DATE)
├── paidDate (DATE, nullable)
├── createdBy (UUID, FK → User)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

Transaction
├── id (SERIAL, PK)
├── transactionId (TEXT, UNIQUE)
├── type (TEXT) -- 'individual', 'corporate', 'quotation'
├── referenceId (INTEGER) -- Links to purchase/voucher/invoice
├── amount (NUMERIC)
├── currency (TEXT)
├── paymentMethod (TEXT)
├── paymentGateway (TEXT, nullable)
├── gatewayTransactionId (TEXT, nullable)
├── status (TEXT) -- 'pending', 'completed', 'failed', 'refunded'
├── userId (UUID, FK → User, nullable)
└── createdAt (TIMESTAMP)
```

**Configuration & Support**
```sql
Customer
├── id (SERIAL, PK)
├── name (TEXT)
├── email (TEXT)
├── phone (TEXT)
├── companyName (TEXT, nullable)
├── taxId (TEXT, nullable)
├── address (TEXT)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

payment_mode
├── id (SERIAL, PK)
├── name (TEXT)
├── type (TEXT) -- 'cash', 'card', 'bank_transfer', 'online'
├── isActive (BOOLEAN)
├── displayOrder (INTEGER)
└── createdAt (TIMESTAMP)

email_template
├── id (SERIAL, PK)
├── name (TEXT, UNIQUE)
├── subject (TEXT)
├── body (TEXT)
├── variables (JSONB) -- Placeholder variables
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)

support_ticket
├── id (SERIAL, PK)
├── ticketNumber (TEXT, UNIQUE)
├── userId (UUID, FK → User, nullable)
├── subject (TEXT)
├── description (TEXT)
├── status (TEXT) -- 'open', 'in_progress', 'resolved', 'closed'
├── priority (TEXT) -- 'low', 'medium', 'high', 'urgent'
├── assignedTo (UUID, FK → User, nullable)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)
```

### Database Indexes

Performance indexes are applied to:
- Primary keys (automatic)
- Foreign keys
- Unique constraints (email, passport numbers, voucher codes)
- Login event queries (user_id, created_at, email, event_type)
- Transaction lookups (transaction_id, reference_id, user_id)
- Voucher validation (voucher_code, status)

---

## Authentication & Authorization

### Authentication Flow

```
1. User Login Request
   ↓
2. Backend validates credentials (email + bcrypt password)
   ↓
3. Generate JWT token (24h expiration)
   ↓
4. Record login event (IP, user agent, timestamp)
   ↓
5. Return token + user data to frontend
   ↓
6. Frontend stores token in memory/storage
   ↓
7. All API requests include JWT in Authorization header
   ↓
8. Backend middleware validates JWT on each request
```

### JWT Token Structure

```json
{
  "userId": "uuid-here",
  "iat": 1702584000,
  "exp": 1702670400
}
```

### Role-Based Access Control (RBAC)

The system implements a 4-tier role hierarchy:

#### Role Permissions Matrix

| Feature Area | Flex_Admin | Finance_Manager | Counter_Agent | IT_Support |
|--------------|------------|-----------------|---------------|------------|
| **Dashboard** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **User Management** | ✅ Full | ❌ | ❌ | ✅ Full |
| **Passport Management** | ✅ Full | ✅ View Only | ✅ Full | ✅ View Only |
| **Individual Purchases** | ✅ Full | ❌ | ✅ Full | ❌ |
| **Corporate Vouchers** | ✅ Full | ✅ View | ✅ Create | ❌ |
| **Bulk Upload** | ✅ Full | ❌ | ✅ Full | ❌ |
| **Quotations** | ✅ Full | ✅ Full | ❌ | ❌ |
| **Invoices** | ✅ Full | ✅ Full | ❌ | ✅ View |
| **Reports** | ✅ All | ✅ All | ❌ | ✅ All |
| **Scan & Validate** | ✅ | ✅ | ✅ | ✅ |
| **Cash Reconciliation** | ✅ | ✅ | ✅ | ❌ |
| **Payment Modes** | ✅ | ❌ | ❌ | ❌ |
| **Email Templates** | ✅ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |
| **Login History** | ✅ | ❌ | ❌ | ✅ |

### Authorization Implementation

**Backend Middleware** (`backend/middleware/auth.js`)
```javascript
// JWT verification middleware
const auth = async (req, res, next) => {
  // Extract token from Authorization header
  // Verify JWT signature and expiration
  // Attach user to request object
  // Continue to route handler
}

// Role-based access control
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  }
}
```

**Frontend Route Protection** (`src/App.jsx`)
```javascript
<PrivateRoute roles={['Flex_Admin', 'Finance_Manager']}>
  <Quotations />
</PrivateRoute>
```

### Session Management

- **Token Storage**: Memory (React state) + localStorage for persistence
- **Token Expiration**: 24 hours
- **Auto-logout**: On token expiration or manual logout
- **Session Tracking**: Login events table records all login attempts
- **Security**: HttpOnly cookies option available for enhanced security

---

## Backend API Architecture

### API Structure

The backend follows RESTful conventions with Express.js:

```
backend/
├── server.js              # Express app initialization
├── config/
│   ├── database.js        # PostgreSQL connection pool
│   ├── emailConfig.js     # SMTP configuration
│   └── voucherConfig.js   # Voucher generation rules
├── middleware/
│   ├── auth.js            # JWT authentication & RBAC
│   ├── rateLimiter.js     # Rate limiting & abuse prevention
│   └── validator.js       # express-validator integration
├── routes/                # API endpoint definitions
├── services/              # Business logic layer
└── utils/                 # Helper functions
```

### API Endpoints Overview

#### Authentication Endpoints
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset-password
GET    /api/auth/verify-token
```

#### User Management
```
GET    /api/users              # List all users (Admin, IT_Support)
POST   /api/users              # Create user (Admin, IT_Support)
GET    /api/users/:id          # Get user details
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Deactivate user
PATCH  /api/users/:id/password # Change password
```

#### Passport Management
```
GET    /api/passports          # List passports (paginated)
POST   /api/passports          # Create passport
GET    /api/passports/:id      # Get passport details
PUT    /api/passports/:id      # Update passport
DELETE /api/passports/:id      # Delete passport
GET    /api/passports/search   # Search by passport number
```

#### Individual Purchases
```
GET    /api/individual-purchases        # List purchases
POST   /api/individual-purchases        # Create purchase
GET    /api/individual-purchases/:id    # Get purchase details
PATCH  /api/individual-purchases/:id/status  # Update status
POST   /api/individual-purchases/validate    # Validate voucher code
```

#### Corporate Vouchers
```
GET    /api/vouchers                    # List corporate vouchers
POST   /api/vouchers/batch              # Create batch of vouchers
GET    /api/vouchers/:code              # Get voucher by code
POST   /api/vouchers/validate           # Validate voucher
GET    /api/vouchers/batch/:batchId     # Get batch details
POST   /api/voucher-registration        # Register passport to voucher
```

#### Quotations & Invoices
```
GET    /api/quotations          # List quotations
POST   /api/quotations          # Create quotation
GET    /api/quotations/:id      # Get quotation
PUT    /api/quotations/:id      # Update quotation
PATCH  /api/quotations/:id/send # Send quotation to customer
POST   /api/quotations/:id/convert  # Convert to invoice

GET    /api/invoices            # List invoices
POST   /api/invoices            # Create invoice
GET    /api/invoices/:id        # Get invoice
PATCH  /api/invoices/:id/status # Mark as paid/cancelled
GET    /api/invoices/:id/pdf    # Download invoice PDF
```

#### Reports
```
GET    /api/transactions/reports/passports       # Passport report
GET    /api/transactions/reports/purchases       # Purchase report
GET    /api/transactions/reports/corporate       # Corporate vouchers report
GET    /api/transactions/reports/revenue         # Revenue report
GET    /api/transactions/reports/bulk-uploads    # Bulk upload report
GET    /api/transactions/reports/quotations      # Quotations report
GET    /api/transactions/reports/cash-reconciliation  # Cash reconciliation
```

#### Public Endpoints (No Auth Required)
```
POST   /api/public-purchases            # Public voucher purchase
GET    /api/public-purchases/:sessionId # Get purchase status
POST   /api/public-purchases/webhook    # Payment gateway webhook
GET    /api/buy-online/countries        # Get country list
POST   /api/buy-online/purchase         # Buy voucher online with passport
```

### Rate Limiting Strategy

```javascript
// Standard API rate limit
limiter: 100 requests per 15 minutes per IP

// Sensitive endpoints (login, voucher validation)
authLimiter: 5 requests per 15 minutes per IP

// Suspicious activity detection
suspiciousActivityDetector: 10 requests per minute per IP

// Public endpoints
publicLimiter: 50 requests per 15 minutes per IP
```

### Error Handling

Standard error response format:
```json
{
  "error": "Error message",
  "details": "Additional context (dev mode only)",
  "code": "ERROR_CODE"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

---

## Frontend Architecture

### Component Structure

```
src/
├── App.jsx                    # Main app, routing, auth provider
├── main.jsx                   # React entry point
├── index.css                  # Global styles, Tailwind imports
│
├── components/                # Reusable components
│   ├── MainLayout.jsx         # Main layout with sidebar/header
│   ├── RoleBasedRedirect.jsx  # Redirect based on user role
│   ├── Header.jsx             # App header
│   ├── Sidebar.jsx            # Navigation sidebar
│   ├── VoucherPrint.jsx       # Voucher print component
│   └── ui/                    # shadcn/ui components
│       ├── button.jsx
│       ├── dialog.jsx
│       ├── input.jsx
│       ├── table.jsx
│       └── ... (20+ components)
│
├── pages/                     # Route pages
│   ├── HomePage.jsx           # Public landing page
│   ├── Login.jsx              # Staff login
│   ├── Dashboard.jsx          # Main dashboard
│   ├── AgentLanding.jsx       # Counter agent landing
│   │
│   ├── Passports.jsx          # Passport list
│   ├── EditPassport.jsx       # Edit passport
│   ├── IndividualPurchase.jsx # Individual voucher purchase
│   ├── BulkPassportUpload.jsx # CSV bulk upload
│   │
│   ├── CorporateExitPass.jsx  # Corporate voucher creation
│   ├── CorporateVoucherRegistration.jsx  # Register passport to voucher
│   ├── CorporateBatchHistory.jsx         # Batch history
│   │
│   ├── Quotations.jsx         # Quotation list
│   ├── CreateQuotation.jsx    # Create quotation
│   ├── ViewQuotation.jsx      # View quotation
│   ├── Invoices.jsx           # Invoice management
│   │
│   ├── ScanAndValidate.jsx    # QR/Voucher scanning
│   ├── ScannerTest.jsx        # Hardware scanner testing
│   ├── CashReconciliation.jsx # Cash reconciliation
│   │
│   ├── Users.jsx              # User management
│   ├── Tickets.jsx            # Support tickets
│   ├── Reports.jsx            # Report dashboard
│   │
│   ├── admin/                 # Admin-only pages
│   │   ├── PaymentModes.jsx
│   │   ├── PaymentGatewaySettings.jsx
│   │   ├── EmailTemplates.jsx
│   │   ├── Customers.jsx
│   │   ├── SettingsRPC.jsx
│   │   ├── LoginHistory.jsx
│   │   └── SMSSettings.jsx
│   │
│   └── reports/               # Report pages
│       ├── PassportReports.jsx
│       ├── IndividualPurchaseReports.jsx
│       ├── CorporateVoucherReports.jsx
│       ├── RevenueGeneratedReports.jsx
│       ├── BulkPassportUploadReports.jsx
│       ├── QuotationsReports.jsx
│       └── RefundedReport.jsx
│
├── contexts/                  # React contexts
│   └── AuthContext.jsx        # Authentication state & methods
│
├── hooks/                     # Custom React hooks
│   └── useScannerInput.js     # Hardware scanner integration
│
└── lib/                       # Services & utilities
    ├── api/
    │   └── client.js          # Axios API client
    │
    ├── passportsService.js
    ├── individualPurchasesService.js
    ├── corporateVouchersService.js
    ├── quotationsService.js
    ├── invoiceService.js
    ├── usersService.js
    ├── reportsService.js
    ├── paymentGatewayService.js
    ├── paymentModesStorage.js
    ├── emailTemplatesService.js
    ├── ticketStorage.js
    ├── mrzParser.js           # Passport MRZ parser
    ├── scannerConfig.js       # Scanner hardware config
    └── utils.js
```

### State Management Architecture

**Authentication State** (React Context)
```javascript
AuthContext provides:
- user: { id, email, role, name }
- isAuthenticated: boolean
- loading: boolean
- login(email, password)
- logout()
```

**Local State Management**
- Individual components use `useState` for local UI state
- Form state managed by controlled components
- API data fetched on mount with `useEffect`

### Routing Strategy

**Route Protection Levels**
1. **Public Routes**: No authentication required
   - `/` - Home page
   - `/login` - Staff login
   - `/buy-online` - Public voucher purchase
   - `/register/:voucherCode` - Voucher registration

2. **Authenticated Routes**: Must be logged in
   - `/app/*` - All application routes

3. **Role-Based Routes**: Must have specific role
   - Wrapped with `<PrivateRoute roles={['role1', 'role2']}>`

**Code Splitting**
- Lazy loading for all page components
- Reduces initial bundle size
- Faster initial page load

```javascript
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Reports = lazy(() => import('@/pages/Reports'));
// ... etc
```

### UI Component Library (shadcn/ui)

Built on Radix UI primitives with Tailwind CSS:

**Form Components**
- Input, Textarea, Select, Checkbox, Radio, Switch, Slider

**Layout Components**
- Card, Sheet, Tabs, Accordion

**Overlay Components**
- Dialog, AlertDialog, DropdownMenu, Popover, Toast

**Data Display**
- Table, Badge, Avatar

**Feedback Components**
- Alert, Toast (Notification system)

---

## Key Features & Workflows

### 1. Individual Voucher Purchase Workflow

**User Story**: Counter agent processes individual customer at airport

```
1. Agent navigates to Passports → Create
2. Scans or enters passport details
   - MRZ scanning supported via USB scanner
   - Manual entry with validation
3. System validates passport data
4. Agent selects payment mode (Cash, Card, Bank Transfer)
5. System generates voucher with QR code
6. Voucher is printed and given to customer
7. Transaction recorded in database
8. Receipt email sent (if email provided)
```

**Technical Flow**:
```
Frontend: IndividualPurchase.jsx
    ↓
API: POST /api/individual-purchases
    ↓
Backend validates passport
    ↓
Generate unique voucher code (12 chars alphanumeric)
    ↓
Create QR code for voucher
    ↓
Insert records (passport, purchase, transaction)
    ↓
Return voucher details to frontend
    ↓
Frontend displays printable voucher
```

### 2. Corporate Bulk Voucher Workflow

**User Story**: Company purchases 50 vouchers for employee travel

```
1. Finance Manager creates quotation
   - Company details
   - Quantity: 50 vouchers
   - Price per voucher: PGK 100
   - Total: PGK 5,000 + 10% GST
2. Quotation sent to customer (email with PDF)
3. Customer approves (online or offline)
4. Counter Agent processes payment
5. System generates 50 vouchers in batch
6. Batch ZIP downloaded with:
   - Individual voucher PDFs (50 files)
   - Batch summary
7. Company distributes vouchers to employees
8. Employees register passports online
9. QR codes scanned at airport
```

**Technical Flow**:
```
Quotation Creation (Finance Manager)
    ↓
POST /api/quotations
    ↓
Send quotation email with PDF
    ↓
Payment Processing (Counter Agent)
    ↓
POST /api/vouchers/batch
    ↓
Generate 50 unique voucher codes
    ↓
Create individual QR codes
    ↓
Generate PDFs for each voucher
    ↓
Create ZIP archive
    ↓
Return download link
    ↓
Vouchers distributed to employees
    ↓
Employee Registration (Public Portal)
    ↓
POST /api/voucher-registration
    ↓
Link passport to voucher
    ↓
Validation at Airport
    ↓
POST /api/vouchers/validate
    ↓
Mark voucher as used
```

### 3. Bulk Passport Upload Workflow

**User Story**: Agent uploads 100 passports via CSV

```
1. Agent downloads CSV template
2. Fills template with passport data
   - Passport Number, Given Name, Surname, etc.
3. Uploads CSV file
4. System validates all rows
   - Duplicate checks
   - Data format validation
   - Required field checks
5. Shows preview with errors highlighted
6. Agent confirms import
7. System creates 100 passport records
8. Generates 100 vouchers
9. Bulk print or export
```

**CSV Format**:
```csv
PassportNumber,GivenName,Surname,Nationality,DateOfBirth,Gender,ExpiryDate
P1234567,John,Doe,PNG,1990-01-01,M,2030-12-31
P2345678,Jane,Smith,PNG,1985-05-15,F,2029-06-30
```

### 4. Scan & Validate Workflow

**User Story**: Airport staff validates voucher at exit gate

```
1. Staff opens Scan & Validate page
2. Scans QR code with USB scanner or webcam
3. System validates voucher:
   - Code exists
   - Not already used
   - Not expired
   - Linked passport matches (if applicable)
4. Shows validation result:
   - ✅ Valid: Display passenger details
   - ❌ Invalid: Show error reason
5. If valid, mark as used
6. Passenger allowed to exit
```

**Validation Rules**:
- Voucher code must exist
- Status must be 'paid', not 'used' or 'refunded'
- If linked to passport, passport must match
- Valid until date must be in future

### 5. Cash Reconciliation Workflow

**User Story**: Agent reconciles daily cash transactions

```
1. Agent opens Cash Reconciliation page
2. Selects date range (e.g., today)
3. System shows all cash transactions
4. Agent counts physical cash
5. Enters actual cash amount
6. System compares:
   - Expected: Sum of all cash transactions
   - Actual: Agent's physical count
   - Variance: Difference
7. Agent submits reconciliation report
8. Report saved with timestamp and agent ID
9. Finance Manager reviews discrepancies
```

### 6. Online Public Purchase Workflow

**User Story**: Customer buys voucher online before travel

```
1. Customer visits /buy-voucher
2. Enters passport details
3. Reviews purchase summary
4. Clicks "Pay Now"
5. Redirected to payment gateway (Stripe/Kina Bank)
6. Completes payment
7. Payment gateway sends webhook to backend
8. Backend creates voucher
9. Customer redirected to success page
10. Voucher PDF emailed to customer
11. Customer prints voucher
12. Presents QR code at airport
```

---

## Payment Integration

### Payment Gateway Architecture

```
Frontend → Backend → Payment Gateway → Webhook → Backend → Email
```

### Supported Payment Gateways

#### 1. Stripe (Testing/POC)
- **Status**: Implemented, Testing
- **Use Case**: Development and proof of concept
- **Features**: Credit card, digital wallets
- **API**: REST API with Checkout Sessions
- **Webhook**: POST /api/public-purchases/webhook

#### 2. Kina Bank Internet Payment Gateway
- **Status**: Configured, Ready for integration
- **Use Case**: Primary PNG payment gateway
- **Features**: Local bank cards, internet banking
- **API**: REST API (similar to Stripe)
- **Configuration**: Admin UI (`/app/admin/payment-gateway`)

#### 3. BSP Bank Payment Gateway
- **Status**: Planned
- **Use Case**: Alternative PNG payment gateway
- **Features**: BSP cards, internet banking

### Payment Flow (Stripe Example)

```javascript
// Frontend: Create payment session
const response = await fetch('/api/public-purchases', {
  method: 'POST',
  body: JSON.stringify({
    passport: passportData,
    amount: 100,
    currency: 'PGK'
  })
});
const { sessionId } = await response.json();

// Redirect to Stripe Checkout
window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;

// User completes payment on Stripe

// Stripe sends webhook to backend
POST /api/public-purchases/webhook
{
  event: 'checkout.session.completed',
  data: { sessionId: '...', ... }
}

// Backend processes webhook
// 1. Verify webhook signature
// 2. Validate payment status
// 3. Create voucher
// 4. Send email to customer
// 5. Return 200 OK to Stripe

// Customer redirected to success page
/purchase/callback?session_id=...

// Frontend fetches voucher details
GET /api/public-purchases/:sessionId

// Display voucher with download link
```

### Payment Security

- **PCI Compliance**: No credit card data stored on server
- **Webhook Verification**: Signature validation on all webhooks
- **SSL/TLS**: All payment endpoints use HTTPS
- **Rate Limiting**: Strict limits on payment endpoints
- **Idempotency**: Duplicate webhook handling

---

## Hardware Integration

### Scanner Support

The system integrates with USB/Bluetooth keyboard wedge scanners for:
- Passport MRZ scanning
- QR code voucher scanning
- Barcode scanning

### Scanner Types Supported

**Passport MRZ Scanners**
- Outputs 88-character ICAO MRZ format
- Two lines of 44 characters
- Detected by rapid keystroke pattern (50-100ms intervals)
- Auto-parsed into passport fields

**QR/Barcode Scanners**
- Generic USB/Bluetooth scanners
- Outputs voucher codes or URLs
- Configurable scan timeout and minimum length

### MRZ Parser Implementation

**MRZ Format (ICAO 9303)**
```
Line 1: P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES<<<<<<<<<
Line 2: PASSPORTNUMBER<NAT<DOBYYMMDDSEXEXPIRYYYMMDD<
```

**Parsed Fields**:
- Document Type (P = Passport)
- Issuing Country (3 letters)
- Surname
- Given Names
- Passport Number
- Nationality (3 letters)
- Date of Birth (YYMMDD)
- Gender (M/F/X)
- Expiry Date (YYMMDD)

**Parser Logic** (`src/lib/mrzParser.js`):
```javascript
function parseMRZ(mrzText) {
  // Split into two 44-char lines
  // Extract fixed-position fields
  // Convert dates from YYMMDD to YYYY-MM-DD
  // Replace < with spaces in names
  // Validate checksums
  // Return structured passport object
}
```

### Scanner Configuration

**Configuration Profiles** (`src/lib/scannerConfig.js`):
- Generic Scanner (default)
- Professional MRZ Scanner
- Budget Scanner
- Bluetooth Scanner
- Testing Profile

**Configurable Parameters**:
- `scanTimeout`: Time between keystrokes (default: 100ms)
- `minLength`: Minimum scan length (default: 5 chars)
- `enableMrzParsing`: Auto-parse MRZ (default: true)
- `suppressEnter`: Remove Enter key from scan (default: true)

### Scanner Test Page

**Route**: `/app/scanner-test`
**Access**: Flex_Admin, IT_Support, Counter_Agent

**Features**:
- Real-time scan detection
- Configuration adjustment
- MRZ parsing test
- Scan history with timestamps
- Performance metrics
- Sample MRZ data for testing

---

## Testing Strategy

### Test Pyramid

```
        /\
       /E2E\          77 Playwright tests
      /------\
     / Integ  \       API integration tests (manual)
    /----------\
   /   Unit     \     Service layer unit tests (future)
  /--------------\
```

### Playwright E2E Test Suite

**Test Organization**:
```
tests/
├── auth.setup.ts               # Auth setup for all roles
├── auth-flex-admin.setup.ts
├── auth-finance-manager.setup.ts
├── auth-counter-agent.setup.ts
├── auth-it-support.setup.ts
│
├── 00-authentication.spec.ts   # Login/logout tests
│
├── phase-1/                    # Core functionality
│   ├── 01-dashboard.spec.ts
│   ├── 02-individual-purchase.spec.ts
│   ├── 03-bulk-upload.spec.ts
│   ├── 04-corporate-vouchers.spec.ts
│   ├── 05-quotations.spec.ts
│   ├── 06-reports.spec.ts
│   └── 07-cash-reconciliation.spec.ts
│
├── phase-2/                    # User management
│   ├── 07-user-management.spec.ts
│   └── 08-passport-edit.spec.ts
│
├── phase-3/                    # Scanner integration
│   └── 09-qr-scanning.spec.ts
│
├── phase-4/                    # Admin features
│   └── 10-admin-settings.spec.ts
│
├── role-based/                 # RBAC tests
│   ├── rbac-access-control.spec.ts
│   ├── admin-complete-flow.spec.ts
│   ├── finance-manager-complete-flow.spec.ts
│   ├── counter-agent-complete-flow.spec.ts
│   └── it-support-complete-flow.spec.ts
│
├── integration/                # End-to-end workflows
│   ├── end-to-end-flow.spec.ts
│   └── reports-advanced.spec.ts
│
├── production/                 # Production smoke tests
│   ├── 01-authentication.smoke.spec.ts
│   ├── 03-individual-purchase.smoke.spec.ts
│   ├── 04-support-tickets.smoke.spec.ts
│   └── agent-landing-improvements.spec.ts
│
└── utils/
    └── helpers.ts              # Test utilities
```

**Test Count**: 77 test files

### Test Helpers

**Authentication Helpers**:
```typescript
// Setup authenticated session for each role
test.use({ storageState: 'playwright/.auth/user.json' });
```

**Validation Helpers**:
```typescript
waitForPageLoad(page, timeout)
checkConsoleErrors(page)
checkNetworkErrors(page)
checkDatabaseErrors(page)
```

### Test Execution

**Development Tests**:
```bash
npm run test                 # All tests
npm run test:ui              # UI mode
npm run test:headed          # Headed browser
npm run test:local           # Local server
```

**Production Tests**:
```bash
npm run test:production      # All production tests
npm run test:smoke           # Smoke tests only
npm run test:regression      # Regression tests
```

### Test Reports

**Formats**:
- HTML report: `playwright-report/index.html`
- JSON report: `test-results/results.json`
- Console output: Real-time progress

**Screenshot & Video Capture**:
- Screenshots: On failure only
- Videos: Retained on failure
- Traces: On first retry

### Test Coverage

**Covered Areas**:
✅ Authentication (all roles)
✅ Dashboard access
✅ Individual purchases
✅ Corporate vouchers
✅ Bulk uploads
✅ Quotations
✅ Reports
✅ User management
✅ RBAC enforcement
✅ Scanner integration
✅ Cash reconciliation

**Not Covered** (Manual Testing):
- Payment gateway integration
- Email delivery
- PDF generation quality
- Hardware scanner compatibility
- Printer integration

---

## Deployment & Infrastructure

### Production Environment

**Server Details**:
- **Domain**: greenpay.eywademo.cloud
- **Hosting**: VPS (Virtual Private Server)
- **OS**: Linux
- **Web Server**: Nginx (reverse proxy, SSL termination)
- **Process Manager**: PM2 (Node.js process management)

### Architecture Diagram

```
Internet
    │
    ▼
Nginx (Port 80/443) - SSL Termination
    │
    ├─► Frontend (Static files: /dist/)
    │
    └─► Backend API (Port 3001)
            │
            ▼
        PostgreSQL (Port 5432)
```

### Directory Structure (Production)

```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
├── index.html                 # Frontend entry point
├── assets/                    # Frontend build assets
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── backend/                   # Backend application
│   ├── routes/
│   ├── services/
│   ├── config/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   ├── .env                   # Backend environment variables
│   └── node_modules/
└── logs/                      # Application logs
```

### PM2 Configuration

**Process Name**: `greenpay-backend`

```bash
# Start backend
pm2 start backend/server.js --name greenpay-backend

# Process management
pm2 status                     # Check status
pm2 logs greenpay-backend      # View logs
pm2 restart greenpay-backend   # Restart
pm2 stop greenpay-backend      # Stop
pm2 delete greenpay-backend    # Remove

# Auto-start on reboot
pm2 startup
pm2 save
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name greenpay.eywademo.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name greenpay.eywademo.cloud;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Frontend (React SPA)
    location / {
        root /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deployment Scripts

#### Full Deployment
```bash
#!/bin/bash
# deploy-full.sh

echo "🚀 Starting full deployment..."

# 1. Build frontend
echo "📦 Building frontend..."
npm run build

# 2. Deploy frontend
echo "📤 Deploying frontend..."
rsync -avz --delete dist/ user@server:/path/to/frontend/

# 3. Deploy backend
echo "📤 Deploying backend..."
rsync -avz --exclude node_modules backend/ user@server:/path/to/backend/

# 4. Install backend dependencies
echo "📦 Installing backend dependencies..."
ssh user@server "cd /path/to/backend && npm install --production"

# 5. Restart backend
echo "🔄 Restarting backend..."
ssh user@server "pm2 restart greenpay-backend"

echo "✅ Deployment complete!"
```

#### Frontend Only
```bash
npm run build
./deploy-to-greenpay-server.sh
```

#### Backend Only
```bash
./deploy-backend.sh
```

### Environment Variables

**Frontend (.env)**:
```bash
VITE_API_URL=https://greenpay.eywademo.cloud/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_ADMIN_EMAIL=admin@greenpay.gov.pg
```

**Backend (backend/.env)**:
```bash
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=secure_password_here

# JWT
JWT_SECRET=your_jwt_secret_here

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@greenpay.gov.pg
SMTP_PASS=email_password_here

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
KINA_BANK_MERCHANT_ID=xxx
KINA_BANK_API_KEY=xxx

# CORS
ALLOWED_ORIGINS=https://greenpay.eywademo.cloud
```

### Database Backups

**Backup Strategy**:
```bash
# Daily automated backup
0 2 * * * pg_dump greenpay_db > /backups/greenpay_$(date +\%Y\%m\%d).sql

# Retention: 30 days
# Location: /backups/

# Restore command
psql greenpay_db < backup.sql
```

### Monitoring

**PM2 Monitoring**:
```bash
pm2 monit                      # Real-time monitoring
pm2 logs greenpay-backend      # Application logs
pm2 describe greenpay-backend  # Process details
```

**Log Files**:
- Application logs: PM2 manages logs
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`

---

## Security Considerations

### Authentication Security

✅ **Password Security**
- bcrypt hashing (10 rounds)
- No plain-text password storage
- Password minimum length enforced
- Failed login attempts tracked

✅ **JWT Security**
- Signed tokens (HS256 algorithm)
- Short expiration (24 hours)
- Secret key in environment variable
- Token validation on every request

✅ **Session Management**
- Login events logged (IP, user agent, timestamp)
- Failed login attempts tracked
- Account lockout on suspicious activity (via rate limiting)

### API Security

✅ **Rate Limiting**
- General API: 100 requests/15min/IP
- Authentication: 5 requests/15min/IP
- Public endpoints: 50 requests/15min/IP
- Suspicious activity detection: 10 requests/min/IP

✅ **Input Validation**
- express-validator on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection (same-origin policy)

✅ **CORS Configuration**
- Allowed origins whitelist
- Credentials support enabled
- Preflight request handling

✅ **HTTPS Enforcement**
- SSL/TLS certificates (Let's Encrypt)
- HTTP → HTTPS redirect
- Secure cookie flags available

### Data Security

✅ **Database Security**
- PostgreSQL user with limited permissions
- No root database access from app
- Connection pooling with timeouts
- SQL injection prevention (prepared statements)

✅ **Sensitive Data**
- Credit card data never stored (PCI compliance)
- Payment handled by third-party gateways
- Environment variables for secrets
- No secrets in code or version control

✅ **Audit Logging**
- Login events table
- Transaction history
- User action tracking (created_by, updated_by fields)

### Payment Security

✅ **PCI Compliance**
- No credit card data stored
- Payment data handled by gateway only
- Webhook signature verification
- HTTPS for all payment endpoints

✅ **Webhook Security**
- Signature verification on all webhooks
- Replay attack prevention
- Idempotency handling

### Application Security

✅ **Role-Based Access Control**
- All routes protected by role middleware
- Frontend and backend enforcement
- Least privilege principle

✅ **Error Handling**
- Generic error messages to users
- Detailed errors logged server-side
- No stack traces in production

✅ **Dependency Security**
- Regular npm audit
- Automated dependency updates
- Known vulnerability monitoring

### Deployment Security

✅ **Server Hardening**
- Firewall configured (UFW)
- SSH key authentication only
- Fail2ban for brute-force protection
- Regular security updates

✅ **Nginx Security**
- Security headers configured
- Request size limits
- Timeout configurations
- DDoS protection (rate limiting)

### Recommendations for Enhancement

🔶 **Future Security Improvements**:
1. Implement refresh tokens for JWT
2. Add two-factor authentication (2FA)
3. Implement Content Security Policy (CSP)
4. Add security headers (HSTS, X-Frame-Options)
5. Implement IP whitelisting for admin
6. Add encrypted database backups
7. Implement API key rotation
8. Add security audit logging
9. Implement intrusion detection
10. Add automated penetration testing

---

## Code Metrics

### Lines of Code

**Frontend**:
```
Total JavaScript/JSX: ~28,742 lines
├── Pages: ~15,000 lines (47 pages)
├── Components: ~8,000 lines (29 components)
├── Services: ~4,500 lines (25 service files)
└── Utilities: ~1,242 lines
```

**Backend**:
```
Total JavaScript: ~12,000 lines (estimated)
├── Routes: ~4,500 lines (16 route files)
├── Services: ~3,000 lines (3 service files)
├── Middleware: ~1,500 lines (3 middleware files)
├── Utilities: ~2,000 lines
└── Server: ~1,000 lines
```

**Tests**:
```
Total Test Files: 77 files
Total Test Lines: ~15,000 lines (estimated)
```

**Total Project Size**: ~55,742 lines of code

### File Counts

```
Frontend:
- Pages: 47 files
- Components: 29 files
- UI Components: 20+ files (shadcn/ui)
- Services: 25 files
- Total Frontend Files: ~150 files

Backend:
- Routes: 16 files
- Services: 3 files
- Middleware: 3 files
- Utilities: 5 files
- Config: 3 files
- Total Backend Files: ~35 files

Tests:
- Test Specs: 77 files
- Test Helpers: 5 files
- Page Objects: 10 files
- Total Test Files: ~92 files

Documentation:
- Markdown Files: 15+ files
- Total Documentation: ~15 files

Total Project Files: ~300+ files
```

### Dependencies

**Frontend Dependencies**: 30+
- React ecosystem: 5
- Radix UI components: 13
- Utilities: 12+

**Backend Dependencies**: 15
- Express ecosystem: 5
- PostgreSQL: 1
- Utilities: 9

**Dev Dependencies**: 15+
- Playwright: 1
- Build tools: 5+
- Testing utilities: 9+

### Component Complexity

**Most Complex Components** (by line count):
1. `paymentGatewayService.js` - 602 lines
2. `pwa-installer.js` - 342 lines
3. `gstUtils.js` - 197 lines
4. `mrzParser.js` - 199 lines
5. `invoiceService.js` - 196 lines

**Route Files** (Backend):
- Average: ~280 lines per route file
- Largest: `vouchers.js` (complex PDF generation)

---

## Appendices

### A. Database Connection Details

```javascript
// backend/config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,  // Max connections in pool
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});
```

### B. Voucher Code Generation

```javascript
// Format: XXXX-XXXX-XXXX (12 chars)
// Character set: A-Z, 0-9 (excluding ambiguous: 0, O, I, 1)
// Uniqueness: Database constraint + retry logic
// Example: A7K3-B2M9-C5N8
```

### C. Report Types

1. **Passport Report**: All passport records with filters
2. **Individual Purchase Report**: Single voucher purchases
3. **Corporate Voucher Report**: Batch voucher purchases
4. **Revenue Report**: Financial summary by period
5. **Bulk Upload Report**: CSV bulk upload history
6. **Quotation Report**: Quotation status and conversion
7. **Cash Reconciliation Report**: Daily cash transaction reconciliation
8. **Refunded Report**: All refunded transactions

### D. Key URLs

**Production**:
- Frontend: https://greenpay.eywademo.cloud
- API: https://greenpay.eywademo.cloud/api
- Staff Login: https://greenpay.eywademo.cloud/login
- Public Purchase: https://greenpay.eywademo.cloud/buy-voucher
- Voucher Registration: https://greenpay.eywademo.cloud/register/:code

**Development**:
- Frontend: http://localhost:3000
- API: http://localhost:3001

### E. Default User Roles

```
Role: Flex_Admin
- Full system access
- User management
- System configuration
- All reports

Role: Finance_Manager
- Quotations & invoices
- Financial reports
- Passport view only
- No user management

Role: Counter_Agent
- Passport management
- Voucher creation
- Bulk uploads
- Cash reconciliation

Role: IT_Support
- User management
- Technical support
- Reports access
- No financial operations
```

---

## Conclusion

The PNG Green Fees System is a comprehensive, production-ready application that successfully digitizes the Papua New Guinea government's passport-based green fee collection process. The system demonstrates:

✅ **Robust Architecture**: Separation of concerns, RESTful API, modern React frontend
✅ **Security First**: JWT authentication, RBAC, rate limiting, audit logging
✅ **Scalability**: Connection pooling, code splitting, optimized queries
✅ **User Experience**: Intuitive UI, role-based dashboards, hardware scanner support
✅ **Reliability**: Comprehensive testing (77 test files), error handling, logging
✅ **Maintainability**: Clear code structure, documentation, deployment automation

The system is currently deployed and operational at `greenpay.eywademo.cloud`, serving government staff and public customers for airport exit fee collection in Papua New Guinea.

---

**Document Information**

- **Created**: December 15, 2024
- **Author**: System Analysis
- **Version**: 1.0
- **Status**: Production
- **Next Review**: Q1 2025

---
