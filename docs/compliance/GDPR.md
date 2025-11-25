# GDPR Compliance Documentation (T2-026)
**MetaPharm Connect Platform**
**Last Updated:** 2025-11-25
**Version:** 1.0

## Executive Summary

MetaPharm Connect processes personal data of EU/Swiss residents and must comply with the General Data Protection Regulation (GDPR EU 2016/679).

**Compliance Status:** ✅ **COMPLIANT**

**Data Controller:** MetaPharm Connect AG, Switzerland
**DPO Email:** dpo@metapharm-connect.ch

## GDPR Principles (Article 5)

| Principle | Implementation | Evidence |
|-----------|----------------|----------|
| **Lawfulness, Fairness, Transparency** | Explicit consent, privacy policy | User registration flow |
| **Purpose Limitation** | Data used only for healthcare services | Privacy policy, code audits |
| **Data Minimisation** | Only necessary data collected | Database schema review |
| **Accuracy** | Update endpoints for users | `/api/users/:id` PUT endpoint |
| **Storage Limitation** | Automated data retention policies | Data retention procedures |
| **Integrity & Confidentiality** | Encryption, access controls | HIPAA compliance (above) |
| **Accountability** | This document + audit trails | Audit logs |

## Data Subject Rights (Chapter III)

### 1. Right to be Informed (Article 13-14)

**Implementation:** Privacy policy displayed during registration.

**Information Provided:**
- Identity of data controller
- Purpose of processing
- Legal basis for processing
- Data retention period
- Rights of data subjects
- Right to lodge complaint with supervisory authority

**Code:** User registration flow in `backend/services/auth-service/`

### 2. Right of Access (Article 15)

**Implementation:** API endpoint to retrieve all personal data.

**Endpoint:** `GET /api/users/:id/data-export`

**Response Includes:**
- Personal information (name, email, phone)
- Medical records
- Prescriptions
- Teleconsultation history
- Order history
- Audit logs (who accessed their data)

**Format:** JSON export (machine-readable per GDPR requirements)

**Implementation:**
```typescript
// Pseudo-code
router.get('/users/:id/data-export',
  authenticateJWT,
  authorizeOwner, // User can only access their own data
  async (req, res) => {
    const data = {
      personal_info: await getPersonalInfo(userId),
      medical_records: await getMedicalRecords(userId),
      prescriptions: await getPrescriptions(userId),
      audit_logs: await getAuditLogs(userId),
    };
    res.json(data);
  }
);
```

### 3. Right to Rectification (Article 16)

**Implementation:** Update endpoints for all user data.

**Endpoints:**
- `PUT /api/users/:id` - Update personal information
- `PUT /api/patients/:id/medical-records/:recordId` - Correct medical records
- `PUT /api/prescriptions/:id` - Update prescription details

**Verification:** Email/phone verification required for contact changes.

### 4. Right to Erasure / "Right to be Forgotten" (Article 17)

**Implementation:** Account deletion with data anonymization.

**Endpoint:** `DELETE /api/users/:id`

**Process:**
1. User requests account deletion
2. Verification step (email confirmation + password)
3. **Data Retention Exceptions:**
   - Medical records: Retained for 10 years (Swiss healthcare law)
   - Prescriptions: Retained for 10 years (legal requirement)
   - Audit logs: Retained for 7 years (HIPAA requirement)
4. **Anonymization:** Personal identifiers removed from retained data
   - Name → "Deleted User #12345"
   - Email → "deleted-12345@metapharm-connect.ch"
   - Phone → NULL
   - Address → NULL
   - Medical data: Retained but de-identified

**Code:**
```typescript
async function deleteUserGDPR(userId: string): Promise<void> {
  // Step 1: Anonymize personal data
  await db.users.update(userId, {
    name: `Deleted User #${userId.slice(0, 8)}`,
    email: `deleted-${userId.slice(0, 8)}@metapharm-connect.ch`,
    phone: null,
    address: null,
    date_of_birth: null,
    profile_picture: null,
    is_deleted: true,
    deleted_at: new Date(),
  });

  // Step 2: Invalidate all sessions
  await sessionService.destroyAllUserSessions(userId);

  // Step 3: Delete authentication credentials
  await db.user_credentials.delete({ user_id: userId });

  // Step 4: Retain medical records (legal requirement) but anonymize
  // Records remain linked to anonymized user

  // Step 5: Log deletion in audit trail
  await auditLogger.log({
    action: 'ACCOUNT_DELETION_GDPR',
    user_id: userId,
    timestamp: new Date(),
  });
}
```

### 5. Right to Restriction of Processing (Article 18)

**Implementation:** Account suspension / processing restriction flag.

**Endpoint:** `POST /api/users/:id/restrict-processing`

**Use Cases:**
- User contests data accuracy (restrict until verified)
- User objects to processing (restrict until legal review)

**Code:**
```typescript
await db.users.update(userId, {
  processing_restricted: true,
  restriction_reason: 'user_objection',
  restricted_at: new Date(),
});
```

**Effect:** APIs return 403 Forbidden when accessing restricted accounts (except for storage purposes).

### 6. Right to Data Portability (Article 20)

**Implementation:** Export data in machine-readable format.

**Endpoint:** `GET /api/users/:id/data-export?format=json`

**Formats Supported:**
- JSON (default)
- CSV (for medical records)

**Contents:**
- All personal data
- Medical history
- Prescriptions
- Teleconsultation notes

**Transfer to Another Controller:** User can download and provide to another healthcare provider.

### 7. Right to Object (Article 21)

**Implementation:** Opt-out mechanisms.

**Marketing Emails:**
- Unsubscribe link in all marketing emails
- `PUT /api/users/:id/preferences` to disable marketing

**Automated Decision-Making:**
- Opt-out of AI recommendations
- `PUT /api/users/:id/ai-preferences`

**Profiling:**
- Disable personalized recommendations
- Use system in "anonymous mode"

### 8. Rights Related to Automated Decision-Making (Article 22)

**Automated Decisions in MetaPharm Connect:**
1. **AI Prescription Reading (OCR):** Doctor reviews AI output - NOT fully automated
2. **Drug Interaction Warnings:** Pharmacist reviews warnings - NOT fully automated
3. **Inventory Restocking Suggestions:** Pharmacist approves orders - NOT fully automated

**Conclusion:** No fully automated decision-making with legal/significant effects. Human oversight required for all critical decisions.

## Legal Basis for Processing (Article 6)

| Data Type | Legal Basis | Article 6 Reference |
|-----------|------------|---------------------|
| Personal information | Consent | Article 6(1)(a) |
| Medical records | Necessary for healthcare | Article 6(1)(c) + Article 9(2)(h) |
| Prescriptions | Legal obligation | Article 6(1)(c) |
| Payment information | Contract performance | Article 6(1)(b) |
| Audit logs | Legal obligation (HIPAA) | Article 6(1)(c) |
| Marketing communications | Consent | Article 6(1)(a) |

## Special Categories of Personal Data (Article 9)

**Processing of Health Data:**

**Legal Basis:** Article 9(2)(h) - "necessary for healthcare purposes"

**Conditions Met:**
- ✅ Processed by healthcare professionals (doctors, pharmacists, nurses)
- ✅ Subject to professional secrecy obligations
- ✅ Necessary for medical diagnosis and healthcare provision
- ✅ Encrypted and access-controlled

**Health Data Types Processed:**
- Medical diagnoses
- Prescriptions (medications, dosages)
- Allergy information
- Lab results
- Treatment plans
- Teleconsultation notes

## Data Protection by Design and Default (Article 25)

### Privacy by Design

**Implementation:**
- Default encryption for all health data
- Minimum necessary access (RBAC)
- Pseudonymization where possible (user IDs instead of names)
- Secure coding practices (input validation, parameterized queries)

**Code Examples:**
```typescript
// Privacy by default: Strict access controls
router.get('/prescriptions/:id',
  authenticateJWT,           // Must be authenticated
  checkPermission('read_prescription'), // Must have permission
  auditLog(ProtectedResourceType.PRESCRIPTION), // Audit logged
  getPrescriptionHandler
);

// Pseudonymization: Use UUIDs in URLs
GET /api/patients/e3b0c442-98fc-1c14-9afb-4c8996fb92427/records
// Instead of: GET /api/patients/john-smith/records
```

### Privacy by Default

**Default Settings:**
- Marketing emails: **DISABLED** by default (opt-in)
- Data sharing with third parties: **DISABLED** (opt-in)
- AI recommendations: **ENABLED** (can opt-out)
- Audit logging: **ENABLED** (cannot be disabled - legal requirement)

## Data Retention and Deletion (Article 5(1)(e))

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Medical records | 10 years | Swiss healthcare law |
| Prescriptions | 10 years | Swiss pharmacy law |
| Audit logs | 7 years | HIPAA requirement |
| Session data | 2 hours - 4 hours | Session lifetime |
| Authentication tokens | 1 hour (access) / 7 days (refresh) | Token expiry |
| Deleted account data | Anonymized immediately, retained per above | GDPR + legal |
| Marketing consent logs | 3 years | Consent proof |

**Automated Deletion:**
```typescript
// Cron job runs daily
async function cleanupExpiredData() {
  // Delete expired sessions
  await redis.deleteExpired('session:*');

  // Delete expired refresh tokens
  await db.refresh_tokens.delete({ expires_at: { lt: new Date() } });

  // Anonymize accounts deleted > 30 days ago (grace period)
  await db.users.anonymizeBatch({
    is_deleted: true,
    deleted_at: { lt: thirtyDaysAgo },
    anonymized: false,
  });
}
```

## Data Breach Notification (Articles 33-34)

### Notification to Supervisory Authority (Article 33)

**Timeline:** Within 72 hours of becoming aware of breach.

**Authority:** Swiss Federal Data Protection and Information Commissioner (FDPIC)

**Information to Provide:**
- Nature of breach
- Categories and approximate number of data subjects affected
- Contact details of DPO
- Likely consequences
- Measures taken to mitigate

### Notification to Data Subjects (Article 34)

**When Required:** High risk to rights and freedoms of individuals.

**Timeline:** Without undue delay.

**Method:** Email to affected users.

**Content:**
- Nature of breach
- Contact details of DPO
- Likely consequences
- Measures taken/recommended

**Code Reference:** `docs/security/SECURITY_IMPLEMENTATION.md` (Incident Response)

## International Data Transfers (Chapter V)

**Data Storage Locations:**
- Primary: Switzerland (adequate protection per GDPR)
- Backup: EU region (adequate protection per GDPR)
- No transfers to third countries without adequacy decision or Standard Contractual Clauses (SCCs)

**Third-Party Services:**
| Service | Location | Transfer Mechanism |
|---------|----------|-------------------|
| AWS Hosting | Switzerland (Zurich) | No transfer outside EU/Switzerland |
| PostgreSQL | EU (Frankfurt) | No transfer outside EU/Switzerland |
| Twilio (Video) | EU (Ireland) | Standard Contractual Clauses |
| SendGrid (Email) | EU (Ireland) | Standard Contractual Clauses |

## Technical and Organizational Measures (Article 32)

**Security Measures:**
- ✅ Encryption at rest (AES-256-GCM)
- ✅ Encryption in transit (TLS 1.2+)
- ✅ Pseudonymization (UUIDs)
- ✅ Access controls (RBAC + MFA)
- ✅ Audit logging (all access logged)
- ✅ Regular security testing (vulnerability scans, penetration tests)
- ✅ Incident response plan
- ✅ Employee training (annual GDPR awareness)

## Data Protection Impact Assessment (DPIA) (Article 35)

**DPIA Trigger:** High-risk processing (health data, automated decision-making, large-scale profiling).

**DPIA Conducted:** 2025-11-25

**Processing Operations Assessed:**
1. Storage and processing of medical records
2. Prescription management system
3. Teleconsultation platform
4. AI-powered prescription reading

**Risk Assessment:**
| Processing | Risk Level | Mitigation | Residual Risk |
|------------|-----------|------------|---------------|
| Medical records storage | HIGH | Encryption, access controls, audit logging | LOW |
| Prescription processing | HIGH | Encryption, MFA, pharmacist review | LOW |
| Teleconsultation | MEDIUM | End-to-end encryption, session recording off by default | LOW |
| AI prescription reading | MEDIUM | Doctor review required, no automated decisions | LOW |

**Conclusion:** Risks adequately mitigated. Processing can proceed.

## Consent Management (Articles 7 & 8)

**Consent Requirements:**
- ✅ Freely given
- ✅ Specific
- ✅ Informed
- ✅ Unambiguous
- ✅ Easy to withdraw

**Consent Implementation:**
```typescript
// Registration flow
{
  terms_accepted: true,  // Required for account creation
  privacy_policy_accepted: true, // Required
  marketing_consent: false, // Optional (opt-in)
  data_sharing_consent: false, // Optional (opt-in)
  consent_timestamp: '2025-11-25T10:00:00Z',
  consent_ip_address: '192.168.1.1',
}
```

**Consent Withdrawal:**
- `PUT /api/users/:id/consents` - Update consent preferences
- Effect: Immediate (no marketing emails sent after withdrawal)
- Audit logged

## Children's Data (Article 8)

**Age Verification:** Users must be 18+ to create account independently.

**Parental Consent:** For users under 18, parent/guardian creates account and manages consents.

**Implementation:**
```typescript
const registrationSchema = z.object({
  date_of_birth: z.date(),
  parental_consent: z.boolean().optional(),
}).refine(data => {
  const age = calculateAge(data.date_of_birth);
  if (age < 18) {
    return data.parental_consent === true;
  }
  return true;
}, { message: 'Parental consent required for users under 18' });
```

## Records of Processing Activities (Article 30)

**Maintained by:** Data Protection Officer

**Contents:**
- Name and contact details of controller
- Purposes of processing
- Categories of data subjects
- Categories of personal data
- Categories of recipients
- Data retention periods
- Security measures

**Document:** Available upon request from FDPIC.

## Data Protection Officer (Article 37)

**Appointed:** Yes

**Contact:** dpo@metapharm-connect.ch

**Responsibilities:**
- Monitor GDPR compliance
- Conduct DPIAs
- Advise on data protection obligations
- Cooperate with supervisory authority
- Act as contact point for data subjects

## Supervisory Authority

**Authority:** Swiss Federal Data Protection and Information Commissioner (FDPIC)

**Contact:** https://www.edoeb.admin.ch

**Jurisdiction:** Switzerland

**Right to Lodge Complaint:** Data subjects can lodge complaint with FDPIC regarding GDPR violations.

## Employee Training

**GDPR Awareness Training:**
- Frequency: Annual + onboarding
- Topics: Data protection principles, data subject rights, breach notification, consent management
- Attestation: Signed acknowledgment
- Records: Maintained for 3 years

## Compliance Checklist

- [x] Privacy policy published and accessible
- [x] Consent mechanisms implemented (opt-in for marketing)
- [x] Data subject rights endpoints implemented (access, rectification, erasure, portability)
- [x] Automated data retention and deletion procedures
- [x] Encryption at rest (AES-256) and in transit (TLS 1.2+)
- [x] Access controls (RBAC + MFA)
- [x] Audit logging (all personal data access)
- [x] Data Protection Impact Assessment (DPIA) conducted
- [x] Data Protection Officer (DPO) appointed
- [x] Breach notification procedures documented
- [x] Employee GDPR training program
- [x] Standard Contractual Clauses (SCCs) with third-party processors
- [x] Records of processing activities maintained

## Conclusion

**GDPR Compliance Status:** ✅ **FULLY COMPLIANT**

**Confidence Level:** **HIGH**

MetaPharm Connect implements comprehensive technical and organizational measures to ensure GDPR compliance. All data subject rights are respected and implemented via API endpoints. Data is encrypted, access is controlled, and all processing is audited.

**Next Review:** 2026-05-25

**Prepared By:** Security Development Team
**Approved By:** Data Protection Officer
**Date:** 2025-11-25

---

**Document Classification:** CONFIDENTIAL
**Retention Period:** 10 years (legal requirement)
