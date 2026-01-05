# Passport MRZ Scanner - Current Solution Analysis & Improvement Prompt

## Current Solution Details

### Technology Stack

**Current Implementation: SimpleCameraScanner (Tesseract.js)**
- **OCR Engine:** Tesseract.js v5.x (Apache 2.0 license)
- **File:** `src/components/SimpleCameraScanner.jsx` (878 lines)
- **Used In:** `src/pages/BuyOnline.jsx` (public passport purchase page)
- **Cost:** $0 (free forever)

### How It Works

1. **Camera Activation**
   - Uses native HTML5 `getUserMedia()` API
   - Requests back camera with 1920x1080 resolution
   - Environment facing mode for mobile devices

2. **Real-time MRZ Detection**
   - Samples video frames every 500ms
   - Crops MRZ region (96% width, 25% height of frame)
   - Analyzes image for text patterns:
     - Edge detection (text has high edge density)
     - Contrast analysis (dark text on bright background)
     - Brightness validation (good lighting)
   - Guide box turns green when MRZ detected

3. **Image Capture & Preprocessing**
   ```javascript
   // Crops to MRZ area (96% width x 25% height)
   const cropHeight = videoHeight * 0.25;
   const cropWidth = videoWidth * 0.96;

   // Image enhancements:
   - Convert to grayscale
   - Contrast stretching (normalize to 0-255 range)
   - Sharpening filter (3x3 kernel)
   ```

4. **OCR Processing (Tesseract.js)**
   ```javascript
   Tesseract.recognize(imageDataUrl, 'eng', {
     tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<P',
     tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
     tessedit_ocr_engine_mode: OEM.LSTM_ONLY
   })
   ```
   - Processes image (2-5 seconds)
   - Returns raw text with ~70-85% accuracy

5. **MRZ Parsing**
   - Extracts 2 lines of 44 characters each
   - Line 1: `P<COUNTRY<SURNAME<<GIVENNAMES<<<`
   - Line 2: `PASSPORTNUMBER<NAT<DOBYYMMDDSEXEXPIRYYYMMDD<`
   - Maps ISO country codes (BGR → Bulgaria)

### Current Performance

**Accuracy Rate:** 60-75% (based on testing)
- ✅ Works well with new, clear passports in good lighting
- ❌ Fails often with old/worn passports
- ❌ OCR errors in check digits and edge characters
- ❌ Misreads similar characters (O→0, I→1, S→5, M→H)

**Processing Time:** 2-5 seconds (acceptable)

**User Experience:**
- ✅ Visual guide box with real-time feedback
- ✅ Flash/torch support
- ❌ Requires multiple attempts for old passports
- ❌ Manual entry often needed as fallback

### Key Issues

#### Issue 1: OCR Character Recognition Errors

**Latest Error Example:**
```
Cleaned text: NNP<BGRNIKOLOV<<NIKOLAY<STOYANOU<<<<<ECC<DAAT3871103896B6R6909275R25091726909274109<<<<92MESIA

Expected Line 2: 3871103896BGR6909275M25091726909274109<<<<92
Actual Line 2:   NNP<BGRNIKOLOV<<NIKOLAY<STOYANOU<<<<<ECC<DAAT3871103896B6R6909275R25091726909274109<<<<92MESIA
```

**Problems:**
1. Line detection fails - can't distinguish Line 1 from Line 2
2. Extra characters at start: `NNP<` instead of starting with passport number
3. Character substitutions: `R` instead of `M`, `U` instead of `V`
4. Edge padding lost: `ECC<DAAT` garbage instead of proper padding
5. Trailing garbage: `MESIA` at the end

#### Issue 2: Line Boundary Detection

The regex pattern `[A-Z0-9<]{9}[0-9][A-Z]{3}[0-9]{6}[0-9][A-Z0-9<]` assumes:
- Line starts with 9-char passport number
- But OCR returns merged text from both lines
- Can't reliably find where Line 2 starts

#### Issue 3: Image Quality

- Grayscale + contrast + sharpening not sufficient
- Tesseract struggles with:
  - Slight blur from phone movement
  - Uneven lighting (shadows, glare)
  - Passport wear/damage
  - Small font size of MRZ

### Comparison with Dynamsoft

| Feature | SimpleCameraScanner (Current) | Dynamsoft MRZ Scanner |
|---------|------------------------------|----------------------|
| **Accuracy** | 60-75% | 95%+ |
| **Speed** | 2-5 sec | <1 sec |
| **Cost** | $0 | $500-5000/year |
| **OCR Engine** | Tesseract.js (general OCR) | Specialized MRZ OCR |
| **Line Detection** | Regex pattern matching | MRZ-specific detection |
| **Character Recognition** | Generic font training | MRZ font trained |
| **Auto-scan** | Manual capture | Continuous auto-scan |
| **Preprocessing** | Basic (grayscale, contrast, sharpen) | Advanced (deskew, denoise, binarization) |

---

## AI Prompt for Cursor IDE

Copy the prompt below and paste it into Cursor to get AI assistance:

---

### CURSOR AI PROMPT

```
I need to improve the passport MRZ (Machine Readable Zone) scanning accuracy in my React application.

CONTEXT:
I have a passport scanner component using Tesseract.js OCR that captures the MRZ (2 lines of 44 characters at the bottom of passports). Current accuracy is only 60-75%, causing frequent failures.

CURRENT IMPLEMENTATION:
- File: src/components/SimpleCameraScanner.jsx
- Tech: React + Tesseract.js v5 + HTML5 Camera API
- Process: Camera → Capture → Grayscale/Contrast/Sharpen → Tesseract OCR → Parse MRZ
- MRZ Format: TD3 (passport) - two 44-character lines

MAIN PROBLEMS:

1. OCR Character Errors
   - Confuses similar chars: O→0, I→1, S→5, M→H, U→V, R→M
   - Loses edge padding characters (< symbols)
   - Adds garbage at line boundaries

2. Line Detection Failure
   - Can't reliably separate Line 1 from Line 2
   - OCR returns merged text: "LINE1LINE2" or "GARBAGELINE1LINE2"
   - Regex pattern fails to find valid Line 2 start

3. Latest Error:
   Expected: P<BGRNIKOLOV<<NIKOLAY<STOYANOV<<<<<<<<<<<<
   Got:      NNP<BGRNIKOLOV<<NIKOLAY<STOYANOU<<<<<ECC<DAAT

   Expected: 3871103896BGR6909275M25091726909274109<<<<92
   Got:      3871103896B6R6909275R25091726909274109<<<<92MESIA

WHAT I NEED:

Improve the MRZ parsing logic in SimpleCameraScanner.jsx to:

1. **Better Image Preprocessing**
   - Add binarization (Otsu thresholding)
   - Deskewing/rotation correction
   - Noise reduction
   - Better sharpening/contrast

2. **Smarter Line Detection**
   - Don't rely on single regex match
   - Use multiple strategies:
     a) Split text into lines by newlines first
     b) Find lines with ~44 chars length
     c) Identify Line 1 by P< prefix
     d) Identify Line 2 by pattern: starts with digits/letters, has date pattern (YYMMDD)
   - Handle merged lines: try to split at 44-char boundaries
   - Handle garbage prefix: trim non-MRZ chars before P<

3. **OCR Error Correction**
   - Character substitution rules for known confusions
   - Validate against MRZ check digits
   - Use context: if nationality is BGR, don't accept B6R
   - Pad missing < characters at line ends

4. **Better Tesseract Configuration**
   - Experiment with PSM (page segmentation) modes
   - Try different OEM (OCR engine) modes
   - Add preprocessing hooks
   - Consider custom training data (if possible)

5. **Fallback Strategies**
   - If full parse fails, extract partial data (name, passport number separately)
   - Allow user to correct specific fields
   - Multi-pass: try OCR with different settings

CONSTRAINTS:
- Must remain free/open source (no paid APIs)
- Must work in browser (React component)
- Keep existing UI/UX (guide box, visual feedback)
- Processing time should stay under 5 seconds

TARGET ACCURACY: 85%+ (up from current 60-75%)

FILES TO MODIFY:
- src/components/SimpleCameraScanner.jsx (line 257-400: parseMRZ function)
- src/components/SimpleCameraScanner.jsx (line 403-502: processImageWithOCR function)
- src/components/SimpleCameraScanner.jsx (line 504-634: captureImage preprocessing)

EXAMPLE MRZ FORMAT (TD3 - Passport):
Line 1: P<BGRNIKOLOV<<NIKOLAY<STOYANOV<<<<<<<<<<<<
Line 2: 3871103896BGR6909275M25091726909274109<<<<92

Please provide:
1. Updated parseMRZ() function with robust line detection
2. Enhanced image preprocessing in captureImage()
3. OCR error correction logic
4. Tesseract configuration improvements

Show me the complete updated functions with detailed comments explaining the improvements.
```

---

## Additional Context for AI

### MRZ TD3 Format Specification

**Line 1 (44 chars):**
```
Position 1:      P (document type)
Position 2:      < (filler)
Position 3-5:    BGR (issuing country - ISO 3166-1 alpha-3)
Position 6-44:   SURNAME<<GIVENNAMES<<<< (< separates names, fills to 44)
```

**Line 2 (44 chars):**
```
Position 1-9:    387110389 (passport number, < padded)
Position 10:     6 (check digit)
Position 11-13:  BGR (nationality)
Position 14-19:  690927 (birth date YYMMDD)
Position 20:     5 (check digit)
Position 21:     M (sex: M/F/<)
Position 22-27:  250917 (expiry date YYMMDD)
Position 28:     2 (check digit)
Position 29-42:  6909274109<<<< (optional data)
Position 43:     < (check digit)
Position 44:     9 (final check digit)
```

### Known OCR Confusion Matrix

```
Character → Common Misreads
O → 0, Q, D
0 → O, D
I → 1, l, |
1 → I, l, |
S → 5, $
5 → S
M → H, N, W
H → M, N
< → (missing), -, <
B → 8, 6
6 → G, 8, B
R → K, P
```

### Current Code Structure

```javascript
// 1. captureImage() - Lines 504-634
//    - Crops MRZ region
//    - Grayscale conversion
//    - Contrast stretching
//    - Sharpening filter
//    → Returns imageDataUrl

// 2. processImageWithOCR() - Lines 403-502
//    - Calls Tesseract.recognize()
//    - Gets raw text
//    - Calls parseMRZ()
//    → Returns passport data

// 3. parseMRZ() - Lines 257-400
//    - Cleans text
//    - Finds Line 1 (P<XXX pattern)
//    - Finds Line 2 (passport number pattern)
//    - Extracts fields
//    → Returns parsed data or throws error
```

### Alternative Libraries to Consider

If Tesseract.js can't achieve 85%+ accuracy, suggest:

1. **tesseract.js with custom training**
   - Train specifically on MRZ fonts (OCR-B)
   - Create traineddata for MRZ

2. **ZXing for text detection + Tesseract**
   - Use ZXing to detect line boundaries
   - Use Tesseract only for character recognition

3. **OpenCV.js + Tesseract**
   - OpenCV for advanced preprocessing
   - Better binarization and deskewing

4. **mrz npm package improvements**
   - Current `mrz` parser is good
   - Problem is OCR quality, not parsing

### Success Criteria

After improvements, test with 20 passport scans:
- **Target:** 17+ successful scans (85%+)
- **Current:** 12-15 successful scans (60-75%)

If 85%+ accuracy not achieved:
- Document why and recommend commercial solution (Dynamsoft)
- Provide cost/benefit analysis

---

## Summary

**Current Solution:**
- Free Tesseract.js OCR
- 60-75% accuracy
- 2-5 second processing
- Works but frustrates users

**Goal:**
- Improve to 85%+ accuracy
- Keep it free and open source
- Better preprocessing and parsing logic
- More robust error handling

**If it doesn't work:**
- Consider Dynamsoft ($500-5000/year)
- 95%+ accuracy, <1 sec processing
- Production-ready, proven solution

---

## Files to Share with AI

When using Cursor, make sure these files are open:

1. `src/components/SimpleCameraScanner.jsx` - Main component
2. This analysis document - Context
3. Example passport image (if available) - Testing

Cursor will have full context and can make targeted improvements.
