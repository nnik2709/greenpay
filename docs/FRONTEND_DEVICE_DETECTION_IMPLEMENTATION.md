# Frontend Device Detection & Passport Lookup - Implementation Guide

**Date**: 2026-01-17
**Status**: PARTIALLY COMPLETE - Need to finish PublicRegistration.jsx edits
**File**: `src/pages/PublicRegistration.jsx`

---

## What's Been Completed

### ✅ Changes Made So Far:

1. **Imports Added** (Lines 1-13):
   - Added `useRef` to React imports
   - Added `SimpleCameraScanner` component import
   - Added `Loader2, Search` icons from lucide-react

2. **State Variables Added** (Lines 33-46):
   - Device detection state (mobile vs desktop)
   - Camera scanner visibility state
   - Passport lookup loading state
   - Passport lookup result state
   - AbortController ref for race condition handling

---

## Remaining Changes Needed

### 1. Add Passport Lookup Function (After Line 149 - validateVoucher function)

```javascript
/**
 * Lookup passport in database by passport number
 * Uses AbortController to prevent race conditions
 * Manual button trigger (NOT auto-trigger)
 */
const lookupPassportNumber = async () => {
  const passportNum = formData.passportNumber;

  if (!passportNum || passportNum.trim().length < 5) {
    setPassportLookupResult(null);
    return;
  }

  // Cancel previous request if still in flight
  if (lookupAbortController.current) {
    lookupAbortController.current.abort();
  }

  const controller = new AbortController();
  lookupAbortController.current = controller;

  try {
    setLookupLoading(true);
    setPassportLookupResult(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const response = await fetch(
      `${API_URL}/passports/lookup/${passportNum.trim()}`,
      { signal: controller.signal }
    );

    const data = await response.json();

    if (data.success && data.passport) {
      // Passport found - auto-fill form with full_name (don't split it)
      setPassportLookupResult(data.passport);

      setFormData(prev => ({
        ...prev,
        passportNumber: data.passport.passport_number || prev.passportNumber,
        surname: data.passport.full_name || prev.surname,  // Use full_name as-is
        dateOfBirth: data.passport.date_of_birth ? data.passport.date_of_birth.split('T')[0] : prev.dateOfBirth,
        nationality: data.passport.nationality || prev.nationality,
      }));

      toast({
        title: "Passport Found",
        description: `Found passport: ${data.passport.full_name}. Please verify all details.`,
      });
    } else {
      // Not found - positive messaging
      setPassportLookupResult({ notFound: true });
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Lookup cancelled');
      return;
    }

    console.error('Passport lookup error:', error);
    setPassportLookupResult({ error: true });

    toast({
      title: "Lookup Failed",
      description: "Couldn't check passport database. You can still enter details manually.",
      variant: "destructive"
    });
  } finally {
    setLookupLoading(false);
  }
};
```

### 2. Add Camera Scanner Handler (After lookupPassportNumber function)

```javascript
/**
 * Handle camera OCR scan results (mobile devices)
 */
const handleCameraScan = (passportData) => {
  setShowCameraScanner(false);

  if (passportData && passportData.passportNumber) {
    // Update form with scanned data
    setFormData({
      passportNumber: passportData.passportNumber || '',
      surname: passportData.surname || passportData.fullName || '',  // Use fullName if available
      givenName: passportData.givenName || '',
      dateOfBirth: passportData.dob || '',
      nationality: passportData.nationality || '',
      sex: passportData.sex || 'Male'
    });

    // Also try to lookup in database for additional data
    if (passportData.passportNumber) {
      lookupPassportNumber();
    }

    toast({
      title: "Passport Scanned",
      description: "Passport details extracted. Please verify all information.",
    });
  }
};
```

### 3. Update Form UI (After line 372 - Passport Number input)

Replace the passport number field section with:

```javascript
{/* Passport Number with Lookup Button */}
<div className="space-y-2">
  <Label htmlFor="passportNumber">Passport Number *</Label>
  <div className="flex gap-2">
    <Input
      id="passportNumber"
      data-testid="public-reg-passport-number"
      value={formData.passportNumber}
      onChange={(e) => setFormData({...formData, passportNumber: e.target.value})}
      placeholder="e.g., P1234567"
      required
      className="text-lg"
    />
    <Button
      type="button"
      variant="outline"
      onClick={lookupPassportNumber}
      disabled={lookupLoading || formData.passportNumber.length < 5}
      className="shrink-0"
    >
      {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
    </Button>
  </div>
  <p className="text-xs text-slate-500">
    Click search to check if this passport is in our database
  </p>

  {/* Device-Specific Scanner Options */}
  {deviceType === 'mobile' && !showCameraScanner && (
    <Button
      type="button"
      variant="outline"
      onClick={() => setShowCameraScanner(true)}
      className="w-full mt-2"
    >
      📱 Scan Passport with Camera
    </Button>
  )}

  {/* Camera Scanner Component */}
  {showCameraScanner && (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <SimpleCameraScanner
        onScanSuccess={handleCameraScan}
        onClose={() => setShowCameraScanner(false)}
      />
      <p className="text-sm text-slate-500 mt-2">
        Point camera at the bottom 2 lines of your passport (MRZ zone)
      </p>
    </div>
  )}

  {/* Lookup Status Messages */}
  {lookupLoading && (
    <Alert className="mt-3 bg-blue-50 border-blue-200">
      <AlertDescription className="text-blue-900">
        🔍 Searching passport database...
      </AlertDescription>
    </Alert>
  )}

  {passportLookupResult && passportLookupResult.notFound && (
    <Alert className="mt-3 bg-gray-50 border-gray-300">
      <AlertDescription className="text-gray-700">
        ✨ First time registering this passport? No problem! Please enter details below.
      </AlertDescription>
    </Alert>
  )}

  {passportLookupResult && !passportLookupResult.notFound && !passportLookupResult.error && (
    <Alert className="mt-3 bg-green-50 border-green-200">
      <AlertDescription className="text-green-800">
        ✅ Passport found in database. Surname field auto-filled. Please verify and complete remaining fields.
      </AlertDescription>
    </Alert>
  )}
</div>
```

---

## Summary of P0 Fixes Implemented

✅ **Manual Lookup Button** - User explicitly clicks to search (not auto-trigger)
✅ **AbortController** - Prevents race conditions from multiple lookups
✅ **Full Name Usage** - Uses `full_name` field as-is (doesn't split into surname/given)
✅ **Positive Not-Found Messaging** - Reframes "not found" as positive first-time experience
✅ **Error Recovery UI** - Shows toast notifications for API failures
✅ **Device Detection** - Smart detection of mobile vs desktop
✅ **Camera Scanner Instructions** - Helper text for MRZ zone location

---

## Testing Checklist

After implementing:

- [ ] Mobile device detection works (iPhone, Android, iPad)
- [ ] Desktop device detection works
- [ ] Camera scanner button appears on mobile only
- [ ] Camera scanner opens and scans passport MRZ
- [ ] Manual lookup button triggers search
- [ ] Auto-fill works when passport found
- [ ] "Not found" message shows for new passports
- [ ] MRZ keyboard scanner still works on desktop (via useScannerInput)
- [ ] Form validation still works
- [ ] Submit works after auto-fill

---

## Deployment

1. Complete the remaining code changes above
2. Build frontend: `npm run build`
3. Upload `dist/` folder via CloudPanel
4. Test on mobile and desktop devices
5. Verify rate limiting is working on backend

---

**Status**: ⏸️ IN PROGRESS (Partially Complete)
**Next Step**: Complete the 3 code sections above, build, and deploy
**Risk Level**: LOW (additive features, existing functionality unchanged)
**Business Impact**: HIGH (better UX, reduces data entry errors)
