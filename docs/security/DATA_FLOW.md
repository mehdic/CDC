# Data Flow Diagrams - MetaPharm Connect

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Purpose:** Security and compliance documentation

---

## Overview

This document describes data flows within MetaPharm Connect platform, identifying:
- Data sources and destinations
- Encryption points
- Access controls
- Audit logging points
- Compliance requirements

---

## 1. User Authentication Flow

```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │ 1. POST /auth/login (HTTPS/TLS 1.3)
       │    {email, password}
       ▼
┌─────────────────────┐
│   API Gateway       │
│ - Rate Limiting     │ ← 5 req/15min per IP
│ - Input Sanitization│ ← XSS protection
│ - Security Headers  │ ← Helmet.js, CSP
└──────┬──────────────┘
       │ 2. Forward to Auth Service
       ▼
┌─────────────────────┐
│   Auth Service      │
│ - Password verify   │ ← bcrypt (cost: 12)
│ - MFA validation    │ ← TOTP
│ - Generate JWT      │ ← HS256, 1h expiry
└──────┬──────────────┘
       │ 3. Query user
       ▼
┌─────────────────────┐
│   PostgreSQL        │
│ - Encrypted at rest │ ← AES-256-GCM
│ - Audit logging ON  │
└──────┬──────────────┘
       │ 4. User record
       ▼
┌─────────────────────┐
│   Auth Service      │
│ - Log successful    │
│   authentication    │ ← Audit trail
└──────┬──────────────┘
       │ 5. Return JWT + refresh token
       ▼
┌─────────────┐
│   Client    │
│ Stores JWT  │ ← Secure storage
│ in memory   │
└─────────────┘
```

**Security Controls:**
- Transport: TLS 1.3 end-to-end
- Rate limiting: 5 failed attempts per 15 minutes
- Password: bcrypt hashed, never logged
- JWT: Short-lived (1h), signed with HS256
- Audit: All authentication attempts logged

---

## 2. Prescription Processing Flow

```
┌─────────────┐
│   Doctor    │
│   Client    │
└──────┬──────┘
       │ 1. POST /prescriptions (HTTPS)
       │    JWT in Authorization header
       ▼
┌─────────────────────┐
│   API Gateway       │
│ - JWT validation    │ ← Verify signature & expiry
│ - RBAC check        │ ← Must have DOCTOR role
│ - Input sanitization│ ← Remove XSS payloads
└──────┬──────────────┘
       │ 2. Authenticated request
       ▼
┌─────────────────────────┐
│ Prescription Service    │
│ - Validate prescription │ ← Drug interaction check
│ - AI analysis           │ ← OCR if image provided
│ - Digital signature     │ ← Sign with doctor's key
└──────┬────────────────┬─┘
       │ 3. Store       │ 4. Notify
       ▼                ▼
┌─────────────┐   ┌──────────────────┐
│ PostgreSQL  │   │ Notification Svc │
│ Encrypted   │   │ - SMS/Email      │
│ + Audit log │   │ - Push notif     │
└─────────────┘   └──────────────────┘
       │ 5. Prescription ID
       ▼
┌─────────────────────┐
│ Doctor Client       │
│ Confirmation        │
└─────────────────────┘
```

**Security Controls:**
- Transport: TLS 1.3
- Authentication: JWT required
- Authorization: RBAC (DOCTOR role only)
- Data: Encrypted at rest (AES-256-GCM)
- Audit: All prescription creation logged (7-year retention)
- Integrity: Digital signature on prescription

**HIPAA Compliance:**
- §164.308(a)(4) - Access authorization (RBAC)
- §164.312(a)(1) - Unique user identification (JWT)
- §164.312(e)(1) - Transmission security (TLS 1.3)

---

## 3. PHI Access Flow

```
┌─────────────┐
│   Nurse     │
│   Client    │
└──────┬──────┘
       │ 1. GET /patients/{id}/records
       │    JWT in Authorization header
       ▼
┌─────────────────────┐
│   API Gateway       │
│ - JWT validation    │
│ - Rate limiting     │ ← 100 req/15min
└──────┬──────────────┘
       │ 2. Authenticated request
       ▼
┌─────────────────────────┐
│ Medical Records Service │
│ - RBAC check            │ ← Nurse can access assigned patients only
│ - Data minimization     │ ← Return only necessary fields
└──────┬──────────────────┘
       │ 3. Query PHI
       ▼
┌─────────────────────┐
│   PostgreSQL        │
│ - Encrypted at rest │
│ - Column-level enc  │ ← SSN, credit cards doubly encrypted
└──────┬──────────────┘
       │ 4. Encrypted PHI
       ▼
┌─────────────────────────┐
│ Medical Records Service │
│ - Decrypt PHI           │ ← AWS KMS key
│ - Log access            │ ← Audit trail (HIPAA §164.312(b))
│ - Redact sensitive      │ ← Based on role
└──────┬──────────────────┘
       │ 5. PHI response (filtered)
       ▼
┌─────────────────────┐
│   API Gateway       │
│ - Add security hdrs │ ← CSP, HSTS, etc.
└──────┬──────────────┘
       │ 6. HTTPS response
       ▼
┌─────────────┐
│   Nurse     │
│   Client    │
└─────────────┘
       │ 7. Audit log entry
       ▼
┌─────────────────────┐
│   Audit Service     │
│ - Immutable logs    │
│ - Encrypted storage │
│ - 7-year retention  │
└─────────────────────┘
```

**Security Controls:**
- Encryption: AES-256-GCM at rest, TLS 1.3 in transit
- Access: RBAC (nurse can only access assigned patients)
- Audit: Every PHI access logged with user, timestamp, data accessed
- Data minimization: Only return necessary fields for role
- Key management: AWS KMS with 90-day rotation

**HIPAA Compliance:**
- §164.308(a)(3) - Workforce security (RBAC)
- §164.312(a)(2)(i) - Emergency access procedure
- §164.312(b) - Audit controls (comprehensive logging)
- §164.312(c)(1) - Integrity (encryption, signatures)

---

## 4. Third-Party Data Sharing Flow

```
┌─────────────────┐
│   Insurance     │
│   Provider      │
└────────┬────────┘
         │ 1. Request patient data
         │    Mutual TLS + API key
         ▼
┌─────────────────────┐
│   API Gateway       │
│ - mTLS verification │ ← Client certificate
│ - API key check     │ ← Validate partner
│ - IP whitelist      │ ← Only known IPs
└──────┬──────────────┘
       │ 2. Authenticated partner request
       ▼
┌─────────────────────────┐
│ Insurance Service       │
│ - Verify BAA            │ ← Business Associate Agreement
│ - Check consent         │ ← Patient consent for sharing
│ - Data minimization     │ ← Only necessary fields
└──────┬──────────────────┘
       │ 3. Query PHI
       ▼
┌─────────────────────┐
│   PostgreSQL        │
│ Encrypted PHI       │
└──────┬──────────────┘
       │ 4. PHI data
       ▼
┌─────────────────────────┐
│ Insurance Service       │
│ - Log disclosure        │ ← HIPAA disclosure tracking
│ - Redact per agreement  │ ← Only agreed fields
│ - Encrypt response      │ ← Additional encryption layer
└──────┬──────────────────┘
       │ 5. Encrypted response
       ▼
┌─────────────────────┐
│   API Gateway       │
│ - mTLS encryption   │
└──────┬──────────────┘
       │ 6. Secure channel
       ▼
┌─────────────────┐
│   Insurance     │
│   Provider      │
└─────────────────┘
```

**Security Controls:**
- Transport: Mutual TLS (mTLS) with client certificates
- Authentication: API key + mTLS
- Authorization: BAA verification, patient consent check
- IP whitelist: Only known partner IPs
- Audit: All disclosures logged (HIPAA §164.528)
- Data minimization: Only share necessary fields per agreement

---

## 5. Data Backup and Recovery Flow

```
┌─────────────────────┐
│   PostgreSQL        │
│   Primary DB        │
└──────┬──────────────┘
       │ Daily automated backup (3 AM UTC)
       ▼
┌─────────────────────┐
│   Backup Service    │
│ - Create snapshot   │
│ - Encrypt backup    │ ← AES-256-GCM
│ - Sign backup       │ ← Integrity verification
└──────┬──────────────┘
       │ Encrypted backup file
       ▼
┌─────────────────────┐
│   AWS S3            │
│ - Versioning ON     │
│ - Encryption        │ ← SSE-KMS
│ - Access logging    │
│ - Lifecycle policy  │ ← Glacier after 30 days
└──────┬──────────────┘
       │ Replication
       ▼
┌─────────────────────┐
│   AWS S3            │
│   (DR Region)       │
│ eu-west-1 (Ireland) │
└─────────────────────┘
```

**Security Controls:**
- Encryption: AES-256-GCM for backup files
- Storage: AWS S3 with SSE-KMS
- Integrity: Digital signatures on backups
- Retention: 30 days online, then Glacier (7 years total)
- Replication: Cross-region for disaster recovery
- Access: IAM roles, no public access
- Testing: Quarterly restoration tests

---

## 6. Audit Log Flow

```
┌─────────────────────┐
│  Any Service        │
│ - User action       │
│ - PHI access        │
│ - System event      │
└──────┬──────────────┘
       │ Log event
       ▼
┌─────────────────────┐
│   Audit Logger      │
│ - Enrich event      │ ← Add timestamp, user, IP
│ - Redact PII        │ ← Encrypt sensitive fields
│ - Structure log     │ ← JSON format
└──────┬──────────────┘
       │ Structured log entry
       ▼
┌─────────────────────┐
│   Message Queue     │
│   (Redis)           │
└──────┬──────────────┘
       │ Async processing
       ▼
┌─────────────────────┐
│   Audit Service     │
│ - Validate log      │
│ - Encrypt log       │ ← AES-256-GCM
│ - Add to immutable  │
│   log store         │
└──────┬──────────────┘
       │ Store in append-only DB
       ▼
┌─────────────────────┐
│   Audit Database    │
│ - Immutable logs    │ ← No UPDATE/DELETE
│ - Encrypted         │
│ - 7-year retention  │ ← HIPAA requirement
└──────┬──────────────┘
       │ Real-time indexing
       ▼
┌─────────────────────┐
│   Elasticsearch     │
│ - Searchable logs   │
│ - Anomaly detection │
│ - Alerting          │
└─────────────────────┘
```

**Security Controls:**
- Immutable: Append-only log store (no modifications)
- Encryption: AES-256-GCM for log storage
- Retention: 7 years (HIPAA §164.308(a)(1)(ii)(D))
- Integrity: Tamper detection via checksums
- Access: Restricted to security team only
- Monitoring: Real-time anomaly detection

---

## 7. Encryption Key Management Flow

```
┌─────────────────────┐
│   Service           │
│ Needs to encrypt    │
└──────┬──────────────┘
       │ 1. Request data key
       ▼
┌─────────────────────┐
│   KMS Service       │
│ - Authenticate      │ ← Service IAM role
│ - Authorize         │ ← Check permissions
└──────┬──────────────┘
       │ 2. Request key from AWS KMS
       ▼
┌─────────────────────┐
│   AWS KMS           │
│ - HSM-backed        │ ← Hardware security module
│ - Generate DEK      │ ← Data encryption key
│ - Encrypt DEK       │ ← With master key
└──────┬──────────────┘
       │ 3. Encrypted DEK + plaintext DEK
       ▼
┌─────────────────────┐
│   Service           │
│ - Encrypt data      │ ← With plaintext DEK
│ - Store encrypted   │
│   data + enc DEK    │
│ - Discard plaintext │ ← DEK never persisted
│   DEK from memory   │
└─────────────────────┘

Decryption flow (reverse):
1. Retrieve encrypted DEK
2. Call AWS KMS to decrypt DEK
3. Use plaintext DEK to decrypt data
4. Discard DEK from memory
```

**Security Controls:**
- Key storage: AWS KMS (HSM-backed)
- Key rotation: Automatic every 90 days
- Key hierarchy: Master key → Data encryption keys
- Access: IAM roles, no direct key access
- Audit: All key usage logged
- DEK lifecycle: Never persisted in plaintext

---

## Data Classification

| Classification | Examples | Encryption | Access | Retention |
|----------------|----------|------------|--------|-----------|
| **Public** | Product catalog | None | Anyone | Indefinite |
| **Internal** | Analytics | At rest | Employees | 2 years |
| **Confidential** | User emails | At rest + transit | Authorized users | Account lifetime |
| **PHI** | Prescriptions | Double encryption | RBAC + audit | 10 years |
| **PII** | SSN, credit cards | Triple encryption | Minimal access | 7 years |

---

## Compliance Mapping

| Flow | HIPAA | GDPR | Swiss DPA |
|------|-------|------|-----------|
| Authentication | §164.312(d) | Art. 32 | Art. 8 |
| PHI Access | §164.308(a)(4) | Art. 9 | Art. 17 |
| Audit Logging | §164.312(b) | Art. 30 | Art. 10 |
| Encryption | §164.312(e) | Art. 32 | Art. 8 |
| Backup | §164.308(a)(7) | Art. 32 | Art. 9 |
| Third-party | §164.308(b) | Art. 28 | Art. 9 |

---

## Contact Information

**Security Officer:** security@metapharm-connect.ch
**Data Protection Officer:** dpo@metapharm-connect.ch

---

*This document is confidential and proprietary to MetaPharm Connect.*
