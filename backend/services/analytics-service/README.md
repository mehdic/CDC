# Analytics Service

Pharmacy analytics and dashboard API for MetaPharm Connect. Provides comprehensive metrics, trends, and insights for pharmacy operations.

## Features

- Comprehensive pharmacy dashboard with key metrics
- Revenue and prescription tracking
- Inventory management insights
- Time series data (daily, weekly, monthly aggregations)
- Top products analysis
- Recent orders tracking
- Date range filtering and customization

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Development

```bash
# Start development server (with auto-reload)
npm run dev

# Health check
curl http://localhost:4009/health
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "analytics-service",
  "timestamp": "2025-12-03T13:33:00Z",
  "version": "1.0.0"
}
```

### Dashboard Data

```
GET /api/analytics/dashboard/:pharmacyId
```

Get comprehensive dashboard data including all metrics, trends, and insights.

**Query Parameters:**
- `startDate` (optional): YYYY-MM-DD format, defaults to 30 days ago
- `endDate` (optional): YYYY-MM-DD format, defaults to today
- `groupBy` (optional): 'daily' | 'weekly' | 'monthly', defaults to 'daily'

**Response:**
```json
{
  "success": true,
  "data": {
    "pharmacyId": "pharmacy-001",
    "metrics": {
      "revenue": {
        "today": 1250.50,
        "thisWeek": 8750.25,
        "thisMonth": 35000.75,
        "trend": 12.5
      },
      "prescriptions": {
        "today": 45,
        "thisWeek": 280,
        "thisMonth": 1150,
        "trend": 8.3
      },
      "inventory": {
        "totalItems": 75000,
        "lowStockItems": 1200,
        "expiredItems": 150,
        "totalValue": 112500
      }
    },
    "timeSeries": {
      "daily": [
        {
          "date": "2025-11-01",
          "revenue": 1200.00,
          "prescriptions": 45,
          "inventory": 75000
        }
      ],
      "weekly": [],
      "monthly": []
    },
    "topProducts": [
      {
        "id": "prod-0001",
        "name": "Paracetamol",
        "sales": 450,
        "revenue": 5400
      }
    ],
    "recentOrders": [
      {
        "id": "order-0001",
        "date": "2025-11-03",
        "amount": 250.50,
        "status": "completed"
      }
    ],
    "lastUpdated": "2025-12-03T13:33:00Z"
  },
  "timestamp": "2025-12-03T13:33:00Z"
}
```

### Metrics Summary

```
GET /api/analytics/metrics/:pharmacyId
```

Get metrics summary for current month.

**Response:**
```json
{
  "success": true,
  "data": {
    "pharmacyId": "pharmacy-001",
    "totalRevenue": 35000.75,
    "totalPrescriptions": 1150,
    "averageOrderValue": 30.43,
    "inventoryValue": 112500,
    "lastUpdated": "2025-12-03T13:33:00Z"
  },
  "timestamp": "2025-12-03T13:33:00Z"
}
```

### Revenue Trends

```
GET /api/analytics/revenue/:pharmacyId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

Get revenue trends for a specific date range.

**Query Parameters (Required):**
- `startDate`: YYYY-MM-DD format
- `endDate`: YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-01",
      "value": 1200.00
    },
    {
      "date": "2025-11-02",
      "value": 1450.50
    }
  ],
  "timestamp": "2025-12-03T13:33:00Z"
}
```

### Prescription Trends

```
GET /api/analytics/prescriptions/:pharmacyId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

Get prescription trends for a specific date range.

**Query Parameters (Required):**
- `startDate`: YYYY-MM-DD format
- `endDate`: YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-01",
      "value": 45
    },
    {
      "date": "2025-11-02",
      "value": 52
    }
  ],
  "timestamp": "2025-12-03T13:33:00Z"
}
```

## Testing

### Run All Tests

```bash
# Unit and integration tests with coverage
npm test

# Watch mode for development
npm test:watch

# Debug mode
npm test:debug
```

### Test Files

- `src/__tests__/analytics.service.test.ts` - Service business logic tests
- `src/__tests__/analytics.controller.test.ts` - API endpoint tests

### Coverage Requirements

- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Formatting

```bash
# Format code with Prettier
npm run format
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Application environment (development/production)
- `ANALYTICS_SERVICE_PORT` - Service port (default: 4009)
- `CORS_ORIGIN` - Allowed CORS origins
- `LOG_LEVEL` - Logging verbosity

## Architecture

### Directory Structure

```
src/
  ├── controllers/      # HTTP request handlers
  ├── services/        # Business logic
  ├── models/          # Data types and interfaces
  └── __tests__/       # Test files
```

### Data Flow

1. **Controller** - Receives HTTP request, validates input
2. **Service** - Processes business logic, calculates metrics
3. **Response** - Returns formatted JSON response

### Mock Data

Currently uses in-memory mock data initialized in `AnalyticsService`. In production, replace with actual database queries.

## Performance Considerations

- Dashboard loads within 500ms for 30-day range
- Time series aggregations cached at request time
- Pagination available for large datasets

## Future Enhancements

- Database integration for persistent data
- Real-time data updates via WebSocket
- Advanced filtering and custom date ranges
- Export functionality (PDF, CSV)
- Comparison analytics (period-over-period)
- Predictive analytics with AI/ML
- Custom report generation
- Role-based access control

## License

Proprietary - MetaPharm Connect
