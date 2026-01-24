# Scanner and PDF Layout Fixes

## Issue 1: Scanner Not Working After "Create Another"

### Problem
When user clicks "← Create Another" button after generating a voucher, the scanner beeps but passport field doesn't update on subsequent scans.

### Root Cause
The `processScannedPassport` callback in `PassportDetailsStep` uses `useCallback` with dependencies `[setPassportInfo, toast]`. When the component is remounted via `resetFlow()`, the callback maintains stale closures over the old state values (`searchQuery`, `passportFound`, etc.) even though those state variables were reset to empty/null.

### Solution
Add a `key` prop to `PassportDetailsStep` that changes when `resetFlow()` is called, forcing complete remount and recreation of all hooks and callbacks.

**File:** `src/pages/IndividualPurchase.jsx`

**Change 1 - Add reset key state:**
```javascript
const IndividualPurchase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [passportInfo, setPassportInfo] = useState({});
  const [paymentData, setPaymentData] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);
  const [resetKey, setResetKey] = useState(0); // ADD THIS LINE
```

**Change 2 - Update resetFlow to increment key:**
```javascript
const resetFlow = () => {
  setStep(0);
  setPassportInfo({});
  setPaymentData(null);
  setVoucher(null);
  setResetKey(prev => prev + 1); // ADD THIS LINE - forces PassportDetailsStep remount
};
```

**Change 3 - Add key to PassportDetailsStep:**
```javascript
{step === 0 && (
  <PassportDetailsStep
    key={`step0-${resetKey}`}  // CHANGE THIS LINE - was just "step0"
    onNext={handleNext}
    setPassportInfo={setPassportInfo}
    passportInfo={passportInfo}
  />
)}
```

This ensures complete remount of PassportDetailsStep with fresh scanner hooks and callbacks when user starts a new purchase.

---

## Issue 2: PDF Layout Consistency Analysis ✅

### Problem
Print voucher (browser print) has different layout than Email PDF - user reported "missing green line etc."

### Investigation Results

After analyzing both templates, I found:

**Backend Email PDF** (`backend/utils/pdfGenerator.js` lines 8-241):
- CCDA logo centered (line 36-38)
- "GREEN CARD" title in `#4CAF50` green (line 48)
- Green divider line using `stroke('#4CAF50')` (line 58)
- Barcode using bwip-js CODE128 (lines 87-109)
- Footer with generation date (line 233)

**Frontend Print HTML** (`src/pages/IndividualPurchase.jsx` lines 1296-1421):
- CCDA logo centered (line 1392)
- "GREEN CARD" title in `#2d8a34` green (line 1327)
- **Green divider line CSS EXISTS** (lines 1332-1337) with `background: #2d8a34`
- **Green divider element EXISTS** (line 1395): `<div class="divider"></div>`
- Barcode using canvas-based generation
- Footer with generation date (line 1416)

### Key Findings

✅ **Green line is NOT missing** - it exists in both templates
❌ **Color inconsistency**: Backend uses `#4CAF50`, Frontend uses `#2d8a34`
✅ **Layout structure is similar** - both have logo, title, divider, barcode, footer
✅ **Both templates support conditional passport display or registration QR**

### Recommendation

The print template **already has the green divider line**. The user's report of "missing green line" may be due to:
1. **Color difference** - The frontend green (`#2d8a34`) is darker than backend green (`#4CAF50`)
2. **Print preview rendering** - Some browsers may not render background colors in print preview by default
3. **Browser print settings** - "Background graphics" option may be disabled

### Solution: Ensure Color Consistency

To ensure both templates use identical green color, update frontend print template to use `#4CAF50`:

**File:** `src/pages/IndividualPurchase.jsx`

**Change line 1327** (title color):
```javascript
color: #4CAF50;  // Changed from #2d8a34
```

**Change line 1334** (divider color):
```javascript
background: #4CAF50;  // Changed from #2d8a34
```

### Status: Verified ✅

Both templates have the green line. Color standardization recommended but not critical. Email PDF and Print HTML are functionally equivalent with minor styling differences.

---

## Deployment Instructions

Both fixes have been applied and are ready for deployment:

### Changes Made:
1. **Scanner Reset Fix** - `src/pages/IndividualPurchase.jsx`:
   - Added `resetKey` state (line 1639)
   - Updated `resetFlow()` function to increment resetKey (line 1740)
   - Changed PassportDetailsStep key prop to include resetKey (line 1760)

2. **PDF Color Consistency Fix** - `src/pages/IndividualPurchase.jsx`:
   - Updated title color from `#2d8a34` to `#4CAF50` (line 1327)
   - Updated divider background from `#2d8a34` to `#4CAF50` (line 1334)

### Deployment Steps:
```bash
# Build frontend with fixes
npm run build

# Deploy to production
./deploy.sh
```

### Verification:
After deployment, test both fixes:

**Scanner Fix:**
1. Login as Counter_Agent
2. Navigate to Individual Purchase page
3. Scan a passport → Generate voucher
4. Click "← Create Another" button
5. Scan another passport
6. ✅ Verify passport field updates correctly

**PDF Layout Fix:**
1. Generate a voucher
2. Print the voucher (browser print)
3. Email the voucher to yourself
4. ✅ Compare print preview with emailed PDF - green line and title color should match

---

## Testing Checklist

### Scanner Fix:
- [ ] Scan passport → generate voucher → click "← Create Another"
- [ ] Scan another passport - verify field updates
- [ ] Repeat 3-5 times to ensure consistency

### PDF Layout Fix:
- [ ] Generate voucher and print - verify green line appears
- [ ] Generate voucher and email - compare PDF layout
- [ ] Ensure both have identical:
  - [ ] CCDA logo
  - [ ] Green divider line
  - [ ] "GREEN CARD" title styling
  - [ ] Voucher code display
  - [ ] Barcode
  - [ ] Footer with generation date

---

## Files Modified

### Frontend:
- `src/pages/IndividualPurchase.jsx` - Scanner reset fix + PDF print template

### Backend (if Option A chosen):
- `backend/routes/individual-purchases.js` - Add PDF download endpoint
- `backend/utils/pdfGenerator.js` - Ensure consistent voucher PDF generation
