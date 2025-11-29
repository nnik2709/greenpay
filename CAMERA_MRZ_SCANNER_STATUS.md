# Camera MRZ Scanner - Technical Limitations

**Date:** 2025-11-29  
**Status:** ❌ Not Implemented  
**Reason:** Tesseract.js incompatible with Vite bundler

## Summary

Attempted OCR-based passport scanning using Tesseract.js but encountered insurmountable Web Worker + Vite bundling conflicts. **Recommendation: Use hardware scanner only.**

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

## Files to Clean Up

```bash
rm -rf public/tesseract/
rm src/components/LiveMRZScanner.jsx
# Revert OCR refs in IndividualPurchase.jsx and ScanAndValidate.jsx
```

## Future Options

- **Server-side OCR**: Upload image → backend processes → return data
- **Native mobile app**: Use ML Kit or Vision Framework
- **Different library**: Try ocr.js or custom Tesseract WASM build

Hardware scanner remains the best solution for production use.
