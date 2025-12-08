# Complete E2E Journey Tests - MetaPharm Connect

## Overview

This document describes the comprehensive end-to-end journey tests that validate critical user workflows across the MetaPharm Connect platform.

## Complete Journey Tests

### 1. Complete Teleconsultation Journey
**File:** `journey-teleconsultation-complete.spec.ts`

**Scenarios:**
1. Patient books teleconsultation with available slots
2. Pharmacist receives notification and accepts consultation
3. Complete journey from booking to follow-up

**Validates:** Booking flow, notifications, video call infrastructure, prescription workflow integration

---

### 2. VIP Membership (Golden MetaPharm) Journey
**File:** `journey-vip-membership.spec.ts`

**Scenarios:**
1. Patient views Golden MetaPharm program with subscription tiers
2. Patient subscribes to Gold VIP tier
3. VIP discount and free delivery applied to order

**Validates:** Subscription flow, benefit application, discount calculation

---

### 3. Full Prescription Lifecycle (Existing)
**File:** `cross-role-prescription-workflow.spec.ts`

Complete workflow: Doctor → Pharmacist → Patient

---

### 4. Complete Delivery Workflow (Existing)
**File:** `delivery-driver-workflows.spec.ts`

Driver workflow with GPS tracking, QR scanning, and proof of delivery.

---

## Running the Tests

```bash
cd web

# Run all journey tests
npx playwright test journey-

# Run specific journey
npx playwright test journey-teleconsultation-complete.spec.ts
npx playwright test journey-vip-membership.spec.ts

# Run with UI mode (debugging)
npx playwright test journey-teleconsultation-complete.spec.ts --ui
```

## Test Coverage

| Journey | Status | Tests | Coverage |
|---------|--------|-------|----------|
| Prescription Lifecycle | ✅ Complete | 6 scenarios | Doctor → Pharmacist → Patient |
| Teleconsultation | ✅ Complete | 3 scenarios | Booking → Video call → Follow-up |
| VIP Membership | ✅ Complete | 3 scenarios | Discovery → Subscribe → Benefits |
| Delivery Workflow | ✅ Complete | 15 scenarios | Accept → GPS → QR → Completion |

## CI/CD Integration

Journey tests are included in the CI pipeline (`.github/workflows/playwright.yml`):

```yaml
- name: Run E2E Journey Tests
  run: |
    cd web
    npx playwright test journey- --project=chromium
```

**Test Reports:**
- HTML Report: `web/playwright-report/index.html`
- JSON Results: `web/playwright-report/results.json`
- JUnit XML: `web/playwright-report/junit.xml`

---

**Last Updated:** 2025-12-08
**Version:** 1.0.0
**Status:** ✅ Production Ready
