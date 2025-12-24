#!/usr/bin/env node

/**
 * T8-051: Performance Regression Detection
 *
 * Compares current performance metrics against baseline
 * Detects regressions and improvements
 */

const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, '../../performance-baselines/metrics.json');
const RESULTS_DIR = path.join(__dirname, '../results');

// Regression thresholds (% worse than baseline)
const REGRESSION_THRESHOLDS = {
  http_req_duration_avg: 10, // 10% slower avg
  http_req_duration_p95: 15, // 15% slower p95
  http_req_duration_p99: 20, // 20% slower p99
  error_rate: 50, // 50% more errors
  request_rate: -10, // 10% fewer req/s
};

/**
 * Load baseline metrics
 */
function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error('Error: No baseline found. Run npm run perf:baseline first.');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

/**
 * Load current results
 */
function loadCurrentResults() {
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
 * Extract metrics from k6 results
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
  };
}

/**
 * Calculate percentage change
 */
function percentageChange(baseline, current) {
  if (baseline === 0) return current > 0 ? 100 : 0;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Determine if regression occurred
 */
function detectRegression(metric, baseline, current, threshold) {
  const change = percentageChange(baseline, current);
  return {
    metric,
    baseline,
    current,
    change,
    threshold,
    isRegression: change > threshold,
    isImprovement: change < -threshold / 2, // 50% of threshold for improvement
  };
}

/**
 * Compare metrics
 */
function compareMetrics(baselineResults, currentResults) {
  const comparisons = {};
  const regressions = [];
  const improvements = [];

  for (const [testName, baselineMetrics] of Object.entries(baselineResults)) {
    const currentMetrics = currentResults[testName];

    if (!currentMetrics) {
      console.warn(`Warning: No current results for ${testName}`);
      continue;
    }

    const testComparison = {
      http_req_duration_avg: detectRegression(
        'Average Response Time',
        baselineMetrics.http_req_duration.avg,
        currentMetrics.http_req_duration.avg,
        REGRESSION_THRESHOLDS.http_req_duration_avg
      ),
      http_req_duration_p95: detectRegression(
        'P95 Response Time',
        baselineMetrics.http_req_duration.p95,
        currentMetrics.http_req_duration.p95,
        REGRESSION_THRESHOLDS.http_req_duration_p95
      ),
      http_req_duration_p99: detectRegression(
        'P99 Response Time',
        baselineMetrics.http_req_duration.p99,
        currentMetrics.http_req_duration.p99,
        REGRESSION_THRESHOLDS.http_req_duration_p99
      ),
      error_rate: detectRegression(
        'Error Rate',
        baselineMetrics.errors.rate * 100,
        currentMetrics.errors.rate * 100,
        REGRESSION_THRESHOLDS.error_rate
      ),
      request_rate: detectRegression(
        'Request Rate',
        baselineMetrics.http_reqs.rate,
        currentMetrics.http_reqs.rate,
        REGRESSION_THRESHOLDS.request_rate
      ),
    };

    comparisons[testName] = testComparison;

    // Collect regressions and improvements
    for (const result of Object.values(testComparison)) {
      if (result.isRegression) {
        regressions.push({ test: testName, ...result });
      } else if (result.isImprovement) {
        improvements.push({ test: testName, ...result });
      }
    }
  }

  return { comparisons, regressions, improvements };
}

/**
 * Format number with unit
 */
function formatMetric(metric, value) {
  if (metric.includes('Time')) {
    return `${value.toFixed(2)}ms`;
  } else if (metric.includes('Rate') && !metric.includes('Error')) {
    return `${value.toFixed(2)} req/s`;
  } else if (metric.includes('Error')) {
    return `${value.toFixed(3)}%`;
  }
  return value.toFixed(2);
}

/**
 * Print comparison report
 */
function printReport(baseline, current, comparison) {
  console.log('\n' + '='.repeat(80));
  console.log('Performance Regression Detection Report');
  console.log('='.repeat(80));

  console.log('\nBaseline:');
  console.log(`  Date: ${new Date(baseline.timestamp).toLocaleString()}`);
  console.log(`  Commit: ${baseline.git_commit}`);

  console.log('\nCurrent:');
  console.log(`  Date: ${new Date().toLocaleString()}`);

  // Print detailed comparisons
  for (const [testName, metrics] of Object.entries(comparison.comparisons)) {
    console.log('\n' + '-'.repeat(80));
    console.log(`Test: ${testName}`);
    console.log('-'.repeat(80));

    for (const result of Object.values(metrics)) {
      const icon = result.isRegression ? '❌' : result.isImprovement ? '✅' : '  ';
      const sign = result.change >= 0 ? '+' : '';
      const baselineFormatted = formatMetric(result.metric, result.baseline);
      const currentFormatted = formatMetric(result.metric, result.current);

      console.log(
        `${icon} ${result.metric}: ${baselineFormatted} → ${currentFormatted} (${sign}${result.change.toFixed(1)}%)`
      );
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));

  if (comparison.regressions.length > 0) {
    console.log(`\n❌ ${comparison.regressions.length} REGRESSIONS DETECTED:\n`);
    for (const regression of comparison.regressions) {
      console.log(`   - ${regression.test}: ${regression.metric}`);
      console.log(
        `     ${formatMetric(regression.metric, regression.baseline)} → ${formatMetric(regression.metric, regression.current)} (+${regression.change.toFixed(1)}%)`
      );
    }
  } else {
    console.log('\n✅ No performance regressions detected!');
  }

  if (comparison.improvements.length > 0) {
    console.log(`\n✅ ${comparison.improvements.length} IMPROVEMENTS:\n`);
    for (const improvement of comparison.improvements) {
      console.log(`   - ${improvement.test}: ${improvement.metric}`);
      console.log(
        `     ${formatMetric(improvement.metric, improvement.baseline)} → ${formatMetric(improvement.metric, improvement.current)} (${improvement.change.toFixed(1)}%)`
      );
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Exit with error if regressions detected
  if (comparison.regressions.length > 0) {
    console.error('Performance regressions detected! Review and fix before merging.');
    process.exit(1);
  } else {
    console.log('✓ Performance check passed!');
  }
}

/**
 * Main function
 */
function main() {
  console.log('Loading baseline and current metrics...\n');

  const baseline = loadBaseline();
  const current = loadCurrentResults();

  if (Object.keys(current).length === 0) {
    console.error('Error: No current test results found.');
    console.error('Run performance tests first: npm run test:load');
    process.exit(1);
  }

  const comparison = compareMetrics(baseline.results, current);
  printReport(baseline, current, comparison);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { compareMetrics, detectRegression };
