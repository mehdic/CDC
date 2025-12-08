# K6 Load Testing Suite - MetaPharm Connect

This directory contains comprehensive load testing scripts for the MetaPharm Connect platform using k6, a modern load testing framework optimized for API performance testing.

## Overview

The k6 load testing suite validates that the MetaPharm Connect platform can handle production-like workloads across five critical scenarios:

1. **Prescription Processing:** 100 concurrent prescription uploads and processing
2. **Delivery Tracking:** 500 concurrent WebSocket connections for real-time tracking
3. **Messaging Throughput:** 1000+ messages per minute across multiple channels
4. **API Gateway:** 1000 concurrent requests across all service endpoints
5. **Database Queries:** Complex query performance under sustained load

## Directory Structure

```
k6/
├── README.md                          # This file
├── PERFORMANCE_BASELINES.md           # Performance baselines and regression alerts
├── scripts/                           # Load test scripts
│   ├── prescription-processing.js     # Prescription processing load test
│   ├── delivery-tracking.js           # WebSocket delivery tracking test
│   ├── messaging.js                   # Messaging throughput test
│   ├── api-gateway.js                 # API Gateway load test
│   └── database-queries.js            # Database query performance test
├── utils/                             # Shared utility functions
│   └── helpers.js                     # Common helper functions
├── config/                            # Configuration files
│   └── thresholds.json               # Performance thresholds and targets
└── results/                           # Load test results (generated)
    └── [test-results-*.json]         # JSON test results from k6
```

## Prerequisites

### Installation

1. **Install k6** (version 1.4.2 or later)

   macOS (Homebrew):
   ```bash
   brew install k6
   ```

   Linux (Ubuntu/Debian):
   ```bash
   sudo apt-get install k6
   ```

   Windows (Chocolatey):
   ```bash
   choco install k6
   ```

   Or download from: https://k6.io/docs/getting-started/installation/

2. **Verify Installation**
   ```bash
   k6 version
   ```

### Environment Variables

For local testing, set these environment variables:

```bash
# Base URL of the API
export BASE_URL=http://localhost:3000

# WebSocket URL (if different from BASE_URL)
export WS_URL=ws://localhost:3000

# Authentication token for protected endpoints
export AUTH_TOKEN=your-jwt-token-here
```

## Running Load Tests

### Quick Start

Run a single load test script:

```bash
k6 run k6/scripts/prescription-processing.js
```

### Individual Load Tests

#### 1. Prescription Processing Test
```bash
k6 run k6/scripts/prescription-processing.js

# With custom environment
BASE_URL=https://staging.metapharm-connect.com k6 run k6/scripts/prescription-processing.js

# With summary export
k6 run --summary-export=results/prescription-summary.json k6/scripts/prescription-processing.js
```

**Duration:** ~5 minutes
**Target Load:** 100 concurrent users
**Key Metrics:** Upload latency, processing time, error rate

#### 2. Delivery Tracking Test
```bash
k6 run k6/scripts/delivery-tracking.js

# With custom WebSocket URL
WS_URL=wss://staging.metapharm-connect.com k6 run k6/scripts/delivery-tracking.js
```

**Duration:** ~8 minutes
**Target Load:** 500 concurrent WebSocket connections
**Key Metrics:** Message latency, connection success rate, message error rate

#### 3. Messaging Throughput Test
```bash
k6 run k6/scripts/messaging.js

# Target 1000+ messages per minute
BASE_URL=https://staging.metapharm-connect.com k6 run k6/scripts/messaging.js
```

**Duration:** ~6 minutes
**Target Load:** 200 concurrent users
**Key Metrics:** Message throughput, delivery time, channel-specific latency

#### 4. API Gateway Test
```bash
k6 run k6/scripts/api-gateway.js

# Large-scale load test
BASE_URL=https://staging.metapharm-connect.com k6 run k6/scripts/api-gateway.js
```

**Duration:** ~9 minutes
**Target Load:** 1000 concurrent requests
**Key Metrics:** Gateway latency, routing success, cache hit rate

#### 5. Database Query Performance Test
```bash
k6 run k6/scripts/database-queries.js

# Monitor database performance
BASE_URL=https://staging.metapharm-connect.com k6 run k6/scripts/database-queries.js
```

**Duration:** ~6 minutes
**Target Load:** 100 concurrent users
**Key Metrics:** Query latency by type, slow query rate, error rate

### Running All Tests

Execute all load tests sequentially:

```bash
#!/bin/bash
# Run all load tests

echo "Starting comprehensive load test suite..."

echo "1. Prescription Processing Test..."
k6 run k6/scripts/prescription-processing.js

echo "2. Delivery Tracking Test..."
k6 run k6/scripts/delivery-tracking.js

echo "3. Messaging Throughput Test..."
k6 run k6/scripts/messaging.js

echo "4. API Gateway Test..."
k6 run k6/scripts/api-gateway.js

echo "5. Database Query Performance Test..."
k6 run k6/scripts/database-queries.js

echo "All load tests completed!"
```

### Advanced Options

#### Output Results to JSON
```bash
k6 run --out json=results/test-results.json k6/scripts/prescription-processing.js
```

#### Export Summary
```bash
k6 run --summary-export=results/summary.json k6/scripts/prescription-processing.js
```

#### Combined Output
```bash
k6 run \
  --out json=results/detailed.json \
  --summary-export=results/summary.json \
  k6/scripts/prescription-processing.js
```

#### Smoke Test (Reduced Load)
```bash
# Run with minimal load for quick validation
k6 run \
  --stage "30s:10" \
  k6/scripts/prescription-processing.js
```

#### Custom Stage Configuration
```bash
k6 run \
  --stage "1m:50" \
  --stage "5m:50" \
  --stage "1m:0" \
  k6/scripts/api-gateway.js
```

## Performance Baselines

Refer to `PERFORMANCE_BASELINES.md` for:

- Detailed performance baselines for each scenario
- Target latency and error rate specifications
- Regression alert thresholds
- Historical trend analysis
- Performance improvement targets

### Key Baseline Summary

| Scenario | Target | P95 | P99 | Status |
|----------|--------|-----|-----|--------|
| Prescription Upload | 100 VUs | < 5000ms | < 10000ms | ✅ |
| Delivery Tracking | 500 Connections | < 2000ms | < 5000ms | ✅ |
| Messaging Throughput | 1000+ msg/min | < 1000ms | < 3000ms | ✅ |
| API Gateway | 1000 Requests | < 500ms | < 1000ms | ✅ |
| Database Queries | 100 VUs | < 1000ms | < 3000ms | ✅ |

## CI/CD Integration

### GitHub Actions Workflow

Load tests are automatically executed via `.github/workflows/load-tests.yml`

#### Manual Trigger
```bash
# Trigger load tests via GitHub CLI
gh workflow run load-tests.yml \
  -f environment=staging \
  -f duration=10m \
  -f vus=100
```

#### Workflow Inputs
- **environment:** `staging` or `qa` (default: staging)
- **duration:** Test duration (default: 5m)
- **vus:** Number of virtual users (default: 50)

#### Automatic Schedule
- **Frequency:** Weekly on Sunday at 02:00 UTC
- **Configuration:** `.github/workflows/load-tests.yml` → `schedule` section

#### Workflow Outputs
- Test results exported as JSON artifacts
- Performance report generated and uploaded
- Results commented on related PRs (if applicable)

## Understanding K6 Scripts

### Script Structure

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up
    { duration: '1m', target: 50 },   // Stay
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

// 2. Test function (runs for each VU)
export default function () {
  const res = http.get('https://example.com');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

### Common Patterns

#### HTTP Requests
```javascript
// GET request
const res = http.get('https://example.com');

// POST with JSON body
const res = http.post('https://example.com/api', JSON.stringify({
  key: 'value'
}), {
  headers: { 'Content-Type': 'application/json' }
});
```

#### Checks
```javascript
check(response, {
  'condition name': (r) => r.status === 200,
  'latency check': (r) => r.timings.duration < 1000,
});
```

#### Custom Metrics
```javascript
import { Rate, Counter, Trend } from 'k6/metrics';

const errors = new Rate('errors');
const success = new Counter('success');
const duration = new Trend('duration');

// Use metrics
errors.add(1);
success.add(1);
duration.add(timingMs);
```

#### WebSocket Testing
```javascript
import ws from 'k6/ws';

const url = 'wss://example.com/ws';
const res = ws.connect(url, function(socket) {
  socket.send('message');
  socket.on('message', (data) => {
    console.log(data);
  });
});
```

## Troubleshooting

### Common Issues

#### "Connection Refused"
**Problem:** Cannot connect to target API
```
error: Post "http://localhost:3000/api/...": dial tcp [::1]:3000: connect: connection refused
```

**Solution:**
- Ensure API server is running on the specified port
- Check BASE_URL environment variable
- Verify network connectivity

#### "Permission Denied"
**Problem:** Unable to read test files
```
error: open "k6/scripts/test.js": permission denied
```

**Solution:**
```bash
chmod +x k6/scripts/*.js
```

#### "Out of Memory"
**Problem:** Test uses too much memory
```
fatal: memory limit exceeded
```

**Solution:**
- Reduce number of concurrent users
- Run test on more powerful machine
- Reduce test duration

#### "High Failure Rate"
**Problem:** Tests fail with high error rate
```
http_req_failed: rate<0.05
```

**Debugging:**
```bash
# Add verbose logging
k6 run --verbose k6/scripts/test.js

# Check response bodies for errors
k6 run --linger k6/scripts/test.js
```

### Performance Diagnosis

#### Slow Test Execution
```bash
# Check system resources during test
k6 run \
  --vus=10 \
  --duration=30s \
  k6/scripts/prescription-processing.js
```

#### Memory Profiling
```bash
# Monitor memory usage
watch 'ps aux | grep k6'
```

#### Analyzing Results
```bash
# Pretty print JSON results
jq '.' results/test-results.json | less

# Filter specific metrics
jq '.metrics | keys' results/test-results.json

# Get summary statistics
jq '.metrics.http_req_duration.values' results/test-results.json
```

## Extending the Test Suite

### Adding New Scenarios

1. Create new script in `k6/scripts/`:
   ```bash
   cp k6/scripts/template.js k6/scripts/new-scenario.js
   ```

2. Implement test logic:
   ```javascript
   export const options = {
     stages: [/* your stages */],
     thresholds: {/* your thresholds */},
   };

   export default function () {
     // Your test logic
   }
   ```

3. Update `PERFORMANCE_BASELINES.md` with new baselines

4. Update workflow to include new scenario

### Adding Custom Metrics

```javascript
import { Rate, Counter, Trend, Gauge } from 'k6/metrics';

const customErrors = new Rate('custom_errors');
const requests = new Counter('requests');
const latency = new Trend('latency');
const activeUsers = new Gauge('active_users');

export default function () {
  // Use metrics
  latency.add(timingMs);
  requests.add(1);
  if (error) customErrors.add(1);
}
```

## Best Practices

### Load Test Design
- Start with realistic user behavior
- Gradually ramp up to peak load
- Test during off-peak hours
- Document all assumptions
- Include both success and error paths

### Script Development
- Use meaningful metric names
- Add descriptive comments
- Handle edge cases gracefully
- Validate test data format
- Use helper functions for reusability

### Results Analysis
- Compare against baselines
- Identify slow endpoints
- Track trends over time
- Document deviations
- Share findings with team

## Resources

### K6 Documentation
- Official Guide: https://k6.io/docs/
- API Reference: https://k6.io/docs/javascript-api/
- Best Practices: https://k6.io/docs/testing-guides/
- Community Extensions: https://k6.io/docs/extensions/

### Performance Testing
- Load Testing Best Practices: https://k6.io/docs/testing-guides/load-testing-guide/
- Stress Testing: https://k6.io/docs/testing-guides/stress-testing/
- Spike Testing: https://k6.io/docs/testing-guides/spike-testing/
- Soak Testing: https://k6.io/docs/testing-guides/soak-testing/

## Support

For issues or questions about the load testing suite:

1. Check `PERFORMANCE_BASELINES.md` for performance targets
2. Review script comments for implementation details
3. Check GitHub issues for known problems
4. Contact the QUALITY-LOAD team

## License

This load testing suite is part of the MetaPharm Connect project and follows the same license as the main repository.

---

**Last Updated:** 2025-12-08
**Maintained By:** QUALITY-LOAD Team
**Version:** 1.0.0
