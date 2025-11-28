# Medical Records Service

Healthcare data management service with Swiss e-santé API integration and role-based access control.

## Features

- **Medical Records Management**: CRUD operations for patient medical records
- **Swiss e-santé Integration**: Sync records from Swiss cantonal health systems (STUB)
- **HIN e-ID Authentication**: Healthcare professional authentication via HIN provider (STUB)
- **Role-Based Access Control**: Different permissions for patients, pharmacists, doctors, nurses
- **GDPR Compliance**: Access logging for all medical record operations
- **Consent Management**: Patient consent tracking for data sharing

## Record Types

- `diagnosis` - Medical diagnoses
- `allergy` - Allergies and adverse reactions
- `medication` - Current and historical medications
- `procedure` - Medical procedures
- `lab_result` - Laboratory test results
- `immunization` - Vaccination records
- `condition` - Chronic conditions

## Role Permissions

| Role        | View Records | Create Records | Allowed Record Types |
|-------------|--------------|----------------|---------------------|
| Patient     | Own only     | Own only       | All types           |
| Pharmacist  | With consent | Yes            | Allergy, Medication, Condition |
| Nurse       | With consent | Yes            | Allergy, Medication |
| Doctor      | With consent | Yes            | All types           |
| Admin       | All          | Yes            | All types           |

## API Endpoints

### Medical Records

```
GET    /medical-records/patient/:patientId
GET    /medical-records/patient/:patientId/type/:recordType
POST   /medical-records
PATCH  /medical-records/:id
POST   /medical-records/sync-esante
GET    /medical-records/:id/access-logs
```

### Health Check

```
GET    /health
```

## Authentication

All endpoints require authentication via headers:

```
X-User-Id: user-id
X-User-Role: patient|pharmacist|doctor|nurse|admin
X-Hin-Token: hin-token (required for healthcare professionals)
```

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Build
npm run build

# Start
npm start

# Development mode
npm run dev

# Run tests
npm test
```

## Environment Variables

```
MEDICAL_RECORDS_SERVICE_PORT=4010
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=medical_records_service
ESANTE_API_URL=https://api.e-sante.ch
ESANTE_API_KEY=your_key
HIN_CLIENT_ID=your_hin_client_id
HIN_CLIENT_SECRET=your_hin_client_secret
```

## STUB Mode

This service includes STUB implementations for:

1. **HIN e-ID Authentication** (`src/integrations/HinAuthProvider.ts`)
   - Always returns successful authentication
   - Does not validate real HIN credentials
   - Production requires OAuth2 integration with HIN

2. **Swiss e-santé API** (`src/integrations/ESanteApiClient.ts`)
   - Returns sample medical records
   - Does not connect to real cantonal health systems
   - Production requires HL7 FHIR implementation

## Data Models

### MedicalRecord

```typescript
{
  id: string;
  patientId: string;
  recordType: 'diagnosis' | 'allergy' | 'medication' | ...;
  title: string;
  description?: string;
  data?: Record<string, any>;
  source: 'manual' | 'e-sante' | 'import' | 'prescription';
  sourceId?: string;
  recordedBy?: string;
  recordedAt?: Date;
  active: boolean;
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### AccessLog (GDPR Compliance)

```typescript
{
  id: string;
  recordId: string;
  patientId: string;
  userId: string;
  userRole: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export';
  ipAddress?: string;
  accessedAt: Date;
}
```

## Example Usage

### Create Medical Record

```bash
curl -X POST http://localhost:4010/medical-records \
  -H "Content-Type: application/json" \
  -H "X-User-Id: pharmacist-123" \
  -H "X-User-Role: pharmacist" \
  -d '{
    "patientId": "patient-456",
    "recordType": "allergy",
    "title": "Penicillin Allergy",
    "description": "Severe allergic reaction",
    "data": {
      "allergen": "Penicillin",
      "severity": "severe"
    },
    "consentGiven": true
  }'
```

### Get Patient Records

```bash
curl http://localhost:4010/medical-records/patient/patient-456 \
  -H "X-User-Id: pharmacist-123" \
  -H "X-User-Role: pharmacist" \
  -H "X-Hin-Token: stub_hin_token_123"
```

### Sync from e-santé

```bash
curl -X POST http://localhost:4010/medical-records/sync-esante \
  -H "Content-Type: application/json" \
  -H "X-User-Id: pharmacist-123" \
  -H "X-User-Role: pharmacist" \
  -H "X-Hin-Token: stub_hin_token_123" \
  -d '{
    "patientId": "patient-456"
  }'
```

## Security

- All medical record access is logged for GDPR compliance
- Healthcare professionals require HIN e-ID authentication
- Role-based access control filters record types
- Patient consent required for healthcare professional access
- All communications should use HTTPS in production

## Testing

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
```

## License

UNLICENSED - MetaPharm Connect
