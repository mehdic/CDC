# Performance and Load Testing Suite

## Overview

Comprehensive performance testing suite for MetaPharm Connect web application implementing T8-051 requirements.

## Components

### 1. Frontend Performance Tests (Playwright)

Located in `e2e/tests/performance/`

- **page-load-benchmark.spec.ts**: Page load time measurements (P95 < 200ms)
- **core-web-vitals.spec.ts**: Google Core Web Vitals (LCP, FID, CLS)
- **resource-timing.spec.ts**: Network latency, memory profiling, resource analysis

### 2. Backend Load Tests (k6)

Located in `load-tests/scripts/`

- **api-load-test.js**: API load testing with 100/500/1000 concurrent users
- **spike-test.js**: Sudden traffic spike simulation
- **user-journey-load.js**: Realistic user journey under load

### 3. Performance Utilities

Located in `load-tests/utils/`

- **thresholds.js**: Centralized threshold configuration
- **save-baseline.js**: Save performance baselines
- **compare-metrics.js**: Regression detection

## Installation

### Prerequisites

```bash
# Install k6 (load testing tool)
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Usage

### Frontend Performance Tests

```bash
# Run all performance tests
npm run test:perf

# Run with UI (interactive)
npm run test:perf:ui

# Run specific test
npx playwright test e2e/tests/performance/page-load-benchmark.spec.ts
```

### Load Tests

```bash
# Run API load test with 100 users (baseline)
npm run test:load:100

# Run with 500 users (normal peak)
npm run test:load:500

# Run with 1000 users (stress test)
npm run test:load:1000

# Run all load levels sequentially
npm run test:load:all

# Run spike test
npm run test:load:spike

# Run user journey test
npm run test:load:journey
```

### Performance Regression Detection

```bash
# 1. Run tests and save baseline
npm run test:load
npm run perf:baseline

# 2. After code changes, run tests again
npm run test:load

# 3. Compare against baseline
npm run perf:compare
```

## Performance Thresholds

### Page Load (Frontend)
- P95 page load time: **< 200ms**
- First Contentful Paint (FCP): **< 1.8s**
- Largest Contentful Paint (LCP): **< 2.5s**
- Cumulative Layout Shift (CLS): **< 0.1**
- Time to Interactive (TTI): **< 3.8s**

### API Response Time (Backend)
- P95 response time: **< 200ms**
- P99 response time: **< 500ms**
- Average response time: **< 150ms**

### Load Testing
- Error rate: **< 1%**
- Throughput: **> 100 req/s** (minimum)
- Concurrent users: **100, 500, 1000**

### Resources
- Max total resources: **50**
- Max JS bundle size: **500 KB**
- Max transfer size: **1 MB**

## Test Results

### Output Locations

- **Playwright reports**: `web/playwright-report/`
- **k6 results**: `web/load-tests/results/`
- **Baseline metrics**: `web/performance-baselines/metrics.json`

### Reading Results

#### Playwright (Frontend)

```bash
# View HTML report
npx playwright show-report
```

#### k6 (Load Tests)

Results are output to console and saved as JSON/HTML:

- `load-tests/results/api-load-test-summary.html`
- `load-tests/results/api-load-test-summary.json`
- `load-tests/results/user-journey-summary.json`
- `load-tests/results/spike-test-summary.json`

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Performance Tests
  run: |
    npm run test:load:100
    npm run test:perf

- name: Check for Regressions
  run: npm run perf:compare
```

## Interpreting Results

### k6 Metrics

- **http_req_duration**: Total request time (network + server)
  - **avg**: Average response time
  - **p(95)**: 95th percentile (95% of requests faster than this)
  - **p(99)**: 99th percentile
  - **max**: Slowest request

- **http_reqs**: Total requests made
  - **count**: Total number
  - **rate**: Requests per second

- **errors**: Failed requests
  - **rate**: Percentage of failed requests

- **vus**: Virtual users
  - **max**: Peak concurrent users

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: Time until largest content element renders
  - Good: < 2.5s
  - Needs Improvement: 2.5s - 4.0s
  - Poor: > 4.0s

- **FID (First Input Delay)**: Time from first interaction to browser response
  - Good: < 100ms
  - Needs Improvement: 100ms - 300ms
  - Poor: > 300ms

- **CLS (Cumulative Layout Shift)**: Visual stability score
  - Good: < 0.1
  - Needs Improvement: 0.1 - 0.25
  - Poor: > 0.25

## Troubleshooting

### k6 Not Found

```bash
# Verify installation
k6 version

# If not installed, follow installation steps above
```

### High Response Times

1. Check network conditions
2. Verify server is running
3. Check for rate limiting
4. Review application logs

### Test Failures

1. Check baseline metrics are up to date
2. Verify thresholds are appropriate
3. Review recent code changes
4. Check CI/CD environment resources

## Performance Optimization Tips

1. **Bundle Size**: Use code splitting and tree shaking
2. **Images**: Optimize and use modern formats (WebP)
3. **Caching**: Leverage browser and CDN caching
4. **API**: Implement pagination and lazy loading
5. **Database**: Add indexes and optimize queries
6. **CDN**: Serve static assets from CDN
7. **Compression**: Enable gzip/brotli compression

## References

- [Playwright Performance Testing](https://playwright.dev/docs/test-timeouts)
- [k6 Documentation](https://k6.io/docs/)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)

## Support

For questions or issues:
1. Check existing test results in `load-tests/results/`
2. Review baseline metrics in `performance-baselines/`
3. Consult this README
4. Contact the DevOps team
