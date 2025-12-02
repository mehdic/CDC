# Swiss EPD (Electronic Patient Dossier) Integration Research

**Document Version:** 1.0
**Date:** December 2, 2025
**Prepared by:** MetaPharm Connect Development Team
**Status:** Research Phase - T5-010

---

## 1. Overview of Swiss EPD

### 1.1 What is the Swiss EPD?

The Swiss Electronic Patient Dossier (EPD/EPR - Electronic Patient Record) is a patient-centric digital repository of health-related documents and information. It represents a paradigm shift in Swiss healthcare IT, moving from provider-centric systems to a unified, patient-controlled health record accessible across organizational and cantonal boundaries.

**Key Characteristics:**
- **Patient-Controlled:** Patients decide who can access their records and at what level
- **Decentralized Yet Coordinated:** Multiple affinity domains (regional healthcare communities) with national coordination
- **Legally Binding:** The Electronic Patient Record Act (EPRA) and EPRO-FDHA Ordinance mandate its use
- **Secure & Encrypted:** End-to-end encryption with audit trails for all access
- **Multi-Provider:** Accessible by healthcare professionals (doctors, pharmacists, nurses) with patient consent

### 1.2 Legal Framework

**Primary Legislation:**
- **Federal Act on the Electronic Patient Record (EPRA)** - Establishes legal framework for EPD
- **EPRO-FDHA Ordinance** - Ordinance of the Federal Department of Home Affairs on the Electronic Patient Record
  - **Annex 2:** Technical certification requirements for EPD communities
  - **Annex 3:** Metadata standards (Swiss XDS Metadata specifications)
  - **Annex 4:** Exchange formats (CH eMED, CH VACD, CH eTOC, CH AllergyIntolerance)
  - **Annex 5:** Additional technical requirements (updated with amendments through 2024)

**Recent Updates (2024-2025):**
- Revised annexes entered into force on **June 1, 2024**
- Implementation deadline: **May 31, 2025** for stakeholder compliance
- Federal Council resolution (September 2024): Central EPD infrastructure to become federal responsibility
- Expected dispatch for EPR access via state e-ID to Parliament in Spring 2025

### 1.3 Strategic Context

The EPD is part of Switzerland's broader **Digital Health Strategy (DigiSanté 2025-2034)**, which aims to:
- Promote digital transformation of healthcare systems
- Enhance efficiency, transparency, and patient safety
- Integrate EPD into Swiss Health Data Space (SwissHDS)

---

## 2. eHealth Suisse - National Coordination Body

### 2.1 Role and Responsibilities

**eHealth Suisse** is the Swiss Competence and Coordination Centre of the Confederation and Cantons for digital networking in the healthcare system.

**Primary Functions:**
- Developing and maintaining technical standards and specifications
- Coordinating EPD implementation across cantons and healthcare providers
- Ensuring interoperability through standards-based approaches
- Providing technical support and guidance for implementation
- Organizing digital health testing events (Projectathon)

### 2.2 Technical Standards Authority

eHealth Suisse publishes and maintains:
- **Technical specifications page:** https://www.e-health-suisse.ch/technik/technische-interoperabilitaet/epd-spezifikationen
- **Standards documentation:** IHE profiles, HL7/FHIR implementation guides
- **Reference implementations:** Examples and best practices
- **EPD Playground:** Testing environment for mHealth app integration (https://epdplayground.ch/)

### 2.3 Standards Used

eHealth Suisse mandate all implementations to use internationally recognized standards:
- **IHE (Integrating the Healthcare Enterprise)** - Technical integration profiles
- **HL7/FHIR (Fast Healthcare Interoperability Resources)** - Data exchange and semantic standards
- **SNOMED CT** - Clinical terminology for diagnoses and procedures
- **LOINC** - Observation and document type codes
- **ISO/HL7 CDA (Clinical Document Architecture)** - Document structure standard

### 2.4 GitHub Repository

eHealth Suisse maintains open-source implementations and tools:
- **Repository:** https://github.com/ehealthsuisse
- **Key Project:** ch-epr-fhir - Swiss FHIR implementation guides
- **Tools:** Python scripts for XML to JSON transformations, testing utilities

---

## 3. Cantonal Platforms and Regional Implementation

### 3.1 EPD Implementation Model

Switzerland implements EPD through **"affinity domains"** (Stammgemeinschaften) and **"core communities"** rather than a single national system:

- **Affinity Domain:** A group of healthcare enterprises that agree to work together using common policies and shared infrastructure
- **Core Community:** Communities where patients can open personal EPR accounts
- **Cantonal Autonomy:** Each canton implements EPD with some independence, but within national standards framework

### 3.2 Major Cantonal Platforms

#### **CARA (Western Switzerland)**

**Coverage:** Five French-speaking cantons (Valais, Vaud, Fribourg, Neuchâtel, Jura)

**Characteristics:**
- Managed by CARA intercantonal association
- Uses Swiss Post solutions and services
- 200+ healthcare providers enrolled (all hospitals and major clinics in member cantons)
- Mature implementation with proven stability

**Technical Approach:**
- Swiss Post E-Health Platform backbone
- Standards-compliant with national requirements
- Well-documented API and integration patterns

#### **MonDossierMedical (Geneva) → CARA**

**Historical Note:**
- Geneva's "MonDossierMedical" was Switzerland's first EPR, operational for 10+ years
- Transitioned to nationally-compliant CARA platform in October 2021
- Legacy system (MonDossierMedical.ch) decommissioned September 30, 2021
- Demonstrates successful cantonal platform migration to national standards

**Transition Lessons:**
- Path exists for legacy systems to migrate to national framework
- 10+ year head start gave Geneva early insights into EPD workflows
- CARA adoption shows viability of consolidated regional platforms

#### **eSanté/Swisscom EPD**

**Coverage:** Multiple cantons through Swisscom Trust Services

**Characteristics:**
- Alternative implementation using Swisscom infrastructure
- Not yet fully compatible with Swiss Post/CARA solutions (noted interoperability gap)
- Still evolving toward full national standard compliance

#### **Post Sanela (Swiss Post)**

**Coverage:** XAD reference community in 14 cantons

**Characteristics:**
- Swiss Post's EPR offering
- Built on Post E-Health Platform
- Migration path available from other providers (emedo, esanita, abilis, cara)
- Patients can switch providers while maintaining EPR continuity

#### **Other Regional Implementations**

- **emedo, esanita, abilis** - Alternative regional EPD providers
- Various canton-specific implementations adapting to national standards

### 3.3 Platform Interoperability Challenges

**Current Status:**
- Multiple vendors developing proprietary ecosystems creating "new monopolies"
- Swisscom EPD not fully compatible with Swiss Post solutions
- This fragmentation undermines national interoperability objectives

**Federal Response:**
- Federal government mandating strict standards compliance
- Planned centralization of technical infrastructure as federal responsibility
- Emphasis on standards-based integration through IHE profiles and HL7/FHIR

### 3.4 API Differences Between Platforms

**Key Variation Areas:**

| Aspect | CARA/Swiss Post | Swisscom/eSanté | Other Providers |
|--------|-----------------|-----------------|-----------------|
| **Core Standards** | IHE XDS.b, HL7/FHIR | IHE-based (partial) | IHE-based (varying) |
| **Authentication** | HIN ID mandatory for providers | HIN ID + Swisscom eID | HIN ID (primary) |
| **Document Exchange** | Full IHE compliance | Partial compliance | Variable |
| **Consent Management** | EPRA-compliant | EPRA-compliant | EPRA-compliant |
| **Interoperability** | Established | In development | Limited |

**Practical Implication:**
- MetaPharm must support HIN ID authentication universally
- Initial integration should target CARA (most mature) and Swiss Post (largest coverage)
- Swisscom/eSanté support should be prioritized for Phase 2
- Use IHE profiles and HL7/FHIR as vendor-agnostic integration layer

---

## 4. IHE XDS.b Profile Requirements

### 4.1 What is IHE XDS.b?

**IHE (Integrating the Healthcare Enterprise)** is an international initiative of users and manufacturers standardizing IT system interoperability in healthcare.

**XDS.b (Cross-Enterprise Document Sharing-b)** is the foundational IHE profile for EPD. It enables secure registration, distribution, and access to patient documents across healthcare enterprises and organizational boundaries.

**Key Concept:** XDS organizes documents through metadata in a **Registry**, with actual document content stored in a **Repository**.

### 4.2 Swiss EPD IHE Profiles

Switzerland uses the following IHE profiles (with national customizations):

#### **Document Exchange Profiles**

| Profile | Purpose | Key Transactions |
|---------|---------|-----------------|
| **CH:XDS.b** | Cross-enterprise document sharing within affinity domain | ITI-18, ITI-43, ITI-41 |
| **CH:XCA** | Cross-community access across multiple affinity domains | XCA Query & Retrieve |
| **CH:XCPD** | Patient discovery across communities | XCPD Query |
| **CH:MHD** | Mobile Health Documents (REST-based) | RESTful document operations |

#### **Authentication & Security Profiles**

| Profile | Purpose | Application |
|---------|---------|------------|
| **CH:ATNA** | Audit Trail and Node Authentication | Secure communications, audit logging |
| **CH:XUA** | Cross-Enterprise User Assertion | Healthcare provider authentication |
| **CH:IUA** | Internet User Authorization | Web-based access control (v2.3 current) |
| **CH:TLS** | Transport Layer Security | Encryption in transit |

#### **Provider & Patient Data Profiles**

| Profile | Purpose |
|---------|---------|
| **CH:PDQv3** / **CH:PDQm** | Patient Demographics Query (SOAP/REST) |
| **CH:PIXv3** / **CH:PIXm** | Patient Identifier Cross-referencing (SOAP/REST) |
| **CH:HPD** | Health Provider Directory |

#### **Swiss-Specific Authorization Profiles**

| Profile | Purpose |
|---------|---------|
| **CH:ADR** | Authorization Decision Request |
| **CH:PPQ** | Privacy Policy Query |
| **CH:ATC** | Audit Trail Consumption |

### 4.3 Core EPD Transactions

#### **ITI-18: Registry Stored Query**

**Purpose:** Query registry for documents matching criteria

**Use Cases:**
- Find all prescriptions for a patient in last 30 days
- List recent allergy documents
- Search for specific document types

**Parameters:**
- Patient ID, document type (LOINC code), date range
- Access control and consent validation

#### **ITI-43: Retrieve Document Set**

**Purpose:** Retrieve actual document content from repository

**Workflow:**
1. Query registry (ITI-18) to find documents
2. Retrieve selected documents (ITI-43)
3. Validate access permissions and consent

**Security:** Server validates provider credentials (HIN ID) and patient consent before returning documents

#### **ITI-41: Provide and Register Document Set**

**Purpose:** Submit new documents to EPD

**Workflow:**
1. Provider submits document + metadata
2. System validates document format and metadata
3. Register metadata in registry
4. Store document in repository
5. Return document unique ID

**Validation:**
- Document format compliance (CDA, FHIR)
- Metadata completeness
- Patient consent (if creating new documents)
- Provider authorization

### 4.4 XDS Affinity Domain Concept

**What is it?**
A group of healthcare enterprises using shared policies and infrastructure to exchange documents

**In Swiss EPD Context:**
- Each cantonal platform is an affinity domain
- CARA, Swiss Post, Swisscom = separate affinity domains
- Cross-community access (XCA) enables queries across affinity domains

**Implications for MetaPharm:**
- Must connect to one or more affinity domains
- Initial integration likely with CARA or Swiss Post
- Use XCA profile for nationwide reach
- Handle affinity domain switching transparently

---

## 5. HL7 FHIR Integration Requirements

### 5.1 Swiss FHIR Profiles

Switzerland has developed comprehensive FHIR implementation guides at **https://fhir.ch/**:

#### **Core Exchange Formats (Annex 4 EPRO-FDHA)**

| Format | Purpose | FHIR Resources | Use Case |
|--------|---------|----------------|----------|
| **CH eMED** | Medication records | Medication, MedicationStatement | Prescription data exchange |
| **CH VACD** | Vaccination documentation | Immunization, Observation | Immunization history |
| **CH eTOC** | Transition of care | Composition, Bundle | Patient care handoff |
| **CH AllergyIntolerance** | Allergy & intolerance data | AllergyIntolerance, List | Allergy management |

#### **Supporting Implementation Guides**

| Guide | Purpose |
|-------|---------|
| **CH Core** | Base profiles for all Swiss FHIR implementations |
| **CH Term** | Terminology (ValueSets, CodeSystems) used in Swiss healthcare |
| **CH Specialties List (SL)** | Medicine catalog with reimbursement data |
| **CH EPR Terminology** | EPD-specific terminology bindings |

### 5.2 Key FHIR Resources for EPD

#### **Medication Resources**

```
Medication
├── code (GTIN - Global Trade Item Number in Switzerland)
├── form (tablet, injection, etc.)
└── ingredient
    ├── substance
    └── strength

MedicationStatement
├── subject (Patient reference)
├── medication (Medication reference)
├── dosage (timing, route, dose)
├── status (active, intended, completed)
└── dateAsserted
```

**Swiss Specific:** Uses GTIN codes for medicines (required by SL - Specialties List)

#### **Allergy Intolerance Resources**

```
AllergyIntolerance
├── subject (Patient reference)
├── code (SNOMED CT allergy code)
├── clinicalStatus (active, inactive)
├── verificationStatus (unconfirmed, presumed, confirmed)
├── type (allergy, intolerance)
├── reaction
│   ├── substance
│   ├── manifestation (SNOMED CT symptoms)
│   └── severity (mild, moderate, severe)
└── recordedDate
```

**Multiple Entries:** Unlike CH eTOC (which allows only one text field), FHIR supports multiple detailed allergy entries

#### **Prescription Resources (via CH eMED)**

Prescriptions in Swiss EPD use:
- `Medication` resource with GTIN code
- `MedicationRequest` for prescriptions
- `Patient` for demographic data
- `Practitioner` for prescriber information

**Document Structure:** Wrapped in FHIR `Composition` + `Bundle` for complete prescription document

### 5.3 eMedication Concept

**eMedication** is the Swiss initiative for standardized medication data exchange in EPD.

**Scope:**
- General medical information (allergies, medical history)
- Prescription data
- Medication administration records
- Patient-connected device data integration (future)
- Continuous care and monitoring services (planned)

**Implementation Status:**
- Phase 1 (Current): Medication exchange and allergy documentation
- Phase 2+ (Future): Integration with wearables, IoT devices, remote monitoring

**MetaPharm Integration Points:**
- Medication list query and display
- Allergy checking before prescription
- Drug interaction warnings
- Medication adherence tracking

### 5.4 Important FHIR Variations

**CH eTOC vs. FHIR IPS vs. CH eMED:**

| Aspect | CH eTOC | IPS (International) | CH eMED |
|--------|---------|-------------------|---------|
| **Allergy Entries** | Single text field only | Multiple entries | Multiple entries |
| **Medication Code** | Free text possible | SNOMED CT | GTIN (Swiss Specialties List) |
| **Flexibility** | Limited (minimal data) | Moderate | Comprehensive |
| **Use Case** | Handoff/transition | Cross-border exchange | Swiss EPD primary |

**Implication:** MetaPharm should support all three formats for different scenarios but prioritize CH eMED for EPD integration

---

## 6. Consent Management Framework

### 6.1 Legal Basis

**Consent Principles:**
- **Patient Autonomy:** Each patient decides who accesses their EPD
- **Mandatory Consent:** Healthcare providers cannot access EPD without explicit patient consent
- **Granular Control:** Patients can grant different access levels to different providers
- **Professional Secrecy:** Healthcare professionals subject to Article 321 Criminal Code confidentiality obligation

### 6.2 Access Levels

Swiss EPD defines **three access levels** that patients grant to healthcare providers:

| Access Level | Permissions | Typical Users | Example |
|-------------|------------|---------------|---------|
| **Level 1: Full Access** | Read all documents | Primary care providers, specialists | Family doctor, treating specialist |
| **Level 2: Limited Access** | Read specific document types | Ancillary providers | Laboratory, imaging center |
| **Level 3: Medication Only** | Read medication list only | Pharmacy staff | Community pharmacist |

**Patient Control:** Patients can modify access levels at any time or revoke access entirely

### 6.3 Consent Model

#### **Patient Consent Types**

1. **Explicit Consent**
   - Patient grants access to specific provider
   - Documented in EPD system
   - Can be time-limited or indefinite
   - Stored electronically in EPD

2. **Simplified Consent (via e-ID)**
   - Patients can confirm EPD opening via electronic ID
   - No handwritten signature required
   - Cantons now have query access to healthcare institution directory
   - Faster enrollment process

#### **Emergency Access**

Special provisions for emergency situations:
- Healthcare providers may access EPD without prior consent in life-threatening emergencies
- Access is logged and audited
- Patient is notified after emergency
- Provider must document medical justification

### 6.4 Consent Management Technical Requirements

**For MetaPharm Implementation:**
- Query patient consent status before accessing EPD
- Respect assigned access level (don't request medication list if only Rx access granted)
- Display current consent status to pharmacy staff
- Log all access attempts
- Support consent revocation workflow
- Handle emergency access scenarios with audit

---

## 7. Document Types and LOINC Codes

### 7.1 LOINC Code System

**LOINC (Logical Observation Identifiers Names and Codes)** is the international standard for document type identifiers.

**LOINC for Documents:**
- Uniquely identify document types
- Enable automated document routing and aggregation
- Support clinical decision support
- Facilitate interoperability across systems

**Swiss Usage:** LOINC codes required in EPD metadata (Annex 3 EPRO-FDHA)

### 7.2 Key Document Types for MetaPharm

| Document Type | LOINC Code | Description | MetaPharm Role |
|---------------|-----------|-------------|-----------------|
| **Prescription for medication** | 57833-6 | Prescription issued by doctor or nurse | Display, validate |
| **Medication summary** | 56445-0 | Current medications snapshot | Create, update |
| **Medication administration record** | 80565-5 | Historical medication administration | Display, archive |
| **Allergies and adverse reactions** | 48765-2 | Patient allergy list | Create, maintain, alert |
| **Allergy medication management** | 103809-0 | Medication-specific allergy notes | Display, cross-reference |

### 7.3 Prescription Document Structure

**EPD Prescription Documents Include:**
- Document type (LOINC 57833-6)
- Prescriber information (doctor/nurse with HIN ID)
- Patient demographics
- Medication details:
  - Drug name (GTIN code if available)
  - Strength, form, quantity
  - Dosage instructions (frequency, route)
  - Duration
  - Special instructions
- Date issued
- Validity period
- Authorization signature (digital)

### 7.4 Medication List Document (LOINC 56445-0)

**Purpose:** Summary of all current medications

**Typical Contents:**
- List of all active medications
- For each medication:
  - Name and GTIN code
  - Strength and form
  - Dosage
  - Prescriber information
  - Start date
  - Status (active, discontinued, etc.)

**MetaPharm Creation:** When pharmacist processes prescription, add/update medication list in EPD

### 7.5 Allergy Document (LOINC 48765-2)

**Minimum Contents:**
- Currently active allergies
- Relevant historical allergies
- For each allergy:
  - Allergen (SNOMED CT code + text)
  - Reaction type (allergy, intolerance, adverse effect)
  - Severity (mild, moderate, severe)
  - Reaction manifestations (symptoms)

**Critical for MetaPharm:**
- Query before dispensing (drug interaction checking)
- Display prominently to pharmacist
- Support allergy history updates from prescriptions
- Cross-check with medication allergies list

---

## 8. Certification Requirements

### 8.1 Swiss Interoperability Conformity Assessment Scheme (SIAS)

**Framework:** Swiss Interoperability Conformity Assessment Scheme (SIAS) Edition 1.9

**Purpose:** Certify that EPD platforms and service providers comply with Swiss interoperability specifications

**Scope Owner:** Federal Office of Public Health (FOPH)

**Execution:** Test laboratories designated by FOPH in coordination with eHealth Suisse

### 8.2 Certification Levels

#### **Community Certification**

**Applies to:** EPD communities (affinity domains, healthcare networks)

**Requirements:**
1. **Technical Compliance**
   - All IHE profiles properly implemented
   - All metadata standards (Annex 3) followed
   - All exchange formats (Annex 4) supported
   - Audit trail capabilities (ATNA)

2. **Operational Compliance**
   - Patient consent management working
   - Provider authentication (HIN ID)
   - Data privacy and encryption
   - Audit logging

3. **Testing Process**
   - Participate in Swiss Projectathon (highly recommended for cost efficiency)
   - Prepare Systems Under Test (SUTs)
   - Nominate project leader
   - Submit complete documentation to test laboratory
   - Execute conformity assessment tests

4. **Submission Requirements**
   - SUT names and versions
   - Vendor information
   - Community contact details
   - Previous test reports (if applicable)
   - SIA results to certification body

### 8.3 Service Provider Certification

**Applies to:** Software vendors, healthcare IT providers

**Requirements:**
- Implement certified IHE profiles
- Use approved standards (HL7/FHIR)
- Pass interoperability testing
- Maintain audit trails
- Support encryption and authentication

**For MetaPharm:** Service provider certification needed for EPD integration module

### 8.4 Projectathon for Testing

**Swiss Projectathon:**
- Annual testing event inspired by IHE-Europe Connectathon
- Reduces certification costs for participants
- Provides hands-on testing with other systems
- Validates implementations against national profiles
- Highly recommended for first-time EPD implementers

**Next Steps:**
- Register with Swiss Projectathon for testing phase
- Test MetaPharm EPD integration against reference implementations
- Validate FHIR profiles with eHealth Suisse samples

---

## 9. MetaPharm Data Mapping to EPD Documents

### 9.1 Prescription Workflow

**MetaPharm → EPD Mapping:**

```
MetaPharm Prescription Data
├── Patient Information
│   ├── Patient ID (local) → EPD Patient Demographics (PDQm)
│   ├── Phone/Email → EPD Contact Information
│   └── Insurance → EPD Coverage (future extension)
│
├── Prescriber Information
│   ├── Doctor Name → IHE Practitioner resource
│   ├── HIN ID → Required for EPD access
│   └── Specialty → IHE PractitionerRole
│
├── Medication Details
│   ├── Drug name → CH eMED Medication resource
│   ├── ATC code → IHE ValueSet binding
│   ├── Strength/Form → Medication.form + strength
│   ├── Dosage → MedicationRequest.dosageInstruction
│   └── Quantity → MedicationRequest.quantity
│
└── Prescription Metadata
    ├── Issue date → MedicationRequest.authoredOn
    ├── Validity period → MedicationRequest.dosageInstruction.timing
    ├── Special instructions → MedicationRequest.note
    └── Status → MedicationRequest.status
```

**Creation Process:**
1. Pharmacist receives prescription (digital, scanned, or handwritten)
2. MetaPharm converts to FHIR MedicationRequest
3. Wraps in Composition (document header)
4. Creates Bundle with all resources
5. Sends via ITI-41 (Provide and Register Document Set)
6. EPD system assigns unique document ID
7. Registry metadata stored, document content in repository

### 9.2 Medication List Synchronization

**Trigger:** When pharmacist processes prescription

**Workflow:**
1. Query EPD for current medication list (ITI-18 with LOINC 56445-0)
2. Add new medication
3. Mark duplicates/outdated medications as discontinued
4. Create updated Composition
5. Register updated medication list in EPD

**MetaPharm Data Usage:**
- Display current medications to pharmacist
- Prevent drug-drug interactions
- Support medication adherence checking
- Track prescription history

### 9.3 Allergy Management

**MetaPharm Allergy Sources:**
1. Patient-reported allergies (from patient app)
2. Allergies from EPD allergy document
3. Allergies embedded in prescriptions
4. Medication-specific allergies (from SL - Specialties List)

**Synchronization:**
- Query EPD allergy document (ITI-18 with LOINC 48765-2)
- Merge with MetaPharm internal allergy database
- Alert pharmacist of new/changed allergies
- Update EPD if pharmacist discovers new allergy during prescription processing

**Critical Workflow:**
```
Before Dispensing Any Medication:
1. Query EPD for allergies (ITI-18 → LOINC 48765-2)
2. Cross-check medication against allergies
3. Check drug interactions
4. Alert pharmacist if conflicts found
5. Log allergy check in MetaPharm and EPD audit trail
```

### 9.4 Vaccination Records

**Optional for Phase 1, Future Enhancement:**
- Query EPD vaccination document (CH VACD profile)
- Display vaccination history to patient
- Support vaccination appointment scheduling
- Integration with cantonal vaccination registries

### 9.5 Transition of Care (CH eTOC)

**Use Case:** Patient transferred between care facilities

**MetaPharm Role:**
- Generate eTOC document when patient completes therapy
- Include medication list, allergy summary, relevant notes
- Send to receiving provider (hospital, nursing home)
- Receive eTOC from hospitals for ambulatory care patients

---

## 10. Next Steps for Implementation (T5-011)

### 10.1 Phase 1: Architecture & Integration Design

**Deliverables (T5-011):**
1. **EPD Integration Architecture Document**
   - System component diagram
   - IHE profile implementation plan
   - Data flow diagrams

2. **Authentication & Authorization Design**
   - HIN ID integration workflow
   - Provider credential validation
   - Patient consent checking

3. **API Specification**
   - RESTful endpoints for EPD operations
   - ITI-18 (Query) implementation
   - ITI-43 (Retrieve) implementation
   - ITI-41 (Submit) implementation

4. **Data Mapping Specification**
   - FHIR profile binding document
   - CH eMED to MetaPharm prescription mapping
   - CH AllergyIntolerance integration

### 10.2 Phase 2: Development & Testing

**Requirements:**
1. Implement FHIR Profile Validator
   - Validate outgoing FHIR bundles
   - Parse incoming FHIR documents

2. Implement IHE Transactions
   - ITI-18: Query registry
   - ITI-43: Retrieve documents
   - ITI-41: Register documents

3. Integration Testing
   - Test with EPD Playground (epdplayground.ch)
   - Validate against CARA/Swiss Post test environments
   - Participate in Swiss Projectathon

4. Security Implementation
   - TLS/SSL for data in transit
   - Encryption for data at rest
   - Audit trail logging (ATNA profile)
   - HIN ID validation

### 10.3 Phase 3: Pilot & Certification

**Requirements:**
1. **Pilot Program**
   - 5-10 partner pharmacies with active EPD
   - Real-world prescription processing
   - Allergy checking workflows
   - User feedback collection

2. **Certification Preparation**
   - Document technical architecture
   - Prepare test scenarios
   - Register for SIAS assessment
   - Participate in Projectathon

3. **Go-Live**
   - Deploy certified integration
   - Train pharmacy staff
   - Monitor EPD operations
   - Support provider integration

### 10.4 Key Decision Points for T5-011

**1. Affinity Domain Priority**
- **Recommendation:** Start with CARA (most mature, 200+ providers)
- **Secondary:** Swiss Post XAD (14 cantons coverage)
- **Future:** Swisscom/eSanté (when full standards compliance achieved)

**2. FHIR Profile Version**
- **Current Standard:** HL7 FHIR R4 (Release 4)
- **Recommended:** Use latest stable Swiss profiles from fhir.ch
- **Deprecation Path:** Plan for R5 migration in 2026+

**3. Authentication Approach**
- **Mandatory:** HIN ID for all healthcare providers
- **For Patients:** Support both electronic ID and user/password
- **For Pharmacy Staff:** HIN ID validation against eHealth Suisse registry

**4. Interoperability Strategy**
- **Core:** Use IHE XDS.b (mature, well-tested)
- **Modern Alternative:** Evaluate IHE MHD (REST-based, mobile-friendly) for future
- **Cross-Community:** Plan for XCA integration for nationwide reach

**5. Testing Environment**
- **Recommended:** EPD Playground for initial testing
- **Staging:** Partner with CARA or Swiss Post for pre-production testing
- **Production:** Use certified environments only

---

## 11. Additional Resources

### 11.1 Official Documentation

| Resource | URL | Purpose |
|----------|-----|---------|
| eHealth Suisse EPD Specifications | https://www.e-health-suisse.ch/technik/technische-interoperabilitaet/epd-spezifikationen | Official specs, links to all standards |
| Swiss FHIR Profiles | https://fhir.ch/ | FHIR implementation guides |
| EPD Playground | https://epdplayground.ch/ | Testing environment for integrations |
| eHealth Suisse GitHub | https://github.com/ehealthsuisse | Code examples, tools, reference implementations |
| SIAS Framework Document | https://www.bag.admin.ch/dam/de/sd-web/b9mNv57CcrEJ/sias_edition_1.9.pdf | Certification requirements |
| FOPH EPD Information | https://www.bag.admin.ch/bag/en/home/strategie-und-politik/nationale-gesundheitsstrategien/strategie-ehealth-schweiz/umsetzung-vollzug/weiterentwicklung-epd.html | Federal policy and strategy |

### 11.2 LOINC Code Resources

| Document Type | LOINC Code | Reference |
|---------------|-----------|-----------|
| Prescription for medication | 57833-6 | https://loinc.org/57833-6 |
| Medication summary Document | 56445-0 | https://loinc.org/56445-0 |
| Medication administration record | 80565-5 | https://loinc.org/80565-5 |
| Allergies and adverse reactions Document | 48765-2 | https://loinc.org/48765-2 |
| Allergy Medication management note | 103809-0 | https://loinc.org/103809-0 |

### 11.3 Key Terminology Resources

| Standard | Purpose | Source |
|----------|---------|--------|
| SNOMED CT | Clinical terminology | Swiss eSante systems |
| ATC Code | Drug classification | WHO/Swiss SL |
| GTIN (EAN/UPC) | Medicine identifier | Swiss Specialties List |
| HIN ID | Healthcare provider ID | Health Info Net AG |
| SwissID | Patient electronic identity | SwissID/Federal government |

### 11.4 Standards Organizations

| Organization | Role | Website |
|--------------|------|---------|
| eHealth Suisse | National coordination | https://www.e-health-suisse.ch/ |
| IHE International | IHE profile development | https://www.ihe.net/ |
| HL7 Switzerland | FHIR profile development | https://fhir.ch/ |
| FOPH | Federal health policy | https://www.bag.admin.ch/ |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Affinity Domain** | A group of healthcare enterprises using shared policies and infrastructure for document exchange |
| **ATNA** | Audit Trail and Node Authentication - IHE profile for secure communications |
| **CARA** | Intercantonal association managing EPD in Western Switzerland (5 cantons) |
| **CDA** | Clinical Document Architecture - XML standard for clinical documents |
| **Compostion** | FHIR resource representing structured clinical document |
| **Core Community** | Regional healthcare community where patients can open EPD |
| **EPD** | Electronic Patient Dossier (also EPR - Electronic Patient Record) |
| **EPRA** | Federal Act on the Electronic Patient Record |
| **EPRO-FDHA** | Ordinance of the Federal Department of Home Affairs on EPD |
| **FHIR** | Fast Healthcare Interoperability Resources - modern health data exchange standard |
| **GTIN** | Global Trade Item Number - medicine identifier (Swiss requirement) |
| **HIN ID** | Health Info Net ID - mandatory Swiss healthcare provider identifier |
| **HL7** | Health Level Seven - healthcare data exchange standards |
| **IHE** | Integrating the Healthcare Enterprise - technical integration profiles |
| **IUA** | Internet User Authorization - authentication profile for web access |
| **ITI-18** | IHE transaction for querying document registry |
| **ITI-41** | IHE transaction for submitting documents to repository |
| **ITI-43** | IHE transaction for retrieving documents from repository |
| **LOINC** | Logical Observation Identifiers Names and Codes - document type standard |
| **MHD** | Mobile Health Documents - REST-based variant of XDS.b |
| **XAD** | XDS Affinity Domain - reference community |
| **XCA** | Cross-Community Access - cross-domain document retrieval |
| **XCPD** | Cross-Community Patient Discovery - patient ID lookup across domains |
| **XDS.b** | Cross-Enterprise Document Sharing-b - core EPD document exchange profile |
| **XUA** | Cross-Enterprise User Assertion - provider authentication |

---

## 13. Acceptance Criteria Verification

**Task T5-010 Acceptance Criteria:**

- [x] **EPD technical specs documented** - Sections 4-8 cover IHE, FHIR, consent, documents, certification
- [x] **Cantonal API differences mapped** - Section 3.4 table shows CARA vs Swisscom vs others
- [x] **IHE profile requirements understood** - Section 4 covers all profiles, transactions ITI-18/41/43
- [x] **Certification path identified** - Section 8 covers SIAS certification process and Projectathon
- [x] **Data mapping document created** - Section 9 maps MetaPharm data to EPD documents

**Deliverable Complete:** Comprehensive research document created at `docs/research/swiss-epd-research.md`

---

## Document Information

**Version History:**
- v1.0 (2025-12-02) - Initial research document, Phase 1 complete

**Next Document:**
- T5-011: EPD Integration Architecture & Design Specification

**Prepared for:**
- MetaPharm Connect Development Team
- Technology Planning & Architecture
- Swiss EPD Integration Initiative (Phase 1 of 8)

