/**
 * Integration Tests for Load Testing Workflow
 * Validates the CI/CD configuration for k6 load tests
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Load Testing Workflow Integration Tests', () => {
  let workflowContent;
  let workflowConfig;

  beforeAll(() => {
    const workflowPath = path.join(__dirname, '../.github/workflows/load-tests.yml');
    workflowContent = fs.readFileSync(workflowPath, 'utf8');
    workflowConfig = yaml.load(workflowContent);
  });

  describe('Workflow Structure', () => {
    test('should have workflow name', () => {
      expect(workflowConfig.name).toBe('Load Testing');
    });

    test('should have trigger on workflow_dispatch', () => {
      expect(workflowConfig.on.workflow_dispatch).toBeDefined();
    });

    test('should have scheduled trigger', () => {
      expect(workflowConfig.on.schedule).toBeDefined();
      expect(workflowConfig.on.schedule.length).toBeGreaterThan(0);
    });

    test('should have single job', () => {
      expect(workflowConfig.jobs).toBeDefined();
      expect(Object.keys(workflowConfig.jobs)).toContain('load-test');
    });
  });

  describe('Workflow Inputs', () => {
    test('should accept environment input', () => {
      const inputs = workflowConfig.on.workflow_dispatch.inputs;
      expect(inputs.environment).toBeDefined();
      expect(inputs.environment.type).toBe('choice');
      expect(inputs.environment.options).toContain('staging');
      expect(inputs.environment.options).toContain('qa');
    });

    test('should accept duration input', () => {
      const inputs = workflowConfig.on.workflow_dispatch.inputs;
      expect(inputs.duration).toBeDefined();
      expect(inputs.duration.default).toBe('5m');
    });

    test('should accept vus input', () => {
      const inputs = workflowConfig.on.workflow_dispatch.inputs;
      expect(inputs.vus).toBeDefined();
      expect(inputs.vus.default).toBe('50');
    });
  });

  describe('Workflow Jobs', () => {
    test('should run on ubuntu-latest', () => {
      const job = workflowConfig.jobs['load-test'];
      expect(job['runs-on']).toBe('ubuntu-latest');
    });

    test('should have checkout step', () => {
      const job = workflowConfig.jobs['load-test'];
      const checkoutStep = job.steps.find((s) => s.uses && s.uses.includes('actions/checkout'));
      expect(checkoutStep).toBeDefined();
    });

    test('should setup k6', () => {
      const job = workflowConfig.jobs['load-test'];
      const k6Step = job.steps.find((s) => s.uses && s.uses.includes('grafana/setup-k6-action'));
      expect(k6Step).toBeDefined();
      expect(k6Step.with['k6-version']).toBe('1.4.2');
    });
  });

  describe('Load Test Scripts', () => {
    test('should run prescription processing test', () => {
      const job = workflowConfig.jobs['load-test'];
      const step = job.steps.find(
        (s) => s.name && s.name.includes('Prescription Processing')
      );
      expect(step).toBeDefined();
      expect(step.run).toContain('k6/scripts/prescription-processing.js');
    });

    test('should run delivery tracking test', () => {
      const job = workflowConfig.jobs['load-test'];
      const step = job.steps.find(
        (s) => s.name && s.name.includes('Delivery Tracking')
      );
      expect(step).toBeDefined();
      expect(step.run).toContain('k6/scripts/delivery-tracking.js');
    });

    test('should run messaging test', () => {
      const job = workflowConfig.jobs['load-test'];
      const step = job.steps.find(
        (s) => s.name && s.name.includes('Messaging Throughput')
      );
      expect(step).toBeDefined();
      expect(step.run).toContain('k6/scripts/messaging.js');
    });

    test('should run API gateway test', () => {
      const job = workflowConfig.jobs['load-test'];
      const step = job.steps.find(
        (s) => s.name && s.name.includes('API Gateway')
      );
      expect(step).toBeDefined();
      expect(step.run).toContain('k6/scripts/api-gateway.js');
    });

    test('should run database query test', () => {
      const job = workflowConfig.jobs['load-test'];
      const step = job.steps.find(
        (s) => s.name && s.name.includes('Database Queries')
      );
      expect(step).toBeDefined();
      expect(step.run).toContain('k6/scripts/database-queries.js');
    });
  });

  describe('Test Output and Results', () => {
    test('should upload results as artifacts', () => {
      const job = workflowConfig.jobs['load-test'];
      const uploadStep = job.steps.find(
        (s) => s.uses && s.uses.includes('actions/upload-artifact')
      );
      expect(uploadStep).toBeDefined();
      expect(uploadStep.with.name).toBe('k6-load-test-results');
    });

    test('should generate performance report', () => {
      const job = workflowConfig.jobs['load-test'];
      const reportStep = job.steps.find(
        (s) => s.name && s.name.includes('Generate performance report')
      );
      expect(reportStep).toBeDefined();
      expect(reportStep.run).toContain('performance-report.md');
    });

    test('should include all test summaries in report', () => {
      const job = workflowConfig.jobs['load-test'];
      const reportStep = job.steps.find(
        (s) => s.name && s.name.includes('Generate performance report')
      );

      const scenarios = [
        'prescription-processing',
        'delivery-tracking',
        'messaging',
        'api-gateway',
        'database-queries',
      ];

      scenarios.forEach((scenario) => {
        expect(reportStep.run).toContain(`summary-${scenario}.json`);
      });
    });
  });

  describe('K6 Scripts Validation', () => {
    test('prescription-processing.js should exist', () => {
      const scriptPath = path.join(__dirname, '../k6/scripts/prescription-processing.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('delivery-tracking.js should exist', () => {
      const scriptPath = path.join(__dirname, '../k6/scripts/delivery-tracking.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('messaging.js should exist', () => {
      const scriptPath = path.join(__dirname, '../k6/scripts/messaging.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('api-gateway.js should exist', () => {
      const scriptPath = path.join(__dirname, '../k6/scripts/api-gateway.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('database-queries.js should exist', () => {
      const scriptPath = path.join(__dirname, '../k6/scripts/database-queries.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('helpers.js utility should exist', () => {
      const scriptPath = path.join(__dirname, '../k6/utils/helpers.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('thresholds.json config should exist', () => {
      const configPath = path.join(__dirname, '../k6/config/thresholds.json');
      expect(fs.existsSync(configPath)).toBe(true);
    });
  });

  describe('K6 Configuration', () => {
    test('thresholds.json should be valid JSON', () => {
      const configPath = path.join(__dirname, '../k6/config/thresholds.json');
      const content = fs.readFileSync(configPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('thresholds.json should have all scenarios', () => {
      const configPath = path.join(__dirname, '../k6/config/thresholds.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.prescriptionProcessing).toBeDefined();
      expect(config.deliveryTracking).toBeDefined();
      expect(config.messaging).toBeDefined();
      expect(config.apiGateway).toBeDefined();
      expect(config.databaseQueries).toBeDefined();
    });

    test('each scenario should have thresholds defined', () => {
      const configPath = path.join(__dirname, '../k6/config/thresholds.json');
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      const scenarios = [
        'prescriptionProcessing',
        'deliveryTracking',
        'messaging',
        'apiGateway',
        'databaseQueries',
      ];

      scenarios.forEach((scenario) => {
        expect(config[scenario].thresholds).toBeDefined();
        expect(Object.keys(config[scenario].thresholds).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Documentation', () => {
    test('README.md should exist in k6 directory', () => {
      const readmePath = path.join(__dirname, '../k6/README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('PERFORMANCE_BASELINES.md should exist', () => {
      const baselinesPath = path.join(__dirname, '../k6/PERFORMANCE_BASELINES.md');
      expect(fs.existsSync(baselinesPath)).toBe(true);
    });

    test('README.md should contain load test information', () => {
      const readmePath = path.join(__dirname, '../k6/README.md');
      const content = fs.readFileSync(readmePath, 'utf8');
      expect(content).toContain('K6 Load Testing Suite');
      expect(content).toContain('prescription');
      expect(content).toContain('delivery');
      expect(content).toContain('messaging');
    });

    test('PERFORMANCE_BASELINES.md should define targets', () => {
      const baselinesPath = path.join(__dirname, '../k6/PERFORMANCE_BASELINES.md');
      const content = fs.readFileSync(baselinesPath, 'utf8');
      expect(content).toContain('Performance Baselines');
      expect(content).toContain('threshold');
      expect(content).toContain('regression');
    });
  });
});
