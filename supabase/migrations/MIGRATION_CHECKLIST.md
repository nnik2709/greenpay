# Quick Migration Checklist

## Before Starting
- [ ] Create backup of production database
- [ ] Verify admin access to Supabase
- [ ] Schedule maintenance window
- [ ] Notify users

## Migration Steps

### 1. Apply Migration 020
```sql
-- In Supabase SQL Editor, paste contents of:
-- 020_add_discount_and_returned_amount.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name IN ('individual_purchases', 'corporate_vouchers')
  AND column_name IN ('discount', 'collected_amount', 'returned_amount');
-- Expected result: 6
```

### 2. Apply Migration 021
```sql
-- In Supabase SQL Editor, paste contents of:
-- 021_add_discount_to_quotations.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'quotations'
  AND column_name IN ('discount', 'discount_amount', 'amount_after_discount', 'price_per_passport');
-- Expected result: 4
```

### 3. Configure Environment
In Supabase Dashboard → Edge Functions → Settings:
- [ ] Set `RESEND_API_KEY`
- [ ] Set `FROM_EMAIL`

In application `.env`:
- [ ] Set `VITE_ADMIN_EMAIL`

### 4. Test Application
- [ ] Create new quotation with discount
- [ ] Create individual purchase
- [ ] View revenue report
- [ ] Test email sending (if configured)

## If Something Goes Wrong
See rollback procedures in `PRODUCTION_MIGRATION_GUIDE.md`

## Quick Rollback
```sql
-- If needed, drop new columns:
ALTER TABLE public.quotations DROP COLUMN IF EXISTS discount CASCADE;
ALTER TABLE public.individual_purchases DROP COLUMN IF EXISTS discount CASCADE;
ALTER TABLE public.corporate_vouchers DROP COLUMN IF EXISTS discount CASCADE;
```
