# GDPR Compliance Documentation

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Prepared For:** MetaPharm Connect Platform
**Compliance Standard:** GDPR (General Data Protection Regulation)

---

## Executive Summary

MetaPharm Connect processes personal data of EU and Swiss citizens. This document outlines our compliance with GDPR requirements and our commitment to data protection.

**Key Principles:**
- Lawfulness, fairness, and transparency
- Purpose limitation
- Data minimization
- Accuracy
- Storage limitation
- Integrity and confidentiality
- Accountability

---

## Legal Basis for Processing

### Article 6 - Lawfulness of Processing

**Consent (Art. 6(1)(a)):**
- Patient account creation
- Marketing communications
- Optional features (loyalty program)

**Contract (Art. 6(1)(b)):**
- Prescription processing
- Order fulfillment
- Payment processing

**Legal Obligation (Art. 6(1)(c)):**
- Controlled substance tracking
- Insurance reporting
- Tax compliance

**Vital Interests (Art. 6(1)(d)):**
- Emergency medical services
- Life-threatening situations

**Legitimate Interests (Art. 6(1)(f)):**
- Fraud prevention
- Security monitoring
- Analytics (anonymized)

---

## Data Subject Rights (Chapter III)

### 1. Right to Information (Art. 13-14)

**Transparency:**
- Privacy policy available at registration
- Clear purpose descriptions
- Contact information for data controller

### 2. Right of Access (Art. 15)

**Implementation:**
- User dashboard: View all personal data
- Data export feature (JSON format)
- Response time: 30 days
- Technical implementation: `backend/services/user-service/src/routes/data-export.ts`

### 3. Right to Rectification (Art. 16)

**Implementation:**
- Profile editing interface
- Data correction requests
- Verification process for sensitive data

### 4. Right to Erasure (Art. 17)

**Implementation:**
- Account deletion feature
- Data retention policies
- Anonymization of historical data
- Technical implementation: `backend/services/gdpr-service/src/services/deletion.ts`

**Exceptions:**
- Legal obligation (prescription records: 10 years)
- Medical records (10 years)
- Financial records (7 years)

### 5. Right to Restrict Processing (Art. 18)

**Implementation:**
- Account suspension option
- Processing restriction flags
- Notification to third parties

### 6. Right to Data Portability (Art. 20)

**Implementation:**
- Data export in machine-readable format (JSON)
- Direct transfer to another controller (API)
- Technical implementation: `backend/services/gdpr-service/src/routes/portability.ts`

### 7. Right to Object (Art. 21)

**Implementation:**
- Marketing opt-out
- Profiling opt-out
- Legitimate interest override

---

## Consent Management (Art. 7)

### Consent Requirements

**Valid Consent Must Be:**
- Freely given
- Specific
- Informed
- Unambiguous

**Implementation:**
- Granular consent options (marketing, analytics, etc.)
- Clear consent language
- Easy withdrawal mechanism
- Consent audit trail

**Technical Implementation:**
```typescript
// backend/services/user-service/src/models/Consent.ts
interface Consent {
  userId: string;
  purpose: 'marketing' | 'analytics' | 'profiling';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  method: 'explicit' | 'implicit';
}
```

---

## Data Protection by Design and Default (Art. 25)

### Security Measures

**Encryption:**
- AES-256-GCM at rest
- TLS 1.3 in transit
- End-to-end encryption for sensitive communications

**Access Controls:**
- Role-based access control (RBAC)
- Multi-factor authentication
- Session management

**Data Minimization:**
- Collect only necessary data
- Pseudonymization where possible
- Anonymization for analytics

---

## Data Processing Records (Art. 30)

### Processing Activities

| Activity | Legal Basis | Data Categories | Retention | Recipients |
|----------|-------------|-----------------|-----------|------------|
| User Registration | Contract | Name, email, phone | Account lifetime | Internal |
| Prescription Processing | Legal obligation | Health data, prescriptions | 10 years | Pharmacies, insurers |
| Payment Processing | Contract | Payment info | 7 years | Payment processors |
| Marketing | Consent | Email, preferences | Until withdrawal | Marketing tools |
| Analytics | Legitimate interest | Anonymized usage | 2 years | Internal |
| Teleconsultation | Consent + Contract | Video, health data | 10 years | Healthcare providers |

---

## Data Protection Impact Assessment (DPIA) (Art. 35)

### High-Risk Processing Activities

**1. Prescription Management**
- **Risk:** Sensitive health data exposure
- **Mitigation:** End-to-end encryption, access controls, audit logging

**2. Teleconsultation**
- **Risk:** Video/audio recording of medical consultations
- **Mitigation:** Encrypted storage, limited retention, explicit consent

**3. AI-Powered Recommendations**
- **Risk:** Automated decision-making affecting health
- **Mitigation:** Human oversight, explainable AI, opt-out option

### DPIA Template
Located at: `docs/compliance/DPIA_TEMPLATE.md`

---

## International Data Transfers (Chapter V)

### Data Transfer Mechanisms

**EU/Swiss Data Residency:**
- Primary data center: AWS eu-central-1 (Frankfurt)
- Backup data center: AWS eu-west-1 (Ireland)

**Standard Contractual Clauses (SCCs):**
- AWS (US company) - SCCs signed
- Twilio (US company) - SCCs signed
- SendGrid (US company) - SCCs signed

**Third-Country Transfers:**
- UK: Adequacy decision
- Switzerland: Adequacy decision
- USA: SCCs required

---

## Data Breach Notification (Art. 33-34)

### Breach Response Timeline

**72-Hour Rule (Art. 33):**
- Notification to supervisory authority within 72 hours
- Documentation of breach and response

**Individual Notification (Art. 34):**
- Required if high risk to rights and freedoms
- Direct notification without undue delay
- Clear and plain language

### Breach Documentation
- Nature of breach
- Categories and approximate number of data subjects
- Categories and approximate number of records
- Contact point for more information
- Likely consequences
- Measures taken or proposed

---

## Data Retention Policies

### Retention Periods

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| Prescription records | 10 years | Swiss pharmaceutical law |
| Medical records | 10 years | Medical documentation requirements |
| Financial records | 7 years | Tax law |
| Audit logs | 7 years | HIPAA compliance |
| Marketing data | Until consent withdrawn | Consent |
| Account data | Until account deletion | Contract |
| Anonymized analytics | 2 years | Legitimate interest |

### Deletion Procedures
- Automated deletion after retention period
- Secure deletion (overwriting)
- Certificate of destruction
- Audit trail of deletions

---

## Data Protection Officer (DPO)

**DPO Details:**
- Name: [Data Protection Officer]
- Email: dpo@metapharm-connect.ch
- Phone: [DPO Hotline]

**DPO Responsibilities:**
- Monitor GDPR compliance
- Advise on data protection obligations
- Cooperate with supervisory authority
- Act as contact point for data subjects

---

## Supervisory Authority

**Lead Supervisory Authority:**
- Swiss Federal Data Protection and Information Commissioner (FDPIC)
- Address: Feldeggweg 1, 3003 Bern, Switzerland
- Website: https://www.edoeb.admin.ch

---

## Privacy Policy

### Mandatory Information (Art. 13)

**Our Privacy Policy Includes:**
- Identity and contact details of controller
- Contact details of DPO
- Purposes and legal basis for processing
- Recipients of personal data
- International transfers
- Retention periods
- Data subject rights
- Right to withdraw consent
- Right to lodge a complaint
- Whether provision of data is statutory/contractual requirement

**Location:** https://metapharm-connect.ch/privacy-policy

---

## Technical Implementation References

### GDPR Service
- `backend/services/gdpr-service/` - GDPR compliance service
- Data export, deletion, portability features

### Consent Management
- `backend/services/user-service/src/models/Consent.ts` - Consent tracking
- `backend/services/user-service/src/routes/consent.ts` - Consent management API

### Data Subject Rights
- `backend/services/gdpr-service/src/services/data-export.ts` - Right of access
- `backend/services/gdpr-service/src/services/deletion.ts` - Right to erasure
- `backend/services/gdpr-service/src/services/portability.ts` - Data portability

### Security
- `backend/shared/middleware/securityHeaders.ts` - Security headers
- `backend/shared/config/security.ts` - Security configuration
- Encryption, access controls, audit logging

---

## Compliance Checklist

### Design Phase
- [x] DPIA completed for high-risk processing
- [x] Privacy by design principles applied
- [x] Data minimization implemented
- [x] Security measures defined

### Implementation Phase
- [x] Encryption at rest and in transit
- [x] Access controls implemented
- [x] Audit logging configured
- [x] Consent management system
- [x] Data subject rights features

### Operational Phase
- [ ] Privacy policy published
- [ ] Cookie consent banner (if applicable)
- [ ] DPO appointed
- [ ] Staff training completed
- [ ] Breach response plan tested

---

## Contact Information

**Data Controller:** MetaPharm Connect SA
**Address:** [Company Address], Switzerland
**Email:** privacy@metapharm-connect.ch

**Data Protection Officer:** dpo@metapharm-connect.ch

**Supervisory Authority Complaints:** FDPIC (https://www.edoeb.admin.ch)

---

*This document is confidential and proprietary to MetaPharm Connect.*
