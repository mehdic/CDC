# Medication Recycling Service

**Task ID:** T5-052
**Feature:** Medication Return/Recycling Workflow
**Status:** Complete

## Overview

The Recycling Service manages the medication return and recycling workflow in MetaPharm Connect. It enables:

- Patients to request medication pickup for recycling
- Drivers to collect expired/unused medications during delivery
- Pharmacies to track returned medications in inventory
- Generation of recycling and compliance reports

## Service Architecture

### Models & Types

**Files:**
- `src/types/recycling.ts` - TypeScript interfaces and types
- `src/models/RecyclingRequest.ts` - RecyclingRequestModel class with business logic

**Key Entities:**
- `RecyclingRequest` - Main request entity with status tracking
- `Medication` - Medication details (name, quantity, expiry date)
- `RecyclingReport` - Compliance and environmental impact reports

### Services

**Recycling Service** (`src/services/recycling.service.ts`)
- Create recycling requests
- Assign drivers to requests
- Record medication collection
- Process collected medications
- Cancel requests
- Manage full workflow state transitions

**Recycling Report Service** (`src/services/recycling-report.service.ts`)
- Generate monthly recycling reports
- Generate annual summaries
- Compliance reporting with completion rates
- Environmental impact calculations
- Network-wide aggregated reports

### Data Access

**Repository** (`src/repositories/RecyclingRepository.ts`)
- In-memory data storage (for current implementation)
- CRUD operations for requests and reports
- Query methods for filtering by patient/pharmacy/driver/status
- Monthly and annual report generation

### API Endpoints

**Controller** (`src/controllers/recycling.controller.ts`)

#### Request Management
- `POST /api/recycling/request` - Create new recycling request
- `GET /api/recycling/:id` - Get request details
- `GET /api/recycling/patient/:patientId` - Get patient's requests
- `GET /api/recycling/pharmacy/:pharmacyId` - Get pharmacy's requests
- `GET /api/recycling/driver/:driverId/pending` - Get driver's pending pickups

#### Workflow Operations
- `PATCH /api/recycling/:id/assign-driver` - Assign driver to request
- `PATCH /api/recycling/:id/collect` - Record collection
- `PATCH /api/recycling/:id/process` - Process collection
- `PATCH /api/recycling/:id/cancel` - Cancel request

#### Reporting
- `GET /api/recycling/report/pharmacy/:pharmacyId` - Get pharmacy reports (optional month/year filters)

## Request Lifecycle

### States

1. **pending** - Initial state after patient creation
2. **assigned** - Driver has been assigned
3. **collected** - Driver has collected medications
4. **processed** - Pharmacy has processed the collection
5. **cancelled** - Request was cancelled before processing

### Workflow

```
Patient creates request
         ↓
    [pending]
         ↓
Pharmacy assigns driver
         ↓
    [assigned]
         ↓
Driver confirms collection
         ↓
    [collected]
         ↓
Pharmacy processes/tracks inventory
         ↓
    [processed] ✓ Complete

Alternative: Cancel at any point before collection
```

## Data Model

### RecyclingRequest

```typescript
{
  id: string;                              // UUID
  patientId: string;                       // Patient identifier
  pharmacyId: string;                      // Associated pharmacy
  medications: Medication[];                // List of medications to recycle
  status: 'pending' | 'assigned' | 'collected' | 'processed' | 'cancelled';
  driverId?: string;                       // Assigned delivery driver
  requestedAt: string;                     // ISO timestamp
  collectedAt?: string;                    // Collection completion
  processedAt?: string;                    // Processing completion
  notes?: string;                          // Special instructions
  createdAt: string;                       // Creation timestamp
  updatedAt: string;                       // Last update timestamp
}
```

### Medication

```typescript
{
  id?: string;
  name: string;                            // Drug name
  quantity: number;                        // Units to return
  unit: string;                            // Unit type (tablets, ml, etc)
  expiryDate: string;                      // Expiry date (YYYY-MM-DD)
  batchNumber?: string;                    // Batch/lot number
  storageConditions?: string;              // Storage notes (e.g., "refrigerated")
}
```

### RecyclingReport

```typescript
{
  id: string;
  pharmacyId: string;
  month: string;                           // MM format
  year: number;
  totalRequests: number;
  totalMedicationsCollected: number;
  totalQuantityCollected: number;
  environmentalImpact: {
    wastePreventedKg: number;             // Estimated kg of waste prevented
    carbonFootprintReduction: number;      // CO2e reduction in kg
  };
  createdAt: string;
}
```

## Environmental Impact Calculations

The service calculates environmental impact based on:

- **Waste Prevention:** 1 medication unit = 0.005 kg waste prevented
- **Carbon Reduction:** 1 kg waste = 0.5 kg CO2 equivalent reduction
- **Equivalents:**
  - 1 tree absorbs ~20 kg CO2/year
  - 1 car produces ~0.21 kg CO2/mile
  - Plastic bottle equivalent based on waste impact

## Testing

**Test Suite:** `tests/recycling.test.ts`

**Test Coverage:**
- 27 unit tests
- 100% pass rate
- Covers:
  - Request creation and validation
  - Workflow state transitions
  - Business logic constraints
  - Report generation
  - Edge cases

**Running Tests:**
```bash
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm run test:coverage     # Coverage report
```

## Dependencies

```json
{
  "express": "^4.18.3",
  "uuid": "^9.0.1"
}
```

## Building

```bash
npm install               # Install dependencies
npm run build            # Compile TypeScript
npm start                # Run compiled version
npm run dev              # Development with auto-reload
```

## Integration Points

The service is designed to integrate with:

1. **Inventory Service** - Updates inventory with returned medications
2. **Delivery Service** - Coordinates with drivers
3. **Notification Service** - Alerts patients, drivers, pharmacists
4. **Analytics Service** - Reports recycling metrics

## Example Usage

### Create a Recycling Request

```typescript
const result = recyclingService.createRecyclingRequest({
  patientId: 'patient-123',
  pharmacyId: 'pharmacy-abc',
  medications: [
    {
      name: 'Aspirin',
      quantity: 20,
      unit: 'tablets',
      expiryDate: '2023-12-31',
      batchNumber: 'LOT123'
    }
  ],
  notes: 'Store in cool place during collection'
});

if (result.success) {
  console.log('Request created:', result.data?.id);
}
```

### Complete Recycling Workflow

```typescript
// 1. Create request
const created = recyclingService.createRecyclingRequest({...});
const requestId = created.data!.id;

// 2. Assign driver
recyclingService.assignDriverToRequest(requestId, 'driver-456');

// 3. Record collection
recyclingService.recordCollection(requestId, 'driver-456');

// 4. Process collection
recyclingService.processCollection(requestId);

// 5. Generate report
const report = recyclingReportService.generateMonthlyReport(
  'pharmacy-abc',
  '12',  // month
  2024   // year
);
```

### Get Reporting Data

```typescript
// Monthly report
const monthly = recyclingReportService.generateMonthlyReport(
  'pharmacy-abc',
  '12',
  2024
);

// Annual summary
const annual = recyclingReportService.generateAnnualReport(
  'pharmacy-abc',
  2024
);

// Compliance report
const compliance = recyclingReportService.generateComplianceReport(
  'pharmacy-abc',
  '2024-01-01',
  '2024-12-31'
);

// Environmental impact
const impact = recyclingReportService.generateEnvironmentalImpactSummary(
  'pharmacy-abc',
  2024
);
```

## Future Enhancements

1. **Database Integration** - Replace in-memory storage with PostgreSQL
2. **Audit Logging** - Track all operations for compliance
3. **Scheduled Reports** - Automatic monthly report generation
4. **API Contracts** - OpenAPI specification
5. **Integration Tests** - E2E tests with other services
6. **Metrics Export** - Prometheus metrics for monitoring
7. **Email Notifications** - Patient and pharmacy notifications
8. **QR Code Tracking** - QR code generation for collection batches

## Files Summary

| File | Purpose | Lines |
|------|---------|-------|
| `src/types/recycling.ts` | Interfaces and type converters | 115 |
| `src/models/RecyclingRequest.ts` | Business logic model | 125 |
| `src/repositories/RecyclingRepository.ts` | Data access layer | 227 |
| `src/services/recycling.service.ts` | Core business logic | 238 |
| `src/services/recycling-report.service.ts` | Reporting logic | 304 |
| `src/controllers/recycling.controller.ts` | HTTP handlers | 305 |
| `src/index.ts` | Service entry point | 24 |
| `tests/recycling.test.ts` | Unit tests | 507 |

**Total Implementation:** ~1,845 lines of code + tests

## Version History

- **v0.1.0** - Initial release with complete CRUD and reporting functionality
