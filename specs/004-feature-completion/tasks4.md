# Phase 4: Feature Completion Tasks

**Version**: 1.0.0
**Created**: November 30, 2025
**Based On**: Gap Analysis (docs/GAP_ANALYSIS.md)
**Total Tasks**: 89

---

## Overview

This task list addresses all missing features identified in the gap analysis, organized by priority and feature group. Each task includes acceptance criteria, dependencies, and estimated complexity.

---

## Priority Legend

- **P0**: Critical - Blocking launch
- **P1**: High - Required for MVP
- **P2**: Medium - Important for full experience
- **P3**: Lower - Nice to have

## Complexity Legend

- **S**: Small (1-2 hours)
- **M**: Medium (2-4 hours)
- **L**: Large (4-8 hours)
- **XL**: Extra Large (1-2 days)

---

# P0 - CRITICAL: Nurse App (Complete User Role Missing)

## Group: NURSE-FRONTEND (Nurse Web Application)

### T4-001: Create Nurse App Directory Structure
**Priority**: P0 | **Complexity**: S
**Description**: Set up the nurse app folder structure in `web/src/apps/nurse/` following the existing pattern from other apps.

**Acceptance Criteria**:
- [ ] Create `web/src/apps/nurse/` directory
- [ ] Create `pages/` subdirectory
- [ ] Create `components/` subdirectory
- [ ] Create nurse app entry point
- [ ] Add nurse routes to main router

**Dependencies**: None

---

### T4-002: Implement Nurse Dashboard Page
**Priority**: P0 | **Complexity**: L
**Description**: Create the main nurse dashboard showing key metrics, pending orders, and recent activity.

**Acceptance Criteria**:
- [ ] Display count of pending medication orders
- [ ] Show list of patients with active prescriptions
- [ ] Display recent order history (last 7 days)
- [ ] Show delivery status overview
- [ ] Include quick action buttons (new order, view patients)
- [ ] Responsive design for mobile/tablet

**Dependencies**: T4-001

**File**: `web/src/apps/nurse/pages/Dashboard.tsx`

---

### T4-003: Implement Patient List Component
**Priority**: P0 | **Complexity**: M
**Description**: Create a searchable, filterable list of patients that the nurse manages.

**Acceptance Criteria**:
- [ ] Display patient list with name, room/location, last order date
- [ ] Search by patient name or ID
- [ ] Filter by active/inactive status
- [ ] Sort by name, last order date, urgency
- [ ] Pagination support (20 items per page)
- [ ] Click to view patient detail

**Dependencies**: T4-001

**File**: `web/src/apps/nurse/components/PatientList.tsx`

---

### T4-004: Implement Patient Detail View
**Priority**: P0 | **Complexity**: L
**Description**: Patient detail page showing medication history, current prescriptions, and order history.

**Acceptance Criteria**:
- [ ] Display patient demographic info (name, DOB, room)
- [ ] Show current active medications
- [ ] Display prescription validity status
- [ ] Show order history with status
- [ ] Include insurance/coverage information
- [ ] Button to create new order for patient

**Dependencies**: T4-003

**File**: `web/src/apps/nurse/pages/PatientDetail.tsx`

---

### T4-005: Implement Medication Order Form
**Priority**: P0 | **Complexity**: XL
**Description**: Form for nurses to create medication orders for patients, with suggestions based on history.

**Acceptance Criteria**:
- [ ] Patient selector (searchable dropdown)
- [ ] Medication selector with autocomplete
- [ ] Display medication history suggestions
- [ ] Quantity input with validation
- [ ] Urgency level selector (normal, urgent, critical)
- [ ] Notes field for special instructions
- [ ] Delivery scheduling options
- [ ] Prescription validity check (warn if expired)
- [ ] Show stock availability status
- [ ] Submit creates order in backend

**Dependencies**: T4-004

**File**: `web/src/apps/nurse/pages/CreateOrder.tsx`

---

### T4-006: Implement Order Tracking Page
**Priority**: P0 | **Complexity**: L
**Description**: Page showing all orders with their current status, with real-time updates.

**Acceptance Criteria**:
- [ ] Display all orders with status (pending, preparing, in transit, delivered)
- [ ] Filter by status, date range, patient
- [ ] Real-time status updates via WebSocket
- [ ] Show estimated delivery time
- [ ] Display delivery person info when in transit
- [ ] Click to view order details

**Dependencies**: T4-005

**File**: `web/src/apps/nurse/pages/OrderTracking.tsx`

---

### T4-007: Implement Order Detail View
**Priority**: P0 | **Complexity**: M
**Description**: Detailed view of a specific order showing full timeline and information.

**Acceptance Criteria**:
- [ ] Display order items with quantities and prices
- [ ] Show full status timeline (created → validated → prepared → shipped → delivered)
- [ ] Display pharmacist who prepared the order
- [ ] Show delivery person details
- [ ] Display proof of delivery (signature/photo) if delivered
- [ ] Option to report issue/contact pharmacy

**Dependencies**: T4-006

**File**: `web/src/apps/nurse/pages/OrderDetail.tsx`

---

### T4-008: Implement Delivery Notifications Component
**Priority**: P0 | **Complexity**: M
**Description**: Real-time notification system for order status updates.

**Acceptance Criteria**:
- [ ] Show toast notifications for status changes
- [ ] Display notification bell with unread count
- [ ] Notification dropdown with recent updates
- [ ] Mark as read functionality
- [ ] Click notification to go to order detail
- [ ] Push notification integration (browser)

**Dependencies**: T4-006

**File**: `web/src/apps/nurse/components/DeliveryNotifications.tsx`

---

### T4-009: Implement Order PDF Export
**Priority**: P0 | **Complexity**: M
**Description**: Generate PDF reports for order traceability and documentation.

**Acceptance Criteria**:
- [ ] Export single order as PDF
- [ ] Export multiple orders as PDF report
- [ ] Include all order details (items, timestamps, personnel)
- [ ] Include patient information
- [ ] Include proof of delivery if available
- [ ] Professional formatting with pharmacy branding

**Dependencies**: T4-007

**File**: `web/src/apps/nurse/utils/pdfExport.ts`

---

### T4-010: Implement Nurse Navigation & Layout
**Priority**: P0 | **Complexity**: M
**Description**: Create the navigation structure and layout components for the nurse app.

**Acceptance Criteria**:
- [ ] Sidebar navigation with all nurse pages
- [ ] Top bar with notifications and profile
- [ ] Breadcrumb navigation
- [ ] Mobile-responsive hamburger menu
- [ ] Active route highlighting
- [ ] User profile dropdown

**Dependencies**: T4-001

**File**: `web/src/apps/nurse/components/NurseLayout.tsx`

---

## Group: NURSE-BACKEND (Nurse Backend Enhancements)

### T4-011: Extend Nurse Service with Order Management
**Priority**: P0 | **Complexity**: L
**Description**: Add order management endpoints to the nurse service.

**Acceptance Criteria**:
- [ ] GET /nurse/orders - List nurse's orders with filters
- [ ] POST /nurse/orders - Create order for patient
- [ ] GET /nurse/orders/:id - Get order details
- [ ] GET /nurse/patients - List nurse's patients
- [ ] GET /nurse/patients/:id/medications - Get patient medications
- [ ] Proper authorization checks

**Dependencies**: None

**File**: `backend/services/nurse-service/src/routes/orders.ts`

---

### T4-012: Implement Nurse Order Workflow Integration
**Priority**: P0 | **Complexity**: L
**Description**: Integrate nurse orders with the main order-service and notification system.

**Acceptance Criteria**:
- [ ] Nurse orders appear in pharmacist queue
- [ ] Automatic prescription validation on order
- [ ] Insurance/coverage check integration
- [ ] Notification to nurse on status changes
- [ ] Integration with delivery service

**Dependencies**: T4-011

**File**: `backend/services/nurse-service/src/services/orderWorkflow.ts`

---

### T4-013: Add Nurse-Specific WebSocket Events
**Priority**: P0 | **Complexity**: M
**Description**: Add WebSocket events for real-time order tracking for nurses.

**Acceptance Criteria**:
- [ ] nurse:order:created event
- [ ] nurse:order:status_changed event
- [ ] nurse:delivery:update event
- [ ] nurse:notification event
- [ ] Proper room/channel management per nurse

**Dependencies**: T4-012

**File**: `backend/services/nurse-service/src/websocket/events.ts`

---

### T4-014: Nurse App Unit Tests
**Priority**: P0 | **Complexity**: L
**Description**: Write comprehensive unit tests for all nurse frontend components.

**Acceptance Criteria**:
- [ ] Test coverage > 80% for all nurse components
- [ ] Test order creation flow
- [ ] Test patient list filtering/searching
- [ ] Test notification handling
- [ ] Test PDF export
- [ ] Mock API responses

**Dependencies**: T4-001 through T4-010

**File**: `web/src/apps/nurse/**/__tests__/`

---

### T4-015: Nurse Backend Integration Tests
**Priority**: P0 | **Complexity**: M
**Description**: Write integration tests for nurse backend services.

**Acceptance Criteria**:
- [ ] Test order CRUD operations
- [ ] Test workflow integration
- [ ] Test WebSocket events
- [ ] Test authorization
- [ ] Test notification triggers

**Dependencies**: T4-011 through T4-013

**File**: `backend/services/nurse-service/src/__tests__/integration/`

---

---

# P0 - CRITICAL: Multi-Channel Messaging

## Group: MESSAGING-BACKEND (Messaging Service Implementation)

### T4-016: Implement Messaging Service Core
**Priority**: P0 | **Complexity**: XL
**Description**: Build the core messaging service with database models and basic CRUD operations.

**Acceptance Criteria**:
- [ ] Create Message model (id, conversation_id, sender, content, timestamp, channel, status)
- [ ] Create Conversation model (id, participants, channel, last_message, unread_count)
- [ ] Create MessageAttachment model
- [ ] CRUD endpoints for messages
- [ ] CRUD endpoints for conversations
- [ ] Database migrations

**Dependencies**: None

**File**: `backend/services/messaging-service/src/`

---

### T4-017: Implement WhatsApp Business API Integration
**Priority**: P0 | **Complexity**: XL
**Description**: Integrate with WhatsApp Business API for receiving and sending messages.

**Acceptance Criteria**:
- [ ] WhatsApp Business API client setup
- [ ] Webhook endpoint for incoming messages
- [ ] Send message function
- [ ] Send template message function
- [ ] Media message handling (images, documents)
- [ ] Message status callbacks (sent, delivered, read)
- [ ] Phone number verification flow
- [ ] Error handling and retry logic

**Dependencies**: T4-016

**File**: `backend/services/messaging-service/src/integrations/whatsapp.ts`

---

### T4-018: Implement Email Channel Integration
**Priority**: P0 | **Complexity**: L
**Description**: Integrate with email for two-way communication (beyond notifications).

**Acceptance Criteria**:
- [ ] IMAP/POP3 inbox polling for incoming emails
- [ ] Email parsing to extract conversation context
- [ ] Reply detection and threading
- [ ] Attachment handling
- [ ] Send email replies
- [ ] Email-to-conversation mapping

**Dependencies**: T4-016

**File**: `backend/services/messaging-service/src/integrations/email-channel.ts`

---

### T4-019: Implement Fax-to-Digital Integration
**Priority**: P0 | **Complexity**: L
**Description**: Integrate with a fax service (e.g., Twilio Fax, eFax) for receiving faxes.

**Acceptance Criteria**:
- [ ] Fax service webhook for incoming faxes
- [ ] PDF conversion of fax images
- [ ] OCR processing for text extraction
- [ ] Fax-to-conversation mapping
- [ ] Send fax capability (PDF to fax)
- [ ] Fax status tracking

**Dependencies**: T4-016

**File**: `backend/services/messaging-service/src/integrations/fax.ts`

---

### T4-020: Implement Unified Message Router
**Priority**: P0 | **Complexity**: L
**Description**: Create a router that normalizes messages from all channels into a unified format.

**Acceptance Criteria**:
- [ ] Message normalization from WhatsApp format
- [ ] Message normalization from email format
- [ ] Message normalization from fax format
- [ ] Message normalization from in-app format
- [ ] Unified message event emission
- [ ] Channel-agnostic storage

**Dependencies**: T4-017, T4-018, T4-019

**File**: `backend/services/messaging-service/src/services/messageRouter.ts`

---

### T4-021: Implement Conversation Threading
**Priority**: P0 | **Complexity**: M
**Description**: Implement conversation threading and participant management.

**Acceptance Criteria**:
- [ ] Create conversation from first message
- [ ] Add participants to conversations
- [ ] Thread messages by conversation
- [ ] Cross-channel conversation (patient WhatsApp + in-app)
- [ ] Conversation history retrieval
- [ ] Unread message counting

**Dependencies**: T4-020

**File**: `backend/services/messaging-service/src/services/conversationService.ts`

---

## Group: MESSAGING-FRONTEND (Unified Inbox UI)

### T4-022: Implement Unified Inbox Page
**Priority**: P0 | **Complexity**: XL
**Description**: Create WhatsApp-style unified inbox showing all conversations across channels.

**Acceptance Criteria**:
- [ ] Conversation list with last message preview
- [ ] Channel indicator icon (WhatsApp, email, fax, in-app)
- [ ] Unread message badge
- [ ] Search conversations
- [ ] Filter by channel
- [ ] Sort by date, unread
- [ ] Real-time updates

**Dependencies**: T4-021

**File**: `web/src/apps/pharmacist/pages/UnifiedInbox.tsx`

---

### T4-023: Implement Conversation View Component
**Priority**: P0 | **Complexity**: L
**Description**: Chat interface for viewing and sending messages in a conversation.

**Acceptance Criteria**:
- [ ] Message bubbles (sent/received styling)
- [ ] Timestamp display
- [ ] Read receipts (when available)
- [ ] Channel indicator per message
- [ ] Message status (sending, sent, delivered, read, failed)
- [ ] Scroll to bottom on new messages
- [ ] Load older messages on scroll up

**Dependencies**: T4-022

**File**: `web/src/apps/pharmacist/components/messaging/ConversationView.tsx`

---

### T4-024: Implement Message Composer
**Priority**: P0 | **Complexity**: M
**Description**: Message input component with attachment support and channel selection.

**Acceptance Criteria**:
- [ ] Text input with send button
- [ ] Attachment upload (images, documents)
- [ ] Channel selector (reply via WhatsApp, email, etc.)
- [ ] Template message selector (for WhatsApp)
- [ ] Emoji picker
- [ ] Enter to send / Shift+Enter for newline
- [ ] Character count for SMS/WhatsApp limits

**Dependencies**: T4-023

**File**: `web/src/apps/pharmacist/components/messaging/MessageComposer.tsx`

---

### T4-025: Implement Contact Info Panel
**Priority**: P0 | **Complexity**: M
**Description**: Side panel showing contact/patient information for the conversation.

**Acceptance Criteria**:
- [ ] Display contact name and photo
- [ ] Show all contact channels (phone, email, WhatsApp)
- [ ] Link to patient record (if patient)
- [ ] Show conversation history summary
- [ ] Display labels/tags
- [ ] Quick actions (call, email, view orders)

**Dependencies**: T4-023

**File**: `web/src/apps/pharmacist/components/messaging/ContactInfoPanel.tsx`

---

### T4-026: Implement Fax Viewer Component
**Priority**: P0 | **Complexity**: M
**Description**: Component to view received faxes with PDF rendering.

**Acceptance Criteria**:
- [ ] PDF viewer for fax documents
- [ ] Zoom in/out controls
- [ ] Page navigation
- [ ] Download original PDF
- [ ] OCR text overlay (if available)
- [ ] Mark as processed action

**Dependencies**: T4-022

**File**: `web/src/apps/pharmacist/components/messaging/FaxViewer.tsx`

---

### T4-027: Implement Messaging WebSocket Integration
**Priority**: P0 | **Complexity**: M
**Description**: Real-time message updates via WebSocket.

**Acceptance Criteria**:
- [ ] Connect to messaging WebSocket on page load
- [ ] Handle new message events
- [ ] Handle message status updates
- [ ] Handle typing indicators
- [ ] Reconnection logic
- [ ] Optimistic UI updates

**Dependencies**: T4-022

**File**: `web/src/apps/pharmacist/hooks/useMessagingSocket.ts`

---

### T4-028: Messaging Integration Tests
**Priority**: P0 | **Complexity**: L
**Description**: End-to-end tests for messaging functionality.

**Acceptance Criteria**:
- [ ] Test WhatsApp message flow
- [ ] Test email message flow
- [ ] Test fax reception
- [ ] Test conversation threading
- [ ] Test real-time updates
- [ ] Test attachment handling

**Dependencies**: T4-016 through T4-027

**File**: `backend/tests/e2e/messaging-integration.test.ts`

---

---

# P1 - HIGH: Complete Doctor Experience

## Group: DOCTOR-FRONTEND (Doctor Web Application Enhancement)

### T4-029: Implement Doctor Dashboard
**Priority**: P1 | **Complexity**: L
**Description**: Main dashboard for doctors showing key metrics and quick actions.

**Acceptance Criteria**:
- [ ] Pending prescription requests count
- [ ] Recent prescriptions list
- [ ] Patient consultation schedule
- [ ] Messages from pharmacists count
- [ ] Quick action: New prescription
- [ ] Quick action: View messages
- [ ] Recent activity feed

**Dependencies**: None

**File**: `web/src/apps/doctor/pages/Dashboard.tsx`

---

### T4-030: Implement Patient List for Doctors
**Priority**: P1 | **Complexity**: M
**Description**: Searchable list of patients the doctor has prescribed for.

**Acceptance Criteria**:
- [ ] Display patient list with basic info
- [ ] Search by name or patient ID
- [ ] Filter by active treatment, recent visit
- [ ] Sort options
- [ ] Click to view patient detail
- [ ] Pagination

**Dependencies**: T4-029

**File**: `web/src/apps/doctor/pages/PatientList.tsx`

---

### T4-031: Implement Patient Treatment View for Doctors
**Priority**: P1 | **Complexity**: L
**Description**: Detailed view of a patient's treatment history and current medications.

**Acceptance Criteria**:
- [ ] Display current active prescriptions
- [ ] Show medication adherence/observance stats
- [ ] Display prescription history timeline
- [ ] Show pharmacy-provided notes
- [ ] Button to renew prescription
- [ ] Button to create new prescription
- [ ] View drug interactions

**Dependencies**: T4-030

**File**: `web/src/apps/doctor/pages/PatientTreatment.tsx`

---

### T4-032: Implement Doctor-Pharmacist Messaging
**Priority**: P1 | **Complexity**: L
**Description**: Secure messaging interface for doctor-pharmacist communication.

**Acceptance Criteria**:
- [ ] Conversation list with pharmacists
- [ ] Send/receive messages
- [ ] Attach prescription references
- [ ] Real-time updates
- [ ] Message status indicators
- [ ] Unread message count

**Dependencies**: T4-029

**File**: `web/src/apps/doctor/pages/Messages.tsx`

---

### T4-033: Implement Observance Statistics Component
**Priority**: P1 | **Complexity**: M
**Description**: Visual component showing patient medication adherence statistics.

**Acceptance Criteria**:
- [ ] Adherence percentage chart
- [ ] Refill timeline visualization
- [ ] Missed dose indicators
- [ ] Trend over time graph
- [ ] Comparison to expected schedule
- [ ] Export data option

**Dependencies**: T4-031

**File**: `web/src/apps/doctor/components/ObservanceStats.tsx`

---

### T4-034: Implement Doctor Navigation & Layout
**Priority**: P1 | **Complexity**: M
**Description**: Navigation structure and layout for the doctor app.

**Acceptance Criteria**:
- [ ] Sidebar navigation
- [ ] Top bar with notifications
- [ ] Profile dropdown
- [ ] Breadcrumbs
- [ ] Mobile responsive
- [ ] HIN e-ID status indicator

**Dependencies**: T4-029

**File**: `web/src/apps/doctor/components/DoctorLayout.tsx`

---

### T4-035: Doctor App Unit Tests
**Priority**: P1 | **Complexity**: M
**Description**: Unit tests for doctor frontend components.

**Acceptance Criteria**:
- [ ] Test coverage > 80%
- [ ] Test dashboard rendering
- [ ] Test patient list operations
- [ ] Test messaging flow
- [ ] Test prescription creation

**Dependencies**: T4-029 through T4-034

**File**: `web/src/apps/doctor/**/__tests__/`

---

---

# P1 - HIGH: Physical Appointment Booking

## Group: APPOINTMENTS (Physical RDV System)

### T4-036: Create Appointment Model and Service
**Priority**: P1 | **Complexity**: L
**Description**: Backend model and service for physical appointments.

**Acceptance Criteria**:
- [ ] Appointment model (id, patient_id, pharmacy_id, type, datetime, duration, status, notes)
- [ ] AppointmentType enum (vaccination, consultation, medication_review, other)
- [ ] AppointmentSlot model for availability
- [ ] CRUD operations
- [ ] Conflict detection

**Dependencies**: None

**File**: `backend/services/teleconsultation-service/src/models/appointment.model.ts`

---

### T4-037: Implement Pharmacy Availability Management
**Priority**: P1 | **Complexity**: M
**Description**: Allow pharmacies to manage their physical appointment slots.

**Acceptance Criteria**:
- [ ] Define weekly schedule template
- [ ] Set appointment duration per type
- [ ] Block specific dates/times
- [ ] Set maximum concurrent appointments
- [ ] Holiday handling
- [ ] Override default schedule

**Dependencies**: T4-036

**File**: `backend/services/teleconsultation-service/src/services/availability.service.ts`

---

### T4-038: Implement Appointment Booking API
**Priority**: P1 | **Complexity**: M
**Description**: API endpoints for booking physical appointments.

**Acceptance Criteria**:
- [ ] GET /appointments/availability - Get available slots
- [ ] POST /appointments - Book appointment
- [ ] PUT /appointments/:id - Reschedule
- [ ] DELETE /appointments/:id - Cancel
- [ ] GET /appointments - List user's appointments
- [ ] Send confirmation notifications

**Dependencies**: T4-037

**File**: `backend/services/teleconsultation-service/src/routes/appointments.ts`

---

### T4-039: Implement Patient Appointment Booking UI
**Priority**: P1 | **Complexity**: L
**Description**: Patient-facing UI for booking physical appointments.

**Acceptance Criteria**:
- [ ] Select appointment type
- [ ] Select pharmacy location
- [ ] View available dates/times (calendar view)
- [ ] Select slot and confirm
- [ ] Add to calendar option (ICS file)
- [ ] View/manage existing appointments
- [ ] Cancellation with reason

**Dependencies**: T4-038

**File**: `web/src/apps/patient/pages/BookAppointment.tsx`

---

### T4-040: Implement Pharmacist Appointment Calendar
**Priority**: P1 | **Complexity**: L
**Description**: Pharmacist view of scheduled appointments.

**Acceptance Criteria**:
- [ ] Calendar view (day, week, month)
- [ ] Show all booked appointments
- [ ] Color coding by type
- [ ] Click to view appointment details
- [ ] Patient info display
- [ ] Mark as completed/no-show
- [ ] Add walk-in appointment

**Dependencies**: T4-038

**File**: `web/src/apps/pharmacist/pages/AppointmentCalendar.tsx`

---

### T4-041: Implement Appointment Reminders
**Priority**: P1 | **Complexity**: M
**Description**: Automated reminder system for upcoming appointments.

**Acceptance Criteria**:
- [ ] Send reminder 24 hours before
- [ ] Send reminder 1 hour before
- [ ] Multiple channels (SMS, email, push)
- [ ] Include appointment details
- [ ] Include cancellation link
- [ ] Respect notification preferences

**Dependencies**: T4-038

**File**: `backend/services/teleconsultation-service/src/workers/appointmentReminder.ts`

---

### T4-042: Appointment System Tests
**Priority**: P1 | **Complexity**: M
**Description**: Tests for the appointment booking system.

**Acceptance Criteria**:
- [ ] Test slot availability calculation
- [ ] Test booking flow
- [ ] Test conflict detection
- [ ] Test reminder scheduling
- [ ] Test cancellation

**Dependencies**: T4-036 through T4-041

**File**: `backend/services/teleconsultation-service/src/__tests__/appointments/`

---

---

# P1 - HIGH: Automatic Refill/Renewal System

## Group: REFILL (Automated Renewal System)

### T4-043: Implement Treatment Pattern Detection
**Priority**: P1 | **Complexity**: L
**Description**: AI service to detect regular treatment patterns for patients.

**Acceptance Criteria**:
- [ ] Analyze prescription history
- [ ] Detect recurring medications
- [ ] Calculate average refill interval
- [ ] Identify chronic treatment patterns
- [ ] Score pattern confidence
- [ ] Store detected patterns

**Dependencies**: None

**File**: `backend/services/prescription-service/src/services/patternDetection.ts`

---

### T4-044: Implement Refill Prediction Service
**Priority**: P1 | **Complexity**: M
**Description**: Predict when a patient will need medication refills.

**Acceptance Criteria**:
- [ ] Calculate days until refill needed
- [ ] Factor in prescription validity
- [ ] Consider remaining quantity
- [ ] Adjust for adherence patterns
- [ ] Generate refill alerts
- [ ] Prioritize by urgency

**Dependencies**: T4-043

**File**: `backend/services/prescription-service/src/services/refillPrediction.ts`

---

### T4-045: Implement One-Click Renewal Request
**Priority**: P1 | **Complexity**: M
**Description**: Allow patients to request prescription renewals with one click.

**Acceptance Criteria**:
- [ ] POST /prescriptions/:id/request-renewal
- [ ] Pre-fill renewal request from existing prescription
- [ ] Send request to prescribing doctor
- [ ] Send copy to preferred pharmacy
- [ ] Track request status
- [ ] Notify patient of approval/rejection

**Dependencies**: T4-044

**File**: `backend/services/prescription-service/src/routes/renewal.ts`

---

### T4-046: Implement Refill Alerts UI (Patient)
**Priority**: P1 | **Complexity**: M
**Description**: Patient dashboard component showing upcoming refills needed.

**Acceptance Criteria**:
- [ ] Display medications needing refill soon
- [ ] Show days until refill needed
- [ ] One-click renewal button
- [ ] One-click reorder button
- [ ] Prescription validity warning
- [ ] Auto-renewal toggle option

**Dependencies**: T4-044

**File**: `web/src/apps/patient/components/RefillAlerts.tsx`

---

### T4-047: Implement Auto-Renewal Configuration
**Priority**: P1 | **Complexity**: M
**Description**: Allow patients to set up automatic renewal requests.

**Acceptance Criteria**:
- [ ] Enable/disable per medication
- [ ] Set reminder days before running out
- [ ] Auto-request renewal threshold
- [ ] Auto-order from pharmacy option
- [ ] Notification preferences
- [ ] Management UI

**Dependencies**: T4-045

**File**: `web/src/apps/patient/pages/AutoRenewalSettings.tsx`

---

### T4-048: Implement Renewal Request UI (Doctor)
**Priority**: P1 | **Complexity**: M
**Description**: Doctor interface to review and process renewal requests.

**Acceptance Criteria**:
- [ ] List pending renewal requests
- [ ] Show original prescription details
- [ ] Patient history context
- [ ] One-click approve (same prescription)
- [ ] Modify and approve option
- [ ] Reject with reason
- [ ] Bulk approval option

**Dependencies**: T4-045

**File**: `web/src/apps/doctor/pages/RenewalRequests.tsx`

---

### T4-049: Refill System Tests
**Priority**: P1 | **Complexity**: M
**Description**: Tests for the automatic refill system.

**Acceptance Criteria**:
- [ ] Test pattern detection algorithm
- [ ] Test refill prediction accuracy
- [ ] Test renewal request flow
- [ ] Test auto-renewal
- [ ] Test notifications

**Dependencies**: T4-043 through T4-048

**File**: `backend/services/prescription-service/src/__tests__/refill/`

---

---

# P2 - MEDIUM: Marketing & Announcements System

## Group: MARKETING (Pharmacy Marketing Tools)

### T4-050: Create Announcement Model and Service
**Priority**: P2 | **Complexity**: M
**Description**: Backend for pharmacy announcements and promotions.

**Acceptance Criteria**:
- [ ] Announcement model (id, pharmacy_id, title, content, type, start_date, end_date, target_audience)
- [ ] AnnouncementType enum (promotion, news, health_tip, service_update)
- [ ] CRUD operations
- [ ] Scheduling support
- [ ] Target audience rules

**Dependencies**: None

**File**: `backend/services/pharmacy-service/src/models/Announcement.ts`

---

### T4-051: Implement Campaign Management Service
**Priority**: P2 | **Complexity**: L
**Description**: Service for managing marketing campaigns.

**Acceptance Criteria**:
- [ ] Create campaign with multiple announcements
- [ ] Define target audience (all, VIP, chronic patients, etc.)
- [ ] Schedule campaign start/end
- [ ] Track campaign performance
- [ ] A/B testing support

**Dependencies**: T4-050

**File**: `backend/services/pharmacy-service/src/services/campaignService.ts`

---

### T4-052: Implement Push Campaign Integration
**Priority**: P2 | **Complexity**: M
**Description**: Send campaign announcements as push notifications.

**Acceptance Criteria**:
- [ ] Integrate with notification service
- [ ] Batch send to target audience
- [ ] Respect notification preferences
- [ ] Track delivery and open rates
- [ ] Schedule sends

**Dependencies**: T4-051

**File**: `backend/services/pharmacy-service/src/services/pushCampaign.ts`

---

### T4-053: Implement Announcement Creation UI
**Priority**: P2 | **Complexity**: M
**Description**: Pharmacist UI for creating and managing announcements.

**Acceptance Criteria**:
- [ ] Rich text editor for content
- [ ] Image upload for promotions
- [ ] Schedule start/end dates
- [ ] Target audience selector
- [ ] Preview before publish
- [ ] Draft save functionality

**Dependencies**: T4-050

**File**: `web/src/apps/pharmacist/pages/AnnouncementEditor.tsx`

---

### T4-054: Implement Campaign Dashboard
**Priority**: P2 | **Complexity**: M
**Description**: Dashboard showing campaign performance metrics.

**Acceptance Criteria**:
- [ ] List all campaigns with status
- [ ] Show reach and engagement metrics
- [ ] View individual campaign details
- [ ] Compare campaign performance
- [ ] Export reports

**Dependencies**: T4-051

**File**: `web/src/apps/pharmacist/pages/CampaignDashboard.tsx`

---

### T4-055: Implement Patient Announcement Display
**Priority**: P2 | **Complexity**: S
**Description**: Display relevant announcements to patients.

**Acceptance Criteria**:
- [ ] Show announcements on patient dashboard
- [ ] Filter by relevance to patient
- [ ] Dismissible announcements
- [ ] Track views
- [ ] Link to related products/services

**Dependencies**: T4-050

**File**: `web/src/apps/patient/components/AnnouncementBanner.tsx`

---

---

# P2 - MEDIUM: Swiss Insurance Integration

## Group: INSURANCE (Tiers-Payant System)

### T4-056: Research Swiss Insurance APIs
**Priority**: P2 | **Complexity**: M
**Description**: Document available Swiss health insurance APIs and integration requirements.

**Acceptance Criteria**:
- [ ] List major Swiss insurers and their APIs
- [ ] Document authentication requirements
- [ ] Document coverage verification endpoints
- [ ] Document claim submission process
- [ ] Identify test/sandbox environments
- [ ] Create integration architecture document

**Dependencies**: None

**File**: `docs/integrations/SWISS_INSURANCE_INTEGRATION.md`

---

### T4-057: Implement Insurance Verification Service
**Priority**: P2 | **Complexity**: L
**Description**: Service to verify patient insurance coverage.

**Acceptance Criteria**:
- [ ] Patient insurance info model
- [ ] Coverage verification API call
- [ ] Cache verification results
- [ ] Handle multiple insurers
- [ ] Return coverage details

**Dependencies**: T4-056

**File**: `backend/services/payment-service/src/services/insuranceVerification.ts`

---

### T4-058: Implement Tiers-Payant Flow
**Priority**: P2 | **Complexity**: XL
**Description**: Implement third-party payer flow for covered medications.

**Acceptance Criteria**:
- [ ] Detect covered vs. non-covered items
- [ ] Calculate patient co-pay
- [ ] Generate insurance claim
- [ ] Submit claim to insurer
- [ ] Track claim status
- [ ] Handle rejections/resubmissions

**Dependencies**: T4-057

**File**: `backend/services/payment-service/src/services/tiersPayant.ts`

---

### T4-059: Implement Insurance Info Collection UI
**Priority**: P2 | **Complexity**: M
**Description**: Patient UI for entering and managing insurance information.

**Acceptance Criteria**:
- [ ] Insurance card scanner (OCR)
- [ ] Manual entry form
- [ ] Validate insurance number format
- [ ] Verify coverage on save
- [ ] Show coverage summary
- [ ] Support multiple insurance plans

**Dependencies**: T4-057

**File**: `web/src/apps/patient/pages/InsuranceInfo.tsx`

---

### T4-060: Implement Coverage Display in Checkout
**Priority**: P2 | **Complexity**: M
**Description**: Show insurance coverage during checkout.

**Acceptance Criteria**:
- [ ] Display covered vs. non-covered items
- [ ] Show insurance contribution
- [ ] Show patient co-pay
- [ ] Warning for non-covered items
- [ ] Option to proceed without insurance

**Dependencies**: T4-058

**File**: `web/src/apps/patient/components/checkout/InsuranceCoverage.tsx`

---

---

# P2 - MEDIUM: Controlled Substance Protocol

## Group: CONTROLLED (Narcotics & Cold Chain)

### T4-061: Implement Controlled Substance Classification
**Priority**: P2 | **Complexity**: M
**Description**: Classify medications by controlled substance schedule.

**Acceptance Criteria**:
- [ ] Add schedule field to medication model
- [ ] Swiss narcotic schedules (A, B, C, D)
- [ ] Flag medications requiring special handling
- [ ] Cold chain requirement flag
- [ ] Signature required flag
- [ ] ID verification required flag

**Dependencies**: None

**File**: `backend/shared/models/MedicationClassification.ts`

---

### T4-062: Implement ID Verification for Delivery
**Priority**: P2 | **Complexity**: L
**Description**: ID verification flow for controlled substance delivery.

**Acceptance Criteria**:
- [ ] ID photo capture on delivery
- [ ] ID type selection (passport, ID card, driver's license)
- [ ] ID number recording
- [ ] Match with patient record
- [ ] Audit log entry
- [ ] Rejection flow if mismatch

**Dependencies**: T4-061

**File**: `web/src/apps/driver/components/delivery/IDVerification.tsx`

---

### T4-063: Implement Cold Chain Protocol
**Priority**: P2 | **Complexity**: M
**Description**: Enforce cold chain requirements for temperature-sensitive medications.

**Acceptance Criteria**:
- [ ] Flag cold chain items in order
- [ ] Special packaging requirements display
- [ ] Temperature logging (manual entry)
- [ ] Time-sensitive delivery alerts
- [ ] Delivery window restrictions
- [ ] Cold chain breach reporting

**Dependencies**: T4-061

**File**: `backend/services/delivery-service/src/services/coldChainProtocol.ts`

---

### T4-064: Implement Chain of Custody Logging
**Priority**: P2 | **Complexity**: M
**Description**: Complete chain of custody audit trail for controlled substances.

**Acceptance Criteria**:
- [ ] Log every handoff (pharmacy → driver → patient)
- [ ] Timestamp and location for each event
- [ ] Personnel identification at each step
- [ ] Photo/signature evidence attachment
- [ ] Tamper-evident seal verification
- [ ] Report generation for authorities

**Dependencies**: T4-062

**File**: `backend/services/delivery-service/src/services/chainOfCustody.ts`

---

### T4-065: Implement Controlled Substance Delivery UI
**Priority**: P2 | **Complexity**: M
**Description**: Special delivery flow UI for controlled substances.

**Acceptance Criteria**:
- [ ] Clear indication of controlled substance
- [ ] Required steps checklist
- [ ] ID verification step
- [ ] Signature step
- [ ] Photo proof step
- [ ] Cannot skip required steps

**Dependencies**: T4-062, T4-064

**File**: `web/src/apps/driver/pages/ControlledDelivery.tsx`

---

---

# P3 - LOWER: e-santé API Full Integration

## Group: ESANTE (Swiss Health Records)

### T4-066: Research e-santé API Requirements
**Priority**: P3 | **Complexity**: M
**Description**: Document full e-santé integration requirements.

**Acceptance Criteria**:
- [ ] Document e-santé API endpoints
- [ ] Authentication requirements (certificates)
- [ ] Data format specifications (FHIR)
- [ ] Consent management requirements
- [ ] Test environment access
- [ ] Compliance requirements

**Dependencies**: None

**File**: `docs/integrations/ESANTE_INTEGRATION.md`

---

### T4-067: Implement e-santé Authentication
**Priority**: P3 | **Complexity**: L
**Description**: Implement certificate-based authentication with e-santé.

**Acceptance Criteria**:
- [ ] Certificate management
- [ ] Token acquisition
- [ ] Token refresh
- [ ] Error handling
- [ ] Secure credential storage

**Dependencies**: T4-066

**File**: `backend/services/medical-records-service/src/integrations/ESanteAuth.ts`

---

### T4-068: Implement FHIR Resource Mapping
**Priority**: P3 | **Complexity**: L
**Description**: Map e-santé FHIR resources to internal models.

**Acceptance Criteria**:
- [ ] Map Patient resource
- [ ] Map Medication resource
- [ ] Map AllergyIntolerance resource
- [ ] Map Condition resource
- [ ] Map MedicationRequest resource
- [ ] Bidirectional mapping

**Dependencies**: T4-066

**File**: `backend/services/medical-records-service/src/integrations/FhirMapper.ts`

---

### T4-069: Implement Full e-santé Record Fetch
**Priority**: P3 | **Complexity**: M
**Description**: Replace stub with actual e-santé API calls.

**Acceptance Criteria**:
- [ ] Fetch patient records with consent
- [ ] Fetch medication history
- [ ] Fetch allergies
- [ ] Fetch conditions
- [ ] Handle pagination
- [ ] Cache responses appropriately

**Dependencies**: T4-067, T4-068

**File**: `backend/services/medical-records-service/src/integrations/ESanteApiClient.ts`

---

### T4-070: Implement e-santé Record Sync
**Priority**: P3 | **Complexity**: M
**Description**: Sync local records back to e-santé.

**Acceptance Criteria**:
- [ ] Push new prescriptions to e-santé
- [ ] Update patient allergies
- [ ] Sync medication dispensing records
- [ ] Conflict resolution
- [ ] Audit trail

**Dependencies**: T4-069

**File**: `backend/services/medical-records-service/src/services/esanteSync.ts`

---

---

# P3 - LOWER: Voice Message Feature

## Group: VOICE (Voice Messaging)

### T4-071: Implement Voice Message Recording (Frontend)
**Priority**: P3 | **Complexity**: M
**Description**: Allow users to record voice messages.

**Acceptance Criteria**:
- [ ] Record button in message composer
- [ ] Audio visualization while recording
- [ ] Recording duration limit (2 minutes)
- [ ] Playback before sending
- [ ] Cancel/retry recording
- [ ] Compress audio for upload

**Dependencies**: T4-024

**File**: `web/src/shared/components/messaging/VoiceRecorder.tsx`

---

### T4-072: Implement Voice Message Storage
**Priority**: P3 | **Complexity**: M
**Description**: Backend storage and streaming for voice messages.

**Acceptance Criteria**:
- [ ] Audio file upload endpoint
- [ ] Secure storage (S3 or similar)
- [ ] Streaming playback endpoint
- [ ] Audio format conversion
- [ ] Retention policy

**Dependencies**: T4-071

**File**: `backend/services/messaging-service/src/services/voiceStorage.ts`

---

### T4-073: Implement Voice Message Transcription
**Priority**: P3 | **Complexity**: M
**Description**: Automatically transcribe voice messages.

**Acceptance Criteria**:
- [ ] Integrate with transcription service (AWS/Google)
- [ ] Async transcription processing
- [ ] Store transcription with message
- [ ] Support French language
- [ ] Confidence scoring

**Dependencies**: T4-072

**File**: `backend/services/messaging-service/src/services/voiceTranscription.ts`

---

### T4-074: Implement Voice Message Playback UI
**Priority**: P3 | **Complexity**: S
**Description**: UI component for playing voice messages.

**Acceptance Criteria**:
- [ ] Play/pause controls
- [ ] Progress bar
- [ ] Duration display
- [ ] Playback speed control
- [ ] Show transcription toggle
- [ ] Download option

**Dependencies**: T4-072

**File**: `web/src/shared/components/messaging/VoicePlayer.tsx`

---

---

# Additional Tasks: Testing & Documentation

## Group: TESTING (Comprehensive Test Coverage)

### T4-075: E2E Tests for Nurse Workflow
**Priority**: P1 | **Complexity**: L
**Description**: End-to-end tests for complete nurse workflow.

**Acceptance Criteria**:
- [ ] Test login and dashboard load
- [ ] Test patient list and search
- [ ] Test order creation flow
- [ ] Test order tracking
- [ ] Test notifications

**Dependencies**: T4-001 through T4-015

**File**: `backend/tests/e2e/nurse-workflow.test.ts`

---

### T4-076: E2E Tests for Messaging System
**Priority**: P1 | **Complexity**: L
**Description**: End-to-end tests for messaging functionality.

**Acceptance Criteria**:
- [ ] Test conversation creation
- [ ] Test message sending/receiving
- [ ] Test WhatsApp integration (mock)
- [ ] Test email integration (mock)
- [ ] Test real-time updates

**Dependencies**: T4-016 through T4-028

**File**: `backend/tests/e2e/messaging-workflow.test.ts`

---

### T4-077: E2E Tests for Appointment Booking
**Priority**: P1 | **Complexity**: M
**Description**: End-to-end tests for appointment system.

**Acceptance Criteria**:
- [ ] Test availability retrieval
- [ ] Test booking flow
- [ ] Test cancellation
- [ ] Test reminder sending
- [ ] Test calendar integration

**Dependencies**: T4-036 through T4-042

**File**: `backend/tests/e2e/appointment-booking.test.ts`

---

### T4-078: Performance Tests for Messaging
**Priority**: P2 | **Complexity**: M
**Description**: Load tests for messaging system.

**Acceptance Criteria**:
- [ ] Test concurrent message sending
- [ ] Test WebSocket connection scaling
- [ ] Test message retrieval under load
- [ ] Identify bottlenecks
- [ ] Document performance benchmarks

**Dependencies**: T4-016 through T4-028

**File**: `backend/tests/performance/messaging-load.test.ts`

---

## Group: DOCUMENTATION (API & User Docs)

### T4-079: Document Nurse API Endpoints
**Priority**: P1 | **Complexity**: S
**Description**: Add nurse API documentation.

**Acceptance Criteria**:
- [ ] Document all nurse endpoints
- [ ] Request/response examples
- [ ] Error codes
- [ ] Authentication requirements

**Dependencies**: T4-011 through T4-013

**File**: `docs/api/NURSE_API.md`

---

### T4-080: Document Messaging API
**Priority**: P1 | **Complexity**: M
**Description**: Document messaging service API.

**Acceptance Criteria**:
- [ ] Document all messaging endpoints
- [ ] WebSocket event documentation
- [ ] Channel integration guides
- [ ] Webhook documentation

**Dependencies**: T4-016 through T4-021

**File**: `docs/api/MESSAGING_API.md`

---

### T4-081: Document Appointment API
**Priority**: P1 | **Complexity**: S
**Description**: Document appointment booking API.

**Acceptance Criteria**:
- [ ] Document all appointment endpoints
- [ ] Availability query examples
- [ ] Booking flow documentation

**Dependencies**: T4-036 through T4-038

**File**: `docs/api/APPOINTMENTS_API.md`

---

### T4-082: Update OpenAPI Specification
**Priority**: P2 | **Complexity**: M
**Description**: Update OpenAPI spec with all new endpoints.

**Acceptance Criteria**:
- [ ] Add nurse service endpoints
- [ ] Add messaging endpoints
- [ ] Add appointment endpoints
- [ ] Add refill endpoints
- [ ] Add marketing endpoints
- [ ] Validate spec

**Dependencies**: All API tasks

**File**: `docs/api/openapi.yaml`

---

### T4-083: Create User Guide for Nurses
**Priority**: P2 | **Complexity**: M
**Description**: User documentation for nurse app.

**Acceptance Criteria**:
- [ ] Getting started guide
- [ ] Order creation walkthrough
- [ ] Order tracking guide
- [ ] Notification settings
- [ ] FAQ section

**Dependencies**: T4-001 through T4-015

**File**: `docs/user-guides/NURSE_USER_GUIDE.md`

---

## Group: MOBILE (Mobile Optimization)

### T4-084: Nurse App Mobile Optimization
**Priority**: P2 | **Complexity**: M
**Description**: Ensure nurse app works well on tablets/mobile.

**Acceptance Criteria**:
- [ ] Responsive layouts for all pages
- [ ] Touch-friendly interactions
- [ ] Offline order drafts
- [ ] Push notification handling
- [ ] Test on iOS/Android browsers

**Dependencies**: T4-001 through T4-010

**File**: `web/src/apps/nurse/**/*.tsx`

---

### T4-085: Doctor App Mobile Optimization
**Priority**: P2 | **Complexity**: M
**Description**: Optimize doctor app for mobile devices.

**Acceptance Criteria**:
- [ ] Responsive layouts
- [ ] Quick prescription creation on mobile
- [ ] Touch-friendly message composer
- [ ] Mobile notification handling

**Dependencies**: T4-029 through T4-034

**File**: `web/src/apps/doctor/**/*.tsx`

---

## Group: ACCESSIBILITY (A11y Compliance)

### T4-086: Nurse App Accessibility Audit
**Priority**: P2 | **Complexity**: M
**Description**: Ensure nurse app meets WCAG 2.1 AA.

**Acceptance Criteria**:
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast compliance
- [ ] Focus management
- [ ] ARIA labels

**Dependencies**: T4-001 through T4-010

---

### T4-087: Messaging UI Accessibility
**Priority**: P2 | **Complexity**: M
**Description**: Ensure messaging interface is accessible.

**Acceptance Criteria**:
- [ ] Screen reader announces new messages
- [ ] Keyboard shortcuts for compose/send
- [ ] Focus trap in modal dialogs
- [ ] Alt text for attachments

**Dependencies**: T4-022 through T4-026

---

## Group: LOCALIZATION (French Language)

### T4-088: Nurse App French Localization
**Priority**: P2 | **Complexity**: M
**Description**: French translation for nurse app.

**Acceptance Criteria**:
- [ ] All UI strings in French
- [ ] Date/time formatting (Swiss French)
- [ ] Number formatting
- [ ] Error messages in French

**Dependencies**: T4-001 through T4-010

---

### T4-089: Doctor App French Localization
**Priority**: P2 | **Complexity**: S
**Description**: French translation for doctor app additions.

**Acceptance Criteria**:
- [ ] Dashboard strings
- [ ] Messaging strings
- [ ] Treatment view strings

**Dependencies**: T4-029 through T4-034

---

---

# Summary

## Task Count by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 28 | Critical - Blocking launch |
| **P1** | 28 | High - Required for MVP |
| **P2** | 25 | Medium - Important for full experience |
| **P3** | 8 | Lower - Nice to have |
| **Total** | **89** | |

## Task Count by Group

| Group | Count |
|-------|-------|
| NURSE-FRONTEND | 10 |
| NURSE-BACKEND | 5 |
| MESSAGING-BACKEND | 6 |
| MESSAGING-FRONTEND | 7 |
| DOCTOR-FRONTEND | 7 |
| APPOINTMENTS | 7 |
| REFILL | 7 |
| MARKETING | 6 |
| INSURANCE | 5 |
| CONTROLLED | 5 |
| ESANTE | 5 |
| VOICE | 4 |
| TESTING | 4 |
| DOCUMENTATION | 5 |
| MOBILE | 2 |
| ACCESSIBILITY | 2 |
| LOCALIZATION | 2 |

## Recommended Execution Order

### Phase 4A: Critical Features (P0)
1. Nurse App Frontend (T4-001 to T4-010)
2. Nurse Backend Enhancements (T4-011 to T4-015)
3. Messaging Service Core (T4-016 to T4-021)
4. Messaging Frontend (T4-022 to T4-028)

### Phase 4B: High Priority (P1)
1. Doctor Experience (T4-029 to T4-035)
2. Physical Appointments (T4-036 to T4-042)
3. Automatic Refills (T4-043 to T4-049)

### Phase 4C: Medium Priority (P2)
1. Marketing System (T4-050 to T4-055)
2. Insurance Integration (T4-056 to T4-060)
3. Controlled Substances (T4-061 to T4-065)
4. Testing & Documentation (T4-075 to T4-089)

### Phase 4D: Lower Priority (P3)
1. Full e-santé Integration (T4-066 to T4-070)
2. Voice Messaging (T4-071 to T4-074)
