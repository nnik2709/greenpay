# Camera MRZ Scanner - Technical Limitations & Removal

**Date:** 2025-11-29 (Updated: 2025-11-30)
**Status:** ✅ Removed from codebase
**Reason:** Tesseract.js incompatible with Vite bundler

## Summary

Attempted OCR-based passport scanning using Tesseract.js but encountered insurmountable Web Worker + Vite bundling conflicts. After multiple attempts to fix the issue, the OCR scanner feature was completely removed from the codebase on 2025-11-30.

## Current Working Solutions

✅ **PrehKeyTec Hardware Scanner** - Primary method (instant, 99.9% accurate)
✅ **Manual Entry** - Backup method
✅ **QR/Barcode Scanner** - For voucher validation

## Why OCR Failed

Tesseract.js (v5 & v6) uses Web Workers with hardcoded CDN imports that cannot be bundled by Vite:
```
NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope':
The script at 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.1.1/dist/worker.min.js' failed to load.
```

Even attempts to use synchronous `recognize()` method still triggered Web Worker initialization internally, making the library fundamentally incompatible with Vite.

## Cleanup Actions Completed (2025-11-30)

✅ Removed `src/components/LiveMRZScanner.jsx` (686 lines)
✅ Uninstalled `tesseract.js` from package.json (9 packages removed)
✅ Removed all OCR references from `IndividualPurchase.jsx`:
  - Removed LiveMRZScanner import and Camera icon
  - Removed showOCRScanner state variable
  - Removed Camera Scanner button and dialog
  - Removed OCR success handler

✅ Removed all OCR references from `ScanAndValidate.jsx`:
  - Removed LiveMRZScanner import
  - Removed showMRZScanner state variable
  - Removed Live Passport Scanner button
  - Removed LiveMRZScanner dialog
  - Removed "Live Passport Scanner" documentation section

✅ Removed `public/tesseract/` directory

## Future Options (If Needed)

- **Server-side OCR**: Upload image → backend processes → return data
- **Native mobile app**: Use ML Kit or Vision Framework
- **Different library**: Try ocr.js or custom Tesseract WASM build
- **Commercial SDK**: Implement paid OCR solution compatible with web bundlers

## Conclusion

Hardware scanner remains the best solution for production use. The PrehKeyTec scanner provides instant, highly accurate MRZ scanning without the complexity and compatibility issues of browser-based OCR.
