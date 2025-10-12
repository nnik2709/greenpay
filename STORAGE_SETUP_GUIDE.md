# Supabase Storage Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Storage Buckets

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Create these 3 buckets:

#### Bucket 1: passport-photos
- Name: `passport-photos`
- Public: ✅ Yes
- File size limit: 2MB
- Allowed MIME types: `image/jpeg, image/png`

#### Bucket 2: passport-signatures  
- Name: `passport-signatures`
- Public: ✅ Yes
- File size limit: 1MB
- Allowed MIME types: `image/jpeg, image/png`

#### Bucket 3: voucher-batches
- Name: `voucher-batches`
- Public: ✅ Yes
- File size limit: 10MB
- Allowed MIME types: `application/pdf, application/zip`

### Step 2: Run Database Migration

```bash
# Apply the migration via Supabase SQL Editor
# Copy content from: supabase/migrations/013_passport_file_storage.sql
# Paste and click "Run"
```

Or if using Supabase CLI:
```bash
supabase db push
```

### Step 3: Verify Setup

Run this in Supabase SQL Editor:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'passports' 
AND column_name IN ('photo_path', 'signature_path');
```

Should return 2 rows.

### Step 4: Test Upload (Optional)

```javascript
import { uploadPassportPhoto } from '@/lib/storageService';

// Test upload
const file = document.querySelector('input[type="file"]').files[0];
const result = await uploadPassportPhoto(file, 'TEST123456');
console.log('Uploaded:', result.url);
```

---

## Storage Policies (RLS)

Buckets are public for read, but uploads require authentication.

Set these policies in Supabase Dashboard → Storage → bucket → Policies:

### passport-photos Policies

**1. Public Read**
```sql
((bucket_id = 'passport-photos') AND (auth.role() = 'anon'))
```

**2. Authenticated Upload**
```sql
((bucket_id = 'passport-photos') AND (auth.role() = 'authenticated'))
```

**3. Owner Delete**
```sql
((bucket_id = 'passport-photos') AND (auth.role() = 'authenticated'))
```

Repeat same policies for `passport-signatures` and `voucher-batches`.

---

## Usage in Code

```javascript
import { uploadPassportPhoto, uploadPassportSignature, getPublicUrl } from '@/lib/storageService';

// Upload photo
const photoResult = await uploadPassportPhoto(photoFile, passportNumber);
// Returns: { path: 'photos/...', url: 'https://...' }

// Upload signature
const signatureResult = await uploadPassportSignature(signatureFile, passportNumber);

// Save to database
const { data, error } = await supabase
  .from('passports')
  .insert({
    passport_number: passportNumber,
    photo_path: photoResult.path,
    signature_path: signatureResult.path,
    // ... other fields
  });

// Display image
const photoUrl = getPublicUrl('passport-photos', passport.photo_path);
<img src={photoUrl} alt="Passport photo" />
```

---

## Troubleshooting

### Issue: "Bucket not found"
**Solution**: Create bucket in Supabase Dashboard → Storage

### Issue: "Permission denied"
**Solution**: Check bucket policies allow authenticated uploads

### Issue: "File too large"
**Solution**: Check file size limits, compress image before upload

### Issue: "Invalid file type"
**Solution**: Ensure JPEG or PNG format

---

**Setup Complete** ✅


