# PNG Green Fees - UAT Quick Checklist

## 🚀 **Quick Start Testing**

**System URL:** https://eywademo.cloud  
**Admin Login:** admin@example.com / password123

---

## ✅ **Essential Tests (Must Pass)**

### **1. Authentication & Access**
- [ ] Admin login works
- [ ] Counter agent login works  
- [ ] Invalid login shows error
- [ ] Logout works properly

### **2. Core Functionality**
- [ ] Dashboard loads with data
- [ ] Individual passport entry works
- [ ] Bulk CSV upload processes correctly
- [ ] Individual purchase creation works
- [ ] Corporate voucher generation works

### **3. Quotation System**
- [ ] Create new quotation
- [ ] Send quotation via email
- [ ] Approve quotation
- [ ] Convert quotation to purchase

### **4. Reports**
- [ ] Revenue reports show data
- [ ] Passport reports work
- [ ] Bulk upload reports display correctly
- [ ] Export to Excel/PDF works

### **5. Corporate Batch Management**
- [ ] View batch history
- [ ] View batch details
- [ ] Email batch to recipient
- [ ] Download ZIP file

---

## 🔍 **Detailed Testing Areas**

### **Passport Management**
- [ ] Add individual passport
- [ ] Upload CSV with multiple passports
- [ ] Search passports by number/name
- [ ] Filter passports by criteria
- [ ] Edit existing passport
- [ ] View passport details

### **Purchase Processing**
- [ ] Process individual green fee
- [ ] Handle different payment methods
- [ ] Generate receipt
- [ ] View purchase history
- [ ] Corporate bulk purchase
- [ ] Voucher generation and download

### **Quotation Workflow**
- [ ] Create quotation with multiple services
- [ ] Send quotation via email
- [ ] Receive and view sent quotations
- [ ] Approve/reject quotations
- [ ] Convert approved quotations to purchases
- [ ] Track quotation status

### **Cash Reconciliation**
- [ ] Start new reconciliation
- [ ] Enter opening float
- [ ] Record actual cash count
- [ ] Calculate variance
- [ ] Submit for approval
- [ ] Approve reconciliation (as Finance Manager)

### **User Management**
- [ ] Create new user accounts
- [ ] Assign appropriate roles
- [ ] Edit user information
- [ ] Deactivate users
- [ ] View user activity

### **Settings & Configuration**
- [ ] Update email templates
- [ ] Configure payment methods
- [ ] Modify system settings
- [ ] Update company information

---

## 🧪 **Test Data Requirements**

### **Sample CSV for Bulk Upload:**
```csv
passport_number,surname,given_name,nationality,date_of_birth,gender
UAT001,Smith,John,Papua New Guinea,1990-01-15,Male
UAT002,Johnson,Jane,Papua New Guinea,1985-05-20,Female
UAT003,Brown,Mike,Papua New Guinea,1992-12-10,Male
```

### **Test Email Addresses:**
- `test@company.com` (for quotation testing)
- `batch@corporate.com` (for batch email testing)

---

## 🚨 **Critical Issues to Watch**

### **Authentication Issues**
- ❌ Login fails with correct credentials
- ❌ Session expires unexpectedly
- ❌ Users can access unauthorized features

### **Data Integrity Issues**
- ❌ Data not saved after form submission
- ❌ Incorrect calculations in reports
- ❌ Missing data after bulk upload

### **Email Functionality Issues**
- ❌ Quotation emails not sent
- ❌ Batch emails not delivered
- ❌ Email templates not working

### **Performance Issues**
- ❌ Pages take > 10 seconds to load
- ❌ Reports fail to generate
- ❌ System becomes unresponsive

---

## 📊 **Test Results Summary**

### **Overall Status:**
- [ ] **PASS** - All critical tests passed
- [ ] **CONDITIONAL PASS** - Minor issues identified
- [ ] **FAIL** - Critical issues found

### **Issues Found:**
| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1 | | Critical/High/Medium/Low | Open/Fixed |
| 2 | | Critical/High/Medium/Low | Open/Fixed |
| 3 | | Critical/High/Medium/Low | Open/Fixed |

### **Recommendations:**
- [ ] System ready for production
- [ ] Address minor issues before go-live
- [ ] Fix critical issues before proceeding

---

## 📝 **Sign-off**

**Tester:** _________________  
**Date:** _________________  
**Signature:** _________________

**Approval Status:**
- [ ] **APPROVED FOR PRODUCTION**
- [ ] **APPROVED WITH CONDITIONS**
- [ ] **NOT APPROVED**

**Comments:**
_________________________________________________
_________________________________________________

---

## 🆘 **Quick Support**

**Need Help?**
- Check the full UAT guide: `UAT_USER_GUIDE.md`
- Contact: support@pnggreenfees.com
- System URL: https://eywademo.cloud

**🎯 Complete this checklist to ensure your PNG Green Fees System is ready for production!**
