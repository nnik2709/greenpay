# Android Testing Instructions - Mobile Camera Scanner & PDF Download

## Test the Buy Online Page with Camera Scanner

### Prerequisites
- Android phone (any version with camera)
- Physical passport with MRZ (Machine Readable Zone - the two lines at the bottom)
- Good lighting

### Test Steps

#### 1. Access the Buy Online Page
- Open Chrome or Firefox on your Android phone
- Navigate to: `https://greenpay.eywademo.cloud/buy-online`

#### 2. Test Camera Scanner
1. **Tap "Scan Passport with Camera"** button
2. **Grant camera permission** when prompted
3. **Position the passport:**
   - Hold passport steady
   - Ensure MRZ (bottom 2 lines) is clearly visible
   - Make sure lighting is good (not too dark, not too bright)
4. **Tap "Capture Image"** button
5. **Wait for OCR processing** (5-10 seconds)

#### 3. Verify Scanned Data
The form should auto-fill with:
- ✅ **Passport Number**: Should be correct (9 digits)
- ✅ **Surname**: Should match passport
- ✅ **Given Name**: Should have proper spacing (e.g., "JOHN DAVID" not "JOHNDAVID")
  - **No garbage characters** (no random letters like "L", "K", "C" at the end)
- ✅ **Nationality**: Should show **full country name** (e.g., "Bulgaria" not "BGR")
- ✅ **Date of Birth**: Should match passport (YYYY-MM-DD format)
- ✅ **Sex**: Should be "Male" or "Female"

#### 4. Complete Purchase Flow
1. **Verify form data** is correct
2. **Tap "Continue to Payment"** button
3. **Complete Stripe payment** with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
4. **Wait for redirect** to success page

#### 5. Test PDF Download (Android)
On the payment success page:

1. **Tap "Download PDF"** button
2. **Expected behavior (one of these):**
   - **Option A**: Android Share Sheet appears → Choose "Save to Files" or "Downloads"
   - **Option B**: PDF downloads directly to your Downloads folder
   - **Option C**: Browser prompts "Download voucher-XXXXX.pdf?"

3. **Verify the download:**
   - Open **Files app** or **Downloads**
   - Find file: `voucher-XXXXX.pdf`
   - Open the PDF and verify it contains:
     - ✅ QR code
     - ✅ Voucher code
     - ✅ Passport details
     - ✅ Expiry date

#### 6. Alternative: Test Email Option
If PDF download doesn't work:
1. **Tap "Email Voucher"** button
2. **Enter email address**
3. **Tap "Send"**
4. **Check email inbox** for voucher PDF

---

## Expected Results ✅

### Camera Scanner:
- ✅ Clean given names with proper spacing
- ✅ Full country names (not 3-letter codes)
- ✅ No OCR garbage characters
- ✅ All fields auto-populated correctly

### PDF Download:
- ✅ Works on Android Chrome
- ✅ Works on Android Firefox
- ✅ Downloads to accessible location
- ✅ PDF opens and displays correctly

---

## Troubleshooting

### Camera doesn't start:
- Grant camera permission in browser settings
- Try refreshing the page
- Ensure you're on HTTPS (not HTTP)

### OCR fails to read passport:
- Improve lighting (avoid shadows and glare)
- Hold passport flat and steady
- Ensure MRZ lines are clearly visible
- Try capturing again

### PDF download doesn't work:
- Use **"Email Voucher"** option instead
- PDF will be sent to your email
- This always works regardless of browser

### Given name has garbage:
- This should be fixed now
- If you still see random letters at the end, report the exact text

---

## Test Devices Recommended

- **Android Chrome** (most common)
- **Android Firefox** (alternative browser)
- **Samsung Internet** (Samsung devices)
- **Any Android version 8.0+**

---

## What to Report

If testing, please report:
1. ✅ **Android version** (e.g., Android 13)
2. ✅ **Browser** (Chrome/Firefox/Other)
3. ✅ **Camera scanner** (worked/failed)
4. ✅ **Given name spacing** (correct/incorrect)
5. ✅ **Nationality conversion** (full name/code)
6. ✅ **PDF download method** (share sheet/direct download/failed)
7. ✅ **Any errors or issues**

Example report:
```
✅ Android 12, Chrome 119
✅ Camera scanner worked perfectly
✅ Given name: "JOHN DAVID" (correct spacing)
✅ Nationality: "United States" (full name)
✅ PDF: Share sheet appeared, saved to Downloads
✅ No issues found
```

---

## Support

If you encounter any issues:
1. Try the **Email Voucher** option as workaround
2. Take screenshots of any errors
3. Note the exact step where it failed
4. Report browser and Android version
