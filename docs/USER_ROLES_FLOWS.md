# PNG Green Fees System - User Roles & Workflows

## System Overview
PNG Green Fees System manages passport-based green fee vouchers and payments with 4 distinct user roles.

---

## 1. FLEX ADMIN (Super Administrator)

### Access Level: FULL SYSTEM ACCESS

### Login Flow
1. Navigate to https://greenpay.eywademo.cloud/login
2. Enter email and password
3. Upon successful login → Redirect to `/app/dashboard`

### Available Features

#### Dashboard (`/app/dashboard`)
- View system statistics
- Quick access to all modules
- Recent transactions overview

#### User Management (`/app/users`)
- **Create users** (all 4 roles: Flex_Admin, Counter_Agent, Finance_Manager, IT_Support)
- **Edit users** (update role, email, password)
- **Delete users**
- **View login history** (`/app/admin/login-history`)

#### Passport Management (`/app/passports`)
- **Search passports** by number, name, nationality
- **Create new passport** (manual entry)
- **Scan passport** (MRZ camera scanner)
- **Edit passport** details
- **View vouchers** associated with passport (shows all individual + corporate vouchers with dates, payments, status)
- **Bulk passport upload** via CSV (`/app/passports/bulk-upload`)

#### Individual Purchases (`/app/passports/create`)
- Create individual voucher purchase for walk-in customers
- Enter passport details
- Process payment (Cash, Credit Card, EFT)
- Generate voucher code
- Print/email voucher

#### Corporate Vouchers

**Create Exit Pass** (`/app/payments/corporate-exit-pass`)
- Generate vouchers for corporate batch
- Upload passport list (CSV/Excel)
- Create quotation
- Generate invoice
- Issue vouchers

**Batch History** (`/app/payments/corporate-batch-history`)
- View all corporate batches
- Filter by company, date, status
- Download batch vouchers (ZIP with PDFs)
- Email batch to company

**Voucher Registration** (`/voucher-registration` - public page)
- Register passport number to corporate voucher code
- Validates voucher exists and not yet registered
- Updates voucher with passport info

#### Quotations (`/app/quotations`)
- **Create quotation** for corporate customers
- **View all quotations**
- **Edit quotation** (if not yet approved)
- **Convert to invoice**
- **Email quotation** to customer

#### Invoices (`/app/invoices`)
- **View all invoices**
- **Generate GST invoice** (tax calculations)
- **Download invoice PDF**
- **Email invoice** to customer
- **Mark as paid**

#### Payments (`/app/payments`)
- View all payment transactions
- Filter by payment method, date, status
- Process refunds
- Reconcile payments

#### Cash Reconciliation (`/app/cash-reconciliation`)
- Daily cash count
- Compare expected vs actual cash
- Record discrepancies
- Generate reconciliation report

#### Reports (`/app/reports`)
Access to ALL reports:
- **Passport Reports** (`/app/reports/passports`)
- **Individual Purchase Reports** (`/app/reports/individual-purchase`)
- **Corporate Voucher Reports** (`/app/reports/corporate-vouchers`)
- **Revenue Generated Reports** (`/app/reports/revenue-generated`)
- **Bulk Upload Reports** (`/app/reports/bulk-passport-uploads`)
- **Quotations Reports** (`/app/reports/quotations`)
- **Refunded Reports** (`/app/reports/refunded`)
- Export to PDF/Excel

#### Settings & Configuration

**Customers** (`/app/admin/customers`)
- Manage corporate customer accounts
- Add/edit company details
- View purchase history

**Payment Modes** (`/app/admin/payment-modes`)
- Configure accepted payment methods
- Enable/disable payment options
- Set payment gateway settings

**Payment Gateway** (`/app/admin/payment-gateway`)
- Configure BSP/Credit card gateway
- Test gateway connection
- View gateway logs

**Email Templates** (`/app/admin/email-templates`)
- Customize voucher email templates
- Preview templates
- Set default sender

**System Settings** (`/app/admin/settings`)
- Configure voucher pricing
- Set validity periods
- System-wide configurations

**SMS Settings** (`/app/admin/sms-settings`)
- Configure SMS gateway
- Set SMS templates
- View SMS logs

#### Voucher Validation (`/app/scan`)
- **Scan voucher barcode** (USB scanner or phone camera)
- **Manual entry** of voucher code
- **Validate voucher** (checks status: active/used/expired/pending)
- **Auto-mark as used** when validated
- **Audio/visual feedback** (green flash + beep for valid, red flash + alert for invalid)

#### Vouchers List (`/app/vouchers-list`)
- View all vouchers (individual + corporate)
- Filter by status, type, date
- Search by voucher code, passport number
- Export list

---

## 2. COUNTER AGENT (Front Desk Staff)

### Access Level: CUSTOMER-FACING OPERATIONS

### Login Flow
1. Navigate to https://greenpay.eywademo.cloud/login
2. Enter email and password
3. Upon successful login → Redirect to `/app/agent` (Agent Landing Page)

### Agent Landing Page (`/app/agent`)
Streamlined interface with quick access tiles:
- **Individual Purchase** → Create voucher for walk-in customer
- **Scan & Validate** → Validate voucher at exit
- **Passports** → Search passport database
- **Bulk Upload** → Upload multiple passports
- **Cash Reconciliation** → End-of-day cash count

### Available Features

#### Passport Management (`/app/passports`)
- **Search passports**
- **Create new passport**
- **Scan passport** (MRZ camera)
- **Edit passport**
- **View vouchers** for passport
- **Bulk upload** (`/app/passports/bulk-upload`)

#### Individual Purchases (`/app/passports/create`)
- Create voucher for walk-in customer
- Enter passport details (or scan)
- Select payment method
- Process payment
- Print voucher
- Email voucher (if email provided)

#### Corporate Exit Pass (`/app/payments/corporate-exit-pass`)
- Create corporate batch
- Upload passport list
- Generate vouchers

#### Voucher Validation (`/app/scan`)
**PRIMARY FUNCTION for Counter Agents**
- Scan voucher at airport exit
- Validate if active/used/expired
- Mark as used when validated
- Fast workflow for high-volume processing

#### Scanner Testing (`/app/scanner-test`)
- Test USB/Bluetooth barcode scanner
- Test camera scanner
- Verify scanner configuration

#### Cash Reconciliation (`/app/cash-reconciliation`)
- End-of-day cash counting
- Record cash received
- Compare with system total
- Submit reconciliation

#### Offline Operations
**Template Download** (`/app/payments/offline-template`)
- Download Excel template for offline sales

**Offline Upload** (`/app/payments/offline-upload`)
- Upload completed offline sales
- Bulk process offline transactions

### CANNOT ACCESS
- ❌ User management
- ❌ System settings
- ❌ Payment gateway configuration
- ❌ SMS settings
- ❌ Delete operations (limited edit)
- ❌ Quotations (view only, cannot create)

---

## 3. FINANCE MANAGER (Financial Operations)

### Access Level: FINANCIAL & REPORTING

### Login Flow
1. Navigate to https://greenpay.eywademo.cloud/login
2. Enter email and password
3. Upon successful login → Redirect to `/app/dashboard`

### Available Features

#### Passports (VIEW ONLY) (`/app/passports`)
- **Search passports**
- **View passport details**
- **View vouchers** for passport
- **CANNOT create/edit passports**

#### Individual Purchases (CREATE) (`/app/passports/create`)
- Can create individual purchases
- Process payments
- Generate vouchers

#### Quotations (FULL ACCESS) (`/app/quotations`)
**PRIMARY FUNCTION for Finance Managers**
- **Create quotations** for corporate customers
- **Edit quotations**
- **Approve quotations**
- **Convert to invoices**
- **Email quotations**
- **View quotation history**

#### Invoices (FULL ACCESS) (`/app/invoices`)
- **View all invoices**
- **Generate GST invoices**
- **Download invoice PDFs**
- **Email invoices**
- **Mark as paid/unpaid**
- **Process refunds**

#### Corporate Vouchers

**Batch History** (`/app/payments/corporate-batch-history`)
- View all corporate batches
- Download batch vouchers
- Email batches
- Track payment status

**Corporate Exit Pass** (`/app/payments/corporate-exit-pass`)
- Create corporate voucher batches
- Upload passport lists
- Generate invoices

#### Payments (`/app/payments`)
- View all transactions
- Filter and search
- Export payment reports

#### Reports (FULL ACCESS) (`/app/reports`)
**PRIMARY FUNCTION - All financial reports:**
- Passport Reports
- Individual Purchase Reports
- Corporate Voucher Reports
- Revenue Generated Reports
- Bulk Upload Reports
- Quotations Reports
- Refunded Reports
- Cash Reconciliation Reports
- Export to PDF/Excel

#### Customers (`/app/admin/customers`)
- View customer accounts
- Add/edit customer details
- View purchase history

#### Voucher Validation (`/app/scan`)
- Scan and validate vouchers
- Mark as used

#### Cash Reconciliation (`/app/cash-reconciliation`)
- View all reconciliation records
- Verify Counter Agent submissions
- Identify discrepancies

#### Vouchers List (`/app/vouchers-list`)
- View all vouchers
- Filter and export

### CANNOT ACCESS
- ❌ User management
- ❌ System settings
- ❌ Payment gateway configuration
- ❌ Email templates
- ❌ SMS settings
- ❌ Payment modes
- ❌ Bulk passport upload
- ❌ Edit passports

---

## 4. IT SUPPORT (Technical Support)

### Access Level: TECHNICAL & SUPPORT

### Login Flow
1. Navigate to https://greenpay.eywademo.cloud/login
2. Enter email and password
3. Upon successful login → Redirect to `/app/dashboard`

### Available Features

#### User Management (`/app/users`)
**PRIMARY FUNCTION for IT Support**
- **Create users** (all roles)
- **Edit users**
- **Reset passwords**
- **View login history** (`/app/admin/login-history`)
- Troubleshoot user access issues

#### Login History (`/app/admin/login-history`)
- View all user login attempts
- Track successful/failed logins
- Identify security issues
- Monitor user activity

#### Reports (VIEW ONLY) (`/app/reports`)
- Access all reports for troubleshooting
- Cannot modify data
- Export for analysis

#### Scanner Testing

**MRZ Scanner Test** (`/app/mrz-scanner-test`)
- Test passport MRZ scanning
- Verify OCR accuracy
- Debug scanner issues

**Tesseract Scanner Test** (`/app/tesseract-scanner-test`)
- Test alternative OCR engine
- Compare accuracy

**Scanner Test** (`/app/scanner-test`)
- Test USB barcode scanners
- Test Bluetooth scanners
- Configure scanner settings

#### Voucher Validation (`/app/scan`)
- Test voucher scanning
- Verify validation logic
- Debug scanning issues

#### Vouchers List (`/app/vouchers-list`)
- View all vouchers for troubleshooting
- Search by code/passport
- Verify data integrity

#### Corporate Batch History (`/app/corporate-batch-history`)
- View batch processing logs
- Troubleshoot batch issues

#### Invoices (VIEW) (`/app/invoices`)
- View invoices for support tickets
- Cannot modify

### CANNOT ACCESS
- ❌ Create/edit passports
- ❌ Create purchases
- ❌ Process payments
- ❌ Create quotations
- ❌ System settings (view only)
- ❌ Payment gateway configuration
- ❌ Email templates
- ❌ SMS settings
- ❌ Financial operations

---

## Access Control Matrix

| Feature | Flex Admin | Counter Agent | Finance Manager | IT Support |
|---------|------------|---------------|-----------------|------------|
| **Dashboard** | ✅ Full | ✅ Limited | ✅ Full | ✅ Full |
| **Users** | ✅ Full | ❌ | ❌ | ✅ Full |
| **Passports - Create/Edit** | ✅ | ✅ | ❌ View only | ❌ |
| **Passports - View/Search** | ✅ | ✅ | ✅ | ❌ |
| **Passports - View Vouchers** | ✅ | ✅ | ✅ | ✅ |
| **Bulk Upload** | ✅ | ✅ | ❌ | ❌ |
| **Individual Purchase** | ✅ | ✅ | ✅ | ❌ |
| **Corporate Exit Pass** | ✅ | ✅ | ✅ | ❌ |
| **Batch History** | ✅ | ❌ | ✅ | ✅ View |
| **Quotations** | ✅ | ❌ | ✅ Full | ❌ |
| **Invoices** | ✅ | ❌ | ✅ Full | ✅ View |
| **Payments** | ✅ | ❌ | ✅ | ❌ |
| **Scan & Validate** | ✅ | ✅ PRIMARY | ✅ | ✅ Test |
| **Cash Reconciliation** | ✅ | ✅ | ✅ View | ❌ |
| **Reports** | ✅ All | ❌ | ✅ All | ✅ View |
| **Customers** | ✅ | ❌ | ✅ | ❌ |
| **Payment Modes** | ✅ | ❌ | ❌ | ❌ |
| **Payment Gateway** | ✅ | ❌ | ❌ | ❌ |
| **Email Templates** | ✅ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |
| **SMS Settings** | ✅ | ❌ | ❌ | ❌ |
| **Login History** | ✅ | ❌ | ❌ | ✅ |
| **Scanner Tests** | ✅ | ✅ | ❌ | ✅ |
| **Vouchers List** | ✅ | ✅ | ✅ | ✅ |

---

## Typical User Workflows

### Counter Agent Daily Workflow
```
1. Login at 8:00 AM → Agent Landing Page
2. Check scanner functionality (scanner-test)
3. Process walk-in customers:
   - Scan passport MRZ
   - Create individual purchase
   - Accept payment (cash/card)
   - Print/email voucher
4. At airport exit gate:
   - Scan voucher barcodes
   - Validate and mark as used
   - Handle expired/invalid vouchers
5. End of day (5:00 PM):
   - Count cash
   - Submit cash reconciliation
   - Logout
```

### Finance Manager Daily Workflow
```
1. Login at 9:00 AM → Dashboard
2. Review pending quotations
3. Create quotations for new corporate inquiries
4. Convert approved quotations to invoices
5. Generate and email invoices
6. Process payment confirmations
7. Run daily reports:
   - Revenue generated report
   - Corporate vouchers report
   - Payment transactions
8. Review cash reconciliation submissions
9. Export financial data for accounting system
10. Logout
```

### IT Support Daily Workflow
```
1. Login at 8:00 AM → Dashboard
2. Check login history for failed attempts
3. Respond to support tickets:
   - Reset user passwords
   - Troubleshoot scanner issues
   - Test MRZ scanner accuracy
   - Verify voucher validation logic
4. Create new user accounts as requested
5. Run diagnostic tests on scanners
6. Export voucher list for data verification
7. Monitor system logs
8. Logout
```

### Flex Admin Weekly Workflow
```
1. Review system statistics (dashboard)
2. User management:
   - Create/edit user accounts
   - Review login history
   - Adjust user permissions
3. System configuration:
   - Update voucher pricing
   - Configure payment modes
   - Customize email templates
   - Set system-wide settings
4. Financial oversight:
   - Review all reports
   - Process refunds
   - Verify payment gateway
5. Corporate customer management:
   - Add new corporate customers
   - Review corporate batch history
   - Email batch vouchers
6. Quality control:
   - Review passport data quality
   - Check voucher validation accuracy
   - Monitor cash reconciliation
```

---

## Public (No Login Required)

### Public Purchase (`/buy-voucher`)
- Customer can purchase individual voucher online
- Enter passport details
- Pay via credit card (BSP gateway)
- Receive voucher via email
- Download voucher PDF

### Voucher Registration (`/voucher-registration`)
- Corporate voucher holders register passport number
- Enter voucher code + passport number
- System validates and links passport to voucher

### Public Pages
- `/` - Homepage
- `/terms` - Terms & Conditions
- `/privacy` - Privacy Policy
- `/refunds` - Refund Policy

---

## Security Notes

1. **Session Management**: All authenticated routes require active session
2. **Role Enforcement**: Routes check user role via middleware
3. **RBAC**: Row-level security in database enforces role permissions
4. **Password Security**: Bcrypt hashing, minimum complexity requirements
5. **Rate Limiting**: Voucher validation endpoint has rate limiting to prevent brute force
6. **Audit Trail**: All actions logged with user ID and timestamp
7. **HTTPS Required**: Camera scanning requires secure context

---

## Mobile Optimization

- **Counter Agent**: Primary mobile user (scan vouchers on phone)
- **Camera Scanner**: Optimized for mobile browsers (iOS/Android)
- **Responsive UI**: All pages mobile-friendly
- **Touch Targets**: Large buttons for touch interaction

---

## Support Contacts

- **Technical Issues**: IT Support role users
- **Financial Queries**: Finance Manager role users
- **User Access**: Flex Admin or IT Support
- **System Configuration**: Flex Admin only
