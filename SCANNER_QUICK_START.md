# Scanner Quick Start Guide

## 🚀 Test Scanner Right Now (No Hardware Needed)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit test page:**
   ```
   http://localhost:3000/scanner-test
   ```

3. **Login** with any admin/agent account

4. **Copy sample MRZ data** from the page:
   ```
   P<PNGDOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<AB1234567PNG9001011M2512319<<<<<<<<<<<<<<<06
   ```

5. **Click in input field** and **paste quickly**

6. **See results** - Should parse to:
   - Passport: AB1234567
   - Name: John Doe
   - Nationality: PNG
   - DOB: 1990-01-01
   - Expiry: 2025-12-31

---

## 📦 When Hardware Arrives

### Step 1: Connect Scanner
- Plug USB scanner into computer
- Wait for device recognition (instant)
- No drivers needed!

### Step 2: Test Output
- Open any text editor
- Scan a passport MRZ
- Check if it types 88 characters
- Note any prefix/suffix characters

### Step 3: Test in App
- Visit `/scanner-test`
- Click in input field
- Scan passport/barcode
- Check scan history for speed

### Step 4: Adjust if Needed
- If scans not detected: increase `scanTimeout`
- If extra characters: add to `prefixChars/suffixChars`
- Use configuration panel on test page

---

## 📁 Files You Created (Phase 1)

| File | What It Does |
|------|--------------|
| `src/hooks/useScannerInput.js` | Detects rapid keyboard input from scanner |
| `src/lib/mrzParser.js` | Parses 88-char passport MRZ |
| `src/components/ScannerInput.jsx` | Drop-in input component with scanner support |
| `src/lib/scannerConfig.js` | Scanner settings and profiles |
| `src/pages/ScannerTest.jsx` | Interactive test page |

---

## 🎯 Next: Integrate Into Pages (Phase 2)

### Priority Order

1. **ScanAndValidate.jsx** - QR scanner for vouchers ⭐⭐⭐
2. **IndividualPurchase.jsx** - MRZ scanner for passports ⭐⭐⭐
3. **CreatePassport.jsx** - MRZ for manual entry ⭐⭐
4. **PublicRegistration.jsx** - Customer portal ⭐⭐

### How to Add to Any Page

```jsx
import ScannerInput from '@/components/ScannerInput';

<ScannerInput
  onScanComplete={(data) => {
    if (data.type === 'mrz') {
      // Auto-fill passport form
    } else {
      // Simple code
    }
  }}
  enableMrzParsing={true}
/>
```

---

## ⚙️ Scanner Settings (Quick Reference)

```javascript
// Generic scanner (most common)
scanTimeout: 100ms
minLength: 5 chars

// Professional scanner (very fast)
scanTimeout: 50ms

// Budget scanner (slower)
scanTimeout: 150ms

// Bluetooth scanner
scanTimeout: 120ms

// Manual testing
scanTimeout: 300ms
debugMode: true
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Scans not detected | Increase `scanTimeout` to 150-200ms |
| MRZ parsing fails | Check length = 88 chars, starts with "P<" |
| Duplicate scans | Single quick trigger, don't hold button |
| Too slow | Check USB connection, try different port |
| Extra characters | Set `prefixChars` or `suffixChars` |

---

## 📊 What Success Looks Like

✅ Scan completes in 100-300ms
✅ Speed: 200-500 chars/sec
✅ MRZ parses correctly
✅ Visual/audio feedback
✅ Data in scan history

---

## 📞 When You Get Hardware

**Send me:**
1. Scanner model numbers
2. Test scan output (from text editor)
3. Scan speed from `/scanner-test`
4. Any error messages

**I'll help:**
- Fine-tune settings
- Add custom profiles
- Troubleshoot issues
- Update configuration

---

**Ready to test now!** Visit `/scanner-test` 🎯
