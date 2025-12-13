# Frontend Invoice System - Ready to Deploy

## ✅ Completed Components

### 1. **GST Utilities** (`src/lib/gstUtils.js`)
Complete PNG GST calculation and formatting utilities:

**Functions**:
- `calculateGST(subtotal, gstRate)` - Calculate 10% GST
- `calculateTotals(items)` - Calculate subtotal, GST, total from items
- `formatPGK(amount)` - Format as PNG Kina (K 1,234.56)
- `generateDocNumber(prefix, seq)` - INV-YYYYMM-XXXX format
- `isOverdue(dueDate, status)` - Check if invoice overdue
- `getStatusBadgeClass(status)` - Tailwind classes for badges
- `validateTIN(tin)` - Validate PNG TIN format
- And more...

### 2. **Invoice Service** (`src/lib/invoiceService.js`)
Complete API integration layer:

**Functions**:
- `getInvoices(filters)` - Get all invoices with filters
- `getInvoice(id)` - Get invoice details + payments
- `convertQuotationToInvoice(data)` - Convert quotation
- `recordPayment(invoiceId, paymentData)` - Record payment
- `getPaymentHistory(invoiceId)` - Get payment history
- `generateVouchers(invoiceId)` - Generate green passes
- `getInvoiceStatistics()` - Get stats for dashboard
- `canConvertToInvoice(quotation)` - Validation helper
- `canRecordPayment(invoice)` - Validation helper
- `canGenerateVouchers(invoice)` - Validation helper

### 3. **Invoices Page** (`src/pages/Invoices.jsx`)
Full-featured invoice management page:

**Features**:
✓ Statistics dashboard (Total, Pending, Partial, Paid, Overdue)
✓ Financial summary (Total Value, Collected, Outstanding)
✓ Advanced filters (Status, Customer, Date Range)
✓ Invoice list table with all details
✓ Payment progress bars
✓ Record Payment modal
✓ Generate Vouchers modal
✓ Status badges (color-coded)
✓ Overdue detection
✓ Professional clean design (no icons)

**Workflow**:
1. View all invoices with filters
2. Click "Record Payment" → Enter amount, method, reference
3. Auto-updates invoice status (pending → partial → paid)
4. When paid, click "Generate Vouchers" → Creates green passes
5. Vouchers linked to invoice

## 📋 Still To Do

### 1. Add Route to App.jsx

Add to `src/App.jsx`:

```javascript
import Invoices from '@/pages/Invoices';

// In routes section:
<Route path="/invoices" element={
  <PrivateRoute roles={['Flex_Admin', 'Finance_Manager', 'IT_Support']}>
    <Invoices />
  </PrivateRoute>
} />
```

### 2. Add to Header Navigation

Add to `src/components/Header.jsx`:

```javascript
{
  to: '/invoices',
  label: 'Invoices',
  roles: ['Flex_Admin', 'Finance_Manager', 'IT_Support']
}
```

### 3. Update Quotations Page

Add "Convert to Invoice" button to `src/pages/Quotations.jsx`:

```javascript
import { convertQuotationToInvoice, canConvertToInvoice } from '@/lib/invoiceService';

// Add invoice conversion modal state
const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
const [dueDays, setDueDays] = useState(30);

// Add button in actions column (after Approve button):
{canConvertToInvoice(quotation) && !quotation.converted_to_invoice && (
  <Button
    size="sm"
    className="bg-blue-600 hover:bg-blue-700"
    onClick={() => {
      setSelectedQuotation(quotation);
      setInvoiceModalOpen(true);
    }}
  >
    Convert to Invoice
  </Button>
)}

// Add modal dialog for invoice conversion:
<Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
  <DialogHeader>
    <DialogTitle>Convert to Tax Invoice</DialogTitle>
    <DialogDescription>
      Create PNG GST-compliant tax invoice from this quotation
    </DialogDescription>
  </DialogHeader>

  <div className="space-y-4">
    <div>
      <Label>Payment Terms (Due Days)</Label>
      <select value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))}>
        <option value={0}>Due on receipt</option>
        <option value={7}>Net 7 days</option>
        <option value={14}>Net 14 days</option>
        <option value={30}>Net 30 days</option>
        <option value={60}>Net 60 days</option>
        <option value={90}>Net 90 days</option>
      </select>
    </div>
  </div>

  <DialogFooter>
    <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>Cancel</Button>
    <Button onClick={async () => {
      await convertQuotationToInvoice({
        quotation_id: selectedQuotation.id,
        due_days: dueDays
      });
      toast({ title: 'Invoice Created!', description: 'Quotation converted to tax invoice' });
      setInvoiceModalOpen(false);
      loadQuotations();
    }}>
      Create Invoice
    </Button>
  </DialogFooter>
</Dialog>
```

## 🗂️ File Structure

```
src/
├── lib/
│   ├── gstUtils.js             ✅ Created
│   ├── invoiceService.js       ✅ Created
│   └── api/
│       └── client.js           (existing)
│
├── pages/
│   ├── Invoices.jsx            ✅ Created
│   └── Quotations.jsx          ⏳ Needs update
│
└── components/
    ├── Header.jsx              ⏳ Needs update
    └── ui/                     (existing)
```

```
backend/
└── routes/
    └── invoices-gst.js         ✅ Created
```

```
migrations/
├── 01-update-quotations-for-invoices.sql    ✅ Created
├── 02-create-invoices-table.sql             ✅ Created
├── 03-create-invoice-payments-table.sql     ✅ Created
└── 04-update-vouchers-for-invoices.sql      ✅ Created
```

## 🚀 Deployment Steps

### Step 1: Database (Required First)
```bash
./deploy-invoice-system.sh
```

This creates:
- invoices table
- invoice_payments table
- Updates quotations table
- Links vouchers to invoices

### Step 2: Backend (Required Second)
Register routes in `backend/server.js`:

```javascript
const invoicesRouter = require('./routes/invoices-gst');
app.use('/api/invoices', invoicesRouter);
```

Then deploy backend to server.

### Step 3: Frontend (Final)
1. Add route to App.jsx
2. Add menu item to Header.jsx
3. Update Quotations page with "Convert to Invoice" button
4. Build and deploy frontend

```bash
npm run build
# Upload dist/ to server
```

## 🎯 Features Summary

### PNG GST Compliance
✓ **10% GST Rate** - Standard PNG rate
✓ **TIN Fields** - Supplier and Customer Tax ID
✓ **Sequential Numbering** - INV-YYYYMM-XXXX
✓ **GST Breakdown** - Subtotal + GST = Total
✓ **Invoice Requirements** - All PNG tax invoice fields

### Payment Tracking
✓ **Multiple Payments** - Partial and full payment support
✓ **Payment Methods** - CASH, CARD, BANK TRANSFER, EFTPOS, CHEQUE
✓ **Auto-Status Updates** - Triggers update invoice status
✓ **Payment History** - Full audit trail
✓ **Overpayment Prevention** - Validates amount

### Green Pass Integration
✓ **Auto-Generation** - After full payment
✓ **QR Codes** - Links to existing voucher system
✓ **1-Year Validity** - From issue date
✓ **Batch Tracking** - Links to invoice

### User Experience
✓ **Clean Professional UI** - No icons, text-only
✓ **Color-Coded Status** - Easy visual status identification
✓ **Progress Bars** - Payment progress visualization
✓ **Filters** - Status, customer, date range
✓ **Statistics** - Dashboard with key metrics
✓ **Responsive** - Works on all devices

## 📊 Workflow Diagram

```
QUOTATION                    INVOICE                    GREEN PASS
─────────                    ───────                    ──────────

1. Draft                     1. Convert from            1. Full payment
   ↓                            approved quotation         required
2. Send to customer             ↓                           ↓
   ↓                         2. Status: Pending          2. Click "Generate
3. Approved                     ↓                            Vouchers"
   ↓                         3. Record Payment(s)           ↓
4. Convert to Invoice           ↓                        3. Create vouchers
                             4. Status: Partial             with QR codes
                                or Paid                     ↓
                                ↓                        4. Valid 1 year
                             5. If Paid →
                                Generate Vouchers
```

## 🧪 Testing Checklist

- [ ] Database migrations run successfully
- [ ] Backend routes registered and working
- [ ] Create quotation
- [ ] Approve quotation
- [ ] Convert quotation to invoice
- [ ] Verify invoice appears in Invoices page
- [ ] Record partial payment
- [ ] Verify status changes to "Partial"
- [ ] Record remaining payment
- [ ] Verify status changes to "Paid"
- [ ] Generate vouchers (green passes)
- [ ] Verify vouchers created with QR codes
- [ ] Verify vouchers link to invoice
- [ ] Test filters (status, customer, date)
- [ ] Test GST calculations (10%)
- [ ] Test overdue detection

## 📝 Notes

- All amounts in PNG Kina (K)
- GST rate is 10% (configurable)
- Invoice numbers reset monthly
- Green Pass = Voucher with QR code (same thing)
- Keep records for 5 years (PNG requirement)
- Sequential numbering required for tax compliance

## 🎨 UI Screenshots

### Invoices Page Features:
- Statistics cards (Total, Pending, Partial, Paid, Overdue)
- Financial summary (Value, Collected, Outstanding)
- Filters (Status, Customer, Date Range)
- Invoice table with payment progress bars
- Record Payment modal
- Generate Vouchers modal
- Professional clean design

### Status Badges:
- **Pending** - Yellow
- **Partial** - Blue
- **Paid** - Green
- **Overdue** - Red
- **Cancelled** - Gray

---

**Status**: Frontend components ready, needs routing integration
**Last Updated**: November 27, 2025
**Ready for**: Database deployment and testing
