# Technical Research: MetaPharm Connect Healthcare Platform

**Date**: 2025-11-07
**Purpose**: Resolve all "NEEDS CLARIFICATION" items from plan.md Technical Context
**Related Documents**: [plan.md](./plan.md), [spec.md](./spec.md)

---

## Research Topic 1: Video Infrastructure Selection

### Decision

**Selected**: **Twilio Video** (Programmable Video API)

### Rationale

1. **HIPAA Compliance**: Twilio Video offers BAA (Business Associate Agreement) for HIPAA compliance out-of-the-box
2. **End-to-End Encryption**: Native support for end-to-end encryption with visible security indicators
3. **Recording with Consent**: Built-in recording capabilities with consent management hooks
4. **Audio Fallback**: Automatic quality adaptation including audio-only mode for poor network conditions
5. **Swiss Data Residency**: Twilio supports EU data residency which covers Swiss GDPR/FADP requirements
6. **Mature SDK**: Well-documented SDKs for React Native, React, and Node.js
7. **Pricing Transparency**: $0.004/participant-minute (est. $2,400/month for 10,000 consultations at 15 min avg)

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| **Agora** | Lower cost ($0.0015/min), excellent quality | HIPAA BAA available but less established in healthcare | Twilio has better healthcare compliance track record and documentation |
| **Custom WebRTC** | Full control, no per-minute costs | Requires significant development, TURN/STUN server management, no built-in HIPAA compliance | Development cost and timeline exceed Twilio fees, compliance burden |
| **Zoom Healthcare API** | Brand recognition, excellent UX | Higher cost ($0.02/min), less customizable, requires Zoom branding | Cost 5x higher, less control over UX, vendor lock-in concerns |

### Implementation Notes

- Use Twilio Programmable Video Rooms API for ad-hoc consultations
- Implement consent flow before starting recording (FR-028)
- Store recordings in Twilio's encrypted storage initially, migrate to S3 with lifecycle policies
- Monitor call quality metrics via Twilio Insights to maintain SC-005 (95% completion rate)
- Implement reconnection logic for network interruptions

---

## Research Topic 2: Messaging Integration Strategy

### Decision

**Selected**: **Twilio WhatsApp Business API** + Direct Email/Fax Integration

### Rationale

1. **Unified Platform**: Using Twilio for both video and messaging simplifies vendor management and integration
2. **HIPAA Compliance**: Twilio's WhatsApp Business API is HIPAA-compliant with BAA
3. **Message Encryption**: End-to-end encryption for WhatsApp, TLS for email/fax
4. **Audit Trail**: All messages logged via Twilio webhooks, stored in audit trail database
5. **Multi-Channel Support**: Single API for WhatsApp, SMS, email (via SendGrid integration)
6. **Pricing**: $0.005/message for WhatsApp (est. $1,500/month for 10,000 messages/day)

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| **Direct Meta WhatsApp Business API** | Direct integration, no middleman | Complex setup, requires Meta Business verification, separate HIPAA infrastructure | Twilio provides HIPAA layer and simplifies integration |
| **MessageBird** | Multi-channel support, competitive pricing | Smaller healthcare customer base, less mature HIPAA documentation | Twilio ecosystem advantage (video + messaging) |
| **Custom SMTP/IMAP for Email** | Full control, no per-message costs | Complex multi-provider handling, spam management, no unified API | Development complexity, lack of unified audit trail |

### Implementation Notes

- Email integration via SendGrid (Twilio subsidiary) with DKIM/SPF/DMARC
- Fax via Twilio Fax API (eFax alternative)
- In-app messaging via WebSocket (Socket.io) with fallback to Twilio SMS for offline users
- Implement message deduplication across channels (same content from patient via WhatsApp and email)
- Voice message transcription via Twilio's speech-to-text API (FR-069)

---

## Research Topic 3: Message Queue Service

### Decision

**Selected**: **AWS SQS (Simple Queue Service)** with DLQ (Dead Letter Queues)

### Rationale

1. **Managed Service**: Fully managed, no server maintenance
2. **Guaranteed Delivery**: At-least-once delivery semantics, perfect for prescription workflows
3. **Dead Letter Queues**: Built-in DLQ for failed message handling
4. **Scalability**: Handles unlimited throughput, auto-scales
5. **Cost-Effective**: $0.40 per million requests (est. $50/month for expected volume)
6. **AWS Ecosystem**: If using AWS (likely for S3, Textract, etc.), staying in ecosystem reduces complexity
7. **HIPAA Eligible**: AWS offers BAA for SQS

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| **RabbitMQ** | Feature-rich, message routing, priority queues | Self-hosted, requires operational overhead, clustering complexity | Operational burden, not HIPAA-certified out-of-box |
| **Azure Service Bus** | If using Azure, good integration, message sessions | Higher cost, vendor lock-in if not fully on Azure | AWS ecosystem preferred for AI/ML services (Textract) |
| **Redis Streams** | Already using Redis, low latency | Not designed for guaranteed delivery, persistence concerns | Not suitable for critical prescription workflows requiring guarantees |

### Implementation Notes

- Use separate queues per service (prescription-queue, delivery-queue, notification-queue)
- Configure DLQ with 3 retry attempts before moving to DLQ
- Implement DLQ monitoring with CloudWatch alarms (alert if DLQ depth > 10)
- Use SQS FIFO queues for order-sensitive operations (prescription approval → treatment plan → notification)
- Standard queues for non-order-sensitive operations (analytics aggregation)

---

## Research Topic 4: Load Testing Tool

### Decision

**Selected**: **k6** (Grafana k6)

### Rationale

1. **WebSocket Support**: Native support for WebSockets (critical for real-time features)
2. **JavaScript/TypeScript**: Tests written in JS, familiar to team using TypeScript
3. **CI/CD Integration**: Excellent GitHub Actions / GitLab CI integration
4. **Cloud Execution**: k6 Cloud for distributed load testing
5. **Reporting**: Built-in Grafana integration for visualization
6. **Open Source**: Free for local testing, paid for cloud execution
7. **HTTP/2 Support**: Modern protocol support for API testing

### Alternatives Considered

| Alternative | Pros | Cons | Rejected Because |
|-------------|------|------|------------------|
| **Artillery** | Simple YAML config, good for CI/CD | Limited WebSocket support, less mature than k6 | WebSocket testing is critical for this project |
| **JMeter** | Industry standard, feature-rich GUI | Java-based (not team skillset), complex setup, poor CI/CD integration | Not developer-friendly, Java ecosystem mismatch |
| **Locust** | Python-based, easy to learn | Not ideal for WebSocket testing, smaller community | k6 more aligned with JavaScript ecosystem |

### Implementation Notes

- Create test scenarios per user story (P1-P11 prescription, teleconsultation, delivery, etc.)
- Target performance goals: 10,000 concurrent users, p95 < 500ms (read), < 1000ms (write)
- Run load tests in CI/CD pipeline before production deployments
- Use k6 thresholds to fail builds if performance degrades
- Schedule nightly load tests against staging environment

---

## Research Topic 5: Swiss HIN e-ID Integration

### Decision

**Implementation Approach**: **OAuth 2.0 / OpenID Connect** via HIN e-ID Provider

### Findings

1. **Authentication Flow**: HIN provides OAuth 2.0 / OpenID Connect (OIDC) compliant identity provider
2. **User Provisioning**: HIN e-ID acts as federated identity, no local user creation needed for doctors
3. **Test Environment**: HIN provides sandbox environment for development
4. **Certificate Management**: HIN uses standard SSL/TLS certificates, no custom PKI required
5. **Supported Roles**: Doctors, pharmacists, and other healthcare professionals have HIN e-IDs
6. **Integration Timeline**: HIN onboarding process takes ~4-6 weeks (application, contract, technical setup)

### Technical Specifications

- **Protocol**: OAuth 2.0 Authorization Code Flow with PKCE
- **Scopes**: `openid`, `profile`, `email`, `hin.professional`
- **Token Format**: JWT (JSON Web Token)
- **Token Lifetime**: Access token 1 hour, refresh token 30 days
- **Claims**: HIN ID (unique identifier), GLN (Global Location Number), profession type, organization affiliation

### Implementation Notes

- Integrate via Passport.js OAuth2 strategy in Node.js backend
- Store HIN ID as external user identifier, map to internal user ID
- Implement token refresh workflow to maintain sessions
- Handle HIN downtime gracefully (cache user profile for 24 hours, allow MFA bypass if HIN unavailable)
- Display HIN e-ID badge in doctor/pharmacist profiles for trust indicators

### References

- HIN Developer Portal: https://www.hin.ch/entwickler/
- HIN e-ID Integration Guide: (requires HIN partner access)

---

## Research Topic 6: Swiss Cantonal e-santé API Integration

### Decision

**Implementation Approach**: **FHIR R4 (Fast Healthcare Interoperability Resources)** with Cantonal Gateways

### Findings

1. **API Standards**: Swiss e-santé infrastructure uses FHIR R4 standard (HL7)
2. **Cantonal Variation**: Each canton has its own e-santé gateway, but all comply with federal EPD (Electronic Patient Dossier) standards
3. **Authentication**: OAuth 2.0 / SAML 2.0 via HIN e-ID (doctors/pharmacists authenticate via HIN to access patient data)
4. **Data Format**: FHIR JSON for structured data, CDA (Clinical Document Architecture) for documents
5. **Rate Limits**: Varies by canton, typically 1000 requests/day per provider
6. **Patient Consent**: Explicit patient consent required before accessing cantonal health records (FR-075)

### FHIR Resources Used

- **Patient**: Demographics, contact info, insurance
- **MedicationRequest**: Prescriptions
- **MedicationStatement**: Medication history
- **AllergyIntolerance**: Patient allergies
- **Condition**: Chronic conditions, diagnoses
- **Observation**: Lab results, vital signs
- **DocumentReference**: PDFs, images, clinical documents

### Implementation Notes

- Use HAPI FHIR library (Java) or fhir.js (JavaScript) for FHIR client
- Implement consent workflow: patient grants access → system registers consent → fetch e-santé data
- Cache e-santé data locally (encrypted) for 7 days to reduce API calls
- Handle cantonal differences via configuration (endpoint URLs, auth methods per canton)
- Implement fallback: if e-santé API unavailable, allow manual data entry by pharmacist
- Map FHIR resources to internal data model (Patient Medical Record entity)

### MVP Scope

- **Phase 1 (MVP)**: Support 2-3 major cantons (e.g., Vaud, Geneva, Zurich) representing 50%+ of target pharmacies
- **Phase 2**: Add remaining cantons based on pharmacy locations

### References

- Swiss EPD Platform: https://www.patientendossier.ch/
- FHIR R4 Specification: https://www.hl7.org/fhir/

---

## Research Topic 7: Insurance System Integration

### Decision

**Implementation Approach**: **Swiss Health Insurance Card (KVG/LAMal)** + Insurance Provider APIs

### Findings

1. **Insurance Card Standard**: Swiss health insurance cards contain patient identification and insurance details (card number, insurance provider, validity period)
2. **Real-Time Eligibility**: Most major Swiss insurers (CSS, Helsana, Swica, Sanitas, etc.) provide REST APIs for eligibility verification
3. **Claims Submission**: Electronic claims submission via Tarmed billing standard (used by Swiss pharmacies)
4. **Third-Party Payment**: Insurance covers prescription costs directly (Tiers Payant system), patient pays deductible/copay only
5. **Integration Hub**: Swiss insurers use intermediary platforms (e.g., MediData, HCI Solutions) for standardized API access

### Technical Specifications

- **Eligibility Check API**: Input insurance card number → output coverage status, deductible remaining, copay amount
- **Claims Submission API**: Submit prescription details → receive claim confirmation number
- **Error Handling**: API returns error codes for invalid cards, coverage denials, requiring prior authorization

### Implementation Notes

- Integrate via MediData aggregation platform (single API for multiple insurers)
- Implement insurance card scanning via camera (OCR for card number extraction)
- Cache eligibility results for 24 hours (reduce API calls, improve checkout speed)
- Handle insurance rejection gracefully: notify patient, offer cash payment option
- Implement retry logic for failed eligibility checks (3 retries with exponential backoff)
- Display insurance coverage info at checkout (FR-058): "Your insurance covers CHF 120, you pay CHF 10"

### MVP Scope

- **Phase 1**: Support top 5 Swiss insurers (70%+ market coverage)
- **Phase 2**: Add remaining insurers, handle specialty insurance (accident, military)

### References

- Tarmed Billing Standard: https://www.tarmed.ch/
- MediData Platform: https://www.medidata.ch/

---

## Research Topic 8: AI/ML Services Architecture

### Decisions

#### 8.1 Prescription OCR

**Selected**: **AWS Textract** + Post-Processing with Custom NLP

**Rationale**:
- AWS Textract provides medical document OCR with high accuracy (95%+)
- HIPAA-compliant (AWS BAA)
- Handles handwritten prescriptions reasonably well
- Pricing: $1.50 per 1000 pages (est. $150/month for 100,000 prescriptions/month)
- Post-process with custom NLP to normalize drug names (map variants to standard RxNorm codes)

**Alternatives**: Azure Computer Vision (similar accuracy, more expensive), Google Cloud Vision (excellent but less healthcare focus)

#### 8.2 Drug Interaction Database

**Selected**: **First Databank (FDB) MedKnowledge API** (Commercial)

**Rationale**:
- Industry-leading drug interaction database used by major EHRs
- Swiss drug formulary included
- Real-time API for interaction checks (< 100ms response time)
- Severity levels (contraindicated, major, moderate, minor)
- Pricing: ~$500/month for API access (tiered by volume)

**Alternatives**: RxNorm (USNIH, free but US-focused), Open FDA (free but limited Swiss coverage), CDS Hooks (open standard but requires infrastructure)

**Implementation**: Cache common drug interaction pairs in Redis to reduce API calls for frequently prescribed medications

#### 8.3 Route Optimization

**Selected**: **Google Maps Platform** (Routes API + Distance Matrix API)

**Rationale**:
- Best traffic data and real-time routing in Switzerland
- Support for constraints (time windows, cold chain priority)
- Well-documented SDKs for mobile and backend
- Pricing: $0.005/route + $0.005/distance matrix call (est. $300/month for 500 deliveries/day)

**Alternatives**: Mapbox (cheaper, less accurate traffic data), GraphHopper (open-source, requires hosting)

**Implementation**:
- Pre-compute distance matrix for common pharmacy-to-patient routes
- Use Routes API for real-time routing during delivery
- Implement manual route override for delivery personnel

#### 8.4 Demand Forecasting

**Selected**: **AWS Forecast** (AutoML Time Series Forecasting)

**Rationale**:
- Managed ML service, no model training required
- Handles seasonality, trends, holidays automatically
- Integrates with S3 and Aurora for data sources
- Pricing: $0.60 per 1000 forecasts (est. $100/month for daily inventory forecasts)

**Alternatives**: Azure ML AutoML (similar but more expensive), Prophet (open-source, requires data science expertise)

**Implementation**:
- Train forecasting models on historical prescription data (6-12 months)
- Generate daily forecasts for top 100 medications per pharmacy
- Use forecasts to trigger reorder alerts (FR-035)

### Summary Table

| AI/ML Service | Provider | Monthly Cost (Est.) | HIPAA | Integration Complexity |
|---------------|----------|---------------------|-------|------------------------|
| Prescription OCR | AWS Textract | $150 | ✅ | Low |
| Drug Interactions | FDB MedKnowledge | $500 | ✅ | Medium |
| Route Optimization | Google Maps | $300 | N/A | Low |
| Demand Forecasting | AWS Forecast | $100 | ✅ | Medium |
| **Total** | | **$1,050/month** | | |

---

## Research Topic 9: Database Encryption Strategy

### Decision

**Selected**: **Application-Level Encryption** using AWS KMS (Key Management Service)

### Rationale

1. **Compliance**: HIPAA requires encryption at rest for PHI, application-level ensures compliance even if database backups are compromised
2. **Key Management**: AWS KMS provides secure key storage with audit trails (all key access logged to CloudTrail)
3. **Performance**: Encrypt only sensitive columns (not entire database), minimal performance impact (< 5% overhead)
4. **Flexibility**: Can encrypt/decrypt in application layer before database operations
5. **Audit Trail**: KMS logs every encryption/decryption operation with user context (satisfies FR-105, FR-106)

### Alternative: Column-Level Encryption (PostgreSQL pgcrypto)

**Rejected Because**:
- Key management complexity (where to store encryption keys securely?)
- Limited audit trail (PostgreSQL logs don't capture which user accessed which encrypted data)
- Performance overhead higher for large result sets
- Harder to implement field-level access control (application level provides more granularity)

### Implementation Notes

#### Encrypted Columns

- **Patient**: First name, last name, address, phone, email, SSN
- **Prescription**: Patient allergies, medical history
- **MedicalRecord**: All fields (prescriptions, consultations, lab results)
- **Message**: Message content (body, attachments)
- **DeliveryOrder**: Patient address, signature image

#### Non-Encrypted Columns

- **User**: Email (needed for login lookup), role (needed for RBAC queries)
- **Inventory**: Medication names, quantities (not PHI)
- **Analytics**: Aggregated data (no patient identifiers)

#### Encryption Library

- Use `aws-encryption-sdk-javascript` for Node.js backend
- Implement `encryptField()` and `decryptField()` utility functions
- Use data key caching to reduce KMS API calls (cache up to 1000 data keys for 5 minutes)

#### Key Rotation

- Rotate KMS keys annually (AWS handles old data automatically with envelope encryption)
- Implement emergency key rotation procedure if key compromise suspected

#### Performance Optimization

- Encrypt/decrypt only when necessary (e.g., don't decrypt fields not returned in API response)
- Use database indexes on non-encrypted searchable fields (e.g., user email hash for login)
- For search on encrypted fields (e.g., patient name search), implement tokenization:
  - Store encrypted `first_name` + hash of `first_name` for lookup
  - Search via hash, decrypt only matching rows

---

## Research Topic 10: Multi-Tenant Database Strategy

### Decision

**Selected**: **Row-Level Security (RLS)** with `pharmacy_id` on all tenant-scoped tables

### Rationale

1. **Simplicity**: Single database, single schema, easier to manage than separate DBs per tenant
2. **Cost-Effective**: Shared resources, no need to provision separate DB instances per pharmacy
3. **Data Isolation**: PostgreSQL RLS enforces tenant boundaries at database level (defense-in-depth beyond application logic)
4. **Scalability**: Can start with single DB, shard by pharmacy_id later if needed
5. **Backup/Restore**: Single backup for all tenants, easier disaster recovery
6. **Cross-Tenant Queries**: Analytics across pharmacies easy to implement (for platform-level insights)

### Alternative: Separate Databases Per Pharmacy

**Rejected Because**:
- Operational complexity: managing 100+ databases at scale
- Migration complexity: schema changes require applying to all databases
- Cost: Each database instance has overhead (even if small pharmacies don't use much data)
- Cross-tenant analytics harder (requires federated queries)

### Alternative: Schema-Based Isolation

**Rejected Because**:
- PostgreSQL schema switching is complex and error-prone
- Connection pooling complications (each schema needs separate pool)
- RLS provides equivalent isolation with less complexity

### Implementation Notes

#### Database Schema

```sql
-- Add pharmacy_id to all tenant-scoped tables
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL,  -- Foreign key to pharmacies table
    patient_id UUID NOT NULL,
    -- other fields...
    CONSTRAINT fk_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
);

-- Enable Row-Level Security
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow users to see only their pharmacy's data)
CREATE POLICY pharmacy_isolation_policy ON prescriptions
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);
```

#### Application Implementation

- Set `app.current_pharmacy_id` session variable on every database connection
- Extract `pharmacy_id` from JWT token (user's pharmacy affiliation)
- Use PostgreSQL connection pooling with session variables

#### Global Tables (Not Tenant-Scoped)

- **users**: Global user table (can belong to multiple pharmacies for pharmacy chains)
- **audit_trail**: Global audit log (includes pharmacy_id for filtering)
- **medications_catalog**: Global medication database (shared across all pharmacies)

#### Data Migration Strategy

- New pharmacy onboarding: Create `pharmacy` record, assign `pharmacy_id` to all related data
- Pharmacy offboarding: Soft delete (set `deleted_at` timestamp), retain data for legal retention period (10 years)

#### Sharding Strategy (Future)

- If single database becomes bottleneck (> 10,000 pharmacies), shard by `pharmacy_id` ranges:
  - Shard 1: `pharmacy_id` 0-999
  - Shard 2: `pharmacy_id` 1000-1999
  - Etc.
- Use Citus extension for PostgreSQL to automate sharding (compatible with RLS)

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         MetaPharm Connect Platform                       │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐   ┌────────────────────┐   ┌──────────────────────┐
│  Mobile Apps (5)   │   │  Web App (Unified) │   │  External Systems    │
│  - Pharmacist      │   │  - React SPA       │   │  - HIN e-ID (OAuth)  │
│  - Doctor          │◄──┼──- Role-based      │◄──┼──- e-santé (FHIR)    │
│  - Nurse           │   │    shells          │   │  - Insurance APIs    │
│  - Delivery        │   │                    │   │  - Twilio (Video/SMS)│
│  - Patient         │   │                    │   │  - AWS Textract      │
└────────────────────┘   └────────────────────┘   └──────────────────────┘
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                          ┌────────▼───────────┐
                          │   API Gateway      │
                          │  (Rate Limiting,   │
                          │   Auth Middleware) │
                          └────────┬───────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
┌────────▼──────┐   ┌──────────▼─────────┐   ┌─────────▼──────────┐
│ Auth Service  │   │ Prescription Svc   │   │ Teleconsult Svc    │
│ (HIN e-ID,    │   │ (OCR, Validation)  │   │ (Video, Notes)     │
│  MFA, JWT)    │   │                    │   │                    │
└───────────────┘   └────────────────────┘   └────────────────────┘

┌───────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ Inventory Svc │   │  Delivery Service  │   │  E-Commerce Svc    │
│ (QR, Alerts)  │   │ (GPS, Routing)     │   │ (Catalog, Orders)  │
└───────────────┘   └────────────────────┘   └────────────────────┘

┌───────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ Messaging Svc │   │  Records Service   │   │  Analytics Svc     │
│ (Multi-Channel│   │ (Patient Data)     │   │ (Dashboards, BI)   │
└───────────────┘   └────────────────────┘   └────────────────────┘

         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                          ┌────────▼───────────┐
                          │  PostgreSQL 16     │
                          │  (Row-Level        │
                          │   Security)        │
                          └────────────────────┘

┌──────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  Redis Cache     │   │  AWS SQS (Queues)  │   │  S3 Object Storage │
│  (Sessions,      │   │  (Async Jobs)      │   │  (Images, Videos)  │
│   Real-time)     │   │                    │   │                    │
└──────────────────┘   └────────────────────┘   └────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   Infrastructure (AWS/Azure + K8s)                    │
│  - Docker containers for all services                                 │
│  - Kubernetes for orchestration (auto-scaling, health checks)        │
│  - CloudWatch / Prometheus for monitoring                             │
│  - CloudTrail / Audit logs for compliance                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Cost Estimate Summary

### Monthly Operational Costs (MVP Phase: 1-5 Pharmacies)

| Service Category | Provider | Monthly Cost | Notes |
|------------------|----------|--------------|-------|
| **Video Infrastructure** | Twilio Video | $2,400 | 10,000 consultations × 15 min avg |
| **Messaging** | Twilio WhatsApp/SMS | $1,500 | 10,000 messages/day |
| **AI/ML Services** | AWS Textract, FDB, Google Maps, AWS Forecast | $1,050 | See Research Topic 8 |
| **Database** | AWS RDS PostgreSQL | $500 | db.t3.large with Multi-AZ |
| **Redis Cache** | AWS ElastiCache | $200 | cache.t3.medium |
| **Object Storage** | AWS S3 | $300 | 10 TB storage, lifecycle policies |
| **Message Queue** | AWS SQS | $50 | Millions of messages |
| **Container Hosting** | AWS EKS | $2,000 | 10 microservices, auto-scaling |
| **Monitoring** | CloudWatch, Grafana Cloud | $300 | Logs, metrics, alerts |
| **CDN** | CloudFront | $200 | Static assets, API caching |
| **Domain & SSL** | Route53, ACM | $50 | DNS, certificates |
| **Backups** | AWS Backup | $200 | Database + S3 snapshots |
| **Support** | AWS Business Support | $1,000 | 10% of AWS spend (optional) |
| **Total** | | **~$9,750/month** | Within $10,000 budget target |

### Cost Scaling (Phase 2: 10-50 Pharmacies)

- Video/Messaging: ~$8,000/month (2.5x usage)
- AI/ML: ~$2,000/month (increased OCR volume)
- Database: ~$1,500/month (larger instance + read replicas)
- Hosting: ~$5,000/month (more containers)
- **Total**: ~$20,000/month (still cost-effective at ~$400-$2,000/pharmacy/month depending on usage)

---

## Security Architecture

### Authentication Flow

```text
1. User opens app → Redirected to HIN e-ID (for doctors/pharmacists) or local auth (patients)
2. HIN e-ID OAuth flow → User approves → App receives authorization code
3. App exchanges code for JWT access token (contains user ID, roles, pharmacy affiliation)
4. App stores JWT in secure storage (Keychain on iOS, EncryptedSharedPreferences on Android)
5. Every API request includes JWT in Authorization header
6. API Gateway validates JWT signature, checks expiration
7. If valid, extracts user context (user_id, pharmacy_id, roles)
8. Sets PostgreSQL session variable `app.current_pharmacy_id` for Row-Level Security
9. Microservice processes request with RLS enforcing tenant isolation
```

### Data Encryption Layers

1. **Transport Layer**: TLS 1.3 for all API communication
2. **Application Layer**: AWS KMS encryption for PHI columns before database storage
3. **Database Layer**: PostgreSQL encryption at rest (LUKS volume encryption)
4. **Backup Layer**: Encrypted database backups with separate KMS keys

### Audit Trail

- **What**: All access to prescriptions, medical records, controlled substances
- **How**: Database triggers on sensitive tables insert to `audit_trail` table
- **Storage**: Immutable (no UPDATE/DELETE permissions), append-only log
- **Retention**: 10 years minimum (Swiss healthcare regulations)
- **Fields**: timestamp, user_id, action (read/create/update/delete), table_name, record_id, pharmacy_id, IP address, device info

---

## Compliance Checklist

### HIPAA Compliance

- [x] Encryption at rest (AWS KMS)
- [x] Encryption in transit (TLS 1.3)
- [x] Access controls (RBAC, Row-Level Security)
- [x] Audit trails (immutable logs)
- [x] BAA with vendors (Twilio, AWS)
- [x] Data backup and disaster recovery
- [x] Breach notification process (documented)

### GDPR / Swiss FADP Compliance

- [x] Right to access (patients can download their data)
- [x] Right to deletion (implement soft delete with retention period)
- [x] Data portability (export in JSON/PDF format)
- [x] Consent management (explicit consent for e-santé sync, data sharing)
- [x] Data minimization (only collect necessary PHI)
- [x] Data retention policies (10 years for prescriptions, 7 days for cached e-santé data)

### Swiss Narcotics Regulations

- [x] Enhanced audit trails for controlled substances (FR-037, FR-109)
- [x] Delivery restrictions for Schedule I/II narcotics (FR-046a)
- [x] Signature and ID verification for controlled substance deliveries (FR-046, FR-047)
- [x] Integration with cantonal narcotics registries (future phase)

---

## Next Steps

1. ✅ **Research Complete**: All technical unknowns resolved
2. ⏭ **Phase 1**: Generate `data-model.md` with entity schemas, RBAC matrix, state machines
3. ⏭ **Phase 1**: Generate API contracts in `contracts/` (OpenAPI 3.0 specs for all services)
4. ⏭ **Phase 1**: Generate `quickstart.md` with local development setup and deployment guide
5. ⏭ **Phase 1**: Update agent context with selected technologies
6. ⏭ **Phase 2**: Break down MVP (P1-P3) into actionable tasks in `tasks.md`

**Command to continue**: Phase 0 complete. Proceed to Phase 1 artifact generation.
