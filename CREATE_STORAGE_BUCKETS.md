# Create Storage Buckets - 2 Minute Setup

## Quick Steps (Via Supabase Dashboard)

1. **Open Supabase Dashboard** → Storage → "New bucket"

2. **Create 3 buckets with these exact settings:**

### Bucket 1: passport-photos
```
Name: passport-photos
Public: ✅ YES (toggle ON)
File size limit: 2097152 (2MB)
Allowed MIME types: image/jpeg,image/png,image/jpg
```

### Bucket 2: passport-signatures  
```
Name: passport-signatures
Public: ✅ YES (toggle ON)
File size limit: 1048576 (1MB)
Allowed MIME types: image/jpeg,image/png,image/jpg
```

### Bucket 3: voucher-batches
```
Name: voucher-batches
Public: ✅ YES (toggle ON)
File size limit: 10485760 (10MB)
Allowed MIME types: application/pdf,application/zip
```

3. **Set Policies** (for each bucket):
   - Click bucket → "Policies" → "New Policy"
   - Select "Enable read access for all users"
   - Select "Enable insert access for authenticated users"
   - Click "Review" → "Save policy"

## Verify Setup

Run this test to verify buckets work:
```bash
npm run test -- tests/new-features/public-registration.spec.ts --grep "photo upload"
```

✅ Done! Your storage is ready.









