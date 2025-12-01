# API Error Codes Reference

## Overview

All API errors return a consistent JSON format with HTTP status codes and machine-readable error codes for client-side handling.

### Error Response Format

```json
{
  "error": "HTTP Error Name",
  "message": "Human-readable description",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "fieldName",
    "issue": "Additional context"
  }
}
```

---

## HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Service is down/unreachable |

---

## Authentication Errors (4xx)

### 401 Unauthorized

| Code | Description | Solution |
|------|-------------|----------|
| INVALID_TOKEN | Token is invalid or malformed | Obtain new token via login |
| EXPIRED_TOKEN | Token has expired | Use refresh token to get new access token |
| MISSING_TOKEN | Authorization header missing | Include `Authorization: Bearer <token>` |
| INVALID_MFA_CODE | MFA code is incorrect or expired | Verify correct TOTP code from authenticator |
| MFA_REQUIRED | MFA verification required | Verify MFA code using temp token |
| SESSION_EXPIRED | Session has expired | Login again |
| INVALID_CREDENTIALS | Email/password combination incorrect | Verify credentials and try again |
| ACCOUNT_LOCKED | Account is locked due to too many failed attempts | Contact support to unlock |
| ACCOUNT_DISABLED | Account is disabled | Contact support |

### 403 Forbidden

| Code | Description | Solution |
|------|-------------|----------|
| INSUFFICIENT_PERMISSIONS | User lacks required permissions | Use account with appropriate role |
| ROLE_REQUIRED | Specific role required for this endpoint | Use account with required role |
| PHARMACY_RESTRICTED | Cannot access pharmacy outside user's context | Access within your pharmacy only |
| PATIENT_RESTRICTED | Patient can only access own data | Access own resources only |
| RESOURCE_FORBIDDEN | Access to resource is forbidden | Verify access permissions |

---

## Validation Errors (400)

### Request Validation

| Code | Description | Solution | Example |
|------|-------------|----------|---------|
| VALIDATION_ERROR | Input validation failed | Check request payload format | Missing required field |
| INVALID_EMAIL | Email format is invalid | Use valid email format | `user@metapharm.ch` |
| INVALID_PASSWORD | Password doesn't meet requirements | Use strong password (min 12 chars, mixed case, numbers, symbols) | `SecurePass123!` |
| INVALID_PHONE | Phone number format invalid | Use international format | `+41791234567` |
| MISSING_REQUIRED_FIELD | Required field is missing | Include all required fields | `patientId` required |
| INVALID_UUID | UUID format is invalid | Use valid UUID v4 format | `550e8400-e29b-41d4-a716-446655440000` |
| INVALID_DATE | Date format is invalid | Use ISO 8601 format | `2025-12-01T18:00:00Z` |
| INVALID_JSON | JSON payload is malformed | Check JSON syntax | Missing comma, quote |
| INVALID_ENUM | Value not in allowed list | Use one of allowed values | Status: `pending`, `dispensed`, `rejected` |
| INVALID_RANGE | Value outside allowed range | Value must be in specified range | Quantity must be > 0 |

### Prescription-Specific Validation

| Code | Description | Solution |
|------|-------------|----------|
| NO_MEDICATIONS | Prescription must include medications | Add at least one medication |
| INVALID_MEDICATION | Medication data is incomplete/invalid | Include name, dosage, quantity, instructions |
| INVALID_DOSAGE | Dosage format is invalid | Use valid format (e.g., "500mg") |
| QUANTITY_EXCEEDS_STOCK | Requested quantity exceeds available stock | Request within available stock |
| PRESCRIPTION_EXPIRED | Prescription has expired | Request doctor renewal |
| INVALID_STATUS_TRANSITION | Cannot transition to requested status | Check valid status transitions |
| PATIENT_NOT_FOUND | Patient doesn't exist | Verify patient ID |
| DOCTOR_NOT_FOUND | Doctor doesn't exist | Verify doctor ID |

### Cart/Order Validation

| Code | Description | Solution |
|------|-------------|----------|
| CART_EMPTY | Cart has no items | Add items before checkout |
| PRODUCT_NOT_FOUND | Product doesn't exist | Verify product ID |
| INSUFFICIENT_STOCK | Not enough stock available | Reduce quantity or choose alternative |
| INVALID_QUANTITY | Quantity is invalid | Quantity must be positive integer |
| PRESCRIPTION_REQUIRED | Product requires valid prescription | Upload or provide prescription |
| INVALID_ADDRESS | Address is incomplete/invalid | Include all required address fields |
| INVALID_PAYMENT_METHOD | Payment method is invalid/unsupported | Use supported payment method |

### User Validation

| Code | Description | Solution |
|------|-------------|----------|
| EMAIL_ALREADY_EXISTS | Email is already registered | Use different email |
| INVALID_ROLE | Role is invalid or not supported | Use valid role (PHARMACIST, DOCTOR, etc.) |
| NAME_REQUIRED | First/last name required | Provide full name |
| PHONE_REQUIRED | Phone number required for this role | Provide valid phone number |
| PHARMACY_REQUIRED | Pharmacy ID required for pharmacist role | Select your pharmacy |

---

## Resource Errors (4xx)

### 404 Not Found

| Code | Description | Solution |
|------|-------------|----------|
| PRESCRIPTION_NOT_FOUND | Prescription ID doesn't exist | Verify prescription ID |
| PATIENT_NOT_FOUND | Patient ID doesn't exist | Verify patient ID |
| USER_NOT_FOUND | User ID doesn't exist | Verify user ID |
| PHARMACY_NOT_FOUND | Pharmacy ID doesn't exist | Verify pharmacy ID |
| ORDER_NOT_FOUND | Order ID doesn't exist | Verify order ID |
| CART_NOT_FOUND | Cart doesn't exist | Create new cart |
| PRODUCT_NOT_FOUND | Product doesn't exist | Verify product ID |
| NOTIFICATION_NOT_FOUND | Notification doesn't exist | Verify notification ID |
| RESOURCE_NOT_FOUND | Generic resource not found | Verify resource ID and path |

### 409 Conflict

| Code | Description | Solution |
|------|-------------|----------|
| RESOURCE_ALREADY_EXISTS | Resource already exists | Use different identifier |
| DUPLICATE_REQUEST | Duplicate request detected | Wait before retrying |
| CONCURRENT_MODIFICATION | Resource was modified concurrently | Refresh and retry |
| INVALID_STATE_TRANSITION | Cannot transition to requested state | Check current state and valid transitions |

---

## Rate Limiting Errors (429)

| Code | Description | Solution |
|------|-------------|----------|
| RATE_LIMIT_EXCEEDED | Too many requests from this IP | Wait before retrying |
| LOGIN_RATE_LIMIT | Too many login attempts | Wait 15 minutes before retrying |
| PASSWORD_RESET_LIMIT | Too many password reset attempts | Wait 1 hour before retrying |
| API_QUOTA_EXCEEDED | API quota for this plan exceeded | Upgrade plan or wait for reset |

**Rate Limit Headers**:
```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1701432000  (Unix timestamp)
```

---

## Server Errors (5xx)

### 500 Internal Server Error

| Code | Description | Solution |
|------|-------------|----------|
| INTERNAL_ERROR | Unexpected server error | Retry after a few seconds |
| DATABASE_ERROR | Database connection/query failed | Retry operation |
| ENCRYPTION_ERROR | Failed to encrypt/decrypt data | Retry operation |
| EMAIL_SEND_FAILED | Failed to send email | Retry or contact support |
| PAYMENT_PROCESSING_ERROR | Payment processing failed | Verify payment details and retry |
| NOTIFICATION_ERROR | Failed to send notification | Retry operation |

### 503 Service Unavailable

| Code | Description | Solution |
|------|-------------|----------|
| SERVICE_UNAVAILABLE | Service is temporarily down | Retry after a few seconds |
| DATABASE_UNAVAILABLE | Database is unavailable | Retry after a few seconds |
| PAYMENT_GATEWAY_UNAVAILABLE | Payment gateway is unavailable | Retry later |
| EXTERNAL_SERVICE_UNAVAILABLE | External service is unavailable | Retry later |

---

## Healthcare-Specific Errors

### Prescription Processing

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| DRUG_INTERACTION_DETECTED | 400 | Medication interaction detected | Review medications with doctor |
| ALLERGY_CONFLICT | 400 | Patient allergic to medication | Choose alternative medication |
| CONTROLLED_SUBSTANCE_RESTRICTED | 403 | Controlled substance access denied | Verify permissions and DEA/HIN status |
| PRESCRIPTION_VALIDITY_EXPIRED | 400 | Prescription validity period expired | Request doctor renewal |
| E_SANTE_SYNC_FAILED | 500 | Failed to sync with e-Santé system | Retry operation |
| HIN_VALIDATION_FAILED | 400 | HIN validation failed | Verify HIN status |

### Insurance/Payment

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| INSURANCE_VERIFICATION_FAILED | 400 | Insurance verification failed | Verify insurance information |
| INVALID_INSURANCE_CODE | 400 | Insurance code is invalid | Check insurance provider code |
| COPAY_CALCULATION_ERROR | 500 | Failed to calculate copay | Retry operation |
| INSURANCE_CLAIM_REJECTED | 400 | Insurance claim was rejected | Contact insurance provider |

### Delivery/Logistics

| Code | HTTP | Description | Solution |
|------|------|-------------|----------|
| DELIVERY_UNAVAILABLE | 400 | Delivery not available in area | Choose different delivery option |
| SPECIAL_HANDLING_REQUIRED | 400 | Special handling required (cold chain, etc.) | Arrange special delivery |
| QR_CODE_INVALID | 400 | QR code is invalid or expired | Request new QR code |
| GPS_TRACKING_UNAVAILABLE | 503 | GPS tracking temporarily unavailable | Retry operation |

---

## Error Handling Examples

### JavaScript/TypeScript

```typescript
async function handleAPIError(error: any) {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const errorData = await response.json();

      switch (errorData.code) {
        case 'INVALID_TOKEN':
          // Refresh token and retry
          await refreshAccessToken();
          return retryRequest();

        case 'RATE_LIMIT_EXCEEDED':
          // Exponential backoff
          const resetTime = parseInt(
            response.headers.get('RateLimit-Reset')
          );
          const delay = resetTime - Math.floor(Date.now() / 1000);
          await sleep(delay * 1000);
          return retryRequest();

        case 'VALIDATION_ERROR':
          // Show validation errors to user
          console.error('Validation errors:', errorData.details);
          showValidationErrorsToUser(errorData.details);
          break;

        case 'INSUFFICIENT_PERMISSIONS':
          // Redirect to access denied page
          window.location.href = '/access-denied';
          break;

        default:
          // Generic error handling
          showErrorNotification(errorData.message);
      }
    }
  } catch (error) {
    console.error('Network error:', error);
    showErrorNotification('Network error. Please try again.');
  }
}
```

### Python

```python
import requests
import time

def make_api_request(endpoint, method='GET', data=None, token=None):
    headers = {
        'Content-Type': 'application/json'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    try:
        response = requests.request(
            method=method,
            url=endpoint,
            json=data,
            headers=headers
        )

        if response.status_code == 401:
            error_code = response.json().get('code')
            if error_code == 'EXPIRED_TOKEN':
                # Refresh token logic
                refresh_access_token()
                return make_api_request(endpoint, method, data, new_token)

        if response.status_code == 429:
            reset_time = int(response.headers.get('RateLimit-Reset', 0))
            delay = reset_time - time.time()
            if delay > 0:
                print(f'Rate limited. Waiting {delay} seconds...')
                time.sleep(delay)
                return make_api_request(endpoint, method, data, token)

        response.raise_for_status()
        return response.json()

    except requests.exceptions.HTTPError as e:
        error_data = e.response.json()
        print(f"Error {error_data['code']}: {error_data['message']}")
        raise

    except requests.exceptions.RequestException as e:
        print(f"Network error: {str(e)}")
        raise
```

---

## Best Practices

1. **Always check error codes** - Use machine-readable codes for client-side logic
2. **Implement retry logic** - Handle transient errors with exponential backoff
3. **Log errors** - Include request ID and timestamp for debugging
4. **User-friendly messages** - Translate error codes to user-friendly messages
5. **Monitor rate limits** - Check RateLimit-* headers and adjust request rate
6. **Handle tokens gracefully** - Refresh tokens before they expire
7. **Validate inputs** - Validate on client before sending to API

---

## Support

For issues not covered in this documentation:
- Email: api-support@metapharm.ch
- API Status: https://status.metapharm.ch
- Documentation: https://metapharm.ch/api-docs

---

**Last Updated**: December 1, 2025
