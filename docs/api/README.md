# API Documentation

Complete REST API reference for MetaPharm Connect backend.

## Quick Start

**Base URL**: `https://api.metapharm.com/v1`

**Authentication**: All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

**Content-Type**: All requests/responses are JSON:
```
Content-Type: application/json
```

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Prescriptions](#prescriptions)
4. [Messaging](#messaging)
5. [Deliveries](#deliveries)
6. [Pharmacy & Inventory](#pharmacy--inventory)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Try-It-Out](#try-it-out)

---

## Authentication

### Login

**POST** `/auth/login`

Login with email and password to receive JWT tokens.

**Request**:
```json
{
  "email": "pharmacist@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "pharmacist@example.com",
      "role": "PHARMACIST",
      "name": "John Doe"
    },
    "expiresIn": 900
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "success": false,
  "errors": [
    {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password"
    }
  ]
}
```

### Refresh Token

**POST** `/auth/refresh`

Get a new access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### Logout

**POST** `/auth/logout`

Invalidate the current session.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Users

### Get Current User

**GET** `/users/me`

Get information about the authenticated user.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "pharmacist@example.com",
    "role": "PHARMACIST",
    "name": "John Doe",
    "phone": "+41791234567",
    "avatar": "https://cdn.example.com/avatar-123.jpg",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-11-25T08:45:00Z"
  }
}
```

### Update Profile

**PUT** `/users/:id`

Update user profile information.

**Request**:
```json
{
  "name": "Jane Doe",
  "phone": "+41791234567",
  "preferences": {
    "language": "fr",
    "notifications": true
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "Jane Doe",
    "phone": "+41791234567",
    "preferences": {
      "language": "fr",
      "notifications": true
    },
    "updatedAt": "2025-11-25T10:15:00Z"
  }
}
```

### List Users (Admin Only)

**GET** `/users?role=PHARMACIST&limit=20&offset=0`

List all users with optional filtering.

**Query Parameters**:
- `role`: Filter by role (PHARMACIST, DOCTOR, NURSE, DELIVERY, PATIENT)
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `search`: Search by name or email

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "pharmacist@example.com",
      "role": "PHARMACIST",
      "name": "John Doe"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

## Prescriptions

### Create Prescription

**POST** `/prescriptions`

Create a new prescription (Doctors only).

**Request**:
```json
{
  "patientId": "patient-456",
  "drugIds": ["drug-001", "drug-002"],
  "dosage": {
    "strength": "500mg",
    "frequency": "2x daily",
    "duration": "7 days"
  },
  "notes": "After meals, do not mix with alcohol"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "prescription-789",
    "patientId": "patient-456",
    "doctorId": "doctor-123",
    "drugs": [
      {
        "id": "drug-001",
        "name": "Aspirin",
        "strength": "500mg"
      }
    ],
    "dosage": {
      "strength": "500mg",
      "frequency": "2x daily",
      "duration": "7 days"
    },
    "status": "PENDING_VALIDATION",
    "createdAt": "2025-11-25T09:00:00Z"
  }
}
```

### Validate Prescription

**POST** `/prescriptions/:id/validate`

Validate prescription for drug interactions (Pharmacist only).

**Request**:
```json
{
  "validationNotes": "No interactions detected",
  "approved": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "prescription-789",
    "status": "VALIDATED",
    "validatedBy": "pharmacist-123",
    "validationNotes": "No interactions detected",
    "validatedAt": "2025-11-25T09:15:00Z"
  }
}
```

### Get Prescription

**GET** `/prescriptions/:id`

Get prescription details.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "prescription-789",
    "patientId": "patient-456",
    "doctorId": "doctor-123",
    "pharmacistId": "pharmacist-123",
    "drugs": [
      {
        "id": "drug-001",
        "name": "Aspirin",
        "strength": "500mg"
      }
    ],
    "dosage": {
      "strength": "500mg",
      "frequency": "2x daily",
      "duration": "7 days"
    },
    "status": "VALIDATED",
    "createdAt": "2025-11-25T09:00:00Z",
    "validatedAt": "2025-11-25T09:15:00Z"
  }
}
```

### List Prescriptions

**GET** `/prescriptions?status=VALIDATED&limit=20&offset=0`

List prescriptions with filtering.

**Query Parameters**:
- `status`: PENDING_VALIDATION, VALIDATED, DISPENSED, EXPIRED
- `patientId`: Filter by patient
- `doctorId`: Filter by doctor
- `limit`: Results per page
- `offset`: Pagination offset

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "prescription-789",
      "patientId": "patient-456",
      "status": "VALIDATED"
    }
  ],
  "meta": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

## Messaging

### Send Message

**POST** `/messages`

Send a message to another user.

**Request**:
```json
{
  "recipientId": "user-456",
  "content": "Hello, how are you?",
  "type": "TEXT"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "message-001",
    "senderId": "user-123",
    "recipientId": "user-456",
    "content": "Hello, how are you?",
    "type": "TEXT",
    "read": false,
    "createdAt": "2025-11-25T10:00:00Z"
  }
}
```

### Get Messages

**GET** `/messages/:userId?limit=50&offset=0`

Get message history with a user.

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "message-001",
      "senderId": "user-123",
      "recipientId": "user-456",
      "content": "Hello, how are you?",
      "type": "TEXT",
      "read": true,
      "createdAt": "2025-11-25T10:00:00Z"
    }
  ],
  "meta": {
    "total": 127,
    "limit": 50,
    "offset": 0
  }
}
```

### Mark Message as Read

**PUT** `/messages/:id/read`

Mark a message as read.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "message-001",
    "read": true,
    "readAt": "2025-11-25T10:05:00Z"
  }
}
```

---

## Deliveries

### Create Delivery Order

**POST** `/deliveries`

Create a new delivery order (Pharmacist only).

**Request**:
```json
{
  "patientId": "patient-456",
  "prescriptionId": "prescription-789",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Zurich",
    "zipCode": "8000",
    "country": "CH"
  },
  "preferredDate": "2025-11-26T14:00:00Z",
  "notes": "Ring doorbell twice"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "delivery-001",
    "status": "PENDING_ASSIGNMENT",
    "patientId": "patient-456",
    "prescriptionId": "prescription-789",
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "Zurich",
      "zipCode": "8000",
      "country": "CH"
    },
    "preferredDate": "2025-11-26T14:00:00Z",
    "createdAt": "2025-11-25T10:30:00Z"
  }
}
```

### Assign Delivery Personnel

**PUT** `/deliveries/:id/assign`

Assign delivery to personnel.

**Request**:
```json
{
  "deliveryPersonnelId": "delivery-123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "delivery-001",
    "status": "ASSIGNED",
    "deliveryPersonnelId": "delivery-123",
    "assignedAt": "2025-11-25T10:35:00Z"
  }
}
```

### Update Delivery Status

**PUT** `/deliveries/:id/status`

Update delivery status with location (Delivery personnel only).

**Request**:
```json
{
  "status": "IN_TRANSIT",
  "location": {
    "latitude": 47.3669,
    "longitude": 8.5500
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "delivery-001",
    "status": "IN_TRANSIT",
    "location": {
      "latitude": 47.3669,
      "longitude": 8.5500
    },
    "updatedAt": "2025-11-25T10:45:00Z"
  }
}
```

### Get Delivery Tracking

**GET** `/deliveries/:id/tracking`

Get real-time delivery tracking.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "delivery-001",
    "status": "IN_TRANSIT",
    "currentLocation": {
      "latitude": 47.3669,
      "longitude": 8.5500
    },
    "estimatedArrival": "2025-11-26T14:30:00Z",
    "route": [
      {
        "timestamp": "2025-11-26T13:00:00Z",
        "latitude": 47.3700,
        "longitude": 8.5400
      }
    ]
  }
}
```

---

## Pharmacy & Inventory

### Get Pharmacy Info

**GET** `/pharmacies/:id`

Get pharmacy information and details.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "pharmacy-001",
    "name": "Pharmacy Zurich Central",
    "address": {
      "street": "Bahnhofstrasse 1",
      "city": "Zurich",
      "zipCode": "8000",
      "country": "CH"
    },
    "phone": "+41442000000",
    "email": "info@zurich-pharmacy.ch",
    "hours": {
      "monday": "08:00-19:00",
      "tuesday": "08:00-19:00"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Get Inventory

**GET** `/pharmacies/:id/inventory?limit=100`

Get pharmacy drug inventory.

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "inv-001",
      "drugId": "drug-001",
      "drugName": "Aspirin",
      "strength": "500mg",
      "quantity": 150,
      "minStock": 50,
      "expiryDate": "2026-12-31",
      "lastRestocked": "2025-11-20T10:00:00Z"
    }
  ],
  "meta": {
    "total": 250,
    "limit": 100,
    "offset": 0
  }
}
```

### Update Stock

**PUT** `/pharmacies/:id/inventory/:drugId`

Update drug stock quantity.

**Request**:
```json
{
  "quantity": 200,
  "reason": "RESTOCK",
  "batchNumber": "BATCH-2025-001"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "inv-001",
    "quantity": 200,
    "updatedAt": "2025-11-25T11:00:00Z"
  }
}
```

---

## Error Handling

### Standard Error Response

**Format**:
```json
{
  "success": false,
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "field": "fieldName",
      "status": 400
    }
  ]
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_REQUEST | 400 | Malformed request |
| VALIDATION_ERROR | 422 | Validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

All API requests are rate-limited:

- **Authenticated users**: 1000 requests per hour
- **Public endpoints**: 100 requests per hour
- **Rate limit headers**:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1700899200
  ```

---

## Try-It-Out

### Using cURL

```bash
# Login
curl -X POST https://api.metapharm.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pharmacist@example.com",
    "password": "securePassword123"
  }'

# Get current user (use token from login)
curl -X GET https://api.metapharm.com/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create prescription
curl -X POST https://api.metapharm.com/v1/prescriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-456",
    "drugIds": ["drug-001"],
    "dosage": {
      "strength": "500mg",
      "frequency": "2x daily",
      "duration": "7 days"
    }
  }'
```

### Using Postman

1. Import collection: `docs/api/postman-collection.json`
2. Set variable `BASE_URL` = `https://api.metapharm.com/v1`
3. Run Login request to get token
4. Token auto-populates in `{{ACCESS_TOKEN}}` variable
5. Execute any endpoint

### Interactive API Testing

See `docs/api/openapi.yaml` for Swagger UI integration.

---

**For complete OpenAPI specification**, see [openapi.yaml](./openapi.yaml)

**Need help?** Check [Troubleshooting Guide](../troubleshooting/README.md)
