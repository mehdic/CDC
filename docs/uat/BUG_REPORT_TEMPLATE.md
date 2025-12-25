# MetaPharm Connect - UAT Bug Report Template

**Version:** 1.0
**Last Updated:** 2025-12-25

---

## Bug Report Template

Use this template when reporting bugs discovered during UAT. For GitHub Issues, copy the content below.

---

## Bug Report

### Summary

**One-line description of the issue**

---

### Reporter Information

| Field | Value |
|-------|-------|
| Reporter Name | |
| Reporter Role | [ ] Pharmacist [ ] Doctor [ ] Nurse [ ] Delivery [ ] Patient |
| Date Reported | |
| Test Case ID | (if applicable) |
| UAT Session | |

---

### Environment

| Field | Value |
|-------|-------|
| Environment | [ ] Local UAT [ ] Cloud UAT [ ] Staging |
| Browser | (e.g., Chrome 120, Firefox 121, Safari 17) |
| Browser Version | |
| Operating System | (e.g., Windows 11, macOS Sonoma, iOS 17) |
| Device Type | [ ] Desktop [ ] Tablet [ ] Mobile |
| Screen Resolution | |
| Network | [ ] WiFi [ ] Ethernet [ ] Mobile Data |

---

### Bug Classification

#### Severity

- [ ] **Critical** - System crash, data loss, security vulnerability, blocks all testing
- [ ] **High** - Major feature broken, no workaround available
- [ ] **Medium** - Feature partially broken, workaround exists
- [ ] **Low** - Minor issue, cosmetic, doesn't affect functionality

#### Priority (for triage team)

- [ ] **P1** - Fix immediately (blocker)
- [ ] **P2** - Fix this sprint
- [ ] **P3** - Fix next sprint
- [ ] **P4** - Fix when possible

#### Type

- [ ] Functional - Feature doesn't work as expected
- [ ] UI/UX - Visual or usability issue
- [ ] Performance - Slow response, timeout, lag
- [ ] Security - Authentication, authorization, data exposure
- [ ] Data - Incorrect data, data loss, data corruption
- [ ] Integration - Third-party service failure
- [ ] Localization - Translation, formatting issues

#### Frequency

- [ ] Always reproducible (100%)
- [ ] Often reproducible (>50%)
- [ ] Sometimes reproducible (<50%)
- [ ] Rarely reproducible (happened once)

---

### Issue Details

#### Description

Provide a clear and detailed description of the bug:

```
[Describe what happened, what you observed]
```

#### Steps to Reproduce

1. Start from: [Page/URL/State]
2. Step 1: [Action]
3. Step 2: [Action]
4. Step 3: [Action]
5. Step N: [Final action that triggers the bug]

#### Expected Result

```
[What should have happened according to requirements]
```

#### Actual Result

```
[What actually happened - be specific]
```

#### Error Messages

```
[Copy any error messages, console errors, or API errors exactly as shown]
```

---

### Visual Evidence

#### Screenshot(s)

[Attach screenshots highlighting the issue. Use arrows/annotations if helpful]

#### Video Recording

[If applicable, attach a screen recording showing the issue]

#### Browser Console Logs

```javascript
// Copy any relevant console errors here
```

#### Network Requests (if applicable)

```
// Copy relevant API request/response data (remove sensitive information)
Request: POST /api/v1/prescriptions
Status: 500
Response: { "error": "Internal server error" }
```

---

### Additional Context

#### User Data Used

| Field | Value |
|-------|-------|
| Test Account | (email used) |
| Test Data IDs | (patient ID, prescription ID, etc.) |

#### Related Issues

- Related to: #[issue number]
- Duplicate of: #[issue number]
- Blocked by: #[issue number]

#### Workaround

```
[If a workaround exists, describe it here]
```

#### Notes

```
[Any additional context, observations, or hypotheses about the cause]
```

---

### Impact Assessment

#### Business Impact

- [ ] Prevents core business workflow
- [ ] Impacts user productivity
- [ ] Causes data quality issues
- [ ] Affects compliance/security
- [ ] Cosmetic only

#### User Groups Affected

- [ ] All users
- [ ] Pharmacists only
- [ ] Doctors only
- [ ] Nurses only
- [ ] Delivery personnel only
- [ ] Patients only
- [ ] VIP patients only
- [ ] Specific browser/device only

---

### Compliance Considerations

- [ ] Involves PHI/PII data
- [ ] Affects audit logging
- [ ] Impacts HIPAA compliance
- [ ] Impacts GDPR compliance
- [ ] Affects prescription handling
- [ ] Involves controlled substances

---

## For Development Team

### Technical Details (to be filled by developers)

#### Root Cause

```
[Analysis of what caused the bug]
```

#### Fix Description

```
[Description of the fix implemented]
```

#### Files Changed

- `path/to/file1.ts`
- `path/to/file2.ts`

#### PR Link

- Fix: #[PR number]

#### Regression Risk

- [ ] Low - Isolated fix
- [ ] Medium - Affects related features
- [ ] High - Core system changes

#### Testing Required

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual regression testing needed

---

### Verification

#### Verified By

| Field | Value |
|-------|-------|
| Tester | |
| Date Verified | |
| Environment | |
| Status | [ ] Fixed [ ] Not Fixed [ ] Partially Fixed |

#### Verification Notes

```
[Notes from verification testing]
```

---

## Quick Reference Labels

For GitHub Issues, use these labels:

| Label | Usage |
|-------|-------|
| `uat-defect` | All UAT bugs |
| `severity-critical` | Critical severity |
| `severity-high` | High severity |
| `severity-medium` | Medium severity |
| `severity-low` | Low severity |
| `needs-triage` | Awaiting triage |
| `in-progress` | Being worked on |
| `ready-for-test` | Fix ready for verification |
| `verified` | Fix verified |
| `wont-fix` | Decision not to fix |
| `duplicate` | Duplicate of another issue |
| `blocked` | Blocked by another issue |
| `role-pharmacist` | Affects pharmacist |
| `role-doctor` | Affects doctor |
| `role-nurse` | Affects nurse |
| `role-delivery` | Affects delivery |
| `role-patient` | Affects patient |
| `compliance` | Has compliance implications |

---

## Example Bug Report

### Summary

Login fails with "Invalid credentials" error when using correct MFA code

### Reporter Information

| Field | Value |
|-------|-------|
| Reporter Name | Jean Dupont |
| Reporter Role | [x] Pharmacist |
| Date Reported | 2025-12-25 |
| Test Case ID | PH-AUTH-002 |

### Environment

| Field | Value |
|-------|-------|
| Environment | [x] Cloud UAT |
| Browser | Chrome 120.0.6099.129 |
| Operating System | macOS Sonoma 14.2 |
| Device Type | [x] Desktop |
| Screen Resolution | 1920x1080 |

### Bug Classification

- [x] **High** - Major feature broken, no workaround available

### Steps to Reproduce

1. Navigate to https://uat.metapharm-connect.ch/login
2. Enter email: pharmacist@uat.metapharm.ch
3. Enter password: Uat2025!Pharm
4. Click "Login"
5. Enter MFA code: 123456 (from authenticator app)
6. Click "Verify"

### Expected Result

User should be logged in and redirected to dashboard

### Actual Result

Error message displayed: "Invalid credentials. Please try again."
User remains on login page.

### Error Messages

```
Console: POST /api/v1/auth/verify-mfa 401 Unauthorized
Network: {"error":"MFA_VERIFICATION_FAILED","message":"Invalid or expired MFA code"}
```

### Screenshot

[Screenshot showing error message on login page]

---

*Template Version 1.0 - MetaPharm Connect UAT*
