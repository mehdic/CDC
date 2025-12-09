# MetaPharm Connect - Phase 8: Final Completion

**Version:** 1.0.0
**Date:** 2025-12-09
**Target:** 100% CDC_Final.md Compliance + Production Readiness
**Estimated Effort:** 861 hours (~22 weeks with parallel execution)
**Analysis Source:** Deep comparison of CDC_Final.md, tasks.md through tasks7.md, and codebase audit

---

## Executive Summary

This task list addresses ALL remaining gaps identified through comprehensive analysis comparing:
- Original specification (`initial-docs/CDC_Final.md`)
- All previous task files (tasks.md through tasks7.md)
- Actual codebase implementation audit

**Current Implementation Status:** ~55-65% complete
**Critical Blockers:** 14 STUB/MOCK implementations that MUST be replaced
**Missing Applications:** 2 entire mobile apps (Delivery + Nurse)

---

## Priority Legend

- **P0 - CRITICAL**: Production blockers / regulatory compliance / security
- **P1 - HIGH**: Required for complete MVP functionality
- **P2 - MEDIUM**: Important for full user experience
- **P3 - LOW**: Nice to have, can be post-launch

---

## Phase Overview

| Phase | Focus | Hours | Weeks | Priority |
|-------|-------|-------|-------|----------|
| Phase 1 | Critical STUB/MOCK Replacements | 114h | 3 | P0 |
| Phase 2 | Security & Compliance | 46h | 1.5 | P0 |
| Phase 3 | Missing Mobile Apps | 172h | 4.5 | P1 |
| Phase 4 | Service Integrations | 48h | 1.5 | P1 |
| Phase 5 | Patient Frontend Features | 140h | 3.5 | P1 |
| Phase 6 | E2E Testing Coverage | 155h | 4 | P1 |
| Phase 7 | Advanced Features & VIP | 100h | 2.5 | P2 |
| Phase 8 | Infrastructure & Hardening | 86h | 2 | P2 |
| **TOTAL** | | **861h** | **~22 weeks** | |

---

# SECTION A: CRITICAL STUB/MOCK REPLACEMENTS (P0)

> **Critical Issue:** 14 production blockers where real API integrations are replaced with hardcoded mocks or setTimeout simulations.

---

## A1. FDB Drug Interactions API

> **Gap Source:** INT-001 to INT-003 from tasks2.md. Currently returns hardcoded data for only 5 drug pairs.

### T8-001: Implement Real FDB DrugPoint API Integration
- **Priority:** P0 - CRITICAL
- **Complexity:** High
- **Dependencies:** FDB API credentials, prescription-service
- **Estimated:** 16 hours

**Current Problem:**
```typescript
// CURRENT STUB - backend/services/prescription-service/src/services/drugInteraction.ts
const MOCK_INTERACTIONS = {
  'warfarin-aspirin': { severity: 'HIGH', description: '...' },
  // Only 5 hardcoded pairs
};
```

**Functional Requirements:**
- Replace hardcoded mock with real FDB DrugPoint API integration
- Implement drug interaction matrix lookup
- Support severity classification (Contraindicated, Severe, Moderate, Minor)
- Cache frequent lookups (Redis)
- Handle API rate limits and timeouts
- Log all interaction checks for audit

**Technical Implementation:**
```typescript
// backend/services/prescription-service/src/services/fdbService.ts
import axios from 'axios';
import Redis from 'ioredis';

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'CONTRAINDICATED' | 'SEVERE' | 'MODERATE' | 'MINOR';
  description: string;
  clinicalEffects: string[];
  recommendations: string[];
  references: string[];
}

export class FDBDrugService {
  private apiKey: string;
  private baseUrl: string;
  private redis: Redis;
  private cacheTTL = 86400; // 24 hours

  async checkInteractions(drugIds: string[]): Promise<DrugInteraction[]> {
    const cacheKey = `fdb:interactions:${drugIds.sort().join(':')}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Call FDB API
    const response = await axios.post(`${this.baseUrl}/v1/interactions`, {
      drugs: drugIds,
      includeMonographs: true,
      includeClinicalEffects: true
    }, {
      headers: { 'X-API-Key': this.apiKey },
      timeout: 5000
    });

    const interactions = this.mapFDBResponse(response.data);

    // Cache result
    await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(interactions));

    return interactions;
  }

  async getDrugMonograph(drugId: string): Promise<DrugMonograph> {
    // Implementation
  }

  async getAllergyCheck(drugId: string, patientAllergies: string[]): Promise<AllergyAlert[]> {
    // Implementation
  }
}
```

**Files to Create/Modify:**
- `backend/services/prescription-service/src/services/fdbService.ts` (new)
- `backend/services/prescription-service/src/services/drugInteraction.ts` (replace mock)
- `backend/services/prescription-service/src/config/fdb.config.ts` (new)
- `backend/services/prescription-service/src/__tests__/fdbService.test.ts` (new)

**Environment Variables:**
```env
FDB_API_KEY=your_fdb_api_key
FDB_BASE_URL=https://api.fdbhealth.com
FDB_TIMEOUT_MS=5000
FDB_CACHE_TTL=86400
```

**Acceptance Criteria:**
- [ ] Real FDB API integration working
- [ ] All drug interaction checks use live data
- [ ] Response caching implemented (24h TTL)
- [ ] Rate limiting handled gracefully
- [ ] Timeout fallback to cached data if available
- [ ] Audit logging for all interaction checks
- [ ] Unit tests with mocked FDB responses
- [ ] Integration test with FDB sandbox

---

### T8-002: FDB Allergy Cross-Reference Integration
- **Priority:** P0 - CRITICAL
- **Complexity:** Medium
- **Dependencies:** T8-001
- **Estimated:** 8 hours

**Functional Requirements:**
- Cross-reference prescribed drugs against patient allergies
- Support ingredient-level matching (not just brand names)
- Handle drug class allergies (e.g., "penicillins")
- Return severity and alternative suggestions

**Acceptance Criteria:**
- [ ] Allergy checking uses FDB ingredient database
- [ ] Drug class allergies detected
- [ ] Alternative drug suggestions provided
- [ ] Integrated into prescription validation flow

---

## A2. Mobile Video SDK Integration

> **Gap Source:** INT-004 to INT-006 from tasks2.md. Mobile apps use setTimeout simulation instead of real Twilio.

### T8-003: Patient App - Twilio Video SDK Integration
- **Priority:** P0 - CRITICAL
- **Complexity:** High
- **Dependencies:** Twilio account, React Native setup
- **Estimated:** 10 hours

**Current Problem:**
```typescript
// CURRENT STUB - mobile/patient-app/src/services/videoService.ts
export const connectToRoom = async (roomName: string, token: string) => {
  // STUB: Simulates connection with setTimeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ connected: true, roomSid: 'fake-room-sid' });
    }, 1000);
  });
};
```

**Functional Requirements:**
- Integrate Twilio Video React Native SDK
- Support video and audio calls
- Handle camera/microphone permissions (iOS + Android)
- Implement call controls (mute, camera toggle, speaker)
- Handle network quality indicators
- Support picture-in-picture mode
- Handle call reconnection on network changes

**Technical Implementation:**
```typescript
// mobile/patient-app/src/services/twilioVideoService.ts
import {
  connect,
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
} from 'twilio-video';
import { PermissionsAndroid, Platform } from 'react-native';

export class TwilioVideoService {
  private room: Room | null = null;
  private localVideoTrack: LocalVideoTrack | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    // iOS permissions handled via Info.plist
    return true;
  }

  async connectToRoom(roomName: string, accessToken: string): Promise<Room> {
    await this.requestPermissions();

    this.localVideoTrack = await LocalVideoTrack.create();
    this.localAudioTrack = await LocalAudioTrack.create();

    this.room = await connect(accessToken, {
      name: roomName,
      video: this.localVideoTrack,
      audio: this.localAudioTrack,
      networkQuality: {
        local: 1,
        remote: 1,
      },
    });

    this.setupRoomListeners();
    return this.room;
  }

  private setupRoomListeners(): void {
    if (!this.room) return;

    this.room.on('participantConnected', (participant: RemoteParticipant) => {
      // Handle remote participant
    });

    this.room.on('participantDisconnected', (participant: RemoteParticipant) => {
      // Handle disconnect
    });

    this.room.on('disconnected', (room: Room, error?: Error) => {
      // Handle room disconnect
    });
  }

  toggleVideo(): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.isEnabled = !this.localVideoTrack.isEnabled;
    }
  }

  toggleAudio(): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.isEnabled = !this.localAudioTrack.isEnabled;
    }
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
    this.localVideoTrack?.stop();
    this.localAudioTrack?.stop();
  }
}
```

**Files to Create/Modify:**
- `mobile/patient-app/src/services/twilioVideoService.ts` (new)
- `mobile/patient-app/src/screens/VideoCallScreen.tsx` (update)
- `mobile/patient-app/src/components/VideoControls.tsx` (update)
- `mobile/patient-app/ios/Podfile` (add Twilio pod)
- `mobile/patient-app/android/app/build.gradle` (add Twilio dependency)

**Acceptance Criteria:**
- [ ] Real Twilio Video SDK integrated
- [ ] Camera/microphone permissions working (iOS + Android)
- [ ] Video call connects to teleconsultation room
- [ ] Call controls functional (mute, camera, speaker)
- [ ] Network quality indicator displayed
- [ ] Graceful handling of call drops
- [ ] Audio fallback when video fails

---

### T8-004: Pharmacist App - Twilio Video SDK Integration
- **Priority:** P0 - CRITICAL
- **Complexity:** High
- **Dependencies:** T8-003 (share code where possible)
- **Estimated:** 8 hours

**Functional Requirements:**
- Same as T8-003 for pharmacist mobile app
- Additional: Recording consent display
- Additional: Screen sharing capability for prescription review

**Files to Create/Modify:**
- `mobile/pharmacist-app/src/services/twilioVideoService.ts` (new)
- `mobile/pharmacist-app/src/screens/TeleconsultationScreen.tsx` (update)

**Acceptance Criteria:**
- [ ] All T8-003 criteria
- [ ] Recording consent prompt displayed
- [ ] Screen sharing working for prescription review

---

### T8-005: Doctor App - Twilio Video SDK Integration
- **Priority:** P0 - CRITICAL
- **Complexity:** Medium
- **Dependencies:** T8-003 (share code where possible)
- **Estimated:** 8 hours

**Functional Requirements:**
- Same as T8-003 for doctor mobile app
- Additional: Access to patient records during call

**Files to Create/Modify:**
- `mobile/doctor-app/src/services/twilioVideoService.ts` (new)
- `mobile/doctor-app/src/screens/ConsultationScreen.tsx` (update)

**Acceptance Criteria:**
- [ ] All T8-003 criteria
- [ ] Patient record sidebar accessible during call

---

## A3. Speech-to-Text Transcription

> **Gap Source:** INT-007, INT-008 from tasks2.md. Returns hardcoded "headache/ibuprofen" response.

### T8-006: Implement Real Speech-to-Text Service
- **Priority:** P0 - CRITICAL
- **Complexity:** High
- **Dependencies:** Twilio Speech or AWS Transcribe credentials
- **Estimated:** 16 hours

**Current Problem:**
```typescript
// CURRENT MOCK - backend/services/voice-service/src/services/transcription.ts
export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  // MOCK: Always returns same response
  return "Patient reports headache, recommending ibuprofen 400mg";
};
```

**Functional Requirements:**
- Real-time audio transcription during teleconsultations
- Medical terminology recognition and highlighting
- Support French and German (Swiss market)
- Speaker diarization (identify patient vs pharmacist)
- Confidence scores for transcribed text
- Post-call transcript generation

**Technical Implementation:**
```typescript
// backend/services/voice-service/src/services/awsTranscribeService.ts
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';

export class TranscriptionService {
  private client: TranscribeStreamingClient;
  private medicalVocabulary: string;

  async startRealTimeTranscription(
    audioStream: ReadableStream,
    languageCode: 'fr-FR' | 'de-CH' | 'en-US'
  ): Promise<AsyncGenerator<TranscriptResult>> {
    const command = new StartStreamTranscriptionCommand({
      LanguageCode: languageCode,
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: 16000,
      AudioStream: this.createAudioStream(audioStream),
      VocabularyName: this.medicalVocabulary,
      ShowSpeakerLabel: true,
      EnablePartialResultsStabilization: true,
      PartialResultsStability: 'high',
    });

    const response = await this.client.send(command);
    return this.processTranscriptStream(response.TranscriptResultStream);
  }

  async transcribeRecording(audioUrl: string): Promise<FullTranscript> {
    // Batch transcription for post-call processing
  }

  highlightMedicalTerms(text: string): HighlightedText {
    // NLP-based medical term identification
  }
}
```

**Files to Create/Modify:**
- `backend/services/voice-service/src/services/awsTranscribeService.ts` (new)
- `backend/services/voice-service/src/services/medicalNLP.ts` (new)
- `backend/services/voice-service/src/controllers/transcriptionController.ts` (update)
- `backend/services/teleconsultation-service/src/services/consultationRecording.ts` (integrate)

**Acceptance Criteria:**
- [ ] Real-time transcription working
- [ ] French language support (primary)
- [ ] Medical terminology highlighted
- [ ] Speaker diarization functional
- [ ] Confidence scores displayed
- [ ] Post-call transcript saved to consultation record

---

### T8-007: NLP Medical Term Highlighting
- **Priority:** P1
- **Complexity:** Medium
- **Dependencies:** T8-006
- **Estimated:** 8 hours

**Functional Requirements:**
- Identify medical terms in transcribed text
- Highlight drug names, symptoms, diagnoses
- Link to drug database for quick lookup
- Support abbreviations (e.g., "BP" → "Blood Pressure")

**Acceptance Criteria:**
- [ ] Medical terms auto-highlighted in transcript
- [ ] Drug names linkable to FDB database
- [ ] Common abbreviations expanded

---

## A4. Mobile QR Camera Integration

> **Gap Source:** INT-009, INT-010 from tasks2.md. Camera not integrated, only form UI exists.

### T8-008: Pharmacist App QR Scanner Implementation
- **Priority:** P0 - CRITICAL
- **Complexity:** Medium
- **Dependencies:** React Native Camera library
- **Estimated:** 12 hours

**Current Problem:**
```typescript
// CURRENT - Only form input, no camera
<TextInput
  placeholder="Enter QR code manually"
  onChangeText={setQrCode}
/>
```

**Functional Requirements:**
- Integrate camera for QR code scanning
- Support barcode formats (QR, Code128, EAN-13)
- Flash/torch toggle for low light
- Manual entry fallback
- Haptic feedback on successful scan
- Batch scanning mode for inventory

**Technical Implementation:**
```typescript
// mobile/pharmacist-app/src/components/QRScanner.tsx
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const devices = useCameraDevices();
  const device = devices.back;
  const [torch, setTorch] = useState(false);

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
  ]);

  useEffect(() => {
    if (barcodes.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onScan(barcodes[0].rawValue);
    }
  }, [barcodes]);

  if (!device) return <ManualEntryFallback onSubmit={onScan} />;

  return (
    <View style={styles.container}>
      <Camera
        device={device}
        isActive={true}
        torch={torch ? 'on' : 'off'}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
        style={StyleSheet.absoluteFill}
      />
      <ScannerOverlay />
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setTorch(!torch)}>
          <Icon name={torch ? 'flash-on' : 'flash-off'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

**Files to Create/Modify:**
- `mobile/pharmacist-app/src/components/QRScanner.tsx` (new)
- `mobile/pharmacist-app/src/screens/InventoryScreen.tsx` (integrate)
- `mobile/pharmacist-app/src/screens/BatchManagementScreen.tsx` (integrate)
- `mobile/pharmacist-app/ios/Info.plist` (camera permission)
- `mobile/pharmacist-app/android/app/src/main/AndroidManifest.xml` (camera permission)

**Acceptance Criteria:**
- [ ] Camera opens and scans QR codes
- [ ] Barcode formats supported (QR, Code128, EAN-13)
- [ ] Torch toggle working
- [ ] Manual entry fallback available
- [ ] Haptic feedback on scan
- [ ] iOS and Android permissions configured

---

## A5. Audit & Notification Service Integration

> **Gap Source:** INT-011 to INT-014 from tasks2.md. TODO comments in code.

### T8-009: Audit Service Integration in Prescription Approval
- **Priority:** P0 - CRITICAL
- **Complexity:** Medium
- **Dependencies:** audit-service exists
- **Estimated:** 8 hours

**Current Problem:**
```typescript
// backend/services/prescription-service/src/controllers/approvalController.ts
// TODO: Integrate audit service for PHI access logging
await this.prescriptionService.approve(prescriptionId, pharmacistId);
// Missing: Audit log entry
```

**Functional Requirements:**
- Log all PHI access events to audit service
- Include: who, what, when, why, IP address
- Immutable audit trail
- Support HIPAA/GDPR audit requirements

**Acceptance Criteria:**
- [ ] All prescription approvals logged
- [ ] All PHI access logged (view, modify, delete)
- [ ] Audit entries include required metadata
- [ ] Audit trail immutable (append-only)

---

### T8-010: Notification Service Integration for Appointments
- **Priority:** P0
- **Complexity:** Medium
- **Dependencies:** notification-service, appointment-service
- **Estimated:** 8 hours

**Current Problem:**
```typescript
// backend/services/appointment-service/src/services/appointmentService.ts
// TODO: Send reminder notification
await this.appointmentRepository.save(appointment);
// Missing: Notification scheduling
```

**Functional Requirements:**
- Schedule reminders 24h and 1h before appointments
- Support push notifications (FCM)
- Support SMS reminders
- Support email reminders
- Allow patient preferences

**Acceptance Criteria:**
- [ ] 24h reminder sent
- [ ] 1h reminder sent
- [ ] Push notification delivery confirmed
- [ ] SMS fallback working
- [ ] Patient can configure preferences

---

### T8-011: AWS Forecast API Integration
- **Priority:** P1
- **Complexity:** High
- **Dependencies:** AWS Forecast setup, inventory-service
- **Estimated:** 12 hours

**Current Problem:**
```typescript
// backend/services/inventory-service/src/services/demandForecast.ts
// MVP: Using simple moving average heuristic
const forecast = historicalDemand.reduce((a, b) => a + b, 0) / historicalDemand.length;
// Missing: Real ML-based forecasting
```

**Functional Requirements:**
- Replace heuristic with AWS Forecast API
- Train model on historical inventory data
- Generate 30/60/90 day forecasts
- Factor in seasonality and trends
- Support per-product forecasting

**Acceptance Criteria:**
- [ ] AWS Forecast predictor created
- [ ] Historical data imported
- [ ] Forecast generation working
- [ ] Dashboard displays ML forecasts
- [ ] Reorder recommendations use ML data

---

# SECTION B: SECURITY & COMPLIANCE (P0)

> **Gap Source:** T2-020 to T2-029 from tasks2.md. Security hardening incomplete.

---

### T8-012: Implement CSP Headers
- **Priority:** P0
- **Complexity:** Low
- **Estimated:** 4 hours

**Functional Requirements:**
- Configure Content Security Policy headers
- Prevent XSS and injection attacks
- Allow only trusted sources

**Implementation:**
```typescript
// backend/services/api-gateway/src/middleware/security.ts
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.twilio.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://api.twilio.com", "wss://"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "blob:"],
    frameSrc: ["'self'"],
  },
}));
```

**Acceptance Criteria:**
- [ ] CSP headers set on all responses
- [ ] XSS attacks blocked
- [ ] No console errors from legitimate resources

---

### T8-013: Configure Helmet.js Security Headers
- **Priority:** P0
- **Complexity:** Low
- **Estimated:** 4 hours

**Functional Requirements:**
- Enable all Helmet.js security headers
- Configure HSTS
- Disable X-Powered-By
- Set referrer policy

**Acceptance Criteria:**
- [ ] All Helmet middleware enabled
- [ ] HSTS configured for HTTPS
- [ ] Security headers visible in responses

---

### T8-014: XSS Prevention Audit
- **Priority:** P0
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Audit all user input handling
- Ensure output encoding
- Test with XSS payloads
- Fix any vulnerabilities found

**Acceptance Criteria:**
- [ ] All input sanitized
- [ ] All output encoded
- [ ] XSS test suite passing
- [ ] Security scan clean

---

### T8-015: SQL Injection Prevention Verification
- **Priority:** P0
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Verify all queries use parameterization
- No string concatenation in queries
- Test with SQL injection payloads

**Acceptance Criteria:**
- [ ] All queries parameterized
- [ ] SQL injection test suite passing
- [ ] No raw query vulnerabilities

---

### T8-016: Rate Limiting on Public Endpoints
- **Priority:** P0
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Implement rate limiting on:
  - Login endpoints (5 attempts/minute)
  - Registration (3/minute)
  - Password reset (3/hour)
  - Public API (100/minute)
- Use Redis for distributed rate limiting

**Implementation:**
```typescript
// backend/services/api-gateway/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const loginRateLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

**Acceptance Criteria:**
- [ ] Login rate limiting working
- [ ] API rate limiting working
- [ ] Redis store for distributed environments
- [ ] Proper error responses

---

### T8-017: HIPAA Compliance Documentation
- **Priority:** P0
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Document all PHI handling procedures
- Map data flows
- Document encryption at rest/transit
- Document access controls
- Document audit procedures

**Deliverables:**
- `docs/compliance/hipaa-compliance.md`
- `docs/compliance/data-flow-diagram.md`
- `docs/compliance/access-control-matrix.md`

**Acceptance Criteria:**
- [ ] All PHI data flows documented
- [ ] Encryption documentation complete
- [ ] Access control matrix created
- [ ] Audit procedures documented

---

### T8-018: GDPR Compliance Documentation
- **Priority:** P0
- **Complexity:** Medium
- **Estimated:** 6 hours

**Functional Requirements:**
- Document data subject rights implementation
- Document data retention policies
- Document consent management
- Document data export/deletion procedures

**Deliverables:**
- `docs/compliance/gdpr-compliance.md`
- `docs/compliance/data-retention-policy.md`
- `docs/compliance/consent-management.md`

**Acceptance Criteria:**
- [ ] All GDPR articles addressed
- [ ] Data retention documented
- [ ] Right to deletion implemented
- [ ] Data export functional

---

# SECTION C: MISSING MOBILE APPLICATIONS (P1)

> **Gap Source:** T2-056 to T2-087 from tasks2.md. Entire apps do not exist.

---

## C1. Delivery Personnel Mobile App

> **Status:** Application directory does not exist. Backend delivery-service exists.

### T8-019: Initialize Delivery App Structure
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Create React Native app structure
- Configure navigation
- Set up state management (Redux Toolkit)
- Configure authentication flow
- Set up API client

**Directory Structure:**
```
mobile/delivery-app/
├── src/
│   ├── components/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DeliveryListScreen.tsx
│   │   ├── DeliveryDetailScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── ScannerScreen.tsx
│   │   ├── ProofOfDeliveryScreen.tsx
│   │   └── EarningsScreen.tsx
│   ├── services/
│   ├── store/
│   ├── navigation/
│   └── utils/
├── ios/
├── android/
└── package.json
```

**Acceptance Criteria:**
- [ ] App structure created
- [ ] Navigation configured
- [ ] Auth flow working
- [ ] API client connected

---

### T8-020: Delivery Request List & Detail
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Display list of assigned deliveries
- Filter by status (pending, in-progress, completed)
- Show delivery details (patient, address, items, special instructions)
- Show priority indicators (urgent, controlled substance, cold chain)

**Acceptance Criteria:**
- [ ] Delivery list displays
- [ ] Filtering works
- [ ] Detail view shows all information
- [ ] Priority indicators visible

---

### T8-021: GPS Tracking & Route Display
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 16 hours

**Functional Requirements:**
- Real-time GPS location tracking
- Display optimized route on map
- Turn-by-turn navigation
- Traffic-aware routing
- Background location updates
- Battery optimization

**Implementation:**
```typescript
// mobile/delivery-app/src/services/locationService.ts
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';

export class LocationService {
  async startTracking(deliveryId: string): Promise<void> {
    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: true,
      url: `${API_URL}/deliveries/${deliveryId}/location`,
      autoSync: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    await BackgroundGeolocation.start();
  }

  async getOptimizedRoute(stops: Location[]): Promise<Route> {
    // Call route optimization service
  }
}
```

**Acceptance Criteria:**
- [ ] GPS tracking working
- [ ] Route displayed on map
- [ ] Background tracking functional
- [ ] Battery-efficient implementation

---

### T8-022: QR Code Scanner for Package Verification
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Scan package QR code at pickup
- Verify package matches delivery assignment
- Scan patient ID at delivery
- Record scan timestamps

**Acceptance Criteria:**
- [ ] Package QR scanning working
- [ ] Verification against assignment
- [ ] Patient ID scanning
- [ ] Timestamps recorded

---

### T8-023: Proof of Delivery Capture
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Capture patient signature (touch signature pad)
- Capture delivery photo
- Capture patient ID photo (optional)
- Record delivery timestamp and GPS location
- Support offline capture with sync

**Implementation:**
```typescript
// mobile/delivery-app/src/components/SignatureCapture.tsx
import SignatureScreen from 'react-native-signature-canvas';

export const ProofOfDeliveryCapture: React.FC = ({ onComplete }) => {
  const [signature, setSignature] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const handleSubmit = async () => {
    const proof: ProofOfDelivery = {
      signature,
      photo,
      timestamp: new Date().toISOString(),
      location: await getCurrentLocation(),
    };

    await deliveryService.submitProof(deliveryId, proof);
    onComplete();
  };

  return (
    <View>
      <Text>Patient Signature</Text>
      <SignatureScreen onOK={setSignature} />

      <Text>Delivery Photo</Text>
      <CameraCapture onCapture={setPhoto} />

      <Button onPress={handleSubmit}>Complete Delivery</Button>
    </View>
  );
};
```

**Acceptance Criteria:**
- [ ] Signature capture working
- [ ] Photo capture working
- [ ] GPS recorded with proof
- [ ] Offline mode with sync

---

### T8-024: Special Handling Alerts
- **Priority:** P1
- **Complexity:** Low
- **Estimated:** 4 hours

**Functional Requirements:**
- Display alerts for controlled substances
- Display alerts for cold chain items
- Display patient-specific instructions
- Require acknowledgment before pickup

**Acceptance Criteria:**
- [ ] Controlled substance alerts displayed
- [ ] Cold chain alerts displayed
- [ ] Acknowledgment required

---

### T8-025: Earnings Dashboard
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Display daily/weekly/monthly earnings
- Show delivery count statistics
- Display bonus information
- Export earnings report

**Acceptance Criteria:**
- [ ] Earnings summary displayed
- [ ] Period filtering working
- [ ] Statistics accurate

---

### T8-026: Offline Mode & Sync Queue
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 12 hours

**Functional Requirements:**
- Queue actions when offline
- Sync when connection restored
- Conflict resolution
- Local data persistence

**Acceptance Criteria:**
- [ ] Actions queued offline
- [ ] Automatic sync on reconnect
- [ ] Conflicts handled
- [ ] Data persists across app restarts

---

## C2. Nurse Mobile App

> **Status:** Application directory does not exist. Backend nurse-service exists.

### T8-027: Initialize Nurse App Structure
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Create React Native app structure
- Configure navigation
- Set up healthcare credential authentication
- Configure API client

**Directory Structure:**
```
mobile/nurse-app/
├── src/
│   ├── components/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── PatientSearchScreen.tsx
│   │   ├── PatientDetailScreen.tsx
│   │   ├── MedicationOrderScreen.tsx
│   │   ├── PharmacyRecordsScreen.tsx
│   │   ├── DeliveryTrackingScreen.tsx
│   │   ├── AdministrationLogScreen.tsx
│   │   └── ShiftHandoverScreen.tsx
│   ├── services/
│   ├── store/
│   └── navigation/
├── ios/
├── android/
└── package.json
```

**Acceptance Criteria:**
- [ ] App structure created
- [ ] Healthcare auth flow working
- [ ] Navigation configured

---

### T8-028: Patient Search & Selection
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Search patients by name, ID, room number
- Display patient list with photo
- Show current medications summary
- Quick access to frequently visited patients

**Acceptance Criteria:**
- [ ] Patient search working
- [ ] Patient list displays
- [ ] Quick access list functional

---

### T8-029: Medication Ordering Workflow
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 16 hours

**Functional Requirements:**
- Select medications from patient's prescription
- Specify quantity and urgency
- Select delivery pharmacy
- Track order status
- Receive notification when ready

**Acceptance Criteria:**
- [ ] Medication selection working
- [ ] Order submission working
- [ ] Status tracking functional
- [ ] Notifications received

---

### T8-030: Pharmacy Patient Records Access
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- View pharmacy-maintained patient records (with consent)
- View prescription history
- View current medications
- View allergies and contraindications
- View adherence data

**Acceptance Criteria:**
- [ ] Record access with consent verification
- [ ] Prescription history displayed
- [ ] Allergies visible

---

### T8-031: Delivery Tracking for Nurses
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Track medication delivery status
- View ETA
- Receive arrival notifications
- Schedule coordination

**Acceptance Criteria:**
- [ ] Delivery status visible
- [ ] ETA displayed
- [ ] Notifications working

---

### T8-032: Medication Administration Recording
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Scan medication barcode
- Verify against patient prescription
- Record administration (dose, time, route)
- Sign off with nurse ID
- Support batch administration

**Acceptance Criteria:**
- [ ] Barcode scanning working
- [ ] Verification against prescription
- [ ] Administration logged
- [ ] Nurse sign-off recorded

---

### T8-033: Adverse Reaction Reporting
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 8 hours

**Functional Requirements:**
- Quick report adverse reactions
- Select reaction type and severity
- Notify pharmacy and prescribing doctor
- Link to medication and patient

**Acceptance Criteria:**
- [ ] Reaction reporting working
- [ ] Notifications sent
- [ ] Report linked to records

---

### T8-034: Shift Handover Notes
- **Priority:** P2
- **Complexity:** Low
- **Estimated:** 4 hours

**Functional Requirements:**
- Create shift handover notes
- Highlight pending orders
- Flag patient concerns
- Read previous shift notes

**Acceptance Criteria:**
- [ ] Handover notes creation
- [ ] Previous notes visible
- [ ] Pending orders highlighted

---

# SECTION D: SERVICE INTEGRATIONS (P1)

---

### T8-035: HIN e-ID Authentication Integration
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 8 hours
- **Reference:** T5-002 from tasks5.md

**Functional Requirements:**
- Implement HIN OAuth2 flow
- Verify healthcare professional credentials
- Extract GLN number from HIN profile
- Store verified credential in user profile

**Implementation:**
```typescript
// backend/services/auth-service/src/services/hinAuthService.ts
export class HINAuthService {
  private hinOAuthUrl = 'https://apps.hin.ch/oauth2';

  async initiateHINAuth(redirectUri: string): Promise<string> {
    const state = crypto.randomUUID();
    const authUrl = new URL(`${this.hinOAuthUrl}/authorize`);
    authUrl.searchParams.append('client_id', process.env.HIN_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile gln');
    authUrl.searchParams.append('state', state);

    return authUrl.toString();
  }

  async handleCallback(code: string): Promise<HINProfile> {
    const tokenResponse = await this.exchangeCode(code);
    const profile = await this.getHINProfile(tokenResponse.access_token);

    return {
      hinId: profile.sub,
      gln: profile.gln,
      role: profile.role,
      name: profile.name,
      verified: true,
    };
  }
}
```

**Acceptance Criteria:**
- [ ] HIN OAuth2 flow working
- [ ] GLN number extracted
- [ ] Profile stored in user record
- [ ] Doctor app integrated

---

### T8-036: Swiss e-santé API Integration
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 16 hours
- **Reference:** T5-003 from tasks5.md

**Functional Requirements:**
- Connect to cantonal health record systems
- Fetch patient consent status
- Read authorized health records
- Write consultation summaries (with consent)

**Acceptance Criteria:**
- [ ] e-santé connection established
- [ ] Consent verification working
- [ ] Record fetch functional
- [ ] Write access tested

---

### T8-037: Multi-Channel Messaging Integration
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 32 hours

**Functional Requirements:**
- WhatsApp Business API integration
- Email-to-unified-inbox aggregation
- Fax integration (eFax API)
- Message threading across channels
- Voice message transcription

**Sub-tasks:**
1. WhatsApp Business API setup (12h)
2. Email aggregation service (8h)
3. Fax integration (8h)
4. Unified inbox UI (4h)

**Acceptance Criteria:**
- [ ] WhatsApp messages received
- [ ] Email aggregation working
- [ ] Fax send/receive functional
- [ ] All channels in unified inbox

---

# SECTION E: PATIENT FRONTEND FEATURES (P1)

---

### T8-038: Patient E-Commerce - Product Catalog
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Display OTC and parapharmacy products
- Category browsing
- Search with filters
- Product detail with images

**Acceptance Criteria:**
- [ ] Catalog displays products
- [ ] Categories working
- [ ] Search functional
- [ ] Detail view complete

---

### T8-039: Patient E-Commerce - Cart & Checkout
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 16 hours

**Functional Requirements:**
- Add/remove items from cart
- Quantity adjustment
- Prescription item verification
- Insurance verification
- Payment processing
- Delivery scheduling

**Acceptance Criteria:**
- [ ] Cart management working
- [ ] Checkout flow complete
- [ ] Payment integration working
- [ ] Order confirmation displayed

---

### T8-040: Patient E-Commerce - Order History
- **Priority:** P1
- **Complexity:** Low
- **Estimated:** 8 hours

**Functional Requirements:**
- View past orders
- Order status tracking
- Reorder functionality
- Download receipts

**Acceptance Criteria:**
- [ ] Order history displayed
- [ ] Status visible
- [ ] Reorder working

---

### T8-041: Patient Medical Records Dashboard
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 20 hours

**Functional Requirements:**
- View prescription history
- View consultation notes
- View test results
- View treatment plans
- Health metrics visualization
- Export records (GDPR)

**Acceptance Criteria:**
- [ ] All record types displayed
- [ ] Timeline view available
- [ ] Export functional

---

### T8-042: Patient Delivery Tracking (Uber-style)
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 16 hours

**Functional Requirements:**
- Real-time map with delivery location
- ETA countdown
- Delivery personnel info
- Contact delivery person
- Delivery status updates
- Push notifications

**Acceptance Criteria:**
- [ ] Map displays delivery location
- [ ] ETA shown
- [ ] Contact option available
- [ ] Push notifications working

---

### T8-043: Patient Adherence Tracking
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Medication schedule display
- Mark doses as taken
- Reminder notifications
- Adherence statistics
- Share with healthcare provider

**Acceptance Criteria:**
- [ ] Schedule displayed
- [ ] Dose marking working
- [ ] Reminders functional
- [ ] Statistics calculated

---

### T8-044: Patient VIP Program Portal
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- VIP membership enrollment
- Benefits display
- Points/rewards tracking
- Exclusive offers
- Priority support access

**Acceptance Criteria:**
- [ ] Enrollment flow working
- [ ] Benefits visible
- [ ] Points tracking functional

---

# SECTION F: E2E TESTING COVERAGE (P1)

---

### T8-045: Prescription Workflow E2E Tests
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 20 hours

**Test Scenarios:**
1. Doctor creates prescription → Pharmacist receives → Validates → Patient notified
2. AI transcription of handwritten prescription
3. Drug interaction detection and override
4. Controlled substance workflow
5. Prescription renewal request

**Acceptance Criteria:**
- [ ] All 5 scenarios passing
- [ ] Cross-role data flow verified
- [ ] Error scenarios covered

---

### T8-046: Teleconsultation E2E Tests
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 20 hours

**Test Scenarios:**
1. Patient books → Joins call → Pharmacist joins → Notes saved
2. Recording consent flow
3. Audio fallback
4. Post-consultation prescription
5. Follow-up scheduling

**Acceptance Criteria:**
- [ ] All scenarios passing
- [ ] Video SDK tested
- [ ] Recording flow verified

---

### T8-047: Delivery Workflow E2E Tests
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 25 hours

**Test Scenarios:**
1. Order created → Assigned → Picked up → Delivered → Confirmed
2. Cold chain handling
3. Controlled substance delivery
4. Failed delivery (patient absent)
5. Return to pharmacy

**Acceptance Criteria:**
- [ ] All scenarios passing
- [ ] GPS tracking verified
- [ ] QR scanning tested

---

### T8-048: Nurse Workflow E2E Tests
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 20 hours

**Test Scenarios:**
1. Nurse orders medication → Pharmacy fills → Delivery → Administration
2. Adverse reaction reporting
3. Shift handover
4. Emergency medication request

**Acceptance Criteria:**
- [ ] All scenarios passing
- [ ] Integration with pharmacy verified

---

### T8-049: E-Commerce E2E Tests
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 15 hours

**Test Scenarios:**
1. Browse → Add to cart → Checkout → Pay → Receive
2. Prescription item purchase (requires validation)
3. Insurance verification
4. Reorder workflow

**Acceptance Criteria:**
- [ ] All scenarios passing
- [ ] Payment integration tested

---

### T8-050: Security E2E Tests
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 20 hours

**Test Scenarios:**
1. Authentication flow (all user types)
2. Authorization verification (role-based)
3. Session management
4. Rate limiting verification
5. XSS/SQL injection attempts blocked

**Acceptance Criteria:**
- [ ] Auth flows tested
- [ ] RBAC verified
- [ ] Attack scenarios blocked

---

### T8-051: Performance & Load Tests
- **Priority:** P1
- **Complexity:** High
- **Estimated:** 25 hours

**Test Scenarios:**
1. 100 concurrent prescription submissions
2. 50 concurrent video calls
3. 500 concurrent API requests
4. Database query performance under load
5. Memory/CPU utilization monitoring

**Acceptance Criteria:**
- [ ] Response times < 200ms (P95)
- [ ] No errors under expected load
- [ ] Graceful degradation under peak

---

### T8-052: Accessibility E2E Tests
- **Priority:** P1
- **Complexity:** Medium
- **Estimated:** 10 hours

**Test Scenarios:**
1. Screen reader navigation
2. Keyboard-only navigation
3. Color contrast verification
4. Focus management
5. ARIA attributes validation

**Acceptance Criteria:**
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader tested
- [ ] Keyboard navigation working

---

# SECTION G: ADVANCED FEATURES (P2)

---

### T8-053: AI Route Optimization for Delivery
- **Priority:** P2
- **Complexity:** High
- **Estimated:** 20 hours

**Functional Requirements:**
- Optimize delivery routes using ML
- Factor in traffic, time windows, priorities
- Support dynamic re-routing
- Minimize total delivery time

**Acceptance Criteria:**
- [ ] Route optimization working
- [ ] Traffic awareness
- [ ] Dynamic re-routing functional

---

### T8-054: Digital Twin Patient Profiles
- **Priority:** P2
- **Complexity:** High
- **Estimated:** 24 hours

**Functional Requirements:**
- Comprehensive patient health profile
- Predictive health modeling
- Medication interaction simulations
- Personalized recommendations

**Acceptance Criteria:**
- [ ] Profile generation working
- [ ] Predictions functional
- [ ] Recommendations personalized

---

### T8-055: Automatic Prescription Renewal
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Detect prescriptions nearing expiry
- Notify patient
- Auto-submit renewal request to doctor
- Track renewal status

**Acceptance Criteria:**
- [ ] Expiry detection working
- [ ] Notifications sent
- [ ] Renewal flow functional

---

### T8-056: Health Risk Predictions
- **Priority:** P2
- **Complexity:** High
- **Estimated:** 20 hours

**Functional Requirements:**
- Analyze patient health data
- Predict potential health risks
- Generate proactive recommendations
- Alert healthcare providers

**Acceptance Criteria:**
- [ ] Risk prediction functional
- [ ] Recommendations generated
- [ ] Alerts working

---

### T8-057: Admin Dashboard
- **Priority:** P2
- **Complexity:** High
- **Estimated:** 24 hours

**Functional Requirements:**
- User management
- System health monitoring
- Analytics overview
- Configuration management
- Audit log viewer

**Acceptance Criteria:**
- [ ] User management working
- [ ] System monitoring functional
- [ ] Audit logs accessible

---

# SECTION H: INFRASTRUCTURE & HARDENING (P2)

---

### T8-058: Kubernetes Production Manifests
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 16 hours

**Functional Requirements:**
- Production-grade Kubernetes manifests
- Horizontal Pod Autoscaling
- Pod Disruption Budgets
- Network Policies
- Resource quotas

**Acceptance Criteria:**
- [ ] All services deployable
- [ ] HPA configured
- [ ] Network policies applied

---

### T8-059: CI/CD Pipeline Enhancement
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Automated security scanning
- Container vulnerability scanning
- Performance regression testing
- Automated rollback on failure

**Acceptance Criteria:**
- [ ] Security scanning in pipeline
- [ ] Auto rollback working
- [ ] Performance gates functional

---

### T8-060: Error Tracking & Monitoring
- **Priority:** P2
- **Complexity:** Medium
- **Estimated:** 12 hours

**Functional Requirements:**
- Sentry integration for error tracking
- Error grouping and deduplication
- Alerting on new errors
- Source map upload for debugging

**Acceptance Criteria:**
- [ ] Sentry configured
- [ ] Errors captured
- [ ] Alerts working

---

### T8-061: Database Performance Optimization
- **Priority:** P2
- **Complexity:** High
- **Estimated:** 16 hours

**Functional Requirements:**
- Query performance analysis
- Index optimization
- Connection pooling tuning
- Read replica configuration

**Acceptance Criteria:**
- [ ] Slow queries identified and fixed
- [ ] Indexes optimized
- [ ] Connection pooling efficient

---

### T8-062: CDN & Asset Optimization
- **Priority:** P3
- **Complexity:** Medium
- **Estimated:** 10 hours

**Functional Requirements:**
- CDN configuration for static assets
- Image optimization
- Lazy loading
- Cache headers optimization

**Acceptance Criteria:**
- [ ] CDN serving assets
- [ ] Images optimized
- [ ] Cache headers configured

---

# SUMMARY

## Total Tasks: 62

| Priority | Tasks | Hours |
|----------|-------|-------|
| P0 - Critical | 18 | 160h |
| P1 - High | 32 | 465h |
| P2 - Medium | 10 | 202h |
| P3 - Low | 2 | 34h |
| **Total** | **62** | **861h** |

## Implementation Order

### Sprint 1-3 (Weeks 1-3): P0 Critical
- T8-001 to T8-011 (STUB replacements)
- T8-012 to T8-018 (Security)

### Sprint 4-7 (Weeks 4-9): P1 Mobile Apps
- T8-019 to T8-026 (Delivery App)
- T8-027 to T8-034 (Nurse App)

### Sprint 8-9 (Weeks 10-11): P1 Integrations
- T8-035 to T8-037 (HIN, e-santé, Messaging)

### Sprint 10-12 (Weeks 12-15): P1 Patient Features
- T8-038 to T8-044 (E-commerce, Records, VIP)

### Sprint 13-16 (Weeks 16-20): P1 Testing
- T8-045 to T8-052 (E2E Tests)

### Sprint 17-20 (Weeks 20-22): P2 Advanced
- T8-053 to T8-062 (AI, Digital Twin, Infrastructure)

---

## Dependencies Graph

```
T8-001 (FDB API)
  └── T8-002 (Allergy Check)

T8-003 (Patient Video)
  ├── T8-004 (Pharmacist Video)
  └── T8-005 (Doctor Video)

T8-006 (Speech-to-Text)
  └── T8-007 (NLP Highlighting)

T8-019 (Delivery App Init)
  ├── T8-020 (Delivery List)
  ├── T8-021 (GPS Tracking)
  ├── T8-022 (QR Scanner)
  ├── T8-023 (Proof of Delivery)
  ├── T8-024 (Special Handling)
  ├── T8-025 (Earnings)
  └── T8-026 (Offline Mode)

T8-027 (Nurse App Init)
  ├── T8-028 (Patient Search)
  ├── T8-029 (Medication Order)
  ├── T8-030 (Pharmacy Records)
  ├── T8-031 (Delivery Tracking)
  ├── T8-032 (Administration)
  ├── T8-033 (Adverse Reactions)
  └── T8-034 (Shift Handover)

T8-038 (E-Commerce Catalog)
  ├── T8-039 (Cart & Checkout)
  └── T8-040 (Order History)
```

---

**Document Version:** 1.0.0
**Created:** 2025-12-09
**Author:** Claude Code Orchestrator
**Source:** Deep analysis of CDC_Final.md vs codebase implementation
