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

The app uses dual authentication contexts:
1. **AuthContext** (`src/contexts/AuthContext.jsx`) - Mock authentication with localStorage (currently active)
2. **SupabaseAuthContext** (`src/contexts/SupabaseAuthContext.jsx`) - Supabase-based authentication (available)

Authentication is configured in `src/main.jsx` where you can switch between contexts.

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
│   ├── supabaseClient.js          # Supabase client instance
│   ├── customSupabaseClient.js    # Custom Supabase wrapper
│   ├── authData.js                # Mock user data
│   ├── *Storage.js                # Local storage utilities
│   └── *Data.js                   # Data fetch/validation utilities
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

### Environment Variables

Required for Supabase integration (in `.env.local` or `.env.production`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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

## Development Notes

- All components use `.jsx` extension
- Import paths use `@/` alias for src directory
- Authentication state persists in localStorage as `png_user`
- Mock user credentials are in `src/lib/authData.js`
- The app is designed for both online (Supabase) and offline (localStorage) operation modes
