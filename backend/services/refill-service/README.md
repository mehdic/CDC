# Refill Service

Prescription Refill Management Service for MetaPharm Connect

## Overview

The Refill Service handles the complete lifecycle of prescription refill requests, from patient requests through pharmacist approval and dispensing. It implements business logic for refill eligibility checking, controlled substance handling, and refill notifications.

## Features

- **Patient Refill Requests**: Patients can request refills for their prescriptions
- **Eligibility Checking**: Automatic validation of:
  - Remaining refills available
  - Days between refills (minimum gap)
  - Prescription expiration
  - Controlled substance rules
  - High-risk medication handling

- **Pharmacist Approval Workflow**:
  - Auto-approval for eligible non-controlled substances
  - Manual review queue for controlled substances and high-risk medications
  - Denial with reasons and patient notifications

- **Refill Notifications**: Email, SMS, and push notifications to patients
- **Refill History & Analytics**: Track refill patterns and generate reports
- **Compliance Logging**: Audit trail of all refill actions

## Architecture

### Services

- **RefillService**: Core business logic for refill management
- **EligibilityService**: Prescription refill eligibility checking
- **RefillNotificationService**: Refill reminders and notifications

### Models

- **RefillRequest**: Refill request tracking with status workflow
- **RefillHistory**: Audit trail and analytics data

### API Endpoints

#### Patient Endpoints

```
POST   /api/refills              Create refill request
GET    /api/refills              List patient's refills
GET    /api/refills/:id          Get refill details
GET    /api/refills/:id/history  Get refill history
```

#### Pharmacist Endpoints

```
PUT    /api/refills/:id/approve  Approve refill request
PUT    /api/refills/:id/deny     Deny refill request
PUT    /api/refills/:id/fill     Mark refill as filled
```

#### Admin Endpoints

```
POST   /api/refills/expire-old   Expire old refill requests
```

## Business Rules

### Refill Eligibility

1. **Prescription must be active** (not expired)
2. **Refills must be available** (refillsUsed < refillsAllowed)
3. **Minimum days between refills** must be respected (default: 7 days)
4. **Controlled substances** require manual approval and stricter rules (default: 30 days)

### Auto-Approval

Non-controlled, non-high-risk medications are automatically approved:
- Simple maintenance medications
- Non-controlled common medications
- No allergy conflicts

### Manual Review Required

- **Controlled substances** (opioids, benzodiazepines, etc.)
- **Antibiotics** (Penicillins, Cephalosporins, etc.)
- **High-risk medications** (Warfarin, Methotrexate, Lithium, etc.)
- **Medications with noted allergies**

## Installation

```bash
npm install
```

## Development

### Run in Development Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Watch Tests

```bash
npm run test:watch
```

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=metapharm_refills
PORT=3007
NODE_ENV=development
```

## Database Setup

The service uses TypeORM with PostgreSQL. Entities are automatically synchronized on startup (in development mode).

### Create Database

```sql
CREATE DATABASE metapharm_refills;
```

## API Usage Examples

### Request a Refill

```bash
curl -X POST http://localhost:3007/api/refills \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionId": "rx-123",
    "patientId": "patient-123",
    "pharmacyId": "pharmacy-123",
    "quantityRequested": 1
  }'
```

### Get Patient Refills

```bash
curl http://localhost:3007/api/refills?patientId=patient-123
```

### Approve Refill

```bash
curl -X PUT http://localhost:3007/api/refills/refill-id/approve \
  -H "Content-Type: application/json" \
  -d '{
    "pharmacistId": "pharmacist-123",
    "notes": "Approved after drug interaction check"
  }'
```

### Check Eligibility

```bash
curl http://localhost:3007/api/prescriptions/rx-123/eligibility
```

## Frontend Integration

### Patient Components

- `RefillRequest` - Request form for refills
- `RefillHistory` - View refill history
- `RefillStatus` - Track pending/completed refills
- `useRefills` hook - React hook for refill operations

### Pharmacist Components

- `RefillQueue` - List of pending refills
- `RefillApproval` - Approve/deny interface
- `RefillDetails` - View full refill details

## Testing

The service includes comprehensive unit tests for:

- Eligibility checking logic
- Refill request creation
- Approval/denial workflows
- Notification service
- Controlled substance handling
- Edge cases and error scenarios

**Test Coverage**: 22 tests, all passing

## Production Considerations

1. **Database**: Use production PostgreSQL instance
2. **Authentication**: Integrate with auth service for user context
3. **Notifications**: Connect real email/SMS services
4. **Logging**: Integrate with centralized logging service
5. **Monitoring**: Set up monitoring for refill queue performance
6. **Audit Trail**: Ensure all actions logged for compliance
7. **Rate Limiting**: Add rate limiting on refill endpoints
8. **HIPAA Compliance**: Ensure encrypted storage and transmission

## Task References

- T2-101: RefillRequest entity creation
- T2-102: Eligibility validation service
- T2-103: Refill request creation logic
- T2-104: Pharmacist approval/denial workflow
- T2-105: Refill dispensing workflow
- T2-106: Refill notifications
- T2-107: API controllers
- T2-108: Patient frontend components
- T2-109: Frontend history/analytics

## Authors

MetaPharm Connect Development Team

## License

UNLICENSED - MetaPharm Connect Proprietary
