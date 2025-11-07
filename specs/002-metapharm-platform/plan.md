# Implementation Plan: MetaPharm Connect Healthcare Platform

**Branch**: `002-metapharm-platform` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-metapharm-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

MetaPharm Connect is a comprehensive healthcare platform connecting five distinct user roles (Pharmacists, Doctors, Nurses, Delivery Personnel, Patients) through integrated mobile and web applications. The platform provides AI-powered prescription processing, secure teleconsultation, real-time inventory management with QR traceability, intelligent delivery logistics with GPS tracking, patient e-commerce, unified secure messaging across multiple channels, comprehensive medical records management, and analytics for operational optimization.

**Primary Requirements**:
- Multi-tenant architecture with role-based access control (RBAC) for 5 user types
- HIPAA, GDPR, and Swiss healthcare regulation compliance with immutable audit trails
- End-to-end encryption for all patient health information (PHI)
- Swiss HIN e-ID authentication for healthcare professionals
- AI services for prescription OCR, drug interaction checking, demand forecasting, route optimization
- Real-time features: video calls, GPS tracking, messaging
- Integration with Swiss cantonal health records (e-santé APIs), insurance systems, payment processors
- Multi-platform delivery: iOS/Android native apps, responsive web application
- Target: Initial deployment to 1-5 pharmacy locations serving thousands of patients

**Technical Approach**:
- **Architecture**: Microservices backend with API gateway, separate mobile apps per user role, unified web application
- **Backend**: Node.js/TypeScript with Express.js, PostgreSQL primary database, Redis caching layer, message queue for async operations
- **Mobile**: React Native for cross-platform development (iOS/Android) with native modules where required
- **Web**: React with TypeScript, responsive design, PWA capabilities
- **AI/ML**: Cloud-based services (AWS Textract for OCR, custom drug interaction API, route optimization service)
- **Real-time**: WebSocket server for live updates, Twilio/Agora for video calls
- **Infrastructure**: Containerized deployment (Docker/Kubernetes), AWS/Azure cloud hosting

## Technical Context

**Language/Version**:
- Backend: TypeScript 5.3 / Node.js 20 LTS
- Mobile: TypeScript 5.3 / React Native 0.73
- Web Frontend: TypeScript 5.3 / React 18

**Primary Dependencies**:
- Backend API: Express.js 4.x, TypeORM, Passport.js (auth), Socket.io (WebSockets)
- Mobile: React Native, React Navigation, Redux Toolkit, React Native Video (teleconsultation)
- Web: React 18, React Router, Redux Toolkit, Material-UI/Chakra UI
- Database: PostgreSQL 16 (primary), Redis 7 (caching/sessions)
- AI/ML: AWS Textract (prescription OCR), custom drug interaction API, Google Maps API (routing)
- Video: NEEDS CLARIFICATION (Twilio vs. Agora vs. custom WebRTC)
- Messaging: NEEDS CLARIFICATION (Twilio for WhatsApp Business API vs. direct integration)

**Storage**:
- Primary: PostgreSQL 16 with encrypted columns for PHI
- Caching: Redis 7 for session management, real-time data
- Object Storage: AWS S3 / Azure Blob Storage for prescription images, consultation recordings, delivery photos
- Message Queue: NEEDS CLARIFICATION (RabbitMQ vs. AWS SQS vs. Azure Service Bus)

**Testing**:
- Backend: Jest + Supertest (unit/integration), Newman (API contract testing)
- Mobile: Jest + React Native Testing Library, Detox (E2E)
- Web: Jest + React Testing Library, Playwright (E2E)
- Load Testing: NEEDS CLARIFICATION (k6 vs. Artillery vs. JMeter)

**Target Platform**:
- Mobile: iOS 14+, Android 8+ (API level 26+)
- Web: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Backend: Linux servers (Ubuntu 22.04 LTS), containerized deployment

**Project Type**: Multi-platform (mobile + web + backend microservices)

**Performance Goals**:
- API Response Time: p95 < 500ms for read operations, < 1000ms for write operations
- Video Call Quality: 720p at 30fps minimum, < 150ms latency
- GPS Tracking Updates: Every 15 seconds for active deliveries
- Real-time Messaging: Message delivery < 2 seconds
- Concurrent Users: Support 10,000 active users initially, scalable to 100,000
- Database Queries: p95 < 100ms
- Prescription OCR Processing: < 10 seconds per image

**Constraints**:
- **Regulatory**: HIPAA, GDPR, Swiss Federal Act on Data Protection (FADP), Swiss narcotics regulations
- **Security**: End-to-end encryption for PHI, MFA for healthcare professionals, Swiss HIN e-ID integration
- **Audit**: Immutable audit trails for all prescription/medical record access
- **Uptime**: 99.5% availability for critical features (prescription processing, teleconsultation, delivery tracking)
- **Data Retention**: Comply with Swiss healthcare data retention requirements (minimum 10 years for prescriptions)
- **Offline**: Mobile apps must handle intermittent connectivity gracefully (queue operations, local caching)
- **Budget**: Cloud hosting costs target < $10,000/month for MVP deployment (1-5 pharmacies)

**Scale/Scope**:
- **Users**: 1-5 pharmacies initially (~50-250 pharmacy staff, ~5,000-25,000 patients)
- **Data Volume**: ~1,000 prescriptions/day, ~10,000 messages/day, ~500 deliveries/day
- **Features**: 11 prioritized user stories (P1-P11), 112 functional requirements
- **Integrations**: 7 external systems (HIN e-ID, e-santé APIs, insurance, payments, WhatsApp, SMS, email/fax gateways)
- **Codebase Estimate**: ~150,000 LOC across all platforms
- **Development Timeline**: 12-18 months for P1-P11 features (6 months MVP for P1-P3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Security & Privacy First

**Status**: ALIGNED

- End-to-end encryption specified for all PHI (FR-104)
- MFA required for pharmacists and doctors (FR-002)
- Swiss HIN e-ID authentication for doctors (FR-003)
- Zero-trust architecture with RBAC (FR-001, FR-112)
- Security indicators visible in video calls and messaging (FR-023, FR-111)

**Design Artifacts**:
- Encryption key management strategy (Phase 1: data-model.md)
- Auth flow diagrams for all 5 user roles (Phase 1: contracts/auth/)
- Security architecture diagram (Phase 0: research.md)

---

### ✅ II. Regulatory Compliance Built-In

**Status**: ALIGNED

- HIPAA/GDPR compliance specified (FR-107, FR-108)
- Swiss cantonal healthcare regulations incorporated (FR-003, FR-075)
- Immutable audit trails for all medical data access (FR-105, FR-106)
- Data retention policies specified (FR-107)
- Consent management for data sharing (FR-079, FR-110)

**Design Artifacts**:
- Audit trail data model with immutability guarantees (Phase 1: data-model.md)
- Compliance checklist per feature (Phase 1: quickstart.md)
- Data retention policy documentation (Phase 0: research.md)

---

### ✅ III. Traceability & Documentation

**Status**: ALIGNED

- Zero oral communication mandate - all actions documented (FR-018, FR-067)
- Audit trails for prescriptions, orders, deliveries (FR-018, FR-105, FR-109)
- Immutable logs with timestamp, user ID, context (FR-106)
- Messaging between healthcare professionals documented (FR-064-FR-073)

**Design Artifacts**:
- Audit event schema for all trackable actions (Phase 1: data-model.md)
- Audit trail API contracts (Phase 1: contracts/audit/)
- Event sourcing architecture for critical workflows (Phase 0: research.md)

---

### ✅ IV. Multi-Tenant Isolation

**Status**: ALIGNED

- RBAC for 5 user roles specified (FR-001)
- Principle of least privilege enforced (FR-112)
- Explicit consent for cross-role data sharing (FR-079, FR-110)
- Data boundaries clearly defined per role

**Design Artifacts**:
- RBAC permission matrix (Phase 1: data-model.md)
- Data access control rules per entity (Phase 1: data-model.md)
- Multi-tenant database isolation strategy (Phase 0: research.md)

---

### ✅ V. Patient-Centric Design

**Status**: ALIGNED

- UI reduces patient cognitive load (assumption 5: French UI, clear messaging)
- Proactive recommendations via AI (FR-054, FR-062, FR-078)
- Clear error messages and non-technical language
- Accessibility considerations documented (FR-024 assumption 8)

**Design Artifacts**:
- Mobile UX patterns for patient flows (Phase 1: quickstart.md)
- Error message catalog with patient-friendly language (Phase 1: research.md)
- Accessibility compliance checklist (WCAG 2.1 AA) (Phase 1: quickstart.md)

---

### ✅ VI. Real-Time Reliability for Critical Features

**Status**: ALIGNED

- SLAs defined for prescription processing (SC-001: 90% within 15 min)
- Performance targets for video, GPS, messaging (SC-005, SC-009, SC-014)
- Failure modes documented in edge cases
- Offline fallback for mobile apps (Constraint: offline capability)
- 99.5% uptime target (SC-016)

**Design Artifacts**:
- Failure mode analysis per critical workflow (Phase 0: research.md)
- Circuit breaker patterns for external integrations (Phase 1: data-model.md)
- Degraded mode specifications (Phase 1: quickstart.md)

---

### Constitution Check Summary

**Overall Status**: ✅ PASS

All six constitutional principles are addressed in the specification. No violations requiring justification.

**Re-check Required After Phase 1**: Validate that data model, API contracts, and architecture diagrams fully implement the security, compliance, and traceability requirements.

## Project Structure

### Documentation (this feature)

```text
specs/002-metapharm-platform/
├── spec.md                          # Feature specification (495 lines)
├── plan.md                          # This file (/speckit.plan command output)
├── research.md                      # Phase 0 output (/speckit.plan command)
├── data-model.md                    # Phase 1 output (/speckit.plan command)
├── quickstart.md                    # Phase 1 output (/speckit.plan command)
├── contracts/                       # Phase 1 output (/speckit.plan command)
│   ├── auth/                        # Authentication APIs (HIN e-ID, MFA, sessions)
│   ├── prescriptions/               # Prescription APIs (upload, transcribe, validate, approve)
│   ├── teleconsultation/            # Video call APIs (booking, sessions, notes)
│   ├── inventory/                   # Inventory APIs (QR scanning, alerts, analytics)
│   ├── delivery/                    # Delivery APIs (routing, tracking, confirmation)
│   ├── ecommerce/                   # E-commerce APIs (catalog, cart, checkout, orders)
│   ├── messaging/                   # Messaging APIs (unified inbox, channels, notifications)
│   ├── records/                     # Medical records APIs (patient data, sync, permissions)
│   ├── analytics/                   # Analytics APIs (dashboards, reports, forecasts)
│   └── integrations/                # External integration specs (HIN, e-santé, insurance, payments)
├── checklists/                      # Quality checklists
│   └── requirements.md              # Specification quality checklist (114 lines)
└── tasks.md                         # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Backend Microservices
backend/
├── services/
│   ├── api-gateway/                 # API Gateway (routing, rate limiting, auth middleware)
│   ├── auth-service/                # Authentication & Authorization (HIN e-ID, MFA, JWT)
│   ├── prescription-service/        # Prescription processing (OCR, validation, approval)
│   ├── teleconsultation-service/    # Video call management (booking, WebRTC signaling)
│   ├── inventory-service/           # Inventory management (QR tracking, alerts)
│   ├── delivery-service/            # Delivery logistics (route optimization, GPS tracking)
│   ├── ecommerce-service/           # E-commerce (catalog, cart, orders, payments)
│   ├── messaging-service/           # Unified messaging (multi-channel aggregation)
│   ├── records-service/             # Medical records (patient data, e-santé sync)
│   ├── analytics-service/           # Analytics & reporting (aggregation, forecasting)
│   └── notification-service/        # Push notifications, email, SMS
├── shared/
│   ├── db/                          # Database schemas, migrations
│   ├── models/                      # Shared TypeORM entities
│   ├── utils/                       # Shared utilities (encryption, logging, validation)
│   └── types/                       # Shared TypeScript types
└── tests/
    ├── contract/                    # API contract tests (OpenAPI validation)
    ├── integration/                 # Service integration tests
    └── e2e/                         # End-to-end workflow tests

# Mobile Applications
mobile/
├── pharmacist-app/                  # Pharmacist mobile app (iOS + Android)
│   ├── src/
│   │   ├── screens/                 # Screen components (Dashboard, Prescriptions, etc.)
│   │   ├── components/              # Reusable UI components
│   │   ├── navigation/              # Navigation configuration
│   │   ├── services/                # API client, state management
│   │   └── utils/                   # Platform-specific utilities
│   └── __tests__/                   # Unit + integration tests
├── doctor-app/                      # Doctor mobile app (iOS + Android)
├── nurse-app/                       # Nurse mobile app (iOS + Android)
├── delivery-app/                    # Delivery personnel app (iOS + Android)
├── patient-app/                     # Patient mobile app (iOS + Android)
└── shared/                          # Shared mobile components/utilities
    ├── components/                  # Cross-app UI components
    ├── services/                    # API clients, auth, storage
    └── utils/                       # Shared utilities (date formatting, validation)

# Web Application
web/
├── src/
│   ├── apps/                        # Role-specific app shells
│   │   ├── pharmacist/              # Pharmacist web app
│   │   ├── doctor/                  # Doctor web app
│   │   ├── nurse/                   # Nurse web app
│   │   ├── delivery/                # Delivery web app
│   │   └── patient/                 # Patient web app
│   ├── shared/
│   │   ├── components/              # Shared React components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API clients, state management
│   │   └── utils/                   # Utilities (validation, formatting)
│   └── styles/                      # Global styles, themes
└── tests/
    ├── unit/                        # Component unit tests
    ├── integration/                 # Feature integration tests
    └── e2e/                         # Playwright end-to-end tests

# Infrastructure
infrastructure/
├── docker/                          # Docker compose files for local development
├── kubernetes/                      # K8s manifests for deployment
│   ├── base/                        # Base configurations
│   ├── overlays/
│   │   ├── dev/                     # Development environment
│   │   ├── staging/                 # Staging environment
│   │   └── production/              # Production environment
├── terraform/                       # Infrastructure as Code (cloud resources)
└── monitoring/                      # Monitoring configs (Prometheus, Grafana)

# Shared Libraries
packages/
├── api-types/                       # Shared TypeScript types for APIs
├── validation/                      # Shared validation schemas (Zod/Yup)
└── constants/                       # Shared constants (error codes, configs)
```

**Structure Decision**:
- **Multi-platform architecture** selected due to distinct user roles requiring separate mobile apps (5 apps) and web applications (5 web apps)
- **Microservices backend** chosen for scalability, independent deployment, and clear service boundaries aligned with constitutional principle IV (Multi-Tenant Isolation)
- **Monorepo approach** using npm workspaces/Yarn workspaces to share types, utilities, and components across platforms while maintaining clear boundaries
- **Separate mobile apps per role** ensures RBAC enforcement at the application level and optimizes UX for each user type's workflows
- **Unified web application** with role-based shells provides desktop access while sharing infrastructure and reducing deployment complexity
- **Containerized microservices** enable independent scaling of high-load services (prescription processing, delivery tracking) and facilitate compliance auditing

**Rationale**:
- 5 distinct user roles with different data access needs → separate mobile apps prevent accidental cross-role data exposure
- HIPAA/GDPR compliance → microservices allow isolated audit trails per service
- Real-time features → dedicated services (teleconsultation, messaging, delivery tracking) can scale independently
- Swiss healthcare integrations → separate integration services isolate external dependencies and simplify failure handling

## Complexity Tracking

**No constitutional violations requiring justification.**

The multi-platform architecture with microservices and 5 separate mobile apps is justified by:
1. **Constitutional Principle IV (Multi-Tenant Isolation)**: Each user role requires distinct data boundaries and permissions
2. **Regulatory Compliance**: Separating services simplifies compliance auditing and reduces blast radius of security incidents
3. **Scalability**: Independent scaling of high-load services (prescription OCR, GPS tracking)
4. **Development Velocity**: Teams can work on different services/apps in parallel without conflicts

**Complexity Accepted**:
- 5 mobile apps + 1 web app + 10 microservices = significant deployment complexity
- Justified by: Security isolation, regulatory compliance, UX optimization per role
- Mitigation: Shared component libraries, unified CI/CD pipeline, containerized deployment

## Phase 0 Artifacts

**Next Command**: Generate `research.md` to resolve NEEDS CLARIFICATION items in Technical Context.

### Research Topics Required

1. **Video Infrastructure Selection** (Twilio vs. Agora vs. custom WebRTC)
   - HIPAA compliance certification
   - End-to-end encryption support
   - Pricing model for 10,000+ consultations/month
   - Recording capabilities with consent management
   - Audio-only fallback implementation

2. **Messaging Integration Strategy** (WhatsApp Business API integration)
   - Twilio vs. direct Facebook/Meta integration
   - HIPAA compliance for WhatsApp Business
   - Message encryption and audit trail requirements
   - Pricing model for multi-channel messaging

3. **Message Queue Service** (RabbitMQ vs. AWS SQS vs. Azure Service Bus)
   - Guaranteed delivery for prescription/delivery workflows
   - Dead letter queue handling for failed operations
   - Integration with audit trail service
   - Cost analysis for expected message volume

4. **Load Testing Tool** (k6 vs. Artillery vs. JMeter)
   - WebSocket support for real-time features
   - CI/CD integration for automated performance testing
   - Reporting and alerting capabilities

5. **Swiss HIN e-ID Integration**
   - Authentication flow (OAuth2/SAML)
   - Test environment availability
   - User provisioning process
   - Certificate management

6. **Swiss Cantonal e-santé API Integration**
   - API specifications per canton (varies by region)
   - Authentication and authorization
   - Data format standards (FHIR, HL7)
   - Rate limits and quotas

7. **Insurance System Integration**
   - Swiss insurance provider APIs (common standards)
   - Real-time eligibility verification
   - Claims submission process
   - Error handling and retry strategies

8. **AI/ML Services Architecture**
   - Prescription OCR: AWS Textract vs. Azure Computer Vision vs. Google Cloud Vision
   - Drug interaction database: Commercial API vs. open-source database (RxNorm, etc.)
   - Route optimization: Google Maps vs. Mapbox vs. custom algorithm
   - Demand forecasting: AWS SageMaker vs. Azure ML vs. custom model

9. **Database Encryption Strategy**
   - Column-level encryption for PHI (PostgreSQL pgcrypto vs. application-level)
   - Key management (AWS KMS vs. Azure Key Vault vs. HashiCorp Vault)
   - Performance impact analysis
   - Audit trail for encryption key access

10. **Multi-Tenant Database Strategy**
    - Separate databases per pharmacy vs. schema-based isolation vs. row-level security
    - Data migration strategy for onboarding new pharmacies
    - Backup and disaster recovery per tenant

## Phase 1 Artifacts

**Next Command**: Generate `data-model.md`, `contracts/`, and `quickstart.md` after research.md is complete.

### Data Model (data-model.md)

Will include:
- Entity-relationship diagrams for all 14 key entities from spec
- Database schema with encryption annotations for PHI fields
- Audit trail event schema
- State machines for Prescription, Order, Delivery workflows
- RBAC permission matrix (5 roles × 112 functional requirements)
- Multi-tenant isolation strategy

### API Contracts (contracts/)

Will generate OpenAPI 3.0 specifications for:
- Authentication APIs (login, MFA, session management, HIN e-ID flow)
- Prescription APIs (upload, OCR, validation, approval, rejection, treatment plans)
- Teleconsultation APIs (booking, availability, session management, notes)
- Inventory APIs (QR scanning, stock updates, alerts, analytics)
- Delivery APIs (route optimization, GPS tracking, confirmation, failures)
- E-commerce APIs (catalog, search, cart, checkout, orders, subscriptions)
- Messaging APIs (inbox, send, channels, voice transcription)
- Medical Records APIs (patient data, e-santé sync, permissions, analytics)
- Analytics APIs (dashboards, reports, forecasts, KPIs)
- Integration APIs (HIN e-ID, e-santé, insurance, payments, WhatsApp)

### Quickstart Guide (quickstart.md)

Will include:
- Local development setup (Docker Compose for all services)
- Environment variable configuration
- Database setup and migrations
- Running backend services
- Running mobile apps (iOS Simulator, Android Emulator)
- Running web app
- Test data seeding (sample pharmacies, users, prescriptions)
- Testing workflows (prescription processing, delivery, teleconsultation)
- Deployment guide (staging, production)
- Troubleshooting common issues

## Implementation Roadmap

### MVP Phase (P1-P3): 6 months

**Deliverables**:
- P1: Prescription Processing & Validation (AI OCR, drug interaction checks, pharmacist approval)
- P2: Secure Teleconsultation (video calls, AI note-taking, prescription creation)
- P3: Real-Time Inventory Management (QR scanning, AI alerts, analytics)

**Target**: Single pharmacy pilot with ~50 staff, ~5,000 patients, ~100 prescriptions/day

### Phase 2 (P4-P6): 4 months

**Deliverables**:
- P4: Intelligent Delivery Management (GPS tracking, route optimization, signatures)
- P5: Patient E-Commerce (catalog, cart, checkout, subscriptions)
- P6: Unified Secure Messaging (multi-channel, end-to-end encryption)

**Target**: 3-5 pharmacies, ~10,000-25,000 patients, ~500 prescriptions/day

### Phase 3 (P7-P9): 4 months

**Deliverables**:
- P7: Patient Medical Records & Health Dashboard (e-santé sync, digital twin)
- P8: Doctor Prescription Creation (HIN e-ID, AI drug selection)
- P9: Nurse Medication Ordering (institutional workflows)

**Target**: 5-10 pharmacies, ~50,000 patients, ~1,000 prescriptions/day

### Phase 4 (P10-P11): 4 months

**Deliverables**:
- P10: Analytics & Business Intelligence (dashboards, forecasting, KPIs)
- P11: Golden MetaPharm VIP Program (premium tier, dedicated pharmacist)

**Target**: 10+ pharmacies, ~100,000 patients, enterprise features

**Total Timeline**: 18 months from MVP to full feature set

## Next Steps

1. **Execute Phase 0**: Run research tasks to resolve all NEEDS CLARIFICATION items in Technical Context
2. **Generate research.md**: Document research findings and technical decisions
3. **Execute Phase 1**: Generate data-model.md, contracts/, and quickstart.md
4. **Re-run Constitution Check**: Validate Phase 1 design artifacts against constitutional principles
5. **Proceed to /speckit.tasks**: Break down P1-P3 MVP into actionable implementation tasks

**Command to continue**: This plan document is complete. Next, Phase 0 research will be executed automatically to resolve technical unknowns.
