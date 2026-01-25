# How to Check Build Version

## 🔍 Quick Check - Browser Console

After deploying, open the browser console (F12 → Console tab) and you'll see:

```
🚀 GreenPay Build Info
Version: 1.0.0
Build Time: 01/25/2026, 14:35:22
Environment: production
Timestamp: 1769346922000
💡 Tip: Type window.__BUILD_INFO__ to see full build details
```

**This appears automatically when the page loads!**

---

## 📊 Visual Indicator (Bottom Right Corner)

In development mode, you'll see a small version badge in the bottom-right corner:

```
v1.0.0 • 2:35:22 PM
```

Click it to expand and see full build details.

**Note:** This is only visible in dev mode or when `VITE_SHOW_BUILD_VERSION=true` is set.

---

## 🧪 Check Current Deployed Version

### Method 1: Browser Console Command

Type in console:
```javascript
window.__BUILD_INFO__
```

You'll see:
```javascript
{
  version: "1.0.0",
  buildTime: "2026-01-25T14:35:22.123Z",
  buildTimestamp: 1769346922123,
  buildDate: "01/25/2026, 14:35:22",
  gitBranch: "main",
  environment: "production"
}
```

### Method 2: Check Filename

Look at the network tab or browser source for the IndividualPurchase file:

**Current build (Jan 25, 2026 14:35):**
```
IndividualPurchase-CUq-NwBy.js
```

**Old build:**
```
IndividualPurchase-DX0Wpeij.js
```

If you see different filenames, you're running different builds!

---

## ✅ Verify After Deployment

After deploying new `dist/` folder:

1. **Open the site** (e.g., https://greenpay.eywademo.cloud)

2. **Hard refresh** to clear cache:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R` (Mac)

3. **Open Console** (F12 → Console)

4. **Check build timestamp** - should match current date/time

5. **Verify:** If you see the new build time, you're running the latest code! ✅

---

## 🚨 If You See Old Build Time

This means the new build wasn't deployed or cache wasn't cleared:

**Fix:**
1. Verify `dist/` folder was uploaded correctly
2. Check file timestamps on server
3. Clear browser cache (hard refresh)
4. Try incognito/private window
5. Check if CDN is caching (if applicable)

---

## 📝 Build Timestamp Format

The timestamp is the number of milliseconds since January 1, 1970 (Unix epoch).

**Current build timestamp:** `1769346922000`

You can convert to human-readable:
```javascript
new Date(window.__BUILD_INFO__.buildTimestamp).toLocaleString()
// Output: "1/25/2026, 2:35:22 PM"
```

---

## 🔄 Deployment Workflow

1. **Build locally:** `npm run build`
2. **Note the timestamp** from console output
3. **Upload dist/ folder** to server
4. **Visit site and hard refresh**
5. **Check console** - should see NEW timestamp
6. **Verify:** `window.__BUILD_INFO__.buildTimestamp` matches

---

## 💡 Pro Tips

**Bookmark this JavaScript snippet:**
```javascript
console.log('Build:', new Date(window.__BUILD_INFO__.buildTimestamp).toLocaleString());
```

**Or create a shortcut:**
```javascript
// Run this in console to create a quick check function
window.checkBuild = () => {
  const b = window.__BUILD_INFO__;
  console.log('Version:', b.version);
  console.log('Built:', new Date(b.buildTimestamp).toLocaleString());
  console.log('Environment:', b.environment);
  console.log('Timestamp:', b.buildTimestamp);
  return b;
};

// Then just type: checkBuild()
```

---

## 🎯 Example: Checking If Latest

**Latest build info:**
- **File:** `IndividualPurchase-CUq-NwBy.js`
- **Timestamp:** `1769346922000` (or whatever shows after build)
- **Date:** Check your build output

**If you see these values in browser console, you're running the latest build!**

---

## 📦 Files to Check

The build version is embedded in:
- `dist/assets/index-[hash].js` (main bundle)
- Console logs on page load
- `window.__BUILD_INFO__` object

**Note:** Hash changes with every build, so filenames will be different!

---

**Quick Reference:**
```bash
# After deployment, in browser console:
window.__BUILD_INFO__

# Expected output:
# {version: "1.0.0", buildTimestamp: 1769346922000, ...}

# If timestamp is recent → ✅ Latest build deployed
# If timestamp is old → ❌ Old build still cached
```
