# Payment Methods Standardized - January 25, 2026

## ✅ Payment Method Values

Your system uses **4 standard payment methods**:

| Payment Method | Description | Where Used |
|---------------|-------------|------------|
| **CASH** | Cash payment at agent desk | Counter Agent |
| **POS** | Card payment at agent desk (EFTPOS) | Counter Agent |
| **ONLINE** | Customer online payment via gateway | buy-online, DOKU, BSP |
| **BANK TRANSFER** | Invoice payment via bank transfer | Corporate invoices |

---

## 🔧 Files Updated

All online payment gateways now correctly use `payment_method = 'ONLINE'`:

### 1. **buy-online.js** (Lines 1117, 1270)
```javascript
// BEFORE: paymentData.paymentMethod || 'Card'
// AFTER:  paymentData.paymentMethod || 'ONLINE'
```

### 2. **payment-webhook-doku.js** (Line 255)
```javascript
// BEFORE: 'Card'
// AFTER:  'ONLINE'
```

### 3. **public-purchases.js** (Lines 369, 979)
```javascript
// BEFORE: paymentData?.paymentMethod || 'VISA'
// BEFORE: paymentData.paymentMethod || 'Card'
// AFTER:  'ONLINE'
```

---

## 📊 Database Migration Logic

The migration maps existing NULL records intelligently:

```sql
UPDATE individual_purchases
SET payment_method = CASE
  -- Online gateways -> ONLINE
  WHEN payment_mode ILIKE '%doku%' THEN 'ONLINE'
  WHEN payment_mode ILIKE '%bsp%' THEN 'ONLINE'
  WHEN payment_mode ILIKE '%ipg%' THEN 'ONLINE'

  -- Cash -> CASH
  WHEN payment_mode ILIKE '%cash%' THEN 'CASH'

  -- POS/EFTPOS -> POS
  WHEN payment_mode ILIKE '%pos%' THEN 'POS'

  -- Bank -> BANK TRANSFER
  WHEN payment_mode ILIKE '%bank%' THEN 'BANK TRANSFER'
  WHEN payment_mode ILIKE '%transfer%' THEN 'BANK TRANSFER'

  -- Default -> ONLINE (most payments are via gateway)
  ELSE 'ONLINE'
END
WHERE payment_method IS NULL;
```

### Example Mappings:
- `payment_mode = 'BSP DOKU Card'` → `payment_method = 'ONLINE'`
- `payment_mode = 'BSP IPG'` → `payment_method = 'ONLINE'`
- `payment_mode = 'Cash'` → `payment_method = 'CASH'`
- `payment_mode = 'POS'` → `payment_method = 'POS'`
- `payment_mode = 'Bank Transfer'` → `payment_method = 'BANK TRANSFER'`

---

## 🎯 Usage by Role

### **Counter Agent** (at desk)
Creates vouchers with:
- `payment_method = 'CASH'` (cash payments)
- `payment_method = 'POS'` (card payments via EFTPOS)

### **Customer** (online)
Creates vouchers with:
- `payment_method = 'ONLINE'` (via buy-online, DOKU, BSP gateways)

### **Finance/Admin** (invoices)
Creates corporate purchases with:
- `payment_method = 'BANK TRANSFER'` (when invoice paid via bank)
- `payment_method = 'ONLINE'` (when invoice paid via gateway)

---

## 📦 Deployment Files

All 4 files need to be deployed:

1. ✅ `backend/routes/buy-online.js` - Changed 'Card' → 'ONLINE'
2. ✅ `backend/routes/payment-webhook-doku.js` - Changed 'Card' → 'ONLINE'
3. ✅ `backend/routes/public-purchases.js` - Changed 'VISA'/'Card' → 'ONLINE'
4. ✅ `database/migrations/fix-null-payment-method.sql` - Updated mapping logic

---

## ✅ After Deployment

Run this query to verify payment methods:

```sql
SELECT
  payment_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM individual_purchases
GROUP BY payment_method
ORDER BY count DESC;
```

**Expected results:**
```
payment_method  | count | percentage
----------------|-------|------------
ONLINE          | 450   | 75.00
CASH            | 100   | 16.67
POS             | 40    | 6.67
BANK TRANSFER   | 10    | 1.67
```

**No NULL values should exist:**
```sql
SELECT COUNT(*) FROM individual_purchases WHERE payment_method IS NULL;
-- Expected: 0
```

---

## 🔄 Payment Flow

### Online Purchase Flow:
1. Customer visits buy-online page
2. Pays via DOKU/BSP gateway
3. Webhook creates voucher with `payment_method = 'ONLINE'`
4. Frontend displays "ONLINE" in payments list ✅

### Agent Desk Flow:
1. Customer visits counter
2. Agent creates voucher via IndividualPurchase page
3. Selects payment method from dropdown: CASH or POS
4. Voucher created with selected method
5. Frontend displays "CASH" or "POS" ✅

### Invoice Flow:
1. Corporate customer requests invoice
2. Finance creates quotation → invoice
3. Customer pays via bank transfer
4. Finance marks payment with `payment_method = 'BANK TRANSFER'`
5. Vouchers generated with "BANK TRANSFER" ✅

---

**Status:** ✅ STANDARDIZED
**Date:** January 25, 2026
**Files Modified:** 4 files
