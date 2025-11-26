# C4 Model - Context Diagram

**System Context Diagram** for MetaPharm Connect healthcare platform.

## Overview

The Context diagram shows the high-level overview of the MetaPharm Connect system and its interactions with external systems and users.

## C4 Context Diagram

```
                                    ┌─────────────────────────────────┐
                                    │  External Healthcare Systems    │
                                    │ ┌──────────────────────────────┐ │
                                    │ │ Swiss e-santé API            │ │
                                    │ │ (Cantonal Health Records)    │ │
                                    │ └──────────────────────────────┘ │
                                    │ ┌──────────────────────────────┐ │
                                    │ │ Insurance/Third-Party Payer  │ │
                                    │ │ (Payment Integration)        │ │
                                    │ └──────────────────────────────┘ │
                                    │ ┌──────────────────────────────┐ │
                                    │ │ Drug Interaction Database    │ │
                                    │ │ (FDB MedKnowledge)           │ │
                                    │ └──────────────────────────────┘ │
                                    └────────────────┬──────────────────┘
                                                     │
                                ┌────────────────────┼────────────────────┐
                                │                    │                    │
                    ┌───────────▼──┐      ┌─────────▼───────┐  ┌────────▼─────┐
                    │ Pharmacists  │      │ Doctors         │  │ Nurses       │
                    │              │      │                 │  │              │
                    │ - RX Review  │      │ - Prescribe     │  │ - Medication │
                    │ - Inventory  │      │ - Communicate   │  │ - Ordering   │
                    │ - Patients   │      │ - Patient Data  │  │ - Tracking   │
                    └───────────┬──┘      └─────────┬───────┘  └────────┬─────┘
                                │                   │                   │
                    ┌───────────┴───────────────────┼───────────────────┘
                    │                               │
                    │       ┌──────────────────────▼──────────────────────┐
                    │       │   MetaPharm Connect (Healthcare Platform)   │
                    │       │  ┌────────────────────────────────────────┐ │
                    │       │  │ - Prescription Management             │ │
                    │       │  │ - Teleconsultation                    │ │
                    │       │  │ - Secure Messaging                    │ │
                    │       │  │ - Inventory Management                │ │
                    │       │  │ - Delivery Coordination               │ │
                    │       │  │ - Patient E-Commerce                  │ │
                    │       │  │ - Medical Records                     │ │
                    │       │  │ - Analytics & Reporting               │ │
                    │       │  └────────────────────────────────────────┘ │
                    │       └──────────────────────┬──────────────────────┘
                    │                              │
        ┌───────────┴──────────┬──────────────────┼─────────────────┐
        │                      │                  │                 │
    ┌───▼──┐          ┌────────▼──┐       ┌──────▼────┐      ┌─────▼──┐
    │Patients         │ Delivery   │       │ Pharmacies│      │Analytics
    │                 │ Personnel  │       │ Staff     │      │ Teams
    │ - Order Meds    │            │       │           │      │
    │ - Consult       │ - Delivery │       │ - Master  │      │ - Reports
    │ - Track RX      │ - Tracking │       │   Manage  │      │ - Metrics
    │ - Health Data   │ - QR Scan  │       │ - Billing │      │
    └────────────────┘ └───────────┘       └───────────┘      └────────┘
        │                  │                     │                 │
        └──────────────────┴─────────────────────┴─────────────────┘
                           │
                    ┌──────▼──────────────┐
                    │  Communication     │
                    │  Channels          │
                    ├────────────────────┤
                    │ - Email (SendGrid) │
                    │ - SMS (Twilio)     │
                    │ - Push Notifications
                    │ - Video Calls      │
                    │ (Twilio Video)     │
                    └────────────────────┘
```

## Key System Interactions

### 1. User Roles & Primary Functions

| Role | Primary Actions | Key Features |
|------|----------------|--------------|
| **Pharmacists** | Prescription validation, inventory management, patient communication | Drug interaction checking, stock alerts, teleconsultation, analytics |
| **Doctors** | Prescription creation, patient monitoring | Secure messaging, patient records, interprofessional communication |
| **Nurses** | Medication ordering, patient monitoring | Patient records access, delivery tracking, medication administration |
| **Delivery Personnel** | Delivery management, route optimization | GPS tracking, QR scanning, proof of delivery, earnings tracking |
| **Patients** | Order medications, manage health records | Prescription tracking, teleconsultation, medication history, e-commerce |

### 2. External System Integrations

#### Swiss Healthcare Systems
- **e-santé API**: Access to cantonal health records
- **Insurance Systems**: Third-party payer integration for billing
- **Regulatory Compliance**: Swiss medical practice regulations

#### Third-Party Services
- **FDB MedKnowledge**: Drug interaction database for prescription validation
- **SendGrid**: Email notifications and communications
- **Twilio**: SMS messaging, voice calls, video conferencing
- **Stripe**: Payment processing for e-commerce transactions
- **AWS**: Cloud infrastructure, S3 storage, SES for email

### 3. Core System Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                    MetaPharm Connect                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Authentication & Authorization                            │
│  - Multi-factor authentication (MFA)                        │
│  - Role-based access control (RBAC)                         │
│  - HIN e-ID integration for healthcare professionals       │
│                                                              │
│  Prescription Management                                    │
│  - OCR for prescription scanning                            │
│  - Drug interaction checking                                │
│  - Validation workflow                                       │
│  - Pharmacy inventory coordination                           │
│                                                              │
│  Secure Communications                                      │
│  - End-to-end encrypted messaging                           │
│  - Real-time notifications                                  │
│  - Secure video consultations                               │
│  - Message archiving for compliance                         │
│                                                              │
│  Delivery Management                                        │
│  - Real-time GPS tracking                                   │
│  - Route optimization                                        │
│  - QR code verification                                      │
│  - Proof of delivery capture                                │
│                                                              │
│  Healthcare Integration                                     │
│  - Medical record management                                │
│  - Patient history tracking                                 │
│  - Prescription history                                      │
│  - Allergy and adverse reaction tracking                    │
│                                                              │
│  E-Commerce & Inventory                                     │
│  - OTC medication sales                                      │
│  - Pharmacy product catalog                                 │
│  - Stock management with predictive restocking              │
│  - Automatic low-stock alerts                               │
│                                                              │
│  Analytics & Reporting                                      │
│  - Usage analytics                                           │
│  - Prescription trends                                       │
│  - Delivery performance metrics                              │
│  - Financial reporting                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Scenarios

### Scenario 1: Prescription Processing

```
Doctor                    MetaPharm           Pharmacist          Patient
  │                           │                   │                 │
  ├─ Create RX ──────────────>│                   │                 │
  │                           │                   │                 │
  │                           ├─ Check Interactions with FDB API    │
  │                           │                   │                 │
  │                           ├─ Notify ─────────>│                 │
  │                           │                   │                 │
  │                           │   ├─ Validate     │                 │
  │                           │   ├─ Check Stock  │                 │
  │                           │                   │                 │
  │                           │<─ Approval ──────┤                 │
  │                           │                   │                 │
  │                           ├─ Notification ───────────────────>│
  │                           │                   │                 │
```

### Scenario 2: Delivery Coordination

```
Pharmacist            MetaPharm         Delivery Personnel        Patient
   │                     │                    │                      │
   ├─ Create Delivery ───>│                    │                      │
   │                      │                    │                      │
   │                      ├─ Assign ─────────>│                       │
   │                      │                    │                      │
   │                      │                    ├─ GPS Tracking ──────>│
   │                      │                    │   (Real-time)        │
   │                      │                    │                      │
   │                      │                    ├─ QR Scan            │
   │                      │                    ├─ Proof of Delivery  │
   │                      │                    │                      │
   │                      │<─ Delivery Complete─                      │
   │                      │                    │                      │
   │                      ├─ Notification ────────────────────────>│
   │                      │                                            │
```

### Scenario 3: Teleconsultation

```
Patient              MetaPharm           Pharmacist          External Services
  │                     │                   │                      │
  ├─ Request Call ────>│                    │                      │
  │                    │                    │                      │
  │                    ├─ Notify ─────────>│                       │
  │                    │                    │                      │
  │                    │<─ Accept ──────────                       │
  │                    │                    │                      │
  │                    ├─ Initiate Video ──────┐                    │
  │                    │                    │   │                    │
  │<─ Video Call ──────────────────────────────── Twilio Video ─────│
  │                    │                    │   │                    │
  │                    │                    ├─ Transcription ──────>│
  │                    │                    │   │                    │
  │                    │<─ Notes Saved ──────                       │
  │                    │                    │                      │
  │<─ Consultation Complete ───────────────>│                      │
  │                    │                    │                      │
```

## System Boundaries & Trust

```
╔═══════════════════════════════════════════════════════════════════════╗
║                          METAPHARM BOUNDARY                           ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │  TRUSTED NETWORKS (Internal)                                    │  ║
║  │  - Pharmacists, Doctors, Nurses (Professional Users)           │  ║
║  │  - Delivery Personnel (Pre-vetted)                             │  ║
║  │  - Pharmacy Administrators                                      │  ║
║  │  - System Administrators                                        │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │  PUBLIC NETWORKS (Verified Users)                               │  ║
║  │  - Patients (Identity Verified)                                 │  ║
║  │  - Public e-commerce platform (for OTC products)               │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│          REGULATED EXTERNAL SYSTEMS                                  │
│  - Swiss Healthcare Authorities (e-santé)                           │
│  - Insurance Companies                                               │
│  - Drug Databases (FDB)                                             │
│  - Approved Payment Processors                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Security & Compliance

### Data Protection
- **Encryption**: End-to-end encryption for all communications
- **Storage**: Encrypted at rest (AES-256)
- **Transport**: HTTPS/TLS 1.3 for all data in transit
- **Access**: Role-based access control with audit logging

### Regulatory Compliance
- **HIPAA**: Health Insurance Portability and Accountability Act
- **GDPR**: General Data Protection Regulation
- **Swiss Data Protection Act**: Compliance with Swiss federal law
- **Medical Records Act**: Secure storage of patient medical information

### Audit & Accountability
- All PHI access logged with timestamp and user identification
- Immutable audit trail maintained for 7 years
- Regular security audits and penetration testing
- Incident response procedures in place

---

**For more details, see:**
- [C4 Container Diagram](./c4-container.md)
- [C4 Component Diagram](./c4-component.md)
- [Architecture Overview](./README.md)
