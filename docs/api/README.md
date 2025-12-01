# API Documentation - MetaPharm Connect

Comprehensive API reference for the MetaPharm Connect healthcare platform connecting pharmacists, doctors, nurses, delivery personnel, and patients.

## Quick Links

- **Interactive Documentation**: [Swagger UI](/api-docs)
- **OpenAPI Specification**: [openapi.yaml](./openapi.yaml) or [JSON](/api-docs.json)
- **Comprehensive Guide**: [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)
- **Error Codes**: [ERROR_CODES.md](./ERROR_CODES.md)
- **All Endpoints**: [ENDPOINTS.md](./ENDPOINTS.md)

## Overview

### Base URLs

```
Development:  http://localhost:4000
Production:   https://api.metapharm.ch
Staging:      https://staging.metapharm.ch
```

### Key Features

- **5 User Roles**: PHARMACIST, DOCTOR, NURSE, DELIVERY, PATIENT
- **Authentication**: JWT Bearer tokens, MFA, HIN e-ID OAuth2
- **Security**: End-to-end encryption, audit logging, HIPAA/GDPR compliance
- **Real-time**: WebSocket support for messaging, notifications, delivery tracking
- **Healthcare**: Prescriptions, teleconsultation, e-Santé integration, controlled substances
- **E-commerce**: Shopping cart, orders, insurance integration

## Authentication

All protected endpoints require JWT Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Login Flow

1. **POST /api/auth/login** - Authenticate with email/password
2. **If MFA required**: Verify TOTP code at **POST /api/auth/mfa/verify**
3. **Receive tokens**: Access token (1 hour) + Refresh token (7 days)
4. **Use access token** for all API requests

**Example Login Request**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "pharmacist@metapharm.ch",
  "password": "SecurePassword123!"
}
```

**Example Login Response**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "pharmacist@metapharm.ch",
    "role": "PHARMACIST",
    "firstName": "Jean",
    "lastName": "Dupont",
    "pharmacyId": "pharm-001"
  }
}
```

## API Endpoints by Category

### Health & Status
- `GET /` - API Gateway status
- `GET /health` - Service health check

### Authentication
- `POST /api/auth/login` - User login with email/password
- `POST /api/auth/mfa/verify` - Verify MFA code
- `POST /api/auth/mfa/setup` - Initialize MFA setup
- `POST /api/auth/mfa/enable` - Enable MFA
- `DELETE /api/auth/mfa/disable` - Disable MFA
- `GET /api/auth/sessions` - List active sessions
- `DELETE /api/auth/logout` - Logout user
- `GET /api/auth/hin/authorize` - Initiate HIN e-ID OAuth
- `GET /api/auth/hin/callback` - HIN e-ID callback

### Prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - List prescriptions (role-filtered)
- `GET /api/prescriptions/{id}` - Get prescription details
- `PATCH /api/prescriptions/{id}/status` - Update prescription status

### Inventory
- `GET /api/inventory` - List pharmacy inventory
- `GET /api/inventory/{id}` - Get inventory item
- `PATCH /api/inventory/{id}` - Update stock level

### Orders & Cart
- `GET /api/cart` - Get shopping cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Get order details

### Teleconsultation
- `POST /api/teleconsultations` - Schedule consultation
- `GET /api/teleconsultations` - List consultations
- `GET /api/teleconsultations/{id}` - Get consultation details

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/{id}/read` - Mark as read

## Request Format

### Headers

```
Content-Type: application/json
Authorization: Bearer <jwt-token>           # For protected endpoints
X-Request-ID: <unique-id>                  # Optional, for tracing
```

### Query Parameters

List endpoints support pagination and filtering:

```
GET /api/prescriptions?page=1&limit=20&status=pending&sort=-createdAt
```

Parameters:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `sort` (string) - Sort field, prefix with `-` for descending
- `filter` (varies) - Additional filter parameters

## Response Format

### Success Response (2xx)

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-12-01T18:00:00Z",
    "requestId": "req-123"
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

## Error Handling

### Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_TOKEN | 401 | Token is invalid or expired |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required permissions |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Input validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| SERVICE_UNAVAILABLE | 503 | Service is down |

See [ERROR_CODES.md](./ERROR_CODES.md) for complete error reference.

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General endpoints | 100 requests | 1 minute |
| Login | 5 attempts | 15 minutes |
| Password reset | 3 attempts | 1 hour |

Rate limit info in response headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1701432000
```

## Code Examples

### JavaScript/TypeScript

```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Get prescriptions
const response = await fetch(
  'http://localhost:4000/api/prescriptions',
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# Get prescriptions
response = requests.get(
  'http://localhost:4000/api/prescriptions',
  headers={'Authorization': f'Bearer {token}'}
)

data = response.json()
print(data)
```

### cURL

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get prescriptions
curl -X GET http://localhost:4000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN"

# Create prescription
curl -X POST http://localhost:4000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "medications": [
      {
        "name": "Amoxicilline",
        "dosage": "500mg",
        "quantity": 10,
        "instructions": "One tablet three times daily"
      }
    ]
  }'
```

## Documentation Files

### In This Directory

- **openapi.yaml** - OpenAPI 3.1.0 specification
- **COMPREHENSIVE_GUIDE.md** - Complete API guide with examples
- **ERROR_CODES.md** - All error codes and solutions
- **ENDPOINTS.md** - Detailed endpoint documentation
- **examples/** - Request/response examples by feature

### Generated Documentation

- **Swagger UI** - Interactive API explorer at `/api-docs`
- **OpenAPI JSON** - Machine-readable spec at `/api-docs.json`
- **OpenAPI YAML** - YAML format spec at `/api-docs.yaml`

## Support

- **Email**: api-support@metapharm.ch
- **Status Page**: https://status.metapharm.ch
- **Documentation**: https://metapharm.ch/api-docs
- **Issues**: Report via GitHub Issues

## Versioning

**Current Version**: 1.0.0

API follows semantic versioning. Breaking changes result in new major version with 6-month deprecation notice.

## Getting Started

1. **Read**: Start with [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md)
2. **Explore**: Try endpoints in [Swagger UI](/api-docs)
3. **Code**: Use examples in `examples/` directory
4. **Debug**: Check [ERROR_CODES.md](./ERROR_CODES.md) for issues
5. **Refer**: Check [ENDPOINTS.md](./ENDPOINTS.md) for details

## Security

- Always use HTTPS in production
- Store tokens securely (not in localStorage for sensitive apps)
- Implement proper error handling
- Log security events
- Use strong passwords and MFA
- Keep API key rotation schedule
- Never commit credentials to version control

## Last Updated

December 1, 2025
