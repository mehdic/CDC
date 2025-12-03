# Security Testing Infrastructure

## Overview

This directory contains comprehensive security testing infrastructure for the MetaPharm Connect backend, covering OWASP Top 10 (2021) vulnerabilities and healthcare-specific security requirements (HIPAA, GDPR).

## Testing Framework

- **Test Framework**: Jest
- **HTTP Testing**: Supertest
- **Coverage**: OWASP Top 10 + Healthcare Compliance
- **Test Files**: TypeScript (.test.ts)

## Test Files

### 1. **access-control.test.ts** - A01:2021 Broken Access Control
Tests for unauthorized access, privilege escalation, and resource ownership validation.

**Test Categories**:
- Missing Authentication (5 tests)
- Horizontal Privilege Escalation (4 tests)
- Vertical Privilege Escalation (5 tests)
- Resource Ownership Validation (3 tests)
- Function-Level Access Control (4 tests)
- Insecure Direct Object References (IDOR) Prevention (3 tests)
- Access Control in Data Modification (3 tests)
- Metadata and Parameter Tampering Prevention (3 tests)
- API-Level Access Control (2 tests)

**Total**: 32 tests

### 2. **injection.test.ts** - A03:2021 Injection
Tests for SQL injection, NoSQL injection, command injection, XSS, and other injection vulnerabilities.

**Test Categories**:
- SQL Injection Prevention (12+ tests)
- NoSQL Injection Prevention (6+ tests)
- Cross-Site Scripting (XSS) Prevention (10+ tests)
- Command Injection Prevention (10+ tests)
- LDAP Injection Prevention (6+ tests)
- Expression Language (EL) Injection Prevention (5+ tests)
- Path Traversal Prevention (6+ tests)
- XML External Entity (XXE) Injection Prevention (3+ tests)
- HTTP Header Injection Prevention (4+ tests)
- Input Validation for Common Patterns (6+ tests)

**Total**: 68+ tests

### 3. **auth-security.test.ts** - A07:2021 Authentication Failures
Tests for password policies, brute force protection, session management, and MFA.

**Test Categories**:
- Password Requirements and Policies (4+ tests)
- Brute Force Attack Protection (6+ tests)
- Session Management and Fixation (6+ tests)
- Token Security (JWT) (7+ tests)
- Multi-Factor Authentication (MFA) (5+ tests)
- Password Reset and Recovery (6+ tests)
- Credential Stuffing Prevention (3+ tests)
- Authentication Error Handling (3+ tests)
- Alternative Authentication Methods (2+ tests)
- Account Enumeration Prevention (2+ tests)

**Total**: 44+ tests

### 4. **crypto.test.ts** - A02:2021 Cryptographic Failures
Tests for encryption, key management, and data protection.

**Test Categories**:
- HTTPS/TLS Security (5+ tests)
- Encryption at Rest (7+ tests)
- Data in Transit Encryption (5+ tests)
- Password Hashing and Storage (5+ tests)
- Cryptographic Randomness (3+ tests)
- Encryption Key Management (6+ tests)
- Secure Hash Functions (3+ tests)
- Encryption Algorithm Strength (4+ tests)
- Secure Data Deletion (3+ tests)
- Cryptographic Libraries (3+ tests)
- HIPAA Encryption Compliance (4+ tests)
- GDPR Encryption Compliance (3+ tests)

**Total**: 51+ tests

### 5. **headers.test.ts** - Security Headers and Configuration
Tests for HTTP security headers, CORS, and response configuration.

**Test Categories**:
- Content Security Policy (CSP) (8+ tests)
- HTTP Strict Transport Security (HSTS) (4+ tests)
- X-Frame-Options (Clickjacking Prevention) (2+ tests)
- X-Content-Type-Options (MIME Sniffing Prevention) (3+ tests)
- Referrer-Policy (2+ tests)
- Permissions-Policy (4+ tests)
- Cross-Origin Resource Sharing (CORS) (5+ tests)
- Additional Security Headers (7+ tests)
- HTTP Status Code Configuration (3+ tests)
- Response Validation (3+ tests)

**Total**: 41+ tests

### 6. **owasp-top10.test.ts** - Comprehensive OWASP Coverage
High-level security tests covering all OWASP Top 10 categories.

### 7. **security-report.test.ts** - Security Validation Report
Generates comprehensive security and compliance reports.

## Running the Tests

### Run All Security Tests
```bash
npm run test -- tests/security/
```

### Run Specific Test File
```bash
npm run test -- tests/security/access-control.test.ts
```

### Run with Coverage
```bash
npm run test -- tests/security/ --coverage
```

### Run in Watch Mode
```bash
npm run test:watch -- tests/security/
```

### Run Only Tests Matching Pattern
```bash
npm run test -- tests/security/ -t "Broken Access Control"
```

## Test Coverage by OWASP Top 10

### A01:2021 - Broken Access Control
- **File**: `access-control.test.ts`
- **Tests**: 32
- **Scope**: Authentication, authorization, privilege escalation, IDOR

### A02:2021 - Cryptographic Failures
- **File**: `crypto.test.ts`
- **Tests**: 51+
- **Scope**: Encryption, key management, data protection, HIPAA/GDPR compliance

### A03:2021 - Injection
- **File**: `injection.test.ts`
- **Tests**: 68+
- **Scope**: SQL, NoSQL, XSS, command, LDAP, path traversal, XXE injection

### A04:2021 - Insecure Design
- **File**: `owasp-top10.test.ts`
- **Tests**: Included in comprehensive suite
- **Scope**: Rate limiting, business logic validation

### A05:2021 - Security Misconfiguration
- **File**: `headers.test.ts`
- **Tests**: 41+
- **Scope**: Security headers, CORS, configuration

### A06:2021 - Vulnerable and Outdated Components
- **Scope**: npm audit (external scanning)
- **Commands**:
  ```bash
  npm audit
  npm audit fix
  ```

### A07:2021 - Identification and Authentication Failures
- **File**: `auth-security.test.ts`
- **Tests**: 44+
- **Scope**: Password policies, brute force, session management, MFA, JWT

### A08:2021 - Software and Data Integrity Failures
- **File**: `owasp-top10.test.ts`
- **Tests**: Included
- **Scope**: Data validation, JSON integrity

### A09:2021 - Security Logging and Monitoring Failures
- **File**: `security-report.test.ts`
- **Tests**: Included
- **Scope**: Audit logging, monitoring

### A10:2021 - Server-Side Request Forgery (SSRF)
- **File**: `owasp-top10.test.ts`
- **Tests**: Included
- **Scope**: URL validation, SSRF prevention

## Healthcare Compliance Testing

### HIPAA Compliance (US Healthcare)
Tests covering Health Insurance Portability and Accountability Act requirements:

- **Encryption**: All ePHI (electronic Protected Health Information) encrypted at rest and in transit
- **Audit Logging**: Complete audit trail of PHI access
- **Access Controls**: Role-based access control (RBAC) for healthcare roles
- **Data Integrity**: Integrity verification for medical records
- **Backup & Recovery**: Encrypted backups and disaster recovery procedures

**Test Locations**:
- Encryption at Rest: `crypto.test.ts` - HIPAA Encryption Compliance section
- Access Control: `access-control.test.ts` - Function-level controls for healthcare roles
- Authentication: `auth-security.test.ts` - MFA for healthcare professionals

### GDPR Compliance (EU Data Protection)
Tests covering General Data Protection Regulation requirements:

- **Data Protection**: Encryption of personal data
- **Right to Deletion**: Secure deletion of personal data
- **Data Subject Access**: Users can access their encrypted data
- **Data Processing**: Documented data processing activities
- **Incident Response**: Security incident response procedures

**Test Locations**:
- Data Protection: `crypto.test.ts` - GDPR Encryption Compliance section
- Access Control: `access-control.test.ts` - Resource ownership validation

### Swiss Healthcare Regulations
- **e-ID Authentication**: Support for Swiss e-ID (HIN provider)
- **Data Sovereignty**: Data stored in Switzerland or EU
- **Cantonal Health Records**: Integration with e-santé API
- **Insurance Integration**: Swiss insurance payment systems

## Test Execution in CI/CD

### GitHub Actions Example
```yaml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test -- tests/security/ --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Security Testing Best Practices

### 1. Test Isolation
- Each test should be independent
- Use unique test data to avoid conflicts
- Clean up resources after tests (teardown)

### 2. Mock External Services
- Mock authentication providers
- Mock payment systems
- Mock external APIs (e-santé, insurance systems)

### 3. Avoid Real Credentials
- Use mock tokens and test users
- Never commit real API keys or secrets
- Use environment variables for sensitive data

### 4. Regular Execution
- Run security tests before every commit (pre-commit hook)
- Run full suite in CI/CD pipeline
- Run nightly security scans for comprehensive coverage

### 5. Monitoring and Alerts
- Track security test results over time
- Alert on security test failures
- Monitor for new vulnerabilities in dependencies

## Integration with Development Workflow

### Pre-Commit Hook
```bash
#!/bin/sh
npm run test -- tests/security/ --maxWorkers=1 --bail
```

### Pre-Push Validation
```bash
#!/bin/sh
npm run test -- tests/security/ --coverage
npm run lint -- tests/security/
```

## Limitations and Notes

### Current Test Scope
- Unit tests for security logic
- API endpoint testing via HTTP
- Configuration and header validation
- Does NOT include:
  - Browser-based testing (requires Selenium/Playwright)
  - Load/stress testing for DDoS resilience
  - Physical security testing
  - Social engineering tests
  - Penetration testing (beyond API testing)

### Mock vs Real Testing
- Tests use mock tokens and simulated data
- Real integration testing should be in separate test suite
- Production environment should not run these tests directly

### Environment Considerations
- Tests adapted for development environment
- Production-specific checks marked with `if (process.env.NODE_ENV === 'production')`
- HTTPS checks skipped in non-production environments

## Continuous Improvement

### Adding New Security Tests
1. Create new test file: `new-feature.test.ts`
2. Follow existing test structure and naming conventions
3. Document test categories in README.md
4. Update OWASP checklist with new test coverage
5. Add to CI/CD pipeline

### Updating for OWASP Changes
- Review OWASP Top 10 annually
- Update tests for new vulnerabilities
- Deprecate tests for resolved issues
- Document changes in changelog

## References

### OWASP Resources
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

### Healthcare Compliance
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Official Text](https://gdpr-info.eu/)
- [Swiss Health Data Protection](https://www.edoeb.admin.ch/)

### Security Standards
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001:2022](https://www.iso.org/standard/27001)

### Testing Frameworks
- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Support and Contribution

For questions about security tests:
1. Check existing test documentation
2. Review OWASP guidelines
3. Consult security team
4. Create issue with detailed description

When contributing new tests:
1. Follow existing code style
2. Include comprehensive comments
3. Document test purpose and coverage
4. Add to this README.md
5. Update OWASP checklist

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintained By**: MetaPharm Security Team
