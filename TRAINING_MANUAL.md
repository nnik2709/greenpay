# PNG GREEN FEES SYSTEM
## TRAINING MANUAL

---

**Document Version:** 1.0  
**Date:** October 2025  
**System Version:** Production Release  
**Prepared by:** PNG Green Fees Development Team

---

## TABLE OF CONTENTS

1. [TRAINING OVERVIEW](#training-overview)
2. [SYSTEM ARCHITECTURE](#system-architecture)
3. [ROLE-BASED TRAINING](#role-based-training)
4. [HANDS-ON EXERCISES](#hands-on-exercises)
5. [ASSESSMENT & CERTIFICATION](#assessment--certification)
6. [ADVANCED FEATURES](#advanced-features)
7. [BEST PRACTICES](#best-practices)
8. [TROUBLESHOOTING WORKSHOP](#troubleshooting-workshop)

---

## TRAINING OVERVIEW

### Training Objectives

By the end of this training program, participants will be able to:

- **Navigate the PNG Green Fees System** efficiently and confidently
- **Process transactions** accurately using all system features
- **Generate reports** and analyze system data effectively
- **Troubleshoot common issues** independently
- **Follow security protocols** and best practices
- **Provide excellent customer service** using system tools

### Training Methodology

**Blended Learning Approach:**
- **Instructor-Led Training:** Interactive classroom sessions
- **Hands-On Practice:** Real system exercises with sample data
- **E-Learning Modules:** Self-paced online learning
- **Assessment Tests:** Knowledge validation and certification
- **On-The-Job Support:** Mentoring during initial system use

### Training Schedule

**Phase 1: Foundation (Day 1-2)**
- System overview and navigation
- User roles and permissions
- Basic transaction processing

**Phase 2: Operations (Day 3-4)**
- Advanced features and workflows
- Reporting and analytics
- Corporate client management

**Phase 3: Mastery (Day 5)**
- Troubleshooting and problem-solving
- Best practices and optimization
- Assessment and certification

---

## SYSTEM ARCHITECTURE

### Core Components

**Frontend Application**
- React-based web interface
- Responsive design for all devices
- Real-time data updates
- Intuitive user experience

**Backend Services**
- Supabase cloud platform
- PostgreSQL database
- Edge Functions for business logic
- RESTful API architecture

**Security Layer**
- Role-based access control
- Data encryption and protection
- Audit trails and logging
- Session management

### Data Flow

**Transaction Processing:**
1. User inputs data through web interface
2. Data validated on frontend and backend
3. Business logic processed via Edge Functions
4. Data stored in secure PostgreSQL database
5. Real-time updates reflected in interface

**Reporting System:**
1. Data aggregated from multiple tables
2. Reports generated using Supabase queries
3. Results formatted for export (Excel, PDF, CSV)
4. Real-time dashboard updates

---

## ROLE-BASED TRAINING

### Admin Training

**Day 1: System Administration**
- User account management
- Role assignment and permissions
- System configuration and settings
- Security protocols and monitoring

**Day 2: Advanced Administration**
- Data backup and recovery procedures
- Performance monitoring and optimization
- Integration management
- Disaster recovery planning

**Hands-On Exercises:**
- Create and manage user accounts
- Configure system settings
- Set up email templates
- Monitor system performance

### Finance Manager Training

**Day 1: Financial Operations**
- Cash reconciliation procedures
- Quotation approval workflows
- Revenue reporting and analysis
- Budget monitoring and forecasting

**Day 2: Advanced Financial Management**
- Corporate client management
- Bulk transaction processing
- Financial audit preparation
- Compliance reporting

**Hands-On Exercises:**
- Approve cash reconciliations
- Review and approve quotations
- Generate financial reports
- Process corporate transactions

### Counter Agent Training

**Day 1: Daily Operations**
- Passport registration and management
- Individual payment processing
- Customer service procedures
- Basic reporting functions

**Day 2: Advanced Operations**
- Bulk passport uploads
- Complex transaction handling
- Customer query resolution
- End-of-day procedures

**Hands-On Exercises:**
- Register individual passports
- Process various payment types
- Handle customer inquiries
- Perform daily reconciliation

---

## HANDS-ON EXERCISES

### Exercise 1: Passport Registration

**Objective:** Register a new passport in the system

**Scenario:** A traveler arrives with passport P987654, surname "Williams", given name "Sarah", nationality "Australia", date of birth "15/03/1985", gender "Female"

**Steps:**
1. Navigate to Passports → Add New Passport
2. Enter passport number: P987654
3. Enter surname: Williams
4. Enter given name: Sarah
5. Select nationality: Australia
6. Enter date of birth: 15/03/1985
7. Select gender: Female
8. Click Save
9. Verify passport appears in passport list

**Success Criteria:**
- Passport saved without errors
- All data entered correctly
- Passport visible in search results

### Exercise 2: Payment Processing

**Objective:** Process a green fee payment for a registered passport

**Scenario:** Customer John Smith (passport P123456) wants to pay PGK 50 for green fee using cash payment of PGK 100

**Steps:**
1. Navigate to Purchases → New Purchase
2. Enter customer name: John Smith
3. Select passport: P123456
4. Select service: Green Fee
5. Verify amount: PGK 50
6. Select payment method: Cash
7. Enter amount paid: PGK 100
8. Verify change due: PGK 50
9. Click Process Payment
10. Print receipt

**Success Criteria:**
- Transaction processed successfully
- Receipt generated correctly
- Change calculated properly
- Transaction recorded in system

### Exercise 3: Bulk Passport Upload

**Objective:** Upload multiple passports using CSV file

**Scenario:** Upload 5 passports from a CSV file with sample data

**Steps:**
1. Prepare CSV file with required columns
2. Navigate to Passports → Bulk Upload
3. Click Choose File and select CSV
4. Click Upload and Process
5. Review processing results
6. Check error report if any errors
7. Verify passports in passport list

**Success Criteria:**
- All valid passports uploaded successfully
- Error report generated for invalid data
- Upload statistics displayed correctly

### Exercise 4: Quotation Creation

**Objective:** Create and send a quotation to a corporate client

**Scenario:** Create quotation for ABC Corporation requesting 10 green fee vouchers

**Steps:**
1. Navigate to Quotations → New Quotation
2. Enter company: ABC Corporation
3. Enter contact: corporate@abc.com
4. Add service: Green Fee
5. Enter quantity: 10
6. Verify total amount
7. Click Generate Quotation
8. Click Send to email quotation
9. Verify status updated to "Sent"

**Success Criteria:**
- Quotation generated with unique number
- Professional PDF created
- Email sent successfully
- Status updated correctly

### Exercise 5: Cash Reconciliation

**Objective:** Perform end-of-day cash reconciliation

**Scenario:** Complete reconciliation with opening float PGK 100, expected cash PGK 500, actual count shows various denominations

**Steps:**
1. Navigate to Cash Reconciliation → Start New
2. Enter date and opening float: PGK 100
3. Count cash denominations:
   - 100 Kina: 2 notes
   - 50 Kina: 4 notes
   - 20 Kina: 5 notes
   - 10 Kina: 2 notes
   - 5 Kina: 1 note
4. Verify total actual cash
5. Check variance calculation
6. Add notes if variance exists
7. Click Complete Reconciliation
8. Submit for approval

**Success Criteria:**
- Cash counted accurately
- Variance calculated correctly
- Reconciliation submitted successfully
- Ready for approval workflow

---

## ASSESSMENT & CERTIFICATION

### Knowledge Assessment

**Written Test (30 minutes)**
- Multiple choice questions (20 questions)
- System navigation and features
- Security protocols and procedures
- Error handling and troubleshooting

**Practical Test (45 minutes)**
- Complete end-to-end transaction
- Handle error scenarios
- Generate and export reports
- Demonstrate system proficiency

### Performance Criteria

**Passing Score:** 80% or higher

**Assessment Areas:**
- **Accuracy:** Correct data entry and processing
- **Efficiency:** Speed and workflow optimization
- **Problem-Solving:** Handling errors and exceptions
- **Security:** Following security protocols
- **Customer Service:** Professional interaction skills

### Certification Process

**Upon Successful Completion:**
1. **Certificate of Completion** issued
2. **System Access** activated for production use
3. **Mentor Assignment** for ongoing support
4. **Refresher Training** scheduled for 3 months

**Recertification Requirements:**
- Annual refresher training
- System update training
- Performance review
- Security awareness updates

---

## ADVANCED FEATURES

### Corporate Client Management

**Bulk Operations:**
- Mass passport registration
- Corporate voucher generation
- Batch email communications
- Bulk payment processing

**Client Portal Features:**
- Online quotation requests
- Payment tracking
- Document downloads
- Account management

### Integration Capabilities

**API Integration:**
- Third-party system connectivity
- Data import/export functions
- Automated reporting
- External payment gateways

**Mobile Applications:**
- Mobile-optimized interface
- Offline capability
- Push notifications
- Location-based services

### Advanced Reporting

**Custom Reports:**
- User-defined report templates
- Scheduled report generation
- Automated email distribution
- Dashboard customization

**Analytics and Insights:**
- Trend analysis
- Performance metrics
- Predictive analytics
- Business intelligence

---

## BEST PRACTICES

### Data Entry Standards

**Accuracy Guidelines:**
- Double-check all data entry
- Use consistent formatting
- Verify customer information
- Validate payment amounts

**Efficiency Tips:**
- Use keyboard shortcuts
- Leverage bulk operations
- Maintain organized workspace
- Follow standard procedures

### Customer Service Excellence

**Professional Standards:**
- Greet customers warmly
- Listen actively to requests
- Explain processes clearly
- Provide accurate information

**Problem Resolution:**
- Stay calm under pressure
- Escalate when necessary
- Document all interactions
- Follow up on commitments

### Security Protocols

**Daily Security Practices:**
- Log out when finished
- Never share passwords
- Report suspicious activity
- Keep workstations secure

**Data Protection:**
- Handle personal data carefully
- Follow privacy regulations
- Secure document storage
- Regular backup procedures

---

## TROUBLESHOOTING WORKSHOP

### Common Issues and Solutions

**Login Problems:**
- **Issue:** Cannot log in with correct credentials
- **Solution:** Clear browser cache, check Caps Lock, try password reset
- **Prevention:** Regular password updates, secure password practices

**Upload Failures:**
- **Issue:** CSV file upload fails
- **Solution:** Check file format, validate column headers, verify data types
- **Prevention:** Use provided templates, validate data before upload

**Performance Issues:**
- **Issue:** System runs slowly
- **Solution:** Check internet connection, close unnecessary tabs, clear cache
- **Prevention:** Regular system maintenance, optimal browser settings

### Error Resolution Process

**Step 1: Identify the Problem**
- Read error messages carefully
- Note system behavior
- Check recent changes
- Document symptoms

**Step 2: Attempt Basic Solutions**
- Refresh the page
- Log out and log back in
- Clear browser cache
- Check internet connection

**Step 3: Escalate if Needed**
- Contact system administrator
- Provide detailed error information
- Include screenshots if possible
- Document attempted solutions

### Emergency Procedures

**System Outage:**
1. Notify management immediately
2. Implement manual procedures
3. Document all transactions
4. Resume normal operations when system returns

**Data Issues:**
1. Stop all transactions
2. Contact technical support
3. Preserve current data state
4. Follow recovery procedures

---

**END OF TRAINING MANUAL**

---

*This training manual provides comprehensive guidance for learning and mastering the PNG Green Fees System. Regular updates ensure alignment with system enhancements and best practices.*

**Document Control:**
- **Version:** 1.0
- **Last Updated:** October 2025
- **Next Review:** January 2026
- **Training Coordinator:** PNG Green Fees Training Team
