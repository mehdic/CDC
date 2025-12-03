# MetaPharm Connect - Phase 6: Remaining Specification Gaps

**Version:** 1.0.0
**Date:** 2025-12-03
**Target:** 100% CDC_Final.md Compliance (Final Gap Closure)
**Estimated Effort:** 9-12 weeks

---

## Overview

This task list addresses all remaining gaps identified after Phase 5 completion. These features complete the full MetaPharm Connect specification as defined in CDC_Final.md (v17.05.2025).

---

## Priority Legend

- **P0 - CRITICAL**: Must have for production launch / regulatory compliance
- **P1 - HIGH**: Required for complete MVP functionality
- **P2 - MEDIUM**: Important for full user experience
- **P3 - LOW**: Nice to have, can be post-launch

---

# SECTION A: PRODUCTION INFRASTRUCTURE (P0)

## A1. Kubernetes Production Deployment

> **Spec Reference:** Production-grade infrastructure requirement for Swiss healthcare platform

### T6-001: Kubernetes Deployment Manifests for All Services
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Create Kubernetes deployment manifests for all 30 backend services
- Configure resource limits and requests per service
- Set up liveness and readiness probes
- Configure environment-specific configurations
- Implement pod disruption budgets for high availability

**Technical Details:**
- Create `infrastructure/kubernetes/` directory structure
- Create deployment YAML for each service following pattern:
  ```
  infrastructure/kubernetes/
  ├── base/
  │   ├── namespace.yaml
  │   ├── network-policies.yaml
  │   └── resource-quotas.yaml
  ├── services/
  │   ├── auth-service/
  │   │   ├── deployment.yaml
  │   │   ├── service.yaml
  │   │   ├── hpa.yaml
  │   │   └── configmap.yaml
  │   ├── prescription-service/
  │   ├── ... (all 30 services)
  ├── databases/
  │   ├── postgresql/
  │   ├── redis/
  │   └── mongodb/
  └── ingress/
      ├── ingress.yaml
      └── certificates.yaml
  ```

**Services to Deploy:**
1. api-gateway
2. auth-service
3. user-service
4. pharmacy-service
5. prescription-service
6. order-service
7. delivery-service
8. messaging-service
9. notification-service
10. teleconsultation-service
11. appointment-service
12. inventory-service
13. payment-service
14. ecommerce-service
15. vip-service
16. marketing-service
17. analytics-service
18. voice-service
19. drug-interaction-service
20. esante-service
21. adherence-service
22. digital-twin-service
23. refill-service
24. nurse-service
25. doctor-service
26. medical-records-service
27. insurance-service
28. controlled-substance-service
29. calendar-service
30. recycling-service

**Deployment Configuration Per Service:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE_NAME}
  namespace: metapharm
  labels:
    app: ${SERVICE_NAME}
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${SERVICE_NAME}
  template:
    metadata:
      labels:
        app: ${SERVICE_NAME}
    spec:
      containers:
      - name: ${SERVICE_NAME}
        image: metapharm/${SERVICE_NAME}:${VERSION}
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        envFrom:
        - configMapRef:
            name: ${SERVICE_NAME}-config
        - secretRef:
            name: ${SERVICE_NAME}-secrets
```

**Acceptance Criteria:**
- [ ] All 30 services have deployment manifests
- [ ] Resource limits set appropriately per service type
- [ ] Health checks configured for all services
- [ ] Namespace isolation configured
- [ ] Network policies restrict inter-service communication

---

### T6-002: Horizontal Pod Autoscaler Configuration
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T6-001
- **Estimated:** 2 days

**Functional Requirements:**
- Configure HPA for all customer-facing services
- Scale based on CPU and memory metrics
- Scale based on custom metrics (requests per second)
- Set minimum and maximum replica counts
- Configure scale-down stabilization

**Technical Details:**
- Create HPA for high-traffic services:
  - api-gateway: 3-10 replicas
  - auth-service: 2-8 replicas
  - prescription-service: 2-6 replicas
  - order-service: 2-6 replicas
  - delivery-service: 2-8 replicas
  - messaging-service: 2-6 replicas

**HPA Configuration Example:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: metapharm
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

**Acceptance Criteria:**
- [ ] HPA configured for all public-facing services
- [ ] Custom metrics adapter installed (if using custom metrics)
- [ ] Scale-down behavior prevents thrashing
- [ ] Load testing validates autoscaling behavior
- [ ] Alerts configured for scaling events

---

### T6-003: Kubernetes Secrets and ConfigMap Management
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T6-001
- **Estimated:** 3 days

**Functional Requirements:**
- Externalize all configuration from container images
- Secure storage of sensitive credentials
- Environment-specific configuration (dev/staging/prod)
- Automatic secret rotation support
- Integration with external secret managers (Vault)

**Technical Details:**
- Create ConfigMaps for non-sensitive configuration:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: prescription-service-config
    namespace: metapharm
  data:
    NODE_ENV: "production"
    LOG_LEVEL: "info"
    DRUG_DB_API_URL: "https://api.documedis.ch/v1"
    OCR_CONFIDENCE_THRESHOLD: "0.85"
    MAX_PRESCRIPTION_AGE_DAYS: "365"
  ```

- Create Secrets for sensitive data:
  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: prescription-service-secrets
    namespace: metapharm
  type: Opaque
  stringData:
    DB_PASSWORD: ${DB_PASSWORD}
    JWT_SECRET: ${JWT_SECRET}
    DRUG_DB_API_KEY: ${DRUG_DB_API_KEY}
    ENCRYPTION_KEY: ${ENCRYPTION_KEY}
  ```

- Implement External Secrets Operator for Vault integration

**Secrets Categories:**
1. **Database Credentials**: PostgreSQL, MongoDB, Redis passwords
2. **API Keys**: HIN, Documedis, Swiss Post, Twilio, SendGrid
3. **JWT/Encryption**: Service-to-service auth, data encryption
4. **OAuth Credentials**: Google Calendar, Apple CalDAV
5. **Cloud Provider**: Azure Speech, AWS S3

**Acceptance Criteria:**
- [ ] All sensitive data in Secrets, not ConfigMaps
- [ ] Secrets encrypted at rest in etcd
- [ ] External Secrets Operator configured (optional)
- [ ] Secret rotation procedure documented
- [ ] No secrets in container images or logs

---

### T6-004: Ingress Controller with TLS
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T6-001
- **Estimated:** 2 days

**Functional Requirements:**
- Configure NGINX Ingress Controller
- TLS termination with Let's Encrypt certificates
- Path-based routing to services
- Rate limiting per client
- Web Application Firewall (WAF) rules

**Technical Details:**
- Install cert-manager for automatic certificate management
- Configure Ingress resources:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: metapharm-ingress
  namespace: metapharm
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - api.metapharm.ch
    - app.metapharm.ch
    secretName: metapharm-tls
  rules:
  - host: api.metapharm.ch
    http:
      paths:
      - path: /auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3000
      - path: /prescriptions
        pathType: Prefix
        backend:
          service:
            name: prescription-service
            port:
              number: 3000
      - path: /orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 3000
      # ... additional routes
```

**Routing Configuration:**
| Path | Service | Rate Limit |
|------|---------|------------|
| /auth/* | auth-service | 50/min |
| /prescriptions/* | prescription-service | 100/min |
| /orders/* | order-service | 100/min |
| /deliveries/* | delivery-service | 200/min |
| /messages/* | messaging-service | 500/min |
| /teleconsult/* | teleconsultation-service | 50/min |
| /analytics/* | analytics-service | 30/min |

**Acceptance Criteria:**
- [ ] TLS certificates auto-renewed
- [ ] All traffic HTTPS-only
- [ ] Rate limiting prevents abuse
- [ ] Health check endpoints excluded from rate limits
- [ ] WAF rules block common attacks

---

### T6-005: Helm Charts for Environment Management
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** T6-001, T6-002, T6-003, T6-004
- **Estimated:** 4 days

**Functional Requirements:**
- Package all Kubernetes resources as Helm charts
- Support multiple environments (dev, staging, prod)
- Parameterize environment-specific values
- Version control chart releases
- Support rollback capabilities

**Technical Details:**
- Create Helm chart structure:
  ```
  infrastructure/helm/
  ├── charts/
  │   └── metapharm/
  │       ├── Chart.yaml
  │       ├── values.yaml
  │       ├── values-dev.yaml
  │       ├── values-staging.yaml
  │       ├── values-prod.yaml
  │       └── templates/
  │           ├── _helpers.tpl
  │           ├── deployments/
  │           ├── services/
  │           ├── hpa/
  │           ├── configmaps/
  │           ├── secrets/
  │           └── ingress/
  └── helmfile.yaml
  ```

**Values Configuration:**
```yaml
# values-prod.yaml
global:
  environment: production
  domain: metapharm.ch
  imageTag: v1.0.0

replicaCount:
  apiGateway: 3
  authService: 2
  prescriptionService: 2

resources:
  apiGateway:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPU: 70

database:
  postgresql:
    host: metapharm-db.postgres.database.azure.com
    port: 5432
    sslMode: require
```

**Acceptance Criteria:**
- [ ] Single command deploys entire stack
- [ ] Environment values clearly separated
- [ ] Helm release versioning enabled
- [ ] Rollback tested and documented
- [ ] CI/CD integration with Helm

---

### T6-006: CI/CD Pipeline for Kubernetes Deployment
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T6-005
- **Estimated:** 3 days

**Functional Requirements:**
- Automated build and push of container images
- Automated deployment to staging on PR merge
- Manual approval for production deployment
- Automated rollback on health check failure
- Slack/Teams notifications for deployment status

**Technical Details:**
- Create GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, prescription-service, order-service, ...]
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend/services/${{ matrix.service }}
          push: true
          tags: |
            ghcr.io/metapharm/${{ matrix.service }}:${{ github.sha }}
            ghcr.io/metapharm/${{ matrix.service }}:latest

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          helm upgrade --install metapharm ./infrastructure/helm/charts/metapharm \
            -f ./infrastructure/helm/charts/metapharm/values-staging.yaml \
            --set global.imageTag=${{ github.sha }} \
            --namespace metapharm-staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.event.inputs.environment == 'production'
    steps:
      - name: Deploy to production
        run: |
          helm upgrade --install metapharm ./infrastructure/helm/charts/metapharm \
            -f ./infrastructure/helm/charts/metapharm/values-prod.yaml \
            --set global.imageTag=${{ github.sha }} \
            --namespace metapharm-prod
```

**Acceptance Criteria:**
- [ ] Automated builds on every commit
- [ ] Staging auto-deploys on main merge
- [ ] Production requires manual approval
- [ ] Deployment notifications sent
- [ ] Rollback procedure automated

---

# SECTION B: REGULATORY COMPLIANCE (P0)

## B1. Controlled Substance Delivery Verification

> **Spec Reference:** "Pour stupéfiants/produits au froid : signature et pièce d'identité"

### T6-007: Driver ID Verification System
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Verify patient identity before controlled substance handover
- Capture photo ID scan (Swiss ID, passport, driver's license)
- Perform OCR on ID to extract name and DOB
- Match ID data against patient record
- Require digital signature on delivery confirmation
- Store verification evidence for audit trail
- Support witness requirement for certain substances

**Technical Details:**
- Update `backend/services/controlled-substance-service/`
- Create `backend/services/controlled-substance-service/src/services/id-verification.service.ts`
- Integrate with ID verification provider (Onfido, Jumio, or similar)

**Code Structure:**
```typescript
// id-verification.service.ts
interface IDVerificationRequest {
  deliveryId: string;
  patientId: string;
  driverId: string;
  idType: 'swiss_id' | 'passport' | 'drivers_license';
  idFrontImage: Buffer;
  idBackImage?: Buffer;
  selfieImage: Buffer;
  location: GeoLocation;
  timestamp: Date;
}

interface IDVerificationResult {
  verified: boolean;
  confidence: number;
  extractedData: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    documentNumber: string;
    expiryDate: Date;
    nationality: string;
  };
  matchResult: {
    nameMatch: boolean;
    dobMatch: boolean;
    facialMatch: boolean;
    documentAuthenticity: 'genuine' | 'suspected_fraud' | 'unable_to_verify';
  };
  verificationId: string;
  evidenceUrls: {
    idFront: string;
    idBack?: string;
    selfie: string;
    signatureCapture: string;
  };
}

interface ControlledSubstanceDelivery {
  deliveryId: string;
  prescriptionId: string;
  substances: ControlledSubstance[];
  patient: PatientInfo;
  verificationRequired: boolean;
  witnessRequired: boolean;
  verificationResult?: IDVerificationResult;
  signature: DigitalSignature;
  witness?: WitnessInfo;
  chainOfCustody: CustodyEvent[];
}

interface DigitalSignature {
  signatureImage: Buffer;
  signedAt: Date;
  signedBy: string;
  deviceInfo: DeviceInfo;
  location: GeoLocation;
  hash: string;  // SHA-256 of delivery details + signature
}
```

**API Endpoints:**
- `POST /api/controlled/delivery/:id/verify-id` - Submit ID for verification
- `POST /api/controlled/delivery/:id/capture-signature` - Capture digital signature
- `POST /api/controlled/delivery/:id/add-witness` - Add witness information
- `GET /api/controlled/delivery/:id/verification-status` - Check verification status
- `GET /api/controlled/audit/:deliveryId` - Get audit trail for delivery

**Driver App UI Flow:**
1. Driver arrives at delivery location
2. App prompts: "Controlled substance delivery - ID verification required"
3. Driver scans front of patient ID
4. Driver scans back of patient ID (if applicable)
5. Driver captures patient selfie for facial match
6. System performs verification (< 10 seconds)
7. If verified: Patient signs on screen
8. If witness required: Witness signs on screen
9. Delivery confirmed with full audit trail

**Swissmedic Compliance:**
- Maintain records for minimum 10 years
- Include: substance name, quantity, patient ID, date/time, driver ID
- Support regulatory reporting exports
- Alert pharmacist of any verification failures

**Acceptance Criteria:**
- [ ] ID OCR extracts data accurately (>95%)
- [ ] Facial match confidence >90%
- [ ] Name/DOB matching works with variations
- [ ] Digital signature legally binding (ZertES compliant)
- [ ] Audit trail immutable and complete
- [ ] Offline capability with sync on reconnect
- [ ] Verification completes in <15 seconds

---

### T6-008: Chain of Custody Tracking
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T6-007
- **Estimated:** 3 days

**Functional Requirements:**
- Track controlled substances from pharmacy to patient
- Record every handoff with timestamp and personnel
- QR code scan at each custody transfer
- Tamper-evident packaging verification
- Alert on any chain breaks or delays
- Generate regulatory compliance reports

**Technical Details:**
- Update `backend/services/controlled-substance-service/src/services/custody.service.ts`

**Code Structure:**
```typescript
// custody.service.ts
interface CustodyChain {
  substanceId: string;
  prescriptionId: string;
  events: CustodyEvent[];
  currentCustodian: Custodian;
  status: 'in_pharmacy' | 'with_driver' | 'delivered' | 'returned';
  tamperSeals: TamperSeal[];
}

interface CustodyEvent {
  eventId: string;
  eventType: 'prepared' | 'sealed' | 'handed_to_driver' | 'in_transit' |
             'arrived' | 'verified' | 'delivered' | 'returned' | 'incident';
  timestamp: Date;
  location: GeoLocation;
  fromCustodian?: Custodian;
  toCustodian?: Custodian;
  qrCodeScanned: string;
  sealIntact: boolean;
  notes?: string;
  evidence?: {
    photoUrl?: string;
    signatureUrl?: string;
  };
}

interface Custodian {
  type: 'pharmacist' | 'driver' | 'patient' | 'witness';
  id: string;
  name: string;
  licenseNumber?: string;  // For pharmacists
  employeeId?: string;     // For drivers
}

interface TamperSeal {
  sealId: string;
  appliedAt: Date;
  appliedBy: Custodian;
  verifiedAt?: Date;
  verifiedBy?: Custodian;
  intact: boolean;
}
```

**API Endpoints:**
- `POST /api/controlled/custody/scan` - Record QR scan event
- `POST /api/controlled/custody/transfer` - Record custody transfer
- `POST /api/controlled/custody/verify-seal` - Verify tamper seal
- `GET /api/controlled/custody/:substanceId/chain` - Get full custody chain
- `POST /api/controlled/custody/incident` - Report custody incident

**Acceptance Criteria:**
- [ ] Every custody transfer logged with evidence
- [ ] QR codes unique per package
- [ ] Tamper seal verification required at delivery
- [ ] Incident reporting with immediate alerts
- [ ] Regulatory export in required formats
- [ ] GPS tracking throughout delivery

---

# SECTION C: PHARMACY BUSINESS FEATURES (P1)

## C1. Master Account & Sub-Account System

> **Spec Reference:** "Gestion du master account et des comptes associés"

### T6-009: Pharmacy Account Hierarchy Model
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 4 days

**Functional Requirements:**
- Master pharmacist account with full administrative control
- Sub-accounts for pharmacy employees (assistants, technicians, interns)
- Role-based permission system
- Activity logging per sub-account
- Account delegation and vacation coverage
- Multi-pharmacy management for chains

**Technical Details:**
- Update `backend/services/pharmacy-service/src/models/`
- Create `backend/services/pharmacy-service/src/models/PharmacyAccount.ts`
- Create `backend/services/pharmacy-service/src/models/AccountRole.ts`
- Update `backend/services/auth-service/` for hierarchy support

**Code Structure:**
```typescript
// PharmacyAccount.ts
interface PharmacyAccount {
  accountId: string;
  pharmacyId: string;
  accountType: 'master' | 'sub';
  userId: string;
  role: AccountRole;
  parentAccountId?: string;  // For sub-accounts
  permissions: Permission[];
  status: 'active' | 'suspended' | 'vacation' | 'terminated';
  createdAt: Date;
  createdBy: string;
  lastLogin?: Date;
  delegatedTo?: string;  // Account covering during vacation
  delegationExpiry?: Date;
}

interface AccountRole {
  roleId: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  pharmacyId: string;  // Custom roles per pharmacy
}

enum Permission {
  // Prescription Management
  PRESCRIPTION_VIEW = 'prescription:view',
  PRESCRIPTION_VALIDATE = 'prescription:validate',
  PRESCRIPTION_OVERRIDE = 'prescription:override',

  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_ORDER = 'inventory:order',

  // Controlled Substances
  CONTROLLED_VIEW = 'controlled:view',
  CONTROLLED_DISPENSE = 'controlled:dispense',
  CONTROLLED_AUDIT = 'controlled:audit',

  // Financial
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_REFUND = 'financial:refund',
  FINANCIAL_REPORTS = 'financial:reports',

  // Staff Management
  STAFF_VIEW = 'staff:view',
  STAFF_MANAGE = 'staff:manage',
  STAFF_PERMISSIONS = 'staff:permissions',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MODIFY = 'settings:modify',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',

  // Communication
  MESSAGES_VIEW = 'messages:view',
  MESSAGES_SEND = 'messages:send',
  MESSAGES_DELETE = 'messages:delete',

  // Teleconsultation
  TELECONSULT_CONDUCT = 'teleconsult:conduct',
  TELECONSULT_SCHEDULE = 'teleconsult:schedule',
}

interface AccountAuditLog {
  logId: string;
  accountId: string;
  action: string;
  targetResource: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

**Default Roles:**
```typescript
const DEFAULT_ROLES: AccountRole[] = [
  {
    name: 'Pharmacien Titulaire',
    description: 'Full administrative access',
    permissions: Object.values(Permission),  // All permissions
    isDefault: true,
  },
  {
    name: 'Pharmacien Adjoint',
    description: 'Full pharmacy operations, limited admin',
    permissions: [
      Permission.PRESCRIPTION_VIEW,
      Permission.PRESCRIPTION_VALIDATE,
      Permission.PRESCRIPTION_OVERRIDE,
      Permission.INVENTORY_VIEW,
      Permission.INVENTORY_UPDATE,
      Permission.CONTROLLED_VIEW,
      Permission.CONTROLLED_DISPENSE,
      Permission.MESSAGES_VIEW,
      Permission.MESSAGES_SEND,
      Permission.TELECONSULT_CONDUCT,
      Permission.TELECONSULT_SCHEDULE,
    ],
    isDefault: true,
  },
  {
    name: 'Assistant en Pharmacie',
    description: 'Day-to-day operations',
    permissions: [
      Permission.PRESCRIPTION_VIEW,
      Permission.INVENTORY_VIEW,
      Permission.INVENTORY_UPDATE,
      Permission.MESSAGES_VIEW,
      Permission.MESSAGES_SEND,
    ],
    isDefault: true,
  },
  {
    name: 'Stagiaire',
    description: 'View-only with supervised actions',
    permissions: [
      Permission.PRESCRIPTION_VIEW,
      Permission.INVENTORY_VIEW,
      Permission.MESSAGES_VIEW,
    ],
    isDefault: true,
  },
];
```

**API Endpoints:**
- `POST /api/pharmacy/:id/accounts` - Create sub-account
- `GET /api/pharmacy/:id/accounts` - List all accounts
- `PUT /api/pharmacy/:id/accounts/:accountId` - Update account
- `DELETE /api/pharmacy/:id/accounts/:accountId` - Deactivate account
- `POST /api/pharmacy/:id/accounts/:accountId/delegate` - Delegate to another user
- `GET /api/pharmacy/:id/accounts/:accountId/audit` - Get account activity log
- `POST /api/pharmacy/:id/roles` - Create custom role
- `GET /api/pharmacy/:id/roles` - List roles
- `PUT /api/pharmacy/:id/roles/:roleId` - Update role permissions

**Acceptance Criteria:**
- [ ] Master account can create unlimited sub-accounts
- [ ] Permissions enforced at API level
- [ ] Activity audit for all sub-accounts
- [ ] Delegation workflow with expiry
- [ ] Custom roles per pharmacy
- [ ] Account suspension immediate effect

---

### T6-010: Master Account Management UI
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T6-009
- **Estimated:** 3 days

**Functional Requirements:**
- Staff management dashboard for master account
- Add/edit/remove sub-accounts
- Assign and modify roles
- View activity logs per employee
- Configure delegation and coverage
- Bulk operations for staff management

**Technical Details:**
- Create `web/src/apps/pharmacist/features/staff/StaffManagement.tsx`
- Create `web/src/apps/pharmacist/features/staff/AccountForm.tsx`
- Create `web/src/apps/pharmacist/features/staff/RoleEditor.tsx`
- Create `web/src/apps/pharmacist/features/staff/ActivityLog.tsx`

**UI Components:**

**Staff Dashboard:**
- Table of all sub-accounts with status indicators
- Quick actions: Edit, Suspend, View Activity
- Filter by role, status, last active
- Add new staff member button

**Account Form:**
- User details (name, email, phone)
- Role assignment dropdown
- Custom permission overrides
- Status toggle
- Delegation settings

**Activity Log:**
- Timeline of account actions
- Filter by action type, date range
- Export to CSV/PDF
- Real-time updates

**Acceptance Criteria:**
- [ ] Master account only sees this section
- [ ] Staff list loads with pagination
- [ ] Role changes take effect immediately
- [ ] Activity log searchable and exportable
- [ ] Confirmation dialogs for destructive actions

---

## C2. Payment Collection by Drivers

> **Spec Reference:** "encaissement cash/carte" in driver workflow

### T6-011: Cash on Delivery (COD) System
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Support cash payment at delivery
- Support card payment at delivery (mobile terminal)
- Calculate exact change requirements
- Track cash collected per driver
- End-of-shift cash reconciliation
- Handle payment failures and partial payments

**Technical Details:**
- Update `backend/services/delivery-service/`
- Create `backend/services/delivery-service/src/services/cod.service.ts`
- Integrate with mobile payment terminal providers (SumUp, Square)
- Update `backend/services/payment-service/` for COD support

**Code Structure:**
```typescript
// cod.service.ts
interface CODPayment {
  paymentId: string;
  orderId: string;
  deliveryId: string;
  driverId: string;
  amount: Money;
  paymentMethod: 'cash' | 'card_terminal';
  status: 'pending' | 'collected' | 'failed' | 'reconciled';
  collectedAt?: Date;
  collectedAmount?: Money;
  changeGiven?: Money;
  terminalTransactionId?: string;
  reconciliationId?: string;
  notes?: string;
}

interface Money {
  amount: number;
  currency: 'CHF';
}

interface DriverCashFloat {
  driverId: string;
  shiftId: string;
  startingFloat: Money;
  currentFloat: Money;
  totalCollected: Money;
  totalChangeGiven: Money;
  expectedFloat: Money;
  variance?: Money;
  status: 'active' | 'reconciled' | 'discrepancy';
}

interface CashReconciliation {
  reconciliationId: string;
  driverId: string;
  shiftId: string;
  shiftStart: Date;
  shiftEnd: Date;
  expectedCash: Money;
  actualCash: Money;
  variance: Money;
  varianceReason?: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'flagged';
}

interface CardTerminalPayment {
  transactionId: string;
  terminalId: string;
  provider: 'sumup' | 'square' | 'worldline';
  amount: Money;
  cardType: 'visa' | 'mastercard' | 'maestro' | 'postfinance';
  lastFourDigits: string;
  authCode: string;
  status: 'approved' | 'declined' | 'error';
  receiptUrl?: string;
}
```

**API Endpoints:**
- `POST /api/delivery/:id/payment/cash` - Record cash collection
- `POST /api/delivery/:id/payment/card` - Process card payment
- `GET /api/driver/:id/float` - Get current cash float
- `POST /api/driver/:id/shift/start` - Start shift with float
- `POST /api/driver/:id/shift/end` - End shift and reconcile
- `GET /api/driver/:id/reconciliation/:shiftId` - Get reconciliation details
- `PUT /api/driver/:id/reconciliation/:id/approve` - Approve reconciliation

**Driver App UI:**

**Payment Collection Screen:**
1. Display order total
2. Payment method selection (Cash / Card)
3. If Cash:
   - Amount tendered input
   - Change calculation display
   - Confirm collection button
4. If Card:
   - Connect to terminal prompt
   - "Processing..." indicator
   - Success/failure display with retry option

**End of Shift Screen:**
1. Summary of all deliveries
2. Expected cash calculation
3. Actual cash input
4. Variance display
5. Notes field for discrepancies
6. Submit reconciliation button

**Acceptance Criteria:**
- [ ] Cash collection with change calculation
- [ ] Card terminal integration (at least one provider)
- [ ] Real-time float tracking
- [ ] End-of-shift reconciliation workflow
- [ ] Discrepancy flagging and approval process
- [ ] Receipt generation for all payments

---

### T6-012: Mobile Card Terminal Integration
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T6-011
- **Estimated:** 3 days

**Functional Requirements:**
- Integrate with SumUp mobile card reader
- Support Visa, Mastercard, Maestro, PostFinance
- Contactless payment support
- Receipt via email/SMS
- Transaction history sync

**Technical Details:**
- Integrate SumUp SDK in driver mobile app
- Create `mobile/delivery-app/src/services/cardTerminal.service.ts`
- Handle Bluetooth pairing with card reader
- Implement payment flow with retry logic

**Code Structure:**
```typescript
// cardTerminal.service.ts
interface CardTerminalService {
  initialize(): Promise<void>;
  pair(terminalId: string): Promise<boolean>;
  checkConnection(): Promise<TerminalStatus>;
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  printReceipt(transactionId: string): Promise<void>;
  sendReceiptByEmail(transactionId: string, email: string): Promise<void>;
  sendReceiptBySMS(transactionId: string, phone: string): Promise<void>;
  getTransactionHistory(startDate: Date, endDate: Date): Promise<Transaction[]>;
}

interface PaymentRequest {
  amount: number;
  currency: 'CHF';
  reference: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  authCode?: string;
  cardType?: string;
  lastFourDigits?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface TerminalStatus {
  connected: boolean;
  batteryLevel: number;
  terminalId: string;
  lastSync: Date;
}
```

**Acceptance Criteria:**
- [ ] Bluetooth pairing with terminal
- [ ] All Swiss card types accepted
- [ ] Contactless (NFC) payments work
- [ ] Receipt options (email, SMS, print)
- [ ] Offline transaction queue with sync
- [ ] Transaction history accessible

---

## C3. Vaccination Appointment Management

> **Spec Reference:** "Gestion des RDV : physique (vaccination, consultations en officine)"

### T6-013: Vaccination Slot Management Service
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Define vaccination service offerings (flu, COVID, travel vaccines)
- Configure vaccination stations/rooms
- Manage vaccine inventory per type
- Schedule appointments with availability rules
- Track vaccination lot/batch numbers
- Generate vaccination certificates
- Support walk-ins with queue management

**Technical Details:**
- Create `backend/services/vaccination-service/` (new service)
- Integrate with `appointment-service` for scheduling
- Integrate with `inventory-service` for vaccine stock
- Create vaccination certificate template (Swiss standard)

**Code Structure:**
```typescript
// vaccination.service.ts
interface VaccinationService {
  serviceId: string;
  pharmacyId: string;
  vaccineName: string;
  vaccineType: 'flu' | 'covid' | 'travel' | 'other';
  manufacturer: string;
  dosesRequired: number;
  doseIntervalDays?: number;  // For multi-dose vaccines
  duration: number;  // Appointment duration in minutes
  price: Money;
  coveredByInsurance: boolean;
  availableFrom: Date;
  availableTo?: Date;
  eligibilityCriteria?: EligibilityCriteria;
  consentFormRequired: boolean;
  status: 'active' | 'paused' | 'discontinued';
}

interface VaccinationStation {
  stationId: string;
  pharmacyId: string;
  name: string;
  location: string;  // Room/area description
  capacity: number;  // Concurrent vaccinations
  equipment: string[];
  status: 'available' | 'occupied' | 'maintenance';
}

interface VaccinationSlot {
  slotId: string;
  pharmacyId: string;
  stationId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  pharmacistId: string;  // Vaccinator
  status: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show';
  appointmentId?: string;
  patientId?: string;
}

interface VaccinationAppointment {
  appointmentId: string;
  pharmacyId: string;
  patientId: string;
  serviceId: string;
  slotId: string;
  vaccineInventoryId: string;  // Reserved vaccine
  doseNumber: number;
  previousDoseDate?: Date;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  consentSigned: boolean;
  consentSignedAt?: Date;
  preScreeningComplete: boolean;
  preScreeningResults?: PreScreeningResult;
  administeredAt?: Date;
  administeredBy?: string;
  lotNumber?: string;
  expiryDate?: Date;
  injectionSite?: string;
  adverseReaction?: string;
  certificateId?: string;
}

interface VaccineInventory {
  inventoryId: string;
  pharmacyId: string;
  vaccineName: string;
  manufacturer: string;
  lotNumber: string;
  expiryDate: Date;
  quantity: number;
  reserved: number;
  storageRequirements: 'room_temp' | 'refrigerated' | 'frozen' | 'ultra_cold';
  currentTemperature?: number;
  temperatureAlerts: TemperatureAlert[];
}

interface VaccinationCertificate {
  certificateId: string;
  patientId: string;
  patientName: string;
  dateOfBirth: Date;
  vaccineName: string;
  manufacturer: string;
  lotNumber: string;
  doseNumber: number;
  totalDoses: number;
  administrationDate: Date;
  pharmacyName: string;
  pharmacistName: string;
  pharmacistLicense: string;
  qrCode: string;  // Swiss COVID certificate compatible
  verificationUrl: string;
}

interface PreScreeningResult {
  allergies: string[];
  previousReactions: boolean;
  currentMedications: string[];
  pregnant: boolean;
  immunocompromised: boolean;
  clearForVaccination: boolean;
  notes?: string;
  screenedBy: string;
  screenedAt: Date;
}
```

**API Endpoints:**
- `POST /api/vaccination/services` - Create vaccination service offering
- `GET /api/vaccination/services` - List available vaccinations
- `POST /api/vaccination/stations` - Configure vaccination station
- `POST /api/vaccination/slots/generate` - Generate available slots
- `GET /api/vaccination/slots/available` - Get available slots
- `POST /api/vaccination/appointments` - Book vaccination
- `POST /api/vaccination/appointments/:id/checkin` - Patient check-in
- `POST /api/vaccination/appointments/:id/consent` - Record consent
- `POST /api/vaccination/appointments/:id/screen` - Pre-screening
- `POST /api/vaccination/appointments/:id/administer` - Record administration
- `GET /api/vaccination/appointments/:id/certificate` - Get certificate
- `POST /api/vaccination/walkin` - Register walk-in patient

**Acceptance Criteria:**
- [ ] Multiple vaccination types configurable
- [ ] Station/room management with capacity
- [ ] Slot generation with pharmacist assignment
- [ ] Pre-screening questionnaire flow
- [ ] Consent capture with timestamp
- [ ] Lot/batch tracking per administration
- [ ] Certificate generation (Swiss compatible)
- [ ] Walk-in queue management
- [ ] Integration with inventory for stock

---

### T6-014: Vaccination Booking UI (Patient App)
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T6-013
- **Estimated:** 3 days

**Functional Requirements:**
- Browse available vaccination services
- View pharmacy locations offering vaccines
- Select date/time from available slots
- Complete pre-screening questionnaire
- Sign consent form digitally
- Receive confirmation and reminders
- Access vaccination certificate after completion

**Technical Details:**
- Create `mobile/patient-app/src/screens/VaccinationBooking/`
- Create `web/src/apps/patient/features/vaccination/`
- Integrate with calendar for reminders
- Generate PDF certificate download

**UI Screens:**

1. **Vaccination Services List:**
   - Available vaccines with descriptions
   - Pricing and insurance coverage info
   - Eligibility requirements
   - Select to proceed

2. **Pharmacy Selection:**
   - Map view of pharmacies offering service
   - Distance and availability indicators
   - Select pharmacy

3. **Slot Selection:**
   - Calendar view with available dates
   - Time slots for selected date
   - Pharmacist name (optional)

4. **Pre-Screening:**
   - Medical questionnaire
   - Allergy declaration
   - Current medications
   - Pregnancy status
   - Submit and await clearance

5. **Consent Form:**
   - Information about vaccine
   - Potential side effects
   - Digital signature capture
   - Checkbox confirmations

6. **Confirmation:**
   - Appointment summary
   - Add to calendar button
   - Directions to pharmacy
   - Reminder preferences

7. **Post-Vaccination:**
   - Thank you screen
   - Download certificate button
   - Report side effects link
   - Schedule next dose (if applicable)

**Acceptance Criteria:**
- [ ] Vaccine types displayed with info
- [ ] Slot selection with real-time availability
- [ ] Pre-screening validates before booking
- [ ] Digital consent legally compliant
- [ ] Calendar integration works
- [ ] Certificate downloadable as PDF
- [ ] Multi-dose scheduling supported

---

### T6-015: Vaccination Administration UI (Pharmacist App)
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T6-013
- **Estimated:** 3 days

**Functional Requirements:**
- View day's vaccination appointments
- Check-in patients
- Review pre-screening results
- Scan vaccine QR code for lot tracking
- Record administration details
- Handle adverse reactions
- Generate and issue certificates

**Technical Details:**
- Create `web/src/apps/pharmacist/features/vaccination/VaccinationDashboard.tsx`
- Create `web/src/apps/pharmacist/features/vaccination/AdministrationForm.tsx`
- Integrate with barcode scanner for vaccine lot

**UI Components:**

**Daily Dashboard:**
- Today's appointments list
- Walk-in queue
- Station status overview
- Vaccine inventory levels
- Quick check-in button

**Administration Form:**
- Patient details display
- Pre-screening review
- Vaccine selection with lot scan
- Injection site selection (diagram)
- Administration timestamp
- Observation timer start
- Adverse reaction notes
- Complete and generate certificate

**Acceptance Criteria:**
- [ ] Day view of all appointments
- [ ] Quick check-in workflow
- [ ] Lot scanning mandatory
- [ ] Observation period tracking
- [ ] Adverse reaction recording
- [ ] Certificate immediate generation
- [ ] Walk-in registration fast path

---

# SECTION D: PATIENT FEATURES (P2)

## D1. Recurring Orders / Subscription System

> **Spec Reference:** "renouvellement automatique selon posologie"

### T6-016: Subscription Service Implementation
- **Priority:** P2
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Create recurring medication orders
- Multiple frequency options (weekly, monthly, custom)
- Auto-payment processing
- Auto-renewal before stockout
- Subscription pause/resume
- Delivery schedule preferences
- Discount tiers for subscribers
- Skip/modify next delivery

**Technical Details:**
- Create `backend/services/subscription-service/` (new service)
- Integrate with `order-service` for order creation
- Integrate with `payment-service` for recurring billing
- Integrate with `refill-service` for prescription validation

**Code Structure:**
```typescript
// subscription.service.ts
interface Subscription {
  subscriptionId: string;
  patientId: string;
  pharmacyId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  items: SubscriptionItem[];
  frequency: SubscriptionFrequency;
  paymentMethod: PaymentMethod;
  deliveryPreferences: DeliveryPreferences;
  discountTier: DiscountTier;
  nextDeliveryDate: Date;
  lastDeliveryDate?: Date;
  createdAt: Date;
  pausedAt?: Date;
  pauseReason?: string;
  resumeDate?: Date;
  cancellationDate?: Date;
  cancellationReason?: string;
}

interface SubscriptionItem {
  itemId: string;
  productId: string;
  productName: string;
  prescriptionId?: string;  // If prescription required
  quantity: number;
  unitPrice: Money;
  discountedPrice: Money;
  autoRefillEnabled: boolean;
}

interface SubscriptionFrequency {
  type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  dayOfWeek?: number;  // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  customDays?: number; // For custom interval
}

interface DeliveryPreferences {
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  deliveryInstructions?: string;
  alternateAddress?: Address;
  leaveAtDoor: boolean;
  requireSignature: boolean;
}

interface DiscountTier {
  tierId: string;
  name: string;
  discountPercent: number;
  minimumSubscriptionMonths: number;
  freeDelivery: boolean;
}

interface SubscriptionEvent {
  eventId: string;
  subscriptionId: string;
  eventType: 'created' | 'modified' | 'paused' | 'resumed' | 'cancelled' |
             'delivery_scheduled' | 'delivery_completed' | 'payment_processed' |
             'payment_failed' | 'item_added' | 'item_removed' | 'skip_requested';
  timestamp: Date;
  details: any;
  triggeredBy: 'patient' | 'system' | 'pharmacist';
}

// Discount tiers
const DISCOUNT_TIERS: DiscountTier[] = [
  { tierId: 'bronze', name: 'Bronze', discountPercent: 5, minimumSubscriptionMonths: 0, freeDelivery: false },
  { tierId: 'silver', name: 'Silver', discountPercent: 10, minimumSubscriptionMonths: 3, freeDelivery: false },
  { tierId: 'gold', name: 'Gold', discountPercent: 15, minimumSubscriptionMonths: 6, freeDelivery: true },
  { tierId: 'platinum', name: 'Platinum', discountPercent: 20, minimumSubscriptionMonths: 12, freeDelivery: true },
];
```

**API Endpoints:**
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - List patient subscriptions
- `GET /api/subscriptions/:id` - Get subscription details
- `PUT /api/subscriptions/:id` - Modify subscription
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/skip` - Skip next delivery
- `POST /api/subscriptions/:id/items` - Add item to subscription
- `DELETE /api/subscriptions/:id/items/:itemId` - Remove item
- `GET /api/subscriptions/:id/history` - Get delivery history
- `GET /api/subscriptions/:id/upcoming` - Get upcoming deliveries

**Automated Processes:**

1. **Prescription Validation Job:**
   - Run daily at 00:00
   - Check prescriptions expiring before next delivery
   - Notify patient and request renewal
   - Auto-pause if prescription expires

2. **Order Generation Job:**
   - Run daily at 06:00
   - Find subscriptions due in 3 days
   - Validate inventory availability
   - Create orders automatically
   - Process payments
   - Notify patient of upcoming delivery

3. **Tier Upgrade Check:**
   - Run monthly
   - Calculate subscription tenure
   - Upgrade discount tier if eligible
   - Notify patient of upgrade

**Acceptance Criteria:**
- [ ] Multiple frequency options work
- [ ] Auto-order creation before due date
- [ ] Payment auto-processing
- [ ] Pause/resume functionality
- [ ] Skip next delivery option
- [ ] Discount tiers apply correctly
- [ ] Prescription validation before renewal
- [ ] Notification for payment failures

---

### T6-017: Subscription Management UI
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** T6-016
- **Estimated:** 3 days

**Functional Requirements:**
- Create new subscription from order
- View active subscriptions
- Modify subscription items
- Change delivery frequency
- Update payment method
- Pause/resume/cancel subscription
- Skip upcoming deliveries
- View delivery history

**Technical Details:**
- Create `mobile/patient-app/src/screens/Subscriptions/`
- Create `web/src/apps/patient/features/subscriptions/`
- Create subscription conversion flow from checkout

**UI Screens:**

1. **Subscription List:**
   - Active subscriptions with next delivery date
   - Paused subscriptions with resume option
   - Past subscriptions (cancelled)
   - Create new subscription CTA

2. **Subscription Details:**
   - Items in subscription
   - Current frequency and next delivery
   - Discount tier and savings
   - Payment method
   - Delivery address
   - Action buttons (Skip, Pause, Modify, Cancel)

3. **Create Subscription:**
   - Convert from recent order
   - Or build from scratch
   - Select items
   - Choose frequency
   - Set delivery preferences
   - Review savings
   - Confirm and start

4. **Modify Subscription:**
   - Add/remove items
   - Change quantities
   - Update frequency
   - Change delivery day
   - Preview next delivery

5. **Subscription History:**
   - Timeline of all deliveries
   - Order details per delivery
   - Payment receipts
   - Issues/notes

**Acceptance Criteria:**
- [ ] Easy subscription creation from checkout
- [ ] Clear display of savings
- [ ] Intuitive pause/resume
- [ ] Skip next delivery in 2 taps
- [ ] Modification preview before confirm
- [ ] Clear cancellation flow with retention offer

---

## D2. Enhanced Reviews & Ratings System

> **Spec Reference:** "Reviews produits et services : évaluations, stats (achats/efficacité ressentie), commentaires"

### T6-018: Service Reviews Implementation
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 4 days

**Functional Requirements:**
- Rate teleconsultation experience
- Rate delivery experience
- Rate pharmacy service
- Detailed satisfaction questionnaire
- Report perceived medication effectiveness
- Track and report side effects
- Aggregate statistics for products
- Display reviews on product pages

**Technical Details:**
- Expand `backend/services/ecommerce-service/src/services/reviewService.ts`
- Create service review models
- Create medication effectiveness tracking
- Create side effects reporting system

**Code Structure:**
```typescript
// review.service.ts (expanded)
interface ProductReview {
  reviewId: string;
  productId: string;
  patientId: string;
  orderId: string;
  rating: number;  // 1-5
  title?: string;
  comment?: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend: boolean;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  pharmacyResponse?: PharmacyResponse;
}

interface ServiceReview {
  reviewId: string;
  serviceType: 'teleconsultation' | 'delivery' | 'pharmacy_visit' | 'vaccination';
  referenceId: string;  // Appointment ID, Delivery ID, etc.
  patientId: string;
  pharmacyId: string;
  providerId?: string;  // Pharmacist or driver ID
  overallRating: number;  // 1-5
  aspects: ServiceAspectRating[];
  comment?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface ServiceAspectRating {
  aspect: string;  // 'punctuality', 'professionalism', 'communication', etc.
  rating: number;  // 1-5
}

interface TeleconsultationReview extends ServiceReview {
  serviceType: 'teleconsultation';
  aspects: [
    { aspect: 'wait_time', rating: number },
    { aspect: 'video_quality', rating: number },
    { aspect: 'pharmacist_knowledge', rating: number },
    { aspect: 'explanation_clarity', rating: number },
    { aspect: 'overall_helpfulness', rating: number },
  ];
  wouldRecommend: boolean;
  issueResolved: boolean;
}

interface DeliveryReview extends ServiceReview {
  serviceType: 'delivery';
  aspects: [
    { aspect: 'delivery_speed', rating: number },
    { aspect: 'driver_courtesy', rating: number },
    { aspect: 'package_condition', rating: number },
    { aspect: 'timing_accuracy', rating: number },
    { aspect: 'communication', rating: number },
  ];
  deliveredOnTime: boolean;
  packageCondition: 'perfect' | 'minor_damage' | 'damaged';
}

interface MedicationEffectivenessReport {
  reportId: string;
  productId: string;
  patientId: string;
  prescriptionId?: string;
  conditionTreated: string;
  effectivenessRating: number;  // 1-5
  timeToEffect: 'immediate' | 'hours' | 'days' | 'weeks' | 'no_effect';
  sideEffectsExperienced: boolean;
  sideEffects?: SideEffectReport[];
  wouldUseAgain: boolean;
  notes?: string;
  reportDate: Date;
  durationOfUse: string;
}

interface SideEffectReport {
  reportId: string;
  productId: string;
  patientId: string;
  sideEffect: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: 'immediate' | 'within_hours' | 'within_days' | 'within_weeks';
  duration: string;
  actionTaken: 'none' | 'reduced_dose' | 'stopped_medication' | 'sought_medical_help';
  outcome: 'resolved' | 'ongoing' | 'unknown';
  reportedToDoctor: boolean;
  reportDate: Date;
}

interface ProductStatistics {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };  // 1-5 counts
  recommendationRate: number;
  averageEffectiveness: number;
  commonSideEffects: { effect: string; count: number; percentage: number }[];
  recentReviews: ProductReview[];
}
```

**API Endpoints:**

**Product Reviews:**
- `POST /api/reviews/product` - Submit product review
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/products/:id/statistics` - Get product statistics
- `POST /api/reviews/:reviewId/helpful` - Mark review as helpful

**Service Reviews:**
- `POST /api/reviews/teleconsultation` - Review teleconsultation
- `POST /api/reviews/delivery` - Review delivery
- `POST /api/reviews/pharmacy` - Review pharmacy visit
- `GET /api/reviews/service/:referenceId` - Get service review

**Medication Tracking:**
- `POST /api/medication/effectiveness` - Report effectiveness
- `POST /api/medication/side-effects` - Report side effect
- `GET /api/medication/:productId/reports` - Get medication reports

**Acceptance Criteria:**
- [ ] Product reviews with star ratings
- [ ] Service-specific review forms
- [ ] Effectiveness tracking for medications
- [ ] Side effect reporting
- [ ] Aggregated statistics on product pages
- [ ] Helpful/unhelpful voting
- [ ] Pharmacy response capability

---

### T6-019: Review Collection UI & Prompts
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** T6-018
- **Estimated:** 2 days

**Functional Requirements:**
- Prompt for review after order delivery
- Prompt for review after teleconsultation
- Prompt for medication effectiveness (after X days)
- In-app review forms
- Optional detailed questionnaires
- Photo attachment for reviews
- Thank you rewards (VIP points)

**Technical Details:**
- Create review prompts in patient app
- Trigger prompts based on events
- Create review forms for each service type
- Integrate with VIP points for rewards

**Review Triggers:**

1. **Product Review:**
   - 3 days after delivery confirmation
   - Push notification + in-app prompt
   - Reminder after 7 days if not reviewed

2. **Delivery Review:**
   - Immediately after delivery confirmation
   - In-app modal
   - Optional detailed feedback

3. **Teleconsultation Review:**
   - 5 minutes after call ends
   - In-app modal
   - Quick 1-5 star + optional comment

4. **Medication Effectiveness:**
   - 14 days after first use (for chronic medications)
   - Weekly check-in prompts
   - Track over time

**VIP Points Rewards:**
- Product review: 50 points
- Detailed review (with photo): 100 points
- Service review: 30 points
- Medication tracking: 20 points per report

**Acceptance Criteria:**
- [ ] Review prompts at appropriate times
- [ ] Quick review option (stars only)
- [ ] Detailed review option
- [ ] Photo attachment works
- [ ] VIP points awarded
- [ ] Review rate increases

---

## D3. Loyalty Gamification Enhancement

> **Spec Reference:** "Scoring utilisateur et offres personnalisées", "bonus par objectifs santé atteints"

### T6-020: Health Achievement System
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 4 days

**Functional Requirements:**
- Health goal setting with patient
- Achievement badges for health milestones
- Streak tracking for medication adherence
- Point multipliers for streaks
- Social features (anonymized comparisons)
- Challenges and campaigns
- Leaderboards (opt-in)

**Technical Details:**
- Update `backend/services/vip-service/`
- Create achievement system
- Create streak tracking
- Create challenge system

**Code Structure:**
```typescript
// achievement.service.ts
interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: 'adherence' | 'health' | 'engagement' | 'loyalty' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  iconUrl: string;
  pointsAwarded: number;
  criteria: AchievementCriteria;
  isSecret: boolean;  // Hidden until earned
}

interface AchievementCriteria {
  type: 'counter' | 'streak' | 'milestone' | 'challenge';
  metric: string;
  threshold: number;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all_time';
}

interface PatientAchievement {
  patientId: string;
  achievementId: string;
  earnedAt: Date;
  progress: number;
  metadata?: any;
}

interface Streak {
  streakId: string;
  patientId: string;
  type: 'medication_adherence' | 'daily_login' | 'health_tracking';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  multiplier: number;  // Points multiplier for streak
}

interface HealthGoal {
  goalId: string;
  patientId: string;
  goalType: 'weight' | 'blood_pressure' | 'blood_sugar' | 'steps' | 'medication' | 'custom';
  targetValue: number;
  currentValue: number;
  startDate: Date;
  targetDate: Date;
  status: 'active' | 'achieved' | 'failed' | 'paused';
  checkIns: GoalCheckIn[];
}

interface GoalCheckIn {
  checkInId: string;
  goalId: string;
  value: number;
  date: Date;
  notes?: string;
}

interface Challenge {
  challengeId: string;
  name: string;
  description: string;
  type: 'individual' | 'community';
  criteria: AchievementCriteria;
  startDate: Date;
  endDate: Date;
  rewards: ChallengeReward[];
  participantCount: number;
  status: 'upcoming' | 'active' | 'completed';
}

interface ChallengeReward {
  position: number;  // 1, 2, 3 or 0 for participation
  points: number;
  badgeId?: string;
  discountCode?: string;
}
```

**Achievements Library:**

**Adherence Achievements:**
- 🥉 First Timer: Take medication on time for 1 day
- 🥈 Week Warrior: 7-day adherence streak
- 🥇 Monthly Master: 30-day adherence streak
- 🏆 Adherence Champion: 90-day perfect adherence

**Health Achievements:**
- 🥉 Goal Setter: Set your first health goal
- 🥈 Progress Maker: Reach 50% of a health goal
- 🥇 Goal Achiever: Complete a health goal
- 🏆 Health Hero: Complete 5 health goals

**Engagement Achievements:**
- 🥉 First Review: Write your first product review
- 🥈 Helpful Reviewer: Get 10 "helpful" votes on reviews
- 🥇 Community Voice: Write 20 reviews
- 🏆 Trusted Reviewer: Earn "Trusted Reviewer" badge

**Loyalty Achievements:**
- 🥉 New Member: Join MetaPharm
- 🥈 Regular Customer: Make 10 orders
- 🥇 VIP Status: Reach Gold VIP tier
- 🏆 Ultimate Member: Reach Platinum VIP tier

**API Endpoints:**
- `GET /api/achievements` - List all achievements
- `GET /api/patients/:id/achievements` - Get patient achievements
- `GET /api/patients/:id/streaks` - Get patient streaks
- `POST /api/patients/:id/goals` - Create health goal
- `GET /api/patients/:id/goals` - Get patient goals
- `POST /api/patients/:id/goals/:goalId/checkin` - Check-in on goal
- `GET /api/challenges` - List active challenges
- `POST /api/challenges/:id/join` - Join challenge
- `GET /api/challenges/:id/leaderboard` - Get leaderboard

**Acceptance Criteria:**
- [ ] Achievement earning triggers correctly
- [ ] Streak tracking accurate
- [ ] Point multipliers apply
- [ ] Health goals trackable
- [ ] Challenges engageable
- [ ] Leaderboard opt-in only
- [ ] Badge display on profile

---

### T6-021: Gamification UI Components
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** T6-020
- **Estimated:** 3 days

**Functional Requirements:**
- Achievement gallery with progress
- Streak visualization
- Health goal dashboard
- Challenge participation view
- Leaderboard display
- Celebration animations
- Progress notifications

**Technical Details:**
- Create `mobile/patient-app/src/screens/Achievements/`
- Create `web/src/apps/patient/features/gamification/`
- Create celebration animations
- Create progress visualizations

**UI Components:**

**Achievement Gallery:**
- Grid of badges (earned and locked)
- Filter by category
- Progress bars for in-progress
- Tap for achievement details
- Share button for earned badges

**Streak Dashboard:**
- Current streak count with fire icon
- Calendar view of streak
- Longest streak display
- Multiplier indicator
- Streak at risk warning

**Health Goals:**
- Active goals list
- Progress charts
- Check-in button
- Goal completion celebration
- Create new goal CTA

**Challenges:**
- Active challenges list
- Join button
- Progress tracker
- Leaderboard preview
- Time remaining countdown

**Celebration Animations:**
- Achievement earned pop-up
- Streak milestone confetti
- Goal achieved fireworks
- Level up animation

**Acceptance Criteria:**
- [ ] Badge gallery loads and filters
- [ ] Streak visualized clearly
- [ ] Goals with progress charts
- [ ] Challenge participation works
- [ ] Celebrations trigger correctly
- [ ] Social sharing works

---

# SECTION E: ADVANCED FEATURES (P3)

## E1. Cold Chain IoT Monitoring

> **Spec Reference:** "chaîne du froid" for temperature-sensitive deliveries

### T6-022: Temperature Sensor Integration
- **Priority:** P3
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Integrate with IoT temperature sensors
- Real-time temperature monitoring during delivery
- Alert on temperature excursion
- Temperature history log per delivery
- Automatic rejection if temperature breached
- Regulatory compliance reports

**Technical Details:**
- Integrate with temperature sensor providers (TempTraq, Sensitech)
- Create `backend/services/delivery-service/src/services/cold-chain.service.ts`
- Set up MQTT/WebSocket for real-time data
- Create alert system for excursions

**Code Structure:**
```typescript
// cold-chain.service.ts
interface TemperatureSensor {
  sensorId: string;
  deviceType: string;
  serialNumber: string;
  status: 'active' | 'inactive' | 'low_battery' | 'error';
  batteryLevel: number;
  lastReading?: TemperatureReading;
  calibrationDate: Date;
  assignedTo?: string;  // Delivery ID
}

interface TemperatureReading {
  readingId: string;
  sensorId: string;
  deliveryId?: string;
  temperature: number;  // Celsius
  humidity?: number;    // Percentage
  timestamp: Date;
  location?: GeoLocation;
  inRange: boolean;
}

interface ColdChainRequirement {
  requirementId: string;
  productCategory: string;
  minTemperature: number;
  maxTemperature: number;
  maxExcursionMinutes: number;
  requiresContinuousMonitoring: boolean;
}

interface TemperatureExcursion {
  excursionId: string;
  deliveryId: string;
  sensorId: string;
  startTime: Date;
  endTime?: Date;
  minTemperature: number;
  maxTemperature: number;
  averageTemperature: number;
  durationMinutes: number;
  severity: 'minor' | 'major' | 'critical';
  action: 'continue' | 'investigate' | 'reject';
  resolvedBy?: string;
  resolutionNotes?: string;
}

interface ColdChainDelivery {
  deliveryId: string;
  sensorId: string;
  requirement: ColdChainRequirement;
  startTime: Date;
  endTime?: Date;
  readings: TemperatureReading[];
  excursions: TemperatureExcursion[];
  status: 'monitoring' | 'delivered' | 'rejected' | 'compromised';
  complianceStatus: 'compliant' | 'minor_deviation' | 'non_compliant';
  certificateUrl?: string;
}
```

**API Endpoints:**
- `POST /api/cold-chain/sensors` - Register sensor
- `GET /api/cold-chain/sensors` - List sensors
- `POST /api/cold-chain/delivery/:id/start` - Start cold chain monitoring
- `POST /api/cold-chain/reading` - Record temperature reading
- `GET /api/cold-chain/delivery/:id/readings` - Get delivery readings
- `POST /api/cold-chain/delivery/:id/excursion` - Report excursion
- `GET /api/cold-chain/delivery/:id/certificate` - Get compliance certificate

**Acceptance Criteria:**
- [ ] Sensor pairing and registration
- [ ] Real-time temperature streaming
- [ ] Excursion detection and alerting
- [ ] Temperature history logging
- [ ] Compliance report generation
- [ ] Automatic rejection workflow

---

## E2. Birthday Auto-Bonus System

> **Spec Reference:** Part of VIP loyalty program

### T6-023: Birthday Bonus Automation
- **Priority:** P3
- **Complexity:** Low
- **Dependencies:** None
- **Estimated:** 2 days

**Functional Requirements:**
- Auto-detect patient birthdays
- Send birthday greeting
- Award bonus VIP points
- Special birthday discount code
- VIP tier bonus amplification
- Birthday month extended benefits

**Technical Details:**
- Create birthday detection job
- Update `backend/services/vip-service/` for birthday bonuses
- Create birthday notification templates
- Generate unique discount codes

**Code Structure:**
```typescript
// birthday.service.ts
interface BirthdayBonus {
  bonusId: string;
  patientId: string;
  year: number;
  bonusPoints: number;
  discountCode: string;
  discountPercent: number;
  validFrom: Date;
  validTo: Date;
  claimed: boolean;
  claimedAt?: Date;
}

const BIRTHDAY_BONUSES = {
  basic: { points: 100, discount: 10 },
  silver: { points: 200, discount: 15 },
  gold: { points: 500, discount: 20 },
  platinum: { points: 1000, discount: 25 },
};
```

**Automated Job:**
- Run daily at 00:00
- Find patients with birthday today
- Generate birthday bonus
- Send notification via push + email
- Log bonus in VIP history

**Acceptance Criteria:**
- [ ] Birthday detection accurate
- [ ] Bonus points awarded automatically
- [ ] Discount code unique per year
- [ ] Notification sent on birthday
- [ ] VIP tier multiplier applied
- [ ] Birthday discount valid for month

---

## E3. Referral Program

> **Spec Reference:** Part of loyalty and growth

### T6-024: Referral Program Implementation
- **Priority:** P3
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Generate unique referral codes
- Track referral conversions
- Award points to referrer and referee
- Tiered rewards for multiple referrals
- Social sharing integration
- Referral leaderboard

**Technical Details:**
- Update `backend/services/vip-service/` for referral tracking
- Create referral code generation
- Create referral dashboard

**Code Structure:**
```typescript
// referral.service.ts
interface ReferralCode {
  codeId: string;
  patientId: string;
  code: string;  // Unique 8-char code
  usageCount: number;
  maxUsage: number;  // Unlimited = -1
  status: 'active' | 'expired' | 'disabled';
  createdAt: Date;
  expiresAt?: Date;
}

interface Referral {
  referralId: string;
  referrerId: string;
  refereeId: string;
  codeUsed: string;
  status: 'pending' | 'completed' | 'rewarded';
  refereeSignupDate: Date;
  refereeFirstOrderDate?: Date;
  referrerReward?: ReferralReward;
  refereeReward?: ReferralReward;
}

interface ReferralReward {
  points: number;
  discountCode?: string;
  discountAmount?: Money;
  freeDeliveryCount?: number;
}

const REFERRAL_TIERS = [
  { referrals: 1, referrerPoints: 200, refereePoints: 100, refereeDiscount: 10 },
  { referrals: 5, referrerPoints: 500, refereePoints: 150, refereeDiscount: 15 },
  { referrals: 10, referrerPoints: 1000, refereePoints: 200, refereeDiscount: 20 },
  { referrals: 25, referrerPoints: 2500, refereePoints: 300, refereeDiscount: 25 },
];
```

**API Endpoints:**
- `GET /api/referral/code` - Get or generate referral code
- `POST /api/referral/apply` - Apply referral code at signup
- `GET /api/referral/stats` - Get referral statistics
- `GET /api/referral/history` - Get referral history
- `GET /api/referral/leaderboard` - Get referral leaderboard

**Acceptance Criteria:**
- [ ] Unique code generation
- [ ] Referral tracking accurate
- [ ] Both parties rewarded
- [ ] Tier rewards scale properly
- [ ] Social sharing works
- [ ] Leaderboard displays correctly

---

# SUMMARY

## Task Count by Priority

| Priority | Tasks | Estimated Days |
|----------|-------|----------------|
| P0 - Critical | 8 | 27 days |
| P1 - High | 8 | 31 days |
| P2 - Medium | 6 | 21 days |
| P3 - Low | 3 | 10 days |
| **TOTAL** | **25** | **89 days** |

## Task Count by Category

| Category | Tasks |
|----------|-------|
| Production Infrastructure | 6 |
| Regulatory Compliance | 2 |
| Pharmacy Business Features | 5 |
| Patient Features | 6 |
| Advanced/Nice-to-Have | 6 |

## Critical Path

1. **T6-001 → T6-006**: Kubernetes & CI/CD (19 days)
2. **T6-007 → T6-008**: Controlled Substance Compliance (8 days)
3. **T6-009 → T6-010**: Master Account System (7 days)
4. **T6-013 → T6-015**: Vaccination Management (11 days)

**Total Critical Path:** ~45 days (with parallelization: ~30 days)

## Recommended Team Allocation

| Stream | Team Size | Duration |
|--------|-----------|----------|
| Infrastructure (K8s + CI/CD) | 2 devs | 3 weeks |
| Regulatory (Controlled Substances) | 1 dev | 2 weeks |
| Pharmacy Features (Accounts, COD, Vaccination) | 2 devs | 4 weeks |
| Patient Features (Subscriptions, Reviews, Gamification) | 2 devs | 4 weeks |
| Advanced Features (Cold Chain, Birthday, Referral) | 1 dev | 2 weeks |

**With parallel streams:** ~6-8 weeks total

## Post-Phase 6 Compliance

After Phase 6 completion:
- **Specification Compliance:** 100%
- **Production Readiness:** Full
- **Regulatory Compliance:** Complete (Swiss healthcare)

---

*Generated by BAZINGA Gap Analysis System*
*Date: 2025-12-03*
*Based on Gap Analysis Report v1.0.0*
