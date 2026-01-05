# Deployment Files - Customer Selector in Bulk Voucher Generation

## Summary
Added customer selection/creation dialog (same as Create Quotation) to Bulk Voucher Generation page. The selected customer's information is now used when creating invoices for Finance Manager and Flex Admin roles.

## Files to Deploy

### Backend Files (No changes needed)
- None - This change is frontend-only

### Frontend Files (Built to `/dist`)
The frontend has been built successfully. Deploy the entire `/dist` folder contents.

**Key changes in source files:**
- `src/pages/CorporateExitPass.jsx` - Added `CustomerSelector` component and customer details display

### Complete File List for Deployment

#### Backend
- No backend changes required for this update

#### Frontend
- `/dist` folder (entire contents) - Deploy to your frontend server/static hosting

---

## What Changed

1. **Customer Selection**: 
   - Added `CustomerSelector` component to Corporate Exit Pass form
   - Shows selected customer details (name, company, email, phone, address)
   - Auto-fills company name from selected customer

2. **Data Flow**:
   - Selected customer ID and details are passed to the backend
   - Backend uses customer information when creating invoices (already implemented in previous update)

## Testing Notes
- Verify that the customer selector appears and works correctly
- Test selecting an existing customer
- Test creating a new customer
- Verify customer details are displayed correctly after selection
- Confirm that invoices are created with correct customer information

