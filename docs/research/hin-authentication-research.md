# HIN OAuth2/SAML Authentication Research & Setup
## Swiss Healthcare Professional Authentication for MetaPharm Connect

**Task ID:** T5-001
**Date:** December 2, 2025
**Status:** Research Complete
**Version:** 1.0

---

## 1. Overview of HIN (Health Info Net)

### What is HIN?

**Health Info Net AG (HIN)** is the established standard for secure digital communication and data handling in Swiss healthcare. Established in 1996 by the Swiss Medical Association (FMH) and the Physicians' Cooperative Society, HIN operates as the primary identity provider and secure communication platform for healthcare professionals in Switzerland.

**Key Facts:**
- **Market penetration:** Over 90% of relevant healthcare stakeholders in Switzerland use HIN services
- **Role:** Acts as an electronic identity (eID) provider for healthcare professionals, institutions, hospitals, and pharmacies
- **Primary use:** Secure communication, prescription management, patient record access, and digital signing
- **Trust model:** Operates a "virtual trust space" called HIN Vertrauensraum (HVR) where all members are uniquely identified and verified

### HIN's Role in Swiss Healthcare

HIN serves as the digital backbone for Swiss healthcare authentication and secure communication:

1. **Electronic Identity Provider:** Issues and manages certified electronic identities (HIN eID) for healthcare professionals
2. **Secure Communication Platform:** Provides encrypted email (HIN Mail) and digital signing services (HIN Sign) for healthcare professionals
3. **Authentication Authority:** Verifies professional credentials (medical registration, pharmacy licenses, nursing credentials)
4. **Trusted Network Infrastructure:** Operates the HIN Trust Circle with enhanced security using SCION network technology (in partnership with Anapaya)

### HIN's Identity Verification Process

HIN performs rigorous identity verification for all members:

- **Document verification:** Identity documents are verified via scanned documents or video calls
- **Professional credential validation:** For doctors, HIN verifies registration in the official medical register; for pharmacists and nurses, professional licensing is validated
- **Legal compliance:** All verification processes comply with Swiss data protection regulations and healthcare requirements

---

## 2. Authentication Options: OAuth2 vs SAML

### SAML Overview

**SAML (Security Assertion Markup Language)** is an XML-based standard for single sign-on (SSO) and authorization, particularly suited for enterprise environments.

**SAML Characteristics:**
- **Use case:** Enterprise SSO, large-scale user management
- **Message format:** XML assertions
- **Ideal for:** Organizations needing fine-grained access control, healthcare systems managing employee access to multiple applications
- **Industry adoption:** Standard in regulated industries (finance, government, healthcare, education)
- **Complexity:** Higher complexity, requires more infrastructure

**SAML in Healthcare:**
SAML is heavily used in healthcare for:
- Healthcare provider identity federation
- Patient access to medical records through single sign-on
- Hospital and clinic staff access to multiple systems (EHR, lab systems, pharmacy systems)
- Fine-grained authorization policies

### OAuth2 Overview

**OAuth2** is an authorization framework (not a pure authentication protocol) designed for delegated authorization and API access.

**OAuth2 Characteristics:**
- **Use case:** API authorization, third-party application access, mobile applications
- **Message format:** JSON, lighter weight than SAML
- **Ideal for:** Securing API access, machine-to-machine communication, mobile apps
- **Complexity:** Simpler implementation, stateless
- **Flexibility:** More flexible for different use cases (web, mobile, desktop)

### HIN's Implementation: OAuth2

**HIN recommends OAuth2** for third-party applications and modern healthcare platforms, though the organization has historically strong SAML integration.

**Why HIN Chose OAuth2 for New Integrations:**
1. **Lightweight:** Reduces server load and response time
2. **Mobile-friendly:** OAuth2 is the standard for mobile app integrations
3. **Flexible:** Supports multiple authentication flows for different use cases
4. **API-first:** Better suited for modern healthcare microservices architectures
5. **Stateless:** Easier to scale and distribute

---

## 3. OAuth2 Flow for Healthcare Professionals

### Overview

HIN implements OAuth2 with two primary flows optimized for different healthcare use cases:

1. **Authorization Code Grant Flow (User-Initiated):** Used when a healthcare professional (pharmacist, doctor, nurse) logs into an application and grants permission to access their data
2. **Client Credentials Grant Flow (Machine-to-Machine):** Used for backend services that need to access healthcare data without direct user involvement

### Flow 1: Authorization Code Grant (User-Initiated)

**Use Case:** A pharmacist logs into MetaPharm Connect using their HIN eID credentials, authorizing the app to access their pharmacy data, patient records, and send prescriptions to patients.

**Steps:**

1. **User Initiates Login**
   - Pharmacist clicks "Login with HIN" in MetaPharm Connect
   - Application redirects to HIN's authorization server

2. **Authorization Server Redirects**
   ```
   GET https://oauth2.hin.ch/REST/v1/OAuth/Authorize
   ```
   **Parameters:**
   - `client_id`: MetaPharm's registered application ID
   - `redirect_uri`: Callback URL (e.g., `https://metapharm.ch/auth/callback`)
   - `response_type`: `code`
   - `scope`: Requested permissions (e.g., `pharmacy_data`, `patient_records`, `prescription_write`)
   - `state`: Security token to prevent CSRF attacks

3. **User Authenticates with HIN**
   - HIN displays login page to pharmacist
   - Pharmacist enters HIN username and password
   - Second factor authentication:
     - SMS OTP (One-Time Password)
     - HIN Authenticator App
     - Hardware token (optional for high-security scenarios)

4. **User Grants Consent**
   - HIN displays consent screen showing what permissions MetaPharm is requesting
   - Pharmacist reviews and approves

5. **Authorization Code Generated**
   - HIN redirects back to MetaPharm with authorization code
   ```
   https://metapharm.ch/auth/callback?code=AUTH_CODE&state=STATE
   ```

6. **Backend Exchange Auth Code for Access Token**
   ```
   POST https://oauth2.hin.ch/REST/v1/OAuth/GetAccessToken
   ```
   **Parameters (form-encoded or JSON):**
   - `grant_type`: `authorization_code`
   - `code`: Authorization code from step 5
   - `client_id`: MetaPharm application ID
   - `client_secret`: MetaPharm's secret key (never transmitted to frontend)
   - `redirect_uri`: Must match the initial request

7. **Access Token Response**
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "refresh_token": "REFRESH_TOKEN_VALUE"
   }
   ```

8. **Access Protected Resources**
   ```
   GET https://oauth2.hin.ch/api/v1/pharmacy/data
   Authorization: Bearer <ACCESS_TOKEN>
   ```

9. **Token Refresh**
   - When access token expires, use refresh token to get a new one
   ```
   POST https://oauth2.hin.ch/REST/v1/OAuth/GetAccessToken
   ```
   **Parameters:**
   - `grant_type`: `refresh_token`
   - `refresh_token`: Refresh token from initial response
   - `client_id`: Application ID
   - `client_secret`: Application secret

### Flow 2: Client Credentials Grant (Machine-to-Machine)

**Use Case:** MetaPharm's backend service needs to automatically sync inventory data from HIN's pharmacy registry or validate prescriptions without user intervention.

**Steps:**

1. **Service Requests Access Token**
   ```
   POST https://oauth2.hin.ch/REST/v1/OAuth/GetAccessToken
   ```
   **Parameters:**
   - `grant_type`: `client_credentials`
   - `client_id`: Service application ID
   - `client_secret`: Service secret (or certificate-based auth)

2. **HIN Issues Access Token**
   ```json
   {
     "access_token": "SERVICE_ACCESS_TOKEN",
     "token_type": "Bearer",
     "expires_in": 3600
   }
   ```

3. **Service Uses Token to Access Resources**
   ```
   GET https://oauth2.hin.ch/api/v1/pharmacy-registry/validate
   Authorization: Bearer <SERVICE_ACCESS_TOKEN>
   ```

**Important Note:** In client credentials flow, the issued access token is valid ONLY for a specific pre-configured user or service account, not for arbitrary user access.

---

## 4. Certificate Requirements

### Digital Certificates for HIN Authentication

HIN uses X.509 digital certificates for several purposes in healthcare authentication:

#### 4.1 Client Certificates (mTLS)

**Purpose:** Authenticate the client application to HIN servers (mutual TLS)

**Requirements:**
- **Certificate type:** X.509 v3
- **Key algorithm:** RSA 2048-bit (minimum), RSA 4096-bit recommended for high-security scenarios
- **Signature algorithm:** SHA-256 or higher
- **Validity period:** Typically 1-3 years (HIN may specify requirement)
- **Subject CN:** Must match application identifier or domain
- **Extended Key Usage:** Client Authentication (TLS Web Client Authentication)

**Renewal Process:**
- Request new certificate before expiration
- HIN support provides certificate issuance guidelines
- Plan 30-day buffer before expiration to allow for issuance delays

#### 4.2 HIN eID Certificates (Professional Identity)

**Purpose:** Digital identity for healthcare professionals (pharmacists, doctors, nurses)

**Characteristics:**
- Issued by HIN to verified healthcare professionals
- Contains professional credentials (license number, medical register ID)
- Used for signing prescriptions and official communications
- Automatically verified in HIN trust space
- NOT required in OAuth2 flow (OAuth2 handles authentication separately)

**Important:** HIN eID certificates are different from application client certificates. Healthcare professionals don't manage these; HIN issues and maintains them.

#### 4.3 Server Certificates (TLS/SSL)

**Purpose:** Secure communication with HIN API endpoints

**Requirements:**
- **Standard TLS/SSL certificate** for `oauth2.hin.ch` domain
- Issued by recognized Certificate Authority
- Must be valid and non-revoked
- Auto-renewed by HIN (handled server-side)

**Client Responsibility:** Applications must validate HIN's server certificate (standard TLS validation)

#### 4.4 JWT Signing Certificates (Optional)

**Purpose:** Sign JWT assertions for certificate-based client authentication (alternative to client_secret)

**When used:** For highest security scenarios, applications can authenticate using signed JWT instead of shared secret

**Requirements:**
- Private RSA key (2048-bit minimum)
- Public certificate for HIN to validate JWT signatures
- Key must be securely stored (environment variables, key management system)

**JWT Assertion Flow:**
```
1. Application creates JWT assertion:
   {
     "iss": "client_id",
     "sub": "client_id",
     "aud": "https://oauth2.hin.ch/REST/v1/OAuth/GetAccessToken",
     "iat": 1625162400,
     "exp": 1625166000
   }

2. Application signs JWT with private key (RS256)

3. Application sends to HIN:
   POST https://oauth2.hin.ch/REST/v1/OAuth/GetAccessToken
   client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
   client_assertion=<signed_jwt>
```

---

## 5. Integration Approach (Recommended: OAuth2)

### Recommendation Rationale

**OAuth2 is the recommended approach for MetaPharm Connect** for the following reasons:

1. **Modern Architecture:** OAuth2 aligns with modern microservices, mobile-first architecture
2. **HIN Endorsement:** HIN actively promotes OAuth2 for new third-party integrations
3. **Mobile Support:** Better suited for iOS and Android apps (required for MetaPharm's delivery personnel and patient apps)
4. **Stateless:** Easier to scale horizontally across multiple servers
5. **Flexibility:** Supports both user-initiated (Authorization Code) and machine-to-machine flows
6. **Industry Standard:** De facto standard for API authorization in healthcare integrations
7. **Simpler Implementation:** Less XML processing, lighter tokens (JWT format)

### SAML as Alternative

**SAML could be considered IF:**
- Integration requires deep enterprise SSO features
- Healthcare institution already has SAML infrastructure
- Fine-grained SAML assertions are needed
- Legacy system integration is necessary

**However:** SAML adds complexity and is not HIN's primary recommendation for new applications.

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MetaPharm Connect                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  Web App       │  │ Mobile App     │  │ Delivery App   │ │
│  │  (Pharmacists) │  │ (Patients)     │  │ (GPS Tracking) │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
│           │                   │                   │          │
│           │        OAuth2 Requests                │          │
│           └───────────────────┼───────────────────┘          │
│                               │                              │
└───────────────────────────────┼──────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  HIN OAuth2 Server      │
                    │ oauth2.hin.ch           │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌─────────────────┐  ┌──────────────────┐
            │ HIN Identity    │  │ HIN Data APIs    │
            │ Verification    │  │ (Pharmacy data,  │
            │                 │  │  Patient records)│
            └─────────────────┘  └──────────────────┘
```

### Implementation Steps

1. **Register Application with HIN**
   - Contact HIN support or register via apps.hin.ch
   - Receive `client_id` and `client_secret`
   - Specify redirect URIs for callback

2. **Frontend Implementation**
   - Add "Login with HIN" button
   - Implement OAuth2 redirect to HIN authorization server
   - Handle callback and exchange authorization code

3. **Backend Implementation**
   - Implement token exchange endpoint (auth code → access token)
   - Store tokens securely (encrypted database or secure storage)
   - Implement token refresh logic
   - Validate JWT tokens and extract user identity

4. **API Integration**
   - Call HIN APIs with Bearer token
   - Handle 401 responses (expired token) and refresh
   - Implement proper error handling

5. **Security Hardening**
   - Implement CSRF protection (state parameter)
   - Use HTTPS exclusively
   - Implement rate limiting on token endpoints
   - Monitor token usage for anomalies

---

## 6. Sandbox Setup & Developer Credentials

### HIN Developer Portal

**Official URL:** https://apps.hin.ch

**Access Method:**
1. Visit https://apps.hin.ch
2. Register as developer (HIN professional account required)
3. Create application entry
4. Receive `client_id` and `client_secret`
5. Configure allowed redirect URIs
6. Request sandbox/test environment access

### Registration Requirements

To obtain HIN developer credentials, you need:

1. **Professional Identity**
   - Verified HIN professional account (pharmacy, doctor, nurse, etc.)
   - Or company/organization account registered with HIN
   - Valid business license or professional credential

2. **Application Details**
   - Application name (MetaPharm Connect)
   - Application description
   - Primary use case (healthcare communication, prescription management)
   - Requested scopes (data access permissions)

3. **Security Information**
   - Registered redirect URIs (must be HTTPS)
   - Client type (confidential client for backend, public for frontend)
   - Certificate information (if using certificate-based auth)

### Sandbox Environment

**Sandbox URL:** https://oauth2-sandbox.hin.ch/ (or equivalent test environment)

**Characteristics:**
- Fully functional OAuth2 implementation
- Test user accounts provided by HIN
- No real healthcare data
- Same API structure as production
- Useful for development and testing

**Access:**
- Request sandbox environment access when registering
- HIN support provides test credentials
- Separate `client_id` and `client_secret` for sandbox

### Test Accounts

HIN provides test accounts with different professional roles:
- Test pharmacist account
- Test doctor account
- Test nurse account
- Test patient account

These accounts can be used to test authentication flows without affecting production systems.

### Documentation Access

**Available Resources:**
1. **OAuth2 Documentation:** https://support.hin.ch/de/thema/oauth2.cfm
2. **PDF Documentation:** Technical specification document (German) from HIN support
3. **API Endpoints:** Provided in registration confirmation
4. **Integration Guide:** Available from HIN support team

**Contact HIN Support:**
- Email: support@hin.ch (general inquiries)
- Web form: Available at hin.ch
- Response time: 2-5 business days for registration requests

---

## 7. Security Considerations

### Authentication Security

1. **Multi-Factor Authentication (MFA)**
   - HIN enforces MFA for all healthcare professional accounts
   - Supported methods:
     - SMS OTP (SMS one-time password)
     - HIN Authenticator App (recommended)
     - Hardware tokens (for high-security scenarios)
   - Transparent to MetaPharm (handled by HIN)

2. **Token Security**
   - Access tokens are JWT format
   - Tokens contain embedded expiration (typically 1 hour)
   - Tokens should be stored securely on client (local storage with caution, secure HTTP-only cookies preferred)
   - Never transmit tokens in URL parameters
   - Always use HTTPS for token transmission

3. **Refresh Token Security**
   - Refresh tokens have longer validity (typically 7-30 days)
   - Must be stored securely on backend
   - Should be revoked when user logs out
   - Should rotate periodically for long-lived sessions

### Transport Security

1. **TLS/SSL Requirements**
   - All communication with HIN must use TLS 1.2 or higher
   - Valid HTTPS certificates required
   - Certificate pinning recommended for mobile apps

2. **Mutual TLS (mTLS)**
   - Application client certificates recommended for service-to-service communication
   - Provides additional authentication layer beyond OAuth2 tokens

### Data Protection

1. **Healthcare Data Protection**
   - All healthcare data transmitted to/from HIN must be encrypted
   - GDPR/Swiss DPA compliance required
   - Patient data must be treated as strictly confidential

2. **Authorization Scopes**
   - Request minimum necessary scopes
   - Implement principle of least privilege
   - Regularly audit scope usage

3. **Logging & Monitoring**
   - Log all authentication events (successful logins, failed attempts, token refreshes)
   - Monitor for anomalous token usage
   - Implement alerting for suspicious activities

### Compliance Requirements

1. **Swiss Healthcare Regulations**
   - Comply with Swiss healthcare data protection law (HPA)
   - Comply with cantonal regulations (vary by region)
   - Document data processing activities (DPA article 30)

2. **GDPR Compliance** (if handling EU data)
   - Right to access, rectification, erasure
   - Data processing agreements with HIN
   - Privacy impact assessment for new features

3. **Security Audit Trail**
   - Maintain audit logs of all data access
   - Logs must be tamper-proof
   - Retention period: minimum 5 years for healthcare data

---

## 8. Next Steps for Implementation (T5-002+)

### Phase 1: Setup (Week 1-2)

- [ ] **Register Application with HIN**
  - Create account on apps.hin.ch
  - Register MetaPharm Connect application
  - Receive client_id and client_secret
  - Configure redirect URIs

- [ ] **Obtain Documentation**
  - Request full OAuth2 technical specification from HIN
  - Request API endpoint documentation
  - Obtain test account credentials

- [ ] **Set Up Sandbox Environment**
  - Request sandbox environment access
  - Test basic OAuth2 flow with sandbox credentials
  - Document sandbox endpoints and test credentials

### Phase 2: Development (Week 2-4)

- [ ] **Implement Authorization Code Flow**
  - Frontend: Add "Login with HIN" button
  - Frontend: Implement OAuth2 redirect and callback handling
  - Backend: Implement token exchange endpoint
  - Backend: Implement token storage and refresh logic

- [ ] **Implement Client Credentials Flow**
  - Backend service authentication
  - Service-to-service API access
  - Token caching and refresh

- [ ] **JWT Token Validation**
  - Decode and validate JWT tokens
  - Extract user identity and professional information
  - Implement token expiration handling

### Phase 3: Integration (Week 4-6)

- [ ] **API Integration**
  - Integrate with HIN pharmacy data APIs (if available)
  - Integrate with patient record APIs
  - Implement prescription validation with HIN services

- [ ] **User Management**
  - Create/update user records based on HIN identity
  - Map HIN professional credentials to MetaPharm roles
  - Implement role-based access control

- [ ] **Session Management**
  - Implement secure session handling
  - Implement logout (token revocation)
  - Implement "remember me" functionality securely

### Phase 4: Security & Testing (Week 6-8)

- [ ] **Security Hardening**
  - Implement CSRF protection
  - Implement rate limiting on auth endpoints
  - Implement anomaly detection for token usage

- [ ] **Comprehensive Testing**
  - Unit tests for token handling
  - Integration tests with sandbox environment
  - Security testing (OWASP top 10)
  - Load testing on authentication endpoints

- [ ] **Production Deployment**
  - Request production credentials from HIN
  - Configure production environment
  - Implement monitoring and alerting
  - Perform load testing

---

## 9. Risks & Mitigation Strategies

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Token leakage/theft | HIGH | Store tokens securely (HTTP-only cookies), use HTTPS only, implement token rotation |
| Expired token not refreshed | MEDIUM | Implement automatic token refresh 5 minutes before expiration |
| CSRF attack on OAuth flow | MEDIUM | Implement state parameter validation, use SameSite cookies |
| Certificate expiration | MEDIUM | Implement certificate monitoring, alert 30 days before expiration |
| Scope creep (requesting too much access) | LOW | Regularly audit requested scopes, implement least privilege |
| Sandbox credentials leaked | HIGH | Use separate credentials for sandbox, never use in production |
| Slow HIN authentication servers | LOW | Implement timeout handling, provide user feedback during auth |

---

## 10. Additional Resources & References

### Official HIN Resources

1. **HIN Official Website:** https://www.hin.ch
2. **HIN Support Portal:** https://support.hin.ch
3. **OAuth2 Documentation:** https://support.hin.ch/de/thema/oauth2.cfm
4. **Developer Registration:** https://apps.hin.ch

### Authentication Protocol References

1. **OAuth 2.0 RFC 6749:** https://tools.ietf.org/html/rfc6749
2. **JWT RFC 7519:** https://tools.ietf.org/html/rfc7519
3. **OAuth 2.0 Client Credentials Flow:** https://www.oauth.com/oauth2-servers/access-tokens/client-credentials/

### Swiss Healthcare Compliance

1. **Swiss Healthcare Data Protection:** https://www.edoeb.admin.ch
2. **Cantonal Health Authorities:** Regional regulations vary by canton
3. **GDPR Compliance:** https://ec.europa.eu/info/law/law-topic/data-protection_en

### Security Best Practices

1. **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
2. **OAuth 2.0 Security Best Practices:** https://tools.ietf.org/html/draft-ietf-oauth-security-topics
3. **Secure Token Storage:** https://cheatsheetseries.owasp.org/cheatsheets/Storing_Secrets_Cheat_Sheet.html

---

## 11. Research Conclusion

### Key Findings

1. **HIN is the authoritative identity provider** for Swiss healthcare professionals and institutions
2. **OAuth2 is the recommended authentication method** for modern healthcare applications
3. **HIN provides comprehensive OAuth2 services** with both user-initiated and machine-to-machine flows
4. **Registration process is straightforward** but requires HIN professional account
5. **Sandbox environment is available** for testing before production deployment
6. **Security requirements are significant** but standard for healthcare applications

### Recommendation Summary

**MetaPharm Connect should implement HIN OAuth2 authentication** for the following user roles:

- **Pharmacists:** Authorization Code Flow (user login)
- **Doctors:** Authorization Code Flow (user login, read-only prescription access)
- **Nurses:** Authorization Code Flow (user login, limited access)
- **Delivery Personnel:** OAuth2 with enhanced MFA (location-based access)
- **Patients:** OAuth2 with optional second-factor authentication

### Success Criteria

Authentication implementation will be considered complete when:

- [ ] All five user roles can authenticate with HIN eID
- [ ] User roles receive appropriate authorization scopes
- [ ] Tokens are securely stored and refreshed automatically
- [ ] Session management prevents token leakage
- [ ] Comprehensive audit logs track all authentication events
- [ ] Security testing passes OWASP standards
- [ ] Sandbox testing achieves 100% success rate
- [ ] Production deployment maintains <1% authentication failure rate

---

**Document Status:** Ready for Development Phase (T5-002: HIN OAuth2 Implementation)

**Prepared by:** P1-HIN-RESEARCH Developer Group
**Date:** December 2, 2025
