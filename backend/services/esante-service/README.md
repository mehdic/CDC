# e-Santé Integration Service

Swiss healthcare system integration service for Electronic Patient Dossier (EPD), HIN healthcare provider authentication, and XDS.b document sharing standards.

## Overview

The e-Santé service provides a unified API for integrating with Switzerland's cantonal healthcare systems (EPD). It handles:

- **HIN Authentication**: Healthcare professional authentication via HIN (Health Info Net)
- **EPD Integration**: Electronic Patient Dossier document access and management
- **Multi-Cantonal Support**: Different implementation adapters for each canton
- **Consent Management**: Patient consent tracking and validation
- **XDS.b Compliance**: Document metadata following Swiss healthcare standards

## Features

- **HIN-Based Authentication**: Secure healthcare provider authentication with JWT tokens
- **Multi-Canton Support**:
  - Vaud (VD) - CARA Platform
  - Geneva (GE) - MonDossierMedical
  - Zurich (ZH) - EPD System
- **Document Management**: Upload, retrieve, and list medical documents
- **Patient Consent**: Manage and validate patient consent for document access
- **Document Caching**: In-memory cache for frequently accessed documents
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Service health checks and statistics

## Architecture

### Services

1. **HINAuthService** - Manages healthcare provider authentication
   - HIN credential validation
   - JWT token generation and verification
   - Credential caching

2. **EPDService** - Manages EPD document operations
   - Multi-adapter pattern for canton-specific implementations
   - Document listing with filtering
   - Document upload and retrieval
   - Intelligent caching

3. **ConsentService** - Manages patient consent
   - Consent request/grant/revoke workflow
   - Consent validation for document access
   - Consent expiration handling

### Adapters

Each canton has its own adapter implementing the `ICantonalAdapter` interface:

- **VaudAdapter** - CARA platform integration (Vaud - VD)
- **GenevaAdapter** - MonDossierMedical integration (Geneva - GE)
- **ZurichAdapter** - EPD system integration (Zurich - ZH)

## Installation

```bash
cd backend/services/esante-service

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your configuration values:
```env
PORT=3010
JWT_SECRET=your-secret-key-min-32-chars

# HIN Configuration
HIN_CLIENT_ID=your-client-id
HIN_CLIENT_SECRET=your-client-secret

# Canton-specific configurations
VAUD_CARA_API_URL=https://cara.vaud.ch/api
GENEVA_MDM_API_URL=https://mondossiermédical.ge.ch/api
ZURICH_EPD_API_URL=https://epd.zh.ch/api
```

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

The service will start on the configured PORT (default: 3010).

## API Endpoints

### Authentication

#### HIN Authentication
```
POST /api/esante/hin/authenticate
Content-Type: application/json

{
  "hinId": "HIN12345",
  "password": "password123",
  "canton": "VD"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "credential": {
    "hinId": "HIN12345",
    "email": "healthcare@hin.example.com",
    "role": "pharmacist",
    "canton": "VD",
    "organizationName": "Example Clinic"
  }
}
```

### EPD Documents

All document endpoints require `Authorization: Bearer <token>` header.

#### List Documents
```
GET /api/esante/epd/:patientId/documents?canton=VD&documentType=prescription&from=2024-01-01&to=2024-12-31
```

#### Get Document
```
GET /api/esante/epd/documents/:documentId?canton=VD
```

#### Upload Document
```
POST /api/esante/epd/documents
Content-Type: application/json

{
  "patientId": "patient123",
  "canton": "VD",
  "title": "Prescription",
  "description": "Patient prescription",
  "documentType": "prescription",
  "formatCode": "urn:ihe:lab:xd-lab:2008",
  "contentType": "application/pdf",
  "data": "base64-encoded-content",
  "createdByOrganization": "Pharmacy Name"
}
```

### Consent Management

#### Get Consent
```
GET /api/esante/consent/:patientId?pharmacyId=pharmacy123&canton=VD
```

#### Grant Consent
```
PUT /api/esante/consent/:patientId
Content-Type: application/json

{
  "pharmacyId": "pharmacy123",
  "canton": "VD",
  "action": "grant",
  "documentTypes": ["prescription", "medication_list"],
  "expiresIn": 31536000
}
```

#### Revoke Consent
```
PUT /api/esante/consent/:patientId
Content-Type: application/json

{
  "pharmacyId": "pharmacy123",
  "canton": "VD",
  "action": "revoke"
}
```

#### Validate Consent
```
GET /api/esante/consent/:patientId/validate?pharmacyId=pharmacy123&documentType=prescription&canton=VD
```

### Admin

#### Health Check
```
GET /api/esante/health
```

#### Service Statistics
```
GET /api/esante/stats
```

## Document Types

Supported EPD document types:
- `prescription` - Medical prescriptions
- `medical_report` - Clinical reports
- `lab_result` - Laboratory test results
- `imaging_report` - Imaging study reports
- `medication_list` - Current medications
- `allergy_list` - Patient allergies
- `condition_list` - Patient conditions/diagnoses
- `vaccine_record` - Vaccination records
- `discharge_letter` - Hospital discharge letters
- `consultation_note` - Doctor consultation notes
- `other` - Other document types

## Consent Status

Consent can have the following statuses:
- `not_requested` - No consent requested yet
- `requested` - Consent request pending patient response
- `granted` - Patient has granted consent
- `denied` - Patient has denied consent
- `revoked` - Previously granted consent has been revoked
- `expired` - Consent period has expired

## Testing

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Test Features

The test suite covers:
- HIN authentication (success/failure scenarios)
- Token verification
- EPD document operations (list, retrieve, upload)
- Consent workflows (grant, revoke, validate)
- Cantonal adapters (Vaud, Geneva, Zurich)
- Document filtering and caching
- Consent expiration and cleanup

## Swiss Healthcare Standards

This service implements Swiss healthcare standards:

- **EPD**: Federal Electronic Patient Dossier standard
- **HIN**: Healthcare Info Net provider authentication
- **XDS.b**: Document sharing framework (IHE profile)
- **HL7 FHIR**: Healthcare data exchange format
- **GDPR/HIPAA**: Data protection compliance

## Cantonal System Details

### Vaud (VD) - CARA Platform
- Platform: CARA (Centre d'Accueil et de Répartition des Appels)
- API: REST-based XDS.b repository
- Authentication: Client certificate with HIN
- Document Format: PDF/CDA XML

### Geneva (GE) - MonDossierMedical
- Platform: MonDossierMedical
- API: OAuth2 with HIN certificate
- Authentication: OAuth2 flow
- Document Format: CDA XML primarily

### Zurich (ZH) - EPD System
- Platform: Zurich EPD (Multiple providers: EHRsys, etc.)
- API: RESTful API
- Authentication: Direct API authentication with HIN
- Document Format: PDF/CDA XML

## Error Handling

The service returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

All error responses follow the format:
```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "statusCode": 500
}
```

## Logging

The service logs important events:
- Service startup and configuration
- Authentication attempts
- Document operations
- Consent changes
- Cache operations
- Errors and warnings

## Performance

- **Caching**: Documents cached for 5 minutes
- **Token Expiry**: HIN credentials cached with automatic expiration
- **Cleanup**: Hourly cleanup of expired credentials and consents
- **Concurrency**: Supports concurrent requests via Express

## Security

- JWT token-based authentication
- HTTPS support (in production)
- Role-based access control (RBAC) via HIN roles
- Consent-based document access
- Encrypted sensitive data
- Audit logging of all access

## Development

### Project Structure
```
src/
├── controllers/      # HTTP request handlers
├── services/        # Business logic
├── adapters/        # Canton-specific implementations
├── routes/          # API route definitions
├── types/           # TypeScript type definitions
├── __tests__/       # Unit tests
└── index.ts        # Application entry point
```

### Adding a New Canton

1. Create adapter in `src/adapters/[canton].adapter.ts`
2. Extend `BaseCantonalAdapter`
3. Implement required methods
4. Register adapter in `src/index.ts`
5. Add environment configuration
6. Add unit tests

## Troubleshooting

### Token Verification Failed
- Ensure `JWT_SECRET` matches the value used to generate tokens
- Check token hasn't expired (expiresIn: 3600 seconds)

### Document Upload Failed
- Verify document size doesn't exceed 50MB limit
- Check document format is supported
- Ensure valid formatCode for document type

### Consent Not Found
- Verify pharmacyId and patientId are correct
- Check canton parameter matches where consent was granted
- Patient may not have granted consent yet

## License

MIT

## Support

For issues or questions about the e-Santé integration service, please contact the MetaPharm Connect development team.
