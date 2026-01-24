# Multi-Voucher Registration Wizard - Implementation Specification

## Overview

Enhanced registration flow for customers purchasing 2-5 vouchers, allowing them to register multiple passports efficiently with proper error handling and voucher code protection.

## User Flow

### Phase 1: Payment Success - Decision Point

After successful payment for 2-5 vouchers:

1. **Display all voucher codes** with status (unregistered)
2. **Ask**: "Do you have all passports available now to register?"
   - **Option A**: "Yes, Register All Now" → Go to Multi-Passport Registration Wizard
   - **Option B**: "No, Register Later" → Go to Unregistered Voucher Output Options

### Phase 2A: Multi-Passport Registration Wizard (Option A)

**Goal**: Register all passports one-by-one with confirmation at each step

#### Wizard Steps (for each voucher):

1. **Voucher Selection Screen**
   ```
   Registering Passport 1 of 3
   Voucher Code: GPN-ABC123

   [Scan Passport with Camera]
   [Enter Manually]
   ```

2. **Camera Scanner** (reuse SimpleCameraScanner component)
   - Same MRZ auto-capture functionality
   - iOS/Android optimized
   - ROI-aligned detection
   - Shows live camera feed with guide box

3. **Confirmation Screen** (CRITICAL - prevent errors)
   ```
   ✓ Passport Scanned Successfully

   Please confirm the details below are correct:

   Passport Number: P1234567
   Surname: SMITH
   Given Name: JOHN
   Nationality: Australian
   Date of Birth: 1985-03-15
   Expiry Date: 2028-12-31

   [✓ Confirm & Continue] [✗ Edit Details] [← Scan Again]
   ```

4. **Success + Next Voucher**
   ```
   ✓ Passport registered to voucher GPN-ABC123

   Progress: 1 of 3 complete

   [Continue to Next Passport →]
   ```

#### Error Handling & Recovery

**CRITICAL**: User must never lose voucher codes they paid for

| Error Scenario | Recovery Strategy |
|---|---|
| Camera fails to open | Fallback to manual entry form |
| OCR fails to read MRZ | Retry scan OR manual entry option |
| User closes wizard mid-flow | Save progress to sessionStorage, allow resume |
| Network error on save | Retry with exponential backoff, show error, allow manual retry |
| Duplicate passport number | Warn user, allow override OR skip voucher |
| User navigates away | Confirm dialog: "You have X unregistered vouchers. Leave anyway?" |

**Progress Persistence**:
```javascript
sessionStorage.setItem('multiVoucherRegistration', JSON.stringify({
  sessionId: 'pay_xxx',
  totalVouchers: 3,
  completed: [
    { voucherCode: 'GPN-ABC123', passportNumber: 'P1234567', registered: true },
    { voucherCode: 'GPN-DEF456', registered: false }
  ],
  currentIndex: 1
}));
```

#### Completion Screen

```
🎉 All Passports Registered Successfully!

✓ 3 of 3 vouchers ready to use

Voucher GPN-ABC123 → Passport P1234567
Voucher GPN-DEF456 → Passport P8901234
Voucher GPN-GHI789 → Passport P5678901

Your vouchers are now valid and ready to use at the airport.

[Download All PDFs] [Print All] [Email All]
```

### Phase 2B: Unregistered Voucher Options (Option B)

**Goal**: Provide vouchers for later registration with instructions

#### Output Options (same for both registered/unregistered):

1. **Download PDF**
   - Single PDF with all vouchers
   - Each voucher shows QR code + registration URL
   - Instructions included

2. **Print**
   - Opens print dialog
   - Each voucher on separate page
   - QR code + URL + instructions

3. **Email**
   - Send to customer email (from order)
   - PDF attachment
   - Email body includes registration links

#### Registration Instructions (for unregistered vouchers):

```
📋 How to Register Your Vouchers

Each voucher must be registered before use. You have 3 options:

Option 1: Mobile Phone (Recommended)
• Scan the QR code with your phone camera
• Follow the on-screen passport scan wizard
• Registration takes 2-3 minutes per voucher

Option 2: Desktop Computer
• Visit: greenpay.eywademo.cloud/register/YOUR_VOUCHER_CODE
• Enter passport details or upload photo
• Repeat for each voucher

Option 3: Airport Agent
• Bring this voucher + passport to PNG airport
• Agent will scan your passport and register voucher
• Must be done before departure gate

⚠️ IMPORTANT: Unregistered vouchers are NOT VALID for travel
```

---

## Technical Implementation

### Components to Create/Modify

#### 1. New Component: `MultiVoucherRegistrationWizard.jsx`

```javascript
// Props:
{
  vouchers: Array<{code, amount, status}>,
  onComplete: (results) => void,
  onCancel: () => void
}

// State:
{
  currentIndex: 0,
  totalVouchers: vouchers.length,
  registrationData: {},
  step: 'scan' | 'confirm' | 'saving' | 'success',
  errors: []
}
```

**Features**:
- Progress indicator (1 of 3, 2 of 3, etc.)
- SimpleCameraScanner integration
- Confirmation screen with edit capability
- Retry logic for network errors
- Navigation guards (prevent accidental exit)
- SessionStorage persistence

#### 2. Modify: `PaymentSuccess.jsx`

Add decision point after voucher display:

```javascript
const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
const [registrationChoice, setRegistrationChoice] = useState(null);

// For 2+ vouchers AND all unregistered:
if (vouchers.length > 1 && vouchers.every(v => !v.passport?.id)) {
  // Show decision dialog
  return <RegistrationDecisionDialog
    voucherCount={vouchers.length}
    onRegisterNow={() => setShowRegistrationWizard(true)}
    onRegisterLater={() => setRegistrationChoice('later')}
  />;
}

// If wizard mode:
if (showRegistrationWizard) {
  return <MultiVoucherRegistrationWizard
    vouchers={vouchers}
    onComplete={(results) => {
      // Refresh vouchers to show registered status
      refetchVouchers();
      setShowRegistrationWizard(false);
    }}
  />;
}
```

#### 3. New Component: `RegistrationDecisionDialog.jsx`

Simple modal asking the key question:

```javascript
<Dialog open={true}>
  <DialogTitle>
    Register {voucherCount} Passports
  </DialogTitle>
  <DialogContent>
    <p>Do you have all {voucherCount} passports available now?</p>

    <div className="space-y-3 mt-6">
      <Button onClick={onRegisterNow} size="lg" fullWidth>
        ✓ Yes, Register All Now (Recommended)
      </Button>

      <Button onClick={onRegisterLater} variant="outline" fullWidth>
        ↓ No, I'll Register Later
      </Button>
    </div>

    <p className="text-sm text-muted mt-4">
      Registering now takes 5-10 minutes. If you register later,
      you'll need to scan the QR codes or visit the registration URLs.
    </p>
  </DialogContent>
</Dialog>
```

#### 4. New Component: `UnregisteredVoucherActions.jsx`

Shows Print/Download/Email options with instructions:

```javascript
<Card>
  <CardHeader>
    <CardTitle>Save Your Unregistered Vouchers</CardTitle>
  </CardHeader>
  <CardContent>
    <Alert variant="warning">
      ⚠️ These vouchers must be registered before use
    </Alert>

    <div className="grid grid-cols-3 gap-2 mt-4">
      <Button onClick={handleDownload}>Download PDF</Button>
      <Button onClick={handlePrint}>Print</Button>
      <Button onClick={handleEmail}>Email</Button>
    </div>

    <RegistrationInstructions />
  </CardContent>
</Card>
```

#### 5. Backend API Endpoints

**GET `/api/buy-online/voucher/:sessionId/pdf`**
- Generate PDF with ALL vouchers
- Include QR codes for unregistered
- Include registration URLs
- Include instructions

**POST `/api/buy-online/voucher/:code/register`**
```javascript
{
  passportNumber,
  surname,
  givenName,
  nationality,
  dateOfBirth,
  sex,
  expiryDate
}
```
Returns: `{ success: true, voucher: {...} }`

**GET `/api/buy-online/registration-progress/:sessionId`**
- Check which vouchers are registered
- Return progress: `{ total: 3, registered: 1 }`

---

## PDF Generation Updates

### Registered Voucher PDF

```
┌────────────────────────────────────┐
│ PNG Green Fee Voucher              │
│ VALID - READY TO USE              │
│                                    │
│ Code: GPN-ABC123                   │
│ [QR CODE]                          │
│                                    │
│ Passport: P1234567                 │
│ Name: John Smith                   │
│ Nationality: Australian            │
│                                    │
│ Valid: 01/24/2026 - 01/24/2027   │
│                                    │
│ Present this at departure gate     │
└────────────────────────────────────┘
```

### Unregistered Voucher PDF

```
┌────────────────────────────────────┐
│ PNG Green Fee Voucher              │
│ ⚠️ REGISTRATION REQUIRED           │
│                                    │
│ Code: GPN-ABC123                   │
│ [QR CODE for registration]         │
│                                    │
│ SCAN QR CODE TO REGISTER           │
│ or visit:                          │
│ greenpay.eywademo.cloud/           │
│ register/GPN-ABC123                │
│                                    │
│ Must be registered before travel   │
│                                    │
│ Valid after registration:          │
│ 01/24/2026 - 01/24/2027           │
└────────────────────────────────────┘

REGISTRATION INSTRUCTIONS:
[Full instructions as specified above]
```

---

## Security Considerations

### Voucher Code Protection

1. **Never expire vouchers** - customer paid, they own them
2. **Allow re-registration** - if mistake, allow fix
3. **Prevent duplicate passports** - warn but allow override
4. **Session timeout handling** - save progress locally
5. **Network failure recovery** - retry mechanism

### Data Validation

- Passport number format validation
- Expiry date must be future
- Required fields enforcement
- Duplicate detection

---

## Mobile Responsiveness

### Scanner Wizard Mobile Considerations

- Full-screen camera view on mobile
- Large touch targets (min 44px)
- Clear progress indicator
- Swipe gestures for next/previous
- Bottom-sheet modals for confirmations
- Sticky action buttons
- Auto-save progress on pause

### Print Considerations

- Responsive PDF layout
- Mobile: Show download option instead of print
- Desktop: Native print dialog
- Each voucher on separate page

---

## Testing Scenarios

### Happy Path
1. Buy 3 vouchers
2. Choose "Register Now"
3. Scan 3 passports successfully
4. Confirm each
5. Download PDF with all 3

### Error Paths
1. Buy 3 vouchers → Start registration → Camera fails → Use manual entry
2. Buy 3 vouchers → Register 1 → Close browser → Reopen → Resume at voucher 2
3. Buy 3 vouchers → Register 1 → Network error → Retry → Success
4. Buy 3 vouchers → Choose "Register Later" → Download PDF → Scan QR on phone → Register individually

### Edge Cases
1. Duplicate passport numbers across vouchers
2. Same passport registered to multiple vouchers
3. Voucher already registered (revisit success page)
4. Invalid passport data from OCR
5. User edits confirmed data before saving

---

## Implementation Order

### Phase 1: Decision Point (2-3 hours)
- [ ] Create RegistrationDecisionDialog component
- [ ] Modify PaymentSuccess.jsx to detect 2+ vouchers
- [ ] Add routing to wizard

### Phase 2: Multi-Passport Scanner (4-6 hours)
- [ ] Create MultiVoucherRegistrationWizard component
- [ ] Integrate SimpleCameraScanner (existing)
- [ ] Build confirmation screen
- [ ] Add progress tracking

### Phase 3: Error Handling (2-3 hours)
- [ ] SessionStorage persistence
- [ ] Network retry logic
- [ ] Navigation guards
- [ ] Error messaging

### Phase 4: Unregistered Output (3-4 hours)
- [ ] UnregisteredVoucherActions component
- [ ] Update PDF generation (backend)
- [ ] QR code generation for registration URLs
- [ ] Email template with instructions

### Phase 5: Testing & Polish (2-3 hours)
- [ ] End-to-end testing
- [ ] Mobile testing (iOS/Android)
- [ ] Error scenario testing
- [ ] UX polish

**Total Estimate**: 13-19 hours

---

## Success Metrics

- [ ] User can register 5 vouchers in under 10 minutes
- [ ] Zero voucher code loss (even with errors)
- [ ] Camera scanner works on iOS/Android
- [ ] Confirmation step prevents data entry errors
- [ ] Progress saved if user interrupts
- [ ] Clear instructions for later registration

---

## Notes

- Reuse existing SimpleCameraScanner (proven on Android/iOS)
- Keep current single-voucher flow unchanged
- Multi-voucher wizard is additive feature
- Focus on error recovery - customer paid, must not lose vouchers
- Instructions must be crystal clear for non-technical users
