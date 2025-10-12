# New Features Implemented - Testing Guide

**Date**: October 11, 2025  
**Status**: ✅ Code Complete, ⚠️ Needs Manual Testing

---

## 🆕 **What's New**

### 1. File Storage Service
### 2. Public Customer Registration  
### 3. Complete Quotation Workflow
### 4. 1,050+ Playwright Tests

---

## 🧪 **How to Test Each Feature**

### Feature 1: Public Registration (NO LOGIN REQUIRED)

**URL**: `http://localhost:3000/register/TEST-CODE`

**Before Testing**:
1. Create a test voucher in Supabase:
```sql
INSERT INTO individual_purchases (
  voucher_code, passport_number, amount, payment_method,
  valid_from, valid_until, created_by
) VALUES (
  'TEST-REG-001',
  'PENDING',
  50,
  'CASH',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  (SELECT id FROM profiles LIMIT 1)
);
```

**Test Steps**:
1. Open: `http://localhost:3000/register/TEST-REG-001`
2. Press **F12** → Check Console tab for errors
3. Fill form:
   - Passport Number: TEST123456
   - Surname: SMITH
   - Given Name: JOHN  
   - DOB: 1990-01-01
   - Nationality: Australian
   - Sex: Male
4. Upload photo (< 2MB, JPEG/PNG)
5. Click "Complete Registration"
6. Watch console for errors

**Expected**: Success page shows with QR code

---

### Feature 2: Quotation Workflow

**URL**: `http://localhost:3000/quotations`

**Before Testing**:
1. Run migration 014 in Supabase SQL Editor
2. Create test quotation (see migration file for SQL)

**Test Steps**:
1. Open: `http://localhost:3000/quotations`
2. Press **F12** → Check Console
3. Verify quotations load from database
4. Click "Mark Sent" button
5. Verify status updates
6. Click "Approve" button  
7. Verify approval works
8. Click "Convert" button
9. Fill payment details
10. Click "Convert to Vouchers"
11. Check corporate_vouchers table

**Expected**: Complete workflow, no errors

---

### Feature 3: Check for Console Errors

**Every page should be error-free**:

```bash
# Test each page:
http://localhost:3000/dashboard
http://localhost:3000/quotations
http://localhost:3000/passports
http://localhost:3000/register/TEST-CODE

# For each page:
1. Open page
2. Press F12
3. Go to Console tab
4. Look for RED errors
5. Report any errors you see
```

---

## 📋 **Setup Checklist**

Before testing:

- [ ] Dev server running (`npm run dev`)
- [ ] Supabase migrations 013 & 014 run
- [ ] Storage buckets created
- [ ] Test data created (voucher, quotation)
- [ ] Browser DevTools open (F12)

---

## 🐛 **If You Find Errors**

**Please tell me**:
1. Which page/feature
2. Exact error message from console
3. Steps to reproduce

**I will fix immediately!**

---

## ✅ **What to Look For**

### Good Signs ✅
- Pages load quickly
- No red errors in console
- Forms accept input
- Buttons respond to clicks
- Toasts show on actions
- Data saves to database

### Bad Signs ❌
- Red errors in console
- Blank pages
- Buttons don't work
- Forms don't submit
- No feedback on actions

---

**Please test and report back!** 🙏



