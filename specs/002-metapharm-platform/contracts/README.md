# API Contracts

**Purpose**: OpenAPI 3.0 specifications for all MetaPharm Connect microservices

## Contract Generation Status

⏳ **To Be Generated**: API contracts will be created during implementation phase using OpenAPI 3.0 specification format.

## Directory Structure

```
contracts/
├── auth/                    # Authentication & Authorization APIs
│   ├── login.yaml          # POST /auth/login (email/password, HIN e-ID)
│   ├── mfa.yaml            # POST /auth/mfa/verify
│   └── sessions.yaml       # GET /auth/sessions, DELETE /auth/logout
├── prescriptions/          # Prescription Management APIs
│   ├── upload.yaml         # POST /prescriptions (upload image)
│   ├── transcribe.yaml     # POST /prescriptions/{id}/transcribe (AI OCR)
│   ├── validate.yaml       # POST /prescriptions/{id}/validate (drug checks)
│   ├── approve.yaml        # PUT /prescriptions/{id}/approve
│   └── list.yaml           # GET /prescriptions (with filters)
├── teleconsultation/       # Video Consultation APIs
│   ├── availability.yaml   # GET /teleconsultations/availability
│   ├── book.yaml           # POST /teleconsultations
│   ├── join.yaml           # GET /teleconsultations/{id}/join (Twilio token)
│   └── notes.yaml          # POST /teleconsultations/{id}/notes
├── inventory/              # Inventory Management APIs
│   ├── scan.yaml           # POST /inventory/scan (QR code)
│   ├── stock.yaml          # GET /inventory/items, PUT /inventory/items/{id}
│   └── alerts.yaml         # GET /inventory/alerts
└── README.md               # This file
```

## API Contract Standards

### OpenAPI 3.0 Template

```yaml
openapi: 3.0.3
info:
  title: MetaPharm Connect - [Service Name]
  version: 1.0.0
  description: |
    [Service description]

servers:
  - url: https://api.metapharm.ch/v1
    description: Production
  - url: https://api-staging.metapharm.ch/v1
    description: Staging

security:
  - BearerAuth: []

paths:
  /resource:
    get:
      summary: [Operation summary]
      operationId: [unique operation ID]
      tags: [Service]
      parameters: []
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ResourceResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  responses:
    Unauthorized:
      description: Unauthorized - invalid or missing JWT token
    Forbidden:
      description: Forbidden - insufficient permissions

  schemas:
    ResourceResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        created_at:
          type: string
          format: date-time
```

### Common Response Schemas

All APIs use standardized error responses:

```json
{
  "error": {
    "code": "PRESCRIPTION_NOT_FOUND",
    "message": "Prescription with ID abc-123 not found",
    "details": {}
  }
}
```

### Authentication

- **JWT Bearer Token**: All API requests require `Authorization: Bearer <jwt_token>` header
- **Token Claims**: `user_id`, `role`, `pharmacy_id`, `exp` (expiration)
- **Token Lifetime**: 1 hour (access token), 30 days (refresh token)

### Rate Limiting

- **Pharmacist/Doctor/Nurse**: 1000 requests/minute
- **Patient**: 100 requests/minute
- **Delivery Personnel**: 500 requests/minute (higher for GPS updates)

### Pagination

All list endpoints support pagination:
- Query params: `?page=1&per_page=20` (default: page=1, per_page=20, max=100)
- Response includes: `{ data: [], meta: { page, per_page, total, total_pages } }`

### Filtering & Sorting

- Filtering: `?status=pending&patient_id=uuid`
- Sorting: `?sort_by=created_at&sort_order=desc`

---

## Implementation Timeline

| Phase | Services | Timeline |
|-------|----------|----------|
| **MVP (P1-P3)** | Auth, Prescriptions, Teleconsultation, Inventory | Months 1-6 |
| **Phase 2 (P4-P6)** | Delivery, E-Commerce, Messaging | Months 7-10 |
| **Phase 3 (P7-P9)** | Records, Doctor Integration, Nurse Integration | Months 11-14 |
| **Phase 4 (P10-P11)** | Analytics, VIP Program | Months 15-18 |

---

## References

- OpenAPI 3.0 Specification: https://swagger.io/specification/
- API Design Best Practices: https://github.com/microsoft/api-guidelines
- FHIR API Standards (for e-santé integration): https://www.hl7.org/fhir/http.html
