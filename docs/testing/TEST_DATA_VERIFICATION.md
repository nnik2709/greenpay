# Test Data Verification Report

## ✅ Verification Complete

I have verified that all test data in `tests/production/test-data/form-data.ts` matches the actual form fields used in the GreenPay application.

---

## 1. Individual Passport Purchase Form

**File**: `src/pages/IndividualPurchase.jsx`

### ✅ Field Mapping Verified

| Form Field | Test Data Field | Type | Required | Notes |
|------------|-----------------|------|----------|-------|
| `passportNumber` | ✅ `passport.passportNumber` | text | Yes | e.g., PNG12345678 |
| `surname` | ✅ `passport.surname` | text | Yes | e.g., TESTUSER |
| `givenName` | ✅ `passport.givenName` | text | Yes | e.g., JOHN MICHAEL |
| `nationality` | ✅ `passport.nationality` | text | Yes | Papua New Guinea |
| `dob` | ✅ `passport.dob` | date | Yes | Format: YYYY-MM-DD |
| `sex` | ✅ `passport.sex` | select | Yes | Options: M, F |
| `dateOfExpiry` | ✅ `passport.dateOfExpiry` | date | Yes | Format: YYYY-MM-DD |

### ✅ Corrections Made

- **Changed**: `dateOfBirth` → `dob` (matches actual field name)
- **Added**: Comments indicating M/F options for sex field
- **Added**: Optional fields (placeOfBirth, dateOfIssue, placeOfIssue, fileNumber)

---

## 2. Quotation Form

**File**: `src/pages/CreateQuotation.jsx`

### ✅ Field Mapping Verified

| Form Field | Test Data Field | Type | Required | Notes |
|------------|-----------------|------|----------|-------|
| `companyName` | ✅ `quotation.companyName` | text | Yes | From customer selector |
| `contactPerson` | ✅ `quotation.contactPerson` | text | Yes | From customer selector |
| `contactEmail` | ✅ `quotation.contactEmail` | email | Yes | nnik.area9@gmail.com |
| `contactPhone` | ✅ `quotation.contactPhone` | tel | No | +675 7123 4567 |
| `numberOfPassports` | ✅ `quotation.numberOfPassports` | number | Yes | e.g., 10 |
| `amountPerPassport` | ✅ `quotation.amountPerPassport` | number | Auto | Fixed at 50.00 PGK |
| `discount` | ✅ `quotation.discount` | number | No | Percentage (0-100) |
| `validUntil` | ✅ `quotation.validUntil()` | date | Yes | Function returns date |
| `notes` | ✅ `quotation.notes` | textarea | No | Additional notes |

### ✅ Validation

- Email field uses `nnik.area9@gmail.com` for all tests (manual verification)
- `validUntil()` is a function that returns next month's date
- `discount` is optional percentage field
- All field names match exactly

---

## 3. Invoice Payment Form

**File**: `src/pages/Invoices.jsx`

### ✅ Field Mapping Verified

| Form Field | Test Data Field | Type | Required | Notes |
|------------|-----------------|------|----------|-------|
| `paymentAmount` | ✅ `invoice.paymentAmount` | number | Yes | e.g., 50.00 |
| `paymentMethod` | ✅ `invoice.paymentMethod` | select | Yes | Default: CASH |
| `paymentReference` | ✅ `invoice.paymentReference` | text | No | TEST-{timestamp} |
| `paymentNotes` | ✅ `invoice.paymentNotes` | textarea | No | Automated test payment |

### ✅ Payment Method Options

| Option | Test Data Constant |
|--------|-------------------|
| CASH | ✅ `paymentModes.cash` |
| CARD | ✅ `paymentModes.card` |
| BSP | ✅ `paymentModes.bsp` |
| KINA_BANK | ✅ `paymentModes.kinaBank` |
| BANK_TRANSFER | ✅ `paymentModes.bankTransfer` |

All payment method constants match backend values.

---

## 4. Bulk Upload CSV Format

**File**: `src/pages/BulkPassportUpload.jsx`

### ✅ CSV Column Mapping Verified

#### Required Fields (7)

| CSV Column | Test Data Field | Format | Example |
|------------|-----------------|--------|---------|
| `passportNo` | ✅ `bulkUpload.sampleRow.passportNo` | text | PNG123456789 |
| `surname` | ✅ `bulkUpload.sampleRow.surname` | text | DOE |
| `givenName` | ✅ `bulkUpload.sampleRow.givenName` | text | JOHN |
| `nationality` | ✅ `bulkUpload.sampleRow.nationality` | text | Papua New Guinea |
| `dob` | ✅ `bulkUpload.sampleRow.dob` | date | 1990-01-01 |
| `sex` | ✅ `bulkUpload.sampleRow.sex` | text | Male/Female |
| `dateOfExpiry` | ✅ `bulkUpload.sampleRow.dateOfExpiry` | date | 2030-01-01 |

#### Optional Fields (6)

| CSV Column | Test Data Field | Enabled by Default |
|------------|-----------------|-------------------|
| `placeOfBirth` | ✅ `bulkUpload.sampleRow.placeOfBirth` | No (disabled) |
| `placeOfIssue` | ✅ `bulkUpload.sampleRow.placeOfIssue` | No (disabled) |
| `dateOfIssue` | ✅ `bulkUpload.sampleRow.dateOfIssue` | No (disabled) |
| `fileNumber` | ✅ `bulkUpload.sampleRow.fileNumber` | No (disabled) |
| `email` | ✅ `bulkUpload.sampleRow.email` | No (disabled) |
| `phone` | ✅ `bulkUpload.sampleRow.phone` | No (disabled) |

### ✅ New Test Data Added

Added comprehensive bulk upload section:
```typescript
bulkUpload: {
  requiredFields: [...],  // Array of required CSV columns
  optionalFields: [...],  // Array of optional CSV columns
  sampleRow: {...},       // Complete sample CSV row
}
```

---

## 5. Date Formats

### ✅ All Date Fields Use YYYY-MM-DD

| Field | Format | Example |
|-------|--------|---------|
| `dob` | YYYY-MM-DD | 1985-06-15 |
| `dateOfExpiry` | YYYY-MM-DD | 2030-01-14 |
| `dateOfIssue` | YYYY-MM-DD | 2020-01-15 |
| `validUntil` | YYYY-MM-DD | 2025-01-13 |

All date fields use HTML5 input type="date" format.

---

## 6. Nationality Field

### ✅ Verified Nationality Options

The application uses **NationalityCombobox** component which provides:
- Searchable dropdown
- Common nationalities list
- **Primary value**: "Papua New Guinea"

Test data correctly uses: `nationality: 'Papua New Guinea'`

---

## 7. Sex/Gender Field

### ✅ Verified Options

The form uses `<Select>` with these options:
- **M** (Male)
- **F** (Female)

Test data uses: `sex: 'M'`

**Note**: Bulk upload uses full words ("Male"/"Female"), individual form uses letters ("M"/"F").

---

## 8. Email for Manual Verification

### ✅ Consistent Email Usage

All test data that requires email uses:
```typescript
email.primary: 'nnik.area9@gmail.com'
```

Used in:
- Quotation contact email
- Invoice notifications
- Bulk upload optional email
- Customer email
- All form email fields

---

## Summary of Changes

### ✅ Updated Fields

1. **Passport data**:
   - `dateOfBirth` → `dob` (corrected field name)
   - Added comments for field types and options
   - Added optional fields (placeOfBirth, dateOfIssue, etc.)

2. **Bulk upload data**:
   - Added complete `bulkUpload` section
   - Listed all required and optional CSV columns
   - Provided sample CSV row with correct field names
   - Added sex format note (Male/Female vs M/F)

3. **Documentation**:
   - Added inline comments for all fields
   - Specified exact options for select fields
   - Noted date formats (YYYY-MM-DD)

---

## Testing Recommendations

### 1. Individual Passport Form Test

```typescript
await page.fill('[name="passportNumber"]', TEST_DATA.passport.passportNumber);
await page.fill('[name="surname"]', TEST_DATA.passport.surname);
await page.fill('[name="givenName"]', TEST_DATA.passport.givenName);
await page.fill('[name="nationality"]', TEST_DATA.passport.nationality);
await page.fill('[name="dob"]', TEST_DATA.passport.dob);
await page.selectOption('[name="sex"]', TEST_DATA.passport.sex);
await page.fill('[name="dateOfExpiry"]', TEST_DATA.passport.dateOfExpiry);
```

### 2. Quotation Form Test

```typescript
// Select customer first, then:
await page.fill('[name="numberOfPassports"]', TEST_DATA.quotation.numberOfPassports);
await page.fill('[name="discount"]', TEST_DATA.quotation.discount);
await page.fill('[name="validUntil"]', TEST_DATA.quotation.validUntil());
await page.fill('[name="notes"]', TEST_DATA.quotation.notes);
```

### 3. Payment Form Test

```typescript
await page.fill('[name="paymentAmount"]', TEST_DATA.invoice.paymentAmount);
await page.selectOption('[name="paymentMethod"]', TEST_DATA.invoice.paymentMethod);
await page.fill('[name="paymentReference"]', TEST_DATA.invoice.paymentReference);
await page.fill('[name="paymentNotes"]', TEST_DATA.invoice.paymentNotes);
```

### 4. Bulk Upload CSV Generation

```typescript
const headers = TEST_DATA.bulkUpload.requiredFields.join(',');
const row = Object.values(TEST_DATA.bulkUpload.sampleRow).join(',');
const csvContent = `${headers}\n${row}`;
```

---

## ✅ Conclusion

All test data has been verified and corrected to match the exact field names, data types, and formats used in the GreenPay application forms.

**Status**: Ready for test implementation ✅
