# Phase 2: Immediate Next Steps (Todo List)

**Goal**: Achieve 100% E2E test pass rate (695/695 tests)
**Current**: 10/695 tests passing (1.4%)
**Estimated Effort**: 40-50 development days

---

## Week 1: Critical Blockers & Master Account (Days 1-5)

### Day 1: Fix Critical Blocker
- [ ] Fix auth fixture localStorage security error
  - **File**: `web/e2e/fixtures/auth.fixture.ts`
  - **Error**: `SecurityError: Failed to read 'localStorage' - Access is denied`
  - **Solution**: Ensure navigation happens before localStorage access
  - **Impact**: Currently blocking many tests from running
  - **Priority**: BLOCKER

### Day 2-3: Master Account Backend Completion
- [ ] Implement user permissions system (RBAC with granular controls)
  - **File**: `backend/services/user-service/controllers/permissionsController.ts`
- [ ] Add MFA setup and enforcement workflows
  - **File**: `backend/services/user-service/routes/mfa.ts`
- [ ] Build location management with multi-pharmacy support
  - **File**: `backend/services/user-service/controllers/locationController.ts` (already exists, enhance)
- [ ] Complete audit log with filtering and export
  - **File**: `backend/services/user-service/controllers/auditController.ts` (already exists, enhance)
- [ ] Add session management (view active sessions, force logout)
  - **File**: `backend/services/user-service/controllers/sessionController.ts`

### Day 4-5: Master Account Frontend & Testing
- [ ] Connect all MasterAccountPage tabs to real backend APIs
  - **File**: `web/src/apps/pharmacist/pages/MasterAccountPage.tsx` (already exists, enhance)
- [ ] Implement user settings (notifications, language, timezone)
  - **File**: `web/src/apps/pharmacist/pages/MasterAccountPage.tsx` (Settings tab)
- [ ] Seed test database with realistic user data
  - **File**: `backend/services/user-service/seeds/test-data.sql` (create)
- [ ] Run master account E2E tests and fix failures
  - **Command**: `cd web && npx playwright test master-account.spec.ts`
- [ ] Verify all 11 master account tests pass
  - **Target**: 11/11 tests passing

**Week 1 Goal**: 21 tests passing (10 baseline + 11 master account)

---

## Week 2: Pharmacy Profile Management (Days 6-10)

### Day 6-7: Pharmacy Profile Backend
- [ ] Implement operating hours logic with business rules
  - **File**: `backend/services/pharmacy-service/controllers/hoursController.ts`
  - **Features**: Open/closed status, holiday schedules, exceptions
- [ ] Build delivery zones with polygon map integration
  - **File**: `backend/services/pharmacy-service/controllers/zonesController.ts`
  - **Integration**: Google Maps API for zone selection
- [ ] Complete product catalog with categories and search
  - **File**: `backend/services/pharmacy-service/controllers/catalogController.ts`
  - **Features**: Categories, filters, search, pagination

### Day 8-9: Pharmacy Profile Frontend
- [ ] Enhance PharmacyProfileManager with operating hours UI
  - **File**: `web/src/apps/pharmacist/pages/pharmacy-profile/PharmacyProfileManager.tsx`
  - **Features**: Interactive hour picker, day-specific hours
- [ ] Add delivery zones map interface
  - **File**: `web/src/apps/pharmacist/pages/pharmacy-profile/PharmacyProfileManager.tsx`
  - **Integration**: Google Maps with polygon drawing
- [ ] Complete product catalog management UI
  - **File**: `web/src/apps/pharmacist/pages/pharmacy-profile/PharmacyProfileManager.tsx`
  - **Features**: Add/edit products, categories, bulk import

### Day 10: Testing & Integration
- [ ] Implement photo upload/management for pharmacy profile
  - **File**: `backend/services/pharmacy-service/controllers/photoController.ts`
- [ ] Seed test database with complete pharmacy profiles
  - **File**: `backend/services/pharmacy-service/seeds/test-data.sql` (create)
- [ ] Run pharmacy profile E2E tests and fix failures
  - **Command**: `cd web && npx playwright test pharmacy-page.spec.ts`
- [ ] Verify all 10 pharmacy profile tests pass
  - **Target**: 10/10 tests passing

**Week 2 Goal**: 31 tests passing (21 from Week 1 + 10 pharmacy profile)

---

## Week 3: Inventory Management (Days 11-15)

### Day 11-12: Inventory Backend Enhancement
- [ ] Implement QR code scanning and barcode integration
  - **File**: `backend/services/inventory-service/controllers/scanController.ts` (create)
  - **Library**: node-barcode or similar
- [ ] Build low-stock alerts with configurable thresholds
  - **File**: `backend/services/inventory-service/controllers/alertsController.ts` (create)
  - **Features**: Email/SMS notifications, threshold settings
- [ ] Add expiry date tracking and automated alerts
  - **File**: `backend/services/inventory-service/controllers/expiryController.ts` (create)
  - **Features**: 30/60/90 day warnings, batch expiry tracking

### Day 13: Inventory AI & Intelligence
- [ ] Implement reorder suggestions (AI-powered predictive restocking)
  - **File**: `backend/services/inventory-service/controllers/aiController.ts` (create)
  - **Algorithm**: Moving average, seasonal trends, usage patterns
- [ ] Build batch tracking for controlled substances
  - **File**: `backend/services/inventory-service/models/Batch.ts` (create)
  - **Compliance**: Swiss controlled substance regulations

### Day 14: Inventory Frontend & Reporting
- [ ] Enhance InventoryManagementPage with all features
  - **File**: `web/src/pages/InventoryManagementPage.tsx`
  - **Features**: QR scanner UI, alerts dashboard, reorder suggestions
- [ ] Add inventory reports (turnover, valuation, waste)
  - **File**: `web/src/pages/InventoryManagementPage.tsx` (Reports tab)
  - **Export**: CSV, PDF report generation

### Day 15: Testing & Integration
- [ ] Implement multi-location inventory sync
  - **File**: `backend/services/inventory-service/sync/multiLocationSync.ts` (create)
- [ ] Seed test database with diverse inventory items
  - **File**: `backend/services/inventory-service/seeds/test-data.sql` (create)
- [ ] Run inventory E2E tests and fix failures
  - **Command**: `cd web && npx playwright test inventory.spec.ts`
- [ ] Verify all 13 inventory tests pass
  - **Target**: 13/13 tests passing

**Week 3 Goal**: 44 tests passing (31 from Week 2 + 13 inventory)

---

## Week 4-5: Prescription Management (Days 16-25)

### Day 16-17: Prescription Service Setup
- [ ] Create prescription-service microservice (port 4005)
  - **Directory**: `backend/services/prescription-service/`
  - **Structure**: Express server, routes, controllers, models
- [ ] Set up database schema for prescriptions
  - **File**: `backend/services/prescription-service/migrations/001_prescriptions.sql`
  - **Tables**: prescriptions, prescription_items, interactions, insurance_claims

### Day 18-19: OCR & AI Integration
- [ ] Integrate OCR for prescription image reading
  - **File**: `backend/services/prescription-service/services/ocrService.ts`
  - **API**: Tesseract.js or Google Vision API
- [ ] Implement drug interaction checking
  - **File**: `backend/services/prescription-service/services/interactionService.ts`
  - **Database**: Swiss drug interaction database API
- [ ] Add allergy checking against patient history
  - **File**: `backend/services/prescription-service/services/allergyService.ts`

### Day 20-21: Prescription Processing
- [ ] Build prescription validation workflow
  - **File**: `backend/services/prescription-service/controllers/validationController.ts`
  - **Features**: Pharmacist review, approval, rejection with notes
- [ ] Implement insurance verification and claim submission
  - **File**: `backend/services/prescription-service/services/insuranceService.ts`
  - **Integration**: Swiss TPL insurance APIs
- [ ] Add prescription renewal requests
  - **File**: `backend/services/prescription-service/controllers/renewalController.ts`

### Day 22-23: Prescription Frontend
- [ ] Create PrescriptionProcessingPage component
  - **File**: `web/src/apps/pharmacist/pages/PrescriptionProcessingPage.tsx`
  - **Features**: Image upload, OCR display, validation UI, approval workflow
- [ ] Implement prescription history view
  - **File**: `web/src/apps/pharmacist/pages/PrescriptionHistoryPage.tsx`
  - **Features**: Search, filter, patient timeline

### Day 24-25: Testing & Compliance
- [ ] Implement controlled substance tracking
  - **File**: `backend/services/prescription-service/compliance/controlledSubstances.ts`
  - **Compliance**: Swiss e-prescription regulations
- [ ] Seed test database with prescription data
  - **File**: `backend/services/prescription-service/seeds/test-data.sql`
- [ ] Run prescription E2E tests and fix failures
  - **Command**: `cd web && npx playwright test prescription.spec.ts`
- [ ] Verify all 12 prescription tests pass
  - **Target**: 12/12 tests passing

**Week 5 Goal**: 56 tests passing (44 from Week 3 + 12 prescriptions)

---

## Week 6-7: Teleconsultation Platform (Days 26-35)

### Day 26-27: Teleconsult Service Setup
- [ ] Create teleconsult-service microservice (port 4006)
  - **Directory**: `backend/services/teleconsult-service/`
- [ ] Set up database schema
  - **File**: `backend/services/teleconsult-service/migrations/001_teleconsult.sql`
  - **Tables**: appointments, consultations, recordings, notes

### Day 28-29: WebRTC Infrastructure
- [ ] Implement WebRTC video calling (self-hosted)
  - **File**: `backend/services/teleconsult-service/webrtc/videoService.ts`
  - **Infrastructure**: STUN/TURN servers setup
- [ ] Add real-time messaging with end-to-end encryption
  - **File**: `backend/services/teleconsult-service/websocket/messagingService.ts`
  - **Library**: Socket.io with encryption

### Day 30-31: Appointment System
- [ ] Build appointment scheduling with calendar sync
  - **File**: `backend/services/teleconsult-service/controllers/appointmentController.ts`
  - **Features**: Availability management, booking, reminders
- [ ] Implement waiting room and queue management
  - **File**: `backend/services/teleconsult-service/controllers/queueController.ts`
  - **Features**: Virtual waiting room, estimated wait time

### Day 32-33: Teleconsult Frontend
- [ ] Create TeleconsultationPage component
  - **File**: `web/src/apps/pharmacist/pages/TeleconsultationPage.tsx`
  - **Features**: Video interface, chat, patient info sidebar
- [ ] Implement appointment booking UI
  - **File**: `web/src/apps/pharmacist/pages/AppointmentsPage.tsx`
  - **Features**: Calendar view, availability settings

### Day 34-35: Recording & Testing
- [ ] Implement consultation recording (with consent)
  - **File**: `backend/services/teleconsult-service/recording/recordingService.ts`
  - **Features**: Video/audio recording, storage, playback
- [ ] Add consultation notes and transcription
  - **File**: `backend/services/teleconsult-service/services/transcriptionService.ts`
  - **API**: Speech-to-text service
- [ ] Seed test database with appointment data
  - **File**: `backend/services/teleconsult-service/seeds/test-data.sql`
- [ ] Run teleconsult E2E tests and fix failures
  - **Command**: `cd web && npx playwright test teleconsult.spec.ts`
- [ ] Verify all 10 teleconsult tests pass
  - **Target**: 10/10 tests passing

**Week 7 Goal**: 66 tests passing (56 from Week 5 + 10 teleconsult)

---

## Week 8-9: Delivery & E-Commerce (Days 36-45)

### Day 36-37: Delivery Service
- [ ] Create delivery-service microservice (port 4007)
- [ ] Implement GPS tracking with real-time updates
- [ ] Build route optimization algorithm
- [ ] Add QR code traceability system
- [ ] Implement delivery personnel assignment
- [ ] Seed test data and run 10 E2E tests

### Day 38-40: E-Commerce Platform
- [ ] Create ecommerce-service microservice (port 4008)
- [ ] Implement product catalog and search
- [ ] Build shopping cart and checkout
- [ ] Integrate payment gateway (Stripe, Twint)
- [ ] Implement loyalty program (Golden MetaPharm)
- [ ] Add order management system

### Day 41-42: Patient Portal
- [ ] Create patient app pages
- [ ] Implement patient dashboard
- [ ] Add medical record access
- [ ] Build appointment booking
- [ ] Seed test data

### Day 43-45: Testing & Integration
- [ ] Run delivery E2E tests (10 tests)
- [ ] Run e-commerce E2E tests (13 tests)
- [ ] Run patient portal E2E tests (5 tests)
- [ ] Fix failures and verify all pass

**Week 9 Goal**: 94 tests passing (66 from Week 7 + 28 delivery/commerce/patient)

---

## Week 10-11: Communication & Analytics (Days 46-55)

### Day 46-48: Communication Hub
- [ ] Create messaging-service microservice (port 4009)
- [ ] Implement unified inbox (email, WhatsApp, fax)
- [ ] Integrate WhatsApp Business API
- [ ] Add email gateway with templates
- [ ] Implement message encryption
- [ ] Seed test data and run 11 E2E tests

### Day 49-52: Analytics Dashboard
- [ ] Create analytics-service microservice (port 4010)
- [ ] Implement data aggregation and ETL
- [ ] Build revenue reports
- [ ] Add prescription volume analytics
- [ ] Implement inventory turnover reports
- [ ] Build real-time dashboard with KPIs
- [ ] Add custom report builder
- [ ] Seed test data and run 15 E2E tests

### Day 53-55: Cross-Feature Integration
- [ ] Test cross-service workflows
- [ ] Fix integration issues
- [ ] Verify communication tests pass (11 tests)
- [ ] Verify analytics tests pass (15 tests)

**Week 11 Goal**: 120 tests passing (94 from Week 9 + 26 communication/analytics)

---

## Week 12: Final Integration & Stabilization (Days 56-60)

### Day 56-57: Infrastructure
- [ ] Set up centralized logging (ELK stack)
- [ ] Implement distributed tracing (Jaeger)
- [ ] Build API gateway for microservices
- [ ] Add health checks and monitoring (Prometheus)
- [ ] Implement CI/CD for all services

### Day 58-59: Security & Compliance
- [ ] HIPAA compliance audit
- [ ] GDPR compliance verification
- [ ] Security vulnerability scan
- [ ] Penetration testing
- [ ] Swiss healthcare compliance check (HIN, e-ID)

### Day 60: Final Testing
- [ ] Run full E2E test suite (all 695 tests)
- [ ] Fix remaining failures
- [ ] Verify 695/695 tests passing (100%)
- [ ] Performance testing
- [ ] Load testing

**Week 12 Goal**: 695 tests passing (100%)

---

## Critical Path Items (Cannot proceed without these)

1. **Day 1**: Fix auth fixture localStorage error (BLOCKER)
2. **Days 2-15**: Complete foundation features (unlock 34 tests)
3. **Days 16-25**: Prescription management (unlock 12 tests)
4. **Days 26-35**: Teleconsultation (unlock 10 tests)
5. **Days 36-45**: Delivery & Commerce (unlock 28 tests)
6. **Days 46-55**: Communication & Analytics (unlock 26 tests)
7. **Days 56-60**: Final integration (unlock remaining ~585 tests)

---

## Daily Progress Tracking

Use this checklist format for daily standups:

**Day X Progress**:
- [ ] Tasks completed today
- [ ] Current test count: X/695 passing
- [ ] Blockers encountered
- [ ] Tasks planned for tomorrow

---

## Resources Needed

### Development Team
- [ ] Hire/assign 3-4 full-stack developers
- [ ] Hire/assign 1 QA engineer
- [ ] Assign 1 tech lead (part-time)
- [ ] Assign 1 DevOps engineer (part-time)

### External Services
- [ ] Swiss drug interaction database license
- [ ] Payment gateway accounts (Stripe, Twint)
- [ ] WhatsApp Business API account
- [ ] Cloud infrastructure (AWS/Azure/GCP)
- [ ] WebRTC STUN/TURN servers
- [ ] OCR/AI service accounts

### Tools & Software
- [ ] Project management tool (Jira, Linear)
- [ ] Communication tool (Slack, Teams)
- [ ] Version control (Git, GitHub/GitLab)
- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Monitoring tools (Prometheus, Grafana, ELK)

---

**Next Steps**:
1. Review this todo list
2. Confirm team and resource availability
3. Begin Day 1: Fix auth fixture blocker
4. Resume with `/orchestrate "Start Phase 2 Day 1 from docs/phase2-todo-list.md"`
