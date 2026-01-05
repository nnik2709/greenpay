# MRZ Scanner SDK Testing Guide

## Overview

This guide helps you test and compare different MRZ (Machine Readable Zone) OCR solutions for passport scanning. The test page allows you to evaluate various SDKs without affecting the production `/buy-online` functionality.

---

## Access the Test Page

**URL:** `http://localhost:3000/app/mrz-scanner-test` (development)
**Production:** `https://greenpay.eywademo.cloud/app/mrz-scanner-test`

**Access Restrictions:** Flex_Admin and IT_Support roles only

---

## Available SDKs for Testing

### 1. Dynamsoft MRZ Scanner ✅ Ready to Test

**Status:** Integrated and ready for immediate testing
**License:** 30-day free trial (public trial key included)
**Documentation:** https://www.dynamsoft.com/mrz-scanner/docs/web/

#### Features:
- ✅ Camera-based live scanning
- ✅ Image file upload (JPG, PNG)
- ✅ PDF support (with additional Document Viewer SDK)
- ✅ Automatic MRZ detection and parsing
- ✅ High accuracy (95%+ reported)
- ✅ Clean, modern API
- ✅ Excellent documentation

#### How to Use:
1. Navigate to `/app/mrz-scanner-test`
2. Click the **"Dynamsoft MRZ Scanner"** tab
3. Click **"Initialize Dynamsoft SDK"** button
4. Wait for SDK to load (shows "SDK Ready" when complete)
5. Choose scanning method:
   - **Scan from Camera:** Opens live camera view for scanning
   - **Upload Image:** Select a passport image from your device
6. Review extracted data in the results panel

#### SDK Details:
- **CDN:** `https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@3.0.0/dist/mrz-scanner.bundle.js`
- **License Key:** Included (public trial key)
- **Package:** `dynamsoft-mrz-scanner` (npm)

---

### 2. Pixl Passport SDK ⏳ Pending API Access

**Status:** Placeholder integrated, requires API key
**License:** Contact vendor for pricing
**Website:** https://pixl.ai/passport-ocr

#### Features (as advertised):
- ✅ Enterprise-grade passport OCR
- ✅ NFC chip reading support
- ✅ Very high accuracy (98%+ claimed)
- ✅ Platform-independent (web, mobile, desktop)
- ✅ Specialized for passport verification

#### How to Get Access:
1. Visit https://pixl.ai/contact-us.html
2. Request API access or book a demo
3. Obtain API key and SDK credentials
4. Add credentials to `.env` file:
   ```
   VITE_PIXL_API_KEY=your_api_key_here
   VITE_PIXL_SDK_URL=provided_sdk_url
   ```
5. Update `MrzScannerTest.jsx` with Pixl integration code

#### Integration Steps (once API key obtained):
```javascript
// In src/pages/MrzScannerTest.jsx, update initializePixl function:

const initializePixl = async () => {
  setPixl(prev => ({ ...prev, loading: true, error: null }));

  try {
    // Load Pixl SDK with your API key
    const apiKey = import.meta.env.VITE_PIXL_API_KEY;

    // Initialize Pixl SDK according to their documentation
    // (Exact implementation will be provided by Pixl)

    setPixl(prev => ({
      ...prev,
      loaded: true,
      loading: false,
      scanner: pixlInstance
    }));
  } catch (err) {
    setPixl(prev => ({
      ...prev,
      loading: false,
      error: err.message
    }));
  }
};
```

---

## SDK Comparison Table

| Feature | Current (html5-qrcode) | Dynamsoft MRZ | Pixl Passport |
|---------|------------------------|---------------|---------------|
| MRZ Recognition | ❌ No (manual entry) | ✅ Yes | ✅ Yes |
| Camera Support | ✅ Yes (QR only) | ✅ Yes | ✅ Yes |
| Image Upload | ❌ No | ✅ Yes | ✅ Yes |
| PDF Support | ❌ No | ✅ Yes | ✅ Yes |
| NFC Reading | ❌ No | ❌ No | ✅ Yes |
| Pricing | Free | Trial, then paid | Contact for pricing |
| Integration | Simple | Medium | Medium-High |
| Documentation | Good | Excellent | Contact required |
| Accuracy | N/A | High (95%+) | Very High (98%+) |

---

## Testing Checklist

### Dynamsoft MRZ Scanner Testing

- [ ] SDK initializes successfully
- [ ] Camera permission request works
- [ ] Live camera scanning detects passport
- [ ] MRZ data extracts accurately
- [ ] Image upload works with sample passports
- [ ] Extracted data matches actual passport
- [ ] Error handling works properly
- [ ] Performance is acceptable (scan speed, resource usage)

### Data Accuracy Testing

Test with various passport types:
- [ ] Papua New Guinea passports
- [ ] Australian passports
- [ ] Other Pacific Island nations
- [ ] Different passport conditions (new, worn, tilted)
- [ ] Various lighting conditions

### Compare Extracted Data:

| Field | Expected | Dynamsoft Result | Pixl Result | Match? |
|-------|----------|------------------|-------------|--------|
| Passport Number | | | | |
| Surname | | | | |
| Given Names | | | | |
| Nationality | | | | |
| Date of Birth | | | | |
| Sex | | | | |
| Date of Expiry | | | | |
| Issuing State | | | | |

---

## Recommendations

### Immediate Action (This Week)
✅ **Test Dynamsoft MRZ Scanner**
- Easy to integrate and test immediately
- No vendor contact required
- 30-day trial included
- Excellent documentation
- Can deploy to production quickly if satisfied

### Medium-Term (Next 2 Weeks)
📧 **Contact Pixl for API Access**
- Request demo and pricing
- Obtain API credentials
- Integrate and compare with Dynamsoft
- Evaluate accuracy and feature differences
- Consider enterprise support requirements

### Long-Term Decision
Compare results and decide:

**Choose Dynamsoft if:**
- Need quick deployment
- Good accuracy is sufficient (95%+)
- Budget-conscious solution
- Don't need NFC chip reading
- Want self-service integration

**Choose Pixl if:**
- Need highest accuracy (98%+)
- Require NFC chip verification
- Have enterprise budget
- Need vendor support
- Processing high volume of passports

**Keep Current Solution if:**
- Passport volume is low
- Manual entry is acceptable
- Free solution is priority
- QR code scanning is main use case

---

## Integration into Production

### If Selecting Dynamsoft:

1. **Purchase License:**
   - Visit https://www.dynamsoft.com/store/
   - Choose appropriate plan based on volume
   - Obtain production license key

2. **Update Environment Variables:**
   ```bash
   # In .env file
   VITE_DYNAMSOFT_LICENSE_KEY=your_production_key_here
   ```

3. **Integration Options:**

   **Option A: Replace /buy-online scanner**
   - Update `BuyOnline.jsx` to use Dynamsoft instead of html5-qrcode
   - Remove manual passport entry form
   - Add MRZ auto-fill functionality

   **Option B: Add as alternative option**
   - Keep current scanner for QR codes
   - Add "Scan Passport" button that uses Dynamsoft
   - Allow users to choose scanning method

   **Option C: Separate passport scanning page**
   - Create dedicated `/scan-passport` route
   - Use for Individual Purchase, Corporate Vouchers, etc.
   - Keep /buy-online as is for backward compatibility

4. **Testing:**
   - Run automated E2E tests
   - Test with real passports before production
   - Monitor accuracy and performance
   - Collect user feedback

5. **Deployment:**
   - Build production bundle: `npm run build`
   - Deploy `dist/` folder to production
   - Update documentation
   - Train staff on new feature

### If Selecting Pixl:

1. **Complete Integration:**
   - Follow Pixl's integration documentation
   - Add API key to environment variables
   - Implement Pixl SDK in `MrzScannerTest.jsx`
   - Test thoroughly

2. **Follow Similar Deployment Steps as Dynamsoft**

---

## Sample Passport Images for Testing

### Where to Find Test Images:

1. **Public Datasets:**
   - MIDV-500: https://github.com/fcakyon/midv500
   - Passport MRZ Dataset: https://github.com/DoubangoTelecom/MRZ

2. **Create Test Images:**
   - Use passport scanner to take photos
   - Test with various angles and lighting
   - Include partially visible MRZ
   - Test with damaged/worn passports

3. **Privacy Note:**
   - NEVER use real customer passports for testing without consent
   - Blur or redact personal information
   - Use public sample images only
   - Create dummy test passports if needed

---

## Troubleshooting

### Dynamsoft SDK Won't Load
**Symptoms:** "Failed to load Dynamsoft SDK script" error

**Solutions:**
- Check internet connection (SDK loads from CDN)
- Check browser console for CORS errors
- Verify CDN URL is accessible: https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@3.0.0/dist/mrz-scanner.bundle.js
- Try different browser (Chrome, Firefox, Safari)

### Camera Permission Denied
**Symptoms:** Cannot access camera for scanning

**Solutions:**
- Check browser permissions (camera access)
- Use HTTPS (required for camera access)
- Try different browser
- Check system privacy settings
- Test with uploaded image instead

### Low Accuracy
**Symptoms:** Extracted data doesn't match passport

**Solutions:**
- Ensure good lighting (no glare on passport)
- Hold passport flat and steady
- Use high-resolution images (minimum 1280x720)
- Clean passport cover (remove scratches/dirt)
- Ensure MRZ lines are fully visible
- Try different angles

### SDK Performance Issues
**Symptoms:** Slow loading, high CPU usage

**Solutions:**
- Close other browser tabs
- Use desktop instead of mobile for testing
- Check system resources
- Try smaller images (resize before upload)
- Update browser to latest version

---

## Cost Analysis

### Dynamsoft MRZ Scanner Pricing (Estimated):

**Volume-Based Licensing:**
- **Trial:** Free 30 days
- **Starter:** $500-1000/year (up to 10K scans)
- **Professional:** $2000-5000/year (up to 100K scans)
- **Enterprise:** Contact for custom pricing

### Pixl Passport SDK Pricing:

**Enterprise Licensing:** Contact vendor for quote

Likely pricing model:
- Initial setup fee
- Annual license based on volume
- Support and maintenance included
- Possible per-transaction fees

### Current Solution Cost:

**html5-qrcode:** Free (MIT License)

**Labor Cost:**
- Manual passport entry: 2-3 minutes per passport
- Estimated cost: $0.50-1.00 per entry (staff time)

**ROI Calculation:**
- If processing 100+ passports/month
- Automation saves ~$50-100/month in labor
- SDK cost pays for itself in 6-12 months

---

## Next Steps

1. ✅ **Test Dynamsoft Now:**
   - Open http://localhost:3000/app/mrz-scanner-test
   - Click "Dynamsoft MRZ Scanner" tab
   - Initialize SDK and test with sample passports
   - Evaluate accuracy and user experience

2. 📧 **Contact Pixl (Optional):**
   - Request demo: https://pixl.ai/contact-us.html
   - Get API access and pricing
   - Compare with Dynamsoft results

3. 📊 **Evaluate Results:**
   - Complete testing checklist above
   - Document accuracy metrics
   - Consider cost vs. benefit
   - Make recommendation to stakeholders

4. 🚀 **Deploy Selected Solution:**
   - Purchase license (if commercial SDK)
   - Integrate into production pages
   - Train users
   - Monitor performance

---

## Support and Resources

### Dynamsoft:
- **Documentation:** https://www.dynamsoft.com/mrz-scanner/docs/
- **GitHub:** https://github.com/Dynamsoft/mrz-scanner-javascript
- **Support:** https://www.dynamsoft.com/company/contact/
- **Forum:** https://www.dynamsoft.com/forum/

### Pixl:
- **Website:** https://pixl.ai/passport-ocr
- **Contact:** https://pixl.ai/contact-us.html
- **Demo Platform:** https://pcs.pixl.ai/products

### General MRZ Resources:
- **ICAO Doc 9303:** https://www.icao.int/publications/pages/publication.aspx?docnum=9303
- **MRZ Format Spec:** Machine Readable Travel Documents standard
- **Test Data:** https://github.com/topics/mrz-parser

---

## File Locations

**Test Page Component:** `src/pages/MrzScannerTest.jsx`
**Route Definition:** `src/App.jsx` (line 199-203)
**Documentation:** `MRZ_SCANNER_TEST_GUIDE.md`

**Access URL:**
- Dev: `http://localhost:3000/app/mrz-scanner-test`
- Prod: `https://greenpay.eywademo.cloud/app/mrz-scanner-test`

---

**Status:** ✅ Ready for testing
**Created:** December 17, 2025
**Updated:** December 17, 2025
**Author:** GreenPay Development Team
