#!/usr/bin/env node

/**
 * T8-051: Save Performance Baseline
 *
 * Saves current performance metrics as baseline for regression detection
 * Run after successful performance test to establish baseline
 */

const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, '../../performance-baselines/metrics.json');
const RESULTS_DIR = path.join(__dirname, '../results');

/**
 * Load latest test results
 */
function loadLatestResults() {
  const files = [
    'api-load-test-summary.json',
    'user-journey-summary.json',
    'spike-test-summary.json',
  ];

  const results = {};

  for (const file of files) {
    const filePath = path.join(RESULTS_DIR, file);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const testName = file.replace('-summary.json', '');
        results[testName] = extractMetrics(data);
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error.message);
      }
    }
  }

  return results;
}

/**
 * Extract relevant metrics from k6 results
 */
function extractMetrics(data) {
  const metrics = data.metrics || {};

  return {
    http_req_duration: {
      avg: metrics.http_req_duration?.values?.avg || 0,
      p95: metrics.http_req_duration?.values?.['p(95)'] || 0,
      p99: metrics.http_req_duration?.values?.['p(99)'] || 0,
      max: metrics.http_req_duration?.values?.max || 0,
    },
    http_reqs: {
      count: metrics.http_reqs?.values?.count || 0,
      rate: metrics.http_reqs?.values?.rate || 0,
    },
    errors: {
      rate: metrics.errors?.values?.rate || 0,
    },
    http_req_failed: {
      rate: metrics.http_req_failed?.values?.rate || 0,
    },
    vus: {
      max: metrics.vus?.values?.max || 0,
    },
  };
}

/**
 * Save baseline metrics
 */
function saveBaseline(results) {
  const baseline = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    git_commit: process.env.GIT_COMMIT || 'unknown',
    environment: process.env.NODE_ENV || 'test',
    results,
  };

  // Ensure directory exists
  const dir = path.dirname(BASELINE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save baseline
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));

  console.log('\n✓ Performance baseline saved:');
  console.log(`  File: ${BASELINE_FILE}`);
  console.log(`  Timestamp: ${baseline.timestamp}`);
  console.log(`  Tests: ${Object.keys(results).length}`);
  console.log('\nBaseline Metrics:');

  for (const [testName, metrics] of Object.entries(results)) {
    console.log(`\n  ${testName}:`);
    console.log(`    Response Time (avg): ${metrics.http_req_duration.avg.toFixed(2)}ms`);
    console.log(`    Response Time (p95): ${metrics.http_req_duration.p95.toFixed(2)}ms`);
    console.log(`    Request Rate: ${metrics.http_reqs.rate.toFixed(2)} req/s`);
    console.log(`    Error Rate: ${(metrics.errors.rate * 100).toFixed(2)}%`);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Loading latest performance test results...\n');

  const results = loadLatestResults();

  if (Object.keys(results).length === 0) {
    console.error('Error: No test results found in', RESULTS_DIR);
    console.error('Run performance tests first:');
    console.error('  npm run test:load');
    console.error('  npm run test:load:journey');
    process.exit(1);
  }

  saveBaseline(results);

  console.log('\n✓ Baseline saved successfully!');
  console.log('\nUsage:');
  console.log('  npm run perf:compare  - Compare current results against baseline');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { saveBaseline, loadLatestResults };
