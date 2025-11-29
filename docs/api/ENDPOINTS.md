# MetaPharm Connect API Endpoints

Complete reference documentation for all MetaPharm Connect REST API endpoints.

**Base URL**: `http://localhost:4000` (development) or `https://api.metapharm.com/v1` (production)

**Authentication**: Most endpoints require JWT Bearer token in Authorization header
```
Authorization: Bearer <jwt-token>
```

---

## Table of Contents

1. [Cart API](#cart-api)
2. [Order API](#order-api)
3. [Delivery Tracking API](#delivery-tracking-api)
4. [Product Catalog API](#product-catalog-api)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Cart API

Shopping cart management for e-commerce and OTC products.

**Base Path**: `/api/cart` or `/cart`

**Authentication**: Required

### GET /cart

Retrieve the user's active shopping cart.

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "cart": {
    "id": "cart-uuid-123",
    "items": [
      {
        "id": "item-uuid-1",
        "productId": "product-uuid-1",
        "name": "Ibuprofen 400mg",
        "description": "Pain relief tablets",
        "category": "Pain Relief",
        "price": 12.50,
        "quantity": 2,
        "subtotal": 25.00,
        "imageUrl": "https://cdn.example.com/ibuprofen.jpg",
        "requiresPrescription": false
      }
    ],
    "subtotal": 25.00,
    "tax": 2.50,
    "discount": 0,
    "discountCode": null,
    "total": 27.50,
    "itemCount": 1,
    "totalQuantity": 2,
    "status": "active"
  }
}
```

**Possible Errors**:
- `401 Unauthorized` - User ID not found in request
- `500 Internal Server Error` - Database connection error

---

### POST /cart/add

Add a product to the shopping cart.

**Request Body**:
```json
{
  "productId": "product-uuid-1",
  "quantity": 1,
  "product": {
    "id": "product-uuid-1",
    "name": "Ibuprofen 400mg",
    "price": 12.50,
    "availableStock": 100,
    "requiresPrescription": false
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product added to cart",
  "cart": {
    "id": "cart-uuid-123",
    "items": [
      {
        "id": "item-uuid-1",
        "productId": "product-uuid-1",
        "name": "Ibuprofen 400mg",
        "quantity": 1,
        "price": 12.50,
        "subtotal": 12.50
      }
    ],
    "subtotal": 12.50,
    "tax": 1.25,
    "discount": 0,
    "total": 13.75,
    "itemCount": 1
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Missing productId or invalid quantity
- `400 Bad Request` - Requested quantity exceeds available stock
- `401 Unauthorized` - User not authenticated

---

### PUT /cart/items/:productId/quantity

Update the quantity of an item in the cart.

**Path Parameters**:
- `productId` (string, required) - UUID of the product

**Request Body**:
```json
{
  "quantity": 3,
  "availableStock": 100
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item quantity updated",
  "cart": {
    "id": "cart-uuid-123",
    "items": [
      {
        "id": "item-uuid-1",
        "productId": "product-uuid-1",
        "name": "Ibuprofen 400mg",
        "quantity": 3,
        "price": 12.50,
        "subtotal": 37.50
      }
    ],
    "subtotal": 37.50,
    "tax": 3.75,
    "discount": 0,
    "total": 41.25,
    "itemCount": 1
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Invalid quantity (not a number or <= 0)
- `400 Bad Request` - Requested quantity exceeds available stock
- `400 Bad Request` - Product not found in cart

---

### DELETE /cart/items/:productId

Remove an item from the shopping cart.

**Path Parameters**:
- `productId` (string, required) - UUID of the product to remove

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart": {
    "id": "cart-uuid-123",
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "discount": 0,
    "total": 0,
    "itemCount": 0
  }
}
```

**Possible Errors**:
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Product not in cart

---

### POST /cart/apply-discount

Apply a discount code to the shopping cart.

**Request Body**:
```json
{
  "discountCode": "SPRING2025",
  "discountAmount": 5.00
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Discount code applied",
  "cart": {
    "id": "cart-uuid-123",
    "subtotal": 50.00,
    "tax": 5.00,
    "discount": 5.00,
    "discountCode": "SPRING2025",
    "total": 50.00,
    "itemCount": 2
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Invalid discount code
- `400 Bad Request` - Discount exceeds cart subtotal
- `400 Bad Request` - Discount code already applied or expired

---

### DELETE /cart/clear

Clear all items from the shopping cart.

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared",
  "cart": {
    "id": "cart-uuid-123",
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "discount": 0,
    "total": 0,
    "itemCount": 0
  }
}
```

**Possible Errors**:
- `401 Unauthorized` - User not authenticated

---

## Order API

Order management for prescriptions and e-commerce products.

**Base Path**: `/api/orders` or `/orders`

**Authentication**: Required

### GET /orders

List all orders for the authenticated user with filtering and pagination.

**Query Parameters**:
- `status` (string, optional) - Filter by status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`
- `payment_status` (string, optional) - Filter by payment status: `pending`, `paid`, `failed`, `refunded`
- `user_id` (UUID, optional) - Filter by user (admin only)
- `pharmacy_id` (UUID, optional) - Filter by pharmacy
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20, max: 100)

**Example Request**:
```
GET /api/orders?status=delivered&page=1&limit=20
```

**Response** (200 OK):
```json
{
  "success": true,
  "orders": [
    {
      "id": "order-uuid-1",
      "userId": "user-uuid-1",
      "pharmacyId": "pharmacy-uuid-1",
      "status": "delivered",
      "paymentStatus": "paid",
      "subtotal": 125.50,
      "taxAmount": 12.55,
      "shippingCost": 10.00,
      "discountAmount": 5.00,
      "totalAmount": 143.05,
      "items": [
        {
          "productId": "product-uuid-1",
          "name": "Ibuprofen 400mg",
          "quantity": 2,
          "price": 12.50,
          "subtotal": 25.00
        }
      ],
      "deliveryMethod": "courier",
      "notes": "Deliver after 6 PM",
      "createdAt": "2025-11-20T10:30:00Z",
      "updatedAt": "2025-11-25T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Invalid filter parameters
- `401 Unauthorized` - User not authenticated

---

### GET /orders/:id

Get details for a specific order.

**Path Parameters**:
- `id` (UUID, required) - Order ID

**Response** (200 OK):
```json
{
  "success": true,
  "order": {
    "id": "order-uuid-1",
    "userId": "user-uuid-1",
    "pharmacyId": "pharmacy-uuid-1",
    "status": "delivered",
    "paymentStatus": "paid",
    "paymentMethod": "credit_card",
    "paymentTransactionId": "txn-12345",
    "subtotal": 125.50,
    "taxAmount": 12.55,
    "shippingCost": 10.00,
    "discountAmount": 5.00,
    "totalAmount": 143.05,
    "items": [
      {
        "productId": "product-uuid-1",
        "name": "Ibuprofen 400mg",
        "description": "Pain relief tablets",
        "quantity": 2,
        "price": 12.50,
        "subtotal": 25.00,
        "requiresPrescription": false
      }
    ],
    "shippingAddressEncrypted": "base64-encrypted-address",
    "deliveryMethod": "courier",
    "deliveryId": "delivery-uuid-1",
    "notes": "Deliver after 6 PM",
    "cancellationReason": null,
    "createdAt": "2025-11-20T10:30:00Z",
    "updatedAt": "2025-11-25T14:20:00Z"
  }
}
```

**Possible Errors**:
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Order not found

---

### POST /orders

Create a new order from cart items.

**Request Body**:
```json
{
  "userId": "user-uuid-1",
  "pharmacyId": "pharmacy-uuid-1",
  "items": [
    {
      "productId": "product-uuid-1",
      "quantity": 2,
      "price": 12.50
    }
  ],
  "subtotal": 25.00,
  "taxAmount": 2.50,
  "shippingCost": 10.00,
  "discountAmount": 0,
  "totalAmount": 37.50,
  "shippingAddressEncrypted": "base64-encrypted-address",
  "shippingNotesEncrypted": "base64-encrypted-notes",
  "deliveryMethod": "courier",
  "notes": "Deliver after 6 PM"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "order": {
    "id": "order-uuid-new",
    "userId": "user-uuid-1",
    "pharmacyId": "pharmacy-uuid-1",
    "status": "pending",
    "paymentStatus": "pending",
    "totalAmount": 37.50,
    "createdAt": "2025-11-25T16:00:00Z"
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Missing required fields
- `400 Bad Request` - Invalid amounts or calculations
- `401 Unauthorized` - User not authenticated

---

### PUT /orders/:id

Update an order (status, payment, notes).

**Path Parameters**:
- `id` (UUID, required) - Order ID

**Request Body** (all optional):
```json
{
  "status": "processing",
  "paymentStatus": "paid",
  "paymentMethod": "credit_card",
  "paymentTransactionId": "txn-12345",
  "deliveryId": "delivery-uuid-1",
  "notes": "Updated delivery instructions",
  "cancellationReason": null
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "order": {
    "id": "order-uuid-1",
    "status": "processing",
    "paymentStatus": "paid",
    "paymentTransactionId": "txn-12345",
    "updatedAt": "2025-11-25T16:30:00Z"
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Invalid status transition
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User cannot modify this order
- `404 Not Found` - Order not found

---

### DELETE /orders/:id

Delete/cancel an order (only if pending).

**Path Parameters**:
- `id` (UUID, required) - Order ID

**Request Body** (optional):
```json
{
  "cancellationReason": "Changed my mind"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Order cancelled",
  "order": {
    "id": "order-uuid-1",
    "status": "cancelled",
    "cancellationReason": "Changed my mind",
    "updatedAt": "2025-11-25T16:45:00Z"
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Cannot cancel order (already shipped/delivered)
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User cannot delete this order
- `404 Not Found` - Order not found

---

## Delivery Tracking API

Real-time delivery tracking with GPS location updates.

**Base Path**: `/api/deliveries/tracking` or `/deliveries/tracking`

**Authentication**: Required

### POST /tracking/:id/location

Update driver's current location for a delivery.

**Path Parameters**:
- `id` (UUID, required) - Delivery ID

**Request Body**:
```json
{
  "latitude": 47.3669,
  "longitude": 8.5500,
  "accuracy": 10,
  "speed": 15.5,
  "heading": 45.0,
  "timestamp": "2025-11-25T16:50:00Z",
  "batteryLevel": 75
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "location": {
    "deliveryId": "delivery-uuid-1",
    "latitude": 47.3669,
    "longitude": 8.5500,
    "accuracy": 10,
    "speed": 15.5,
    "heading": 45.0,
    "timestamp": "2025-11-25T16:50:00Z",
    "batteryLevel": 75
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Missing required coordinates
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Delivery not found

---

### GET /tracking/:id

Get real-time delivery tracking information.

**Path Parameters**:
- `id` (UUID, required) - Delivery ID

**Response** (200 OK):
```json
{
  "success": true,
  "tracking": {
    "deliveryId": "delivery-uuid-1",
    "status": "in_transit",
    "currentLocation": {
      "latitude": 47.3669,
      "longitude": 8.5500,
      "accuracy": 10,
      "timestamp": "2025-11-25T16:50:00Z"
    },
    "estimatedArrivalMinutes": 12,
    "distanceRemainingKm": 5.3,
    "locationHistory": [
      {
        "latitude": 47.3700,
        "longitude": 8.5400,
        "timestamp": "2025-11-25T16:00:00Z"
      },
      {
        "latitude": 47.3690,
        "longitude": 8.5450,
        "timestamp": "2025-11-25T16:15:00Z"
      }
    ],
    "driverInfo": {
      "id": "driver-uuid-1",
      "name": "John Smith",
      "phone": "+41791234567",
      "vehicle": "White Van",
      "licensePlate": "ZH-123456"
    }
  }
}
```

**Possible Errors**:
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Delivery not found

---

### GET /tracking/:id/history

Get full location history for a delivery.

**Path Parameters**:
- `id` (UUID, required) - Delivery ID

**Query Parameters**:
- `startDate` (ISO 8601 string, optional) - Start of date range (defaults to delivery creation time)
- `endDate` (ISO 8601 string, optional) - End of date range (defaults to now)
- `limit` (integer, optional) - Max results to return (default: 100, max: 1000)

**Example Request**:
```
GET /tracking/delivery-uuid-1/history?limit=50&startDate=2025-11-25T10:00:00Z
```

**Response** (200 OK):
```json
{
  "success": true,
  "history": [
    {
      "timestamp": "2025-11-25T16:00:00Z",
      "latitude": 47.3700,
      "longitude": 8.5400,
      "accuracy": 12
    },
    {
      "timestamp": "2025-11-25T16:05:00Z",
      "latitude": 47.3695,
      "longitude": 8.5420,
      "accuracy": 10
    },
    {
      "timestamp": "2025-11-25T16:10:00Z",
      "latitude": 47.3690,
      "longitude": 8.5450,
      "accuracy": 9
    }
  ],
  "pagination": {
    "total": 87,
    "limit": 50,
    "offset": 0
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Invalid date range or limit
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Delivery not found

---

## Product Catalog API

Browse and search for prescription and OTC products.

**Base Path**: `/api/products` or `/products`

**Authentication**: Not required for public endpoints (optional for personalized results)

### GET /products

List all products with pagination and filtering.

**Query Parameters**:
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20, max: 100)
- `category` (string, optional) - Filter by category
- `requiresPrescription` (boolean, optional) - Filter by prescription requirement
- `inStock` (boolean, optional) - Show only in-stock items
- `minPrice` (decimal, optional) - Minimum price filter
- `maxPrice` (decimal, optional) - Maximum price filter

**Example Request**:
```
GET /api/products?page=1&limit=20&category=Pain+Relief&inStock=true
```

**Response** (200 OK):
```json
{
  "success": true,
  "products": [
    {
      "id": "product-uuid-1",
      "name": "Ibuprofen 400mg",
      "description": "Pain relief and fever reducer",
      "category": "Pain Relief",
      "price": 12.50,
      "availableStock": 150,
      "requiresPrescription": false,
      "imageUrl": "https://cdn.example.com/ibuprofen.jpg",
      "rating": 4.5,
      "reviewCount": 234
    },
    {
      "id": "product-uuid-2",
      "name": "Amoxicillin 500mg",
      "description": "Antibiotic - requires prescription",
      "category": "Antibiotics",
      "price": 25.00,
      "availableStock": 50,
      "requiresPrescription": true,
      "imageUrl": "https://cdn.example.com/amoxicillin.jpg",
      "rating": 4.8,
      "reviewCount": 456
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Invalid filter parameters
- `500 Internal Server Error` - Database error

---

### GET /products/:id

Get detailed information for a specific product.

**Path Parameters**:
- `id` (UUID, required) - Product ID

**Response** (200 OK):
```json
{
  "success": true,
  "product": {
    "id": "product-uuid-1",
    "name": "Ibuprofen 400mg",
    "description": "Over-the-counter pain relief and fever reducer",
    "category": "Pain Relief",
    "price": 12.50,
    "sku": "IBU-400-TAB-100",
    "manufacturer": "Generic Pharma Inc",
    "batchNumber": "BATCH-2025-001",
    "expiryDate": "2027-12-31",
    "availableStock": 150,
    "requiresPrescription": false,
    "contraindications": ["pregnancy", "kidney disease"],
    "sideEffects": ["nausea", "dizziness", "headache"],
    "dosage": "One tablet every 4-6 hours, max 3 tablets per day",
    "imageUrl": "https://cdn.example.com/ibuprofen.jpg",
    "images": [
      "https://cdn.example.com/ibuprofen-1.jpg",
      "https://cdn.example.com/ibuprofen-2.jpg"
    ],
    "rating": 4.5,
    "reviewCount": 234,
    "reviews": [
      {
        "userId": "user-uuid-123",
        "rating": 5,
        "comment": "Very effective for headaches",
        "createdAt": "2025-11-20T10:30:00Z"
      }
    ],
    "tags": ["otc", "pain-relief", "fever", "non-prescription"],
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2025-11-25T10:00:00Z"
  }
}
```

**Possible Errors**:
- `404 Not Found` - Product not found
- `500 Internal Server Error` - Database error

---

### GET /products/search

Search for products by name, description, or other criteria.

**Query Parameters**:
- `q` (string, required) - Search query (min 2 characters)
- `category` (string, optional) - Limit search to category
- `limit` (integer, optional) - Max results (default: 20, max: 100)
- `page` (integer, optional) - Page number (default: 1)

**Example Request**:
```
GET /api/products/search?q=ibuprofen&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "query": "ibuprofen",
  "results": [
    {
      "id": "product-uuid-1",
      "name": "Ibuprofen 400mg",
      "description": "Pain relief and fever reducer",
      "category": "Pain Relief",
      "price": 12.50,
      "availableStock": 150,
      "requiresPrescription": false,
      "imageUrl": "https://cdn.example.com/ibuprofen.jpg",
      "rating": 4.5,
      "reviewCount": 234
    },
    {
      "id": "product-uuid-3",
      "name": "Ibuprofen 600mg",
      "description": "Stronger pain relief",
      "category": "Pain Relief",
      "price": 18.00,
      "availableStock": 75,
      "requiresPrescription": false,
      "imageUrl": "https://cdn.example.com/ibuprofen-600.jpg",
      "rating": 4.7,
      "reviewCount": 189
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

**Possible Errors**:
- `400 Bad Request` - Query too short or missing
- `500 Internal Server Error` - Search error

---

## Authentication

User authentication endpoints (login, logout, token refresh).

**Base Path**: `/api/auth` or `/auth`

**Authentication**: Not required (except logout which requires current token)

### POST /auth/login

Authenticate user with email and password to receive JWT tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PATIENT"
  },
  "expiresIn": 3600
}
```

**Possible Errors**:
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limited after failed attempts

---

### POST /auth/logout

Invalidate the current user session/token.

**Request Body**: Empty

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Possible Errors**:
- `401 Unauthorized` - No valid token provided

---

### POST /auth/refresh

Get a new access token using a valid refresh token.

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Possible Errors**:
- `400 Bad Request` - Missing refresh token
- `401 Unauthorized` - Invalid or expired refresh token

---

## Error Handling

All API errors follow a consistent format:

### Standard Error Response

```json
{
  "success": false,
  "error": "Error Title",
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common HTTP Status Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Malformed request or validation error |
| 401 | UNAUTHORIZED | Authentication required or invalid token |
| 403 | FORBIDDEN | User lacks permission for this action |
| 404 | NOT_FOUND | Requested resource not found |
| 409 | CONFLICT | Resource already exists or state conflict |
| 422 | UNPROCESSABLE_ENTITY | Request data validation failed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Rate Limiting

All API requests are rate-limited based on user type:

### Rate Limits

| User Type | Limit | Window |
|-----------|-------|--------|
| Authenticated | 1000 | 1 hour |
| Public | 100 | 1 hour |
| Admin | 5000 | 1 hour |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1700899200
```

When rate limit is exceeded, the API returns `429 Too Many Requests`:

```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

---

## Related Documentation

- [OpenAPI Specification](./openapi.yaml) - Complete machine-readable API spec
- [Deployment Guide](../guides/deployment.md) - Production deployment instructions
- [Security Implementation](../security/SECURITY_IMPLEMENTATION.md) - Security features and requirements
- [Architecture Documentation](../architecture/README.md) - System design and components

---

**Last Updated**: November 25, 2025
**API Version**: 1.0.0
