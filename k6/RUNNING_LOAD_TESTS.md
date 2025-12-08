# Running Load Tests - MetaPharm Connect

This guide provides practical instructions for running load tests locally and in CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing](#local-testing)
3. [CI/CD Execution](#cicd-execution)
4. [Interpreting Results](#interpreting-results)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Installation

**macOS (Homebrew):**
```bash
brew install k6
k6 version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install k6
k6 version
```

**Windows (Chocolatey):**
```bash
choco install k6
k6 version
```

**Verify Installation:**
```bash
k6 version
# Expected output: k6 v1.4.2 (or later)
```

### Environment Setup

Create a `.env` file in the project root with test credentials:

```bash
# Base API URL
BASE_URL=http://localhost:3000

# WebSocket URL
WS_URL=ws://localhost:3000

# Authentication token (JWT or test token)
AUTH_TOKEN=your-jwt-token-here
```

Or set environment variables directly:

```bash
export BASE_URL=http://localhost:3000
export WS_URL=ws://localhost:3000
export AUTH_TOKEN=test-token
```

---

## Local Testing

### Verify All Scripts Work

Quick 1-second smoke test to verify all scripts are functional:

```bash
# Test all 5 scripts
for script in k6/scripts/*.js; do
  echo "Testing: $(basename $script)"
  k6 run --duration 1s --vus 1 "$script" 2>&1 | tail -3
done
```

### Run Individual Tests

#### 1. Prescription Processing Test

**Full test (7.5 minutes):**
```bash
k6 run k6/scripts/prescription-processing.js
```

**Smoke test (1 minute with 10 VUs):**
```bash
k6 run \
  --stage "30s:10" \
  --stage "30s:0" \
  k6/scripts/prescription-processing.js
```

**Custom environment:**
```bash
BASE_URL=https://staging.metapharm-connect.com \
  k6 run k6/scripts/prescription-processing.js
```

**With JSON export:**
```bash
k6 run \
  --out json=results/prescription-results.json \
  --summary-export=results/prescription-summary.json \
  k6/scripts/prescription-processing.js
```

**Expected Results:**
- ✅ p95 latency < 5000ms
- ✅ Error rate < 5%
- ✅ Successful completion of upload, validation, and processing tests

---

#### 2. Delivery Tracking Test

**Full test (9 minutes):**
```bash
WS_URL=ws://localhost:3000 \
  k6 run k6/scripts/delivery-tracking.js
```

**With staging environment:**
```bash
WS_URL=wss://staging.metapharm-connect.com \
  k6 run k6/scripts/delivery-tracking.js
```

**Expected Results:**
- ✅ p95 message latency < 2000ms
- ✅ Connection success rate > 95%
- ✅ Message error rate < 10%

---

#### 3. Messaging Throughput Test

**Full test (8 minutes):**
```bash
k6 run k6/scripts/messaging.js
```

**Monitor throughput:**
```bash
k6 run \
  --out json=results/messaging-results.json \
  k6/scripts/messaging.js
```

**Expected Results:**
- ✅ 1000+ messages/minute
- ✅ p95 latency < 1000ms
- ✅ In-app messages < 500ms
- ✅ Email/WhatsApp < 2000ms

---

#### 4. API Gateway Test

**Full test (9.5 minutes):**
```bash
k6 run k6/scripts/api-gateway.js
```

**Large scale load test:**
```bash
BASE_URL=https://staging.metapharm-connect.com \
  k6 run k6/scripts/api-gateway.js
```

**Expected Results:**
- ✅ p95 latency < 500ms
- ✅ Health checks < 100ms
- ✅ Auth latency < 500ms
- ✅ Error rate < 5%

---

#### 5. Database Query Performance Test

**Full test (8 minutes):**
```bash
k6 run k6/scripts/database-queries.js
```

**With output to file:**
```bash
k6 run \
  --out json=results/database-results.json \
  k6/scripts/database-queries.js
```

**Expected Results:**
- ✅ Simple queries < 100ms
- ✅ JOIN queries < 500ms
- ✅ Aggregation queries < 2000ms
- ✅ Error rate < 5%
- ✅ Slow query rate < 2%

---

### Run All Tests Sequentially

```bash
#!/bin/bash
# Run all load tests sequentially

set -e  # Exit on first error

echo "=========================================="
echo "MetaPharm Connect - Load Testing Suite"
echo "=========================================="
echo ""

BASE_URL=${BASE_URL:-http://localhost:3000}
WS_URL=${WS_URL:-ws://localhost:3000}

echo "Target URL: $BASE_URL"
echo "WebSocket URL: $WS_URL"
echo ""

# 1. Prescription Processing
echo "[1/5] Running Prescription Processing Load Test..."
k6 run \
  --out json=results/prescription-results.json \
  --summary-export=results/prescription-summary.json \
  k6/scripts/prescription-processing.js
echo "✅ Prescription test complete"
echo ""

# 2. Delivery Tracking
echo "[2/5] Running Delivery Tracking Load Test..."
WS_URL=$WS_URL k6 run \
  --out json=results/delivery-results.json \
  --summary-export=results/delivery-summary.json \
  k6/scripts/delivery-tracking.js
echo "✅ Delivery test complete"
echo ""

# 3. Messaging
echo "[3/5] Running Messaging Throughput Load Test..."
k6 run \
  --out json=results/messaging-results.json \
  --summary-export=results/messaging-summary.json \
  k6/scripts/messaging.js
echo "✅ Messaging test complete"
echo ""

# 4. API Gateway
echo "[4/5] Running API Gateway Load Test..."
k6 run \
  --out json=results/api-gateway-results.json \
  --summary-export=results/api-gateway-summary.json \
  k6/scripts/api-gateway.js
echo "✅ API Gateway test complete"
echo ""

# 5. Database Queries
echo "[5/5] Running Database Query Performance Load Test..."
k6 run \
  --out json=results/database-results.json \
  --summary-export=results/database-summary.json \
  k6/scripts/database-queries.js
echo "✅ Database test complete"
echo ""

echo "=========================================="
echo "All tests completed successfully!"
echo "Results saved to: results/"
echo "=========================================="
```

Save as `run-all-tests.sh`, then:

```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

---

## CI/CD Execution

### Manual Trigger

Trigger load tests from GitHub Actions via the command line:

```bash
# Ensure you have gh CLI installed
# https://cli.github.com/

# Trigger with staging environment
gh workflow run load-tests.yml \
  -f environment=staging \
  -f duration=5m \
  -f vus=50

# Trigger with QA environment
gh workflow run load-tests.yml \
  -f environment=qa \
  -f duration=10m \
  -f vus=100
```

### Scheduled Execution

Load tests run automatically on schedule:

**Default:** Weekly on Sunday at 2 AM UTC

To change the schedule, edit `.github/workflows/load-tests.yml`:

```yaml
schedule:
  # Current: Sunday 2 AM UTC
  - cron: '0 2 * * 0'

  # For daily at midnight UTC:
  # - cron: '0 0 * * *'

  # For weekdays at 3 AM UTC:
  # - cron: '0 3 * * 1-5'
```

### Workflow Details

The CI/CD workflow (`.github/workflows/load-tests.yml`):
1. Checks out code
2. Installs k6 v1.4.2
3. Runs all 5 load test scripts
4. Exports results as JSON
5. Generates performance report
6. Uploads artifacts (retained 30 days)
7. Comments results on PR (if applicable)

### Accessing Results

After workflow completes:

1. **Go to Actions tab** on GitHub
2. **Click "Load Testing" workflow**
3. **Select the latest run**
4. **Download artifacts:**
   - `k6-load-test-results` - Detailed JSON results
   - `performance-report` - Summary markdown report

---

## Interpreting Results

### Key Metrics

All tests report these metrics:

| Metric | What it Measures | Good Value |
|--------|------------------|-----------|
| p95 latency | 95% of requests faster than this | < threshold |
| p99 latency | 99% of requests faster than this | < threshold |
| error_rate | % of failed requests | < 5% |
| throughput | requests/messages per second | > target |
| success_count | Total successful operations | high |
| failure_count | Total failed operations | low |

### Reading JSON Results

```bash
# Pretty print JSON results
jq '.' results/prescription-results.json | head -50

# Extract specific metrics
jq '.metrics."prescription_upload_duration"' results/prescription-results.json

# Get summary statistics
jq '.metrics | keys' results/prescription-results.json
```

### Threshold Compliance

Check if tests passed threshold requirements:

```bash
# Look for threshold errors in output
k6 run k6/scripts/prescription-processing.js 2>&1 | grep -i "threshold\|failed\|error"

# If you see "thresholds on metrics ... have been crossed"
# → Check PERFORMANCE_BASELINES.md for expected values
# → Review the test output for specific metric values
```

### Example: Interpreting Prescription Processing Results

```
✓ [ 100% ] 100 VUs  7m30s

checks.........................: 100% ✓ 1000, ✗ 0
data_received..................: 150 kB
data_sent.......................: 50 kB
iteration_duration..............: avg=4.5s
iterations......................: 100 ✓

✓ prescription_processing_duration: [p(95)=2500ms p(99)=4000ms] < 3000ms
✓ prescription_upload_duration: [p(95)=4500ms p(99)=9000ms] < 5000ms, < 10000ms
✓ prescription_upload_errors: 0.00% < 5%
```

**Interpretation:**
- ✅ All checks passed
- ✅ All thresholds satisfied
- ✅ Test execution successful
- Insights: Upload taking ~4.5 seconds at p95 (within 5s threshold), validation fast at ~2.5s

---

## Troubleshooting

### Connection Refused

**Error:**
```
error: Post "http://localhost:3000/api/...": dial tcp [::1]:3000: connect: connection refused
```

**Solution:**
```bash
# Ensure target service is running
curl http://localhost:3000/health

# If not running, start the service first
# Check BASE_URL is correct
echo $BASE_URL

# Run test with explicit URL
BASE_URL=http://localhost:3000 k6 run k6/scripts/prescription-processing.js
```

### Permission Denied

**Error:**
```
error: open "k6/scripts/test.js": permission denied
```

**Solution:**
```bash
chmod +x k6/scripts/*.js
# Or
chmod 755 k6/scripts/
```

### Out of Memory

**Error:**
```
fatal: memory limit exceeded
```

**Solution:**
```bash
# Reduce VUs
k6 run \
  --stage "1m:10" \
  k6/scripts/prescription-processing.js

# Run on more powerful machine
# Or reduce test duration
```

### High Failure Rate

**Error:**
```
prescription_upload_errors: 150.00% (threshold: 5%)
```

**Solution:**
1. Check if API is responding: `curl -v http://localhost:3000/health`
2. Check API logs for errors
3. Verify AUTH_TOKEN is valid: `echo $AUTH_TOKEN`
4. Check network connectivity
5. Run with verbose logging: `k6 run --verbose k6/scripts/prescription-processing.js`

### WebSocket Connection Failed

**Error:**
```
ws.connect: tcp dial timeout
```

**Solution:**
```bash
# Verify WebSocket URL
echo $WS_URL

# Ensure WebSocket endpoint is available
wscat -c ws://localhost:3000/api/delivery/tracking/DEL-123 --execute

# Run test with explicit WS URL
WS_URL=ws://localhost:3000 k6 run k6/scripts/delivery-tracking.js
```

### Threshold Breach

**Error:**
```
thresholds on metrics 'gateway_errors' have been crossed
```

**Analysis:**
1. Check PERFORMANCE_BASELINES.md for expected thresholds
2. Review the test output for actual values
3. Determine if it's a real issue or a test data problem:
   - Real issue: API is actually slow/failing → investigate API
   - Test data: Connection refused, auth failed → fix test setup
4. If expected degradation, update thresholds in script and `config/thresholds.json`

---

## Best Practices

### Before Running Tests

- [ ] Ensure target service is running and healthy
- [ ] Verify AUTH_TOKEN is valid
- [ ] Check BASE_URL and WS_URL are correct
- [ ] Ensure adequate system resources (CPU, memory, network)
- [ ] Close unnecessary applications to free resources

### During Tests

- [ ] Monitor server logs for errors
- [ ] Check system resources (CPU, memory)
- [ ] Watch for network issues
- [ ] Note any anomalies

### After Tests

- [ ] Review results against baselines
- [ ] Compare with previous runs for trends
- [ ] Document any deviations
- [ ] Archive results for 90-day retention
- [ ] Update baselines if infrastructure changed

### Regression Detection

Track tests over time:

```bash
# Keep results organized by date
mkdir -p results/2025-12-08
k6 run --out json=results/2025-12-08/prescription.json \
  k6/scripts/prescription-processing.js

# Compare with previous week
# Check for > 10% degradation as warning sign
```

---

## Resources

- [K6 Official Documentation](https://k6.io/docs/)
- [K6 Best Practices](https://k6.io/docs/testing-guides/)
- [Performance Baselines](PERFORMANCE_BASELINES.md)
- [Audit Report](AUDIT_REPORT.md)

---

**Last Updated:** 2025-12-08
**Version:** 1.0
