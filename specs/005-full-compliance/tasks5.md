# MetaPharm Connect - Phase 5: Full Specification Compliance

**Version:** 1.0.0
**Date:** 2025-12-02
**Target:** 100% CDC_Final.md Compliance
**Estimated Effort:** 19-28 weeks

---

## Overview

This task list addresses all gaps identified in the Gap Analysis to achieve full compliance with the initial UX/UI specification (CDC_Final.md). Tasks are organized by priority and dependency.

---

## Priority Legend

- **P0 - CRITICAL**: Must have for Swiss healthcare compliance/launch
- **P1 - HIGH**: Required for MVP functionality
- **P2 - MEDIUM**: Important for complete user experience
- **P3 - LOW**: Nice to have, can be post-launch

---

# SECTION A: CRITICAL SWISS HEALTHCARE INTEGRATIONS (P0)

## A1. HIN e-ID Authentication Integration

> **Spec Reference:** "Connexion e‑ID (prestataire HIN en Suisse)" for doctors

### T5-001: HIN OAuth2/SAML Provider Research & Setup
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Research HIN (Health Info Net) authentication specifications
- Obtain HIN developer credentials and sandbox access
- Document OAuth2 flow for healthcare professionals
- Identify required certificates and security requirements

**Technical Details:**
- Contact HIN AG for API access (https://www.hin.ch)
- Review HIN Connect technical documentation
- Set up HIN sandbox environment
- Document SAML vs OAuth2 trade-offs

**Acceptance Criteria:**
- [ ] HIN sandbox credentials obtained
- [ ] Authentication flow documented
- [ ] Certificate requirements identified
- [ ] Integration approach decided (OAuth2 recommended)

---

### T5-002: HIN Authentication Service Implementation
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** T5-001
- **Estimated:** 5 days

**Functional Requirements:**
- Implement HIN OAuth2 authorization code flow
- Support HIN identity token validation
- Extract healthcare professional credentials (GLN number)
- Handle HIN session management

**Technical Details:**
- Create `backend/services/auth-service/src/providers/hin-provider.ts`
- Implement OAuth2 authorization endpoint redirect
- Implement callback handler for token exchange
- Validate HIN JWT tokens with HIN public keys
- Store GLN (Global Location Number) in user profile

**Code Structure:**
```typescript
// hin-provider.ts
interface HINAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  publicKeyUrl: string;
}

interface HINUserInfo {
  hin_id: string;
  gln: string;  // Global Location Number
  role: 'doctor' | 'pharmacist' | 'nurse';
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
}
```

**Acceptance Criteria:**
- [ ] OAuth2 flow implemented and tested
- [ ] HIN token validation working
- [ ] GLN extraction functional
- [ ] Session management integrated
- [ ] Unit tests with mocked HIN responses

---

### T5-003: HIN Login UI for Doctor/Pharmacist Apps
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-002
- **Estimated:** 3 days

**Functional Requirements:**
- Add "Login with HIN" button to doctor app login screen
- Add "Login with HIN" option for pharmacist app
- Handle HIN redirect flow in mobile/web apps
- Display HIN verification badge on authenticated profiles

**Technical Details:**
- Update `web/src/apps/doctor/pages/LoginPage.tsx`
- Update `mobile/doctor-app/src/screens/DoctorAuthScreen.tsx`
- Implement deep linking for OAuth callback
- Add HIN badge component

**Acceptance Criteria:**
- [ ] HIN login button visible on doctor login
- [ ] OAuth redirect flow works on web
- [ ] Deep link callback works on mobile
- [ ] HIN badge displays for authenticated users
- [ ] E2E test for HIN login flow

---

### T5-004: HIN Integration E2E Tests
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-003
- **Estimated:** 2 days

**Functional Requirements:**
- Test complete HIN authentication flow
- Test token refresh and session expiry
- Test role-based access after HIN auth
- Test error scenarios (invalid credentials, network failure)

**Technical Details:**
- Create `e2e/tests/hin-authentication.spec.ts`
- Mock HIN endpoints for CI/CD
- Test with real HIN sandbox in staging

**Acceptance Criteria:**
- [ ] Happy path E2E test passing
- [ ] Token refresh test passing
- [ ] Error handling tests passing
- [ ] CI/CD integration with mocked HIN

---

## A2. Drug Interaction Checking System

> **Spec Reference:** "Vérifications IA (allergies, interactions)"

### T5-005: Drug Database API Integration Research
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 2 days

**Functional Requirements:**
- Research Swiss/European drug databases (Compendium.ch, FDB, DrugBank)
- Evaluate API pricing and data coverage
- Document drug interaction checking capabilities
- Identify allergy cross-reference data sources

**Technical Details:**
- Evaluate Compendium.ch API (Swiss official)
- Evaluate First Databank (FDB) European edition
- Review HCI Solutions drug database
- Document data formats (ATC codes, GTIN, etc.)

**Acceptance Criteria:**
- [ ] API options documented with pros/cons
- [ ] Pricing obtained for production use
- [ ] Data coverage assessed (Swiss medications)
- [ ] Recommendation made for primary provider

---

### T5-006: Drug Interaction Service Implementation
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** T5-005
- **Estimated:** 8 days

**Functional Requirements:**
- Check drug-drug interactions before prescription approval
- Check drug-allergy interactions based on patient profile
- Return severity levels (contraindicated, major, moderate, minor)
- Provide alternative medication suggestions
- Support Swiss ATC classification system

**Technical Details:**
- Create `backend/services/drug-interaction-service/`
- Implement drug database API client
- Create interaction checking algorithms
- Cache frequently queried interactions
- Support batch checking for multi-drug prescriptions

**Code Structure:**
```typescript
// drug-interaction.service.ts
interface InteractionCheck {
  drug1: DrugIdentifier;
  drug2: DrugIdentifier;
  patientAllergies?: string[];
}

interface InteractionResult {
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor' | 'none';
  description: string;
  clinicalEffects: string[];
  management: string;
  alternatives?: DrugSuggestion[];
  evidenceLevel: 'established' | 'theoretical' | 'case_report';
}

interface DrugIdentifier {
  atcCode?: string;  // Anatomical Therapeutic Chemical
  gtin?: string;     // Global Trade Item Number
  swissmedicNr?: string;
  name: string;
}
```

**API Endpoints:**
- `POST /api/interactions/check` - Check single interaction
- `POST /api/interactions/check-prescription` - Check all drugs in prescription
- `GET /api/interactions/drug/:id/interactions` - Get all known interactions
- `GET /api/interactions/alternatives/:drugId` - Get safer alternatives

**Acceptance Criteria:**
- [ ] Drug database API integrated
- [ ] Interaction checking returns accurate results
- [ ] Allergy cross-checking functional
- [ ] Severity classification correct
- [ ] Alternative suggestions working
- [ ] Response time < 500ms for single check
- [ ] Unit tests with known interaction pairs

---

### T5-007: Integration with Prescription Validation
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-006
- **Estimated:** 3 days

**Functional Requirements:**
- Auto-check interactions when prescription is submitted
- Block contraindicated combinations
- Warn pharmacist of major interactions
- Log all interaction checks for audit
- Allow pharmacist override with documentation

**Technical Details:**
- Update `backend/services/prescription-service/src/services/prescription.service.ts`
- Add interaction check step in validation pipeline
- Create interaction alert UI component
- Implement override workflow with reason capture

**Acceptance Criteria:**
- [ ] Automatic interaction check on prescription submit
- [ ] Contraindicated drugs blocked with explanation
- [ ] Major interaction warnings displayed
- [ ] Pharmacist can override with documented reason
- [ ] All checks logged for audit

---

### T5-008: Allergy Profile Management
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-006
- **Estimated:** 3 days

**Functional Requirements:**
- Allow patients to record allergies in profile
- Support drug class allergies (e.g., "penicillins")
- Support ingredient allergies (e.g., "lactose")
- Cross-reference allergies during interaction check
- Alert on potential cross-allergies

**Technical Details:**
- Update `backend/services/user-service/src/models/Patient.ts`
- Add allergy management endpoints
- Create allergy entry UI in patient app
- Integrate with drug interaction service

**API Endpoints:**
- `GET /api/patients/:id/allergies` - Get patient allergies
- `POST /api/patients/:id/allergies` - Add allergy
- `DELETE /api/patients/:id/allergies/:allergyId` - Remove allergy
- `GET /api/allergies/search?q=` - Search allergy database

**Acceptance Criteria:**
- [ ] Patients can add/remove allergies
- [ ] Drug class allergies supported
- [ ] Ingredient allergies supported
- [ ] Cross-allergy detection working
- [ ] Allergies checked during prescription validation

---

### T5-009: Drug Interaction UI Components
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-007
- **Estimated:** 3 days

**Functional Requirements:**
- Display interaction alerts in prescription review
- Show severity with color coding (red/orange/yellow)
- Provide detailed interaction information modal
- Show alternative medication suggestions
- Allow pharmacist to acknowledge/override

**Technical Details:**
- Create `web/src/shared/components/InteractionAlert.tsx`
- Create `web/src/shared/components/AlternativeSuggestions.tsx`
- Update PrescriptionReview page with interaction display
- Add interaction badge to drug list items

**Acceptance Criteria:**
- [ ] Interaction alerts display prominently
- [ ] Color coding matches severity
- [ ] Detail modal shows clinical information
- [ ] Alternatives are clickable to substitute
- [ ] Override requires confirmation and reason

---

## A3. e-santé Cantonal Health Records Integration

> **Spec Reference:** "Proposition de synchronisation avec dossier médical cantonal (API e‑santé)"

### T5-010: Swiss EPD (Electronic Patient Dossier) Research
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Research Swiss EPD technical specifications
- Identify cantonal platform APIs (CARA, MonDossierMedical, etc.)
- Document IHE XDS.b profile requirements
- Understand consent management requirements
- Map MetaPharm data to EPD document types

**Technical Details:**
- Review eHealth Suisse technical specifications
- Study IHE (Integrating the Healthcare Enterprise) profiles
- Document HL7 FHIR requirements
- Identify certification requirements

**Acceptance Criteria:**
- [ ] EPD technical specs documented
- [ ] Cantonal API differences mapped
- [ ] IHE profile requirements understood
- [ ] Certification path identified
- [ ] Data mapping document created

---

### T5-011: EPD Connector Service Implementation
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** T5-010
- **Estimated:** 10 days

**Functional Requirements:**
- Connect to Swiss EPD infrastructure
- Query patient documents from EPD
- Submit pharmacy documents to EPD
- Handle patient consent verification
- Support multiple cantonal platforms

**Technical Details:**
- Expand `backend/services/esante-service/`
- Implement IHE XDS.b ITI-18 (Registry Stored Query)
- Implement IHE XDS.b ITI-43 (Retrieve Document Set)
- Implement IHE XDS.b ITI-41 (Provide and Register Document Set)
- Add cantonal adapter pattern for platform differences

**Code Structure:**
```typescript
// epd-connector.service.ts
interface EPDConfig {
  canton: SwissCanton;
  repositoryUrl: string;
  registryUrl: string;
  clientCertificate: Buffer;
  clientKey: Buffer;
}

interface EPDDocument {
  uniqueId: string;
  documentType: EPDDocumentType;
  creationTime: Date;
  author: EPDAuthor;
  confidentialityCode: 'normal' | 'restricted' | 'secret';
  content: Buffer;
  mimeType: string;
  languageCode: 'fr' | 'de' | 'it';
}

enum EPDDocumentType {
  PRESCRIPTION = '57833-6',      // LOINC code
  MEDICATION_LIST = '56445-0',
  ALLERGY_LIST = '48765-2',
  PHARMACY_DISPENSATION = '60593-1'
}
```

**API Endpoints:**
- `GET /api/epd/patient/:patientId/documents` - Query EPD documents
- `GET /api/epd/document/:documentId` - Retrieve specific document
- `POST /api/epd/document` - Submit document to EPD
- `GET /api/epd/patient/:patientId/consent` - Check consent status
- `POST /api/epd/patient/:patientId/consent/request` - Request consent

**Acceptance Criteria:**
- [ ] Can query documents from EPD test environment
- [ ] Can retrieve and display EPD documents
- [ ] Can submit pharmacy documents to EPD
- [ ] Consent verification working
- [ ] Multiple cantonal adapters functional
- [ ] Error handling for EPD unavailability

---

### T5-012: Patient EPD Consent Management UI
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-011
- **Estimated:** 4 days

**Functional Requirements:**
- Allow patients to link MetaPharm to their EPD
- Display EPD consent status
- Show which documents are shared
- Allow patients to revoke access
- Explain EPD benefits to patients

**Technical Details:**
- Create `web/src/apps/patient/features/epd/EPDLinkingScreen.tsx`
- Create `mobile/patient-app/src/screens/EPDSettingsScreen.tsx`
- Implement consent flow with cantonal redirect
- Add EPD status indicator to patient dashboard

**Acceptance Criteria:**
- [ ] Patients can initiate EPD linking
- [ ] Consent flow redirects to cantonal portal
- [ ] Callback updates consent status
- [ ] Patients can see shared documents
- [ ] Revocation flow works

---

### T5-013: EPD Document Viewing for Healthcare Providers
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-011
- **Estimated:** 3 days

**Functional Requirements:**
- Pharmacists can view patient EPD documents
- Doctors can access full EPD history
- Display documents based on confidentiality level
- Log all EPD access for audit
- Integrate EPD data with prescription workflow

**Technical Details:**
- Create `web/src/apps/pharmacist/features/epd/EPDViewer.tsx`
- Create `web/src/apps/doctor/features/epd/PatientEPDHistory.tsx`
- Implement document viewer for common formats (PDF, CDA)
- Add EPD access logging

**Acceptance Criteria:**
- [ ] Pharmacists can view relevant EPD documents
- [ ] Doctors can access full EPD history
- [ ] Confidentiality levels respected
- [ ] All access logged
- [ ] Documents display correctly

---

## A4. Voice Transcription AI Service

> **Spec Reference:** "Messages vocaux / appels transcrits"

### T5-014: Speech-to-Text Provider Selection
- **Priority:** P0
- **Complexity:** Low
- **Dependencies:** None
- **Estimated:** 1 day

**Functional Requirements:**
- Evaluate speech-to-text providers for Swiss languages
- Must support French, German, Italian
- Medical terminology accuracy required
- HIPAA/healthcare compliance needed

**Technical Details:**
- Evaluate: Google Cloud Speech-to-Text Medical
- Evaluate: Amazon Transcribe Medical
- Evaluate: Microsoft Azure Speech (Healthcare)
- Consider on-premise options for data residency

**Acceptance Criteria:**
- [ ] Providers evaluated for language support
- [ ] Medical accuracy tested
- [ ] Pricing compared
- [ ] Compliance verified
- [ ] Recommendation documented

---

### T5-015: Voice Transcription Service Implementation
- **Priority:** P0
- **Complexity:** High
- **Dependencies:** T5-014
- **Estimated:** 5 days

**Functional Requirements:**
- Transcribe voice recordings to text
- Support French, German, Italian
- Detect medical terminology
- Provide confidence scores
- Support real-time streaming transcription

**Technical Details:**
- Update `backend/services/voice-service/src/services/ai-transcription.service.ts`
- Implement provider adapter pattern
- Add medical vocabulary enhancement
- Implement streaming transcription via WebSocket
- Cache frequent medical terms

**Code Structure:**
```typescript
// ai-transcription.service.ts (replace stub)
interface TranscriptionConfig {
  provider: 'google' | 'aws' | 'azure';
  language: 'fr-CH' | 'de-CH' | 'it-CH';
  enableMedicalVocabulary: boolean;
  enablePunctuation: boolean;
  enableSpeakerDiarization: boolean;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  words: WordTiming[];
  medicalTerms: DetectedMedicalTerm[];
  speakers?: SpeakerSegment[];
  language: string;
  duration: number;
}

interface DetectedMedicalTerm {
  term: string;
  category: 'drug' | 'condition' | 'procedure' | 'anatomy';
  position: { start: number; end: number };
  standardizedForm?: string;  // ICD-10, ATC code, etc.
}
```

**Acceptance Criteria:**
- [ ] Transcription working for all 3 languages
- [ ] Medical terms detected and highlighted
- [ ] Confidence scores accurate
- [ ] Streaming transcription functional
- [ ] Response time acceptable (< 2x audio duration)

---

### T5-016: Voice Recording UI for Pharmacist
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-015
- **Estimated:** 3 days

**Functional Requirements:**
- Record voice notes during consultations
- Real-time transcription display
- Edit transcription if needed
- Attach to patient record
- Support hands-free recording

**Technical Details:**
- Create `web/src/apps/pharmacist/features/voice/VoiceRecorder.tsx`
- Implement WebRTC audio recording
- Add real-time transcription display
- Create transcription editor component
- Add to teleconsultation and prescription workflows

**Acceptance Criteria:**
- [ ] Voice recording works in browser
- [ ] Real-time transcription displays
- [ ] Transcription editable
- [ ] Can save to patient record
- [ ] Works during teleconsultation

---

### T5-017: Call Transcription for Phone Integrations
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** T5-015
- **Estimated:** 3 days

**Functional Requirements:**
- Transcribe phone calls with patients
- Transcribe voicemail messages
- Auto-tag important information (medication names, dosages)
- Searchable transcription history

**Technical Details:**
- Integrate with existing messaging-service
- Add transcription to voicemail workflow
- Implement call recording transcription
- Create search index for transcriptions

**Acceptance Criteria:**
- [ ] Voicemails auto-transcribed
- [ ] Phone calls can be recorded and transcribed
- [ ] Medical terms auto-tagged
- [ ] Transcriptions searchable
- [ ] Patient consent captured

---

---

# SECTION B: HIGH PRIORITY FEATURES (P1)

## B1. Patient Observance/Adherence Statistics

> **Spec Reference:** "observance (statistiques)" for doctors

### T5-018: Medication Adherence Tracking Service
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Track when patients pick up medications
- Calculate adherence rate (% of doses taken on time)
- Detect patterns (missed doses, early refills, gaps)
- Generate adherence reports for doctors
- Send reminders for upcoming doses

**Technical Details:**
- Create `backend/services/adherence-service/`
- Track dispensation dates vs expected schedule
- Calculate PDC (Proportion of Days Covered)
- Implement MPR (Medication Possession Ratio)
- Create adherence score algorithm

**Code Structure:**
```typescript
// adherence.service.ts
interface AdherenceMetrics {
  patientId: string;
  medicationId: string;
  period: { start: Date; end: Date };
  pdc: number;  // 0-1, Proportion of Days Covered
  mpr: number;  // 0-1, Medication Possession Ratio
  gapDays: number;
  earlyRefillDays: number;
  adherenceCategory: 'optimal' | 'moderate' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
}

interface AdherenceAlert {
  type: 'missed_refill' | 'gap_detected' | 'early_refill' | 'stockout_risk';
  severity: 'info' | 'warning' | 'critical';
  medicationName: string;
  daysOverdue?: number;
  recommendedAction: string;
}
```

**API Endpoints:**
- `GET /api/adherence/patient/:id` - Get patient adherence summary
- `GET /api/adherence/patient/:id/medication/:medId` - Get medication-specific adherence
- `GET /api/adherence/patient/:id/history` - Get adherence history over time
- `GET /api/adherence/alerts/patient/:id` - Get active adherence alerts

**Acceptance Criteria:**
- [ ] Adherence calculated from dispensation data
- [ ] PDC and MPR metrics accurate
- [ ] Alerts generated for missed refills
- [ ] Historical trends trackable
- [ ] API response < 200ms

---

### T5-019: Adherence Dashboard for Doctors
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-018
- **Estimated:** 4 days

**Functional Requirements:**
- Display patient adherence summary
- Show medication-specific adherence rates
- Visualize adherence trends over time
- Highlight patients with poor adherence
- Allow doctor to send adherence reminders

**Technical Details:**
- Create `web/src/apps/doctor/features/adherence/AdherenceDashboard.tsx`
- Create chart components for adherence visualization
- Add patient list sorted by adherence concern
- Implement reminder sending feature

**Acceptance Criteria:**
- [ ] Dashboard shows all patient adherence
- [ ] Charts display historical trends
- [ ] Poor adherence patients highlighted
- [ ] Can drill into individual medications
- [ ] Can send reminders from dashboard

---

### T5-020: Adherence Visualization for Patients
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-018
- **Estimated:** 3 days

**Functional Requirements:**
- Show patients their own adherence scores
- Gamify adherence (streaks, achievements)
- Provide tips for better adherence
- Allow medication reminders setup
- Integrate with VIP points system

**Technical Details:**
- Create `mobile/patient-app/src/screens/AdherenceScreen.tsx`
- Create streak/achievement components
- Add reminder scheduling UI
- Connect to VIP service for bonus points

**Acceptance Criteria:**
- [ ] Patients can see their adherence score
- [ ] Streaks encourage continued adherence
- [ ] Reminder scheduling works
- [ ] VIP points awarded for good adherence
- [ ] Tips displayed based on adherence patterns

---

## B2. Digital Twin Patient Profile

> **Spec Reference:** "création d'un jumeau numérique (dossier patient IA)"

### T5-021: Digital Twin Data Model Design
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Define comprehensive patient health profile
- Include: conditions, medications, allergies, vitals, lifestyle
- Support temporal data (history over time)
- Enable predictive health insights
- GDPR compliant data storage

**Technical Details:**
- Design digital twin schema
- Plan FHIR resource mapping
- Define AI feature extraction points
- Document privacy controls

**Data Model:**
```typescript
interface DigitalTwin {
  patientId: string;
  version: number;
  lastUpdated: Date;

  demographics: {
    age: number;
    sex: 'male' | 'female' | 'other';
    bloodType?: string;
    height?: number;
    weight?: number;
  };

  conditions: ChronicCondition[];
  medications: CurrentMedication[];
  allergies: Allergy[];
  vitalHistory: VitalReading[];
  labResults: LabResult[];

  lifestyle: {
    smokingStatus: 'never' | 'former' | 'current';
    alcoholUse: 'none' | 'occasional' | 'moderate' | 'heavy';
    exerciseLevel: 'sedentary' | 'light' | 'moderate' | 'active';
    dietType?: string;
  };

  riskScores: {
    cardiovascular: number;
    diabetes: number;
    drugInteraction: number;
    hospitalization: number;
  };

  predictions: HealthPrediction[];
}
```

**Acceptance Criteria:**
- [ ] Data model documented
- [ ] FHIR mapping complete
- [ ] Privacy controls defined
- [ ] Migration plan for existing patients

---

### T5-022: Digital Twin Service Implementation
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** T5-021
- **Estimated:** 8 days

**Functional Requirements:**
- Build and maintain digital twin for each patient
- Auto-populate from prescription/dispensation history
- Calculate health risk scores
- Generate personalized health predictions
- Update in real-time as new data arrives

**Technical Details:**
- Create `backend/services/digital-twin-service/`
- Implement data aggregation from multiple sources
- Add ML models for risk scoring
- Create prediction algorithms
- Implement versioning for twin updates

**Acceptance Criteria:**
- [ ] Digital twin created for existing patients
- [ ] Auto-population from history works
- [ ] Risk scores calculated
- [ ] Predictions generated
- [ ] Real-time updates functional

---

### T5-023: Digital Twin Visualization UI
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-022
- **Estimated:** 4 days

**Functional Requirements:**
- Display patient health profile overview
- Show risk scores with explanations
- Display health predictions timeline
- Allow patients to update lifestyle data
- Show how changes affect predictions

**Technical Details:**
- Create `mobile/patient-app/src/screens/DigitalTwinScreen.tsx`
- Create risk score visualization components
- Add prediction timeline chart
- Implement lifestyle questionnaire
- Add "what-if" simulation feature

**Acceptance Criteria:**
- [ ] Health profile displays clearly
- [ ] Risk scores explained simply
- [ ] Predictions shown as timeline
- [ ] Lifestyle data updatable
- [ ] What-if simulations work

---

## B3. Enhanced AI Prescription OCR

> **Spec Reference:** "Lecture automatique et transcription par IA"

### T5-024: Handwriting Recognition Improvement
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Improve recognition of handwritten French prescriptions
- Handle common abbreviations (cp, gel, inj, etc.)
- Recognize Swiss prescription formats
- Support multiple handwriting styles
- Learn from pharmacist corrections

**Technical Details:**
- Update `backend/services/prescription-service/src/services/ocr.service.ts`
- Train custom model on Swiss prescription dataset
- Implement abbreviation expansion
- Add confidence thresholds for human review
- Create feedback loop for corrections

**Acceptance Criteria:**
- [ ] >85% accuracy on handwritten prescriptions
- [ ] Abbreviations correctly expanded
- [ ] Swiss format recognized
- [ ] Low-confidence items flagged
- [ ] Corrections improve future accuracy

---

### T5-025: Prescription Photo Enhancement
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-024
- **Estimated:** 3 days

**Functional Requirements:**
- Auto-enhance prescription photos before OCR
- Correct lighting/contrast issues
- Detect and correct rotation/skew
- Crop to prescription area
- Remove background noise

**Technical Details:**
- Add image preprocessing pipeline
- Implement auto-crop with edge detection
- Add perspective correction
- Implement contrast enhancement
- Use OpenCV or similar library

**Acceptance Criteria:**
- [ ] Poor quality photos enhanced
- [ ] Auto-crop works reliably
- [ ] Rotation corrected
- [ ] Contrast optimized
- [ ] OCR accuracy improved by preprocessing

---

## B4. Kubernetes & Production Infrastructure

### T5-026: Kubernetes Manifests Creation
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 5 days

**Functional Requirements:**
- Create K8s deployments for all 24 services
- Configure horizontal pod autoscaling
- Set up ingress controllers
- Configure secrets management
- Implement health checks and liveness probes

**Technical Details:**
- Create `infrastructure/kubernetes/` directory
- Create deployment YAML for each service
- Configure ConfigMaps and Secrets
- Set up Ingress with TLS
- Create HPA configurations

**Acceptance Criteria:**
- [ ] All services have deployment manifests
- [ ] Autoscaling configured
- [ ] Ingress working with TLS
- [ ] Secrets managed securely
- [ ] Health checks operational

---

### T5-027: Monitoring & Alerting Setup
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-026
- **Estimated:** 4 days

**Functional Requirements:**
- Set up Prometheus for metrics collection
- Configure Grafana dashboards
- Implement alerting rules
- Monitor service health and performance
- Track business metrics (prescriptions, orders, etc.)

**Technical Details:**
- Deploy Prometheus operator
- Create Grafana dashboards
- Configure AlertManager
- Set up PagerDuty/Slack integration
- Implement custom metrics in services

**Acceptance Criteria:**
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards functional
- [ ] Alerts firing correctly
- [ ] On-call notifications working
- [ ] Business metrics tracked

---

### T5-028: Log Aggregation Setup
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-026
- **Estimated:** 3 days

**Functional Requirements:**
- Centralize logs from all services
- Enable log searching and filtering
- Set up log retention policies
- Create log-based alerts
- Ensure GDPR compliance (no PII in logs)

**Technical Details:**
- Deploy ELK stack (Elasticsearch, Logstash, Kibana) or Loki
- Configure Fluentd/Fluent Bit for log collection
- Create log parsing rules
- Set up index lifecycle management
- Implement log sanitization

**Acceptance Criteria:**
- [ ] All service logs centralized
- [ ] Search working in Kibana
- [ ] Retention policies active
- [ ] Log alerts configured
- [ ] PII sanitized from logs

---

---

# SECTION C: MEDIUM PRIORITY FEATURES (P2)

## C1. Advanced Route Optimization

### T5-029: ML-Based Route Optimization
- **Priority:** P2
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 6 days

**Functional Requirements:**
- Optimize delivery routes using ML
- Consider: patient availability windows, cold chain, controlled substances
- Minimize total delivery time
- Account for traffic patterns
- Re-optimize in real-time when issues arise

**Technical Details:**
- Update `backend/services/delivery-service/`
- Integrate Google OR-Tools or similar
- Implement constraint programming for special requirements
- Add ML model for travel time prediction
- Create re-optimization triggers

**Acceptance Criteria:**
- [ ] Routes 20%+ faster than naive approach
- [ ] Cold chain constraints respected
- [ ] Controlled substance timing met
- [ ] Real-time re-optimization works
- [ ] Driver app shows optimized route

---

### T5-030: Patient Availability Integration
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** T5-029
- **Estimated:** 3 days

**Functional Requirements:**
- Allow patients to set availability windows
- Factor availability into route optimization
- Notify patients of delivery windows
- Allow patients to reschedule
- Track delivery success rates by time slot

**Technical Details:**
- Add availability preferences to patient profile
- Update route optimizer to consider windows
- Create notification workflow for windows
- Add rescheduling UI

**Acceptance Criteria:**
- [ ] Patients can set availability
- [ ] Routes respect availability windows
- [ ] Patients notified of delivery time
- [ ] Rescheduling works
- [ ] Success rate improved

---

## C2. Behavioral AI & Personalization

### T5-031: User Behavior Tracking Service
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

**Technical Details:**
- Create `backend/services/analytics-service/`
- Implement event tracking
- Build user segmentation models
- Create churn prediction model
- Connect to recommendation engine

**Acceptance Criteria:**
- [ ] User events tracked
- [ ] Segments identified
- [ ] Churn risk calculated
- [ ] Data feeds recommendations
- [ ] GDPR compliance maintained

---

### T5-032: Personalized Recommendations Engine
- **Priority:** P2
- **Complexity:** High
- **Dependencies:** T5-031
- **Estimated:** 5 days

**Functional Requirements:**
- Recommend products based on purchase history
- Suggest health products based on conditions
- Recommend appointment times based on patterns
- Personalize notification timing
- A/B test recommendation strategies

**Technical Details:**
- Enhance `backend/services/order-service/src/services/recommendation.service.ts`
- Implement collaborative filtering
- Add content-based filtering
- Create hybrid recommendation model
- Implement A/B testing framework

**Acceptance Criteria:**
- [ ] Recommendations relevant to user
- [ ] Click-through rate improved
- [ ] Conversion rate improved
- [ ] A/B tests running
- [ ] Models updated regularly

---

## C3. Website Analytics Dashboard

### T5-033: Pharmacy Analytics Dashboard
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 4 days

**Functional Requirements:**
- Show pharmacy page visit statistics
- Track product view and conversion rates
- Monitor patient engagement metrics
- Compare performance over time
- Benchmark against anonymized averages

**Technical Details:**
- Create analytics dashboard in pharmacist app
- Implement analytics tracking pixel/SDK
- Build reporting backend
- Create visualization components

**Acceptance Criteria:**
- [ ] Visit statistics displayed
- [ ] Conversion tracking works
- [ ] Historical trends shown
- [ ] Benchmarking available
- [ ] Export reports possible

---

## C4. GDPR Full Compliance

### T5-034: Data Export Endpoint
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Functional Requirements:**
- Allow patients to export all their data
- Include all services (prescriptions, orders, messages, etc.)
- Format: JSON and PDF
- Include audit trail
- Complete within 24 hours

**Technical Details:**
- Create `backend/services/user-service/src/controllers/gdpr.controller.ts`
- Aggregate data from all services
- Generate PDF report
- Implement async processing for large exports

**API Endpoints:**
- `POST /api/gdpr/export/request` - Request data export
- `GET /api/gdpr/export/status/:requestId` - Check export status
- `GET /api/gdpr/export/download/:requestId` - Download export

**Acceptance Criteria:**
- [ ] All patient data included
- [ ] JSON export working
- [ ] PDF export working
- [ ] Audit trail included
- [ ] Completed within SLA

---

### T5-035: Right to Be Forgotten Implementation
- **Priority:** P2
- **Complexity:** High
- **Dependencies:** T5-034
- **Estimated:** 4 days

**Functional Requirements:**
- Allow patients to request account deletion
- Anonymize rather than delete where legally required
- Maintain audit trail with anonymized reference
- Notify patient of completion
- Handle data in all services

**Technical Details:**
- Implement deletion cascade across services
- Add anonymization for legally required data
- Create deletion verification workflow
- Implement notification on completion

**Acceptance Criteria:**
- [ ] Deletion request workflow complete
- [ ] Legal data anonymized
- [ ] Audit trail maintained
- [ ] Confirmation sent to patient
- [ ] All services cleared

---

## C5. Stock Prediction AI

### T5-036: Inventory Prediction Model
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
- Implement time series forecasting (ARIMA, Prophet)
- Add seasonality detection
- Create reorder point calculation
- Implement feedback loop

**Acceptance Criteria:**
- [ ] Predictions 80%+ accurate
- [ ] Stockouts reduced by 50%
- [ ] Seasonality captured
- [ ] Reorder suggestions accurate
- [ ] Model improves over time

---

---

# SECTION D: TESTING REQUIREMENTS (P1-P2)

## D1. Integration Tests for External APIs

### T5-037: HIN Authentication Integration Tests
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-002
- **Estimated:** 2 days

**Test Scenarios:**
- Valid HIN credentials → successful authentication
- Invalid credentials → proper error message
- Expired token → refresh flow triggered
- Network failure → graceful degradation
- Role extraction → correct role assigned

**Technical Details:**
- Create `backend/services/auth-service/src/__tests__/integration/hin.test.ts`
- Mock HIN endpoints for CI
- Test with HIN sandbox in staging

**Acceptance Criteria:**
- [ ] All scenarios covered
- [ ] Mocks realistic
- [ ] Tests pass in CI
- [ ] Sandbox tests documented

---

### T5-038: Drug Interaction API Integration Tests
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-006
- **Estimated:** 2 days

**Test Scenarios:**
- Known interaction → correct severity returned
- No interaction → "none" returned
- Unknown drug → graceful handling
- API timeout → cached response or error
- Batch checking → all interactions found

**Acceptance Criteria:**
- [ ] Known interactions tested
- [ ] Edge cases covered
- [ ] Performance tests included
- [ ] Cache behavior verified

---

### T5-039: e-santé API Integration Tests
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T5-011
- **Estimated:** 2 days

**Test Scenarios:**
- Document query → returns documents
- Document submit → accepted by registry
- Consent check → correct status returned
- No consent → access denied
- Cantonal adapter → correct endpoint called

**Acceptance Criteria:**
- [ ] All scenarios tested
- [ ] Cantonal differences covered
- [ ] Error handling verified
- [ ] Timeout handling tested

---

## D2. Load & Performance Tests

### T5-040: Prescription Processing Load Test
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Test Scenarios:**
- 100 concurrent prescription uploads
- 1000 prescriptions/hour processing
- OCR service under load
- Validation pipeline performance
- Database query performance

**Technical Details:**
- Use k6 or Artillery for load testing
- Create realistic prescription data
- Measure response times and error rates
- Identify bottlenecks

**Acceptance Criteria:**
- [ ] 100 concurrent uploads handled
- [ ] P95 response time < 5s
- [ ] Error rate < 1%
- [ ] Bottlenecks identified and documented

---

### T5-041: Real-time Delivery Tracking Load Test
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 2 days

**Test Scenarios:**
- 500 concurrent delivery tracking sessions
- GPS update frequency (every 5s)
- WebSocket connection stability
- Database write performance

**Acceptance Criteria:**
- [ ] 500 concurrent sessions handled
- [ ] GPS updates < 100ms latency
- [ ] WebSocket stable for 1+ hour
- [ ] No data loss under load

---

### T5-042: Messaging Throughput Test
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 2 days

**Test Scenarios:**
- 1000 messages/minute
- File attachments (images, PDFs)
- WhatsApp webhook processing
- Message encryption overhead

**Acceptance Criteria:**
- [ ] 1000 msg/min processed
- [ ] Attachments handled
- [ ] Webhooks processed in order
- [ ] Encryption adds < 50ms

---

## D3. Security Tests

### T5-043: OWASP Top 10 Security Scan
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Test Areas:**
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Logging Failures
- A10: SSRF

**Technical Details:**
- Run OWASP ZAP automated scan
- Manual penetration testing for critical areas
- Dependency vulnerability scan (npm audit, Snyk)
- Document and remediate findings

**Acceptance Criteria:**
- [ ] ZAP scan completed
- [ ] Critical vulnerabilities fixed
- [ ] Dependency vulnerabilities addressed
- [ ] Security report generated

---

### T5-044: Data Encryption Verification
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 2 days

**Test Areas:**
- Data at rest encryption (database)
- Data in transit encryption (TLS)
- End-to-end message encryption
- Encryption key management
- PII handling

**Acceptance Criteria:**
- [ ] All data encrypted at rest
- [ ] TLS 1.3 enforced
- [ ] E2E encryption verified
- [ ] Key rotation tested
- [ ] PII handling documented

---

## D4. Accessibility Tests

### T5-045: WCAG 2.1 AA Compliance Audit
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 3 days

**Test Areas:**
- Color contrast ratios
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Form labels and errors
- Alternative text

**Technical Details:**
- Use axe-core for automated testing
- Manual testing with screen readers (NVDA, VoiceOver)
- Test all critical user journeys
- Document and fix issues

**Acceptance Criteria:**
- [ ] Automated scan passes
- [ ] Screen reader testing complete
- [ ] Keyboard navigation works
- [ ] Critical issues fixed
- [ ] Compliance report generated

---

## D5. E2E Journey Tests

### T5-046: Full Prescription Lifecycle E2E Test
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 3 days

**Journey Steps:**
1. Patient uploads prescription photo
2. OCR transcribes prescription
3. System checks drug interactions
4. Pharmacist reviews and approves
5. Order created and payment processed
6. Delivery assigned and tracked
7. Patient receives medication
8. Adherence tracking begins

**Acceptance Criteria:**
- [ ] Full journey automated
- [ ] All services integrated
- [ ] Error scenarios covered
- [ ] Data consistency verified

---

### T5-047: Complete Teleconsultation E2E Test
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** None
- **Estimated:** 3 days

**Journey Steps:**
1. Patient books teleconsultation
2. Reminders sent
3. Both parties join video call
4. Pharmacist takes notes (voice transcription)
5. Prescription created during call
6. Follow-up scheduled
7. Recording saved (with consent)

**Acceptance Criteria:**
- [ ] Booking to completion automated
- [ ] Video call tested
- [ ] Voice transcription verified
- [ ] Prescription creation works
- [ ] Recording saved correctly

---

### T5-048: VIP Membership E2E Test
- **Priority:** P2
- **Complexity:** Medium
- **Dependencies:** None
- **Estimated:** 2 days

**Journey Steps:**
1. Patient signs up for VIP
2. Points earned on purchase
3. Tier upgrade triggered
4. Discount applied on next order
5. Birthday bonus received
6. Free delivery eligibility verified

**Acceptance Criteria:**
- [ ] Signup to benefits automated
- [ ] Points calculation correct
- [ ] Tier upgrades work
- [ ] Discounts apply correctly
- [ ] All benefits verified

---

---

# SECTION E: LOW PRIORITY FEATURES (P3)

## E1. Personal Calendar Integration

### T5-049: Google Calendar Sync
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
- [ ] Timezones handled

---

### T5-050: Apple Calendar Sync
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
- [ ] Timezones handled

---

## E2. PDF Export for Nurses

### T5-051: Order History PDF Export
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
- [ ] Filtering works
- [ ] Format professional

---

## E3. Medication Recycling Workflow

### T5-052: Medication Return/Recycling Feature
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
- [ ] Returns tracked
- [ ] Reports generated

---

---

# SUMMARY

## Task Count by Priority

| Priority | Tasks | Estimated Days |
|----------|-------|----------------|
| P0 - Critical | 17 | 52 days |
| P1 - High | 17 | 56 days |
| P2 - Medium | 12 | 41 days |
| P3 - Low | 4 | 12 days |
| **TOTAL** | **50** | **161 days** |

## Task Count by Category

| Category | Tasks |
|----------|-------|
| Swiss Healthcare Integrations | 17 |
| AI/ML Features | 9 |
| Infrastructure | 3 |
| Testing | 12 |
| Patient Features | 5 |
| Other Features | 4 |

## Critical Path

1. **T5-001 → T5-004**: HIN Authentication (13 days)
2. **T5-005 → T5-009**: Drug Interactions (19 days)
3. **T5-010 → T5-013**: e-santé Integration (20 days)
4. **T5-014 → T5-017**: Voice Transcription (12 days)

**Total Critical Path:** ~64 days (with parallelization)

## Recommended Team Allocation

| Stream | Team Size | Duration |
|--------|-----------|----------|
| Swiss Integrations (HIN + e-santé) | 2 devs | 8 weeks |
| AI/ML Features | 2 devs | 10 weeks |
| Infrastructure & DevOps | 1 dev | 4 weeks |
| Testing | 2 devs | 4 weeks |
| Patient Features | 2 devs | 6 weeks |

**With parallel streams:** ~12-14 weeks total

---

*Generated by BAZINGA Gap Analysis*
*Date: 2025-12-02*
