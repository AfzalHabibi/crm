# 🛡️ CRM Security Demo Scripts

This directory contains comprehensive security testing and demonstration scripts for client presentations.

## 📁 Files Overview

### Core Testing Scripts
- `security-test-suite.js` - **Main orchestrator** that runs all security tests
- `rate-limit-demo.js` - Tests rate limiting and brute force protection
- `validation-demo.js` - Tests input validation and sanitization
- `headers-demo.js` - Tests security headers and CORS configuration

### Configuration
- `package.json` - Dependencies and scripts for the demo suite
- `README.md` - This documentation file

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts/security-demo
npm install
```

### 2. Start Your CRM Server
```bash
# From the main CRM directory
npm run dev
```

### 3. Run Complete Security Demo
```bash
# Run all tests with client-ready presentation
npm run demo
```

### 4. Run Individual Tests
```bash
# Test rate limiting only
npm run rate-limit

# Test input validation only
npm run validation

# Test security headers only
npm run headers
```

## 🎯 For Client Presentations

### Complete Demo (Recommended)
```bash
npm run demo
```
This runs all security tests and generates a comprehensive report suitable for client presentations.

### Key Features Demonstrated:
- ✅ **Rate Limiting Protection** - Prevents brute force attacks
- ✅ **Input Validation** - Blocks SQL injection and XSS attacks
- ✅ **Security Headers** - Enforces browser-level security
- ✅ **Data Sanitization** - Ensures data integrity
- ✅ **Progressive Penalties** - Advanced threat mitigation
- ✅ **Audit Logging** - Complete security event tracking

## 📊 Demo Output Features

### Visual Indicators
- 🟢 **Green** - Excellent security (90%+ score)
- 🟡 **Yellow** - Good security (70-89% score)
- 🔴 **Red** - Needs improvement (<70% score)

### Report Generation
- JSON reports with detailed metrics
- Executive summary for client presentations
- Compliance status indicators
- Specific recommendations

### Real-time Testing
- Live attack simulations
- Rate limit boundary testing
- Malicious input detection
- Security header validation

## 🎪 Demo Script Usage Examples

### For Technical Audiences
```bash
# Detailed technical output
node security-test-suite.js
```

### For Executive Presentations
The scripts automatically generate executive summaries highlighting:
- Overall security score
- Compliance with industry standards
- Business benefits and risk mitigation
- Future-proof security architecture

## 📋 Test Coverage

### Rate Limiting Tests
- API endpoint protection
- Login attempt limiting
- Progressive penalty system
- Attack pattern detection

### Input Validation Tests
- SQL injection prevention
- XSS attack blocking
- Data type validation
- Malicious pattern detection

### Security Headers Tests
- Content security policies
- XSS protection headers
- Clickjacking prevention
- CORS configuration

## 🔧 Customization

### Modify Test Parameters
Edit the configuration objects in each script:

```javascript
// Example: Adjust rate limits in rate-limit-demo.js
const RATE_LIMITS = {
  login: { max: 5, window: 60000 },
  api: { max: 100, window: 60000 }
};
```

### Add New Tests
1. Create new test file following the pattern
2. Import in `security-test-suite.js`
3. Add to the test execution pipeline

### Client-Specific Branding
Modify the console output messages and report headers to match client presentation needs.

## 📈 Success Metrics

### Security Scores
- **90-100%**: Enterprise-grade security
- **80-89%**: Strong security implementation
- **70-79%**: Adequate security with improvements needed
- **<70%**: Significant security gaps requiring attention

### Compliance Indicators
- OWASP Top 10 compliance
- GDPR data protection readiness
- Enterprise security standards
- Industry best practices adherence

## 🎁 Client Benefits Highlighted

### Technical Benefits
- Multi-layer security implementation
- Real-time threat protection
- Automated security monitoring
- Comprehensive audit trails

### Business Benefits
- Reduced security breach risk
- Regulatory compliance readiness
- Customer trust enhancement
- Competitive security advantage

## 📞 Support

For technical questions about the security implementation or demo scripts:

1. Review the main security documentation files
2. Check the comprehensive testing guide
3. Examine the actual security middleware implementations

## 🔄 Maintenance

### Regular Updates
- Test scripts against latest security standards
- Update attack patterns and test cases
- Refresh compliance requirements
- Enhance client presentation features

### Version Control
All demo scripts are version controlled and maintained alongside the main CRM codebase.

---

**Ready to demonstrate enterprise-grade security to your clients!** 🛡️✨