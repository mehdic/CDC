# MetaPharm Connect API - Comprehensive Guide

## Overview

MetaPharm Connect is a comprehensive healthcare platform API that connects:
- **Pharmacists**: Prescription dispensing, inventory management, teleconsultation
- **Doctors**: Prescription creation, patient record access, teleconsultation
- **Nurses**: Medication ordering, delivery tracking, patient communication
- **Delivery Personnel**: Delivery request management, GPS tracking, QR scanning
- **Patients**: Prescription management, e-commerce, teleconsultation, medical records

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Format](#requestresponse-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)
8. [Code Examples](#code-examples)
9. [WebSocket/Real-time](#websocketreal-time)
10. [Security](#security)

---

## Getting Started

### Base URL

```
Development: http://localhost:4000
Production: https://api.metapharm.ch
Staging: https://staging.metapharm.ch
```

### Prerequisites

- Valid user account
- JWT access token (obtained via `/auth/login`)
- Proper user role and permissions

### Quick Start Example

```bash
# 1. Login and get access token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pharmacist@metapharm.ch",
    "password": "SecurePassword123!"
  }'

# Response includes accessToken

# 2. Use token for authenticated requests
curl -X GET http://localhost:4000/api/prescriptions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Authentication

### JWT Token Flow

```
1. User provides email + password
2. Server validates credentials
3. If MFA enabled: Return temp token for MFA verification
4. After MFA verification: Return access token + refresh token
5. Use access token for API requests (expires: 1 hour)
6. Use refresh token to get new access token (expires: 7 days)
```

### Authentication Methods

#### 1. Email/Password Login

**Endpoint**: `POST /api/auth/login`

```json
Request:
{
  "email": "user@metapharm.ch",
  "password": "SecurePassword123!"
}

Response (200 OK):
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@metapharm.ch",
    "role": "PHARMACIST",
    "firstName": "Jean",
    "lastName": "Dupont",
    "pharmacyId": "pharm-001"
  }
}
```

#### 2. Multi-Factor Authentication (MFA)

For healthcare professionals, MFA is required.

**Step 1**: Login returns temp token if MFA enabled

```json
Response (200 OK):
{
  "success": true,
  "requiresMFA": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mfaMethod": "totp"
}
```

**Step 2**: Verify MFA code

Endpoint: `POST /api/auth/mfa/verify`

```json
Request:
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "code": "123456"
}

Response (200 OK):
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### 3. HIN e-ID (Swiss Healthcare ID)

**Endpoint**: `GET /api/auth/hin/authorize`

Initiates OAuth2 flow with Swiss healthcare ID provider.

```
GET http://localhost:4000/api/auth/hin/authorize?redirect_uri=https://yourdomain.ch/callback
```

#### 4. Setting Up MFA

**Endpoint**: `POST /api/auth/mfa/setup`

```json
Request:
Authorization: Bearer YOUR_ACCESS_TOKEN

Response (200 OK):
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,...",
  "manualEntryKey": "JBSWY3DPEBLW64TMMQ======"
}
```

---

## API Endpoints

### Health & Status

#### GET / - Gateway Status
Returns API Gateway operational status

```json
Response:
{
  "service": "MetaPharm Connect API Gateway",
  "version": "1.0.0",
  "status": "running",
  "environment": "development"
}
```

#### GET /health - Service Health Check
Check health of all services

```json
Response (200):
{
  "status": "healthy",
  "services": {
    "apiGateway": "up",
    "authService": "up",
    "prescriptionService": "up",
    "inventoryService": "up",
    "orderService": "up"
  },
  "timestamp": "2025-12-01T18:00:00Z"
}
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | None | User login with email/password |
| POST | /api/auth/mfa/verify | Temp Token | Verify MFA code |
| POST | /api/auth/mfa/setup | JWT | Initialize MFA setup |
| POST | /api/auth/mfa/enable | JWT | Enable MFA after verification |
| DELETE | /api/auth/mfa/disable | JWT | Disable MFA |
| GET | /api/auth/sessions | JWT | List active sessions |
| DELETE | /api/auth/logout | JWT | Logout user |
| GET | /api/auth/hin/authorize | None | Initiate HIN e-ID OAuth |
| GET | /api/auth/hin/callback | None | HIN e-ID callback handler |

### Prescription Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/prescriptions | JWT | Create new prescription |
| GET | /api/prescriptions | JWT | List prescriptions (role-filtered) |
| GET | /api/prescriptions/{id} | JWT | Get prescription details |
| PATCH | /api/prescriptions/{id}/status | JWT | Update prescription status |

### Inventory Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/inventory | JWT | List pharmacy inventory |
| GET | /api/inventory/{id} | JWT | Get item details |
| PATCH | /api/inventory/{id} | JWT | Update stock level |

### Orders & Shopping Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/cart | JWT | Get shopping cart |
| POST | /api/cart/add | JWT | Add item to cart |
| POST | /api/cart/remove | JWT | Remove item from cart |
| POST | /api/orders | JWT | Create order |
| GET | /api/orders | JWT | List user's orders |
| GET | /api/orders/{id} | JWT | Get order details |

### Teleconsultation Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/teleconsultations | JWT | Schedule new consultation |
| GET | /api/teleconsultations | JWT | List consultations |
| GET | /api/teleconsultations/{id} | JWT | Get consultation details |
| POST | /api/teleconsultations/{id}/start | JWT | Start video session |
| POST | /api/teleconsultations/{id}/end | JWT | End consultation |

### Notification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/notifications | JWT | List notifications |
| PATCH | /api/notifications/{id}/read | JWT | Mark as read |
| DELETE | /api/notifications/{id} | JWT | Delete notification |

---

## Request/Response Format

### Request Headers

All API requests should include:

```
Content-Type: application/json
Authorization: Bearer <jwt-token>  # For protected endpoints
X-Request-ID: <unique-id>         # Optional, for tracing
```

### Response Format

#### Success Response (2xx)

```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  },
  "meta": {
    "timestamp": "2025-12-01T18:00:00Z",
    "requestId": "req-123"
  }
}
```

#### Error Response (4xx, 5xx)

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

### Pagination

List endpoints support pagination:

```
GET /api/prescriptions?page=1&limit=20&sort=-createdAt

Query Parameters:
- page (integer, default: 1): Page number
- limit (integer, default: 20, max: 100): Items per page
- sort (string): Sort field, prefix with - for descending
- filter (object): Filter criteria (varies by endpoint)
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Error Handling

### Common Error Codes

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| INVALID_TOKEN | 401 | Token is invalid or expired | Obtain new token via login |
| INSUFFICIENT_PERMISSIONS | 403 | User lacks required permissions | Use account with proper role |
| NOT_FOUND | 404 | Resource doesn't exist | Verify resource ID |
| VALIDATION_ERROR | 400 | Input validation failed | Check request payload format |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests | Wait before retrying |
| SERVICE_UNAVAILABLE | 503 | Service is down | Retry later |

### Error Response Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN",
  "details": {
    "expiresAt": "2025-12-01T16:00:00Z",
    "issueTime": "2025-12-01T15:00:00Z"
  }
}
```

### Handling Errors in Code

```javascript
try {
  const response = await fetch(
    'http://localhost:4000/api/prescriptions',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error(`Error ${error.code}: ${error.message}`);
    // Handle specific error codes
    if (error.code === 'INVALID_TOKEN') {
      // Refresh token and retry
    }
  }

  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Rate Limiting

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| General endpoints | 100 requests | 1 minute |
| Authentication (login) | 5 attempts | 15 minutes |
| Password reset | 3 attempts | 1 hour |

### Rate Limit Headers

Every response includes rate limit information:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1701432000
```

### Handling Rate Limits

```javascript
if (response.status === 429) {
  const resetTime = parseInt(response.headers.get('RateLimit-Reset'));
  const waitSeconds = resetTime - Math.floor(Date.now() / 1000);
  console.log(`Rate limited. Retry after ${waitSeconds} seconds`);

  // Exponential backoff with jitter
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

---

## Best Practices

### 1. Token Management

```javascript
// Store tokens securely (not in localStorage for sensitive apps)
class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async login(email: string, password: string) {
    const response = await fetch(
      'http://localhost:4000/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.tokenExpiry = new Date(Date.now() + data.expiresIn * 1000);
  }

  async getValidToken(): Promise<string> {
    // Check if token is about to expire
    if (this.tokenExpiry && Date.now() > this.tokenExpiry.getTime() - 60000) {
      await this.refreshAccessToken();
    }
    return this.accessToken!;
  }

  private async refreshAccessToken() {
    // Implement refresh token logic
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
}
```

### 2. Error Handling & Retries

```javascript
async function apiCall(
  endpoint: string,
  options: any = {},
  retries: number = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          Authorization: `Bearer ${await authManager.getValidToken()}`,
          ...options.headers
        }
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (response.status === 401) {
        // Token invalid - refresh and retry once
        if (i === 0) {
          await authManager.refreshAccessToken();
          continue;
        }
      }

      throw new Error(`API Error: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Proper Error Responses

Always handle both successful and error responses:

```javascript
async function fetchPrescriptions(filters = {}) {
  try {
    const response = await apiCall(
      'http://localhost:4000/api/prescriptions?' +
        new URLSearchParams(filters),
      { method: 'GET' }
    );

    if (!response.success) {
      console.error('API returned error:', response.error);
      return [];
    }

    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch prescriptions:', error);
    // Show user-friendly error message
    return [];
  }
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      // Implement refresh logic
    }

    return Promise.reject(error);
  }
);

// Usage
async function getPrescriptions() {
  const response = await api.get('/api/prescriptions');
  return response.data;
}
```

### Python

```python
import requests
from datetime import datetime, timedelta

class MetaPharmAPI:
    def __init__(self, base_url='http://localhost:4000'):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.token_expiry = None

    def login(self, email: str, password: str):
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['accessToken']
        self.refresh_token = data['refreshToken']
        self.token_expiry = datetime.now() + timedelta(seconds=data['expiresIn'])

    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

    def get_prescriptions(self, page=1, limit=20):
        response = requests.get(
            f'{self.base_url}/api/prescriptions',
            params={'page': page, 'limit': limit},
            headers=self.get_headers()
        )
        response.raise_for_status()
        return response.json()

# Usage
api = MetaPharmAPI()
api.login('pharmacist@metapharm.ch', 'password')
prescriptions = api.get_prescriptions()
```

---

## WebSocket/Real-time

For real-time features (messaging, notifications, delivery tracking), WebSocket connections are available:

### Connecting

```javascript
const socket = new WebSocket(
  'ws://localhost:4000/ws',
  [`Bearer ${accessToken}`]
);

socket.addEventListener('open', () => {
  console.log('Connected to WebSocket');

  // Subscribe to notifications
  socket.send(JSON.stringify({
    action: 'subscribe',
    channel: 'notifications'
  }));
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
});

socket.addEventListener('close', () => {
  console.log('Disconnected');
});
```

---

## Security

### Guidelines

1. **Never store tokens in localStorage** for sensitive applications - use secure HTTP-only cookies
2. **Always use HTTPS** in production
3. **Validate all inputs** on both client and server
4. **Implement CSRF protection** for state-changing operations
5. **Use strong passwords** and require MFA for healthcare professionals
6. **Encrypt sensitive data** in transit and at rest
7. **Log security events** and audit all access to sensitive data
8. **Implement rate limiting** to prevent abuse
9. **Use API keys** for service-to-service communication
10. **Regularly rotate secrets** and update dependencies

### HIPAA/GDPR Compliance

- All patient data is encrypted at rest and in transit
- Access logging for all patient record access
- Data retention policies per applicable regulations
- Right to be forgotten implementation
- Data breach notification procedures

---

## Support & Documentation

- **API Documentation**: http://localhost:4000/api-docs
- **OpenAPI Spec**: http://localhost:4000/api-docs.json
- **Support Email**: api-support@metapharm.ch
- **Status Page**: https://status.metapharm.ch
- **API Changelog**: https://metapharm.ch/api/changelog

---

## Versioning

Current API version: **1.0.0**

The API uses semantic versioning. Breaking changes will result in a new major version with a 6-month deprecation period for previous versions.

---

## Last Updated

December 1, 2025
