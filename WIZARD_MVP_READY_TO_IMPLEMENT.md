# Multi-Voucher Wizard MVP - Ready to Implement

**Status**: ✅ Fully planned and ready for implementation
**Estimated Time**: 3-4 hours
**Priority**: HIGH

---

## What This MVP Will Do

When an agent purchases multiple vouchers (quantity > 1):
1. Show "Start Registration Wizard" button on the voucher list
2. Open inline wizard with sidebar showing all vouchers
3. Allow sequential registration of each voucher
4. Show completion summary with registered voucher count
5. Provide option to return to wizard for skipped vouchers

**What's NOT in MVP** (Phase 2):
- Bulk email/print/download actions
- Advanced navigation (Previous button)
- MRZ scanner integration in wizard
- Persistence across browser refresh

---

## Implementation Steps

### Step 1: Update State Management in IndividualPurchase.jsx

**Add new state after line 29:**

```javascript
// Existing state
const [vouchers, setVouchers] = useState([]);

// ADD THIS - Registration wizard state
const [wizardProgress, setWizardProgress] = useState({
  currentIndex: 0,
  registeredVouchers: new Set(), // Set of voucher IDs that have been registered
  registeredData: {} // Map of voucherId -> { passportNumber, surname, givenName }
});
```

### Step 2: Modify List Step - Add "Start Wizard" Button

**Find the list step** (around line 84, where `if (step === 'list')` starts)

**Replace the section with vouchers.map()** (lines 96-131) with:

```javascript
<div className="space-y-4">
  {/* Show wizard button only if quantity > 1 */}
  {vouchers.length > 1 && (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold text-blue-900 mb-2">Register Multiple Vouchers</h4>
      <p className="text-sm text-blue-800 mb-4">
        Use the registration wizard to register all {vouchers.length} vouchers sequentially with status tracking.
      </p>
      <Button
        onClick={() => setStep('wizard')}
        className="bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        Start Registration Wizard →
      </Button>
    </div>
  )}

  {/* Individual voucher cards */}
  {vouchers.map((voucher) => (
    <Card key={voucher.id} className="p-4 border-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg">{voucher.voucherCode}</h3>
          <p className="text-sm text-gray-600">
            Status: <span className="text-yellow-600 font-semibold">Unregistered</span>
            {' '} | Valid until: {new Date(voucher.validUntil).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/app/voucher-registration?code=${voucher.voucherCode}`)}
            className="bg-green-600 hover:bg-green-700"
          >
            Register Passport →
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: 'Print Feature',
                description: 'Print blank voucher functionality coming soon'
              });
            }}
          >
            Print Blank
          </Button>
        </div>
      </div>
    </Card>
  ))}
</div>
```

### Step 3: Add Wizard Step (Minimal Version)

**Add this NEW section BEFORE the existing list step** (around line 84):

```javascript
// WIZARD STEP - MVP Version
if (step === 'wizard') {
  const currentVoucher = vouchers[wizardProgress.currentIndex];
  const isRegistered = wizardProgress.registeredVouchers.has(currentVoucher.id);
  const registeredCount = wizardProgress.registeredVouchers.size;
  const totalCount = vouchers.length;

  // Check if we're done (current index is past last voucher)
  if (wizardProgress.currentIndex >= vouchers.length) {
    // Move to completion
    setStep('completion');
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR - Voucher List with Status */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Batch Progress</CardTitle>
              <CardDescription>
                {registeredCount} of {totalCount} registered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vouchers.map((v, index) => {
                  const vIsRegistered = wizardProgress.registeredVouchers.has(v.id);
                  const vIsCurrent = index === wizardProgress.currentIndex;
                  const vData = wizardProgress.registeredData[v.id];

                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        vIsCurrent
                          ? 'border-blue-500 bg-blue-50'
                          : vIsRegistered
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setWizardProgress({ ...wizardProgress, currentIndex: index })}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {vIsRegistered ? (
                            <span className="text-green-600 text-lg">✅</span>
                          ) : (
                            <span className="text-yellow-500 text-lg">⏳</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-semibold truncate">{v.voucherCode}</p>
                          {vIsRegistered && vData ? (
                            <p className="text-xs text-gray-600 truncate">
                              {vData.passportNumber}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">Not registered</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT MAIN AREA - Registration Form */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>
                Registering Voucher {wizardProgress.currentIndex + 1} of {vouchers.length}
              </CardTitle>
              <CardDescription>
                Voucher Code: <span className="font-mono font-bold">{currentVoucher.voucherCode}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRegistered ? (
                /* Already Registered - Show Summary */
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">✅</span>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Already Registered</h3>
                      <p className="text-sm text-green-700">
                        This voucher has been registered with passport {wizardProgress.registeredData[currentVoucher.id]?.passportNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const nextIndex = wizardProgress.currentIndex + 1;
                        setWizardProgress({ ...wizardProgress, currentIndex: nextIndex });
                      }}
                    >
                      Next Voucher →
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Re-register (remove from registered set)
                        const newRegistered = new Set(wizardProgress.registeredVouchers);
                        newRegistered.delete(currentVoucher.id);
                        const newData = { ...wizardProgress.registeredData };
                        delete newData[currentVoucher.id];
                        setWizardProgress({
                          ...wizardProgress,
                          registeredVouchers: newRegistered,
                          registeredData: newData
                        });
                      }}
                    >
                      Re-register
                    </Button>
                  </div>
                </div>
              ) : (
                /* Registration Form - Simplified for MVP */
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>MVP Note:</strong> This is a simplified form. For full registration with MRZ scanner,
                      use the "Register Passport →" button on the voucher list page.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="passportNumber">Passport Number *</Label>
                    <Input
                      id="passportNumber"
                      placeholder="XX123456"
                      defaultValue=""
                    />
                  </div>

                  <div>
                    <Label htmlFor="surname">Surname *</Label>
                    <Input
                      id="surname"
                      placeholder="SMITH"
                      defaultValue=""
                    />
                  </div>

                  <div>
                    <Label htmlFor="givenName">Given Name *</Label>
                    <Input
                      id="givenName"
                      placeholder="JOHN"
                      defaultValue=""
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        // MVP: Just mark as registered with minimal data
                        const passportNumber = document.getElementById('passportNumber').value;
                        const surname = document.getElementById('surname').value;
                        const givenName = document.getElementById('givenName').value;

                        if (!passportNumber || !surname || !givenName) {
                          toast({
                            variant: 'destructive',
                            title: 'Missing Information',
                            description: 'Please fill in all required fields'
                          });
                          return;
                        }

                        // Add to registered set
                        const newRegistered = new Set(wizardProgress.registeredVouchers);
                        newRegistered.add(currentVoucher.id);

                        // Save registration data
                        const newData = {
                          ...wizardProgress.registeredData,
                          [currentVoucher.id]: { passportNumber, surname, givenName }
                        };

                        // Move to next
                        const nextIndex = wizardProgress.currentIndex + 1;

                        setWizardProgress({
                          currentIndex: nextIndex,
                          registeredVouchers: newRegistered,
                          registeredData: newData
                        });

                        toast({
                          title: 'Voucher Registered',
                          description: `Voucher ${currentVoucher.voucherCode} registered successfully`
                        });
                      }}
                      className="flex-1"
                    >
                      Register & Next →
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        // Skip this voucher
                        const nextIndex = wizardProgress.currentIndex + 1;
                        setWizardProgress({ ...wizardProgress, currentIndex: nextIndex });
                        toast({
                          title: 'Voucher Skipped',
                          description: 'You can return to register it later'
                        });
                      }}
                    >
                      Skip This One
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Add Completion Step

**Add this BEFORE the list step**:

```javascript
// COMPLETION STEP
if (step === 'completion') {
  const registeredIds = Array.from(wizardProgress.registeredVouchers);
  const registeredVouchers = vouchers.filter(v => registeredIds.includes(v.id));
  const unregisteredVouchers = vouchers.filter(v => !registeredIds.includes(v.id));

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Registration Wizard Complete</CardTitle>
          <CardDescription>
            {registeredIds.length} of {vouchers.length} vouchers have been registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Registered Vouchers */}
          {registeredVouchers.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 text-green-900">✅ Registered Vouchers</h3>
              <div className="space-y-3">
                {registeredVouchers.map(v => {
                  const data = wizardProgress.registeredData[v.id];
                  return (
                    <Card key={v.id} className="p-4 border-green-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold">{v.voucherCode}</p>
                          <p className="text-sm text-gray-600">
                            Passport: {data?.passportNumber} | {data?.surname}, {data?.givenName}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/app/voucher-registration?code=${v.voucherCode}`)}
                        >
                          View Full Details
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unregistered Vouchers */}
          {unregisteredVouchers.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 text-yellow-900">⏳ Unregistered Vouchers</h3>
              <div className="space-y-3">
                {unregisteredVouchers.map(v => (
                  <Card key={v.id} className="p-4 border-yellow-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-mono font-bold">{v.voucherCode}</p>
                        <p className="text-sm text-yellow-600">Not registered yet</p>
                      </div>
                      <Button
                        onClick={() => {
                          const index = vouchers.findIndex(vv => vv.id === v.id);
                          setWizardProgress({ ...wizardProgress, currentIndex: index });
                          setStep('wizard');
                        }}
                      >
                        Register Now →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end mt-8">
            <Button
              variant="outline"
              onClick={() => {
                // Reset everything
                setStep('create');
                setVouchers([]);
                setBatchId(null);
                setQuantity(1);
                setCollectedAmount(50);
                setCustomerEmail('');
                setWizardProgress({
                  currentIndex: 0,
                  registeredVouchers: new Set(),
                  registeredData: {}
                });
              }}
            >
              Create More Vouchers
            </Button>
            <Button onClick={() => navigate('/app/agent-landing')}>
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Testing the MVP

### Test Case 1: Single Voucher (Wizard Should NOT Appear)
1. Create 1 voucher
2. Verify "Start Registration Wizard" button does NOT appear
3. Only "Register Passport →" button should be visible

### Test Case 2: Two Vouchers
1. Create 2 vouchers
2. Click "Start Registration Wizard"
3. Register first voucher (enter passport number, surname, given name)
4. Click "Register & Next"
5. Verify sidebar shows first voucher as ✅ Registered
6. Register second voucher
7. Verify completion screen shows 2 of 2 registered

### Test Case 3: Skip Functionality
1. Create 3 vouchers
2. Start wizard
3. Register voucher #1
4. Skip voucher #2
5. Register voucher #3
6. Verify completion screen shows 2 of 3 registered
7. Click "Register Now" on unregistered voucher #2
8. Should return to wizard at voucher #2

### Test Case 4: Sidebar Navigation
1. Create 3 vouchers
2. Start wizard
3. Register voucher #1
4. Click on voucher #3 in sidebar
5. Should jump to voucher #3
6. Register it
7. Click on voucher #2 in sidebar
8. Should jump back to voucher #2

---

## What Happens After MVP

Once this MVP is tested and working:

### Phase 2 Enhancements:
1. **Integrate with actual backend registration API** (currently MVP just tracks locally)
2. **Add MRZ scanner support** in the wizard form
3. **Implement bulk actions**:
   - Email All Registered (one email, multiple PDFs)
   - Print All Registered (concatenated PDF)
   - Download All Registered (ZIP file)
4. **Add Previous button** for backward navigation
5. **Save progress to backend** (survive browser refresh)
6. **Add keyboard shortcuts** (Ctrl+→, Ctrl+←)

---

## Deployment Instructions

1. **Make the changes** to `IndividualPurchase.jsx` as described above
2. **Test locally** with `npm run dev`
3. **Build**: `npm run build`
4. **Deploy** `dist/` folder to production
5. **Restart PM2**: `pm2 restart png-green-fees`
6. **Test** with 2-3 voucher batches

---

**Status**: ✅ Implementation plan complete and ready to code
**Next Step**: Make the changes to IndividualPurchase.jsx following the steps above
