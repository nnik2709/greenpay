# PNG Green Fees System - User Guides

Welcome to the PNG Green Fees System user documentation. This directory contains comprehensive user guides for each role in the system.

---

## Available User Guides

### 1. [Counter Agent User Guide](COUNTER_AGENT_USER_GUIDE.md)
**For**: Frontline staff processing green fee vouchers at the counter

**Primary Functions**:
- Scan passports with MRZ scanner and generate vouchers
- Accept payments (cash, card, EFTPOS, bank transfer)
- Print, email, or download vouchers for customers
- Validate existing vouchers
- Link passports to corporate vouchers
- Perform daily cash reconciliation

**Key Pages**: 27 pages covering complete counter operations

---

### 2. [Finance Manager User Guide](FINANCE_MANAGER_USER_GUIDE.md)
**For**: Financial oversight and reporting staff

**Primary Functions**:
- Create and manage quotations for corporate customers
- Generate and send tax invoices
- Record payments and manage accounts receivable
- Generate corporate voucher batches
- Review and approve cash reconciliations
- Generate comprehensive financial reports
- Manage corporate customer accounts

**Key Pages**: 30 pages covering all financial operations

---

### 3. [Flex Admin User Guide](FLEX_ADMIN_USER_GUIDE.md)
**For**: System administrators with full access

**Primary Functions**:
- User management (create, edit, deactivate all users)
- System configuration (settings, email, security)
- Payment mode and gateway configuration
- Email template customization
- All Counter Agent functions
- All Finance Manager functions
- System monitoring and maintenance
- Security and audit management
- Data recovery and backup management

**Key Pages**: 40 pages covering complete system administration

---

### 4. [IT Support User Guide](IT_SUPPORT_USER_GUIDE.md)
**For**: Technical support staff assisting users

**Primary Functions**:
- User account management (create, reset passwords, unlock)
- Troubleshoot user issues (login, scanner, printer, reports)
- Manage support tickets
- Monitor system login history
- View-only access to reports and vouchers
- Escalate complex issues to Flex Admin

**Key Pages**: 28 pages covering technical support operations

---

## Quick Access by Role

| Feature | Counter Agent | Finance Manager | Flex Admin | IT Support |
|---------|--------------|----------------|-----------|-----------|
| **Individual Purchases** | ✅ Create | ❌ No | ✅ Create | ❌ No |
| **Scan & Validate** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Corporate Vouchers** | ❌ View Only | ✅ Create | ✅ Create | ❌ No |
| **Quotations** | ❌ No | ✅ Full | ✅ Full | ❌ No |
| **Invoices** | ❌ No | ✅ Full | ✅ Full | ✅ View Only |
| **Payments** | ❌ No | ✅ View/Record | ✅ Full | ❌ No |
| **Cash Reconciliation** | ✅ Submit | ✅ Approve | ✅ Approve | ✅ View Only |
| **Reports** | ❌ Cash Only | ✅ Most | ✅ All | ✅ Most (View Only) |
| **User Management** | ❌ No | ❌ No | ✅ Full | ✅ Full |
| **System Settings** | ❌ No | ❌ No | ✅ Full | ✅ View Only |
| **Support Tickets** | ❌ No | ❌ No | ✅ View | ✅ Manage |

---

## Getting Started

### Step 1: Identify Your Role
Determine which user guide applies to you based on your job function:
- **Counter staff** → Counter Agent User Guide
- **Accounting/Finance staff** → Finance Manager User Guide
- **System administrators** → Flex Admin User Guide
- **Technical support/IT staff** → IT Support User Guide

### Step 2: Read Your User Guide
Open the appropriate guide and review:
1. **Overview** - Understand your role and responsibilities
2. **Table of Contents** - See what features are available to you
3. **Main Functions** - Learn the step-by-step workflows
4. **Common Workflows** - See real-world scenarios
5. **Quick Reference** - Bookmark for daily use

### Step 3: Bookmark Key Pages
Save these links in your browser:
- System URL: https://greenpay.eywademo.cloud
- Your user guide (PDF or web link)
- Support contact: support@greenpay.eywademo.cloud

### Step 4: Practice
- Log in and explore your available menu items
- Try creating a test transaction (in training environment if available)
- Practice common workflows from your guide
- Ask questions if anything is unclear

---

## Training Resources

### User Guides (This Directory)
- **Counter Agent**: Operational procedures for counter staff
- **Finance Manager**: Financial management and reporting
- **Flex Admin**: Complete system administration
- **IT Support**: Technical support and troubleshooting

### Hardware Documentation
- PrehKeyTec MRZ Scanner: How to scan passports
- USB Barcode Scanner: How to scan vouchers
- POS Barcode Printer: How to print vouchers
- EFTPOS Terminal: Payment processing

### System Documentation
- System architecture overview
- Database schema
- API documentation (for developers)
- Deployment guide

---

## Common Questions

### Q: How do I log in?
**A**: Navigate to https://greenpay.eywademo.cloud and enter your email and password. See your user guide's "Login" section.

### Q: I forgot my password. What do I do?
**A**: Contact IT Support at support@greenpay.eywademo.cloud or call the support desk. They will reset your password.

### Q: Which scanner do I use for passports?
**A**: Use the **PrehKeyTec MRZ scanner** (keyboard wedge) to scan the Machine Readable Zone on passports. Place passport face-down on scanner.

### Q: How do I generate a voucher?
**A**: Counter Agents and Flex Admins can create vouchers via "Individual Exit Pass" page. See Counter Agent User Guide section 3.1.

### Q: How do I view reports?
**A**: All roles except Counter Agent have access to Reports menu. Available reports depend on your role. See your user guide's "Reports" section.

### Q: Who do I contact for technical issues?
**A**: Contact IT Support via:
- Email: support@greenpay.eywademo.cloud
- Support Tickets: In-system ticket submission
- Phone: [Insert support phone number]

### Q: Can I change my role?
**A**: No, only Flex Admin can change user roles. Contact your supervisor if you need different access.

### Q: How long are vouchers valid?
**A**: All vouchers are valid for **12 months** from the date of issue.

### Q: What is the green fee amount?
**A**: The standard green fee is **PGK 50.00** per person.

---

## System Requirements

### Supported Browsers
- Google Chrome (recommended) - version 90+
- Mozilla Firefox - version 88+
- Microsoft Edge - version 90+
- Safari - version 14+ (macOS only)

### Hardware Requirements (Counter Agents)
- **MRZ Scanner**: PrehKeyTec or compatible USB keyboard wedge scanner
- **Barcode Scanner**: USB or Bluetooth keyboard wedge scanner
- **Printer**: Thermal or laser printer for A4/A5 vouchers
- **Computer**: Windows 10+ or macOS 10.15+, 4GB RAM minimum
- **Internet**: Broadband connection (minimum 5 Mbps)

### Mobile Access
- System is responsive and works on tablets
- Scanner hardware requires desktop/laptop computer
- Reports and viewing functions work on mobile devices

---

## Support Contacts

### Primary Support
- **IT Support**: support@greenpay.eywademo.cloud
- **Support Tickets**: Submit via system (all roles)
- **Phone Support**: [Insert phone number]

### Role-Specific Contacts
- **Counter Agent Issues**: IT Support
- **Financial Questions**: Finance Manager
- **System Administration**: Flex Admin
- **Account Access**: IT Support

### Business Hours
- Monday - Friday: 8:00 AM - 5:00 PM PNG Time
- Saturday: 9:00 AM - 1:00 PM PNG Time
- Sunday/Public Holidays: Emergency support only

### Emergency Support
For critical system outages affecting customer service:
- Email: urgent@greenpay.eywademo.cloud
- Priority response within 30 minutes during business hours

---

## Document Information

| Document | Pages | Version | Last Updated |
|----------|-------|---------|-------------|
| Counter Agent User Guide | 27 | 1.0 | January 2026 |
| Finance Manager User Guide | 30 | 1.0 | January 2026 |
| Flex Admin User Guide | 40 | 1.0 | January 2026 |
| IT Support User Guide | 28 | 1.0 | January 2026 |

---

## Revision History

### Version 1.0 (January 2026)
- Initial release of all four user guides
- Comprehensive coverage of all system functions
- Step-by-step workflows with screenshots
- Common scenarios and troubleshooting
- Security best practices included

---

## Feedback and Improvements

We continuously improve our documentation based on user feedback.

**To suggest improvements**:
1. Email: support@greenpay.eywademo.cloud with subject "User Guide Feedback"
2. Include:
   - Which guide (Counter Agent, Finance Manager, etc.)
   - Page or section reference
   - What is unclear or missing
   - Suggestions for improvement

**Common improvement requests**:
- Screenshots of specific screens
- Video tutorials for complex workflows
- Quick reference cards for printing
- Translated versions (if needed)

---

## Additional Resources

### Related Documentation
- `CLAUDE.md` - Technical overview for developers
- `SUPABASE_SETUP.md` - Database setup guide
- `README.md` (root) - Project overview
- `USER_ROLES_FLOWS.md` - Role workflow diagrams

### External Links
- System URL: https://greenpay.eywademo.cloud
- Public website: https://pnggreenfees.gov.pg (if available)
- CCDA website: [Insert CCDA website]

---

## Copyright and Terms

© 2025 Eywa Systems. All rights reserved.

**Proprietary Information**: This documentation is proprietary and confidential. It is provided solely for the use of authorized PNG Green Fees System users.

**Restrictions**:
- Do not share with unauthorized persons
- Do not copy or distribute without permission
- Do not modify without authorization
- Internal use only

**Security Notice**: This system handles sensitive passport and financial data. All users must comply with:
- Data Protection Act
- Privacy policies
- Security protocols
- Audit requirements

Unauthorized access or misuse may result in legal action.

---

**For the latest version of these guides, always check**: `/docs/user-guides/` in the system repository.

**Questions?** Contact IT Support: support@greenpay.eywademo.cloud
