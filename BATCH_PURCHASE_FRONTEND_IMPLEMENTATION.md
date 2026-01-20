# Batch Purchase Frontend Implementation Plan

**Date:** 2026-01-19
**Phase:** 2 - Frontend Enhancement
**Status:** READY FOR IMPLEMENTATION

## Overview

This document outlines the minimal, non-breaking changes to `IndividualPurchase.jsx` to support batch mode while maintaining 100% backward compatibility with existing single purchase flow.

## Design Principles

1. **Feature Flag Guard**: All batch features guarded by `BATCH_PURCHASE_ENABLED`
2. **Isolated State**: Batch state completely separate from existing state
3. **Default Behavior**: Quantity defaults to 1 (single purchase mode)
4. **Conditional Logic**: Mode-based submission (if batch, use batch API; else use existing)
5. **Zero Breaking Changes**: Existing single purchase flow UNTOUCHED

## Files Modified

### 1. New Component Files (Already Created)

✅ `src/config/features.js` - Feature flags
✅ `src/lib/batchPurchaseService.js` - Isolated batch service
✅ `src/components/BatchQuantitySelector.jsx` - Quantity selector UI
✅ `src/components/BatchPassportList.jsx` - Passport list manager

### 2. File to Modify

❌ `src/pages/IndividualPurchase.jsx` - Minimal enhancements (detailed below)

## Changes to IndividualPurchase.jsx

### Section 1: Import Additions (Line ~1-25)

**ADD** these imports (after existing imports, before `StepIndicator`):

```javascript
// Batch purchase imports (ONLY loaded if feature enabled)
import { isFeatureEnabled } from '@/config/features';
import {
  createBatchPurchase,
  downloadBatchPDF,
  sendBatchEmail,
  triggerPDFDownload
} from '@/lib/batchPurchaseService';
import BatchQuantitySelector from '@/components/BatchQuantitySelector';
import BatchPassportList from '@/components/BatchPassportList';
```

**Impact:** Zero - These imports are tree-shaken if not used.

---

### Section 2: Main Component State (Line ~1630-1641)

**CURRENT CODE:**
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
  const [resetKey, setResetKey] = useState(0);
```

**ADD** these batch-specific states (AFTER existing state, line ~1641):

```javascript
  // Batch purchase state (ISOLATED - only used when quantity > 1)
  const [quantity, setQuantity] = useState(1); // Default: single purchase
  const [batchMode, setBatchMode] = useState(false); // Auto-set based on quantity
  const [passportList, setPassportList] = useState([]); // Batch passport collection
  const [batchResult, setBatchResult] = useState(null); // Batch API response
```

**Impact:** Zero when `quantity = 1` (default). Batch state only used when user changes quantity.

---

### Section 3: Batch Mode Switcher (NEW - After state declarations)

**ADD** this effect (line ~1650):

```javascript
  // Automatically switch between single and batch mode based on quantity
  useEffect(() => {
    if (!isFeatureEnabled('BATCH_PURCHASE_ENABLED')) {
      // Feature disabled - force single mode
      setQuantity(1);
      setBatchMode(false);
      return;
    }

    // Switch mode based on quantity
    const shouldEnableBatchMode = quantity > 1;
    setBatchMode(shouldEnableBatchMode);

    // Reset batch-specific state when switching back to single mode
    if (!shouldEnableBatchMode) {
      setPassportList([]);
      setBatchResult(null);
    }
  }, [quantity]);
```

**Impact:** Zero unless user manually changes quantity selector.

---

### Section 4: Passport Details Step Enhancement

**LOCATION:** Inside `PassportDetailsStep` component, AFTER the scanner status section (line ~630).

**ADD** Quantity Selector (guarded by feature flag):

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

**LOCATION:** After quantity selector, add batch passport list (line ~640).

**ADD** Batch Passport List (only shown when batch mode active):

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

**Impact:** Only visible when user selects quantity > 1 AND feature flag enabled.

---

### Section 5: Scanner Integration for Batch Mode

**LOCATION:** Inside `processScannedPassport` function (line ~79).

**MODIFY** the scanner handler to support batch collection:

**CURRENT LOGIC:**
```javascript
const processScannedPassport = useCallback(async (data) => {
  // ... existing validation ...

  // Currently: Always overwrites passportInfo
  setPassportInfo(scannedData);
  setSearchQuery(scannedData.passportNumber);
  // ...
}, [setPassportInfo, toast]);
```

**NEW LOGIC** (replace entire function body with conditional logic):

```javascript
const processScannedPassport = useCallback(async (data) => {
  console.log('[IndividualPurchase] Processing scanned passport:', data);

  // Map Web Serial format to form format
  const scannedData = {
    passportNumber: data.passport_no || data.passportNumber,
    surname: data.surname,
    givenName: data.given_name || data.givenName,
    nationality: data.nationality,
    dob: data.dob,
    sex: data.sex,
    dateOfExpiry: data.date_of_expiry || data.dateOfExpiry,
  };

  // BATCH MODE: Add to passport list
  if (batchMode) {
    // Check if batch is already full
    if (passportList.length >= quantity) {
      toast({
        variant: "destructive",
        title: "Batch Full",
        description: `You've already scanned ${quantity} passports. Remove one to add another.`,
      });
      return;
    }

    // Check for duplicate passport in batch
    const isDuplicate = passportList.some(
      p => p.passportNumber.toUpperCase() === scannedData.passportNumber.toUpperCase()
    );
    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Duplicate Passport",
        description: `Passport ${scannedData.passportNumber} already in batch.`,
      });
      return;
    }

    // Add to batch list
    setPassportList(prev => [...prev, scannedData]);
    toast({
      title: `Passport ${passportList.length + 1}/${quantity} Added`,
      description: `${scannedData.givenName} ${scannedData.surname} added to batch.`,
    });
    return; // Exit early - don't populate single form
  }

  // SINGLE MODE: Use existing logic (UNCHANGED)
  try {
    const existingPassport = await getPassportByNumberAndNationality(
      scannedData.passportNumber,
      scannedData.nationality
    );

    // ... existing database lookup and update logic UNCHANGED ...
    // (Keep all existing logic from lines 100-239)

  } catch (error) {
    // ... existing error handling UNCHANGED ...
  }
}, [setPassportInfo, toast, batchMode, passportList, quantity]); // Add batch dependencies
```

**Impact:**
- Single mode (quantity = 1): Uses existing logic (zero change)
- Batch mode (quantity > 1): Adds passports to list instead

---

### Section 6: Payment Step Modification

**LOCATION:** `PaymentStep` component, payment calculation section (line ~1000-1010).

**MODIFY** amount calculation to account for batch quantity:

**CURRENT:**
```javascript
const [amount, setAmount] = useState(50);
```

**NEW:**
```javascript
const [amount, setAmount] = useState(batchMode ? quantity * 50 : 50);

// Update amount when quantity changes in batch mode
useEffect(() => {
  if (batchMode) {
    setAmount(quantity * 50);
  }
}, [quantity, batchMode]);
```

**Impact:** Single mode unchanged. Batch mode calculates total for all vouchers.

---

### Section 7: Voucher Creation Logic Modification

**LOCATION:** `createVoucherAndPassport` function (line ~1663).

**REPLACE** entire function with conditional batch/single logic:

**CURRENT:**
```javascript
const createVoucherAndPassport = async () => {
  setIsCreatingVoucher(true);
  try {
    // ... single purchase logic ...
    const createdVoucher = await createIndividualPurchase(purchaseData, user?.id);
    setVoucher(createdVoucher);
  } catch (error) {
    // ... error handling ...
  }
};
```

**NEW:**
```javascript
const createVoucherAndPassport = async () => {
  setIsCreatingVoucher(true);
  try {
    console.log(`[IndividualPurchase] Creating ${batchMode ? 'batch' : 'single'} voucher...`);

    if (batchMode) {
      // BATCH MODE: Use batch purchase API
      console.log('[BATCH] Creating batch purchase:', {
        quantity: passportList.length,
        passports: passportList,
      });

      const batchData = await createBatchPurchase(passportList, {
        paymentMethod: paymentData.paymentMethod,
        discount: paymentData.discount || 0,
        customerEmail: passportInfo.email || null,
      });

      console.log('[BATCH] Batch created successfully:', batchData);
      setBatchResult(batchData);

      toast({
        title: "Batch Created Successfully!",
        description: `${batchData.quantity} vouchers created. Batch ID: ${batchData.batchId}`,
      });

    } else {
      // SINGLE MODE: Use existing logic (UNCHANGED)
      console.log('[SINGLE] Creating single purchase...');

      // Check if passport exists or create it
      let passport = await getPassportByNumberAndNationality(
        passportInfo.passportNumber,
        passportInfo.nationality
      );

      if (!passport) {
        passport = await createPassport({
          passportNumber: passportInfo.passportNumber,
          nationality: passportInfo.nationality,
          surname: passportInfo.surname,
          givenName: passportInfo.givenName,
          dob: passportInfo.dob,
          sex: passportInfo.sex,
          dateOfExpiry: passportInfo.dateOfExpiry,
        }, user?.id);
      }

      // Create individual purchase voucher
      const purchaseData = {
        passportId: passport.id,
        passportNumber: passport.passportNo || passport.passport_number || passportInfo.passportNumber,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        cardLastFour: paymentData.cardLastFour,
        nationality: passport.nationality,
        discount: paymentData.discount || 0,
        collectedAmount: paymentData.collectedAmount,
        returnedAmount: paymentData.returnedAmount || 0,
      };

      const createdVoucher = await createIndividualPurchase(purchaseData, user?.id);
      setVoucher(createdVoucher);

      toast({
        title: "Success!",
        description: "Voucher generated successfully.",
      });
    }

  } catch (error) {
    console.error(`[${batchMode ? 'BATCH' : 'SINGLE'}] Error creating voucher:`, error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to generate voucher: ${error.message || 'Please try again.'}`,
    });
    setStep(1); // Go back to payment step
  } finally {
    setIsCreatingVoucher(false);
  }
};
```

**Impact:**
- Single mode: Uses existing `createIndividualPurchase` logic (unchanged)
- Batch mode: Uses new `createBatchPurchase` API

---

### Section 8: Success Screen Modification

**LOCATION:** `VoucherStep` component (line ~1260).

**ADD** batch success UI (conditional rendering):

**CURRENT:** Shows single voucher details.

**NEW:** Add batch success option:

```javascript
const VoucherStep = ({ onBack, passportInfo, paymentData, voucher, batchResult }) => {
  // ... existing state ...

  // Batch mode detection
  const isBatchMode = !!batchResult;

  if (isBatchMode) {
    // BATCH SUCCESS SCREEN
    return (
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">
              ✓ Batch Vouchers Generated Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Success Message */}
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <p className="text-green-800 font-semibold text-lg">
                {batchResult.quantity} vouchers created successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Batch ID: <span className="font-mono font-bold">{batchResult.batchId}</span>
              </p>
            </div>

            {/* Voucher List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Vouchers Created:</h3>
              {batchResult.vouchers.map((voucher, index) => (
                <div key={index} className="bg-slate-50 border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-sm text-green-600 font-bold">
                        {voucher.voucher_code}
                      </span>
                      <span className="mx-2 text-slate-400">•</span>
                      <span className="text-sm text-slate-600">
                        {batchResult.passports[index]?.fullName}
                      </span>
                      <span className="mx-2 text-slate-400">•</span>
                      <span className="text-sm text-slate-500">
                        {batchResult.passports[index]?.nationality}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">PGK 50</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">PGK {batchResult.totalAmount}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Payment Method: {paymentData.paymentMethod}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={async () => {
                  try {
                    const pdfBlob = await downloadBatchPDF(batchResult.batchId);
                    triggerPDFDownload(pdfBlob, batchResult.batchId);
                    toast({ title: "PDF Downloaded", description: "Batch vouchers PDF downloaded successfully." });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Download Failed",
                      description: error.message || "Failed to download PDF."
                    });
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                🖨️ Download All Vouchers (PDF)
              </Button>
              <Button
                onClick={async () => {
                  const email = prompt("Enter email address:", passportInfo.email || '');
                  if (email) {
                    try {
                      await sendBatchEmail(batchResult.batchId, email);
                      toast({ title: "Email Sent", description: `Batch vouchers sent to ${email}` });
                    } catch (error) {
                      toast({
                        variant: "destructive",
                        title: "Email Failed",
                        description: error.message || "Failed to send email."
                      });
                    }
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                📧 Email Vouchers
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button onClick={onBack} variant="outline" size="lg">
            ← Create Another Batch
          </Button>
          <Button onClick={() => window.location.href = '/'} size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600">
            Done
          </Button>
        </div>
      </motion.div>
    );
  }

  // SINGLE MODE: Use existing voucher display (UNCHANGED)
  return (
    // ... existing single voucher UI from lines 1478-1626 ...
  );
};
```

**Impact:**
- Single mode: Uses existing UI (unchanged)
- Batch mode: Shows batch success screen with all vouchers

---

### Section 9: Reset Flow Modification

**LOCATION:** `resetFlow` function (line ~1736).

**MODIFY** to reset batch state:

**CURRENT:**
```javascript
const resetFlow = () => {
  setStep(0);
  setPassportInfo({});
  setPaymentData(null);
  setVoucher(null);
  setResetKey(prev => prev + 1);
};
```

**NEW:**
```javascript
const resetFlow = () => {
  setStep(0);
  setPassportInfo({});
  setPaymentData(null);
  setVoucher(null);
  setResetKey(prev => prev + 1);

  // Reset batch state
  setQuantity(1); // Back to single mode
  setBatchMode(false);
  setPassportList([]);
  setBatchResult(null);
};
```

**Impact:** Ensures clean state reset when creating another voucher.

---

### Section 10: Prop Passing Updates

**LOCATION:** Component render section (line ~1758-1785).

**MODIFY** to pass batch props:

**CURRENT:**
```javascript
{step === 0 && (
  <PassportDetailsStep
    key={`step0-${resetKey}`}
    onNext={handleNext}
    setPassportInfo={setPassportInfo}
    passportInfo={passportInfo}
  />
)}
```

**NEW:**
```javascript
{step === 0 && (
  <PassportDetailsStep
    key={`step0-${resetKey}`}
    onNext={handleNext}
    setPassportInfo={setPassportInfo}
    passportInfo={passportInfo}
    // Batch props
    quantity={quantity}
    setQuantity={setQuantity}
    batchMode={batchMode}
    passportList={passportList}
    setPassportList={setPassportList}
  />
)}
{step === 1 && (
  <PaymentStep
    key="step1"
    onNext={handleNext}
    onBack={handleBack}
    passportInfo={passportInfo}
    setPaymentData={setPaymentData}
    // Batch props
    quantity={quantity}
    batchMode={batchMode}
  />
)}
{step === 2 && (
  <VoucherStep
    key="step2"
    onBack={resetFlow}
    passportInfo={passportInfo}
    paymentData={paymentData}
    voucher={voucher}
    // Batch props
    batchResult={batchResult}
  />
)}
```

**Impact:** Enables components to access batch state when needed.

---

## Validation Checklist

Before proceeding to payment in batch mode, validate:

- [ ] Batch list has exactly `quantity` passports
- [ ] No duplicate passport numbers in batch
- [ ] All passports have required fields (number, name, nationality)
- [ ] Total amount = quantity × 50

**Add validation in PaymentStep `handleProceed`:**

```javascript
const handleProceed = async () => {
  // Existing validation for single mode...

  // NEW: Batch mode validation
  if (batchMode) {
    if (passportList.length < quantity) {
      toast({
        variant: "destructive",
        title: "Incomplete Batch",
        description: `Please scan ${quantity - passportList.length} more passport(s) to complete the batch.`
      });
      return;
    }
  }

  // ... rest of payment processing ...
};
```

---

## Risk Mitigation Summary

| Component | Change Type | Risk Level | Mitigation |
|-----------|-------------|------------|------------|
| State | Additive | NEGLIGIBLE | Batch state only used when quantity > 1 |
| Scanner | Conditional | LOW | Existing logic wrapped in `if (!batchMode)` |
| Payment | Calculation | LOW | Amount auto-calculated, existing flow unchanged |
| Voucher Creation | Conditional | LOW | If/else based on mode, no shared code paths |
| UI Components | Additive | NEGLIGIBLE | Batch UI only shown when feature enabled |

---

## Deployment Strategy

1. **Phase A: Feature Disabled** (Deploy code, feature off)
   - Deploy all code changes with `BATCH_PURCHASE_ENABLED: false`
   - Verify existing single purchase flow works
   - No user-visible changes

2. **Phase B: Internal Testing** (Enable for IT_Support)
   - Set `BATCH_PURCHASE_ENABLED: true`
   - Test batch mode with 2, 3, 4, 5 vouchers
   - Verify PDF generation and email sending
   - Test error scenarios

3. **Phase C: Pilot** (Enable for select Counter_Agents)
   - Enable for 2-3 agents
   - Gather feedback on UX
   - Monitor error rates

4. **Phase D: Full Rollout** (Enable for all)
   - Enable for all Counter_Agents
   - Monitor for 48 hours
   - Keep instant rollback option ready

---

## Rollback Procedure

**Instant Rollback (No Code Deploy):**

```javascript
// src/config/features.js
export const FEATURE_FLAGS = {
  BATCH_PURCHASE_ENABLED: false, // Toggle to false
  // ...
};
```

**Effect:** Batch mode instantly hidden, all users see single purchase mode only.

---

## Testing Requirements

Before deployment, test:

- [ ] Single voucher purchase (quantity = 1) works identically to before
- [ ] Batch mode activates when quantity > 1
- [ ] Scanner adds to list in batch mode, populates form in single mode
- [ ] Duplicate detection works
- [ ] Payment calculation correct for batch
- [ ] Batch API creates all vouchers atomically
- [ ] PDF download contains all vouchers
- [ ] Email sends with all vouchers attached
- [ ] Error handling falls back gracefully
- [ ] Feature flag toggle works instantly

---

## Implementation Timeline

- **Day 1**: Implement state and mode switching logic
- **Day 2**: Integrate quantity selector and passport list UI
- **Day 3**: Modify scanner logic for batch collection
- **Day 4**: Implement batch success screen
- **Day 5**: Testing and bug fixes
- **Day 6**: Internal testing with IT_Support
- **Day 7**: Deploy to production (feature disabled)
- **Day 8**: Enable for pilot agents
- **Day 10**: Full rollout

---

**Next Step:** Begin implementation following this plan section by section.
