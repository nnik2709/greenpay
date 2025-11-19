# PNG GREEN FEES SYSTEM - USER GUIDE
## FORMATTING INSTRUCTIONS FOR MICROSOFT WORD

---

## 📋 **DOCUMENT SETUP FOR WORD**

### **Page Setup**
- **Paper Size:** A4 (210 x 297 mm)
- **Margins:** 2.5 cm (1 inch) on all sides
- **Orientation:** Portrait
- **Header:** 1.25 cm from top
- **Footer:** 1.25 cm from bottom

### **Font Settings**
- **Main Text:** Calibri, 11pt, Regular
- **Headings Level 1:** Calibri, 16pt, Bold, Dark Blue
- **Headings Level 2:** Calibri, 14pt, Bold, Dark Blue
- **Headings Level 3:** Calibri, 12pt, Bold, Dark Blue
- **Captions:** Calibri, 10pt, Italic
- **Code/Technical Text:** Consolas, 10pt, Regular

### **Color Scheme**
- **Primary Blue:** RGB(31, 73, 125)
- **Secondary Blue:** RGB(68, 114, 196)
- **Accent Green:** RGB(70, 136, 71)
- **Warning Orange:** RGB(217, 150, 74)
- **Error Red:** RGB(192, 0, 0)
- **Text Black:** RGB(0, 0, 0)

---

## 📄 **COPY THIS CONTENT INTO WORD**

---

# PNG GREEN FEES SYSTEM
## USER GUIDE & MANUAL

---

**Document Version:** 1.0  
**Date:** October 2025  
**System Version:** Production Release  
**Prepared by:** PNG Green Fees Development Team

---

## TABLE OF CONTENTS

1. SYSTEM OVERVIEW
2. GETTING STARTED
3. USER ROLES & PERMISSIONS
4. AUTHENTICATION & LOGIN
5. DASHBOARD
6. PASSPORT MANAGEMENT
7. PURCHASE PROCESSING
8. QUOTATION SYSTEM
9. CASH RECONCILIATION
10. REPORTS & ANALYTICS
11. CORPORATE BATCH MANAGEMENT
12. USER MANAGEMENT
13. SETTINGS & CONFIGURATION
14. TROUBLESHOOTING
15. FAQs
16. SUPPORT & CONTACT

---

## 1. SYSTEM OVERVIEW

### What is PNG Green Fees System?

The PNG Green Fees System is a comprehensive digital platform designed to streamline the processing of Papua New Guinea Green Fees for international travelers. The system automates the entire workflow from passport registration to payment processing, providing a seamless experience for both staff and customers.

### Key Features

• **Digital Passport Management:** Register and manage traveler passports electronically
• **Automated Payment Processing:** Handle individual and corporate payments efficiently
• **Quotation System:** Generate professional quotations for corporate clients
• **Cash Reconciliation:** Automated end-of-day cash reconciliation with approval workflows
• **Comprehensive Reporting:** Real-time analytics and detailed reports
• **Multi-User Support:** Role-based access control for different staff levels
• **Email Integration:** Automated email notifications and document delivery

### System Benefits

• **Increased Efficiency:** Reduce processing time by up to 70%
• **Improved Accuracy:** Eliminate manual data entry errors
• **Better Customer Service:** Faster processing and professional documentation
• **Enhanced Security:** Secure data handling and audit trails
• **Real-Time Insights:** Live dashboards and comprehensive reporting

---

## 2. GETTING STARTED

### System Requirements

**Web Browser Compatibility:**
• Google Chrome (Recommended)
• Mozilla Firefox
• Safari
• Microsoft Edge

**Internet Connection:**
• Stable broadband connection required
• Minimum 1 Mbps recommended

**Screen Resolution:**
• Minimum 1024x768 pixels
• Recommended 1366x768 or higher

### Accessing the System

**System URL:** https://eywademo.cloud

**Initial Login Credentials:**
• Username: admin@example.com
• Password: password123

**Important:** Change your password immediately after first login for security purposes.

---

## 3. USER ROLES & PERMISSIONS

### Admin
**Full System Access**
• Manage all system functions
• Create and manage user accounts
• Configure system settings
• Access all reports and analytics
• Override approvals when necessary

### Finance Manager
**Financial Operations**
• Approve cash reconciliations
• Review financial reports
• Manage quotation approvals
• Access revenue analytics
• Oversee corporate transactions

### Counter Agent
**Daily Operations**
• Process individual payments
• Register new passports
• Handle customer inquiries
• Perform cash reconciliation
• Generate basic reports

### Read-Only User
**View-Only Access**
• View reports and dashboards
• Access system information
• No modification permissions

---

## 4. AUTHENTICATION & LOGIN

### Logging In

1. **Open your web browser**
2. **Navigate to:** https://eywademo.cloud
3. **Enter your credentials:**
   • Email Address: Your assigned email
   • Password: Your secure password
4. **Click "Sign In"**

### Password Security

**Password Requirements:**
• Minimum 8 characters
• Must include uppercase and lowercase letters
• Must include at least one number
• Must include at least one special character

**Best Practices:**
• Use a unique password not used elsewhere
• Change password every 90 days
• Never share your password with others
• Log out when finished

### Troubleshooting Login Issues

**Forgotten Password:**
1. Click "Forgot Password" on login page
2. Enter your email address
3. Check your email for reset instructions
4. Follow the link to create new password

**Account Locked:**
• Contact your system administrator
• Wait 15 minutes before retrying
• Ensure correct email format

---

## 5. DASHBOARD

### Overview

The Dashboard provides a real-time overview of system activity and key performance indicators.

### Dashboard Components

**Revenue Summary**
• Daily, weekly, monthly revenue totals
• Comparison with previous periods
• Revenue trends and forecasts

**Activity Summary**
• Recent transactions
• System activity logs
• User activity overview

**Quick Actions**
• Direct access to common functions
• One-click navigation to key features
• Shortcut buttons for frequent tasks

**System Status**
• Current system health
• Active user count
• Performance indicators

### Navigation Menu

**Main Menu Items:**
• **Dashboard:** Overview and quick actions
• **Users:** User account management
• **Passports:** Passport registration and management
• **Purchases:** Payment processing
• **Cash Reconciliation:** End-of-day reconciliation
• **Quotations:** Corporate quotation management
• **Reports:** Analytics and reporting
• **Settings:** System configuration

---

## 6. PASSPORT MANAGEMENT

### Individual Passport Registration

**Step-by-Step Process:**

1. **Navigate to Passports → Add New Passport**

2. **Fill in Required Information:**
   • **Passport Number:** Enter the complete passport number
   • **Surname:** Traveler's last name
   • **Given Name:** Traveler's first name
   • **Nationality:** Select from dropdown list
   • **Date of Birth:** Use date picker or enter MM/DD/YYYY
   • **Gender:** Select Male or Female

3. **Optional Information:**
   • Place of Birth
   • Date of Issue
   • Place of Issue
   • File Number
   • Contact Email
   • Phone Number

4. **Review Information**
   • Verify all data is correct
   • Check for typos or errors

5. **Save Passport**
   • Click "Save" to register the passport
   • System will display confirmation message
   • Passport will be added to the database

### Bulk Passport Upload

**CSV File Format:**

Create a CSV file with the following columns:
```
passport_number,surname,given_name,nationality,date_of_birth,gender
P123456,Smith,John,Papua New Guinea,1990-01-15,Male
P789012,Johnson,Jane,Australia,1985-05-20,Female
```

**Upload Process:**

1. **Navigate to Passports → Bulk Upload**

2. **Prepare CSV File:**
   • Ensure proper column headers
   • Use correct date format (YYYY-MM-DD)
   • Save as CSV format

3. **Upload File:**
   • Click "Choose File" or drag and drop
   • Select your CSV file
   • Click "Upload and Process"

4. **Review Results:**
   • Check processing summary
   • Review any errors or warnings
   • Download error report if needed

**Common Upload Issues:**
• **Invalid Date Format:** Use YYYY-MM-DD format
• **Missing Required Fields:** Ensure all mandatory columns are present
• **Duplicate Passport Numbers:** Check for existing passports
• **Invalid Nationality:** Use exact country names from dropdown

---

## 7. PURCHASE PROCESSING

### Individual Purchase

**Processing Steps:**

1. **Navigate to Purchases → New Purchase**

2. **Customer Information:**
   • **Customer Name:** Enter customer's full name
   • **Contact Information:** Phone or email (optional)
   • **Passport:** Select from registered passports

3. **Service Selection:**
   • **Service Type:** Green Fee (standard)
   • **Amount:** System calculates automatically
   • **Quantity:** Number of services

4. **Payment Details:**
   • **Payment Method:** Cash, Card, Bank Transfer
   • **Amount Paid:** Enter amount received
   • **Change Due:** System calculates automatically

5. **Complete Transaction:**
   • Review all details
   • Click "Process Payment"
   • System generates receipt
   • Print or email receipt to customer

### Corporate Purchase

**Corporate Processing:**

1. **Navigate to Purchases → Corporate Purchase**

2. **Company Information:**
   • **Company Name:** Official company name
   • **Contact Person:** Responsible individual
   • **Email:** Corporate email address
   • **Phone:** Contact number

3. **Purchase Details:**
   • **Number of Vouchers:** Quantity required
   • **Service Type:** Green Fee vouchers
   • **Total Amount:** Calculated automatically

4. **Payment Processing:**
   • **Payment Method:** Corporate payment method
   • **Payment Reference:** Invoice or payment reference
   • **Payment Confirmation:** Upload receipt if required

5. **Voucher Generation:**
   • Click "Generate Corporate Vouchers"
   • System creates individual vouchers
   • Download ZIP file with all vouchers
   • Email vouchers to company contact

---

## 8. QUOTATION SYSTEM

### Creating Quotations

**Quotation Process:**

1. **Navigate to Quotations → New Quotation**

2. **Customer Details:**
   • **Company Name:** Corporate client name
   • **Contact Person:** Responsible individual
   • **Email Address:** For quotation delivery
   • **Phone Number:** Contact information
   • **Address:** Company address (optional)

3. **Service Selection:**
   • **Add Services:** Click "Add Service"
   • **Service Type:** Select from available services
   • **Quantity:** Number of services required
   • **Unit Price:** Service price per unit
   • **Total:** Calculated automatically

4. **Generate Quotation:**
   • Click "Generate Quotation"
   • System creates unique quotation number
   • Professional PDF quotation generated
   • Quotation saved to system

### Sending Quotations

**Email Delivery:**

1. **Find Quotation:**
   • Navigate to Quotations → View All
   • Locate the quotation to send
   • Click "Send" button

2. **Email Configuration:**
   • **Recipient Email:** Customer's email address
   • **Subject:** Auto-generated or custom
   • **Message:** Optional personalized message

3. **Send Quotation:**
   • Click "Send Quotation"
   • System emails PDF quotation
   • Status updated to "Sent"
   • Email delivery confirmation

---

## 9. CASH RECONCILIATION

### End-of-Day Process

**Daily Reconciliation Steps:**

1. **Navigate to Cash Reconciliation → Start New**

2. **Opening Information:**
   • **Date:** Current business date
   • **Opening Float:** Cash amount at start of day
   • **Expected Cash:** Calculated based on transactions

3. **Cash Count:**
   • **100 Kina Notes:** Count and enter quantity
   • **50 Kina Notes:** Count and enter quantity
   • **20 Kina Notes:** Count and enter quantity
   • **10 Kina Notes:** Count and enter quantity
   • **5 Kina Notes:** Count and enter quantity
   • **2 Kina Notes:** Count and enter quantity
   • **1 Kina Notes:** Count and enter quantity
   • **Coins:** Enter total coin value

4. **Complete Reconciliation:**
   • Review variance amount
   • Add notes if variance exists
   • Click "Complete Reconciliation"
   • Submit for approval

---

## 10. REPORTS & ANALYTICS

### Revenue Reports

**Daily Revenue Report:**
1. **Navigate to Reports → Revenue Generated**
2. **Select Date Range:** Choose specific date or period
3. **Apply Filters:** Payment method, service type, etc.
4. **Generate Report:** Click "Generate Report"
5. **Export Options:** Excel, PDF, or CSV format

**Report Components:**
• **Total Revenue:** Sum of all payments
• **Payment Method Breakdown:** Cash, card, transfer
• **Service Type Analysis:** Different service revenues
• **Daily Comparison:** Current vs previous periods
• **Trend Analysis:** Revenue patterns over time

### Passport Reports

**Passport Registration Report:**
1. **Navigate to Reports → Passport Reports**
2. **Select Filters:**
   • Date range
   • Nationality
   • Registration status
   • User who registered
3. **Generate Report**
4. **Export in preferred format**

---

## 11. CORPORATE BATCH MANAGEMENT

### Batch History

**Viewing Batch History:**
1. **Navigate to Passports → Batch History**
2. **Review Batch List:**
   • Batch ID and creation date
   • Company name and contact
   • Number of vouchers generated
   • Total amount and status
   • Created by user information

### Email Batch

**Sending Batch via Email:**
1. **Open Batch Details**
2. **Click "Email Batch"**
3. **Configure Email:**
   • **Recipient Email:** Corporate contact email
   • **Subject:** Professional subject line
   • **Message:** Optional personalized message
4. **Send Email:**
   • Click "Send Email"
   • System emails ZIP file with vouchers
   • Delivery confirmation provided

---

## 12. USER MANAGEMENT

### Creating New Users

**User Creation Process:**
1. **Navigate to Users → Add User**
2. **User Information:**
   • **Email Address:** Unique system identifier
   • **Full Name:** Complete user name
   • **Phone Number:** Contact information
   • **Department:** User's department/division

3. **Access Configuration:**
   • **Role Assignment:** Select appropriate role
   • **Permissions:** System-defined based on role
   • **Access Level:** Full, limited, or read-only

4. **Create User:**
   • Click "Create User"
   • System sends welcome email
   • User account activated

---

## 13. SETTINGS & CONFIGURATION

### Email Templates

**Managing Email Templates:**
1. **Navigate to Settings → Email Templates**
2. **Available Templates:**
   • **Quotation Email:** Corporate quotation delivery
   • **Batch Email:** Corporate voucher delivery
   • **Welcome Email:** New user notifications
   • **Password Reset:** Account recovery emails

### Payment Modes

**Payment Method Configuration:**
1. **Navigate to Settings → Payment Modes**
2. **Available Methods:**
   • **Cash:** Physical cash payments
   • **Credit Card:** Visa, MasterCard, AmEx
   • **Debit Card:** Local bank cards
   • **Bank Transfer:** Electronic transfers
   • **Mobile Money:** Mobile payment platforms

---

## 14. TROUBLESHOOTING

### Common Issues

**Login Problems:**
• **Invalid Credentials:** Verify email and password
• **Account Locked:** Contact administrator
• **Browser Issues:** Clear cache and cookies
• **Network Problems:** Check internet connection

**Performance Issues:**
• **Slow Loading:** Check internet speed
• **Browser Compatibility:** Use recommended browser
• **System Overload:** Avoid peak usage times
• **Cache Issues:** Clear browser cache

### Error Messages

**Common Error Messages:**

**"Invalid Login Credentials"**
• Check email spelling
• Verify password case sensitivity
• Ensure Caps Lock is off
• Try password reset

**"Session Expired"**
• Log in again
• Check system clock
• Clear browser cache
• Contact administrator if persistent

---

## 15. FAQs

### General Questions

**Q: What browsers are supported?**
A: The system works best with Google Chrome, Mozilla Firefox, Safari, and Microsoft Edge. Internet Explorer is not recommended.

**Q: Can I access the system from mobile devices?**
A: Yes, the system is mobile-responsive and works on tablets and smartphones, though some features are optimized for desktop use.

**Q: Is my data secure?**
A: Yes, the system uses industry-standard encryption and security measures to protect all data. Regular backups ensure data safety.

### Technical Questions

**Q: What if I forget my password?**
A: Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your email address.

**Q: How often should I change my password?**
A: The system requires password changes every 90 days, but you can change it more frequently for additional security.

**Q: Can multiple users work simultaneously?**
A: Yes, the system supports multiple concurrent users with proper role-based access controls.

---

## 16. SUPPORT & CONTACT

### Technical Support

**Email Support:**
• **Primary:** support@pnggreenfees.com
• **Emergency:** emergency@pnggreenfees.com
• **Response Time:** Within 4 hours during business hours

**Phone Support:**
• **General Support:** [Phone Number]
• **Emergency Line:** [Emergency Number]
• **Hours:** Monday-Friday, 8 AM - 6 PM

### Training & Resources

**User Training:**
• **New User Orientation:** Comprehensive system introduction
• **Role-Specific Training:** Tailored to job functions
• **Advanced Features:** Power user training sessions
• **Refresher Training:** Regular updates and new features

**Documentation:**
• **User Manual:** This comprehensive guide
• **Video Tutorials:** Step-by-step demonstrations
• **Quick Reference Cards:** Common tasks at a glance
• **FAQ Database:** Searchable question and answer system

---

**END OF DOCUMENT**

---

*This user guide is designed to provide comprehensive information about the PNG Green Fees System. For the most up-to-date information and additional support, please contact the system administrator or visit the online help center.*

**Document Control:**
• **Version:** 1.0
• **Last Updated:** October 2025
• **Next Review:** January 2026
• **Approved By:** PNG Green Fees Management Team

---

## 📝 **WORD FORMATTING CHECKLIST**

### **After Copying to Word:**

1. **Apply Styles:**
   - Select all text and apply "Normal" style
   - Apply "Heading 1" to main chapter titles
   - Apply "Heading 2" to section titles
   - Apply "Heading 3" to subsection titles

2. **Format Bullets:**
   - Convert all "•" to proper bullet points
   - Use consistent bullet style throughout

3. **Add Page Numbers:**
   - Insert page numbers in footer
   - Use "Page X of Y" format

4. **Create Table of Contents:**
   - Insert → Reference → Table of Contents
   - Update after formatting changes

5. **Add Headers/Footers:**
   - Insert document title in header
   - Add page numbers in footer

6. **Final Review:**
   - Check all hyperlinks work
   - Verify formatting consistency
   - Ensure proper page breaks
   - Print preview to check layout

---

**🎯 This document is now ready for Microsoft Word formatting and professional presentation!**







