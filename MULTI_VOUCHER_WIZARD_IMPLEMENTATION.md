# Multi-Voucher Registration Wizard - Implementation Plan

**Status**: Ready to implement
**Priority**: HIGH (Second issue after user registration fix)
**Estimated Time**: 6-8 hours for Phase 1

---

## Current Problem

When an agent purchases multiple vouchers (quantity > 1):
1. After voucher creation, they see a list of unregistered vouchers
2. Clicking "Register Passport →" navigates to `/app/voucher-registration?code=XXXXX`
3. After registering ONE voucher, user is left on success screen
4. No easy way to return to the batch - remaining vouchers are "lost"
5. Agent must manually navigate back or remember voucher codes

---

## Proposed Solution: Inline Registration Wizard

### Architecture Overview

**Step Flow:**
```
create → list → wizard → completion
```

1. **create**: Agent enters payment details and quantity (1-5)
2. **list**: Shows all created vouchers with "Start Registration Wizard" button
3. **wizard**: Inline registration UI with sidebar status tracker
4. **completion**: Summary + bulk actions (Print All, Email All, Download All)

### Key Features

1. **Sidebar Status Tracker** (always visible)
   - Shows all vouchers in batch with status icons
   - ✅ Registered (green) - shows passport number
   - ⏳ Pending (yellow) - shows "Not registered yet"
   - ⏭️ Skipped (gray) - shows "Skipped for now"
   - Click any voucher to jump to it

2. **Main Registration Area**
   - Current voucher details (code, valid until)
   - Inline passport entry form with MRZ scanner support
   - Progress indicator: "Registering 2 of 5"

3. **Wizard Navigation**
   - "Previous" button (disabled on first voucher)
   - "Skip This One" button (mark as skipped, move to next)
   - "Register & Next →" button (submit + move to next)

4. **Completion Screen**
   - Summary: "3 of 5 vouchers registered"
   - List all vouchers with individual Print/Email/Download
   - Bulk actions:
     - "Print All Registered" → concatenated PDF for printing
     - "Email All Registered" → one email with multiple PDF attachments
     - "Download All Registered" → ZIP of individual PDFs

---

## Implementation Steps

### Phase 1: Frontend Wizard UI

**File**: `src/pages/IndividualPurchase.jsx`

**Changes:**
1. Add new step: `'wizard'` (between 'list' and 'completion')
2. Add state management for wizard:
   ```javascript
   const [registrationProgress, setRegistrationProgress] = useState({
     currentIndex: 0,
     registeredVouchers: new Set(), // Set of voucher IDs
     skippedVouchers: new Set(),    // Set of voucher IDs
     passportData: {}               // Map of voucherId -> passport data
   });
   ```

3. Add wizard UI components:
   - **VoucherSidebar**: List of all vouchers with status
   - **PassportRegistrationForm**: Inline passport entry (reused from CorporateVoucherRegistration)
   - **WizardControls**: Previous/Skip/Next buttons

4. Modify "list" step:
   - Add "Start Registration Wizard" button
   - Keep individual "Register Passport →" for single-voucher workflow
   - Button only appears if quantity > 1

**Code Structure:**
```jsx
if (step === 'wizard') {
  const currentVoucher = vouchers[registrationProgress.currentIndex];

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - 3 columns */}
        <div className="col-span-3">
          <VoucherSidebar
            vouchers={vouchers}
            currentIndex={registrationProgress.currentIndex}
            registeredVouchers={registrationProgress.registeredVouchers}
            skippedVouchers={registrationProgress.skippedVouchers}
            onVoucherClick={(index) => setRegistrationProgress({
              ...registrationProgress,
              currentIndex: index
            })}
          />
        </div>

        {/* Main Area - 9 columns */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>
                Registering {registrationProgress.currentIndex + 1} of {vouchers.length}
              </CardTitle>
              <CardDescription>
                Voucher: {currentVoucher.voucherCode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PassportRegistrationForm
                voucherId={currentVoucher.id}
                voucherCode={currentVoucher.voucherCode}
                onSuccess={(passportData) => handleRegistrationSuccess(currentVoucher.id, passportData)}
                onSkip={() => handleSkipVoucher(currentVoucher.id)}
              />
            </CardContent>
          </Card>

          <WizardControls
            currentIndex={registrationProgress.currentIndex}
            totalVouchers={vouchers.length}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onNext={handleNext}
            canGoNext={registrationProgress.registeredVouchers.has(currentVoucher.id)}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 2: Backend Bulk Actions

**New Endpoints:**

#### 1. POST /api/vouchers/bulk-email
```javascript
// Sends ONE email with MULTIPLE PDF attachments
// Each voucher = separate PDF file
{
  voucherIds: [1, 2, 3],
  recipientEmail: "customer@example.com"
}

Response:
{
  success: true,
  emailsSent: 1,
  voucherCount: 3,
  recipient: "customer@example.com"
}
```

#### 2. POST /api/vouchers/bulk-download
```javascript
// Returns ZIP file containing individual PDFs
{
  voucherIds: [1, 2, 3]
}

Response: (binary ZIP file)
Content-Type: application/zip
Content-Disposition: attachment; filename="vouchers-batch-{batchId}.zip"
```

#### 3. POST /api/vouchers/bulk-print
```javascript
// Returns concatenated multi-page PDF for printing
// (Individual vouchers on separate pages, no page breaks between)
{
  voucherIds: [1, 2, 3]
}

Response: (binary PDF file)
Content-Type: application/pdf
Content-Disposition: inline; filename="vouchers-batch-{batchId}-print.pdf"
```

**Important**: Each voucher maintains its own separate PDF. Bulk operations collect/concatenate individual PDFs.

---

### Phase 3: Completion Screen

**File**: `src/pages/IndividualPurchase.jsx`

Add new step: `'completion'` (after wizard)

```jsx
if (step === 'completion') {
  const registeredIds = Array.from(registrationProgress.registeredVouchers);
  const registeredVouchers = vouchers.filter(v => registeredIds.includes(v.id));
  const unregisteredVouchers = vouchers.filter(v => !registeredIds.includes(v.id));

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Batch Registration Complete</CardTitle>
          <CardDescription>
            {registeredIds.length} of {vouchers.length} vouchers registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions - Only for registered vouchers */}
          {registeredIds.length > 0 && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-4">Bulk Actions</h3>
              <div className="flex gap-4">
                <Button onClick={() => handleBulkEmail(registeredIds)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email All ({registeredIds.length})
                </Button>
                <Button onClick={() => handleBulkPrint(registeredIds)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print All ({registeredIds.length})
                </Button>
                <Button onClick={() => handleBulkDownload(registeredIds)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download All ({registeredIds.length})
                </Button>
              </div>
            </div>
          )}

          {/* Registered Vouchers List */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">✅ Registered Vouchers</h3>
            <div className="space-y-3">
              {registeredVouchers.map(voucher => (
                <Card key={voucher.id} className="p-4 border-green-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{voucher.voucherCode}</p>
                      <p className="text-sm text-gray-600">
                        Passport: {registrationProgress.passportData[voucher.id]?.passportNumber}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlePrintOne(voucher.id)}>
                        Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEmailOne(voucher.id)}>
                        Email
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadOne(voucher.id)}>
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Unregistered Vouchers (if any) */}
          {unregisteredVouchers.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4">⏳ Unregistered Vouchers</h3>
              <div className="space-y-3">
                {unregisteredVouchers.map(voucher => (
                  <Card key={voucher.id} className="p-4 border-yellow-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{voucher.voucherCode}</p>
                        <p className="text-sm text-yellow-600">Not registered yet</p>
                      </div>
                      <Button onClick={() => {
                        // Return to wizard for this voucher
                        const index = vouchers.findIndex(v => v.id === voucher.id);
                        setRegistrationProgress({...registrationProgress, currentIndex: index});
                        setStep('wizard');
                      }}>
                        Register Now →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-4 justify-end">
            <Button variant="outline" onClick={() => {
              // Reset and create new batch
              setStep('create');
              setVouchers([]);
              setBatchId(null);
              setRegistrationProgress({
                currentIndex: 0,
                registeredVouchers: new Set(),
                skippedVouchers: new Set(),
                passportData: {}
              });
            }}>
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

## Testing Checklist

### Functional Tests
- [ ] Create batch of 1 voucher - wizard should NOT appear
- [ ] Create batch of 2 vouchers - wizard should appear
- [ ] Create batch of 5 vouchers - test full wizard flow
- [ ] Register all vouchers sequentially
- [ ] Skip some vouchers, register others
- [ ] Use Previous button to go back
- [ ] Click voucher in sidebar to jump
- [ ] Verify status icons update correctly
- [ ] Test MRZ scanner in wizard
- [ ] Test manual passport entry in wizard

### Bulk Actions Tests
- [ ] Email all registered vouchers
- [ ] Print all registered vouchers (concatenated PDF)
- [ ] Download all registered vouchers (ZIP file)
- [ ] Individual print/email/download from completion screen
- [ ] Return to wizard from completion for unregistered vouchers

### Edge Cases
- [ ] All vouchers skipped - completion screen
- [ ] Register 1, skip rest - completion screen shows both sections
- [ ] Customer email not provided - prompt before bulk email
- [ ] Browser refresh mid-wizard - state lost (acceptable for MVP)
- [ ] Very large batches (>10 vouchers) - pagination needed?

---

## Deployment Strategy

1. **Build frontend with wizard** (no backend changes yet)
2. **Deploy to staging** - test wizard UI
3. **Implement backend bulk endpoints**
4. **Deploy backend** - test bulk actions
5. **Full E2E test** on staging
6. **Deploy to production**
7. **User acceptance testing**

---

## Future Enhancements (Post-MVP)

- [ ] Save wizard progress to backend (survive browser refresh)
- [ ] Pagination for batches > 10 vouchers
- [ ] Keyboard shortcuts (Ctrl+→ = Next, Ctrl+← = Previous)
- [ ] Auto-advance after successful registration
- [ ] Batch email template customization
- [ ] Print preview before bulk print
- [ ] Download individual or bulk as single merged PDF option

---

**Next Step**: Begin implementation of Phase 1 (Wizard UI in IndividualPurchase.jsx)
