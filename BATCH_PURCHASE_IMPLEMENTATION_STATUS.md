# Batch Purchase Implementation Status

**Date:** 2026-01-19
**Status:** PARTIAL - Core infrastructure complete, component modifications in progress

## Completed Tasks ✅

### Backend (100% Complete)
- ✅ Database migration (`add-batch-tracking.sql`)
- ✅ Database security fix (`fix-passport-composite-key.sql`)
- ✅ Batch API endpoints in `backend/routes/individual-purchases.js`:
  - POST `/batch` - Create batch purchase
  - GET `/batch/:batchId/pdf` - Download batch PDF
  - POST `/batch/:batchId/email` - Email batch vouchers

### Frontend Infrastructure (100% Complete)
- ✅ Feature flag system (`src/config/features.js`)
- ✅ Batch purchase service (`src/lib/batchPurchaseService.js`)
- ✅ Batch quantity selector component (`src/components/BatchQuantitySelector.jsx`)
- ✅ Batch passport list component (`src/components/BatchPassportList.jsx`)

### IndividualPurchase.jsx Modifications (40% Complete)

**✅ COMPLETED:**
1. Added batch purchase imports (lines 25-34)
2. Added batch state variables (lines 1652-1676)
   - `quantity`, `batchMode`, `passportList`, `batchResult`
   - Auto mode-switcher effect
3. Updated `resetFlow()` function (lines 1779-1783)
4. Updated component prop passing (lines 1807-1836)

**❌ PENDING CRITICAL MODIFICATIONS:**

5. **PassportDetailsStep Component** - Add UI Elements
   - Add BatchQuantitySelector after scanner status (line ~630)
   - Add BatchPassportList for batch collection (line ~640)
   - **Status:** NOT YET APPLIED

6. **processScannedPassport Function** - Scanner Logic Update
   - Add conditional batch/single mode logic
   - Batch mode: Add to list instead of form
   - Single mode: Keep existing logic
   - **Location:** Line 79-240
   - **Status:** NOT YET APPLIED (CRITICAL)

7. **PaymentStep Component** - Amount Calculation
   - Update amount calculation for batch (quantity × 50)
   - Add effect to recalculate when quantity changes
   - **Location:** Line 996-1004
   - **Status:** NOT YET APPLIED

8. **PaymentStep handleProceed** - Batch Validation
   - Add batch completeness check
   - **Location:** Inside `handleProceed` function
   - **Status:** NOT YET APPLIED

9. **createVoucherAndPassport Function** - API Selection
   - Add conditional batch/single API call
   - Batch: Call `createBatchPurchase()`
   - Single: Keep existing `createIndividualPurchase()`
   - **Location:** Line 1697-1770
   - **Status:** NOT YET APPLIED (CRITICAL)

10. **VoucherStep Component** - Batch Success Screen
    - Add batch success UI with voucher list
    - Keep existing single voucher UI
    - **Location:** Line 1260-1628
    - **Status:** NOT YET APPLIED

## Critical Next Steps (Priority Order)

### Priority 1: Scanner Logic (BLOCKER)
Without this, scanned passports won't be collected in batch mode.

**File:** `src/pages/IndividualPurchase.jsx`
**Location:** Line 79 (`processScannedPassport` function)

**Action Required:**
Replace the `processScannedPassport` function body with conditional logic:
- If `batchMode === true`: Add to `passportList` array
- If `batchMode === false`: Use existing database lookup logic

**Key Code Snippet:**
```javascript
const processScannedPassport = useCallback(async (data) => {
  const scannedData = { /* mapping logic */ };

  // BATCH MODE: Add to passport list
  if (batchMode) {
    if (passportList.length >= quantity) {
      toast({ variant: "destructive", title: "Batch Full" });
      return;
    }

    const isDuplicate = passportList.some(
      p => p.passportNumber.toUpperCase() === scannedData.passportNumber.toUpperCase()
    );
    if (isDuplicate) {
      toast({ variant: "destructive", title: "Duplicate Passport" });
      return;
    }

    setPassportList(prev => [...prev, scannedData]);
    toast({ title: `Passport ${passportList.length + 1}/${quantity} Added` });
    return; // Exit early
  }

  // SINGLE MODE: Existing logic (UNCHANGED)
  try {
    const existingPassport = await getPassportByNumberAndNationality(...);
    // ... rest of existing logic ...
  } catch (error) {
    // ... existing error handling ...
  }
}, [setPassportInfo, toast, batchMode, passportList, quantity]);
```

### Priority 2: API Call Logic (BLOCKER)
Without this, batch purchases won't actually be created.

**File:** `src/pages/IndividualPurchase.jsx`
**Location:** Line 1697 (`createVoucherAndPassport` function)

**Action Required:**
Wrap existing logic in `if (!batchMode) { ... }` and add batch branch:

```javascript
const createVoucherAndPassport = async () => {
  setIsCreatingVoucher(true);
  try {
    if (batchMode) {
      // BATCH MODE: Use batch purchase API
      const batchData = await createBatchPurchase(passportList, {
        paymentMethod: paymentData.paymentMethod,
        discount: paymentData.discount || 0,
        customerEmail: passportInfo.email || null,
      });

      setBatchResult(batchData);
      toast({
        title: "Batch Created Successfully!",
        description: `${batchData.quantity} vouchers created. Batch ID: ${batchData.batchId}`,
      });
    } else {
      // SINGLE MODE: Existing logic (UNCHANGED)
      let passport = await getPassportByNumberAndNationality(...);
      if (!passport) {
        passport = await createPassport(...);
      }
      const createdVoucher = await createIndividualPurchase(...);
      setVoucher(createdVoucher);
      toast({ title: "Success!", description: "Voucher generated successfully." });
    }
  } catch (error) {
    console.error(`[${batchMode ? 'BATCH' : 'SINGLE'}] Error:`, error);
    toast({ variant: "destructive", title: "Error", description: error.message });
    setStep(1);
  } finally {
    setIsCreatingVoucher(false);
  }
};
```

### Priority 3: UI Elements (Important but not blocking)

**3a. Add Quantity Selector**
**Location:** Line ~630 in `PassportDetailsStep`, after scanner status

```javascript
{/* Batch Quantity Selector - Only shown if feature enabled */}
{isFeatureEnabled('BATCH_PURCHASE_ENABLED') && (
  <div className="mt-6">
    <BatchQuantitySelector
      quantity={quantity}
      onChange={setQuantity}
      disabled={false}
    />
  </div>
)}
```

**3b. Add Passport List**
**Location:** Line ~640 in `PassportDetailsStep`, after quantity selector

```javascript
{/* Batch Passport List - Only shown when quantity > 1 */}
{batchMode && (
  <div className="mt-6">
    <BatchPassportList
      passports={passportList}
      targetQuantity={quantity}
      onRemove={(index) => {
        setPassportList(prev => prev.filter((_, i) => i !== index));
      }}
      isScanning={webSerialScanner.connectionState === 'CONNECTED'}
    />
  </div>
)}
```

**3c. Update Payment Amount Calculation**
**Location:** Line 996 in `PaymentStep`

```javascript
const [amount, setAmount] = useState(batchMode ? quantity * 50 : 50);

// Update amount when quantity changes in batch mode
useEffect(() => {
  if (batchMode) {
    setAmount(quantity * 50);
  }
}, [quantity, batchMode]);
```

**3d. Add Batch Success Screen**
**Location:** Line 1260 in `VoucherStep`

Add at the beginning of the function:
```javascript
const isBatchMode = !!batchResult;

if (isBatchMode) {
  return (
    // Batch success UI with voucher list, download PDF, email buttons
    // See BATCH_PURCHASE_FRONTEND_IMPLEMENTATION.md lines 407-518 for full code
  );
}

// SINGLE MODE: Use existing UI (unchanged)
return (
  // ... existing single voucher UI ...
);
```

### Priority 4: PassportDetailsStep Signature Update
**Location:** Line 69 (`PassportDetailsStep` function signature)

**Add batch props to function parameters:**
```javascript
const PassportDetailsStep = ({
  onNext,
  setPassportInfo,
  passportInfo,
  // Batch props
  quantity,
  setQuantity,
  batchMode,
  passportList,
  setPassportList
}) => {
```

### Priority 5: PaymentStep Signature Update
**Location:** Line 996 (`PaymentStep` function signature)

**Add batch props:**
```javascript
const PaymentStep = ({
  onNext,
  onBack,
  passportInfo,
  setPaymentData,
  // Batch props
  quantity,
  batchMode,
  passportList
}) => {
```

### Priority 6: VoucherStep Signature Update
**Location:** Line 1260 (`VoucherStep` function signature)

**Add batch props:**
```javascript
const VoucherStep = ({
  onBack,
  passportInfo,
  paymentData,
  voucher,
  // Batch props
  batchResult
}) => {
```

## Testing Strategy

### Phase 1: Feature Disabled Testing
1. Deploy with `BATCH_PURCHASE_ENABLED: false`
2. Test existing single purchase flow
3. Verify NO batch UI appears
4. Verify existing functionality unchanged

### Phase 2: Enable Feature
1. Set `BATCH_PURCHASE_ENABLED: true`
2. Test single purchase (quantity = 1)
3. Test batch purchase (quantity = 2, 3, 4, 5)
4. Test duplicate detection
5. Test scanner integration
6. Test PDF generation
7. Test email sending

### Phase 3: Error Scenarios
1. Test batch incomplete (not all passports scanned)
2. Test payment failure
3. Test network errors
4. Test validation errors

## Deployment Checklist

- [ ] Complete Priority 1-2 modifications (CRITICAL)
- [ ] Complete Priority 3-6 modifications (UI/UX)
- [ ] Test with feature flag DISABLED
- [ ] Deploy to production with feature DISABLED
- [ ] Smoke test production
- [ ] Enable feature flag for IT_Support only
- [ ] Internal testing (2-5 vouchers)
- [ ] Enable for 2-3 Counter_Agents (pilot)
- [ ] Monitor for 48 hours
- [ ] Full rollout (all users)

## Files Ready for Deployment

**Backend:**
- `database/migrations/add-batch-tracking.sql`
- `database/migrations/fix-passport-composite-key.sql`
- `backend/routes/individual-purchases.js`

**Frontend:**
- `src/config/features.js`
- `src/lib/batchPurchaseService.js`
- `src/components/BatchQuantitySelector.jsx`
- `src/components/BatchPassportList.jsx`
- `src/pages/IndividualPurchase.jsx` (PARTIAL - needs Priority 1-6 completed)

## Rollback Plan

**Instant Rollback:**
Set `BATCH_PURCHASE_ENABLED: false` in `src/config/features.js`

**Full Rollback:**
1. Revert `IndividualPurchase.jsx` to previous version
2. Keep database migrations (they're additive, non-breaking)
3. Keep backend endpoints (won't be called if frontend reverted)

## Risk Assessment

| Component | Risk Level | Mitigation |
|-----------|-----------|------------|
| Database migrations | LOW | Additive only, no data changes |
| Backend endpoints | LOW | Isolated, not used until frontend calls them |
| Frontend (completed parts) | NEGLIGIBLE | Guarded by feature flag |
| Frontend (pending parts) | MEDIUM | Requires testing with flag disabled first |

## Success Criteria

- [ ] Single purchase flow works identically (quantity = 1)
- [ ] Batch mode activates when quantity > 1
- [ ] Scanner correctly populates form (single) or list (batch)
- [ ] Duplicate detection prevents same passport twice
- [ ] Payment calculation correct (quantity × 50)
- [ ] Batch API creates all vouchers atomically
- [ ] PDF download contains all vouchers
- [ ] Email sends with all vouchers attached
- [ ] Feature flag toggle works instantly
- [ ] No errors in console when feature disabled

## Implementation Time Estimate

- Priority 1 (Scanner Logic): 30 minutes
- Priority 2 (API Call Logic): 20 minutes
- Priority 3-6 (UI Elements): 40 minutes
- Testing: 60 minutes
- **Total Remaining Work:** ~2.5 hours

## Documentation

Full implementation details available in:
- `BATCH_PURCHASE_FRONTEND_IMPLEMENTATION.md` (612 lines)
- `BATCH_PURCHASE_SECURITY_REVIEW.md` (920 lines)
- `MANUAL_DEPLOYMENT_INSTRUCTIONS.md`

---

**Last Updated:** 2026-01-19
**Implemented By:** Claude Code
**Approved By:** User (Nikolay)
