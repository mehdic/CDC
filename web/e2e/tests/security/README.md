# Security E2E Test Suite

Comprehensive security testing for MetaPharm Connect web application covering authentication, authorization, CSRF protection, and XSS prevention.

## Test Files

### 1. auth-flow.spec.ts (E2E-SEC-001)
Comprehensive authentication flow testing:
- Login success/failure scenarios
- Password reset flow
- Session timeout and token refresh
- Account lockout mechanisms
- Rate limiting
- "Remember Me" functionality
- Logout and session clearing
- Secure authentication headers

**Test Count:** 15+ tests

### 2. csrf-protection.spec.ts (E2E-SEC-002)
Cross-Site Request Forgery (CSRF) protection testing:
- CSRF token validation
- Same-origin policy enforcement
- SameSite cookie protection
- Double-submit cookie pattern
- Form token validation
- Idempotency and replay protection
- HTTPS and secure transport

**Test Count:** 12+ tests

### 3. xss-prevention.spec.ts (E2E-SEC-003)
Cross-Site Scripting (XSS) prevention testing:
- Input sanitization (script tags, event handlers)
- Output encoding (HTML, JavaScript, URL, CSS contexts)
- DOM-based XSS prevention
- Content Security Policy (CSP)
- Attribute-based XSS prevention
- File upload XSS prevention
- React-specific XSS prevention
- JSON response XSS prevention

**Test Count:** 18+ tests

### 4. security-comprehensive.spec.ts (E2E-SEC-004)
End-to-end security integration tests:
- Full authentication and authorization flow
- Multi-layered security (Auth + RBAC + CSRF + XSS)
- Concurrent session management
- Session fixation prevention
- Horizontal and vertical privilege escalation prevention
- Security headers validation
- Input validation and sanitization
- Audit logging and security monitoring

**Test Count:** 14+ tests

## Running the Tests

### Run all security tests
```bash
npm run test:e2e:security
```

### Run specific test file
```bash
npx playwright test web/e2e/tests/security/auth-flow.spec.ts
npx playwright test web/e2e/tests/security/csrf-protection.spec.ts
npx playwright test web/e2e/tests/security/xss-prevention.spec.ts
npx playwright test web/e2e/tests/security/security-comprehensive.spec.ts
```

### Run with UI mode
```bash
npx playwright test web/e2e/tests/security/ --ui
```

### Run in headed mode (see browser)
```bash
npx playwright test web/e2e/tests/security/ --headed
```

### Run specific browser
```bash
npx playwright test web/e2e/tests/security/ --project=chromium
npx playwright test web/e2e/tests/security/ --project=firefox
npx playwright test web/e2e/tests/security/ --project=webkit
```

## Test Coverage

### Authentication Flow
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Email format validation
- ✅ Account lockout after failed attempts
- ✅ Rate limiting
- ✅ MFA enrollment and verification
- ✅ Password reset flow
- ✅ Session persistence
- ✅ Token refresh
- ✅ Logout and session clearing

### Authorization (RBAC)
- ✅ Role-based page access control
- ✅ API-level authorization
- ✅ Multi-tenant data isolation
- ✅ Horizontal privilege escalation prevention
- ✅ Vertical privilege escalation prevention
- ✅ Resource-level permissions

### Session Management
- ✅ Session timeout
- ✅ Token refresh mechanism
- ✅ Concurrent session detection
- ✅ Session fixation prevention
- ✅ Session revocation on password change
- ✅ Active session management

### CSRF Protection
- ✅ CSRF token validation
- ✅ Same-origin policy
- ✅ SameSite cookie protection
- ✅ Double-submit cookie pattern
- ✅ Form token validation
- ✅ Replay attack prevention

### XSS Prevention
- ✅ Input sanitization
- ✅ Output encoding (HTML, JS, URL, CSS)
- ✅ DOM-based XSS prevention
- ✅ Content Security Policy
- ✅ React escape mechanisms
- ✅ File upload sanitization
- ✅ JSON response handling

### Security Headers
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options
- ✅ Content-Security-Policy
- ✅ Strict-Transport-Security (HSTS)
- ✅ Referrer-Policy

## Security Features Tested

### Authentication
- Multi-factor authentication (MFA)
- Password strength requirements
- Account lockout policies
- Rate limiting
- Session management
- Token-based authentication (JWT)

### Authorization
- Role-Based Access Control (RBAC)
- Resource-level permissions
- Multi-tenant isolation
- Privilege escalation prevention

### Data Protection
- CSRF protection
- XSS prevention
- SQL injection prevention
- Input validation and sanitization
- Output encoding

### Transport Security
- HTTPS enforcement
- Secure cookies (httpOnly, Secure, SameSite)
- Security headers

## Best Practices

### Test Structure
- Use Page Object Model for maintainability
- Use `data-testid` selectors for stability
- Mock API responses for isolation
- Use auth helpers for common operations

### Test Data
- Use separate test users for each role
- Don't hardcode sensitive data
- Use realistic but safe test payloads

### Assertions
- Verify both positive and negative cases
- Check for security indicators (tokens, headers)
- Validate error messages
- Ensure proper redirects

## Related Tests

These security tests complement:
- `security-mfa.spec.ts` - MFA-specific tests
- `security-rbac.spec.ts` - RBAC-specific tests
- `security-session-management.spec.ts` - Session-specific tests
- `security-audit-logging.spec.ts` - Audit trail tests
- `security-encryption.spec.ts` - Data encryption tests

## Continuous Integration

Security tests run automatically on:
- Every pull request
- Every commit to main branch
- Nightly security scans

See `.github/workflows/security-tests.yml` for CI configuration.

## Security Testing Guidelines

### When Adding New Features
1. Add authentication tests for new login methods
2. Add authorization tests for new roles/permissions
3. Add input validation tests for new forms
4. Add XSS prevention tests for user-generated content

### When Fixing Security Issues
1. Add regression test to prevent recurrence
2. Verify fix across all browsers
3. Update security documentation
4. Run full security test suite

### Regular Security Audits
- Run full test suite weekly
- Review failed tests immediately
- Update tests as security standards evolve
- Document security findings

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Playwright Security Testing](https://playwright.dev/docs/test-assertions)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
