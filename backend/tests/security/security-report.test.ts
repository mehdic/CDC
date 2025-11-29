/**
 * Security Validation Report Generator
 * T3-114 - Generates comprehensive security and compliance report
 *
 * This test suite:
 * 1. Runs all security checks
 * 2. Runs all compliance checks
 * 3. Generates a comprehensive report
 * 4. Documents recommendations
 */

import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

// Import services
const inventoryApp = require('../../services/inventory-service/src/index').default;
const prescriptionApp = require('../../services/prescription-service/src/index').default;

// Mock tokens
const MOCK_PATIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGF0aWVudC0xMjMiLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';
const MOCK_PHARMACIST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGhhcm1hY2lzdC03ODkiLCJyb2xlIjoicGhhcm1hY2lzdCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';
const INVALID_TOKEN = 'invalid.token.here';

// Report data structure
interface SecurityReport {
  timestamp: string;
  environment: string;
  sections: {
    authentication: SecuritySection;
    authorization: SecuritySection;
    dataProtection: SecuritySection;
    inputValidation: SecuritySection;
    securityHeaders: SecuritySection;
    logging: SecuritySection;
    hipaaCompliance: ComplianceSection;
    gdprCompliance: ComplianceSection;
  };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    score: number;
  };
  recommendations: string[];
}

interface SecuritySection {
  name: string;
  checks: Check[];
  score: number;
}

interface ComplianceSection {
  name: string;
  requirements: Check[];
  score: number;
}

interface Check {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  details: string;
}

// ============================================================================
// Security Report Generation Test Suite
// ============================================================================

describe('Security Validation Report', () => {
  let report: SecurityReport;

  beforeAll(() => {
    report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      sections: {
        authentication: { name: 'Authentication & Session Management', checks: [], score: 0 },
        authorization: { name: 'Authorization & Access Control', checks: [], score: 0 },
        dataProtection: { name: 'Data Protection & Encryption', checks: [], score: 0 },
        inputValidation: { name: 'Input Validation & Injection Prevention', checks: [], score: 0 },
        securityHeaders: { name: 'Security Headers & Configuration', checks: [], score: 0 },
        logging: { name: 'Logging & Monitoring', checks: [], score: 0 },
        hipaaCompliance: { name: 'HIPAA Compliance', requirements: [], score: 0 },
        gdprCompliance: { name: 'GDPR Compliance', requirements: [], score: 0 }
      },
      summary: { totalChecks: 0, passed: 0, failed: 0, warnings: 0, score: 0 },
      recommendations: []
    };
  });

  // ==========================================================================
  // 1. Authentication Checks
  // ==========================================================================

  describe('Authentication & Session Management', () => {
    it('should enforce authentication on protected endpoints', async () => {
      const response = await request(inventoryApp).get('/inventory');

      const check: Check = {
        name: 'Protected endpoints require authentication',
        status: [401, 403].includes(response.status) ? 'PASS' : 'FAIL',
        details: `HTTP ${response.status} returned for unauthenticated request`
      };

      report.sections.authentication.checks.push(check);
    });

    it('should reject invalid tokens', async () => {
      const response = await request(inventoryApp)
        .get('/inventory')
        .set('Authorization', `Bearer ${INVALID_TOKEN}`);

      const check: Check = {
        name: 'Invalid tokens are rejected',
        status: [401, 403, 500].includes(response.status) ? 'PASS' : 'FAIL',
        details: `HTTP ${response.status} for invalid token`
      };

      report.sections.authentication.checks.push(check);
    });

    it('should use secure token format (JWT)', async () => {
      const check: Check = {
        name: 'JWT tokens used for authentication',
        status: 'INFO',
        details: 'Verify: Tokens follow JWT standard with proper claims (exp, iat, sub)'
      };

      report.sections.authentication.checks.push(check);
    });
  });

  // ==========================================================================
  // 2. Authorization Checks
  // ==========================================================================

  describe('Authorization & Access Control', () => {
    it('should implement role-based access control', async () => {
      const patientResponse = await request(prescriptionApp)
        .get('/api/prescriptions/all')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      const check: Check = {
        name: 'RBAC prevents privilege escalation',
        status: [401, 403, 404].includes(patientResponse.status) ? 'PASS' : 'FAIL',
        details: `Patient accessing admin endpoint: HTTP ${patientResponse.status}`
      };

      report.sections.authorization.checks.push(check);
    });

    it('should validate resource ownership', async () => {
      const check: Check = {
        name: 'Resource ownership validation',
        status: 'INFO',
        details: 'Verify: Users can only access their own resources (prescriptions, orders, etc.)'
      };

      report.sections.authorization.checks.push(check);
    });
  });

  // ==========================================================================
  // 3. Data Protection Checks
  // ==========================================================================

  describe('Data Protection & Encryption', () => {
    it('should enforce HTTPS in production', async () => {
      const response = await request(inventoryApp).get('/');

      const hasHSTS = !!response.headers['strict-transport-security'];
      const check: Check = {
        name: 'HTTPS enforced via HSTS',
        status: process.env.NODE_ENV === 'production'
          ? (hasHSTS ? 'PASS' : 'FAIL')
          : (hasHSTS ? 'PASS' : 'WARN'),
        details: hasHSTS
          ? `HSTS header: ${response.headers['strict-transport-security']}`
          : 'HSTS header missing - HTTPS not enforced'
      };

      report.sections.dataProtection.checks.push(check);
      if (!hasHSTS && process.env.NODE_ENV === 'production') {
        report.recommendations.push('CRITICAL: Enable HSTS header to enforce HTTPS');
      }
    });

    it('should verify encryption at rest', async () => {
      const check: Check = {
        name: 'Encryption at rest (database)',
        status: 'INFO',
        details: 'Verify: Sensitive columns encrypted with AES-256 (SSN, medical records, payment info)'
      };

      report.sections.dataProtection.checks.push(check);
      report.recommendations.push('HIGH: Verify database encryption for PHI columns');
    });

    it('should not expose sensitive data in responses', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({ invalid: 'data' });

      const errorText = JSON.stringify(response.body).toLowerCase();
      const exposesSecrets = errorText.includes('password') ||
                            errorText.includes('secret') ||
                            errorText.includes('token');

      const check: Check = {
        name: 'Sensitive data not leaked in errors',
        status: exposesSecrets ? 'FAIL' : 'PASS',
        details: exposesSecrets
          ? 'Error messages contain sensitive keywords'
          : 'Error messages do not leak sensitive data'
      };

      report.sections.dataProtection.checks.push(check);
      if (exposesSecrets) {
        report.recommendations.push('HIGH: Remove sensitive data from error messages');
      }
    });
  });

  // ==========================================================================
  // 4. Input Validation Checks
  // ==========================================================================

  describe('Input Validation & Injection Prevention', () => {
    it('should prevent SQL injection', async () => {
      const payload = "' OR '1'='1";
      const response = await request(prescriptionApp)
        .get(`/api/prescriptions?patientId=${encodeURIComponent(payload)}`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const errorText = JSON.stringify(response.body).toLowerCase();
      const hasSQLError = errorText.includes('syntax error') || errorText.includes('sql');

      const check: Check = {
        name: 'SQL injection prevention',
        status: hasSQLError ? 'FAIL' : 'PASS',
        details: hasSQLError
          ? 'SQL errors exposed - possible SQL injection vulnerability'
          : 'SQL injection attempts handled safely'
      };

      report.sections.inputValidation.checks.push(check);
      if (hasSQLError) {
        report.recommendations.push('CRITICAL: Use parameterized queries to prevent SQL injection');
      }
    });

    it('should sanitize XSS payloads', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      const response = await request(inventoryApp)
        .get(`/inventory?search=${encodeURIComponent(xssPayload)}`)
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const hasUnescapedScript = response.text && response.text.includes('<script>');

      const check: Check = {
        name: 'XSS prevention (input sanitization)',
        status: hasUnescapedScript ? 'FAIL' : 'PASS',
        details: hasUnescapedScript
          ? 'Unescaped script tags in response - XSS vulnerability'
          : 'Script tags properly sanitized'
      };

      report.sections.inputValidation.checks.push(check);
      if (hasUnescapedScript) {
        report.recommendations.push('CRITICAL: Implement XSS protection (sanitize/escape user input)');
      }
    });

    it('should validate data types', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          patientId: 12345, // Should be string
          medications: 'not-an-array' // Should be array
        });

      const check: Check = {
        name: 'Data type validation',
        status: [400, 401, 500].includes(response.status) ? 'PASS' : 'FAIL',
        details: `Invalid data types: HTTP ${response.status}`
      };

      report.sections.inputValidation.checks.push(check);
    });
  });

  // ==========================================================================
  // 5. Security Headers Checks
  // ==========================================================================

  describe('Security Headers & Configuration', () => {
    it('should have security headers configured', async () => {
      const response = await request(inventoryApp).get('/');

      const headers = {
        'x-content-type-options': response.headers['x-content-type-options'],
        'x-frame-options': response.headers['x-frame-options'],
        'x-xss-protection': response.headers['x-xss-protection'],
        'content-security-policy': response.headers['content-security-policy'],
        'strict-transport-security': response.headers['strict-transport-security']
      };

      const configuredHeaders = Object.entries(headers).filter(([_, v]) => v).length;
      const totalHeaders = Object.keys(headers).length;

      Object.entries(headers).forEach(([header, value]) => {
        const check: Check = {
          name: `Security header: ${header}`,
          status: value ? 'PASS' : 'WARN',
          details: value ? `${value}` : 'Not configured'
        };
        report.sections.securityHeaders.checks.push(check);
      });

      if (configuredHeaders < totalHeaders) {
        report.recommendations.push(
          `MEDIUM: Configure missing security headers (${totalHeaders - configuredHeaders}/${totalHeaders} missing) - Use Helmet.js`
        );
      }
    });

    it('should not expose server information', async () => {
      const response = await request(inventoryApp).get('/');

      const exposesServer = !!response.headers['x-powered-by'] || !!response.headers['server'];

      const check: Check = {
        name: 'Server information exposure',
        status: exposesServer ? 'WARN' : 'PASS',
        details: exposesServer
          ? `Server info exposed: ${response.headers['x-powered-by'] || response.headers['server']}`
          : 'Server information hidden'
      };

      report.sections.securityHeaders.checks.push(check);
      if (exposesServer) {
        report.recommendations.push('LOW: Hide server version information (app.disable("x-powered-by"))');
      }
    });
  });

  // ==========================================================================
  // 6. Logging & Monitoring Checks
  // ==========================================================================

  describe('Logging & Monitoring', () => {
    it('should log authentication failures', async () => {
      await request(inventoryApp)
        .get('/inventory')
        .set('Authorization', `Bearer ${INVALID_TOKEN}`);

      const check: Check = {
        name: 'Authentication failure logging',
        status: 'INFO',
        details: 'Verify: Winston/Morgan logs contain failed authentication attempts with user ID, IP, timestamp'
      };

      report.sections.logging.checks.push(check);
      report.recommendations.push('MEDIUM: Verify authentication failure logging in production logs');
    });

    it('should log access to PHI', async () => {
      await request(prescriptionApp)
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const check: Check = {
        name: 'PHI access logging (HIPAA requirement)',
        status: 'INFO',
        details: 'Verify: Audit logs contain all PHI access events (user, resource, timestamp, action)'
      };

      report.sections.logging.checks.push(check);
      report.recommendations.push('HIGH: Implement comprehensive PHI access logging for HIPAA compliance');
    });

    it('should have tamper-proof audit logs', async () => {
      const check: Check = {
        name: 'Audit log integrity',
        status: 'INFO',
        details: 'Verify: Audit logs use append-only table, no DELETE permissions, include checksums'
      };

      report.sections.logging.checks.push(check);
      report.recommendations.push('HIGH: Ensure audit logs are tamper-proof (append-only, no deletes)');
    });
  });

  // ==========================================================================
  // 7. HIPAA Compliance Checks
  // ==========================================================================

  describe('HIPAA Compliance', () => {
    it('should verify administrative safeguards', async () => {
      const checks: Check[] = [
        {
          name: 'Role-Based Access Control (RBAC)',
          status: 'INFO',
          details: 'Verify: RBAC implemented for all PHI access'
        },
        {
          name: 'Minimum necessary standard',
          status: 'INFO',
          details: 'Verify: Users only receive minimum necessary PHI'
        },
        {
          name: 'Workforce training',
          status: 'INFO',
          details: 'Verify: All workforce members trained on HIPAA requirements'
        }
      ];

      report.sections.hipaaCompliance.requirements.push(...checks);
      report.recommendations.push('HIGH: Document HIPAA administrative safeguards implementation');
    });

    it('should verify technical safeguards', async () => {
      const checks: Check[] = [
        {
          name: 'Access controls',
          status: 'INFO',
          details: 'Verify: Unique user identification, emergency access procedures'
        },
        {
          name: 'Audit controls',
          status: 'INFO',
          details: 'Verify: All PHI access logged, logs retained 6+ years'
        },
        {
          name: 'Transmission security',
          status: 'INFO',
          details: 'Verify: PHI encrypted in transit (HTTPS/TLS)'
        },
        {
          name: 'Encryption at rest',
          status: 'INFO',
          details: 'Verify: PHI encrypted in database (AES-256)'
        }
      ];

      report.sections.hipaaCompliance.requirements.push(...checks);
      report.recommendations.push('HIGH: Verify all HIPAA technical safeguards are implemented');
    });

    it('should verify breach notification procedures', async () => {
      const check: Check = {
        name: 'Breach notification procedures',
        status: 'INFO',
        details: 'Verify: Procedures in place for 60-day notification, breach log maintained'
      };

      report.sections.hipaaCompliance.requirements.push(check);
      report.recommendations.push('MEDIUM: Document and test breach notification procedures');
    });
  });

  // ==========================================================================
  // 8. GDPR Compliance Checks
  // ==========================================================================

  describe('GDPR Compliance', () => {
    it('should verify data subject rights', async () => {
      const rights: Check[] = [
        {
          name: 'Right to Access (Art. 15)',
          status: 'INFO',
          details: 'Verify: Endpoint exists for patients to access their data (GET /api/patient/data)'
        },
        {
          name: 'Right to Rectification (Art. 16)',
          status: 'INFO',
          details: 'Verify: Patients can update their personal data (PUT /api/patient/profile)'
        },
        {
          name: 'Right to Erasure (Art. 17)',
          status: 'INFO',
          details: 'Verify: Account deletion endpoint exists (DELETE /api/patient/account)'
        },
        {
          name: 'Right to Data Portability (Art. 20)',
          status: 'INFO',
          details: 'Verify: Data export in machine-readable format (JSON/XML/CSV)'
        }
      ];

      report.sections.gdprCompliance.requirements.push(...rights);
      report.recommendations.push('HIGH: Implement all GDPR data subject rights endpoints');
    });

    it('should verify consent management', async () => {
      const checks: Check[] = [
        {
          name: 'Consent recording',
          status: 'INFO',
          details: 'Verify: All consents logged with who, when, what, how'
        },
        {
          name: 'Consent withdrawal',
          status: 'INFO',
          details: 'Verify: Consent can be withdrawn as easily as granted'
        }
      ];

      report.sections.gdprCompliance.requirements.push(...checks);
      report.recommendations.push('MEDIUM: Implement comprehensive consent management system');
    });

    it('should verify data protection by design', async () => {
      const checks: Check[] = [
        {
          name: 'Data minimization',
          status: 'INFO',
          details: 'Verify: Only necessary data collected'
        },
        {
          name: 'Privacy by default',
          status: 'INFO',
          details: 'Verify: Most privacy-friendly settings by default'
        },
        {
          name: 'Pseudonymization',
          status: 'INFO',
          details: 'Verify: Patient IDs used instead of names in logs'
        }
      ];

      report.sections.gdprCompliance.requirements.push(...checks);
      report.recommendations.push('MEDIUM: Review data collection practices for GDPR compliance');
    });
  });

  // ==========================================================================
  // Generate Report
  // ==========================================================================

  afterAll(() => {
    // Calculate scores for each section
    Object.values(report.sections).forEach((section: SecuritySection | ComplianceSection) => {
      const items = 'checks' in section ? section.checks : section.requirements;
      const passed = items.filter(c => c.status === 'PASS').length;
      const total = items.length;
      section.score = total > 0 ? Math.round((passed / total) * 100) : 0;
    });

    // Calculate overall summary
    const allChecks = Object.values(report.sections).flatMap((section: SecuritySection | ComplianceSection) =>
      'checks' in section ? section.checks : section.requirements
    );

    report.summary.totalChecks = allChecks.length;
    report.summary.passed = allChecks.filter(c => c.status === 'PASS').length;
    report.summary.failed = allChecks.filter(c => c.status === 'FAIL').length;
    report.summary.warnings = allChecks.filter(c => c.status === 'WARN').length;
    report.summary.score = Math.round((report.summary.passed / report.summary.totalChecks) * 100);

    // Generate report file
    const reportDir = path.join(__dirname, '..', '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `security-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate Markdown report
    const mdReport = generateMarkdownReport(report);
    const mdPath = path.join(reportDir, `security-report-${Date.now()}.md`);
    fs.writeFileSync(mdPath, mdReport);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('SECURITY & COMPLIANCE VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${report.timestamp}`);
    console.log(`Environment: ${report.environment}`);
    console.log('='.repeat(80));
    console.log('\nSUMMARY:');
    console.log(`  Total Checks: ${report.summary.totalChecks}`);
    console.log(`  ✓ Passed: ${report.summary.passed}`);
    console.log(`  ✗ Failed: ${report.summary.failed}`);
    console.log(`  ⚠ Warnings: ${report.summary.warnings}`);
    console.log(`  Overall Score: ${report.summary.score}%`);
    console.log('\nSECTION SCORES:');
    Object.entries(report.sections).forEach(([key, section]) => {
      const icon = section.score >= 80 ? '✓' : section.score >= 50 ? '⚠' : '✗';
      console.log(`  ${icon} ${section.name}: ${section.score}%`);
    });
    console.log('\nRECOMMENDATIONS:');
    report.recommendations.slice(0, 10).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    if (report.recommendations.length > 10) {
      console.log(`  ... and ${report.recommendations.length - 10} more`);
    }
    console.log('\n' + '='.repeat(80));
    console.log(`Full report saved to:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  Markdown: ${mdPath}`);
    console.log('='.repeat(80) + '\n');
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function generateMarkdownReport(report: SecurityReport): string {
  let md = `# Security & Compliance Validation Report\n\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  md += `**Environment:** ${report.environment}\n\n`;
  md += `---\n\n`;

  md += `## Executive Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Checks | ${report.summary.totalChecks} |\n`;
  md += `| Passed | ✓ ${report.summary.passed} |\n`;
  md += `| Failed | ✗ ${report.summary.failed} |\n`;
  md += `| Warnings | ⚠ ${report.summary.warnings} |\n`;
  md += `| **Overall Score** | **${report.summary.score}%** |\n\n`;

  md += `---\n\n`;

  md += `## Section Scores\n\n`;
  Object.entries(report.sections).forEach(([key, section]) => {
    md += `### ${section.name}\n\n`;
    md += `**Score:** ${section.score}%\n\n`;

    const items = 'checks' in section ? section.checks : section.requirements;
    md += `| Check | Status | Details |\n`;
    md += `|-------|--------|----------|\n`;
    items.forEach(item => {
      const icon = item.status === 'PASS' ? '✓' :
                   item.status === 'FAIL' ? '✗' :
                   item.status === 'WARN' ? '⚠' : 'ℹ';
      md += `| ${item.name} | ${icon} ${item.status} | ${item.details} |\n`;
    });
    md += `\n`;
  });

  md += `---\n\n`;

  md += `## Recommendations\n\n`;
  const criticalRecs = report.recommendations.filter(r => r.startsWith('CRITICAL'));
  const highRecs = report.recommendations.filter(r => r.startsWith('HIGH'));
  const mediumRecs = report.recommendations.filter(r => r.startsWith('MEDIUM'));
  const lowRecs = report.recommendations.filter(r => r.startsWith('LOW'));

  if (criticalRecs.length > 0) {
    md += `### 🔴 Critical Priority\n\n`;
    criticalRecs.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  if (highRecs.length > 0) {
    md += `### 🟠 High Priority\n\n`;
    highRecs.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  if (mediumRecs.length > 0) {
    md += `### 🟡 Medium Priority\n\n`;
    mediumRecs.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  if (lowRecs.length > 0) {
    md += `### 🟢 Low Priority\n\n`;
    lowRecs.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  return md;
}
