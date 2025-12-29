# Tasks9.md - Docker Services Status

## Status Summary

**Date:** 2025-12-25 (Updated)

### Healthy Services (22 services)
- api-gateway
- auth-service
- user-service
- pharmacy-service
- prescription-service
- teleconsultation-service
- inventory-service
- order-service
- messaging-service
- notification-service
- ecommerce-service
- esante-service
- patient-service
- appointment-service
- doctor-service
- marketing-service
- medical-records-service
- refill-service
- vip-service
- voice-service
- postgres, redis, jaeger (infrastructure)

### Unhealthy (Running but Health Check Failing - Port Mismatches) (7 services)
- analytics-service (service runs on port 4010, health check on 4000)
- controlled-substance-service (service runs on port 3008, health check on 4000)
- dashboard-v2 (frontend health check issue)
- delivery-service (service runs on port 4005, health check on 4000)
- insurance-service (health check still failing)
- nurse-service (health check still failing)
- payment-service (health check still failing)

### Restarting (Code Issues) (3 services)
- calendar-service (needs investigation)
- digital-twin-service (AWS/KMS config issue)
- recycling-service (no server implementation - just exports modules)

---

## Fixed Issues This Session

### 1. TypeORM Entity Relationship Issues

**Pattern Identified:** When a service uses the `User` entity, it needs ALL related entities:
- `Cart` and `CartItem` (User#carts)
- `Pharmacy` (User#primary_pharmacy)
- `AuditTrailEntry` (User#audit_trail_entries)
- `VipMembership` and `PointsTransaction` (User#vip_membership)

**Services Fixed:**
- vip-service - Added AuditTrailEntry entity
- nurse-service - Added AuditTrailEntry, VipMembership, PointsTransaction entities
- doctor-service - Added AuditTrailEntry, VipMembership, PointsTransaction entities
- appointment-service - Added Pharmacy, AuditTrailEntry, VipMembership, PointsTransaction entities
- payment-service - Added AuditTrailEntry, Cart, CartItem, VipMembership, PointsTransaction entities

### 2. Database Environment Variables

**Pattern Identified:** Services use different naming conventions:
- `DATABASE_HOST` / `DATABASE_PORT` / etc.
- `DB_HOST` / `DB_PORT` / etc.

**Services Fixed (docker-compose.yml):**
- controlled-substance-service
- analytics-service
- insurance-service
- marketing-service
- medical-records-service
- payment-service
- recycling-service
- refill-service
- voice-service

### 3. TypeORM Type Issues

**NurseOrder Entity:** Changed `datetime` to `timestamp` (PostgreSQL doesn't support `datetime`)
- `approvedAt`
- `deliveredAt`
- `cancelledAt`

### 4. Entity Index Issues

**PatientInsurance Entity:** Fixed index using wrong column name
- Changed `is_active` to `"isActive"` in index where clause

**Transcription Entity:** Fixed index referencing non-existent column
- Changed `language` to `requestedLanguage` in index

---

## Remaining Issues

### T9-001: Port Mismatch Issues

Several services run on different ports than what the health check expects. These services ARE running but show as unhealthy.

**Fix:** Update service code to use PORT env var or update docker-compose health check port:

| Service | Runs On | Health Check | Fix |
|---------|---------|--------------|-----|
| analytics-service | 4010 | 4000 | Use PORT env var |
| controlled-substance-service | 3008 | 4000 | Use PORT env var |
| delivery-service | 4005 | 4000 | Use PORT env var |

### T9-002: Calendar Service - Restarting

**Status:** Restarting (exit code 0)
**Fix:** Needs investigation - check if server implementation exists

### T9-003: Digital Twin Service - Restarting

**Status:** Restarting
**Issue:** AWS/KMS configuration for local development
**Fix:** May need LocalStack or mock AWS credentials

### T9-004: Recycling Service - No Server Implementation

**Status:** Restarting (exit code 0)
**Issue:** index.ts only exports modules, no Express server
**Fix:** Either:
- Add proper server implementation
- Remove from docker-compose.yml (if meant to be a library)

### T9-005: Frontend Services (Dashboard-v2, Web)

**Status:** Unhealthy
**Issue:** Health check endpoint/port mismatch or build errors
**Fix:** Check frontend health endpoints

---

## Quick Reference: Entity Requirements

When adding User entity to a service, include ALL of these:
```typescript
import { User } from '@shared/models/User';
import { Cart } from '@shared/models/Cart';
import { CartItem } from '@shared/models/CartItem';
import { Pharmacy } from '@shared/models/Pharmacy';
import { AuditTrailEntry } from '@shared/models/AuditTrailEntry';
import { VipMembership } from '@shared/models/VipMembership';
import { PointsTransaction } from '@shared/models/PointsTransaction';

entities: [User, Cart, CartItem, Pharmacy, AuditTrailEntry, VipMembership, PointsTransaction, /* other entities */]
```

## Database Environment Variables Template

```yaml
DATABASE_HOST: postgres
DATABASE_PORT: 5432
DATABASE_USER: metapharm
DATABASE_PASSWORD: metapharm_dev_password
DATABASE_NAME: metapharm_db
DB_HOST: postgres
DB_PORT: 5432
DB_USER: metapharm
DB_PASSWORD: metapharm_dev_password
DB_NAME: metapharm_db
```
