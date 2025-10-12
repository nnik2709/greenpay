# PNG Green Fees System - User Acceptance Testing Guide

## 🎯 **Overview**

This guide is designed for User Acceptance Testing (UAT) of the PNG Green Fees System. It provides step-by-step instructions for testing all features and functionality to ensure the system meets requirements before go-live.

**System URL:** https://eywademo.cloud  
**Test Environment:** Production-ready demo environment

---

## 📋 **Pre-Test Setup**

### **Test Credentials:**
- **Admin User:** admin@example.com / password123
- **Test Counter Agent:** agent@example.com / password123
- **Finance Manager:** finance@example.com / password123

### **Test Data Requirements:**
- Sample CSV file with passport data
- Test email addresses for quotation and batch email testing
- Mobile device for QR code scanning tests

---

## 🧪 **Test Scenarios**

### **Test 1: System Login & Authentication**

#### **1.1 Admin Login**
1. **Navigate to:** https://eywademo.cloud
2. **Enter credentials:**
   - Email: `admin@example.com`
   - Password: `password123`
3. **Expected Result:** ✅ Successful login, redirect to Dashboard
4. **Verify:** User profile shows "Admin" role

#### **1.2 Counter Agent Login**
1. **Logout** from admin account
2. **Login with:**
   - Email: `agent@example.com`
   - Password: `password123`
3. **Expected Result:** ✅ Successful login, access to Counter Agent features
4. **Verify:** Menu shows appropriate permissions (no admin features)

#### **1.3 Invalid Login**
1. **Try login with:**
   - Email: `invalid@example.com`
   - Password: `wrongpassword`
2. **Expected Result:** ❌ Error message, stay on login page

---

### **Test 2: Dashboard & Navigation**

#### **2.1 Dashboard Loading**
1. **Login as Admin**
2. **Verify Dashboard displays:**
   - ✅ Revenue charts and statistics
   - ✅ Recent activity summary
   - ✅ Quick action buttons
   - ✅ System status indicators

#### **2.2 Menu Navigation**
1. **Test all main menu items:**
   - ✅ Dashboard
   - ✅ Users
   - ✅ Passports
   - ✅ Purchases
   - ✅ Cash Reconciliation
   - ✅ Quotations
   - ✅ Reports
   - ✅ Settings
2. **Expected Result:** All menu items load correctly

---

### **Test 3: Passport Management**

#### **3.1 Individual Passport Entry**
1. **Navigate to:** Passports → Add New Passport
2. **Fill in test data:**
   - Passport Number: `TEST123456`
   - Surname: `Test`
   - Given Name: `User`
   - Nationality: `Papua New Guinea`
   - Date of Birth: `01/01/1990`
   - Gender: `Male`
3. **Click "Save"**
4. **Expected Result:** ✅ Passport saved, confirmation message
5. **Verify:** Passport appears in passport list

#### **3.2 Bulk Passport Upload**
1. **Navigate to:** Passports → Bulk Upload
2. **Prepare CSV file with sample data:**
   ```csv
   passport_number,surname,given_name,nationality,date_of_birth,gender
   BULK001,Doe,John,Papua New Guinea,1990-01-01,Male
   BULK002,Smith,Jane,Papua New Guinea,1992-05-15,Female
   BULK003,Johnson,Bob,Papua New Guinea,1988-12-10,Male
   ```
3. **Upload CSV file**
4. **Expected Result:** ✅ 3 passports processed successfully
5. **Verify:** All passports appear in passport list

#### **3.3 Passport Search & Filter**
1. **Navigate to:** Passports → View All
2. **Test search by:**
   - Passport number: `TEST123456`
   - Name: `Test User`
   - Nationality: `Papua New Guinea`
3. **Expected Result:** ✅ Relevant results returned
4. **Test filters:**
   - Date range
   - Status
   - Created by
5. **Expected Result:** ✅ Filters work correctly

---

### **Test 4: Purchase Management**

#### **4.1 Individual Purchase**
1. **Navigate to:** Purchases → New Purchase
2. **Fill purchase details:**
   - Customer: `Test Customer`
   - Passport: Select from existing passports
   - Service: `Green Fee`
   - Amount: `50.00`
   - Payment Method: `Cash`
3. **Click "Process Payment"**
4. **Expected Result:** ✅ Purchase completed, receipt generated
5. **Verify:** Purchase appears in purchase history

#### **4.2 Corporate Purchase**
1. **Navigate to:** Purchases → Corporate Purchase
2. **Fill corporate details:**
   - Company: `Test Corporation`
   - Contact: `corporate@test.com`
   - Number of Vouchers: `10`
   - Total Amount: `500.00`
3. **Click "Generate Corporate Vouchers"**
4. **Expected Result:** ✅ Vouchers generated, ZIP file downloadable
5. **Verify:** Corporate batch appears in batch history

---

### **Test 5: Quotation System**

#### **5.1 Create Quotation**
1. **Navigate to:** Quotations → New Quotation
2. **Fill quotation details:**
   - Customer: `Test Company`
   - Email: `test@company.com`
   - Services: Select multiple services
   - Quantities: Enter quantities
   - Discounts: Apply if applicable
3. **Click "Generate Quotation"**
4. **Expected Result:** ✅ Quotation created with unique number
5. **Verify:** Quotation appears in quotation list

#### **5.2 Send Quotation**
1. **Find created quotation in list**
2. **Click "Send" button**
3. **Enter recipient email:** `test@company.com`
4. **Click "Send Quotation"**
5. **Expected Result:** ✅ Email sent, status updated to "Sent"
6. **Verify:** Email logs show successful sending

#### **5.3 Approve Quotation**
1. **Find sent quotation**
2. **Click "Approve" button**
3. **Add approval notes if required**
4. **Click "Confirm Approval"**
5. **Expected Result:** ✅ Status updated to "Approved"

#### **5.4 Convert to Purchase**
1. **Find approved quotation**
2. **Click "Convert to Purchase"**
3. **Review conversion details**
4. **Click "Confirm Conversion"**
5. **Expected Result:** ✅ Purchase created, quotation status "Converted"

---

### **Test 6: Cash Reconciliation**

#### **6.1 Start Cash Reconciliation**
1. **Navigate to:** Cash Reconciliation
2. **Click "Start New Reconciliation"**
3. **Fill reconciliation details:**
   - Date: Today's date
   - Opening Float: `100.00`
   - Expected Cash: `500.00`
4. **Enter actual cash count:**
   - 100 Kina: `2` notes
   - 50 Kina: `4` notes
   - 20 Kina: `5` notes
   - Other denominations as needed
5. **Click "Complete Reconciliation"**
6. **Expected Result:** ✅ Reconciliation saved, variance calculated

#### **6.2 Approve Reconciliation**
1. **Login as Finance Manager**
2. **Navigate to:** Cash Reconciliation
3. **Find pending reconciliation**
4. **Click "Approve"**
5. **Add approval notes**
6. **Click "Confirm Approval"**
7. **Expected Result:** ✅ Status updated to "Approved"

---

### **Test 7: Reports & Analytics**

#### **7.1 Revenue Reports**
1. **Navigate to:** Reports → Revenue Generated
2. **Select date range:** Last 30 days
3. **Click "Generate Report"**
4. **Expected Result:** ✅ Report displays with real data
5. **Test export to Excel/PDF**

#### **7.2 Passport Reports**
1. **Navigate to:** Reports → Passport Reports
2. **Apply filters:**
   - Date range
   - Nationality
   - Status
3. **Expected Result:** ✅ Filtered results displayed
4. **Test export functionality**

#### **7.3 Bulk Upload Reports**
1. **Navigate to:** Reports → Bulk Upload Reports
2. **Verify data shows:**
   - Total uploads
   - Success/failure rates
   - Processing times
3. **Expected Result:** ✅ Real data from previous bulk uploads

#### **7.4 Quotation Reports**
1. **Navigate to:** Reports → Quotation Reports
2. **Filter by status:** Sent, Approved, Converted
3. **Expected Result:** ✅ Accurate status counts and revenue

---

### **Test 8: Corporate Batch Management**

#### **8.1 View Batch History**
1. **Navigate to:** Passports → Batch History
2. **Verify displays:**
   - Batch ID
   - Company name
   - Number of vouchers
   - Total amount
   - Status
   - Created date
3. **Expected Result:** ✅ All corporate batches listed

#### **8.2 Batch Details**
1. **Click "View Details" on any batch**
2. **Verify shows:**
   - Complete voucher list
   - Individual voucher details
   - Download options
3. **Expected Result:** ✅ Detailed view opens correctly

#### **8.3 Email Batch**
1. **In batch details, click "Email Batch"**
2. **Enter recipient email:** `test@company.com`
3. **Click "Send Email"**
4. **Expected Result:** ✅ Email sent successfully
5. **Verify:** Email logs show successful delivery

#### **8.4 Download ZIP**
1. **Click "Download ZIP"**
2. **Expected Result:** ✅ ZIP file downloads with all vouchers

---

### **Test 9: User Management**

#### **9.1 Create New User**
1. **Navigate to:** Users → Add User
2. **Fill user details:**
   - Email: `newuser@test.com`
   - Full Name: `New Test User`
   - Role: `Counter_Agent`
   - Password: `password123`
3. **Click "Create User"**
4. **Expected Result:** ✅ User created successfully

#### **9.2 Edit User**
1. **Find created user in user list**
2. **Click "Edit"**
3. **Update details:**
   - Change role to `Finance_Manager`
   - Update full name
4. **Click "Save Changes"**
5. **Expected Result:** ✅ User updated successfully

#### **9.3 Deactivate User**
1. **Find user in list**
2. **Click "Deactivate"**
3. **Confirm deactivation**
4. **Expected Result:** ✅ User status updated to inactive

---

### **Test 10: Settings & Configuration**

#### **10.1 Email Templates**
1. **Navigate to:** Settings → Email Templates
2. **Test template editing:**
   - Select a template
   - Modify content
   - Save changes
3. **Expected Result:** ✅ Template updated successfully

#### **10.2 Payment Modes**
1. **Navigate to:** Settings → Payment Modes
2. **Add new payment mode:**
   - Name: `Mobile Money`
   - Description: `Mobile payment method`
3. **Expected Result:** ✅ Payment mode added

#### **10.3 System Settings**
1. **Navigate to:** Settings → System Settings
2. **Update settings:**
   - Company name
   - Contact information
   - Default values
3. **Expected Result:** ✅ Settings saved successfully

---

## 🔍 **Performance Testing**

### **Load Testing**
1. **Open multiple browser tabs** (5-10 tabs)
2. **Perform simultaneous operations:**
   - Login multiple users
   - Create purchases
   - Generate reports
3. **Expected Result:** ✅ System remains responsive

### **Data Volume Testing**
1. **Upload large CSV file** (100+ records)
2. **Generate reports** with large date ranges
3. **Expected Result:** ✅ Operations complete within reasonable time

---

## 🚨 **Error Handling Testing**

### **Invalid Data Testing**
1. **Try to upload invalid CSV file**
2. **Enter invalid email formats**
3. **Submit forms with missing required fields**
4. **Expected Result:** ✅ Appropriate error messages displayed

### **Network Interruption Testing**
1. **Disconnect internet during operation**
2. **Reconnect and retry**
3. **Expected Result:** ✅ System handles gracefully, allows retry

---

## 📊 **Test Results Documentation**

### **Test Checklist Template**

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Admin Login | ⬜ Pass / ⬜ Fail | |
| 1.2 | Counter Agent Login | ⬜ Pass / ⬜ Fail | |
| 1.3 | Invalid Login | ⬜ Pass / ⬜ Fail | |
| 2.1 | Dashboard Loading | ⬜ Pass / ⬜ Fail | |
| 2.2 | Menu Navigation | ⬜ Pass / ⬜ Fail | |
| 3.1 | Individual Passport | ⬜ Pass / ⬜ Fail | |
| 3.2 | Bulk Upload | ⬜ Pass / ⬜ Fail | |
| 3.3 | Search & Filter | ⬜ Pass / ⬜ Fail | |
| 4.1 | Individual Purchase | ⬜ Pass / ⬜ Fail | |
| 4.2 | Corporate Purchase | ⬜ Pass / ⬜ Fail | |
| 5.1 | Create Quotation | ⬜ Pass / ⬜ Fail | |
| 5.2 | Send Quotation | ⬜ Pass / ⬜ Fail | |
| 5.3 | Approve Quotation | ⬜ Pass / ⬜ Fail | |
| 5.4 | Convert to Purchase | ⬜ Pass / ⬜ Fail | |
| 6.1 | Cash Reconciliation | ⬜ Pass / ⬜ Fail | |
| 6.2 | Approve Reconciliation | ⬜ Pass / ⬜ Fail | |
| 7.1 | Revenue Reports | ⬜ Pass / ⬜ Fail | |
| 7.2 | Passport Reports | ⬜ Pass / ⬜ Fail | |
| 7.3 | Bulk Upload Reports | ⬜ Pass / ⬜ Fail | |
| 7.4 | Quotation Reports | ⬜ Pass / ⬜ Fail | |
| 8.1 | Batch History | ⬜ Pass / ⬜ Fail | |
| 8.2 | Batch Details | ⬜ Pass / ⬜ Fail | |
| 8.3 | Email Batch | ⬜ Pass / ⬜ Fail | |
| 8.4 | Download ZIP | ⬜ Pass / ⬜ Fail | |
| 9.1 | Create User | ⬜ Pass / ⬜ Fail | |
| 9.2 | Edit User | ⬜ Pass / ⬜ Fail | |
| 9.3 | Deactivate User | ⬜ Pass / ⬜ Fail | |
| 10.1 | Email Templates | ⬜ Pass / ⬜ Fail | |
| 10.2 | Payment Modes | ⬜ Pass / ⬜ Fail | |
| 10.3 | System Settings | ⬜ Pass / ⬜ Fail | |

---

## 📝 **Issue Reporting Template**

### **Bug Report Format**
```
**Issue ID:** [Unique identifier]
**Test Case:** [Which test case failed]
**Severity:** [Critical/High/Medium/Low]
**Browser:** [Chrome/Firefox/Safari/Edge]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Screenshots:** [Attach if applicable]
**Additional Notes:** [Any other relevant information]
```

---

## ✅ **UAT Sign-off Criteria**

### **Minimum Requirements for Go-Live:**
- ✅ **All Critical tests pass** (Login, Core functionality)
- ✅ **All High priority tests pass** (Reports, Data integrity)
- ✅ **Performance acceptable** (< 5 seconds page load)
- ✅ **No data loss issues**
- ✅ **Email functionality working**
- ✅ **Export features working**

### **UAT Sign-off:**
- **Tester Name:** _________________
- **Date:** _________________
- **Status:** ⬜ **APPROVED** ⬜ **CONDITIONAL APPROVAL** ⬜ **REJECTED**
- **Comments:** _________________

---

## 🆘 **Support & Contact**

### **Technical Support:**
- **Email:** support@pnggreenfees.com
- **Phone:** [Contact Number]
- **Hours:** Monday-Friday, 8 AM - 5 PM

### **Emergency Contact:**
- **Email:** emergency@pnggreenfees.com
- **Phone:** [Emergency Number]

---

**🎯 This UAT guide ensures comprehensive testing of all PNG Green Fees System features before production deployment.**
