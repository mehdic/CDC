# MetaPharm Connect - User Acceptance Testing (UAT) Documentation

**Version:** 1.0
**Last Updated:** 2025-12-25

---

## Overview

This directory contains all documentation and resources for User Acceptance Testing (UAT) of the MetaPharm Connect healthcare platform.

---

## Document Index

| Document | Purpose |
|----------|---------|
| [UAT_TEST_PLAN.md](./UAT_TEST_PLAN.md) | Comprehensive test plan with scope, approach, and schedule |
| [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) | Detailed test checklists for all 5 user roles |
| [UAT_ENVIRONMENT_CONFIG.md](./UAT_ENVIRONMENT_CONFIG.md) | UAT environment setup and configuration |
| [UAT_FEEDBACK_FORM.md](./UAT_FEEDBACK_FORM.md) | Feedback collection forms and procedures |
| [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md) | Standardized bug report template |
| [UAT_SIGNOFF_TEMPLATES.md](./UAT_SIGNOFF_TEMPLATES.md) | Sign-off forms for UAT completion |

---

## User Roles

MetaPharm Connect supports 5 distinct user roles:

| Role | Description | Priority |
|------|-------------|----------|
| **Pharmacist** | Master account management, prescription processing, inventory | Critical |
| **Doctor** | Prescription creation, patient records, secure communication | Critical |
| **Nurse** | Medication ordering, patient history, delivery tracking | High |
| **Delivery** | Route management, proof of delivery, GPS tracking | High |
| **Patient** | Prescription refills, teleconsultation, e-commerce, VIP program | Critical |

---

## Quick Start

### 1. Environment Setup

```bash
# Start local UAT environment
docker-compose -f docker-compose.uat.yml up -d

# Generate test data
npx ts-node scripts/uat/generate-test-data.ts

# Verify environment
curl http://localhost:3000/health
```

### 2. Test Account Credentials

| Role | Email | Password |
|------|-------|----------|
| Pharmacist | pharmacist@uat.metapharm.ch | Uat2025!Pharm |
| Doctor | doctor@uat.metapharm.ch | Uat2025!Doc |
| Nurse | nurse@uat.metapharm.ch | Uat2025!Nurse |
| Delivery | delivery@uat.metapharm.ch | Uat2025!Del |
| Patient | patient@uat.metapharm.ch | Uat2025!Pat |

### 3. Testing Workflow

1. Review [UAT_TEST_PLAN.md](./UAT_TEST_PLAN.md) for scope and approach
2. Use [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) for your assigned role
3. Report bugs using [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
4. Submit feedback via [UAT_FEEDBACK_FORM.md](./UAT_FEEDBACK_FORM.md)
5. Complete sign-off using [UAT_SIGNOFF_TEMPLATES.md](./UAT_SIGNOFF_TEMPLATES.md)

---

## UAT Schedule

| Week | Phase | Activities |
|------|-------|------------|
| Week 1 | Preparation | Environment setup, training, data generation |
| Week 2 | Role Testing | Pharmacist and Doctor testing |
| Week 3 | Role Testing | Nurse, Delivery, and Patient testing |
| Week 4 | Integration | Cross-role workflows, compliance validation |
| Week 5 | Resolution | Bug fixes, regression testing |
| Week 6 | Sign-off | Final testing, stakeholder approval |

---

## Compliance Requirements

UAT must validate compliance with:

- **HIPAA** - Health Insurance Portability and Accountability Act
- **GDPR** - General Data Protection Regulation
- **Swiss Healthcare Regulations** - Cantonal health record integration, HIN e-ID

See `docs/compliance/` for detailed requirements.

---

## Bug Tracking

Bugs discovered during UAT are tracked in GitHub Issues:

- **Template:** `.github/ISSUE_TEMPLATE/uat-bug-report.yml`
- **Labels:** `uat-defect`, `severity-*`, `role-*`
- **Project:** MetaPharm UAT Board

### Bug Workflow

```
New -> Triaged -> In Progress -> Fixed -> Ready for Test -> Verified -> Closed
```

---

## Test Data Generation

Synthetic test data is generated using:

```bash
# Generate all test data
npx ts-node scripts/uat/generate-test-data.ts

# Output files
scripts/uat/data/uat-test-data.json  # JSON format
scripts/uat/data/uat-seed.sql        # SQL format
```

Data includes:
- 5 pharmacies with pharmacists
- 10 doctors with various specialties
- 8 nurses from different facilities
- 6 delivery personnel
- 50 patients with varied profiles
- 100 prescriptions
- 30 appointments
- 40 orders

---

## Support

- **UAT Lead:** uat-lead@metapharm-connect.ch
- **QA Team:** qa-team@metapharm-connect.ch
- **Technical Support:** devops@metapharm-connect.ch

---

## Related Documentation

- `docs/compliance/HIPAA.md` - HIPAA compliance details
- `docs/compliance/GDPR.md` - GDPR compliance details
- `docs/guides/deployment.md` - Deployment procedures
- `docs/user-guides/` - User guides by role

---

*Document maintained by: UAT Team*
