# GreenPay Role-Based Workflow & Access Control
**Date**: January 21, 2026
**Status**: ✅ Complete System Documentation

---

## System Overview

GreenPay has **4 active user roles** with distinct responsibilities and access levels:

1. **Counter_Agent** - Airport kiosk operations
2. **Flex_Admin** - Full system access (superuser)
3. **Finance_Manager** - Financial oversight and reporting
4. **IT_Support** - Technical support and user management

---

## Role Access Matrix

### Counter_Agent (roleId: 8)
**Primary Location**: Airport kiosk with Epson TM-T82II thermal printer

**Equipment**:
- Desktop/kiosk computer
- Epson TM-T82II thermal printer (80mm)
- CheckIn KB with MRZ reader (USB keyboard wedge)
- Cash drawer or POS terminal (external)

**Access**:
- ✅ Dashboard
- ✅ Agent Landing page
- ✅ Individual Purchase (create vouchers)
- ✅ Bulk Passport Upload
- ✅ Passport management
- ✅ Voucher registration
- ✅ Thermal printer bulk printing
- ✅ Corporate Exit Pass
- ✅ Offline template/upload
- ✅ Cash reconciliation
- ✅ Voucher list
- ✅ Scanner testing
- ❌ User management
- ❌ System settings
- ❌ Quotations
- ❌ Full reports (only cash reconciliation)

**Primary Workflow** (Airport Kiosk):
```
1. Customer arrives at kiosk
2. Agent: Create X vouchers in system
3. Customer: Pays cash or card (outside system)
4. Agent: Register payment in system
5. System: Generates vouchers, auto-starts wizard
6. Agent: Scans passports with MRZ reader
7. System: Auto-registers each passport → advances
8. After last scan: Completion screen
9. Agent: Click "🖨️ Print All to Thermal Printer"
10. Epson TM-T82II: Prints all vouchers
11. Agent: Hands thermal receipts to customer
```

---

### Flex_Admin (roleId: 6)
**Primary Location**: Office/anywhere

**Equipment**:
- Any computer/device
- Access to all hardware if needed

**Access**:
- ✅ **Everything Counter_Agent has**
- ✅ **Everything Finance_Manager has**
- ✅ **Everything IT_Support has**
- ✅ **PLUS unique admin features**:
  - Payment modes configuration
  - Payment gateway settings
  - Email templates management
  - System settings (RPC)
  - SMS settings

**Unique Capabilities**:
- Full system configuration
- All user management
- All reports
- All financial operations
- All counter operations
- All technical operations

**Role**: Superuser with complete system access

---

### Finance_Manager (roleId: 7)
**Primary Location**: Office

**Access**:
- ✅ Dashboard
- ✅ Passports (view only)
- ✅ Individual Purchase (view/create)
- ✅ Voucher list
- ✅ Corporate Exit Pass
- ✅ Cash reconciliation
- ✅ Quotations (create/view/edit)
- ✅ Invoices
- ✅ Payments
- ✅ All Reports:
  - Passport reports
  - Individual purchase reports
  - Corporate voucher reports
  - Revenue generated reports
  - Bulk upload reports
  - Quotations reports
  - Refunded reports
- ✅ Customers management
- ✅ Corporate batch history
- ❌ User management
- ❌ System settings
- ❌ Hardware scanners
- ❌ Bulk passport uploads

**Primary Responsibilities**:
- Financial reporting and analysis
- Quotation management
- Invoice oversight
- Revenue tracking
- Customer relationship management

---

### IT_Support (roleId: 5)
**Primary Location**: Office/technical room

**Access**:
- ✅ Dashboard
- ✅ User management (with Flex_Admin)
- ✅ Voucher list
- ✅ All Reports (same as Finance_Manager)
- ✅ Scanner testing
- ✅ MRZ scanner testing
- ✅ Tesseract scanner testing
- ✅ PrehKeyTec debugging
- ✅ Login history
- ✅ Invoices
- ✅ Corporate batch history
- ❌ Payment configuration
- ❌ System settings
- ❌ Quotations
- ❌ Payments
- ❌ Individual purchase creation

**Primary Responsibilities**:
- Technical support
- User account management
- Scanner/hardware troubleshooting
- System diagnostics
- Login monitoring

---

## Complete Voucher Lifecycle

### 1. Voucher Creation (Airport Kiosk)
**Roles**: Counter_Agent, Flex_Admin

```
┌─────────────────────────────────────────┐
│ AIRPORT KIOSK - COUNTER AGENT           │
├─────────────────────────────────────────┤
│ Equipment:                               │
│ • Epson TM-T82II (80mm thermal)         │
│ • CheckIn KB + MRZ reader               │
│ • Desktop computer                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 1: Create Vouchers                 │
│ • Agent selects quantity (1-5)          │
│ • Customer pays cash/POS                │
│ • Agent registers payment in system     │
│ • System generates voucher codes        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 2: Auto-Start Wizard                │
│ • No intermediate screen (UX improved!) │
│ • Wizard opens immediately              │
│ • Scanner status visible                │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 3: Scan Passports (MRZ Reader)     │
│ • Agent scans passport with KB          │
│ • MRZ data auto-fills fields            │
│ • System registers passport             │
│ • Auto-advances to next voucher         │
│ • Repeat for all vouchers               │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 4: Print All (Thermal)              │
│ • Completion screen shows all vouchers  │
│ • Big green button: 🖨️ Print All       │
│ • Navigate to /app/voucher-print        │
│ • Epson TM-T82II prints all receipts    │
│ • Format: 80mm thermal receipt          │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 5: Hand to Customer                 │
│ • Agent gives thermal receipts          │
│ • Customer proceeds to gate             │
└─────────────────────────────────────────┘
```

### 2. Voucher Validation (Departure Gate)
**Roles**: Any agent with mobile phone

```
┌─────────────────────────────────────────┐
│ DEPARTURE GATE - ANY AGENT              │
├─────────────────────────────────────────┤
│ Equipment:                               │
│ • Mobile phone with camera              │
│ • Internet connection                    │
│ • GreenPay web app                      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 1: Customer Presents Voucher        │
│ • Customer shows thermal receipt        │
│ • Barcode visible                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 2: Scan with Mobile Camera          │
│ • Agent opens /app/scan                 │
│ • Mobile camera activates (HTML5)       │
│ • Agent scans voucher barcode           │
│ • System validates code                 │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 3: Validation Result                │
│                                          │
│ ✅ VALID:                                │
│   • Green flash + success beep          │
│   • Shows: Passport, Name, Amount       │
│   • Marks voucher as USED               │
│   • Logs validation event               │
│   • Customer can board                  │
│                                          │
│ ❌ INVALID/USED:                         │
│   • Red flash + error beep              │
│   • Shows: Already used / Invalid       │
│   • Customer cannot board               │
│   • Agent investigates                  │
└─────────────────────────────────────────┘
```

---

## Equipment & Technology

### Desktop Equipment (Airport Kiosk)

**Epson TM-T82II Thermal Printer**:
- Type: 80mm thermal receipt printer
- Connection: USB
- Paper: Thermal roll (80mm × continuous)
- Speed: ~150mm/sec
- Used for: Bulk voucher printing
- Format: Receipt-style with barcode

**CheckIn KB with MRZ Reader**:
- Type: USB keyboard wedge scanner
- Function: Reads passport MRZ (Machine Readable Zone)
- Connection: Acts as keyboard input
- Format: Outputs 88-character MRZ string
- Auto-detect: System recognizes rapid keystrokes
- No drivers needed: Works as standard keyboard

**Computer/Kiosk**:
- OS: Any (Windows/Mac/Linux)
- Browser: Chrome/Edge (Web Serial API support)
- Connection: USB ports for scanner + printer
- Network: Internet for system access

---

### Mobile Equipment (Departure Gate)

**Mobile Phone**:
- OS: iOS or Android
- Browser: Any modern browser
- Camera: Standard phone camera
- Feature: HTML5 QR Code scanner (no app needed)
- Network: Mobile data or WiFi

**How it Works**:
1. Agent opens web app on phone
2. Navigates to /app/scan
3. System detects mobile device automatically
4. Camera scanner activates (HTML5Qrcode library)
5. Agent points camera at barcode
6. System decodes and validates
7. Result shown instantly

---

## Print Format Comparison

### Thermal Receipt (Airport Kiosk)
**File**: `VoucherPrintPage.jsx`
**Printer**: Epson TM-T82II
**Size**: 80mm × auto height
**Format**: Receipt-style

```
┌──────────────────────────┐
│    [LOGO]    [EMBLEM]    │
│                          │
│     ▓▓▓ GREEN CARD ▓▓▓   │
│  Foreign Passport Holder │
│                          │
│ Travel Document          │
│ Number          P6182... │
│ Coupon Number:  WVK5L... │
│ Bill Amount:    K50.00   │
│ Payment Mode:   CARD     │
│                          │
│ ▐█▌▐█▌▐█▌▐█▌▐█▌▐█▌▐█▌   │ ← Barcode
│                          │
│ GENERAL                  │
│ COUNTER:     Agent Name  │
│ 21/01/2026 14:24        │
│                          │
│     GO GREEN PNG         │
└──────────────────────────┘
```

### A4 PDF (Email/Download)
**File**: `backend/utils/pdfGenerator.js`
**Printer**: Any A4 printer
**Size**: 210mm × 297mm
**Format**: Official letterhead

```
┌────────────────────────┐
│ [PNG Government Header]│
│ Green Fees System      │
│                        │
│ VOUCHER CODE           │
│ WVK5L4E6b             │
│                        │
│ Passport: P61820835    │
│ Amount: PGK 50.00      │
│ Valid: Jan 20, 2026    │
│                        │
│ [Barcode]              │
│                        │
│ [Footer with logos]    │
└────────────────────────┘
```

---

## Mobile vs Desktop Detection

**ScanAndValidate Page** (`/app/scan`):

```javascript
// Automatic device detection
const deviceType = () => {
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isTablet = /iPad|Android.*Tablet/i.test(ua);
  const isTouchDevice = ('ontouchstart' in window);

  return (isMobile || isTablet) ? 'mobile' : 'desktop';
};

// Mobile → HTML5 camera scanner
// Desktop → USB hardware scanner
```

**Result**:
- 📱 Mobile devices → Camera scanner activates automatically
- 🖥️ Desktop → USB scanner listener activates
- No manual switching needed!

---

## API Endpoints Used

### Voucher Creation & Registration
```
POST /api/individual-purchases/batch-simple
POST /api/public-purchases/register-passport
GET  /api/vouchers/code/:voucherCode
```

### Validation at Gate
```
GET  /api/vouchers/validate/:code
POST /api/vouchers/mark-used/:code
```

### PDF Generation
```
GET /api/vouchers/pdf/:voucherCode
```

---

## Security & Validation

### Voucher Status Flow
```
PENDING → VALID → USED
   ↓        ↓       ↓
Created  Registered  Scanned at gate
         with        (one-time use)
         passport
```

### Validation Rules
1. ✅ Voucher must exist in system
2. ✅ Must be in VALID status (not USED)
3. ✅ Must have passport registered
4. ✅ Must not be expired (validity period check)
5. ✅ Amount must match (PGK 50.00)
6. ❌ Cannot be used twice (status → USED)

### Logging
Every validation attempt is logged:
- Timestamp
- Voucher code
- Agent who scanned
- Result (VALID/INVALID/USED)
- IP address
- Device type

---

## Troubleshooting

### Issue: MRZ Scanner Not Working
**Check**:
- USB cable connected?
- Scanner power LED on?
- Try scanner test page: `/app/scanner-test`
- Check Web Serial permissions in browser

**Solution**:
- Reconnect USB
- Refresh page
- Click "Connect Scanner" button
- Grant browser permissions

### Issue: Thermal Printer Not Printing
**Check**:
- Printer powered on?
- Thermal paper loaded correctly?
- USB connected?
- Print queue clear?

**Solution**:
- Check printer status in OS
- Try print test page
- Reload thermal paper
- Restart printer

### Issue: Mobile Camera Not Activating
**Check**:
- HTTPS connection? (required for camera)
- Camera permissions granted?
- Using supported browser?

**Solution**:
- Use Chrome or Safari
- Grant camera permissions when prompted
- Check Settings → Privacy → Camera
- Use HTTPS (not HTTP)

### Issue: Barcode Won't Scan
**Check**:
- Barcode printed clearly?
- Good lighting?
- Hold steady?
- Barcode not damaged?

**Solution**:
- Improve lighting
- Clean camera lens
- Hold phone closer/further
- Try manual entry of code

---

## User Testing Checklist

### Airport Kiosk (Counter_Agent)
- [ ] Login as Counter_Agent
- [ ] Scanner status shows at top of page
- [ ] Click "Connect Scanner" → Scanner ready (green)
- [ ] Create 5 vouchers with payment
- [ ] Wizard auto-starts (no intermediate screen)
- [ ] Scan 5 passports with MRZ reader
- [ ] Each scan auto-registers and advances
- [ ] No duplicate registration errors
- [ ] Completion screen shows all 5 vouchers
- [ ] Click "🖨️ Print All to Thermal Printer (5)"
- [ ] Print page opens with preview
- [ ] Click "Print All Vouchers"
- [ ] Select Epson TM-T82II printer
- [ ] All 5 receipts print correctly
- [ ] Barcodes are scannable
- [ ] Format matches sample image

### Departure Gate (Any Agent + Mobile)
- [ ] Login on mobile phone
- [ ] Navigate to /app/scan
- [ ] Camera activates automatically
- [ ] Scan thermal voucher barcode
- [ ] Result shows: VALID (green flash + beep)
- [ ] Shows passport, name, amount
- [ ] Voucher marked as USED
- [ ] Scan same voucher again
- [ ] Result shows: ALREADY USED (red flash)
- [ ] Customer cannot board with used voucher

---

## Summary

✅ **Thermal printing**: ONLY used at airport kiosk (Epson TM-T82II)
✅ **PDF format**: Used everywhere else (email, download, A4 printers)
✅ **Mobile scanning**: Gate validation with phone camera
✅ **Desktop scanning**: Kiosk with USB MRZ reader
✅ **Flex_Admin**: Has access to ALL features across ALL roles
✅ **Role separation**: Clear boundaries with proper access control
✅ **Complete workflow**: From voucher creation → passport scan → thermal print → gate validation

**System is production-ready for user testing! 🚀**
