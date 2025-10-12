# PNG Green Fees System - Automated UAT Tests

## 🎯 Overview

This directory contains comprehensive automated User Acceptance Testing (UAT) scripts for the PNG Green Fees System using Playwright. The tests cover all functionality outlined in the `UAT_USER_GUIDE.md` and provide automated validation of the entire system.

## 📋 Test Coverage

### **Authentication & Authorization**
- ✅ Admin login/logout
- ✅ Counter agent login/logout  
- ✅ Finance manager login/logout
- ✅ Invalid login handling
- ✅ Role-based access control

### **Passport Management**
- ✅ Individual passport entry
- ✅ Bulk CSV upload processing
- ✅ Passport search and filtering
- ✅ Passport editing and management

### **Purchase Processing**
- ✅ Individual green fee purchases
- ✅ Corporate bulk purchases
- ✅ Multiple payment methods
- ✅ Receipt generation

### **Quotation System**
- ✅ Quotation creation
- ✅ Email sending functionality
- ✅ Approval workflow
- ✅ Conversion to purchases

### **Cash Reconciliation**
- ✅ End-of-day reconciliation
- ✅ Multi-level approval process
- ✅ Variance calculation
- ✅ Audit trail

### **Reports & Analytics**
- ✅ Revenue reports
- ✅ Passport reports
- ✅ Bulk upload reports
- ✅ Quotation reports
- ✅ Export functionality

### **Corporate Batch Management**
- ✅ Batch history viewing
- ✅ Batch details display
- ✅ Email batch functionality
- ✅ ZIP file downloads

### **User Management**
- ✅ User creation
- ✅ User editing
- ✅ User deactivation
- ✅ Role management

### **Settings & Configuration**
- ✅ Email template management
- ✅ Payment mode configuration
- ✅ System settings updates

### **Performance & Error Handling**
- ✅ Load testing with multiple sessions
- ✅ Error handling validation
- ✅ Form validation testing
- ✅ Data integrity checks

### **End-to-End Workflows**
- ✅ Complete customer journey testing
- ✅ Multi-step process validation
- ✅ Cross-module integration testing

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ installed
- Access to https://eywademo.cloud
- Test credentials available

### **Installation**
```bash
# Navigate to the playwright directory
cd playwright

# Install dependencies
npm install

# Install Playwright browsers
npm run test:install
```

### **Running Tests**

#### **Run All UAT Tests**
```bash
npm run test:uat
```

#### **Run Tests in Headed Mode (See Browser)**
```bash
npm run test:uat-headed
```

#### **Run Tests in Debug Mode**
```bash
npm run test:uat-debug
```

#### **Run Tests with UI Mode**
```bash
npm run test:ui
```

#### **Run Specific Browser Tests**
```bash
# Chrome only
npm run test:chromium

# Firefox only  
npm run test:firefox

# Safari only
npm run test:webkit

# Mobile Chrome
npm run test:mobile
```

#### **Run All Browsers**
```bash
npm run test:all-browsers
```

---

## 📊 Test Reports

### **HTML Report**
```bash
npm run test:report
```
Opens detailed HTML report in browser with:
- Test results overview
- Screenshots of failures
- Video recordings
- Test traces
- Performance metrics

### **JSON Report**
Test results are automatically saved to `test-results.json` with detailed information about each test.

### **JUnit Report**
Test results are saved to `test-results.xml` for CI/CD integration.

---

## 🔧 Configuration

### **Test Environment**
- **Base URL:** https://eywademo.cloud
- **Test Credentials:**
  - Admin: admin@example.com / password123
  - Agent: agent@example.com / password123
  - Finance: finance@example.com / password123

### **Test Data**
Tests use dynamic test data with timestamps to avoid conflicts:
- Passport numbers: `TEST{timestamp}`, `DEMO{timestamp}`, etc.
- Customer names: `Test Customer`, `Demo Company`, etc.
- Email addresses: `test@company.com`, `demo@corporate.com`

### **Browser Support**
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile Chrome
- ✅ Mobile Safari

---

## 🧪 Test Structure

### **Test Organization**
```
playwright/
├── uat-automated-tests.spec.js    # Main test file
├── global-setup.js                # Pre-test setup
├── global-teardown.js             # Post-test cleanup
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

### **Test Categories**
- **Authentication Tests** (Test 1)
- **Dashboard & Navigation Tests** (Test 2)
- **Passport Management Tests** (Test 3)
- **Purchase Management Tests** (Test 4)
- **Quotation System Tests** (Test 5)
- **Cash Reconciliation Tests** (Test 6)
- **Reports & Analytics Tests** (Test 7)
- **Corporate Batch Management Tests** (Test 8)
- **User Management Tests** (Test 9)
- **Settings & Configuration Tests** (Test 10)
- **Performance & Error Handling Tests**
- **End-to-End Workflow Tests**

---

## 🔍 Debugging Tests

### **Debug Mode**
```bash
npm run test:uat-debug
```
Opens browser in debug mode where you can:
- Step through tests line by line
- Inspect elements
- View console logs
- Modify test data

### **Trace Viewer**
```bash
npm run test:trace
```
Opens Playwright's trace viewer to analyze test execution:
- See exactly what happened during test
- View network requests
- Check element interactions
- Debug failures

### **Code Generation**
```bash
npm run test:codegen
```
Opens browser with Playwright Inspector to record new tests:
- Record user interactions
- Generate test code automatically
- Export to test files

---

## 📈 Performance Testing

### **Load Testing**
The test suite includes load testing scenarios:
- Multiple concurrent browser sessions
- Simultaneous operations
- Response time validation
- Resource usage monitoring

### **Performance Metrics**
Tests capture:
- Page load times
- API response times
- Memory usage
- Network requests

---

## 🚨 Error Handling

### **Automatic Screenshots**
Screenshots are automatically captured on test failures and saved to `test-results/`.

### **Video Recording**
Videos of failed tests are recorded and saved for debugging.

### **Retry Logic**
Tests automatically retry on failure (configurable in `playwright.config.js`).

### **Error Reporting**
Detailed error messages include:
- Stack traces
- Element selectors
- Expected vs actual values
- Network request details

---

## 🔄 CI/CD Integration

### **GitHub Actions Example**
```yaml
name: UAT Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: |
        cd playwright
        npm install
        npx playwright install
    - name: Run UAT tests
      run: |
        cd playwright
        npm run test:uat
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright/playwright-report/
```

### **Jenkins Pipeline Example**
```groovy
pipeline {
    agent any
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'cd playwright && npm install'
                sh 'cd playwright && npx playwright install'
            }
        }
        stage('Run UAT Tests') {
            steps {
                sh 'cd playwright && npm run test:uat'
            }
        }
    }
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright/playwright-report',
                reportFiles: 'index.html',
                reportName: 'UAT Test Report'
            ])
        }
    }
}
```

---

## 📝 Test Maintenance

### **Adding New Tests**
1. Open `uat-automated-tests.spec.js`
2. Add new test within appropriate describe block
3. Follow existing naming conventions
4. Include proper assertions and cleanup

### **Updating Selectors**
If UI changes, update selectors in:
- `data-testid` attributes (preferred)
- CSS selectors
- XPath expressions

### **Test Data Management**
- Use dynamic data with timestamps
- Clean up test data in teardown
- Avoid hardcoded values that might conflict

---

## 🆘 Troubleshooting

### **Common Issues**

#### **Tests Failing Due to Timeouts**
```bash
# Increase timeout in playwright.config.js
timeout: 60000, // Increase from default
```

#### **Element Not Found**
```bash
# Use debug mode to inspect elements
npm run test:uat-debug
```

#### **Network Issues**
```bash
# Check if application is accessible
curl -I https://eywademo.cloud
```

#### **Browser Installation Issues**
```bash
# Reinstall browsers
npx playwright install --force
```

### **Getting Help**
- Check Playwright documentation: https://playwright.dev
- Review test traces in trace viewer
- Check console logs in debug mode
- Contact development team for assistance

---

## 📊 Test Metrics

### **Success Criteria**
- ✅ All critical tests pass (100%)
- ✅ Performance tests meet SLA (< 5s page load)
- ✅ No data integrity issues
- ✅ All error handling tests pass

### **Coverage Goals**
- ✅ 100% of UAT scenarios covered
- ✅ All user roles tested
- ✅ All major workflows validated
- ✅ Cross-browser compatibility verified

---

## 🎯 Next Steps

### **After Running Tests**
1. **Review Reports:** Check HTML report for any failures
2. **Fix Issues:** Address any failing tests
3. **Update Tests:** Modify tests if UI changes
4. **Document Results:** Share results with stakeholders

### **Continuous Improvement**
- Add new test scenarios as features are added
- Optimize test execution time
- Enhance error reporting
- Integrate with monitoring tools

---

**🎉 This automated UAT test suite ensures comprehensive validation of the PNG Green Fees System before production deployment!**
