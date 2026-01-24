# Simplified Individual Purchase - Implementation Plan

**Date:** 2026-01-20
**Approach:** Reuse existing Online Purchase registration flow
**Status:** READY TO IMPLEMENT

---

## Key Insight

The **`/register/:voucherCode`** page already exists and works perfectly:
- MRZ scanner integration ✅
- Manual passport entry ✅
- Photo upload ✅
- Print/Email voucher ✅

**We just need to:**
1. Create vouchers WITHOUT passports
2. Show voucher list with "Register" links
3. Open `/register/:voucherCode` for each voucher
4. Agent uses existing MRZ check-in flow

---

## New Individual Purchase Flow

### Step 1: Voucher Creation (Extremely Simple)

```
┌─────────────────────────────────────────┐
│  Individual Purchase                     │
├─────────────────────────────────────────┤
│                                          │
│  Quantity: [1] [2] [3] [4] [5]          │
│                                          │
│  Payment Method:                         │
│    ● Cash                                │
│    ○ POS/Card                            │
│                                          │
│  Collected Amount: PGK [150.00]         │
│  (50.00 × 3 vouchers)                    │
│                                          │
│  Customer Email (optional):              │
│  [email@example.com]                     │
│                                          │
│  [Create 3 Vouchers →]                  │
└─────────────────────────────────────────┘
```

### Step 2: Voucher List with Registration Links

```
┌──────────────────────────────────────────────────────────┐
│  3 Vouchers Created - Batch: BATCH-20260120-001         │
│  Payment: PGK 150.00 (Cash)                              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ IND-W3G7K2                                         │ │
│  │ Status: Unregistered  │  Valid until: Jul 19, 2026│ │
│  │                                                     │ │
│  │ [Register Passport →]  [Skip]  [Print Blank]      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ IND-X4H8L3                                         │ │
│  │ Status: Unregistered  │  Valid until: Jul 19, 2026│ │
│  │                                                     │ │
│  │ [Register Passport →]  [Skip]  [Print Blank]      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ IND-Y5J9M4                                         │ │
│  │ Status: Unregistered  │  Valid until: Jul 19, 2026│ │
│  │                                                     │ │
│  │ [Register Passport →]  [Skip]  [Print Blank]      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Batch Actions:                                   │   │
│  │  [Print All (blank)]  [Email Batch]  [Done ✓]   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Step 3: Click "Register Passport" → Opens `/register/IND-W3G7K2`

**Existing page automatically:**
- Shows voucher details
- MRZ scanner ready
- Manual entry form available
- Photo upload (if needed)
- Print/Email options

---

## Implementation

### Backend Changes (5 minutes)

#### 1. Simplify Batch Creation Endpoint

**File:** `backend/routes/individual-purchases.js`

```javascript
// POST /api/individual-purchases/batch-simple
router.post('/batch-simple', auth, async (req, res) => {
  try {
    const { quantity, paymentMethod, collectedAmount, customerEmail } = req.body;
    const agentId = req.user.id;

    // Validate
    if (quantity < 1 || quantity > 5) {
      return res.status(400).json({ error: 'Quantity must be 1-5' });
    }

    const batchId = `BATCH-${Date.now()}`;
    const vouchers = [];

    // Create vouchers WITHOUT passports
    for (let i = 0; i < quantity; i++) {
      const voucherCode = generateVoucherCode('IND');

      const result = await db.query(`
        INSERT INTO individual_purchases (
          voucher_code,
          amount,
          payment_method,
          collected_amount,
          customer_email,
          batch_id,
          created_by,
          valid_from,
          valid_until,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '180 days', 'unregistered')
        RETURNING *
      `, [
        voucherCode,
        50, // Fixed amount
        paymentMethod,
        collectedAmount / quantity, // Split amount
        customerEmail,
        batchId,
        agentId
      ]);

      vouchers.push(result.rows[0]);
    }

    res.json({
      success: true,
      batchId,
      vouchers: vouchers.map(v => ({
        id: v.id,
        voucherCode: v.voucher_code,
        amount: v.amount,
        status: v.status,
        validUntil: v.valid_until
      }))
    });

  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### 2. Get Batch Vouchers (for list display)

```javascript
// GET /api/individual-purchases/batch/:batchId
router.get('/batch/:batchId', auth, async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await db.query(`
      SELECT
        ip.id,
        ip.voucher_code,
        ip.amount,
        ip.status,
        ip.valid_until,
        ip.passport_number,
        p.full_name as passport_name
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.batch_id = $1
      ORDER BY ip.created_at
    `, [batchId]);

    res.json({
      success: true,
      batchId,
      vouchers: result.rows
    });

  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend Changes (30 minutes)

#### 1. Simplified `IndividualPurchase.jsx`

**Replace entire file with:**

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';

const VOUCHER_AMOUNT = 50;

export default function IndividualPurchase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState('create'); // 'create' | 'list'
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [collectedAmount, setCollectedAmount] = useState(50);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batchId, setBatchId] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  const totalAmount = quantity * VOUCHER_AMOUNT;

  const handleQuantityChange = (newQty) => {
    setQuantity(newQty);
    setCollectedAmount(newQty * VOUCHER_AMOUNT);
  };

  const handleCreateVouchers = async () => {
    try {
      setIsSubmitting(true);

      const response = await api.post('/individual-purchases/batch-simple', {
        quantity,
        paymentMethod,
        collectedAmount,
        customerEmail: customerEmail || null
      });

      if (response.success) {
        setBatchId(response.batchId);
        setVouchers(response.vouchers);
        setStep('list');

        toast({
          title: 'Vouchers Created!',
          description: `${quantity} voucher(s) created successfully.`
        });
      }

    } catch (error) {
      console.error('Error creating vouchers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create vouchers'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'list') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Vouchers Created - Batch: {batchId}</CardTitle>
            <p className="text-sm text-gray-600">
              Payment: PGK {totalAmount.toFixed(2)} ({paymentMethod})
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vouchers.map((voucher) => (
                <Card key={voucher.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{voucher.voucherCode}</h3>
                      <p className="text-sm text-gray-600">
                        Status: <span className="text-yellow-600">Unregistered</span>
                        {' '} | Valid until: {new Date(voucher.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(`/register/${voucher.voucherCode}`, '_blank')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Register Passport →
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {/* Print blank voucher */}}
                      >
                        Print Blank
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('create');
                  setVouchers([]);
                  setBatchId(null);
                }}
              >
                Create More Vouchers
              </Button>
              <Button onClick={() => navigate('/app/vouchers')}>
                View All Vouchers →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Individual Purchase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quantity Selector */}
          <div>
            <Label>Quantity</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={quantity === num ? 'default' : 'outline'}
                  onClick={() => handleQuantityChange(num)}
                  className="w-12 h-12"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="POS" id="pos" />
                <Label htmlFor="pos">POS/Card</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div>
            <Label>Collected Amount</Label>
            <Input
              type="number"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(parseFloat(e.target.value))}
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Total: PGK {totalAmount.toFixed(2)} ({VOUCHER_AMOUNT} × {quantity} vouchers)
            </p>
          </div>

          {/* Customer Email (Optional) */}
          <div>
            <Label>Customer Email (Optional)</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional - for sending vouchers later
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreateVouchers}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Creating...' : `Create ${quantity} Voucher(s) →`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Migration from Current Implementation

### Option 1: Clean Slate (Recommended)
1. Remove all batch purchase complexity
2. Deploy simple version above
3. Test with 1-5 vouchers

### Option 2: Gradual Migration
1. Keep current code
2. Add `/batch-simple` endpoint alongside
3. Update IndividualPurchase.jsx to use simple flow
4. Remove old batch logic after testing

---

## Benefits

### 1. Extreme Simplicity
- **Voucher creation:** 50 lines of code
- **No passport validation:** Not needed upfront
- **No complex state:** Just quantity + payment

### 2. Reuses Proven Code
- `/register/:voucherCode` already works
- MRZ scanner already integrated
- Print/email already functional

### 3. Flexible Workflow
- Register passports immediately OR later
- Can print blank vouchers
- Can email voucher codes for self-registration

### 4. Database Clean
- No nullable passport issues
- Simple INSERT (no complex transaction)
- Easy to understand queries

---

## Testing Checklist

### Create Vouchers
- [ ] Select quantity: 3
- [ ] Choose payment: Cash
- [ ] Enter amount: 150
- [ ] Click "Create 3 Vouchers"
- [ ] See batch list with 3 vouchers

### Register First Voucher
- [ ] Click "Register Passport →" on voucher 1
- [ ] Opens `/register/IND-xxxxx` in new tab
- [ ] Scan MRZ passport with KB scanner
- [ ] Form auto-fills
- [ ] Click "Register"
- [ ] Print or email voucher

### Register Remaining Vouchers
- [ ] Return to voucher list (keep tab open)
- [ ] Click "Register Passport" on voucher 2
- [ ] Scan different passport
- [ ] Register successfully
- [ ] Repeat for voucher 3

### Batch Complete
- [ ] All 3 vouchers show "Registered"
- [ ] Can view all in Vouchers List
- [ ] Can search by batch ID

---

## Database Migration (Optional)

Only if you want status tracking:

```sql
-- Add status column to individual_purchases
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing records
UPDATE individual_purchases
SET status = CASE
  WHEN passport_number IS NOT NULL THEN 'registered'
  ELSE 'unregistered'
END
WHERE status IS NULL OR status = 'active';
```

---

## Deployment Steps

### 1. Backend (10 minutes)
```bash
# Add batch-simple endpoint to individual-purchases.js
# Add batch/:batchId GET endpoint
# Test with Postman

# Deploy backend
scp backend/routes/individual-purchases.js user@server:/path/to/backend/routes/
pm2 restart greenpay-api
```

### 2. Frontend (15 minutes)
```bash
# Replace IndividualPurchase.jsx with simple version
npm run build

# Upload dist/ folder via CloudPanel
# Restart frontend
pm2 restart png-green-fees
```

### 3. Test (10 minutes)
- Create 3 vouchers
- Register 2 with MRZ scanner
- Leave 1 unregistered
- Print both registered and blank vouchers

**Total Time:** 35 minutes

---

## Quotation Filters (Separate Task)

See redesign document for filter implementation (copy from Invoices.jsx).

---

## Summary

**Instead of complex batch logic:**
- ❌ Collecting passports before payment
- ❌ Complex state management
- ❌ Database schema issues

**We simply:**
- ✅ Create vouchers (like online purchase)
- ✅ Use existing registration page
- ✅ Reuse MRZ scanner check-in
- ✅ Print/email from existing page

**Result:** 1/10th the code, 10x more reliable!

---

**Ready to implement this simplified approach?**
