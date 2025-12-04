# MetaPharm Connect - Phase 7: Final Specification Gaps

**Version:** 1.0.0
**Date:** 2025-12-04
**Target:** 100% CDC_Final.md Compliance (Final Closure)
**Estimated Effort:** 58 developer days (~4 weeks with parallel execution)

---

## Overview

This task list addresses all remaining gaps identified after comprehensive ultrathink analysis comparing CDC_Final.md specification, all previous task files (tasks.md through tasks6.md), and actual codebase implementation. These are the final items required for full specification compliance.

---

## Priority Legend

- **P0 - CRITICAL**: Must have for production launch / regulatory compliance
- **P1 - HIGH**: Required for complete MVP functionality
- **P2 - MEDIUM**: Important for full user experience
- **P3 - LOW**: Nice to have, can be post-launch

---

# SECTION A: PRODUCTION INFRASTRUCTURE GAPS (P0)

## A1. Helm Charts for Environment Management

> **Gap Source:** T6-005 specified but not implemented. Only raw Kubernetes manifests exist.

### T7-001: Create Helm Chart Structure
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** Existing K8s manifests in `/kubernetes/`
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
  kubernetes/helm/
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
- [ ] Single command deploys entire stack (`helm install metapharm ./charts/metapharm`)
- [ ] Environment values clearly separated
- [ ] Helm release versioning enabled
- [ ] Rollback tested and documented
- [ ] CI/CD integration with Helm updated

---

## A2. Monitoring & Observability Stack

> **Gap Source:** T5-027 specified but not implemented. No Prometheus/Grafana found.

### T7-002: Prometheus Monitoring Setup
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T7-001 (Helm charts)
- **Estimated:** 3 days

**Functional Requirements:**
- Deploy Prometheus for metrics collection
- Configure service discovery for all MetaPharm services
- Set up alerting rules for critical metrics
- Integrate with AlertManager for notifications
- Configure retention and storage

**Technical Details:**
- Create `kubernetes/helm/charts/monitoring/` with Prometheus stack
- Use kube-prometheus-stack Helm chart as base
- Configure ServiceMonitors for each MetaPharm service
- Set up PrometheusRules for alerting

**Key Metrics to Collect:**
```yaml
# Custom metrics per service
- prescription_processing_duration_seconds
- drug_interaction_checks_total
- teleconsultation_sessions_active
- delivery_tracking_updates_per_second
- payment_transactions_total
- authentication_failures_total
- api_request_duration_seconds
- database_query_duration_seconds
```

**Alert Rules:**
```yaml
groups:
  - name: metapharm-critical
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
```

**Acceptance Criteria:**
- [ ] Prometheus collecting metrics from all 31 services
- [ ] ServiceMonitors configured for auto-discovery
- [ ] Alert rules for critical scenarios
- [ ] AlertManager sending notifications (Slack/PagerDuty)
- [ ] 15-day metric retention configured

---

### T7-003: Grafana Dashboards
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T7-002
- **Estimated:** 2 days

**Functional Requirements:**
- Create operational dashboards for all services
- Create business metrics dashboards
- Set up on-call dashboard for incidents
- Configure user authentication (OAuth)

**Dashboards to Create:**

1. **Platform Overview Dashboard:**
   - Total requests/second
   - Error rate across services
   - Active users
   - System health status

2. **Service Health Dashboard (per service):**
   - Request latency (p50, p95, p99)
   - Error rate
   - Pod CPU/memory usage
   - Database connection pool

3. **Business Metrics Dashboard:**
   - Prescriptions processed today
   - Orders placed/delivered
   - Teleconsultations completed
   - VIP points awarded
   - Revenue metrics

4. **Delivery Operations Dashboard:**
   - Active deliveries
   - Driver locations (map)
   - Delivery success rate
   - Average delivery time

5. **On-Call Dashboard:**
   - Active alerts
   - Recent incidents
   - Service dependency graph
   - Quick action buttons

**Acceptance Criteria:**
- [ ] 5 dashboards created and functional
- [ ] Real-time data updates
- [ ] OAuth authentication configured
- [ ] Dashboard provisioning via Helm
- [ ] Export/import capability

---

## A3. Centralized Logging

> **Gap Source:** T5-028 specified but not implemented. No ELK/Loki found.

### T7-004: Log Aggregation with Loki
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T7-001
- **Estimated:** 3 days

**Functional Requirements:**
- Centralize logs from all services
- Enable log searching and filtering
- Set up log retention policies
- Create log-based alerts
- Ensure GDPR compliance (no PII in logs)

**Technical Details:**
- Deploy Grafana Loki stack via Helm
- Configure Promtail for log collection
- Create log parsing rules for structured logging
- Set up index lifecycle management

**Log Format Standard:**
```json
{
  "timestamp": "2025-12-04T10:30:00.000Z",
  "level": "info",
  "service": "prescription-service",
  "traceId": "abc123",
  "spanId": "def456",
  "message": "Prescription validated successfully",
  "metadata": {
    "prescriptionId": "rx-789",
    "pharmacyId": "ph-001",
    "duration_ms": 150
  }
}
```

**Log Retention Policy:**
- Production: 30 days
- Staging: 7 days
- Development: 3 days

**PII Sanitization Rules:**
- Patient names → `[REDACTED]`
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- Swiss AHV numbers → `[AHV]`

**Acceptance Criteria:**
- [ ] All service logs centralized in Loki
- [ ] Search working in Grafana Explore
- [ ] Retention policies active
- [ ] Log-based alerts configured
- [ ] PII sanitized from logs
- [ ] Trace ID correlation working

---

# SECTION B: REGULATORY COMPLIANCE (P0)

## B1. GDPR Full Compliance

> **Gap Source:** T5-034-035 specified but not implemented. No data export/deletion APIs found.

### T7-005: GDPR Data Export Endpoint
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Allow patients to export all their data
- Include all services (prescriptions, orders, messages, etc.)
- Format: JSON and PDF
- Include audit trail
- Complete within 24 hours (async processing)

**Technical Details:**
- Create `backend/services/user-service/src/controllers/gdpr.controller.ts`
- Aggregate data from all 31 services
- Generate comprehensive PDF report
- Implement async processing for large exports

**Code Structure:**
```typescript
// gdpr.controller.ts
interface GDPRExportRequest {
  patientId: string;
  format: 'json' | 'pdf' | 'both';
  includeAuditTrail: boolean;
  requestedAt: Date;
}

interface GDPRExportResult {
  requestId: string;
  status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed';
  downloadUrls?: {
    json?: string;
    pdf?: string;
  };
  expiresAt: Date;
  dataIncluded: string[]; // List of data categories
}

// Data categories to export
const DATA_CATEGORIES = [
  'profile',           // User profile, addresses, preferences
  'prescriptions',     // All prescription history
  'orders',            // Order history
  'deliveries',        // Delivery records
  'messages',          // Message history (anonymized recipients)
  'appointments',      // Teleconsultation, vaccination appointments
  'medical_records',   // Digital twin, health data
  'vip_data',          // Points, tier history, rewards
  'consent_records',   // All consent given
  'audit_trail',       // Access logs
];
```

**API Endpoints:**
- `POST /api/gdpr/export/request` - Request data export
- `GET /api/gdpr/export/status/:requestId` - Check export status
- `GET /api/gdpr/export/download/:requestId` - Download export
- `GET /api/gdpr/data-categories` - List available data categories

**Acceptance Criteria:**
- [ ] All patient data included from all services
- [ ] JSON export working with complete data
- [ ] PDF export formatted professionally
- [ ] Audit trail included
- [ ] Export completed within 24-hour SLA
- [ ] Secure download with expiring links
- [ ] Email notification when ready

---

### T7-006: Right to Be Forgotten Implementation
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** T7-005
- **Estimated:** 4 days

**Functional Requirements:**
- Allow patients to request account deletion
- Anonymize rather than delete where legally required
- Maintain audit trail with anonymized reference
- Notify patient of completion
- Handle data in all 31 services
- 30-day cooling off period before execution

**Technical Details:**
- Implement deletion cascade across all services
- Add anonymization for legally required data (prescriptions, controlled substances)
- Create deletion verification workflow
- Implement notification on completion

**Code Structure:**
```typescript
// deletion.service.ts
interface DeletionRequest {
  requestId: string;
  patientId: string;
  requestedAt: Date;
  scheduledFor: Date; // 30 days after request
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  confirmedAt?: Date;
  completedAt?: Date;
  deletionReport?: DeletionReport;
}

interface DeletionReport {
  servicesProcessed: string[];
  recordsDeleted: number;
  recordsAnonymized: number;
  retainedCategories: string[]; // Legal retention requirements
  completedAt: Date;
}

// Legal retention requirements (Swiss law)
const RETENTION_REQUIREMENTS = {
  prescriptions: { years: 10, action: 'anonymize' },
  controlled_substances: { years: 10, action: 'anonymize' },
  financial_records: { years: 10, action: 'anonymize' },
  audit_logs: { years: 5, action: 'anonymize' },
};
```

**Deletion Workflow:**
1. Patient requests deletion via app
2. Confirmation email sent with cancellation link
3. 30-day cooling off period
4. Patient must confirm deletion (click link)
5. System processes deletion across all services
6. Anonymization applied where legally required
7. Completion notification sent
8. All access revoked

**API Endpoints:**
- `POST /api/gdpr/deletion/request` - Request account deletion
- `GET /api/gdpr/deletion/status/:requestId` - Check deletion status
- `POST /api/gdpr/deletion/confirm/:requestId` - Confirm deletion
- `POST /api/gdpr/deletion/cancel/:requestId` - Cancel deletion request

**Acceptance Criteria:**
- [ ] Deletion request workflow complete
- [ ] 30-day cooling off period enforced
- [ ] Legal data anonymized (not deleted)
- [ ] Audit trail maintained with anonymized IDs
- [ ] Confirmation emails sent
- [ ] All 31 services process deletion
- [ ] Final completion notification sent

---

# SECTION C: TESTING & QUALITY (P1)

## C1. Accessibility Compliance

> **Gap Source:** T5-045 specified but not implemented. No WCAG audit evidence.

### T7-007: WCAG 2.1 AA Compliance Audit
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Audit all 5 web apps for WCAG 2.1 AA compliance
- Test with screen readers (NVDA, VoiceOver)
- Test keyboard navigation
- Document and fix critical issues
- Generate compliance report

**Test Areas:**
1. **Perceivable:**
   - Color contrast ratios (4.5:1 minimum)
   - Alternative text for images
   - Captions for video content
   - Adaptable layouts

2. **Operable:**
   - Keyboard navigation
   - Focus management
   - Skip links
   - No keyboard traps
   - Timing adjustable

3. **Understandable:**
   - Readable text
   - Predictable navigation
   - Input assistance
   - Error identification

4. **Robust:**
   - Valid HTML
   - ARIA attributes correct
   - Compatible with assistive technologies

**Technical Details:**
- Install and run axe-core automated testing
- Manual testing with NVDA (Windows) and VoiceOver (macOS)
- Test critical user journeys:
  - Patient: Order medication, book teleconsultation
  - Pharmacist: Review prescription, conduct teleconsultation
  - Doctor: Create prescription, view patient records
  - Nurse: Place order, track delivery
  - Driver: Accept delivery, capture signature

**Acceptance Criteria:**
- [ ] Automated axe-core scan passes (no critical/serious issues)
- [ ] Screen reader testing completed for all apps
- [ ] Keyboard navigation works throughout
- [ ] Critical issues fixed
- [ ] WCAG 2.1 AA compliance report generated
- [ ] Remediation plan for remaining issues

---

## C2. End-to-End Journey Tests

> **Gap Source:** T5-046-048 partially implemented. Complete coverage needed.

### T7-008: Complete E2E Test Suite
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Full prescription lifecycle test
- Complete teleconsultation journey test
- VIP membership journey test
- Delivery workflow test
- All tests automated in CI/CD

**Journey 1: Prescription Lifecycle (T5-046)**
```typescript
// e2e/journeys/prescription-lifecycle.spec.ts
describe('Prescription Lifecycle', () => {
  it('should process prescription from upload to delivery', async () => {
    // 1. Patient uploads prescription photo
    // 2. OCR transcribes prescription
    // 3. System checks drug interactions
    // 4. Pharmacist reviews and approves
    // 5. Order created and payment processed
    // 6. Delivery assigned and tracked
    // 7. Patient receives medication
    // 8. Adherence tracking begins
  });
});
```

**Journey 2: Teleconsultation (T5-047)**
```typescript
// e2e/journeys/teleconsultation.spec.ts
describe('Teleconsultation Journey', () => {
  it('should complete teleconsultation from booking to prescription', async () => {
    // 1. Patient books teleconsultation
    // 2. Reminders sent
    // 3. Both parties join video call
    // 4. Pharmacist takes notes (voice transcription)
    // 5. Prescription created during call
    // 6. Follow-up scheduled
    // 7. Recording saved (with consent)
  });
});
```

**Journey 3: VIP Membership (T5-048)**
```typescript
// e2e/journeys/vip-membership.spec.ts
describe('VIP Membership Journey', () => {
  it('should progress through VIP tiers with rewards', async () => {
    // 1. Patient signs up for VIP
    // 2. Points earned on purchase
    // 3. Tier upgrade triggered
    // 4. Discount applied on next order
    // 5. Birthday bonus received
    // 6. Free delivery eligibility verified
    // 7. Referral rewards processed
  });
});
```

**Journey 4: Delivery Workflow**
```typescript
// e2e/journeys/delivery-workflow.spec.ts
describe('Delivery Workflow', () => {
  it('should complete delivery with tracking and payment', async () => {
    // 1. Order ready for delivery
    // 2. Driver assigned
    // 3. Route optimized
    // 4. Real-time tracking active
    // 5. Patient notified of ETA
    // 6. COD payment collected
    // 7. Signature captured
    // 8. Delivery confirmed
  });
});
```

**Acceptance Criteria:**
- [ ] All 4 journeys automated
- [ ] Tests run in CI/CD pipeline
- [ ] Tests use realistic data
- [ ] Error scenarios covered
- [ ] Data consistency verified
- [ ] Test report generated

---

## C3. Load Testing Verification

> **Gap Source:** T5-040-042 workflow exists but verification needed.

### T7-009: Verify and Enhance Load Tests
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 2 days

**Functional Requirements:**
- Verify existing load-tests.yml workflow runs successfully
- Add missing load test scenarios
- Document performance baselines
- Set up performance regression alerts

**Load Test Scenarios:**
1. **Prescription Processing:** 100 concurrent uploads, target < 5s p95
2. **Delivery Tracking:** 500 concurrent WebSocket connections
3. **Messaging Throughput:** 1000 messages/minute
4. **API Gateway:** 1000 concurrent requests
5. **Database Queries:** Complex query performance

**Acceptance Criteria:**
- [ ] Load test workflow runs successfully
- [ ] All scenarios pass acceptance criteria
- [ ] Performance baselines documented
- [ ] Bottlenecks identified and documented
- [ ] Regression alerts configured

---

# SECTION D: AI/ML FEATURES (P2)

## D1. Predictive Inventory

> **Gap Source:** T5-036 specified but not implemented.

### T7-010: Stock Prediction Service
- **Priority:** P2
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Predict stock needs based on historical demand
- Account for seasonality (flu season, allergies, etc.)
- Predict before stockouts occur
- Suggest reorder quantities
- Learn from prediction accuracy

**Technical Details:**
- Create `backend/services/inventory-service/src/services/prediction.service.ts`
- Implement time series forecasting (Prophet or ARIMA)
- Add seasonality detection
- Create reorder point calculation
- Implement feedback loop for model improvement

**Code Structure:**
```typescript
// prediction.service.ts
interface StockPrediction {
  productId: string;
  pharmacyId: string;
  currentStock: number;
  predictedDemand: {
    next7Days: number;
    next30Days: number;
    next90Days: number;
  };
  stockoutRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendedReorderDate: Date;
  recommendedReorderQuantity: number;
  confidence: number;
  factors: PredictionFactor[];
}

interface PredictionFactor {
  factor: 'seasonality' | 'trend' | 'promotion' | 'event';
  impact: number; // -1 to 1
  description: string;
}
```

**API Endpoints:**
- `GET /api/inventory/predictions/:pharmacyId` - Get all predictions
- `GET /api/inventory/predictions/:pharmacyId/:productId` - Get product prediction
- `POST /api/inventory/predictions/generate` - Trigger prediction update
- `GET /api/inventory/reorder-suggestions/:pharmacyId` - Get reorder suggestions

**Acceptance Criteria:**
- [ ] Predictions 80%+ accurate
- [ ] Stockouts reduced by 50%
- [ ] Seasonality patterns captured
- [ ] Reorder suggestions accurate
- [ ] Model improves over time with feedback

---

## D2. Behavioral Personalization

> **Gap Source:** T5-031-032 specified but not fully implemented.

### T7-011: User Behavior Tracking Service
- **Priority:** P2
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Track user interactions (anonymized)
- Identify usage patterns
- Segment users by behavior
- Detect churn risk
- Feed data to recommendation engine
- GDPR compliant (consent-based)

**Technical Details:**
- Create `backend/services/analytics-service/src/services/behavior.service.ts`
- Implement event tracking with consent verification
- Build user segmentation models
- Create churn prediction model
- Connect to recommendation engine

**Events to Track:**
```typescript
enum UserEvent {
  // Session events
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',

  // Product events
  PRODUCT_VIEW = 'product_view',
  PRODUCT_SEARCH = 'product_search',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',

  // Order events
  ORDER_START = 'order_start',
  ORDER_COMPLETE = 'order_complete',
  ORDER_ABANDON = 'order_abandon',

  // Feature usage
  TELECONSULT_BOOK = 'teleconsult_book',
  PRESCRIPTION_UPLOAD = 'prescription_upload',
  REFILL_REQUEST = 'refill_request',

  // Engagement
  NOTIFICATION_OPEN = 'notification_open',
  APP_RATING = 'app_rating',
  REVIEW_WRITE = 'review_write',
}
```

**User Segments:**
- Power Users (high engagement, high orders)
- Regular Users (consistent engagement)
- Occasional Users (infrequent but active)
- At-Risk Users (declining engagement)
- Churned Users (inactive 30+ days)

**Acceptance Criteria:**
- [ ] Event tracking implemented with consent
- [ ] User segments identified
- [ ] Churn risk calculated
- [ ] Data feeds recommendation engine
- [ ] GDPR compliance maintained
- [ ] Privacy-preserving analytics

---

# SECTION E: NICE TO HAVE (P3)

### T7-012: Google Calendar Sync
- **Priority:** P3
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Sync appointments to Google Calendar
- Two-way sync (create in either place)
- Include medication reminders
- Handle timezone correctly

**Acceptance Criteria:**
- [ ] Appointments sync to Google Calendar
- [ ] Changes reflect both directions
- [ ] Reminders included
- [ ] Timezones handled correctly

---

### T7-013: Apple Calendar Sync
- **Priority:** P3
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Sync appointments to Apple Calendar
- Support iCloud accounts
- Include medication reminders
- Handle timezone correctly

**Acceptance Criteria:**
- [ ] Appointments sync to Apple Calendar
- [ ] iCloud integration works
- [ ] Reminders included
- [ ] Timezones handled correctly

---

### T7-014: Nurse PDF Export
- **Priority:** P3
- **Complexity:** Low
- **Dependencies:** None
- **Estimated:** 2 days

**Functional Requirements:**
- Export order history as PDF
- Include all traceability data
- Support date range filtering
- Professional formatting

**Acceptance Criteria:**
- [ ] PDF generation works
- [ ] All order data included
- [ ] Date filtering works
- [ ] Professional format

---

### T7-015: Medication Recycling Workflow
- **Priority:** P3
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 4 days

**Functional Requirements:**
- Allow patients to request medication pickup
- Driver collects during delivery
- Track returned medications
- Generate recycling reports

**Acceptance Criteria:**
- [ ] Patients can request pickup
- [ ] Drivers see return items
- [ ] Returns tracked in system
- [ ] Reports generated

---

# SUMMARY

## Task Count by Priority

| Priority | Tasks | Estimated Days |
|----------|-------|----------------|
| P0 - Critical | 6 | 19 days |
| P1 - High | 3 | 10 days |
| P2 - Medium | 2 | 10 days |
| P3 - Low | 4 | 12 days |
| **TOTAL** | **15** | **51 days** |

## Task Count by Category

| Category | Tasks |
|----------|-------|
| Infrastructure (Helm, Monitoring, Logging) | 4 |
| GDPR Compliance | 2 |
| Testing & Quality | 3 |
| AI/ML Features | 2 |
| Nice to Have | 4 |

## Critical Path

1. **T7-001**: Helm Charts (4 days)
2. **T7-002 → T7-003**: Monitoring Stack (5 days)
3. **T7-004**: Log Aggregation (3 days)
4. **T7-005 → T7-006**: GDPR Compliance (7 days)

**Total Critical Path:** ~19 days

## Recommended Team Allocation

| Stream | Team Size | Duration |
|--------|-----------|----------|
| Infrastructure (T7-001 to T7-004) | 2 devs | 2 weeks |
| GDPR Compliance (T7-005 to T7-006) | 1 dev | 1.5 weeks |
| Testing (T7-007 to T7-009) | 1 dev | 1.5 weeks |
| AI/ML (T7-010 to T7-011) | 1 dev | 2 weeks |
| Nice to Have (T7-012 to T7-015) | 1 dev | 2 weeks |

**With parallel streams:** ~4 weeks total

## Post-Phase 7 Compliance

After Phase 7 completion:
- **Specification Compliance:** 100%
- **Production Readiness:** Full
- **Regulatory Compliance:** Complete (GDPR + Swiss healthcare)
- **Accessibility Compliance:** WCAG 2.1 AA
- **Test Coverage:** Full E2E journeys

---

*Generated by BAZINGA Gap Analysis System*
*Date: 2025-12-04*
*Based on Comprehensive CDC_Final.md Analysis*
