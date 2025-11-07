# Data Model: MetaPharm Connect Healthcare Platform

**Date**: 2025-11-07
**Purpose**: Define database schemas, relationships, RBAC, and state machines for MVP (P1-P3)
**Related Documents**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md)

**Database**: PostgreSQL 16 with Row-Level Security (RLS), Application-Level Encryption (AWS KMS)

---

## Table of Contents

1. [Core Entities](#core-entities)
2. [Entity Schemas](#entity-schemas)
3. [Relationships](#relationships)
4. [RBAC Permission Matrix](#rbac-permission-matrix)
5. [State Machines](#state-machines)
6. [Encryption Annotations](#encryption-annotations)
7. [Indexes](#indexes)

---

## Core Entities

### Foundational Entities (All Phases)

1. **User** - All platform users (5 roles: Pharmacist, Doctor, Nurse, Delivery, Patient)
2. **Pharmacy** - Pharmacy locations (multi-tenant root entity)
3. **AuditTrailEntry** - Immutable audit logs for compliance

### MVP Entities (P1-P3)

4. **Prescription** - Medication orders from patients/doctors (P1)
5. **PrescriptionItem** - Individual medications in a prescription (P1)
6. **TreatmentPlan** - Generated medication schedules (P1)
7. **Teleconsultation** - Video consultation appointments (P2)
8. **ConsultationNote** - AI + manual notes from teleconsultations (P2)
9. **InventoryItem** - Medication stock in pharmacies (P3)
10. **InventoryTransaction** - QR scan events (receive, dispense, transfer) (P3)
11. **InventoryAlert** - Low stock / expiration alerts (P3)

### Phase 2 Entities (P4-P6)

12. **DeliveryOrder** - Package delivery assignments (P4)
13. **DeliveryRoute** - Optimized routes for delivery personnel (P4)
14. **Product** - E-commerce catalog (prescription + OTC + parapharmacy) (P5)
15. **Order** - Patient e-commerce orders (P5)
16. **OrderItem** - Line items in orders (P5)
17. **Message** - Unified messaging across channels (P6)
18. **Conversation** - Message threads grouped by participants (P6)

### Phase 3 Entities (P7-P9)

19. **PatientMedicalRecord** - Comprehensive health profile (P7)
20. **ESanteSync** - Cantonal health record sync status (P7)
21. **AccessPermission** - Patient-granted data access to providers (P7)

### Phase 4 Entities (P10-P11)

22. **AnalyticsDashboard** - Pre-computed analytics snapshots (P10)
23. **VIPMembership** - Golden MetaPharm VIP enrollment (P11)

---

## Entity Schemas

### 1. User

**Purpose**: All platform users across 5 roles
**Tenant Scope**: Global (can belong to multiple pharmacies for pharmacy chains)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email VARCHAR(255) UNIQUE NOT NULL,  -- Plaintext for login lookup
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),  -- bcrypt hash (null if HIN e-ID only)
    hin_id VARCHAR(100) UNIQUE,  -- Swiss HIN e-ID (doctors, pharmacists)

    -- Role & Status
    role VARCHAR(50) NOT NULL CHECK (role IN ('pharmacist', 'doctor', 'nurse', 'delivery', 'patient')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

    -- Profile (encrypted)
    first_name_encrypted BYTEA NOT NULL,  -- AWS KMS encrypted
    last_name_encrypted BYTEA NOT NULL,
    phone_encrypted BYTEA,

    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),  -- TOTP secret for MFA

    -- Affiliations
    primary_pharmacy_id UUID REFERENCES pharmacies(id),  -- For pharmacists, delivery personnel

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_hin_id ON users(hin_id) WHERE hin_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_pharmacy ON users(primary_pharmacy_id) WHERE primary_pharmacy_id IS NOT NULL;
```

### 2. Pharmacy

**Purpose**: Pharmacy locations (multi-tenant root entity)
**Tenant Scope**: Root entity

```sql
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,  -- Swiss pharmacy license

    -- Location (encrypted for privacy)
    address_encrypted BYTEA NOT NULL,
    city VARCHAR(100) NOT NULL,  -- Plaintext for reporting
    canton VARCHAR(50) NOT NULL,  -- Swiss canton (VD, GE, ZH, etc.)
    postal_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),  -- For delivery routing
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),

    -- Operating Hours (JSON for flexibility)
    operating_hours JSONB,  -- {"monday": {"open": "08:00", "close": "18:00"}, ...}

    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pharmacies_canton ON pharmacies(canton);
CREATE INDEX idx_pharmacies_status ON pharmacies(subscription_status);
```

### 3. Prescription

**Purpose**: Medication orders from patients (upload) or doctors (direct send)
**Tenant Scope**: `pharmacy_id`

```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),  -- Multi-tenant isolation

    -- Parties
    patient_id UUID NOT NULL REFERENCES users(id),
    prescribing_doctor_id UUID REFERENCES users(id),  -- Null if uploaded by patient
    pharmacist_id UUID REFERENCES users(id),  -- Assigned for validation

    -- Source
    source VARCHAR(50) NOT NULL CHECK (source IN ('patient_upload', 'doctor_direct', 'teleconsultation')),
    image_url VARCHAR(500),  -- S3 URL if patient uploaded

    -- AI Transcription
    ai_transcription_data JSONB,  -- Raw OCR results from AWS Textract
    ai_confidence_score DECIMAL(5, 2),  -- Overall confidence 0-100

    -- Validation Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Awaiting pharmacist review
        'in_review',         -- Pharmacist reviewing
        'clarification_needed',  -- Waiting for doctor response
        'approved',          -- Validated and approved
        'rejected',          -- Rejected with reason
        'expired'            -- Prescription validity expired
    )),
    rejection_reason TEXT,  -- Mandatory if status = rejected

    -- Safety Checks
    drug_interactions JSONB,  -- Array of {drug1, drug2, severity, description}
    allergy_warnings JSONB,   -- Array of {allergen, reaction_type, severity}
    contraindications JSONB,  -- Array of {condition, reason}

    -- Validity
    prescribed_date DATE,
    expiry_date DATE,  -- Swiss prescriptions valid 3 months typically

    -- Treatment Plan
    treatment_plan_id UUID REFERENCES treatment_plans(id),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by_pharmacist_id UUID REFERENCES users(id)
);

-- Row-Level Security
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pharmacy_isolation_policy ON prescriptions
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);

CREATE INDEX idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_created ON prescriptions(created_at DESC);
```

### 4. PrescriptionItem

**Purpose**: Individual medications in a prescription
**Tenant Scope**: Inherited from `prescription`

```sql
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,

    -- Medication
    medication_name VARCHAR(255) NOT NULL,
    medication_rxnorm_code VARCHAR(50),  -- Normalized RxNorm code
    dosage VARCHAR(100) NOT NULL,  -- e.g., "500mg"
    frequency VARCHAR(100) NOT NULL,  -- e.g., "twice daily"
    duration VARCHAR(100),  -- e.g., "7 days"
    quantity INTEGER,  -- Total pills/units

    -- AI Transcription Confidence (per field)
    medication_confidence DECIMAL(5, 2),
    dosage_confidence DECIMAL(5, 2),
    frequency_confidence DECIMAL(5, 2),

    -- Pharmacist Corrections
    pharmacist_corrected BOOLEAN DEFAULT FALSE,
    original_ai_value JSONB,  -- Store original if corrected

    -- Inventory Link
    inventory_item_id UUID REFERENCES inventory_items(id),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_medication ON prescription_items(medication_rxnorm_code);
```

### 5. TreatmentPlan

**Purpose**: Generated medication schedule from approved prescription
**Tenant Scope**: Inherited from `prescription`

```sql
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    patient_id UUID NOT NULL REFERENCES users(id),

    -- Schedule (JSON for flexibility)
    medication_schedule JSONB NOT NULL,  -- [{medication, time, days, doses_taken: []}]

    -- Adherence Tracking
    start_date DATE NOT NULL,
    end_date DATE,
    total_doses INTEGER,
    doses_taken INTEGER DEFAULT 0,
    adherence_rate DECIMAL(5, 2),  -- Calculated: doses_taken / total_doses * 100

    -- Refill
    refill_due_date DATE,
    refill_reminder_sent BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_plans_refill_due ON treatment_plans(refill_due_date) WHERE status = 'active';
```

### 6. Teleconsultation

**Purpose**: Video consultation appointments between pharmacists and patients
**Tenant Scope**: `pharmacy_id`

```sql
CREATE TABLE teleconsultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),

    -- Participants
    patient_id UUID NOT NULL REFERENCES users(id),
    pharmacist_id UUID NOT NULL REFERENCES users(id),

    -- Scheduling
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 15,

    -- Session
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
    )),
    twilio_room_id VARCHAR(255),  -- Twilio Video Room SID
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    actual_duration_minutes INTEGER,

    -- Recording
    recording_consent BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(500),  -- S3 URL if recorded

    -- Outcome
    prescription_created BOOLEAN DEFAULT FALSE,
    prescription_id UUID REFERENCES prescriptions(id),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

ALTER TABLE teleconsultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY pharmacy_isolation_policy ON teleconsultations
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);

CREATE INDEX idx_teleconsultations_pharmacy ON teleconsultations(pharmacy_id);
CREATE INDEX idx_teleconsultations_patient ON teleconsultations(patient_id);
CREATE INDEX idx_teleconsultations_pharmacist ON teleconsultations(pharmacist_id);
CREATE INDEX idx_teleconsultations_scheduled ON teleconsultations(scheduled_at) WHERE status = 'scheduled';
```

### 7. ConsultationNote

**Purpose**: AI-transcribed + manual notes from teleconsultations
**Tenant Scope**: Inherited from `teleconsultation`

```sql
CREATE TABLE consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teleconsultation_id UUID NOT NULL REFERENCES teleconsultations(id) ON DELETE CASCADE,

    -- AI Transcript (encrypted)
    ai_transcript_encrypted BYTEA,  -- Full conversation transcript
    ai_summary TEXT,  -- AI-generated summary of key points
    ai_highlighted_terms JSONB,  -- Medical terms highlighted by AI

    -- Pharmacist Edits
    pharmacist_notes_encrypted BYTEA,  -- Manual notes added/edited by pharmacist
    edited BOOLEAN DEFAULT FALSE,
    edit_history JSONB,  -- [{timestamp, user_id, changes}] for audit

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultation_notes_teleconsultation ON consultation_notes(teleconsultation_id);
```

### 8. InventoryItem

**Purpose**: Medication stock in pharmacy
**Tenant Scope**: `pharmacy_id`

```sql
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),

    -- Medication
    medication_name VARCHAR(255) NOT NULL,
    medication_rxnorm_code VARCHAR(50),
    medication_gtin VARCHAR(50),  -- Global Trade Item Number (QR code)

    -- Stock
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,  -- "pills", "bottles", "boxes"
    reorder_threshold INTEGER,
    optimal_stock_level INTEGER,  -- AI-recommended based on demand

    -- Batch Info
    batch_number VARCHAR(100),
    expiry_date DATE,
    supplier_name VARCHAR(255),
    cost_per_unit DECIMAL(10, 2),

    -- Controlled Substance
    is_controlled BOOLEAN DEFAULT FALSE,
    substance_schedule VARCHAR(10),  -- I, II, III, IV, V (Swiss narcotics classification)

    -- Location
    storage_location VARCHAR(100),  -- Shelf/bin location
    requires_refrigeration BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_restocked_at TIMESTAMP
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY pharmacy_isolation_policy ON inventory_items
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);

CREATE INDEX idx_inventory_items_pharmacy ON inventory_items(pharmacy_id);
CREATE INDEX idx_inventory_items_medication ON inventory_items(medication_rxnorm_code);
CREATE INDEX idx_inventory_items_gtin ON inventory_items(medication_gtin);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(pharmacy_id, quantity) WHERE quantity <= reorder_threshold;
CREATE INDEX idx_inventory_items_expiring ON inventory_items(expiry_date) WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days';
```

### 9. InventoryTransaction

**Purpose**: QR scan events for traceability (receive, dispense, transfer)
**Tenant Scope**: `pharmacy_id`

```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),

    -- Transaction
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'receive',    -- Incoming from supplier
        'dispense',   -- Outgoing to patient (linked to prescription)
        'transfer',   -- Transfer to another pharmacy location
        'return',     -- Returned from patient
        'adjustment', -- Manual stock adjustment
        'expired'     -- Expired medication disposal
    )),
    quantity_change INTEGER NOT NULL,  -- Positive for receive, negative for dispense
    quantity_after INTEGER NOT NULL,

    -- Links
    prescription_id UUID REFERENCES prescriptions(id),  -- If dispensing for prescription
    user_id UUID NOT NULL REFERENCES users(id),  -- Pharmacist performing action

    -- QR Code
    qr_code_scanned VARCHAR(255),  -- GTIN or internal QR

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pharmacy_isolation_policy ON inventory_transactions
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);

CREATE INDEX idx_inventory_transactions_pharmacy ON inventory_transactions(pharmacy_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_prescription ON inventory_transactions(prescription_id) WHERE prescription_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
```

### 10. InventoryAlert

**Purpose**: Low stock and expiration alerts
**Tenant Scope**: `pharmacy_id`

```sql
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),

    -- Alert
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'expired', 'reorder_suggested')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,

    -- AI Recommendation
    ai_suggested_action TEXT,  -- "Reorder 500 units based on 30-day demand forecast"
    ai_suggested_quantity INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by_user_id UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY pharmacy_isolation_policy ON inventory_alerts
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);

CREATE INDEX idx_inventory_alerts_pharmacy ON inventory_alerts(pharmacy_id);
CREATE INDEX idx_inventory_alerts_status ON inventory_alerts(status) WHERE status = 'active';
CREATE INDEX idx_inventory_alerts_severity ON inventory_alerts(severity) WHERE status = 'active';
```

### 11. AuditTrailEntry

**Purpose**: Immutable audit logs for compliance (HIPAA, GDPR, Swiss regulations)
**Tenant Scope**: Global (includes `pharmacy_id` for filtering)

```sql
CREATE TABLE audit_trail_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    pharmacy_id UUID REFERENCES pharmacies(id),  -- Nullable for global events
    user_id UUID NOT NULL REFERENCES users(id),

    -- Event
    event_type VARCHAR(100) NOT NULL,  -- "prescription.approved", "record.accessed", "delivery.confirmed"
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
    resource_type VARCHAR(100) NOT NULL,  -- "prescription", "patient_medical_record", "inventory_item"
    resource_id UUID NOT NULL,

    -- Changes (for UPDATE actions)
    changes JSONB,  -- {field: {old: value, new: value}}

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,

    -- Timestamp (immutable)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- No Row-Level Security on audit trail (global visibility for compliance officers)

-- No UPDATE or DELETE permissions (append-only log)
REVOKE UPDATE, DELETE ON audit_trail_entries FROM PUBLIC;

CREATE INDEX idx_audit_trail_pharmacy ON audit_trail_entries(pharmacy_id) WHERE pharmacy_id IS NOT NULL;
CREATE INDEX idx_audit_trail_user ON audit_trail_entries(user_id);
CREATE INDEX idx_audit_trail_resource ON audit_trail_entries(resource_type, resource_id);
CREATE INDEX idx_audit_trail_event ON audit_trail_entries(event_type);
CREATE INDEX idx_audit_trail_created ON audit_trail_entries(created_at DESC);
```

---

## Relationships

### Entity Relationship Diagram (MVP Entities)

```text
┌─────────────┐       ┌──────────────┐       ┌───────────────────┐
│  Pharmacy   │───┬───│     User     │───┬───│   Prescription    │
└─────────────┘   │   └──────────────┘   │   └───────────────────┘
                  │           │           │            │
                  │           │           │            │
                  │           │           │            ▼
                  │           │           │   ┌───────────────────┐
                  │           │           │   │ PrescriptionItem  │
                  │           │           │   └───────────────────┘
                  │           │           │            │
                  │           │           │            │
                  │           │           │            ▼
                  │           │           │   ┌───────────────────┐
                  │           │           │   │  TreatmentPlan    │
                  │           │           │   └───────────────────┘
                  │           │           │
                  │           │           ▼
                  │           │   ┌──────────────────┐
                  │           │   │ Teleconsultation │
                  │           │   └──────────────────┘
                  │           │            │
                  │           │            ▼
                  │           │   ┌──────────────────┐
                  │           │   │ ConsultationNote │
                  │           │   └──────────────────┘
                  │           │
                  │           ▼
                  │   ┌──────────────────┐
                  └───│  InventoryItem   │
                      └──────────────────┘
                               │
                               ▼
                      ┌──────────────────────┐
                      │ InventoryTransaction │
                      └──────────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ InventoryAlert   │
                      └──────────────────┘

                ┌────────────────────┐
                │ AuditTrailEntry    │  (References all entities)
                └────────────────────┘
```

### Key Relationships

| Parent | Child | Relationship | Cascade |
|--------|-------|--------------|---------|
| Pharmacy | User | 1:N (optional) | No |
| User (patient) | Prescription | 1:N | No |
| User (doctor) | Prescription | 1:N | No |
| User (pharmacist) | Prescription (approved_by) | 1:N | No |
| Prescription | PrescriptionItem | 1:N | YES (ON DELETE CASCADE) |
| Prescription | TreatmentPlan | 1:1 | No |
| Pharmacy | Teleconsultation | 1:N | No |
| User (patient) | Teleconsultation | 1:N | No |
| User (pharmacist) | Teleconsultation | 1:N | No |
| Teleconsultation | ConsultationNote | 1:1 | YES (ON DELETE CASCADE) |
| Pharmacy | InventoryItem | 1:N | No |
| InventoryItem | InventoryTransaction | 1:N | No |
| InventoryItem | InventoryAlert | 1:N | No |

---

## RBAC Permission Matrix

### Permission Notation

- ✅ **Full Access**: Create, Read, Update, Delete
- 📖 **Read Only**: View data, no modifications
- 📝 **Create/Update**: Can create and update, no delete
- ⛔ **No Access**: Cannot access

### Entity Permissions by Role

| Entity | Pharmacist | Doctor | Nurse | Delivery | Patient |
|--------|------------|--------|-------|----------|---------|
| **User (own profile)** | 📝 | 📝 | 📝 | 📝 | 📝 |
| **User (others)** | 📖 (pharmacy staff) | ⛔ | ⛔ | ⛔ | ⛔ |
| **Pharmacy** | 📖 (own pharmacy) | ⛔ | ⛔ | ⛔ | ⛔ |
| **Prescription** | ✅ | 📝 (can create/view own) | 📖 (patient's only) | ⛔ | 📖 (own only) |
| **PrescriptionItem** | ✅ | 📝 | ⛔ | ⛔ | 📖 (own only) |
| **TreatmentPlan** | ✅ | 📖 (patient's only) | 📖 (patient's only) | ⛔ | 📖 (own only) |
| **Teleconsultation** | ✅ | ⛔ | ⛔ | ⛔ | 📝 (can create/view own) |
| **ConsultationNote** | ✅ | ⛔ | ⛔ | ⛔ | 📖 (own only, after consent) |
| **InventoryItem** | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| **InventoryTransaction** | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| **InventoryAlert** | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| **AuditTrailEntry** | 📖 (own pharmacy) | ⛔ | ⛔ | ⛔ | 📖 (own actions only) |

### Role-Specific Rules

#### Pharmacist
- Can access all prescriptions in their pharmacy
- Can create/update inventory items
- Can approve/reject prescriptions
- Can view patient medical records with prescription context
- **Restriction**: Cannot delete audit trail entries

#### Doctor
- Can create prescriptions for their patients
- Can view prescriptions they created
- Can message pharmacists for clarification (via prescription context)
- **Restriction**: Cannot access inventory data, delivery data

#### Nurse
- Can view patients' current prescriptions and medication history
- Can create medication orders (links to existing prescriptions)
- **Restriction**: Cannot approve prescriptions, cannot access inventory

#### Delivery Personnel
- Can view delivery orders assigned to them
- Can update delivery status (GPS location, confirmation)
- **Restriction**: Cannot view patient medical records, prescriptions (only delivery address)

#### Patient
- Can view own prescriptions, treatment plans, teleconsultations
- Can upload prescriptions
- Can book teleconsultations
- Can view own medical records
- **Restriction**: Cannot access other patients' data, cannot access pharmacy inventory

---

## State Machines

### Prescription State Machine

```text
[pending] ────┐
              │
              ▼
        [in_review] ────┐
              │         │
              │         ▼
              │   [clarification_needed] ─── (doctor responds) ───┐
              │                                                     │
              ▼                                                     │
         [approved] ◄────────────────────────────────────────────────
              │
              ▼
    (treatment plan generated)
              │
              ▼
       (validity expires)
              │
              ▼
          [expired]

Alternative path:
        [in_review] ──► [rejected] (with reason)
```

**Transition Rules**:
- `pending → in_review`: Pharmacist claims prescription
- `in_review → clarification_needed`: Pharmacist messages doctor
- `clarification_needed → in_review`: Doctor responds, pharmacist re-reviews
- `in_review → approved`: Pharmacist validates all fields, no safety warnings
- `in_review → rejected`: Invalid prescription, safety concerns, or expired
- `approved → expired`: Prescription validity period elapsed (3 months typical)

**Immutable States**: `approved`, `rejected`, `expired` (cannot be changed once set)

**Audit Events**: Every state transition creates `AuditTrailEntry` with old/new status

### Teleconsultation State Machine

```text
[scheduled] ────┐
                │
                ▼
         [in_progress] ───┐
                │         │
                │         ▼
                │   [completed] ◄── (prescription created if needed)
                │
                ▼
         [cancelled] (before start)
                │
                ▼
           [no_show] (if patient doesn't join within 10 min)
```

**Transition Rules**:
- `scheduled → in_progress`: Pharmacist/patient joins Twilio room
- `in_progress → completed`: Session ends, notes saved
- `scheduled → cancelled`: Either party cancels before start
- `scheduled → no_show`: Patient doesn't join within grace period

**Side Effects**:
- `completed`: Save `ConsultationNote`, create prescription if needed
- `cancelled`: Free up pharmacist time slot for rebooking

### InventoryItem Stock Levels

```text
(optimal_stock_level) ────┐
                          │
                          ▼
                  [normal_stock]
                          │
    (quantity <= reorder_threshold)
                          │
                          ▼
                   [low_stock] ───► (generate InventoryAlert: "low_stock")
                          │
     (quantity <= reorder_threshold / 2)
                          │
                          ▼
                 [critical_stock] ───► (generate InventoryAlert: "critical", severity: "high")
                          │
                   (quantity = 0)
                          │
                          ▼
                    [out_of_stock] ───► (block prescription fulfillment for this medication)
```

**Triggers**:
- After every `InventoryTransaction` (dispense), recalculate stock level
- Generate `InventoryAlert` if crossing threshold
- AI suggests reorder quantity based on demand forecast

---

## Encryption Annotations

### Fields Requiring AWS KMS Encryption

| Table | Encrypted Fields | Key Rotation | Audit Access |
|-------|------------------|--------------|--------------|
| `users` | `first_name_encrypted`, `last_name_encrypted`, `phone_encrypted` | Annual | ✅ Yes |
| `pharmacies` | `address_encrypted` | Annual | ✅ Yes |
| `consultation_notes` | `ai_transcript_encrypted`, `pharmacist_notes_encrypted` | Annual | ✅ Yes |

### Non-Encrypted Fields (with Justification)

| Table | Non-Encrypted Fields | Reason |
|-------|----------------------|--------|
| `users` | `email` | Needed for login lookup (hashed indexes work on plaintext) |
| `prescriptions` | `status`, `ai_confidence_score` | Not PHI (metadata about prescription, not patient data) |
| `inventory_items` | `medication_name`, `quantity` | Not PHI (pharmacy inventory is not patient-specific) |
| `audit_trail_entries` | All fields except `changes` (encrypted if contains PHI) | Audit trails need to be searchable for compliance reporting |

### Encryption Performance Optimization

- **Data Key Caching**: Cache up to 1000 AWS KMS data keys for 5 minutes to reduce API calls
- **Batch Encryption**: Encrypt multiple fields in single KMS API call when creating/updating records
- **Lazy Decryption**: Decrypt fields only when accessed (don't decrypt entire row if only reading `id` or `status`)

---

## Indexes

### Performance-Critical Indexes (MVP)

```sql
-- Prescription lookup by patient (dashboard)
CREATE INDEX idx_prescriptions_patient_status ON prescriptions(patient_id, status);

-- Prescription queue for pharmacists (ordered by creation)
CREATE INDEX idx_prescriptions_pharmacy_status_created
    ON prescriptions(pharmacy_id, status, created_at DESC)
    WHERE status IN ('pending', 'in_review', 'clarification_needed');

-- Upcoming teleconsultations
CREATE INDEX idx_teleconsultations_pharmacist_scheduled
    ON teleconsultations(pharmacist_id, scheduled_at)
    WHERE status = 'scheduled';

-- Low stock alerts (dashboard)
CREATE INDEX idx_inventory_alerts_pharmacy_active_severity
    ON inventory_alerts(pharmacy_id, severity, created_at DESC)
    WHERE status = 'active';

-- Audit trail search (compliance reports)
CREATE INDEX idx_audit_trail_pharmacy_created
    ON audit_trail_entries(pharmacy_id, created_at DESC);

CREATE INDEX idx_audit_trail_resource_type_id
    ON audit_trail_entries(resource_type, resource_id);
```

### Composite Indexes for Common Queries

```sql
-- Patient prescription history (ordered by date)
CREATE INDEX idx_prescriptions_patient_approved_date
    ON prescriptions(patient_id, approved_at DESC)
    WHERE status = 'approved';

-- Inventory transactions for traceability (QR scan lookups)
CREATE INDEX idx_inventory_transactions_item_created
    ON inventory_transactions(inventory_item_id, created_at DESC);

-- Treatment plan refills due soon
CREATE INDEX idx_treatment_plans_refill_due
    ON treatment_plans(patient_id, refill_due_date)
    WHERE status = 'active' AND refill_due_date <= CURRENT_DATE + INTERVAL '7 days';
```

---

## Next Steps

1. ✅ **Data Model Complete**: Entity schemas, relationships, RBAC, state machines defined
2. ⏭ **Generate API Contracts**: Create OpenAPI 3.0 specs for MVP services (Prescription, Teleconsultation, Inventory)
3. ⏭ **Generate Quickstart Guide**: Local development setup with Docker Compose
4. ⏭ **Update Agent Context**: Add selected technologies to agent-specific context file

**Command to continue**: Proceed to API contracts generation in `contracts/` directory.
