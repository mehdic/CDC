# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MetaPharm Connect** is a comprehensive healthcare platform connecting pharmacists, doctors, nurses, delivery personnel, and patients. The project is currently in the UX/UI design and specification phase.

This repository contains:
- Product specifications and requirements (Cahier des Charges)
- User personas and journey mapping
- Feature requirements for five distinct user roles

## Project Context

### Five User Types with Distinct Needs

1. **Pharmacists**: Master account management, prescription processing, teleconsultation, inventory management, analytics, marketing, and delivery coordination
2. **Doctors**: Secure interprofessional communication, prescription creation/renewal, patient record access
3. **Nurses**: Medication ordering for patients, access to pharmacy patient records, delivery tracking
4. **Delivery Personnel**: Delivery request management, GPS tracking, QR code scanning, route optimization
5. **Patients**: Personalized healthcare service, teleconsultation, prescription management, e-commerce (OTC/parapharmacy), medical record access, appointment booking, "Golden MetaPharm" VIP program

### Core Platform Features

- **AI-Powered Features**: Prescription reading/transcription, drug interaction checking, inventory alerts, personalized recommendations, predictive restocking, digital twin patient profiles
- **Security Requirements**: End-to-end encryption, MFA for pharmacists, e-ID authentication (HIN provider in Switzerland), HIPAA/GDPR compliance
- **Communication**: Integrated secure messaging (WhatsApp-style), video calls, voice transcription, multi-channel integration (email, WhatsApp, fax)
- **Logistics**: Real-time delivery tracking (Uber-style), GPS optimization, QR code traceability, special handling for controlled substances
- **Healthcare Integration**: Swiss cantonal health records (e-santé API), insurance/third-party payment systems

## Documentation Structure

### Primary Documentation

- `initial-docs/CDC_Final.md` - Complete UX/UI specification document (version 17.05.2025) containing:
  - Detailed user personas and workflows
  - Feature requirements by user role
  - User journey maps
  - Sitemap and navigation requirements
  - Wireframe specifications

### Key Design Deliverables Expected

1. **Sitemap**: Page hierarchy for all five user apps
2. **Navigation Logic**: Cross-platform flows (mobile/desktop differences)
3. **Low-Fidelity Wireframes**: Core screens including:
   - Login/profile pages
   - Dashboards (role-specific)
   - Messaging interfaces
   - Teleconsultation interfaces (pharmacist and patient views)
   - Product search/catalog
   - Prescription processing workflows

## Development Considerations (Future)

When this project moves to implementation phase:

### Technology Stack Considerations

- **Multi-tenant Architecture**: Separate apps for 5 user roles with shared backend services
- **Real-time Features**: WebSocket/SignalR for messaging, delivery tracking, video calls
- **AI/ML Integration**: OCR for prescription reading, NLP for drug interaction analysis, recommendation engines
- **Healthcare Compliance**: HIPAA/GDPR data handling, audit logging, encrypted storage
- **Swiss Healthcare Systems**: HIN e-ID integration, cantonal health record APIs, Swiss insurance systems
- **Mobile-First**: iOS/Android apps with offline capabilities for delivery personnel

### Security Requirements

- Zero trust architecture with role-based access control (RBAC)
- End-to-end encryption for all health data
- MFA mandatory for healthcare professionals
- Audit trails for all prescription and medical record access
- Secure video calling infrastructure (not third-party)

### Key Technical Challenges

1. **Real-time Inventory Synchronization**: QR code scanning with instant stock updates across all pharmacist accounts
2. **AI-Powered Prescription Validation**: OCR + drug database + patient history + allergy checking
3. **Route Optimization**: Delivery logistics with constraints (cold chain, controlled substances, patient availability)
4. **Multi-Channel Communication**: Unified inbox aggregating email, WhatsApp, fax, in-app messaging
5. **Healthcare Data Interoperability**: Integration with Swiss cantonal systems and insurance providers

## Design Philosophy

- **Patient-Centric**: Reduce effort, anticipate needs, proactive recommendations
- **Zero Oral Communication**: All orders/instructions must be documented for traceability
- **Minimalist for Doctors**: Speed and simplicity prioritized
- **Security-First**: All communications encrypted, all actions logged
- **Adaptive UI**: Interface adjusts based on user profile (chronic patient vs. occasional user)

## Current Project Status

This is a **specification and design repository**. No code has been implemented yet. The focus is on:
- Refining user requirements
- Creating wireframes and navigation flows
- Planning the technical architecture
- Defining the MVP scope

When adding to this repository:
- Keep specifications in `initial-docs/` directory
- Use French for user-facing content (target market: French-speaking Switzerland)
- Maintain clear separation between the five user role requirements
- Document all compliance requirements (Swiss healthcare regulations, data protection laws)
