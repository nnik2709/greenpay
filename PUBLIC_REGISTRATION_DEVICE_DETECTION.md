# Public Registration - Device Detection & Passport Lookup

**Date**: 2026-01-17
**Feature**: Smart device detection for camera OCR (mobile) vs MRZ scanner (desktop) + Passport lookup

---

## Overview

Enhanced `PublicRegistration.jsx` page to intelligently detect device type and provide appropriate passport data entry methods:

- **Mobile Devices** (iPhone, Android, iPad, tablets): Camera-based OCR using Tesseract.js
- **Desktop PC**: Hardware MRZ keyboard scanner (PrehKeyTec) or manual entry
- **All Devices**: Passport number lookup with auto-fill from existing database

---

## Key Features

### 1. Device Detection
```javascript
const isMobileDevice = () => {
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android.*Tablet|Kindle|Silk/i.test(ua);
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  return isMobile || isTablet || (isTouchDevice && window.innerWidth < 1024);
};
```

### 2. Mobile: Camera OCR Scanner
- Uses `SimpleCameraScanner` component
- Tesseract.js OCR for passport MRZ detection
- Automatic field population from MRZ scan
- Fallback to manual entry if camera unavailable

### 3. Desktop: MRZ Keyboard Scanner
- Uses existing `useScannerInput` hook
- Detects PrehKeyTec MRZ scanner input
- Auto-fills fields from 88-character MRZ scan
- Manual entry as fallback

### 4. Passport Lookup
- Search by passport number in database
- Auto-fills existing passport data
- Shows which fields are missing
- Suggests completing missing required fields before submission

### 5. Field Validation
- Validates all fields before submission
- Shows clear messages for missing required fields
- Highlights which fields need attention
- Prevents submission with incomplete data

---

## Implementation Changes

### File Modified: `src/pages/PublicRegistration.jsx`

**New Imports:**
```javascript
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
```

**New State Variables:**
```javascript
const [deviceType, setDeviceType] = useState('desktop'); // 'mobile' or 'desktop'
const [showCameraScanner, setShowCameraScanner] = useState(false);
const [lookingUpPassport, setLookingUpPassport] = useState(false);
const [passportLookupResult, setPassportLookupResult] = useState(null);
const [missingFields, setMissingFields] = useState([]);
```

**New Functions:**

1. **`isMobileDevice()`** - Detects if user is on mobile/tablet
2. **`lookupPassportNumber(passportNum)`** - Searches database for existing passport
3. **`handlePassportLookup()`** - Triggered when user enters passport number
4. **`validateMissingFields()`** - Checks which required fields are missing
5. **`handleCameraScan(mrzData)`** - Processes camera OCR scan results

---

## User Experience Flows

### Flow 1: Mobile User with Camera
```
1. User opens page on iPhone/Android
2. System detects mobile device
3. Shows "Scan Passport with Camera" button
4. User taps button → camera opens
5. User scans passport MRZ
6. OCR extracts data → all fields auto-filled
7. User verifies data → submits
```

### Flow 2: Desktop User with MRZ Scanner
```
1. User opens page on desktop PC
2. System detects desktop device
3. Shows "Ready for MRZ Scanner" message
4. User scans passport with PrehKeyTec scanner
5. MRZ data captured → all fields auto-filled
6. User verifies data → submits
```

### Flow 3: Manual Entry with Passport Lookup
```
1. User enters passport number manually
2. System searches database
3. If found: Auto-fills existing data (name, DOB, nationality, etc.)
4. Shows which fields are missing
5. User completes missing fields
6. System validates → submits
```

### Flow 4: Completely New Passport
```
1. User enters passport number
2. System searches → not found
3. User manually enters all fields
4. System validates completeness
5. Highlights any missing required fields
6. User completes → submits
```

---

## API Endpoints Used

### 1. Passport Lookup
```
GET /api/passports/lookup/:passportNumber
```

**Response:**
```json
{
  "success": true,
  "passport": {
    "passport_number": "P1234567",
    "full_name": "JOHN DOE",
    "surname": "DOE",
    "given_names": "JOHN",
    "date_of_birth": "1990-01-15",
    "nationality": "Papua New Guinea",
    "sex": "Male"
  }
}
```

**OR (if not found):**
```json
{
  "success": false,
  "error": "Passport not found"
}
```

### 2. Register Passport (existing)
```
POST /api/public-purchases/register-passport
```

No changes needed to this endpoint.

---

## Backend Changes Required

### New Route: Passport Lookup

**File:** `backend/routes/passports.js`

Add this endpoint:

```javascript
/**
 * GET /api/passports/lookup/:passportNumber
 * Public endpoint to lookup passport by number
 * Used by PublicRegistration page for auto-fill
 */
router.get('/lookup/:passportNumber', async (req, res) => {
  try {
    const { passportNumber } = req.params;

    if (!passportNumber) {
      return res.status(400).json({
        success: false,
        error: 'Passport number is required'
      });
    }

    // Search for passport in database
    const query = `
      SELECT
        passport_number,
        full_name,
        surname,
        given_names,
        date_of_birth,
        nationality,
        sex
      FROM passports
      WHERE passport_number = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [passportNumber.toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Passport not found'
      });
    }

    return res.json({
      success: true,
      passport: result.rows[0]
    });

  } catch (error) {
    console.error('Passport lookup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to lookup passport'
    });
  }
});
```

---

## UI/UX Changes

### Mobile View
```
┌─────────────────────────────────────┐
│  PNG Green Fees - Registration     │
│  Voucher: VCH-XXXXX                │
├─────────────────────────────────────┤
│                                     │
│  📱 Mobile Device Detected          │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   📷 Scan Passport MRZ       │  │
│  │   (Use Camera)               │  │
│  └──────────────────────────────┘  │
│                                     │
│  - OR -                            │
│                                     │
│  ✍️ Enter Manually                 │
│  Passport Number: [_________]      │
│    [Lookup] button                 │
│                                     │
└─────────────────────────────────────┘
```

### Desktop View
```
┌─────────────────────────────────────┐
│  PNG Green Fees - Registration     │
│  Voucher: VCH-XXXXX                │
├─────────────────────────────────────┤
│                                     │
│  🖥️ Desktop PC Detected             │
│                                     │
│  📊 Ready for MRZ Scanner           │
│  Place passport in scanner...       │
│                                     │
│  - OR -                            │
│                                     │
│  ✍️ Enter Manually                 │
│  Passport Number: [_________]      │
│    [Lookup] button                 │
│                                     │
└─────────────────────────────────────┘
```

---

## Validation & Error Handling

### Missing Fields Detection
```javascript
const requiredFields = [
  { key: 'passportNumber', label: 'Passport Number' },
  { key: 'surname', label: 'Surname' },
  { key: 'givenName', label: 'Given Name' }
];

// Check which fields are missing
const missing = requiredFields.filter(field =>
  !formData[field.key] || formData[field.key].trim() === ''
);
```

### User Feedback
```
⚠️ Missing Required Fields:
   • Surname
   • Date of Birth

Please complete these fields before submitting.
```

---

## Testing Checklist

### Mobile Testing
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Test on iPad
- [ ] Camera scanner opens correctly
- [ ] OCR extracts MRZ data accurately
- [ ] Fields auto-fill from camera scan
- [ ] Manual entry works as fallback

### Desktop Testing
- [ ] Test on Windows PC
- [ ] Test on Mac
- [ ] MRZ scanner detection works
- [ ] Scanner input auto-fills fields
- [ ] Manual entry works

### Passport Lookup Testing
- [ ] Lookup existing passport → auto-fills data
- [ ] Lookup non-existent passport → shows "not found"
- [ ] Missing fields are highlighted
- [ ] User can complete missing fields
- [ ] Validation prevents submission with missing data

### Cross-Browser Testing
- [ ] Chrome (mobile & desktop)
- [ ] Safari (iOS & macOS)
- [ ] Firefox
- [ ] Edge

---

## Deployment Steps

### Step 1: Add Backend Passport Lookup Endpoint
1. Edit `backend/routes/passports.js`
2. Add the `/lookup/:passportNumber` endpoint (code above)
3. Upload to server via CloudPanel

### Step 2: Deploy Updated Frontend
1. Frontend changes already made in `src/pages/PublicRegistration.jsx`
2. Build frontend: `npm run build`
3. Upload `dist/` folder to server

### Step 3: Restart Services
```bash
pm2 restart greenpay-api
pm2 restart png-green-fees
```

### Step 4: Test End-to-End
1. Test mobile camera scanner
2. Test desktop MRZ scanner
3. Test passport lookup
4. Test validation
5. Test complete registration flow

---

## Benefits

1. **Mobile Users**: Easy camera-based passport scanning (no need for expensive hardware)
2. **Desktop Users**: Fast MRZ scanner support for high-volume processing
3. **All Users**: Smart passport lookup reduces data entry errors
4. **Validation**: Prevents incomplete submissions, improving data quality
5. **Flexibility**: Multiple input methods ensure accessibility for all users

---

## Success Metrics

After deployment, monitor:
- % of users using camera scanner (mobile)
- % of users using MRZ scanner (desktop)
- % of users with successful passport lookups
- Reduction in incomplete submissions
- User completion time (should be faster)

---

**Status**: ✅ READY FOR IMPLEMENTATION
**Risk Level**: LOW (additive feature, doesn't break existing functionality)
**Estimated Time**: 30 minutes deployment + testing
**Business Impact**: HIGH (improves user experience, reduces data entry errors)
