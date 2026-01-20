# PublicRegistration.jsx - Device Detection & Passport Lookup Implementation

**Date**: 2026-01-17
**File**: `src/pages/PublicRegistration.jsx` (487 lines)

---

## Implementation Summary

Adding 3 key features to PublicRegistration.jsx:
1. **Device Detection** - Detect mobile vs desktop devices
2. **Mobile Camera Scanner** - SimpleCameraScanner for passport OCR on mobile
3. **Passport Lookup** - Auto-fill from database when passport number entered

---

## Code Changes Required

### 1. Import SimpleCameraScanner Component

**Location**: Line 11 (after useScannerInput import)

```javascript
import SimpleCameraScanner from '@/components/SimpleCameraScanner';
```

---

### 2. Add New State Variables

**Location**: After line 29 (after photoPreview state)

```javascript
// Device detection
const [deviceType, setDeviceType] = useState(() => {
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android.*Tablet|Kindle|Silk/i.test(ua);
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  return (isMobile || isTablet || (isTouchDevice && window.innerWidth < 1024)) ? 'mobile' : 'desktop';
});
const [showCameraScanner, setShowCameraScanner] = useState(false);

// Passport lookup
const [lookupLoading, setLookupLoading] = useState(false);
const [passportLookupResult, setPassportLookupResult] = useState(null);
```

---

### 3. Add Passport Lookup Function

**Location**: After validateVoucher function (around line 150)

```javascript
/**
 * Lookup passport in database by passport number
 * Auto-fills form if passport exists
 */
const lookupPassportNumber = async (passportNum) => {
  if (!passportNum || passportNum.trim().length < 5) {
    setPassportLookupResult(null);
    return;
  }

  try {
    setLookupLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const response = await fetch(`${API_URL}/passports/lookup/${passportNum.trim()}`);
    const data = await response.json();

    if (data.success && data.passport) {
      // Passport found - auto-fill form
      setPassportLookupResult(data.passport);

      // Parse full_name into surname and given name
      const nameParts = data.passport.full_name ? data.passport.full_name.split(' ') : [];
      const surname = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
      const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';

      setFormData(prev => ({
        ...prev,
        passportNumber: data.passport.passport_number || prev.passportNumber,
        surname: surname || prev.surname,
        givenName: givenName || prev.givenName,
        dateOfBirth: data.passport.date_of_birth ? data.passport.date_of_birth.split('T')[0] : prev.dateOfBirth,
        nationality: data.passport.nationality || prev.nationality,
      }));

      toast({
        title: "Passport Found",
        description: "Details have been auto-filled from our records. Please verify and complete any missing fields.",
      });
    } else {
      // Passport not found - allow manual entry
      setPassportLookupResult({ notFound: true });
    }
  } catch (error) {
    console.error('Passport lookup error:', error);
    setPassportLookupResult(null);
  } finally {
    setLookupLoading(false);
  }
};
```

---

### 4. Add Camera Scanner Handler

**Location**: After lookupPassportNumber function

```javascript
/**
 * Handle camera OCR scan results (mobile devices)
 */
const handleCameraScan = (mrzData) => {
  setShowCameraScanner(false);

  if (mrzData && mrzData.passportNumber) {
    // Update form with scanned data
    setFormData({
      passportNumber: mrzData.passportNumber || '',
      surname: mrzData.surname || '',
      givenName: mrzData.givenName || '',
      dateOfBirth: mrzData.dob || '',
      nationality: mrzData.nationality || '',
      sex: mrzData.sex || 'Male'
    });

    // Also try to lookup in database
    if (mrzData.passportNumber) {
      lookupPassportNumber(mrzData.passportNumber);
    }

    toast({
      title: "Passport Scanned",
      description: "Passport details extracted. Please verify all information.",
    });
  }
};
```

---

### 5. Update handleInputChange to Trigger Lookup

**Location**: Find existing handleInputChange function (around line 200)

Add passport number lookup trigger:

```javascript
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  // Trigger passport lookup when passport number changes
  if (name === 'passportNumber' && value.length >= 5) {
    // Debounce the lookup
    const timeoutId = setTimeout(() => {
      lookupPassportNumber(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  }
};
```

---

### 6. Add Device-Specific Input UI (Mobile Camera Scanner)

**Location**: After passport number input field (after line 372)

```javascript
{/* Mobile Camera Scanner Button */}
{deviceType === 'mobile' && !showCameraScanner && (
  <div className="mt-3">
    <Button
      type="button"
      variant="outline"
      onClick={() => setShowCameraScanner(true)}
      className="w-full"
    >
      📱 Scan Passport with Camera
    </Button>
  </div>
)}

{/* Camera Scanner Component */}
{showCameraScanner && (
  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
    <SimpleCameraScanner
      onScanComplete={handleCameraScan}
      onClose={() => setShowCameraScanner(false)}
    />
  </div>
)}

{/* Passport Lookup Status */}
{lookupLoading && (
  <Alert className="mt-3">
    <AlertDescription>
      🔍 Looking up passport in database...
    </AlertDescription>
  </Alert>
)}

{passportLookupResult && passportLookupResult.notFound && (
  <Alert className="mt-3 bg-blue-50 border-blue-200">
    <AlertDescription>
      ℹ️ New passport. Please enter all details manually.
    </AlertDescription>
  </Alert>
)}

{passportLookupResult && !passportLookupResult.notFound && (
  <Alert className="mt-3 bg-green-50 border-green-200">
    <AlertDescription>
      ✅ Passport found in database. Fields auto-filled. Please verify.
    </AlertDescription>
  </Alert>
)}
```

---

### 7. Add Device Type Indicator (Optional)

**Location**: After voucher code display (around line 332)

```javascript
{/* Device Type Indicator */}
<Alert className="mb-4">
  <AlertDescription>
    {deviceType === 'mobile' ? (
      <>📱 Mobile device detected. You can use camera to scan your passport.</>
    ) : (
      <>🖥️ Desktop detected. Use MRZ scanner or enter details manually.</>
    )}
  </AlertDescription>
</Alert>
```

---

## Testing Checklist

After implementation:

- [ ] Mobile device detection works (iPhone, Android, iPad)
- [ ] Desktop device detection works
- [ ] Camera scanner button appears on mobile
- [ ] Camera scanner opens and scans passport MRZ
- [ ] Passport lookup triggers when typing passport number
- [ ] Auto-fill works when passport found in database
- [ ] "Not found" message shows for new passports
- [ ] MRZ keyboard scanner still works on desktop
- [ ] Form validation still works
- [ ] Submit still works after auto-fill

---

## Deployment

1. **Test locally**:
   ```bash
   npm run dev
   ```
   - Open on mobile (use iPhone/Android or Chrome DevTools mobile emulation)
   - Test camera scanner
   - Test passport lookup with known passport number (e.g., P1234567)

2. **Build frontend**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   - Upload `dist/` folder to server
   - Restart frontend: `pm2 restart png-green-fees`

---

## Impact

- **Mobile Users**: Can now use camera to scan passport (no expensive MRZ scanner needed)
- **All Users**: Auto-fill from database reduces data entry errors
- **Data Quality**: Passport lookup ensures consistency with existing records
- **User Experience**: Faster registration process, fewer manual entry errors

---

**Status**: ✅ Ready for implementation
**Complexity**: Medium (existing file structure supports these additions cleanly)
**Risk**: Low (additive features, existing functionality unchanged)
