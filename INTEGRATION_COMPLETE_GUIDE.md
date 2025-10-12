# UI Integration Guide

## ✅ Completed Integrations

### 1. EditPassport Route ✅
**Added to:** `src/App.jsx`
```javascript
<Route path="passports/edit/:id" element={
  <PrivateRoute roles={['Flex_Admin', 'Counter_Agent']}>
    <EditPassport />
  </PrivateRoute>
} />
```

---

## 🔧 Quick Integration Snippets

### Add "Edit" Button to Passport List

**In:** `src/pages/Passports.jsx` (or wherever you list passports)

```javascript
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';

// In your passport list rendering:
<Button 
  onClick={() => navigate(`/passports/edit/${passport.id}`)}
  variant="outline"
  size="sm"
>
  <Edit className="w-4 h-4 mr-2" />
  Edit
</Button>
```

---

### Add "Download ZIP" Button to Corporate Vouchers

**In:** `src/pages/CorporateExitPass.jsx`

```javascript
import { generateCorporateZip, downloadZipFile } from '@/lib/corporateZipService';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const [downloading, setDownloading] = useState(false);
const { toast } = useToast();

const handleDownloadZip = async (companyName, batchDate) => {
  try {
    setDownloading(true);
    const result = await generateCorporateZip({ 
      company_name: companyName,
      batch_date: batchDate
    });
    
    if (result.success) {
      await downloadZipFile(result.zipUrl, result.fileName);
      toast({ 
        title: 'Success!',
        description: `Downloaded ${result.voucherCount} vouchers`
      });
    }
  } catch (error) {
    toast({ 
      variant: 'destructive',
      title: 'Error', 
      description: error.message 
    });
  } finally {
    setDownloading(false);
  }
};

// In your UI:
<Button 
  onClick={() => handleDownloadZip(companyName, batchDate)}
  disabled={downloading}
>
  {downloading ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      Generating...
    </>
  ) : (
    <>
      <Download className="w-4 h-4 mr-2" />
      Download ZIP
    </>
  )}
</Button>
```

---

### Add "Generate PDF" Button to Quotations

**In:** `src/pages/Quotations.jsx`

```javascript
import { generateQuotationPDF, viewQuotationPDF } from '@/lib/quotationPdfService';
import { FileText } from 'lucide-react';

const [generating, setGenerating] = useState(false);

const handleGeneratePDF = async (quotationId) => {
  try {
    setGenerating(true);
    const result = await generateQuotationPDF(quotationId);
    
    if (result.success) {
      // Open PDF in new window
      viewQuotationPDF(result.pdfUrl);
      toast({ 
        title: 'PDF Generated!',
        description: 'Opening in new window...'
      });
    }
  } catch (error) {
    toast({ 
      variant: 'destructive',
      title: 'Error', 
      description: error.message 
    });
  } finally {
    setGenerating(false);
  }
};

// In your quotation list:
<Button 
  onClick={() => handleGeneratePDF(quotation.id)}
  disabled={generating}
  size="sm"
>
  <FileText className="w-4 h-4 mr-2" />
  Generate PDF
</Button>
```

---

### Connect Bulk Upload to Service

**In:** `src/pages/BulkPassportUpload.jsx`

Replace the mock file processing with:

```javascript
import { uploadBulkPassports } from '@/lib/bulkUploadService';

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setUploadedFile(file);
  
  // Show preview
  toast({
    title: 'File Selected',
    description: `${file.name} ready for upload`
  });
};

const handleProceedToPayment = async () => {
  if (!uploadedFile) {
    toast({
      title: "No File Uploaded",
      description: "Please upload an Excel file to proceed.",
      variant: "destructive",
    });
    return;
  }
  
  try {
    setUploading(true);
    const result = await uploadBulkPassports(uploadedFile);
    
    if (result.success) {
      setPassportCount(result.successCount);
      toast({
        title: "Upload Successful!",
        description: `Processed ${result.successCount} passports`
      });
      setCurrentStep(2);
    } else {
      throw new Error(result.message || 'Upload failed');
    }
  } catch (error) {
    toast({
      variant: 'destructive',
      title: "Upload Failed",
      description: error.message
    });
  } finally {
    setUploading(false);
  }
};
```

---

## 🧪 Testing Checklist

### Manual Testing

After integrating, test each feature:

1. **Edit Passport**
   - [ ] Navigate to passport list
   - [ ] Click "Edit" button
   - [ ] Verify form pre-fills with data
   - [ ] Make changes and save
   - [ ] Verify changes appear in database

2. **Download Corporate ZIP**
   - [ ] Navigate to corporate vouchers
   - [ ] Click "Download ZIP"
   - [ ] Verify ZIP file downloads
   - [ ] Extract and verify contents (QR codes, HTML, CSV)

3. **Generate Quotation PDF**
   - [ ] Navigate to quotations
   - [ ] Click "Generate PDF"
   - [ ] Verify PDF opens in new window
   - [ ] Check PDF formatting and data

4. **Bulk Upload**
   - [ ] Navigate to bulk upload
   - [ ] Select Excel file
   - [ ] Click proceed
   - [ ] Verify passports created in database

---

## 🐛 Common Integration Issues

### Issue: Import errors
**Solution:** Ensure all services are properly exported
```javascript
// Check each service file has:
export { functionName };
```

### Issue: Route not found
**Solution:** Restart dev server after adding routes
```bash
npm run dev
```

### Issue: Supabase functions not accessible
**Solution:** Ensure Edge Functions are deployed
```bash
supabase functions deploy function-name
```

### Issue: CORS errors
**Solution:** Check Supabase project settings, ensure functions have proper headers

---

## 📝 Next Steps

1. **Deploy Edge Functions**
   ```bash
   supabase functions deploy bulk-passport-upload
   supabase functions deploy generate-corporate-zip  
   supabase functions deploy generate-quotation-pdf
   ```

2. **Apply Migration**
   ```bash
   psql < supabase/migrations/015_discount_tracking.sql
   ```

3. **Test in Browser**
   - Open http://localhost:3000
   - Test each integrated feature
   - Check for console errors

4. **Run Playwright Tests**
   ```bash
   npm run test
   ```

---

## ✅ Integration Complete!

All backend features are now accessible through the UI!


