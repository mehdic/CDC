# MetaPharm Connect - Remaining Tasks (tasks2.md)

**Generated:** 2025-11-25
**Source:** Gap analysis from tasks.md + DEEP CODE AUDIT
**Total Tasks:** 135 tasks
**Categories:** Critical Integrations (14), Missing Apps (32), Development (52), E2E Tests (37)

---

## 📚 Implementation Reference Documents

**IMPORTANT:** Before implementing any task, consult the relevant specification documents:

| Document | Path | Contents | When to Use |
|----------|------|----------|-------------|
| **spec.md** | `specs/002-metapharm-platform/spec.md` | Complete functional requirements, user stories, acceptance criteria, UI/UX specs | **Primary reference** for all feature implementation |
| **plan.md** | `specs/002-metapharm-platform/plan.md` | Architecture decisions, technology choices, implementation approach, service boundaries | Understanding system design and integration patterns |
| **data-model.md** | `specs/002-metapharm-platform/data-model.md` | Database schema, entity relationships, field definitions, RLS policies | Database work, API design, data validation |
| **research.md** | `specs/002-metapharm-platform/research.md` | Third-party integrations, API documentation, Swiss healthcare regulations | External integrations (FDB, Twilio, HIN, AWS) |
| **quickstart.md** | `specs/002-metapharm-platform/quickstart.md` | Local development setup, environment variables, running services | Environment setup and debugging |
| **contracts/** | `specs/002-metapharm-platform/contracts/` | OpenAPI/Swagger specs, API contracts between services | API implementation and testing |
| **checklists/** | `specs/002-metapharm-platform/checklists/` | Compliance checklists (HIPAA, GDPR), security requirements | Security and compliance tasks |

### Quick Reference by Task Type

| Task Type | Primary Doc | Secondary Doc |
|-----------|-------------|---------------|
| **INT-xxx** (Integration fixes) | `research.md` (API docs) | `spec.md` (requirements) |
| **T2-056 to T2-087** (Mobile apps) | `spec.md` (user stories) | `plan.md` (architecture) |
| **T2-001 to T2-055** (Phase 6) | `spec.md` | `plan.md` |
| **T2-020 to T2-029** (Security) | `checklists/` | `research.md` (regulations) |
| **E2E-xxx** (Tests) | `spec.md` (acceptance criteria) | `contracts/` (API specs) |

### Key Sections in spec.md

- **User Scenarios & Testing**: 11 User Stories (US1-US11) with acceptance criteria
  - US1: Prescription Processing (P1) - lines 10-29
  - US2: Teleconsultation (P2) - lines 30-50
  - US3: Inventory Management (P3) - lines 51-70
  - US4: Delivery Management (P4) - lines 71-92
  - US5: Patient E-Commerce (P5) - lines 93-113
  - US6: Secure Messaging (P6) - lines 114-135
  - US7: Medical Records (P7) - lines 136-156
  - US8: Doctor Prescription (P8) - lines 157-177
  - US9: Nurse Workflows (P9) - lines 178-199
  - US10: Analytics (P10) - lines 200-220
  - US11: VIP Program (P11) - lines 221-241
- **Functional Requirements**: Detailed requirements by category (line 268+)
  - Authentication & User Management
  - Prescription Management
  - Teleconsultation
  - Inventory Management
  - Delivery Management
  - Patient E-Commerce
  - Secure Messaging
  - Medical Records
  - Nurse Workflows
  - Analytics & Reporting
  - Compliance & Security
- **Key Entities**: Data model overview (line 424+)
- **Success Criteria**: Measurable outcomes (line 454+)

### Key Sections in plan.md

- **Summary**: High-level overview and key decisions (line 8+)
- **Technical Context**: Technology stack, constraints, dependencies (line 32+)
- **Constitution Check**: Security, compliance, multi-tenant principles (line 93+)
  - Security & Privacy First
  - Regulatory Compliance (HIPAA, GDPR, Swiss regulations)
  - Traceability & Documentation
  - Multi-Tenant Isolation
  - Patient-Centric Design
  - Real-Time Reliability
- **Project Structure**: Complete folder structure (line 204+)
  - Backend Microservices (auth, prescription, teleconsultation, inventory, delivery, nurse, notification)
  - Mobile Applications (patient-app, pharmacist-app, doctor-app, delivery-app, nurse-app)
  - Web Application structure
  - Infrastructure (Docker, Kubernetes)
- **Complexity Tracking**: Risk areas and mitigation (line 330+)
- **Implementation Roadmap**: Phased delivery plan (line 452+)
  - MVP Phase (P1-P3): Prescription, Teleconsultation, Inventory
  - Phase 2 (P4-P6): Delivery, E-Commerce, Messaging
  - Phase 3 (P7-P9): Medical Records, Doctor, Nurse apps

---

## Overview

This document contains all remaining tasks identified from:
1. Original tasks.md Phase 6 analysis
2. E2E test audit
3. **DEEP CODE AUDIT** - Actual code review revealing STUB/MOCK implementations

### Task ID Convention
- `INT-XXX` - Critical integration tasks (STUBS discovered in code audit)
- `T2-XXX` - Continuation from original tasks.md Phase 6 (T222-T276)
- `E2E-XXX` - New E2E test tasks identified during audit

### Priority Levels
- **P0 (Critical):** Security, compliance, blocking issues, **PRODUCTION BLOCKERS**
- **P1 (High):** Core functionality gaps
- **P2 (Medium):** Important but not blocking
- **P3 (Low):** Nice to have, optimization

---

## ⚠️ CRITICAL DISCOVERY: STUB/MOCK IMPLEMENTATIONS

**The code audit revealed that several "complete" features are actually STUBS or MOCKS:**

| Feature | File | Status | Impact |
|---------|------|--------|--------|
| FDB Drug Interactions | `integrations/fdb.ts` | **MOCK** | Drug safety checking disabled |
| Mobile Twilio Video | `TwilioVideo.tsx` | **STUB** | Video calls won't work on mobile |
| Speech-to-Text | `transcription.ts` | **MOCK** | AI transcription returns hardcoded text |
| Mobile QR Camera | `QRScannerScreen.tsx` | **STUB** | QR scanning UI has no camera |
| AWS Forecast | `forecast.ts` | **MVP** | Using heuristics, not ML predictions |
| Audit Service | `approveController.ts` | **TODO** | PHI access not logged |
| Notification Service | `approveController.ts` | **TODO** | Approval notifications not sent |

**Overall Implementation Status: ~55% COMPLETE (not 80% as initially reported)**

---

## 📋 Cross-Reference: tasks.md → tasks2.md

**The following tasks were unchecked in tasks.md and are now remediated in tasks2.md:**

| Original Task (tasks.md) | Status | New Task(s) in tasks2.md | Description |
|--------------------------|--------|--------------------------|-------------|
| **T085** - FDB MedKnowledge API | STUB | **INT-001, INT-002, INT-003** | Implement real FDB API integration |
| **T089** - Pharmacist approval logic | PARTIAL | **INT-011, INT-012** | Add Audit + Notification service integrations |
| **T146** - Twilio speech-to-text | MOCK | **INT-007, INT-008** | Implement real transcription + NLP highlighting |
| **T150** - Appointment reminders | TODO | **INT-013** | Implement reminder notifications |
| **T155** - Mobile Twilio Video SDK | STUB | **INT-004, INT-005, INT-006** | Implement real SDK for Patient + Pharmacist apps |
| **T195** - AWS Forecast | MVP | **INT-014** | Implement real AWS Forecast API |
| **T201** - QR Scanner screen | STUB | **INT-009** | Implement RNCamera integration |
| **T202** - React Native Camera | STUB | **INT-010** | Add camera permissions and error handling |

**Use tasks2.md as the single source of truth going forward.**

---

## PART A-0: CRITICAL INTEGRATION TASKS (14 tasks) - PRODUCTION BLOCKERS

### Phase 0.1: Drug Safety Integrations (3 tasks)
**Priority:** P0 (Critical) - BLOCKS PRODUCTION
**Discovery:** Code audit found hardcoded mock data in `backend/services/prescription-service/src/integrations/fdb.ts`

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| INT-001 | Implement FDB MedKnowledge API integration | Real API calls to FDB, proper authentication, error handling | 12 |
| INT-002 | Replace mock drug interactions with real FDB responses | Remove hardcoded warfarin/metformin/etc mocks, use live data | 8 |
| INT-003 | Add FDB API credential management and fallback | Secure credential storage, graceful degradation if API down | 4 |

**Evidence:**
- Lines 88-102: `callFDBAPI()` throws "FDB API not configured"
- Lines 128-203: `mockCheckDrugInteractions()` with hardcoded drug pairs
- Current state: Only checks hardcoded interactions (warfarin, metformin, lisinopril, simvastatin, digoxin)

**Subtotal:** 24 hours

---

### Phase 0.2: Mobile Video Call Integration (3 tasks)
**Priority:** P0 (Critical) - BLOCKS PRODUCTION
**Discovery:** Code audit found SDK calls commented out in `mobile/patient-app/src/components/TwilioVideo.tsx`

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| INT-004 | Implement real Twilio Video SDK in Patient mobile app | Replace setTimeout stubs with actual SDK calls | 12 |
| INT-005 | Implement real Twilio Video SDK in Pharmacist mobile app | Same integration for pharmacist app | 8 |
| INT-006 | Add mobile video call error handling and fallback | Network issues handled, audio-only fallback working | 6 |

**Evidence:**
- Lines 69-84: All `TwilioVideo` SDK imports commented out
- Lines 85-90: Connection simulated with `setTimeout`
- Lines 166-173: Placeholder text instead of actual video feed
- Web version (`TwilioVideoRoom.tsx`) IS complete with real SDK

**Subtotal:** 26 hours

---

### Phase 0.3: AI Transcription Integration (2 tasks)
**Priority:** P1 (High)
**Discovery:** Code audit found hardcoded response in `backend/services/teleconsultation-service/src/integrations/transcription.ts`

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| INT-007 | Implement Twilio Speech-to-Text API integration | Real-time transcription during video calls | 16 |
| INT-008 | Add medical term highlighting with NLP | Highlight medications, dosages, symptoms in transcript | 8 |

**Evidence:**
- Lines 42-48: Comment says "For MVP, we'll return a mock transcription"
- Line 49: `TODO: Implement actual Twilio Speech-to-Text integration`
- Returns hardcoded consultation about headache/ibuprofen

**Subtotal:** 24 hours

---

### Phase 0.4: Mobile QR Camera Integration (2 tasks)
**Priority:** P1 (High)
**Discovery:** Code audit found camera component commented out in `mobile/pharmacist-app/src/screens/QRScannerScreen.tsx`

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| INT-009 | Implement RNCamera integration for QR scanning | Camera preview visible, QR codes detected | 8 |
| INT-010 | Add camera permissions and error handling | iOS/Android permissions, graceful degradation | 4 |

**Evidence:**
- Line 25: `// import { RNCamera } from 'react-native-camera';` (commented)
- Camera rendering code not in JSX - only form fields shown
- Backend QR parsing (`scanController.ts`) IS complete

**Subtotal:** 12 hours

---

### Phase 0.5: Service Integration TODOs (4 tasks)
**Priority:** P1 (High)
**Discovery:** Code audit found TODO comments with no implementation in `approveController.ts`

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| INT-011 | Implement Audit Service integration in prescription approval | All PHI access logged to audit trail | 6 |
| INT-012 | Implement Notification Service integration in prescription approval | Patient/doctor notified on approval/rejection | 6 |
| INT-013 | Implement reminder notifications for teleconsultation | Appointment reminders sent before consultation | 4 |
| INT-014 | Implement AWS Forecast API for inventory predictions | Replace heuristic calculations with ML predictions | 12 |

**Evidence (approveController.ts):**
- Lines 268-296: Audit Service TODO with example payload but no actual call
- Lines 299-327: Notification Service TODO with template but no implementation

**Evidence (forecast.ts):**
- Lines 6-16: Comment says "For MVP, we'll use simple heuristic"
- Lines 122-155: Full AWS Forecast API example commented out

**Subtotal:** 28 hours

---

### Critical Integrations Summary
| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 0.1 Drug Safety (FDB) | 3 | P0 Critical | 24 |
| 0.2 Mobile Video (Twilio) | 3 | P0 Critical | 26 |
| 0.3 AI Transcription | 2 | P1 High | 24 |
| 0.4 Mobile QR Camera | 2 | P1 High | 12 |
| 0.5 Service Integration TODOs | 4 | P1 High | 28 |
| **Subtotal** | **14** | | **114 hours** |

---

## PART A: DEVELOPMENT TASKS (52 tasks + 32 NEW APP TASKS = 84 tasks)

### ⚠️ NEWLY DISCOVERED: Missing Mobile Apps

**The following mobile apps DO NOT EXIST but have backend services:**
- `mobile/delivery-app/` - NOT CREATED (backend delivery-service exists)
- `mobile/nurse-app/` - NOT CREATED (backend nurse-service exists)

---

### Phase 5.5: Delivery Personnel Mobile App (16 tasks)
**Priority:** P1 (High)
**Status:** APP DOES NOT EXIST - Backend service ready, mobile app not built
**Discovery:** Code audit found no delivery-app folder in mobile/

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-056 | Initialize Delivery App with React Native | App structure, navigation, build configs | 4 |
| T2-057 | Create Delivery Auth screens (Login, Profile) | HIN e-ID integration, session management | 6 |
| T2-058 | Create Delivery Request List screen | View pending/active deliveries, filters, search | 6 |
| T2-059 | Create Delivery Request Detail screen | Full delivery info, patient details, medications | 4 |
| T2-060 | Implement delivery acceptance workflow | Accept/reject requests, status updates | 6 |
| T2-061 | Integrate GPS tracking and location services | Real-time location updates, background tracking | 8 |
| T2-062 | Implement route optimization display | Show optimized route on map, turn-by-turn | 6 |
| T2-063 | Create QR code scanner for delivery verification | Scan package QR, verify contents | 6 |
| T2-064 | Implement proof of delivery capture | Signature capture, photo upload, timestamps | 6 |
| T2-065 | Create delivery status update workflow | Status transitions with notifications | 4 |
| T2-066 | Implement special handling alerts (controlled substances) | Cold chain, narcotics, signature requirements | 4 |
| T2-067 | Create earnings/statistics dashboard | Daily/weekly earnings, delivery stats | 4 |
| T2-068 | Implement offline mode with sync queue | Work offline, sync when connected | 8 |
| T2-069 | Create delivery API client | Connect to delivery-service backend | 4 |
| T2-070 | Create Redux store for delivery state | State management, persistence | 4 |
| T2-071 | Write unit tests for Delivery App | 80% coverage target | 8 |

**Subtotal:** 88 hours

---

### Phase 5.6: Nurse Mobile App (16 tasks)
**Priority:** P1 (High)
**Status:** APP DOES NOT EXIST - Backend service ready, mobile app not built
**Discovery:** Code audit found no nurse-app folder in mobile/

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-072 | Initialize Nurse App with React Native | App structure, navigation, build configs | 4 |
| T2-073 | Create Nurse Auth screens (HIN e-ID, MFA) | Healthcare credential login, MFA enforcement | 6 |
| T2-074 | Create Patient Search screen | Search by name, ID, room number | 4 |
| T2-075 | Create Patient Medication List screen | View patient's current medications, schedules | 6 |
| T2-076 | Implement medication ordering workflow | Order medications for patients from pharmacy | 8 |
| T2-077 | Create Pharmacy Patient Records access screen | View authorized patient records, history | 6 |
| T2-078 | Implement medication administration recording | Log given medications, dosages, times | 6 |
| T2-079 | Create side effect/reaction reporting | Log and report adverse reactions | 4 |
| T2-080 | Implement delivery tracking for nurses | Track medication deliveries, ETAs | 4 |
| T2-081 | Create Nurse-Pharmacist messaging | Secure communication, prescription clarification | 6 |
| T2-082 | Implement shift handover notes | Transfer patient info between shifts | 4 |
| T2-083 | Create medication schedule reminders | Push notifications for medication times | 4 |
| T2-084 | Implement barcode scanning for medication verification | Scan medication barcode, verify patient match | 6 |
| T2-085 | Create Nurse API client | Connect to nurse-service backend | 4 |
| T2-086 | Create Redux store for nurse state | State management, persistence | 4 |
| T2-087 | Write unit tests for Nurse App | 80% coverage target | 8 |

**Subtotal:** 84 hours

---

### Phase 6.1: Shared Mobile Components (10 tasks)
**Priority:** P1 (High)
**Original Tasks:** T222-T231

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-001 | Create RootNavigator with auth state management | Navigator switches between Auth/Main stacks based on token | 4 |
| T2-002 | Create AuthNavigator (Login, Register, ForgotPassword) | All auth screens accessible, proper transitions | 3 |
| T2-003 | Create MainNavigator with bottom tabs | Tab navigation for each app role | 4 |
| T2-004 | Create reusable Button component (primary, secondary, outline, disabled states) | All variants styled per design system | 2 |
| T2-005 | Create reusable Input component (text, password, email, phone, with validation) | Real-time validation feedback, error states | 3 |
| T2-006 | Create reusable Card component (prescription, product, consultation cards) | Consistent styling, pressable variants | 2 |
| T2-007 | Create Loading component (full screen, inline, skeleton) | Multiple loading states available | 2 |
| T2-008 | Create ErrorBoundary component with fallback UI | Catches JS errors, shows friendly message, reports to Sentry | 3 |
| T2-009 | Create API client utility with offline queue | Requests queued when offline, synced when online | 6 |
| T2-010 | Create secure storage utility (encrypted AsyncStorage wrapper) | Data encrypted at rest, biometric unlock option | 4 |

**Subtotal:** 33 hours

---

### Phase 6.2: Shared Web Components (9 tasks)
**Priority:** P2 (Medium)
**Original Tasks:** T232-T240
**Status:** Partially complete - some components exist

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-011 | Create AppShell layout component | Consistent header, sidebar, main content areas | 4 |
| T2-012 | Create responsive NavigationMenu component | Collapses on mobile, role-based menu items | 4 |
| T2-013 | Create DataGrid component with sorting, filtering, pagination | Handles large datasets, column customization | 8 |
| T2-014 | Create Modal component (confirm, form, info variants) | Accessible, keyboard navigation, focus trap | 3 |
| T2-015 | Create Form components (FormField, FormGroup, FormError) | Integrates with react-hook-form, validation | 4 |
| T2-016 | Create ErrorPage component (404, 500, maintenance) | User-friendly messages, retry buttons | 2 |
| T2-017 | Create LoadingPage component (full page skeleton) | Smooth transitions, branded loading | 2 |
| T2-018 | Create API hooks utility (useQuery, useMutation wrappers) | Consistent error handling, loading states | 4 |
| T2-019 | Configure React Router with role-based routes | Protected routes, role guards, lazy loading | 4 |

**Subtotal:** 35 hours

---

### Phase 6.3: Security & Compliance (10 tasks)
**Priority:** P0 (Critical)
**Original Tasks:** T241-T250

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-020 | Implement Content Security Policy (CSP) headers | CSP headers on all responses, no inline scripts | 4 |
| T2-021 | Configure Helmet.js for Express security headers | All OWASP recommended headers enabled | 2 |
| T2-022 | Implement XSS prevention (input sanitization, output encoding) | All user inputs sanitized, HTML escaped | 4 |
| T2-023 | Implement SQL injection prevention audit | Parameterized queries verified, no string concatenation | 4 |
| T2-024 | Configure SSL/TLS certificates (Let's Encrypt automation) | Auto-renewal, HTTPS enforced, HSTS enabled | 4 |
| T2-025 | Create HIPAA compliance checklist and documentation | All 18 HIPAA identifiers mapped, controls documented | 8 |
| T2-026 | Create GDPR compliance documentation | Data processing agreements, privacy policy, DPO contact | 6 |
| T2-027 | Implement security audit logging (all PHI access logged) | Immutable audit trail, 7-year retention | 6 |
| T2-028 | Configure vulnerability scanning (npm audit, Snyk) | CI/CD blocks on high/critical vulnerabilities | 4 |
| T2-029 | Implement rate limiting on all public endpoints | Rate limits enforced, 429 responses, IP blocking | 4 |

**Subtotal:** 46 hours

---

### Phase 6.4: Monitoring & Observability (7 tasks)
**Priority:** P2 (Medium)
**Original Tasks:** T251-T257

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-030 | Configure CloudWatch logging for all services | Structured logs, log groups per service, retention policies | 4 |
| T2-031 | Create Grafana dashboards for key metrics | Service health, latency, error rates, business metrics | 6 |
| T2-032 | Configure Prometheus metrics collection | Custom metrics exposed, scrape configs | 4 |
| T2-033 | Implement comprehensive health check endpoints | Deep health checks (DB, Redis, external services) | 4 |
| T2-034 | Configure distributed tracing (OpenTelemetry) | Request tracing across all services, Jaeger UI | 6 |
| T2-035 | Create alerting rules (PagerDuty/Slack integration) | Critical alerts page, warning alerts notify | 4 |
| T2-036 | Configure Sentry for error tracking | Source maps uploaded, error grouping, user context | 3 |

**Subtotal:** 31 hours

---

### Phase 6.5: Documentation (6 tasks)
**Priority:** P2 (Medium)
**Original Tasks:** T258-T263
**Status:** Partially complete - README exists

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-037 | Generate API documentation (Swagger/OpenAPI) | All endpoints documented, examples, try-it-out | 8 |
| T2-038 | Create developer onboarding guide | Setup instructions, architecture overview, conventions | 4 |
| T2-039 | Create deployment guide (AWS, Docker, Kubernetes) | Step-by-step deployment, rollback procedures | 6 |
| T2-040 | Create troubleshooting guide | Common issues, debugging steps, support contacts | 4 |
| T2-041 | Create architecture diagrams (C4 model) | Context, container, component diagrams | 4 |
| T2-042 | Create user guides for each role (Patient, Pharmacist, Doctor) | Feature walkthroughs, screenshots, FAQs | 8 |

**Subtotal:** 34 hours

---

### Phase 6.6: Performance Optimization (6 tasks)
**Priority:** P3 (Low)
**Original Tasks:** T264-T269

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-043 | Implement Redis caching for frequently accessed data | Cache hit ratio >80%, TTL configured | 6 |
| T2-044 | Optimize database queries with indexes | Query analysis, composite indexes, EXPLAIN plans | 6 |
| T2-045 | Implement pagination for all list endpoints | Cursor-based pagination, page size limits | 4 |
| T2-046 | Configure CDN for static assets (CloudFront) | Assets served from edge, cache headers | 4 |
| T2-047 | Implement lazy loading in mobile apps | Screens load on demand, reduced initial bundle | 4 |
| T2-048 | Implement code splitting in web app | Route-based splitting, vendor chunks, bundle analysis | 4 |

**Subtotal:** 28 hours

---

### Phase 6.7: User Experience (7 tasks)
**Priority:** P1 (High)
**Original Tasks:** T270-T276

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| T2-049 | Implement loading states for all async operations | Skeleton screens, progress indicators, no blank states | 6 |
| T2-050 | Create user-friendly error messages (no technical jargon) | All errors have actionable messages, retry options | 4 |
| T2-051 | Implement success notifications (toast/snackbar) | Consistent success feedback, auto-dismiss | 3 |
| T2-052 | Add real-time form validation with feedback | Inline validation, error messages, success indicators | 4 |
| T2-053 | Implement accessibility features (WCAG 2.1 AA) | Screen reader support, keyboard navigation, contrast | 8 |
| T2-054 | Add dark mode support for mobile apps | System preference detection, manual toggle | 6 |
| T2-055 | Create onboarding tutorials for new users | Interactive walkthroughs, skip option, progress | 6 |

**Subtotal:** 37 hours

---

## PART B: E2E TEST TASKS (37 tasks)

### E2E 1: Teleconsultation Tests (4 tasks)
**Priority:** P0 (Critical)
**Original Tasks:** T175-T178 (from tasks.md - not implemented)

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-001 | Patient teleconsultation booking workflow E2E | Book appointment, receive confirmation, reminders | 4 |
| E2E-002 | Video call session E2E (join, audio/video, leave) | WebRTC connection, media controls, graceful disconnect | 6 |
| E2E-003 | Twilio Video integration test | Token generation, room creation, participant management | 4 |
| E2E-004 | Teleconsultation load test (100 concurrent calls) | System handles 100 concurrent video sessions | 6 |

**Subtotal:** 20 hours

---

### E2E 2: Enable Skipped Backend Tests (3 tasks)
**Priority:** P1 (High)
**Status:** Tests exist but are skipped (describe.skip)

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-005 | Enable inventory-scanning.test.ts | Configure test environment, remove skip, all tests pass | 4 |
| E2E-006 | Enable prescription-review.test.ts | Configure test environment, remove skip, all tests pass | 4 |
| E2E-007 | Enable prescription-upload.test.ts | Configure test environment, remove skip, all tests pass | 4 |

**Subtotal:** 12 hours

---

### E2E 3: Delivery Personnel App Tests (8 tasks)
**Priority:** P1 (High)
**Status:** No tests exist - app functionality untested

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-008 | Delivery personnel authentication E2E | Login, session management, logout | 3 |
| E2E-009 | Delivery request list and filtering E2E | View requests, filter by status/date/area | 3 |
| E2E-010 | Delivery request acceptance workflow E2E | Accept request, update status, confirm pickup | 4 |
| E2E-011 | GPS tracking and route optimization E2E | Real-time location, optimized route display | 4 |
| E2E-012 | QR code scanning for delivery verification E2E | Scan package QR, verify contents, confirm delivery | 4 |
| E2E-013 | Proof of delivery workflow E2E | Capture signature, photo, recipient confirmation | 4 |
| E2E-014 | Delivery status updates E2E | Status transitions, customer notifications | 3 |
| E2E-015 | Delivery personnel earnings/stats E2E | View earnings, delivery stats, performance metrics | 3 |

**Subtotal:** 28 hours

---

### E2E 4: Nurse App Tests (6 tasks)
**Priority:** P1 (High)
**Status:** No tests exist - app functionality untested

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-016 | Nurse authentication E2E (HIN e-ID) | Login with healthcare credentials, MFA | 3 |
| E2E-017 | Patient medication ordering E2E | Search patient, view medications, place order | 4 |
| E2E-018 | Pharmacy patient records access E2E | View authorized patient records, medication history | 4 |
| E2E-019 | Delivery tracking for nurses E2E | Track medication deliveries, receive updates | 3 |
| E2E-020 | Nurse-pharmacist messaging E2E | Secure communication, prescription clarification | 3 |
| E2E-021 | Medication administration recording E2E | Record administration, log side effects | 4 |

**Subtotal:** 21 hours

---

### E2E 5: Multi-Role Integration Tests (6 tasks)
**Priority:** P2 (Medium)
**Status:** Cross-role workflows not tested

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-022 | Doctor prescribes -> Pharmacist receives -> Patient notified | End-to-end prescription flow across 3 roles | 6 |
| E2E-023 | Patient uploads prescription -> Pharmacist reviews -> Patient receives | Upload to delivery workflow | 5 |
| E2E-024 | Pharmacist creates teleconsultation -> Patient joins -> Notes saved | Complete teleconsultation workflow | 5 |
| E2E-025 | Inventory alert -> Pharmacist reorders -> Stock updated | Inventory management cycle | 4 |
| E2E-026 | RBAC enforcement E2E (role cannot access other role's data) | Permission boundaries verified for all roles | 6 |
| E2E-027 | Concurrent user scenarios (multiple users same resource) | Race condition handling, optimistic locking | 5 |

**Subtotal:** 31 hours

---

### E2E 6: Performance & Load Tests (5 tasks)
**Priority:** P2 (Medium)
**Status:** Some exist, gaps identified

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-028 | Web portal concurrent users load test (500 users) | Response time <2s at 500 concurrent users | 6 |
| E2E-029 | Mobile app stress test (rapid actions, memory) | No crashes, memory stable, responsive UI | 5 |
| E2E-030 | Database stress test (high write throughput) | 1000 writes/sec without degradation | 5 |
| E2E-031 | API gateway rate limiting verification | Rate limits enforced correctly, 429 responses | 3 |
| E2E-032 | Service recovery test (kill service, verify restart) | Auto-recovery, no data loss, alerts triggered | 4 |

**Subtotal:** 23 hours

---

### E2E 7: Security E2E Tests (5 tasks)
**Priority:** P0 (Critical)
**Status:** Security testing not automated

| Task ID | Description | Acceptance Criteria | Est. Hours |
|---------|-------------|---------------------|------------|
| E2E-033 | Authentication bypass attempt tests | All bypass attempts blocked, logged | 4 |
| E2E-034 | Authorization escalation attempt tests | Users cannot access higher privilege resources | 4 |
| E2E-035 | Data encryption verification E2E | PHI encrypted at rest and in transit | 4 |
| E2E-036 | Audit trail completeness E2E | All PHI access logged, immutable, queryable | 4 |
| E2E-037 | Session management security E2E | Token expiry, refresh, concurrent session limits | 4 |

**Subtotal:** 20 hours

---

## Summary

### ⚠️ Critical Integration Tasks (14 tasks) - DISCOVERED IN CODE AUDIT
| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 0.1 Drug Safety (FDB API) | 3 | P0 Critical | 24 |
| 0.2 Mobile Video (Twilio SDK) | 3 | P0 Critical | 26 |
| 0.3 AI Transcription | 2 | P1 High | 24 |
| 0.4 Mobile QR Camera | 2 | P1 High | 12 |
| 0.5 Service Integration TODOs | 4 | P1 High | 28 |
| **Subtotal** | **14** | | **114 hours** |

### ⚠️ Missing Mobile Apps (32 tasks) - DISCOVERED IN CODE AUDIT
| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 5.5 Delivery Personnel App | 16 | P1 High | 88 |
| 5.6 Nurse Mobile App | 16 | P1 High | 84 |
| **Subtotal** | **32** | | **172 hours** |

### Development Tasks (52 tasks - Original Phase 6)
| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 6.1 Shared Mobile Components | 10 | P1 High | 33 |
| 6.2 Shared Web Components | 9 | P2 Medium | 35 |
| 6.3 Security & Compliance | 10 | P0 Critical | 46 |
| 6.4 Monitoring & Observability | 7 | P2 Medium | 31 |
| 6.5 Documentation | 6 | P2 Medium | 34 |
| 6.6 Performance Optimization | 6 | P3 Low | 28 |
| 6.7 User Experience | 7 | P1 High | 37 |
| **Subtotal** | **55** | | **244 hours** |

### E2E Test Tasks (37 tasks)
| Category | Tasks | Priority | Est. Hours |
|----------|-------|----------|------------|
| E2E 1 Teleconsultation Tests | 4 | P0 Critical | 20 |
| E2E 2 Enable Skipped Tests | 3 | P1 High | 12 |
| E2E 3 Delivery App Tests | 8 | P1 High | 28 |
| E2E 4 Nurse App Tests | 6 | P1 High | 21 |
| E2E 5 Multi-Role Integration | 6 | P2 Medium | 31 |
| E2E 6 Performance Tests | 5 | P2 Medium | 23 |
| E2E 7 Security Tests | 5 | P0 Critical | 20 |
| **Subtotal** | **37** | | **155 hours** |

### Grand Total
- **Total Tasks:** 135 (was 103 before discovering missing apps)
- **Total Estimated Hours:** 685 hours (~86 work days / 17 weeks)
- **Critical Path (P0):** 6 tasks blocking production (FDB + Mobile Video)
- **Major Discovery:** 2 entire mobile apps don't exist (Delivery + Nurse)

### Priority Breakdown
| Priority | Tasks | Hours | % of Total |
|----------|-------|-------|------------|
| P0 Critical | 25 | 160 | 23% |
| P1 High | 80 | 401 | 59% |
| P2 Medium | 24 | 96 | 14% |
| P3 Low | 6 | 28 | 4% |

### Recommended Execution Order (UPDATED)

**PHASE 1: Production Blockers (Weeks 1-3)**
1. **INT-001 to INT-003:** FDB Drug Interactions API (P0) - 24h
2. **INT-004 to INT-006:** Mobile Twilio Video SDK (P0) - 26h
3. **T2-020 to T2-029:** Security & Compliance (P0) - 46h

**PHASE 2: Core Functionality (Weeks 4-6)**
4. **INT-007 to INT-010:** AI Transcription + Mobile QR Camera (P1) - 36h
5. **INT-011 to INT-014:** Service Integration TODOs (P1) - 28h
6. **E2E-001 to E2E-004:** Teleconsultation E2E Tests (P0) - 20h

**PHASE 3: Missing Mobile Apps (Weeks 7-11) - NEW**
7. **T2-056 to T2-071:** Delivery Personnel Mobile App (P1) - 88h
8. **T2-072 to T2-087:** Nurse Mobile App (P1) - 84h

**PHASE 4: Polish & Components (Weeks 12-14)**
9. **T2-001 to T2-010:** Shared Mobile Components (P1) - 33h
10. **T2-049 to T2-055:** User Experience (P1) - 37h
11. **E2E-005 to E2E-021:** Enable Skipped + App Tests (P1) - 61h

**PHASE 5: Hardening (Weeks 15-17)**
12. **T2-011 to T2-019:** Shared Web Components (P2) - 35h
13. **T2-030 to T2-042:** Monitoring + Documentation (P2) - 65h
14. **E2E-022 to E2E-037:** Integration + Security Tests (P2) - 74h
15. **T2-043 to T2-048:** Performance Optimization (P3) - 28h

---

## Code Audit Findings Summary

**What's ACTUALLY Complete:**
- ✅ Prescription upload to S3
- ✅ AWS Textract OCR integration
- ✅ Teleconsultation booking with conflict detection
- ✅ Inventory stock tracking and alerts
- ✅ Web Twilio Video (full SDK)
- ✅ Backend QR code parsing
- ✅ Backend delivery-service
- ✅ Backend nurse-service

**What's STUB/MOCK (was reported as complete):**
- ❌ FDB Drug Interactions (hardcoded 5 drug pairs)
- ❌ Mobile Twilio Video (setTimeout simulation)
- ❌ Speech-to-Text transcription (hardcoded response)
- ❌ Mobile QR Camera (no camera component)
- ❌ AWS Forecast (heuristic only)
- ❌ Audit/Notification service integrations (TODO comments)

**What's COMPLETELY MISSING (not even started):**
- ❌ Delivery Personnel Mobile App (mobile/delivery-app/) - 16 tasks, 88 hours
- ❌ Nurse Mobile App (mobile/nurse-app/) - 16 tasks, 84 hours

**Corrected Implementation Status: ~55% (was incorrectly reported as 80%)**
- Original assessment missed 2 entire mobile apps that don't exist

---

*Last Updated: 2025-11-25*
*Generated by BAZINGA Orchestration System + Deep Code Audit*
