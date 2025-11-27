# MetaPharm Connect - Production Readiness Tasks

**Generated:** 2025-11-27
**Status:** Comprehensive task list for production readiness
**Current Completion:** ~55%
**Target:** 100% Production Ready

---

## Overview

This document contains ALL tasks required to take MetaPharm Connect from current state (~55% complete) to production-ready. Tasks are organized by priority and include validation steps after each implementation.

**Task ID Format:** `T3-XXX` (T3 = tasks3.md, XXX = sequential number)

**Markers:**
- `[P]` = Can run in parallel with other [P] tasks in same section
- `[S]` = Sequential (depends on previous task)
- `[V]` = Validation task (must pass before next section)
- `[STUB]` = Currently a stub/mock that needs real implementation
- `[MISSING]` = Feature doesn't exist at all
- `[PARTIAL]` = Feature exists but incomplete

**Estimated Total Effort:** 400-450 hours

---

## PHASE 0: Critical Production Blockers (STUB Fixes)
**Priority:** P0 - MUST FIX BEFORE ANY DEPLOYMENT
**Estimated Effort:** 114 hours

### Section 0.1: FDB Drug Interactions API [STUB]
**Current State:** Hardcoded 5 drugs only (warfarin, metformin, lisinopril, simvastatin, digoxin)
**Impact:** Pharmacists can't verify drug safety for most medications

- [ ] [T3-001] [S] Audit current FDB mock implementation in `api/services/drug-interactions/` (2h)
  - Document all hardcoded responses
  - Identify all API endpoints that use the mock
  - List all frontend components consuming drug interaction data

- [ ] [T3-002] [S] Obtain FDB API credentials and documentation (4h)
  - Register for FDB (First Databank) API access
  - Document API endpoints, authentication, rate limits
  - Create `.env` variables for API keys

- [ ] [T3-003] [P] Implement real FDB API client (8h)
  - Create `api/services/drug-interactions/fdb-client.ts`
  - Implement authentication handler
  - Implement drug lookup by name/NDC/RxCUI
  - Implement interaction checking endpoint
  - Add response caching (Redis) for frequently checked drugs

- [ ] [T3-004] [P] Implement drug interaction service (6h)
  - Create `api/services/drug-interactions/interaction-service.ts`
  - Support single drug lookup
  - Support multi-drug interaction matrix
  - Support severity classification (contraindicated, major, moderate, minor)
  - Add patient allergy cross-reference

- [ ] [T3-005] [S] Update frontend drug interaction components (4h)
  - Update `web/src/components/prescriptions/DrugInteractionChecker.tsx`
  - Display interaction severity with color coding
  - Show detailed interaction descriptions
  - Add "override with reason" for pharmacist approval

- [ ] [T3-006] [V] **VALIDATION: FDB Integration Tests** (4h)
  - Write integration tests for FDB API client
  - Test with 50+ common drug combinations
  - Verify all severity levels display correctly
  - Test error handling (API down, rate limited, invalid drug)
  - Test caching behavior
  - **Acceptance:** All tests pass, real API responses for any drug

---

### Section 0.2: Mobile Twilio Video SDK [STUB]
**Current State:** All Twilio imports commented out in mobile apps
**Impact:** Video calls completely broken on mobile

- [ ] [T3-007] [S] Audit mobile video implementation (2h)
  - Review `mobile/pharmacist/src/features/teleconsultation/`
  - Review `mobile/patient/src/features/teleconsultation/`
  - Document all commented-out Twilio imports
  - Identify iOS/Android native module requirements

- [ ] [T3-008] [P] Install and configure react-native-twilio-video (4h)
  - Add `react-native-twilio-video-webrtc` to mobile projects
  - Configure iOS permissions (camera, microphone)
  - Configure Android permissions
  - Link native modules

- [ ] [T3-009] [P] Implement mobile video room service (8h)
  - Create `mobile/shared/services/video-room.ts`
  - Implement room creation/joining
  - Implement participant management
  - Implement audio/video toggle
  - Implement camera switching (front/back)
  - Handle network disconnection/reconnection

- [ ] [T3-010] [S] Update mobile teleconsultation screens (6h)
  - Update `mobile/pharmacist/src/screens/TeleconsultationScreen.tsx`
  - Update `mobile/patient/src/screens/TeleconsultationScreen.tsx`
  - Add video preview before joining
  - Add in-call controls (mute, camera, end call)
  - Add participant video grid

- [ ] [T3-011] [S] Implement mobile-specific video features (4h)
  - Picture-in-picture support
  - Background audio continuation
  - Call quality indicator
  - Bandwidth adaptation

- [ ] [T3-012] [V] **VALIDATION: Mobile Video E2E Tests** (6h)
  - Test iOS video call end-to-end
  - Test Android video call end-to-end
  - Test pharmacist-to-patient call flow
  - Test call with poor network conditions
  - Test camera/mic permissions handling
  - **Acceptance:** Video calls work on both iOS and Android simulators

---

### Section 0.3: Speech-to-Text Transcription [STUB]
**Current State:** Returns hardcoded text for all consultations
**Impact:** All transcripts show same fake content

- [ ] [T3-013] [S] Audit transcription service (2h)
  - Review `api/services/transcription/`
  - Document hardcoded responses
  - Identify transcription trigger points

- [ ] [T3-014] [S] Choose and configure transcription provider (2h)
  - Evaluate: AWS Transcribe Medical, Google Speech-to-Text Medical, Azure Speech
  - Select provider with medical vocabulary support
  - Configure API credentials
  - Document HIPAA compliance requirements

- [ ] [T3-015] [P] Implement real transcription service (8h)
  - Create `api/services/transcription/transcription-service.ts`
  - Implement real-time streaming transcription
  - Implement batch transcription for recordings
  - Support French medical terminology (Swiss market)
  - Add speaker diarization (identify who said what)

- [ ] [T3-016] [P] Implement transcription storage and retrieval (4h)
  - Store transcripts in encrypted format
  - Link transcripts to consultation records
  - Implement search within transcripts
  - Add transcript editing capability (pharmacist corrections)

- [ ] [T3-017] [S] Update frontend transcript display (3h)
  - Update consultation summary screen
  - Show real-time transcript during call
  - Add timestamp markers
  - Add speaker labels

- [ ] [T3-018] [V] **VALIDATION: Transcription Tests** (4h)
  - Test with sample medical conversations
  - Verify French language accuracy
  - Test speaker identification
  - Test transcript search
  - **Acceptance:** >90% accuracy on medical terminology

---

### Section 0.4: Mobile QR Camera Integration [STUB]
**Current State:** Camera not integrated, scanner UI exists but doesn't scan
**Impact:** Can't scan inventory or prescriptions on mobile

- [ ] [T3-019] [S] Audit QR scanner implementation (1h)
  - Review `mobile/pharmacist/src/features/inventory/QRScanner.tsx`
  - Identify missing camera integration

- [ ] [T3-020] [P] Install and configure camera libraries (3h)
  - Add `react-native-camera` or `expo-camera`
  - Add `react-native-qrcode-scanner`
  - Configure iOS/Android camera permissions
  - Link native modules

- [ ] [T3-021] [S] Implement QR scanning service (4h)
  - Create `mobile/shared/services/qr-scanner.ts`
  - Implement barcode/QR code detection
  - Support multiple formats (QR, Code128, EAN)
  - Add scan result validation
  - Implement torch/flashlight toggle

- [ ] [T3-022] [S] Update inventory QR scanner screen (3h)
  - Integrate real camera feed
  - Add scan overlay with targeting box
  - Handle scan results (lookup product, update inventory)
  - Add manual entry fallback

- [ ] [T3-023] [V] **VALIDATION: QR Scanner Tests** (2h)
  - Test scanning various QR codes
  - Test barcode scanning
  - Test low-light conditions (torch)
  - Test rapid consecutive scans
  - **Acceptance:** Scans work reliably on physical devices

---

### Section 0.5: Audit & Notification Services [TODO]
**Current State:** No implementation exists
**Impact:** No compliance logging, no user notifications

- [ ] [T3-024] [P] Implement audit logging service (6h)
  - Create `api/services/audit/audit-service.ts`
  - Log all prescription approvals/rejections
  - Log all drug interaction overrides
  - Log all patient data access
  - Log all teleconsultation sessions
  - Store in append-only audit table

- [ ] [T3-025] [P] Implement notification service (8h)
  - Create `api/services/notifications/notification-service.ts`
  - Implement push notifications (Firebase Cloud Messaging)
  - Implement email notifications (SendGrid/SES)
  - Implement SMS notifications (Twilio)
  - Support notification preferences per user

- [ ] [T3-026] [S] Implement appointment reminders (4h)
  - Create reminder scheduler (cron job)
  - Send 24h before reminder
  - Send 1h before reminder
  - Handle timezone correctly (Swiss timezone)

- [ ] [T3-027] [S] Integrate notifications throughout app (4h)
  - Prescription status change notifications
  - Teleconsultation reminders
  - Delivery status notifications
  - Low stock alerts for pharmacists

- [ ] [T3-028] [V] **VALIDATION: Audit & Notification Tests** (4h)
  - Verify audit logs capture all required events
  - Test push notifications on iOS/Android
  - Test email delivery
  - Test reminder scheduling
  - **Acceptance:** All events logged, notifications delivered within 30s

---

## PHASE 1: Missing Core Features
**Priority:** P1 - Required for MVP
**Estimated Effort:** 212 hours

### Section 1.1: Patient E-Commerce [MISSING]
**Current State:** 0% implemented - patients cannot purchase anything
**Impact:** Major revenue stream missing

#### 1.1.1: Product Catalog & Search

- [ ] [T3-029] [S] Design e-commerce database schema (4h)
  - Products table (OTC medications, parapharmacy)
  - Categories table
  - Inventory linkage
  - Pricing table (with pharmacy-specific pricing)
  - Product images storage

- [ ] [T3-030] [P] Create product catalog API endpoints (6h)
  - `GET /api/products` - List with pagination
  - `GET /api/products/:id` - Product details
  - `GET /api/products/search` - Full-text search
  - `GET /api/categories` - Category tree
  - Implement Elasticsearch for product search

- [ ] [T3-031] [P] Create product catalog frontend (8h)
  - Create `web/src/pages/patient/Shop.tsx`
  - Create `web/src/components/shop/ProductGrid.tsx`
  - Create `web/src/components/shop/ProductCard.tsx`
  - Create `web/src/components/shop/ProductFilters.tsx`
  - Create `web/src/components/shop/SearchBar.tsx`
  - Implement infinite scroll pagination

- [ ] [T3-032] [S] Create product detail page (4h)
  - Create `web/src/pages/patient/ProductDetail.tsx`
  - Display product images (gallery)
  - Display description, ingredients, usage
  - Display price and availability
  - Add to cart button
  - Related products section

- [ ] [T3-033] [V] **VALIDATION: Product Catalog Tests** (3h)
  - Test product listing with 1000+ products
  - Test search accuracy
  - Test filter combinations
  - Test mobile responsiveness
  - **Acceptance:** Search returns results in <500ms

#### 1.1.2: Shopping Cart

- [ ] [T3-034] [S] Create cart API endpoints (4h)
  - `POST /api/cart/items` - Add item
  - `PUT /api/cart/items/:id` - Update quantity
  - `DELETE /api/cart/items/:id` - Remove item
  - `GET /api/cart` - Get cart contents
  - `DELETE /api/cart` - Clear cart
  - Persist cart in database (logged in) or session (guest)

- [ ] [T3-035] [P] Create cart frontend components (6h)
  - Create `web/src/components/shop/CartIcon.tsx` (header icon with count)
  - Create `web/src/components/shop/CartDropdown.tsx` (quick view)
  - Create `web/src/pages/patient/Cart.tsx` (full cart page)
  - Create `web/src/components/shop/CartItem.tsx`
  - Quantity adjustment with +/- buttons
  - Remove item functionality
  - Cart totals calculation

- [ ] [T3-036] [S] Implement cart business logic (3h)
  - Stock validation (can't add more than available)
  - Price updates on quantity change
  - Promo code application
  - Shipping cost calculation
  - Tax calculation (Swiss VAT)

- [ ] [T3-037] [V] **VALIDATION: Shopping Cart Tests** (2h)
  - Test add/remove/update items
  - Test stock limits
  - Test promo codes
  - Test cart persistence across sessions
  - **Acceptance:** Cart operations work reliably

#### 1.1.3: Checkout Process

- [ ] [T3-038] [S] Create checkout API endpoints (6h)
  - `POST /api/checkout/validate` - Validate cart before checkout
  - `POST /api/checkout/address` - Save delivery address
  - `POST /api/checkout/payment` - Process payment
  - `POST /api/orders` - Create order
  - Integrate with payment provider (Stripe)

- [ ] [T3-039] [P] Create checkout frontend (8h)
  - Create `web/src/pages/patient/Checkout.tsx`
  - Step 1: Address form (billing/shipping)
  - Step 2: Delivery options (standard/express)
  - Step 3: Payment method selection
  - Step 4: Order review
  - Step 5: Confirmation page
  - Progress indicator

- [ ] [T3-040] [P] Implement Stripe payment integration (6h)
  - Create `api/services/payments/stripe-service.ts`
  - Implement payment intent creation
  - Implement card tokenization (frontend)
  - Handle 3D Secure authentication
  - Handle payment success/failure webhooks
  - Store payment records

- [ ] [T3-041] [S] Create order confirmation flow (3h)
  - Generate order number
  - Send confirmation email
  - Create order record in database
  - Link to delivery system
  - Show estimated delivery date

- [ ] [T3-042] [V] **VALIDATION: Checkout E2E Tests** (4h)
  - Test complete checkout flow
  - Test payment with test cards (success, decline, 3DS)
  - Test address validation
  - Test order creation
  - **Acceptance:** Full checkout completes successfully

#### 1.1.4: Order History & Tracking

- [ ] [T3-043] [S] Create order history API endpoints (3h)
  - `GET /api/orders` - List user orders
  - `GET /api/orders/:id` - Order details
  - `POST /api/orders/:id/reorder` - Reorder past order
  - `POST /api/orders/:id/cancel` - Cancel order (if not shipped)

- [ ] [T3-044] [P] Create order history frontend (5h)
  - Create `web/src/pages/patient/Orders.tsx`
  - Create `web/src/pages/patient/OrderDetail.tsx`
  - Display order status timeline
  - Display order items and totals
  - Reorder button
  - Cancel button (conditional)

- [ ] [T3-045] [S] Implement order status tracking (4h)
  - Status: pending, confirmed, preparing, shipped, delivered, cancelled
  - Real-time status updates via WebSocket
  - Integrate with delivery tracking

- [ ] [T3-046] [V] **VALIDATION: Order History Tests** (2h)
  - Test order listing pagination
  - Test order detail display
  - Test reorder functionality
  - Test status updates
  - **Acceptance:** Orders display correctly with real-time updates

#### 1.1.5: Product Reviews

- [ ] [T3-047] [S] Create reviews API endpoints (3h)
  - `GET /api/products/:id/reviews` - List reviews
  - `POST /api/products/:id/reviews` - Submit review
  - `PUT /api/reviews/:id` - Edit review
  - `DELETE /api/reviews/:id` - Delete review
  - `POST /api/reviews/:id/helpful` - Mark helpful

- [ ] [T3-048] [P] Create reviews frontend (4h)
  - Create `web/src/components/shop/ProductReviews.tsx`
  - Create `web/src/components/shop/ReviewForm.tsx`
  - Create `web/src/components/shop/StarRating.tsx`
  - Display average rating
  - Rating breakdown chart
  - Sort/filter reviews

- [ ] [T3-049] [S] Implement review moderation (2h)
  - Flag inappropriate reviews
  - Pharmacist review approval queue
  - Verified purchase badge

- [ ] [T3-050] [V] **VALIDATION: Reviews Tests** (2h)
  - Test review submission
  - Test rating calculations
  - Test helpful voting
  - **Acceptance:** Reviews system fully functional

---

### Section 1.2: Delivery System [MISSING]
**Current State:** 8% implemented - basic delivery list only
**Impact:** No real-time tracking, no route optimization, no proof of delivery

#### 1.2.1: Delivery GPS Tracking

- [ ] [T3-051] [S] Design delivery tracking architecture (3h)
  - Real-time location updates (WebSocket)
  - Location history storage
  - Privacy considerations (data retention)
  - Battery optimization strategy

- [ ] [T3-052] [P] Implement location tracking service (8h)
  - Create `mobile/delivery/src/services/location-service.ts`
  - Background location tracking
  - Location update batching (every 30s)
  - Battery-efficient tracking modes
  - Geofencing for delivery zones

- [ ] [T3-053] [P] Create delivery tracking API (6h)
  - `POST /api/deliveries/:id/location` - Update driver location
  - `GET /api/deliveries/:id/tracking` - Get delivery tracking
  - `WS /api/deliveries/:id/live` - Live location WebSocket
  - Store location history in time-series DB

- [ ] [T3-054] [S] Create patient tracking view (6h)
  - Create `web/src/pages/patient/DeliveryTracking.tsx`
  - Interactive map with driver location
  - ETA calculation and display
  - Delivery progress timeline
  - Driver info (name, photo, contact)

- [ ] [T3-055] [V] **VALIDATION: GPS Tracking Tests** (4h)
  - Test location updates in background
  - Test WebSocket real-time updates
  - Test ETA accuracy
  - Test map display
  - **Acceptance:** Live tracking works with <5s delay

#### 1.2.2: Route Optimization

- [ ] [T3-056] [S] Integrate routing service (4h)
  - Choose provider: Google Maps, HERE, OSRM
  - Create `api/services/routing/route-service.ts`
  - Implement multi-stop optimization
  - Consider delivery time windows

- [ ] [T3-057] [P] Create route optimization algorithm (6h)
  - Implement traveling salesman approximation
  - Consider traffic conditions
  - Prioritize time-sensitive deliveries (medications)
  - Handle delivery constraints (cold chain, controlled substances)

- [ ] [T3-058] [P] Update delivery mobile app with navigation (6h)
  - Create `mobile/delivery/src/screens/NavigationScreen.tsx`
  - Display optimized route on map
  - Turn-by-turn navigation
  - Next delivery preview
  - Route recalculation on deviation

- [ ] [T3-059] [V] **VALIDATION: Routing Tests** (3h)
  - Test route optimization with 10+ stops
  - Test navigation accuracy
  - Test route recalculation
  - **Acceptance:** Routes optimize within 2s, navigation works

#### 1.2.3: Proof of Delivery

- [ ] [T3-060] [S] Design proof of delivery system (2h)
  - Signature capture
  - Photo capture
  - Recipient name recording
  - Timestamp and location verification

- [ ] [T3-061] [P] Implement signature capture (4h)
  - Create `mobile/delivery/src/components/SignatureCanvas.tsx`
  - Touch-based signature drawing
  - Clear and retry functionality
  - Save as image

- [ ] [T3-062] [P] Implement photo capture (3h)
  - Create `mobile/delivery/src/components/DeliveryPhotoCapture.tsx`
  - Camera integration
  - Photo preview and retake
  - Automatic location/timestamp embedding

- [ ] [T3-063] [S] Create delivery completion flow (4h)
  - Create `mobile/delivery/src/screens/DeliveryCompleteScreen.tsx`
  - Capture signature OR photo
  - Record recipient name
  - Mark delivery as complete
  - Upload proof to server

- [ ] [T3-064] [S] Store and display proof of delivery (3h)
  - Store proof images in S3/cloud storage
  - Link proof to delivery record
  - Display proof in patient order history
  - Display in pharmacy delivery management

- [ ] [T3-065] [V] **VALIDATION: Proof of Delivery Tests** (3h)
  - Test signature capture on various devices
  - Test photo capture and upload
  - Test proof display in order history
  - **Acceptance:** Complete proof of delivery workflow

#### 1.2.4: Cold Chain & Special Handling

- [ ] [T3-066] [S] Implement cold chain tracking (4h)
  - Temperature-sensitive medication flags
  - Delivery time constraints
  - Alert if delivery taking too long
  - Special handling instructions display

- [ ] [T3-067] [S] Implement controlled substance handling (4h)
  - Require signature for controlled substances
  - Age verification prompt
  - ID scanning integration (optional)
  - Regulatory compliance logging

- [ ] [T3-068] [V] **VALIDATION: Special Handling Tests** (2h)
  - Test cold chain alerts
  - Test controlled substance workflow
  - **Acceptance:** Special handling requirements enforced

---

### Section 1.3: Nurse Mobile App [MISSING]
**Current State:** 0% - App doesn't exist
**Impact:** Nurses completely excluded from platform

- [ ] [T3-069] [S] Set up nurse mobile app project (4h)
  - Create `mobile/nurse/` directory structure
  - Configure React Native project
  - Set up navigation
  - Configure authentication flow
  - Set up API client

- [ ] [T3-070] [P] Create nurse dashboard screen (6h)
  - Create `mobile/nurse/src/screens/DashboardScreen.tsx`
  - Patient list for current shift
  - Medication schedule overview
  - Pending orders
  - Alerts and notifications

- [ ] [T3-071] [P] Create patient search and list (6h)
  - Create `mobile/nurse/src/screens/PatientListScreen.tsx`
  - Search patients by name/ID
  - Filter by assigned patients
  - Patient quick-view cards
  - Navigate to patient detail

- [ ] [T3-072] [S] Create patient detail screen (6h)
  - Create `mobile/nurse/src/screens/PatientDetailScreen.tsx`
  - Patient demographics
  - Current medications
  - Allergies and conditions
  - Recent orders
  - Medication administration history

- [ ] [T3-073] [P] Create medication ordering screen (8h)
  - Create `mobile/nurse/src/screens/MedicationOrderScreen.tsx`
  - Select patient
  - Browse/search medications
  - Add to order
  - Specify quantity and urgency
  - Submit to pharmacy

- [ ] [T3-074] [P] Create medication administration recording (6h)
  - Create `mobile/nurse/src/screens/MedicationAdminScreen.tsx`
  - Scan medication barcode
  - Verify against patient schedule
  - Record administration time
  - Record any observations
  - Handle refused/missed doses

- [ ] [T3-075] [S] Create shift handover feature (4h)
  - Create `mobile/nurse/src/screens/HandoverScreen.tsx`
  - Generate shift summary
  - Highlight critical patients
  - Add handover notes
  - Confirm handover with receiving nurse

- [ ] [T3-076] [S] Integrate nurse app with pharmacy backend (6h)
  - Connect to patient records API
  - Connect to medication orders API
  - Real-time notifications for order status
  - Sync medication administration records

- [ ] [T3-077] [V] **VALIDATION: Nurse App E2E Tests** (6h)
  - Test complete medication ordering flow
  - Test medication administration recording
  - Test patient lookup
  - Test shift handover
  - Test on iOS and Android
  - **Acceptance:** All nurse workflows complete successfully

---

## PHASE 2: Partial Features to Complete
**Priority:** P2 - Important for full functionality
**Estimated Effort:** 80 hours

### Section 2.1: Medical Records Access [PARTIAL]
**Current State:** 12% - Structure exists but no data access

- [ ] [T3-078] [S] Design patient medical records architecture (3h)
  - Data model for records
  - E-santé API integration plan
  - Privacy and consent management

- [ ] [T3-079] [P] Implement medical records API (6h)
  - `GET /api/patients/:id/records` - List medical records
  - `GET /api/patients/:id/medications` - Current medications
  - `GET /api/patients/:id/allergies` - Allergies
  - `GET /api/patients/:id/conditions` - Medical conditions
  - `GET /api/patients/:id/vaccinations` - Vaccination history

- [ ] [T3-080] [P] Create patient medical records view (6h)
  - Create `web/src/pages/patient/MedicalRecords.tsx`
  - Medications list with history
  - Allergies and alerts
  - Conditions and diagnoses
  - Lab results (if available)
  - Vaccination record

- [ ] [T3-081] [S] Implement e-santé API integration (8h)
  - Create `api/services/esante/esante-client.ts`
  - OAuth2 authentication with e-santé
  - Fetch patient records from cantonal systems
  - Handle data format conversion
  - Cache frequently accessed records

- [ ] [T3-082] [S] Implement consent management (4h)
  - Patient consent for data access
  - Granular sharing controls
  - Consent audit trail
  - Revocation handling

- [ ] [T3-083] [V] **VALIDATION: Medical Records Tests** (4h)
  - Test records display
  - Test e-santé integration (with test environment)
  - Test consent flow
  - **Acceptance:** Records accessible with proper consent

---

### Section 2.2: Multi-Channel Communication [PARTIAL]
**Current State:** 33% - Basic in-app messaging only

- [ ] [T3-084] [S] Design unified inbox architecture (2h)
  - Message aggregation from all channels
  - Conversation threading
  - Channel routing rules

- [ ] [T3-085] [P] Implement WhatsApp integration (8h)
  - Create `api/services/messaging/whatsapp-service.ts`
  - WhatsApp Business API integration
  - Message templates for notifications
  - Two-way messaging support
  - Media attachments

- [ ] [T3-086] [P] Implement email integration (4h)
  - Create `api/services/messaging/email-service.ts`
  - Transactional emails (SendGrid/SES)
  - Email parsing for replies
  - Attachment handling

- [ ] [T3-087] [P] Implement fax integration (4h)
  - Create `api/services/messaging/fax-service.ts`
  - Fax sending via eFax/Twilio
  - Inbound fax to PDF conversion
  - Fax status tracking

- [ ] [T3-088] [S] Create unified inbox UI (6h)
  - Create `web/src/pages/pharmacist/UnifiedInbox.tsx`
  - Display messages from all channels
  - Reply from inbox (routes to correct channel)
  - Channel indicators (WhatsApp, email, fax, in-app)
  - Conversation history

- [ ] [T3-089] [V] **VALIDATION: Messaging Tests** (4h)
  - Test WhatsApp send/receive
  - Test email send/receive
  - Test fax sending
  - Test unified inbox display
  - **Acceptance:** All channels working in unified view

---

### Section 2.3: Analytics Dashboard [PARTIAL]
**Current State:** 37% - Basic dashboard only

- [ ] [T3-090] [P] Implement sales analytics (6h)
  - Daily/weekly/monthly sales
  - Revenue by category
  - Top selling products
  - Sales trends and forecasts
  - Export to CSV/Excel

- [ ] [T3-091] [P] Implement patient analytics (4h)
  - Patient demographics
  - Prescription patterns
  - Consultation statistics
  - Patient retention metrics

- [ ] [T3-092] [P] Implement inventory analytics (4h)
  - Stock turnover rates
  - Dead stock identification
  - Reorder point recommendations
  - Cost analysis

- [ ] [T3-093] [S] Create analytics dashboard UI (6h)
  - Create `web/src/pages/pharmacist/Analytics.tsx`
  - Interactive charts (Chart.js/Recharts)
  - Date range selection
  - Comparison views
  - Export functionality

- [ ] [T3-094] [V] **VALIDATION: Analytics Tests** (3h)
  - Test data accuracy
  - Test chart rendering
  - Test export functionality
  - **Acceptance:** All analytics display correctly

---

## PHASE 3: Enhancement Features
**Priority:** P3 - Nice to have, differentiators
**Estimated Effort:** 60 hours

### Section 3.1: VIP "Golden MetaPharm" Program [MISSING]

- [ ] [T3-095] [S] Design VIP program architecture (3h)
  - Tier system (Silver, Gold, Platinum)
  - Points accumulation rules
  - Benefits per tier
  - Upgrade/downgrade logic

- [ ] [T3-096] [P] Implement points system (6h)
  - Points earning on purchases
  - Points redemption for discounts
  - Points history
  - Expiration handling

- [ ] [T3-097] [P] Implement tier benefits (6h)
  - Free delivery thresholds
  - Exclusive discounts
  - Priority teleconsultation
  - Birthday rewards
  - Early access to promotions

- [ ] [T3-098] [S] Create VIP program UI (6h)
  - Create `web/src/pages/patient/VIPProgram.tsx`
  - Points balance display
  - Current tier and progress
  - Available benefits
  - Points history
  - Reward catalog

- [ ] [T3-099] [V] **VALIDATION: VIP Program Tests** (3h)
  - Test points accumulation
  - Test tier upgrades
  - Test benefit application
  - **Acceptance:** VIP program fully functional

---

### Section 3.2: Doctor E-Prescription [PARTIAL]

- [ ] [T3-100] [S] Complete doctor prescription creation (6h)
  - Full prescription form
  - Drug database search
  - Dosage instructions
  - Duration and refills
  - Digital signature

- [ ] [T3-101] [S] Implement pharmacy sending (4h)
  - Select patient's preferred pharmacy
  - Direct prescription transmission
  - Confirmation receipt
  - Prescription status tracking

- [ ] [T3-102] [S] Implement prescription templates (4h)
  - Save common prescriptions
  - Quick prescription from template
  - Template management

- [ ] [T3-103] [V] **VALIDATION: E-Prescription Tests** (3h)
  - Test prescription creation
  - Test pharmacy transmission
  - Test template usage
  - **Acceptance:** E-prescriptions flow end-to-end

---

### Section 3.3: AI-Powered Features [PARTIAL]

- [ ] [T3-104] [S] Implement ML-based inventory forecasting (8h)
  - Replace heuristics with ML model
  - AWS Forecast or custom model
  - Seasonal pattern detection
  - Demand spike prediction

- [ ] [T3-105] [S] Implement medication recommendation engine (6h)
  - Patient profile analysis
  - Purchase history patterns
  - Health condition matching
  - Personalized recommendations

- [ ] [T3-106] [S] Implement digital twin patient profile (6h)
  - Aggregate patient health data
  - Risk score calculation
  - Predictive health insights
  - Care recommendations

- [ ] [T3-107] [V] **VALIDATION: AI Features Tests** (4h)
  - Test forecast accuracy
  - Test recommendation relevance
  - Test risk scoring
  - **Acceptance:** AI features provide accurate insights

---

## PHASE 4: Testing & Quality Assurance
**Priority:** P1 - Required for production
**Estimated Effort:** 40 hours

### Section 4.1: E2E Test Suite Completion

- [ ] [T3-108] [S] Fix existing E2E test failures (8h)
  - Un-skip all skipped tests
  - Fix checkout-process tests
  - Fix order-history tests
  - Fix product-reviews tests
  - Fix product-search tests
  - Fix shopping-cart tests

- [ ] [T3-109] [P] Write E2E tests for new features (12h)
  - E-commerce full flow tests
  - Delivery tracking tests
  - Nurse app tests
  - VIP program tests
  - Multi-channel messaging tests

- [ ] [T3-110] [V] **VALIDATION: Full E2E Test Suite** (4h)
  - Run complete test suite
  - All tests must pass
  - **Acceptance:** 100% E2E test pass rate

### Section 4.2: Performance & Security

- [ ] [T3-111] [P] Performance testing (6h)
  - Load testing (k6/Artillery)
  - API response time benchmarks
  - Database query optimization
  - Frontend bundle size optimization

- [ ] [T3-112] [P] Security audit (6h)
  - OWASP top 10 check
  - Authentication/authorization review
  - Data encryption verification
  - Penetration testing prep

- [ ] [T3-113] [S] HIPAA/GDPR compliance check (4h)
  - Data handling review
  - Consent management verification
  - Audit trail completeness
  - Data retention policies

- [ ] [T3-114] [V] **VALIDATION: Security & Compliance** (4h)
  - Run security scans
  - Review compliance checklist
  - **Acceptance:** No critical vulnerabilities, compliance requirements met

---

## Summary Statistics

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 0: STUB Fixes | 28 | 114h |
| Phase 1: Missing Core | 49 | 212h |
| Phase 2: Partial Features | 17 | 80h |
| Phase 3: Enhancements | 13 | 60h |
| Phase 4: QA | 7 | 40h |
| **TOTAL** | **114** | **506h** |

**With 4 developers working in parallel:** ~4-5 weeks to production ready

---

## Dependency Graph

```
Phase 0 (STUB Fixes) ──┬── All features depend on working infrastructure
                       │
Phase 1.1 (E-Commerce) ├── Depends on: Payment (Stripe), Inventory
Phase 1.2 (Delivery)   ├── Depends on: E-Commerce (orders)
Phase 1.3 (Nurse App)  ├── Depends on: Patient records API
                       │
Phase 2 (Partial)      ├── Can run parallel to Phase 1
                       │
Phase 3 (Enhancement)  ├── Depends on: Phase 1 completion
                       │
Phase 4 (QA)           └── Must be last
```

---

## Quick Reference: What to Build First

1. **Week 1:** Fix all STUB implementations (Phase 0)
2. **Week 2-3:** E-Commerce + Delivery (Phase 1.1, 1.2 in parallel)
3. **Week 3-4:** Nurse App + Medical Records (Phase 1.3, 2.1)
4. **Week 4-5:** Remaining features + QA (Phase 2, 3, 4)

