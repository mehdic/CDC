# MetaPharm Connect - Load & Performance Tests

## Overview

This directory contains comprehensive load and performance tests for MetaPharm Connect using **k6** (formerly Loadimpact). These tests validate system performance under realistic and stress conditions.

## Test Files

### 1. Prescription Processing Load Test
**File**: `prescription-load.js`
**Task ID**: T5-040
**Target**: 1000 prescriptions/hour

**Test Scenarios**:
- Patient prescription uploads (70% of traffic)
- Pharmacist prescription review workflows (30% of traffic)

**Performance Targets**:
- Upload p95 < 1000ms
- OCR transcription p95 < 10000ms (AWS Textract external service)
- Validation p95 < 500ms
- Approval p95 < 500ms
- Error rate < 1%

**Load Pattern**:
- Baseline: 8 VUs (50% target load)
- Peak: 17 VUs (100% target load)
- Stress: 25 VUs (150% target load)
- Duration: ~19 minutes total

---

### 2. Real-time Delivery Tracking Load Test
**File**: `delivery-load.js`
**Task ID**: T5-041
**Target**: 500 concurrent delivery tracking sessions

**Test Scenarios**:
- Delivery personnel GPS tracking (40% of traffic)
  - GPS updates every 5 seconds
  - Location accuracy tracking

- Real-time WebSocket tracking (30% of traffic)
  - Customer receiving live delivery updates
  - Connection stability for 30+ seconds

- Customer delivery status checks (20% of traffic)
  - REST API status queries
  - ETA and location data

- Bulk status updates (10% of traffic)
  - Batch location updates for multiple deliveries

**Performance Targets**:
- GPS updates < 100ms latency
- WebSocket message latency < 100ms p95
- Status check response < 500ms p95
- 500 concurrent connections supported
- Error rate < 1%

**Load Pattern**:
- Baseline: 250 VUs (50% target)
- Peak: 500 VUs (100% target)
- Stress: 750 VUs (150% target)
- Duration: ~20 minutes total

---

### 3. Messaging Throughput Load Test
**File**: `messaging-load.js`
**Task ID**: T5-042
**Target**: 1000 messages/minute

**Test Scenarios**:
- Text message sending (45% of traffic)
  - End-to-end encryption
  - User-to-user messaging

- Messages with file attachments (20% of traffic)
  - Prescription documents (1-5 MB)
  - Encrypted file storage

- WhatsApp webhook processing (15% of traffic)
  - Incoming message handling
  - Webhook signature validation

- Notification delivery (10% of traffic)
  - Push notifications
  - Multi-channel notifications (push, email)

- Conversation history retrieval (10% of traffic)
  - Message pagination
  - Decryption overhead

**Performance Targets**:
- Text message send < 500ms p95
- Encryption overhead < 50ms p95
- File attachment upload < 5s p95 (for 1-5 MB files)
- WhatsApp webhook processing < 1s p95
- Notification delivery < 1s p95
- End-to-end message latency < 1s p95
- Error rate < 1%

**Load Pattern**:
- Baseline: 100 VUs (~500 msg/min)
- Peak: 200 VUs (~1000 msg/min)
- Stress: 300 VUs (~1500 msg/min)
- Duration: ~19 minutes total

---

## Prerequisites

### Installation

#### macOS (using Homebrew)
```bash
brew install k6
```

#### Ubuntu/Debian
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Windows (using Chocolatey)
```bash
choco install k6
```

#### Docker
```bash
docker run -i grafana/k6 run - <prescription-load.js
```

### Verify Installation
```bash
k6 version
```

---

## Running Load Tests

### Basic Execution

#### Run Prescription Load Test
```bash
cd /path/to/backend/tests/load
k6 run prescription-load.js
```

#### Run Delivery Tracking Load Test
```bash
k6 run delivery-load.js
```

#### Run Messaging Load Test
```bash
k6 run messaging-load.js
```

#### Run All Load Tests (Sequential)
```bash
k6 run prescription-load.js
k6 run delivery-load.js
k6 run messaging-load.js
```

---

### Advanced Execution Options

#### Custom API Base URL
```bash
k6 run \
  --env API_BASE_URL=https://api.staging.metapharm.com \
  prescription-load.js
```

#### Custom Virtual Users (VUs)
```bash
# Override stages with fixed VUs for duration
k6 run \
  --vus 100 \
  --duration 5m \
  prescription-load.js
```

#### Custom Ramp Profile
```bash
# Ramp to 200 VUs over 2 minutes, maintain for 5 minutes
k6 run \
  --stage 2m:200 \
  --stage 5m:200 \
  --stage 1m:0 \
  delivery-load.js
```

#### Increase Test Duration
```bash
# Extend stress testing for longer stability verification
k6 run \
  --duration 30m \
  messaging-load.js
```

---

### Output and Metrics

#### Standard Output (Console)
```bash
k6 run prescription-load.js
```

Output includes:
- Real-time request/response metrics
- VU count over time
- Threshold results (PASS/FAIL)
- Summary statistics (min, max, avg, p95, p99)

#### JSON Output (for CI/CD Integration)
```bash
k6 run --out json=results.json prescription-load.js
```

#### CSV Output (for Excel Analysis)
```bash
k6 run prescription-load.js > results.csv
```

#### InfluxDB Output (for Live Dashboards)
```bash
# Requires InfluxDB running on localhost:8086
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  prescription-load.js
```

---

### Integration with Grafana Cloud

#### Export to Grafana Cloud (Cloud Execution)
```bash
# 1. Create Grafana account and project
# 2. Get your API token from Grafana Cloud

# 3. Run tests on Grafana Cloud infrastructure
k6 login cloud
k6 cloud prescription-load.js
```

Benefits of Cloud Execution:
- Distributed load generation from multiple regions
- Real-time dashboard visualization
- Permanent results storage
- Advanced analytics

---

## Environment Variables

Configure tests using environment variables:

```bash
# API Configuration
export API_BASE_URL=http://localhost:4002
export WS_BASE_URL=ws://localhost:4002

# Authentication Tokens (for load testing)
export PATIENT_TOKEN=mock-patient-token
export PHARMACIST_TOKEN=mock-pharmacist-token
export DELIVERY_PERSONNEL_TOKEN=mock-delivery-token
export CUSTOMER_TOKEN=mock-customer-token
export SENDER_TOKEN=mock-sender-token
export RECEIVER_TOKEN=mock-receiver-token

# Test Configuration
export TEST_DURATION=5m
export TEST_VUS=100
```

#### Using a .env File
Create `.env.load` file:
```bash
API_BASE_URL=http://localhost:4002
WS_BASE_URL=ws://localhost:4002
PATIENT_TOKEN=test-patient-token
PHARMACIST_TOKEN=test-pharmacist-token
```

Load environment variables:
```bash
set -a
source .env.load
set +a

k6 run prescription-load.js
```

---

## Success Criteria

### Prescription Processing Load Test (T5-040)

| Metric | Target | Status |
|--------|--------|--------|
| p95 upload duration | < 1000ms | - |
| p95 OCR duration | < 10000ms | - |
| p95 validation duration | < 500ms | - |
| p95 approval duration | < 500ms | - |
| Prescription upload success rate | > 99% | - |
| HTTP error rate | < 1% | - |
| Peak VUs | 17 (100% load) | - |

### Delivery Tracking Load Test (T5-041)

| Metric | Target | Status |
|--------|--------|--------|
| p95 GPS update latency | < 100ms | - |
| p95 WebSocket message latency | < 100ms | - |
| p95 status check duration | < 500ms | - |
| GPS update success rate | > 99% | - |
| WebSocket connection errors | < 50 | - |
| Peak concurrent sessions | 500 VUs | - |
| HTTP error rate | < 1% | - |

### Messaging Throughput Load Test (T5-042)

| Metric | Target | Status |
|--------|--------|--------|
| p95 message send duration | < 500ms | - |
| p95 encryption overhead | < 50ms | - |
| p95 attachment upload | < 5000ms | - |
| p95 WhatsApp webhook | < 1000ms | - |
| p95 notification delivery | < 1000ms | - |
| Message send success rate | > 99% | - |
| Peak messages/minute | 1000 msg/min | - |
| HTTP error rate | < 1% | - |

---

## Interpreting Results

### Understanding Key Metrics

**p95 (95th Percentile)**
- 95% of requests complete within this time
- Reflects typical user experience
- More representative than average

**Success Rate**
- Percentage of requests that succeeded
- Target: > 99% (< 1% error rate)
- Investigate failures during stress phases

**Throughput**
- Requests per second (rps)
- Indicates system capacity
- Should remain stable during peak load

**VU (Virtual Users)**
- Number of concurrent users
- Ramps from baseline → peak → stress
- Monitor resource usage during ramps

### Typical Results

#### Healthy Performance
```
✓ Prescription Upload: p95=850ms, success=99.8%
✓ Delivery GPS Update: p95=75ms, success=99.9%
✓ Message Send: p95=450ms, success=99.7%
```

#### Warning Signs
```
⚠ p95 > threshold (indicates degradation)
⚠ Success rate < 99% (check error logs)
⚠ Response time increases with VUs (capacity concern)
⚠ WebSocket connection errors (stability issue)
```

#### Failure Indicators
```
✗ Thresholds exceeded (test fails)
✗ High error rates during baseline (infrastructure issue)
✗ Memory/CPU at 100% (resource exhaustion)
✗ Database connection pool exhausted
```

---

## Debugging Failed Tests

### Enable Verbose Logging
```bash
k6 run -v prescription-load.js
```

### Show All HTTP Details
```bash
k6 run --http-debug prescription-load.js
```

### Detailed Error Information
```bash
k6 run prescription-load.js 2>&1 | grep -i "error\|failed\|timeout"
```

### Common Issues and Solutions

#### Issue: "Connection Refused"
```bash
# Solution: Ensure API services are running
ps aux | grep node
# Start services if needed:
cd /path/to/services
npm run dev
```

#### Issue: "Timeout Exceeded"
```bash
# Solution: Increase k6 timeout
k6 run \
  --timeout 30s \
  prescription-load.js
```

#### Issue: "Certificate Error"
```bash
# Solution: Disable certificate validation (development only)
k6 run \
  --insecure-skip-tls-verify \
  prescription-load.js
```

#### Issue: "Out of Memory"
```bash
# Solution: Reduce VUs or duration
k6 run \
  --vus 50 \
  --duration 5m \
  prescription-load.js
```

---

## Performance Tuning

### Server-side Optimization

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Use connection pooling (PgBouncer)
   - Monitor slow query logs

2. **Caching Strategy**
   - Implement Redis caching for frequently accessed data
   - Cache API responses (10-60 second TTL)
   - Cache authentication tokens

3. **Load Balancing**
   - Distribute load across multiple API instances
   - Use Nginx or HAProxy
   - Enable sticky sessions for WebSocket connections

4. **Resource Scaling**
   - Increase database connections
   - Add more API server instances
   - Allocate more memory to services
   - Scale WebSocket server separately

### Client-side Optimization (k6)

1. **Connection Reuse**
   - Already enabled in test options
   - Reduces overhead of establishing new connections

2. **Request Pipelining**
   - Send multiple requests without waiting for responses
   - Supported in k6 with concurrent functions

3. **Data Generation**
   - Pre-generate test data instead of generating during test
   - Use external data files for large payloads

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6

      - name: Start API Services
        run: |
          cd backend
          npm install
          npm run build
          npm run dev &
          sleep 10

      - name: Run Load Tests
        run: |
          cd backend/tests/load
          k6 run --out json=results.json prescription-load.js
          k6 run --out json=delivery-results.json delivery-load.js
          k6 run --out json=messaging-results.json messaging-load.js

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: backend/tests/load/results.json

      - name: Report Results
        if: always()
        run: |
          echo "# Load Test Results" >> $GITHUB_STEP_SUMMARY
          echo "See attached artifacts for detailed results" >> $GITHUB_STEP_SUMMARY
```

---

## Best Practices

1. **Run Regularly**
   - Execute load tests as part of CI/CD pipeline
   - Run after major code changes
   - Establish performance baselines

2. **Monitor Resources**
   - CPU, Memory, Network usage during tests
   - Database connection pool status
   - Cache hit rates

3. **Test Realistic Scenarios**
   - Match production traffic patterns
   - Include realistic think time (delays)
   - Use realistic data sizes and types

4. **Isolate Tests**
   - Run against dedicated test environment
   - Clean database between test runs
   - Disable external service integrations

5. **Document Results**
   - Save baseline results
   - Track performance trends over time
   - Document any threshold changes

6. **Alert on Degradation**
   - Set up monitoring for performance regressions
   - Alert if p95 exceeds baseline
   - Track error rate trends

---

## Performance Baselines

### Expected Performance (On Standard Infrastructure)

**Prescription Processing**
- Upload: p95 ~800-900ms
- OCR: p95 ~8000-9000ms
- Validation: p95 ~300-400ms

**Delivery Tracking**
- GPS Update: p95 ~50-80ms
- WebSocket: p95 ~30-80ms latency
- Status Check: p95 ~300-400ms

**Messaging**
- Text Message: p95 ~350-450ms
- Attachment Upload: p95 ~2000-4000ms
- WhatsApp Webhook: p95 ~500-800ms

---

## Troubleshooting

### Memory Issues
- Reduce VUs
- Reduce test duration
- Use `--no-connection-reuse` if needed

### Database Connection Errors
- Increase max connections in PostgreSQL
- Use connection pooling (PgBouncer)
- Optimize slow queries

### WebSocket Stability Issues
- Check WebSocket server capacity
- Monitor memory leaks in server code
- Use separate WebSocket server instances

### Network Bottlenecks
- Check network bandwidth utilization
- Monitor packet loss
- Consider network scaling

---

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 API Reference](https://k6.io/docs/api/)
- [k6 Threshold Syntax](https://k6.io/docs/using-k6/thresholds/)
- [k6 Metrics Guide](https://k6.io/docs/using-k6/metrics/)
- [Performance Testing Best Practices](https://k6.io/blog/how-to-run-load-tests-efficiently/)

---

## Support and Questions

For questions about these load tests:
1. Check the test file comments
2. Review k6 documentation
3. Consult with the DevOps team
4. Check performance baselines

---

**Last Updated**: 2025-12-03
**Status**: Active
**Test Coverage**: Phase 5 (D2 - Load & Performance Tests)
