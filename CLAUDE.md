# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PNG Green Fees System - A React-based government application for managing passport-based green fee vouchers and payments in Papua New Guinea. The application handles individual and corporate passport purchases, quotations, payments, and reporting with role-based access control.

## Development Commands

```bash
# Start development server on port 3000 with IPv6
npm run dev

# Build production bundle
npm run build

# Preview production build locally on port 3000
npm run preview
```

## Deployment

The application is deployed on a VPS using PM2 and Nginx:

- **Build location**: `/var/www/png-green-fees/dist`
- **PM2 app name**: `png-green-fees`
- **Server port**: 3000 (served via Vite preview mode)
- **Domain**: eywademo.cloud with SSL

Deployment commands:
```bash
# Quick deployment (uses deploy.sh script)
./deploy.sh

# Update existing deployment
./update.sh

# PM2 process management
pm2 status
pm2 logs png-green-fees
pm2 restart png-green-fees
```

## Architecture

### Frontend Stack
- **Framework**: React 18 with React Router 6.16.0
- **Build tool**: Vite 4
- **Styling**: Tailwind CSS with shadcn/ui components (Radix UI)
- **Backend**: Supabase (authentication and database)
- **Animations**: Framer Motion
- **State**: React Context API for authentication

### Authentication System

The app now uses **Supabase Authentication**:
- **AuthContext** (`src/contexts/AuthContext.jsx`) - Supabase-based authentication (active)
- User profiles are stored in the `profiles` table linked to Supabase Auth
- Session management handled by Supabase Auth
- Legacy mock authentication (`authData.js`) kept for reference only

### Role-Based Access Control

Four user roles with different permissions:
- **Flex_Admin**: Full system access (users, admin settings, all features)
- **Counter_Agent**: Passport purchases, bulk uploads, payments
- **Finance_Manager**: Quotations, reports, passports (view only)
- **IT_Support**: User management, reports, scan/validate

Routes are protected using `<PrivateRoute roles={['role1', 'role2']}>` wrapper in `src/App.jsx`.

### Directory Structure

```
src/
├── components/          # Reusable components (Header, Dashboard, Ticket management)
│   └── ui/             # shadcn/ui components (buttons, dialogs, forms, etc.)
├── contexts/           # React contexts (AuthContext, SupabaseAuthContext)
├── lib/                # Utilities and data access
│   ├── supabaseClient.js                 # Supabase client instance
│   ├── passportsService.js               # Passport operations
│   ├── individualPurchasesService.js     # Individual purchases
│   ├── corporateVouchersService.js       # Corporate vouchers
│   ├── quotationsService.js              # Quotations
│   ├── usersService.js                   # User management
│   ├── bulkUploadsService.js             # Bulk uploads
│   ├── reportsService.js                 # Reports & analytics
│   ├── paymentModesStorage.js            # Payment modes (Supabase)
│   ├── ticketStorage.js                  # Tickets (Supabase)
│   ├── authData.js                       # Legacy mock data (reference)
│   └── *Data.js                          # Legacy mock data (reference)
├── pages/              # Route pages
│   ├── admin/          # Admin-only pages (PaymentModes, EmailTemplates)
│   └── reports/        # Reporting pages (6 different report types)
└── App.jsx             # Router configuration with role-based routes
```

### Key Pages & Features

**Purchase Management:**
- Individual passport purchases (`IndividualPurchase.jsx`)
- Bulk passport uploads via CSV (`BulkPassportUpload.jsx`)
- Corporate exit passes (`CorporateExitPass.jsx`)
- Offline template generation and upload

**Financial:**
- Quotations management (`Quotations.jsx`, `CreateQuotation.jsx`)
- Payment processing (`Payments.jsx`)
- Multiple payment modes configuration

**Reporting:**
- 6 report types: Passports, Individual Purchase, Corporate Vouchers, Revenue, Bulk Uploads, Quotations
- All reports restricted to Flex_Admin, Finance_Manager, IT_Support roles

**Administration:**
- User management (`Users.jsx`)
- Payment modes configuration
- Email templates management
- QR code scanning and validation (`ScanAndValidate.jsx`)

### Database & Backend (Supabase)

The application uses **Supabase** as the backend:

**Setup:**
1. Run `supabase-schema.sql` in Supabase SQL Editor to create all tables
2. Copy `.env.example` to `.env` and configure your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. See `SUPABASE_SETUP.md` for complete setup instructions

**Database Tables:**
- `profiles` - User accounts with roles (linked to Supabase Auth)
- `passports` - Passport records
- `individual_purchases` - Individual voucher purchases
- `corporate_vouchers` - Corporate vouchers
- `quotations` - Quotation management
- `bulk_uploads` - Bulk upload tracking
- `payment_modes` - Payment methods
- `tickets` - Support tickets
- `email_templates` - Email templates
- `transactions` - Transaction history for reporting

**Data Access Layer:**
All database operations go through service files in `src/lib/`:
- `passportsService.js` - Passport CRUD operations
- `individualPurchasesService.js` - Individual purchases & voucher validation
- `corporateVouchersService.js` - Corporate voucher management
- `quotationsService.js` - Quotation operations
- `usersService.js` - User/profile management
- `bulkUploadsService.js` - Bulk upload processing
- `reportsService.js` - Reporting and analytics
- `paymentModesStorage.js` - Payment mode management
- `ticketStorage.js` - Ticket system

**Row Level Security (RLS):**
All tables have RLS policies enforcing role-based access control at the database level.

### Vite Configuration

The app includes custom Vite plugins for development:
- **visual-editor plugins**: Inline editing capabilities (dev only)
- **iframe-route-restoration**: Route persistence in iframe contexts
- **Error handlers**: Custom overlays for Vite/runtime/console errors

Path alias configured: `@` → `./src`

### UI Components

Built with shadcn/ui (Radix UI primitives + Tailwind):
- Forms: Label, Input, Checkbox, RadioGroup, Switch, Slider
- Overlays: Dialog, AlertDialog, DropdownMenu, Toast
- Data: Avatar, Tabs, DataTable
- All use CSS variables from `src/index.css` for theming

### Styling System

Tailwind configured with custom theme in `tailwind.config.js`:
- Dark mode support (class-based)
- Custom color palette using CSS variables
- shadcn/ui animations (accordion, etc.)
- Responsive breakpoints

## Hardware Scanner Integration

The application supports **USB keyboard wedge scanners** for passport MRZ and QR/barcode scanning:

### Scanner Infrastructure
- **`src/hooks/useScannerInput.js`** - React hook for detecting and processing scanner input
- **`src/lib/mrzParser.js`** - ICAO-compliant MRZ (Machine Readable Zone) parser
- **`src/components/ScannerInput.jsx`** - Reusable input component with scanner support
- **`src/lib/scannerConfig.js`** - Scanner hardware configuration and profiles

### How It Works
- USB keyboard wedge scanners act as keyboards (no drivers needed)
- Hook detects rapid keystroke patterns (50-100ms between chars)
- Automatically parses MRZ format (88 characters from passport)
- Supports simple barcode/QR codes and voucher codes
- Visual feedback with scanning animations and success indicators

### Scanner Test Page
- **Route:** `/scanner-test` (Flex_Admin, IT_Support, Counter_Agent roles)
- **Component:** `src/pages/ScannerTest.jsx`
- Interactive testing interface for scanner hardware
- Real-time configuration adjustment
- Scan history with performance metrics
- Sample MRZ data for manual testing

### Usage in Pages
Scanner support is available in:
- `ScanAndValidate.jsx` - QR/Voucher validation (existing, ready for upgrade)
- `IndividualPurchase.jsx` - Passport purchase (existing paste listener, ready for upgrade)
- `CreatePassport.jsx` - Manual passport entry (ready for scanner integration)
- `PublicRegistration.jsx` - Customer portal (ready for scanner integration)

### Configuration
Adjust scanner settings in `src/lib/scannerConfig.js`:
- `scanTimeout` - Time between keystrokes (default: 100ms)
- `minLength` - Minimum characters for valid scan (default: 5)
- `enableMrzParsing` - Auto-parse passport MRZ (default: true)
- Multiple profiles: generic, professional, budget, bluetooth, testing

### Hardware Requirements
- **Passport Scanner:** USB keyboard wedge, outputs 88-char MRZ
- **QR/Barcode Scanner:** USB or Bluetooth keyboard wedge
- **No special drivers required** - devices act as standard keyboards
- Compatible with all modern browsers (uses keyboard events)

### MRZ Format
Standard ICAO Document 9303 format (2 lines × 44 characters):
```
P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES<<<<<<<<<
PASSPORTNUMBER<NAT<DOBYYMMDDSEXEXPIRYYYMMDD<
```

## Development Notes

- All components use `.jsx` extension
- Import paths use `@/` alias for src directory
- **Database Migration Complete**: Application now fully uses Supabase for all data
- Legacy mock data files (`*Data.js`) kept for reference only
- Authentication managed by Supabase Auth with session persistence
- All CRUD operations use service files that interact with Supabase

## Testing

- `src/lib/testSupabase.js` - Auto-runs in dev mode to verify Supabase connection
- Check browser console for connection test results
- Ensure all tables are created before testing (run `supabase-schema.sql`)
- **Scanner Testing:** Visit `/scanner-test` to test hardware scanners before deployment
