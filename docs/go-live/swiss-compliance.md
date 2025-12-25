# Swiss Healthcare Regulatory Compliance

**MetaPharm Connect - Swiss Regulatory Verification**

---

## Overview

This document verifies compliance with Swiss healthcare regulations for the MetaPharm Connect platform. Switzerland has specific healthcare data protection requirements that supplement GDPR and HIPAA standards.

---

## Table of Contents

1. [Regulatory Framework](#regulatory-framework)
2. [Swiss Federal Data Protection](#swiss-data-protection)
3. [Healthcare-Specific Regulations](#healthcare-regulations)
4. [HIN e-ID Integration](#hin-integration)
5. [Cantonal Requirements](#cantonal-requirements)
6. [Compliance Checklist](#compliance-checklist)
7. [Audit Evidence](#audit-evidence)

---

## Regulatory Framework {#regulatory-framework}

### Applicable Regulations

| Regulation | Full Name | Applies To | Status |
|------------|-----------|------------|--------|
| nDSG (revFADP) | New Federal Act on Data Protection | All personal data processing | [ ] Compliant |
| DSV | Data Protection Ordinance | Implementation details | [ ] Compliant |
| HMG | Heilmittelgesetz (Therapeutic Products Act) | Pharmaceutical operations | [ ] Compliant |
| KVG | Krankenversicherungsgesetz (Health Insurance Act) | Insurance data exchange | [ ] Compliant |
| eHealth | E-Health Strategy Switzerland | Electronic health records | [ ] Compliant |
| VDSG | Ordinance on Data Protection Certification | Certification requirements | [ ] Compliant |

### Supervisory Authorities

| Authority | Jurisdiction | Contact |
|-----------|--------------|---------|
| FDPIC | Federal Data Protection and Information Commissioner | https://www.edoeb.admin.ch |
| Swissmedic | Therapeutic Products Regulation | https://www.swissmedic.ch |
| BAG | Federal Office of Public Health | https://www.bag.admin.ch |
| Cantonal Pharmacist Association | Pharmacy licensing | Varies by canton |

---

## Swiss Federal Data Protection {#swiss-data-protection}

### New Federal Data Protection Act (nDSG) - Effective Sept 1, 2023

#### Key Requirements

| Requirement | Article | MetaPharm Implementation | Status |
|-------------|---------|--------------------------|--------|
| Data Processing Principles | Art. 6 | Documented in privacy policy | [ ] |
| Data Security | Art. 8 | TLS 1.3, AES-256, access controls | [ ] |
| Privacy by Design | Art. 7 | Built into architecture | [ ] |
| Data Breach Notification | Art. 24 | 72-hour notification process | [ ] |
| Data Subject Rights | Art. 25-28 | Self-service portal | [ ] |
| Cross-Border Transfers | Art. 16-17 | EU data residency (Frankfurt) | [ ] |
| Data Protection Impact Assessment | Art. 22 | Completed for high-risk processing | [ ] |
| Record of Processing Activities | Art. 12 | Maintained in compliance docs | [ ] |

#### Sensitive Personal Data (Art. 5(c))

MetaPharm processes the following sensitive data requiring enhanced protection:

| Data Category | Protection Measures |
|---------------|---------------------|
| Health data | E2E encryption, audit logging, MFA |
| Biometric data (if any) | Not collected unless necessary |
| Genetic data | Not collected |
| Religious beliefs | Not collected |
| Political opinions | Not collected |

#### Data Controller Obligations

- [x] Privacy policy in German, French, Italian
- [x] Data processing register maintained
- [x] DPO appointed (Art. 10)
- [x] Technical and organizational measures documented
- [x] Processor agreements in place (Art. 9)

---

## Healthcare-Specific Regulations {#healthcare-regulations}

### Therapeutic Products Act (HMG)

#### Prescription Requirements

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Prescription validity period | Configurable per medication type | [ ] |
| Controlled substance tracking | Full audit trail with DEA-style logging | [ ] |
| Pharmacist verification | Mandatory before dispensing | [ ] |
| Prescription renewal limits | Enforced in system | [ ] |

#### Pharmaceutical Record Retention

| Record Type | Retention Period | Legal Basis | Status |
|-------------|------------------|-------------|--------|
| Prescriptions | 10 years | HMG Art. 26 | [ ] Configured |
| Dispensing records | 10 years | HMG Art. 26 | [ ] Configured |
| Controlled substances | 10 years | BetmG | [ ] Configured |
| Patient consultations | 10 years | Medical records law | [ ] Configured |
| Financial records | 7 years | Tax law | [ ] Configured |

#### Controlled Substances (Betaubungsmittelgesetz - BetmG)

| Requirement | MetaPharm Implementation |
|-------------|--------------------------|
| Special authorization tracking | Integrated with Swissmedic database |
| Quantity limits | Enforced at order level |
| Prescription duration limits | 30 days max, enforced |
| Double-verification | Pharmacist + system check |
| Audit trail | Immutable logging |

### Health Insurance Act (KVG)

#### Insurance Integration

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Coverage verification | Real-time API integration | [ ] |
| Third-party payment processing | Secure payment gateway | [ ] |
| Claims submission | HL7 FHIR compatible | [ ] |
| Patient cost-sharing calculation | Automated based on policy | [ ] |

---

## HIN e-ID Integration {#hin-integration}

### HIN (Health Info Net) Overview

HIN is Switzerland's trusted identity provider for healthcare professionals. Integration is **mandatory** for healthcare applications in Switzerland.

### Integration Requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| HIN Identity Provider configured | [ ] | Configuration file |
| SAML 2.0 / OAuth 2.0 integration | [ ] | Technical documentation |
| Healthcare professional verification | [ ] | Integration test results |
| Certificate-based authentication | [ ] | Certificate chain |
| HIN Mail integration (optional) | [ ] | N/A |

### HIN Authentication Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   User     │────▶│ MetaPharm  │────▶│    HIN     │
│ (Doctor/   │     │   Login    │     │  Identity  │
│ Pharmacist)│     │   Page     │     │  Provider  │
└────────────┘     └────────────┘     └────────────┘
                         │                   │
                         │◀──────────────────┘
                         │  SAML Assertion /
                         │  OAuth Token
                         ▼
                   ┌────────────┐
                   │ Verified   │
                   │ Healthcare │
                   │ Professional│
                   └────────────┘
```

### HIN Integration Verification

```bash
# Test HIN OAuth endpoint
curl -X POST https://auth.hin.ch/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=${AUTH_CODE}" \
  -d "client_id=${HIN_CLIENT_ID}" \
  -d "redirect_uri=${REDIRECT_URI}"

# Verify HIN user info
curl -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  https://auth.hin.ch/userinfo
```

### HIN Required Scopes

| Scope | Purpose | Required |
|-------|---------|----------|
| openid | Basic OpenID Connect | Yes |
| profile | User profile information | Yes |
| email | Email address | Yes |
| hin_professional | Healthcare professional status | Yes |
| hin_specialty | Medical specialty | Optional |

---

## Cantonal Requirements {#cantonal-requirements}

### Cantonal Health Records (e-Sante)

Switzerland is implementing a national electronic patient record (EPD) system with cantonal implementations.

#### EPD Integration Status

| Canton | EPD Platform | Integration Status | Notes |
|--------|--------------|-------------------|-------|
| Geneva (GE) | CARA | [ ] Planned | French-speaking |
| Vaud (VD) | CARA | [ ] Planned | French-speaking |
| Zurich (ZH) | XAD | [ ] Planned | German-speaking |
| Bern (BE) | Axsana | [ ] Planned | Bilingual |
| Basel (BS/BL) | i4mi | [ ] Planned | German-speaking |

#### EPD Technical Requirements

| Requirement | Standard | Status |
|-------------|----------|--------|
| IHE XDS.b | Document sharing | [ ] |
| IHE XUA | User authentication | [ ] |
| IHE XCPD | Patient discovery | [ ] |
| IHE PIX/PDQ | Patient ID management | [ ] |
| HL7 FHIR | Data exchange | [ ] Implemented |
| Swiss EPD metadata | Document metadata | [ ] |

### Cantonal Pharmacy Licensing

| Canton | Licensing Authority | Verification |
|--------|---------------------|--------------|
| All | Cantonal pharmacist associations | Pharmacy registration verification |

---

## Compliance Checklist {#compliance-checklist}

### Pre-Launch Swiss Compliance

#### Data Protection (nDSG)

- [ ] Privacy policy available in DE/FR/IT
- [ ] FDPIC notification completed (if required)
- [ ] DPO contact published on website
- [ ] Data processing register complete
- [ ] DPIA for health data processing
- [ ] Cross-border transfer safeguards (SCCs)

#### Healthcare Regulations

- [ ] HIN e-ID integration tested
- [ ] Swissmedic requirements reviewed
- [ ] Controlled substance handling verified
- [ ] Prescription validation rules implemented
- [ ] Record retention configured (10 years)
- [ ] Audit logging meets HMG requirements

#### Technical Security

- [ ] Swiss-based or EU data residency confirmed
- [ ] TLS 1.3 enforced
- [ ] AES-256 encryption at rest
- [ ] MFA for healthcare professionals
- [ ] Audit trail immutability verified
- [ ] Backup and DR in Swiss/EU region

#### Operational

- [ ] Swiss German/French/Italian support available
- [ ] Swiss phone number for support
- [ ] Local legal entity established
- [ ] Swiss banking for payments
- [ ] Insurance partner agreements

---

## Audit Evidence {#audit-evidence}

### Required Documentation

| Document | Location | Last Updated |
|----------|----------|--------------|
| Privacy Policy (DE) | `/legal/datenschutz.md` | [Date] |
| Privacy Policy (FR) | `/legal/confidentialite.md` | [Date] |
| Privacy Policy (IT) | `/legal/privacy.md` | [Date] |
| Data Processing Register | `docs/compliance/processing-register.xlsx` | [Date] |
| DPIA - Health Data | `docs/compliance/DPIA_health_data.pdf` | [Date] |
| DPIA - Teleconsultation | `docs/compliance/DPIA_teleconsult.pdf` | [Date] |
| HIN Integration Certificate | `certs/hin-integration.crt` | [Date] |
| FDPIC Registration | `docs/compliance/fdpic-registration.pdf` | [Date] |
| DPO Appointment | `docs/compliance/dpo-appointment.pdf` | [Date] |
| Security Assessment | `docs/security/assessment-report.pdf` | [Date] |

### Audit Trail Evidence

```sql
-- Query to verify audit log retention configuration
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
  (SELECT min(created_at) FROM audit_logs) as oldest_record,
  (SELECT max(created_at) FROM audit_logs) as newest_record
FROM information_schema.tables
WHERE table_name = 'audit_logs';

-- Verify 10-year retention
SELECT
  CASE
    WHEN (SELECT min(created_at) FROM audit_logs) > NOW() - INTERVAL '10 years'
    THEN 'Retention OK'
    ELSE 'Check Retention Policy'
  END as retention_status;
```

### Encryption Verification

```bash
# Verify TLS configuration
openssl s_client -connect api.metapharm-connect.ch:443 -tls1_3 2>/dev/null | \
  openssl x509 -noout -text | grep -A2 "Subject:"

# Verify database encryption
aws rds describe-db-instances \
  --db-instance-identifier metapharm-prod-db \
  --query 'DBInstances[0].StorageEncrypted'

# Verify S3 encryption
aws s3api get-bucket-encryption \
  --bucket metapharm-prod-documents
```

---

## Regulatory Contacts

### Swiss Authorities

| Authority | Contact | Purpose |
|-----------|---------|---------|
| FDPIC | info@edoeb.admin.ch | Data protection |
| Swissmedic | zentrale@swissmedic.ch | Pharmaceutical compliance |
| HIN | support@hin.ch | e-ID integration |
| BAG eHealth | ehealth@bag.admin.ch | EPD integration |

### MetaPharm Compliance Team

| Role | Contact | Responsibility |
|------|---------|----------------|
| DPO | dpo@metapharm-connect.ch | Data protection oversight |
| Compliance Officer | compliance@metapharm-connect.ch | Regulatory compliance |
| Security Officer | security@metapharm-connect.ch | Technical security |
| Legal Counsel | legal@metapharm-connect.ch | Legal matters |

---

## Certification Roadmap

### Current Certifications
- [ ] ISO 27001 (Information Security) - Planned Q2 2026
- [ ] ISO 27701 (Privacy) - Planned Q3 2026

### Swiss-Specific Certifications
- [ ] HIN Certified Application - In progress
- [ ] EPD Integration Certification - Planned 2026

---

## Annual Compliance Review

### Review Schedule

| Activity | Frequency | Next Due |
|----------|-----------|----------|
| DPIA Review | Annual | [Date + 1 year] |
| Security Assessment | Annual | [Date + 1 year] |
| Audit Log Review | Monthly | [Next month] |
| Policy Review | Annual | [Date + 1 year] |
| Staff Training | Annual | [Date + 1 year] |
| HIN Certificate Renewal | Annual | [HIN expiry date] |

---

*This document should be reviewed quarterly and after any regulatory changes.*

**Document prepared by:** MetaPharm Connect Compliance Team
**Reviewed by:** [DPO Name]
**Approved by:** [Legal Counsel Name]
**Date:** 2025-12-25
