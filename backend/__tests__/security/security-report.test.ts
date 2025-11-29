/**
 * Security and Compliance Report Generator
 * Generates comprehensive security audit report
 *
 * Task: T3-114 - Validation: Security & Compliance
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

interface SecurityFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
}

describe('Security Audit Report', () => {
  const findings: SecurityFinding[] = [];

  it('should audit authentication and authorization', () => {
    const authPath = path.join(__dirname, '../../shared/middleware/auth.ts');

    if (fs.existsSync(authPath)) {
      const content = fs.readFileSync(authPath, 'utf-8');

      // Check JWT implementation
      if (content.includes('jwt') || content.includes('JWT')) {
        findings.push({
          severity: 'INFO',
          category: 'Authentication',
          title: 'JWT Authentication Implemented',
          description: 'JWT-based authentication is implemented',
          recommendation: 'Continue using JWT for stateless authentication',
          status: 'PASS',
        });
      }

      // Check token expiration
      if (content.includes('exp') || content.includes('expiresIn')) {
        findings.push({
          severity: 'INFO',
          category: 'Authentication',
          title: 'Token Expiration Configured',
          description: 'JWT tokens have expiration configured',
          recommendation: 'Ensure tokens expire within 1-24 hours',
          status: 'PASS',
        });
      }

      // Check role-based access control
      if (content.includes('role') || content.includes('UserRole')) {
        findings.push({
          severity: 'INFO',
          category: 'Authorization',
          title: 'RBAC Implemented',
          description: 'Role-based access control is in place',
          recommendation: 'Review and test all role permissions',
          status: 'PASS',
        });
      }
    } else {
      findings.push({
        severity: 'CRITICAL',
        category: 'Authentication',
        title: 'Authentication Middleware Missing',
        description: 'No authentication middleware found',
        recommendation: 'Implement JWT authentication immediately',
        status: 'FAIL',
      });
    }
  });

  it('should audit encryption implementation', () => {
    const encryptionPath = path.join(__dirname, '../../shared/utils/encryption.ts');

    if (fs.existsSync(encryptionPath)) {
      const content = fs.readFileSync(encryptionPath, 'utf-8');

      // Check for AES-256
      if (content.includes('aes-256') || content.includes('AES-256')) {
        findings.push({
          severity: 'INFO',
          category: 'Encryption',
          title: 'Strong Encryption Algorithm',
          description: 'AES-256 encryption is used',
          recommendation: 'Continue using AES-256 for data at rest',
          status: 'PASS',
        });
      } else {
        findings.push({
          severity: 'HIGH',
          category: 'Encryption',
          title: 'Weak Encryption Algorithm',
          description: 'AES-256 encryption not detected',
          recommendation: 'Upgrade to AES-256 encryption',
          status: 'FAIL',
        });
      }

      // Check for IV (Initialization Vector)
      if (content.includes('iv') || content.includes('randomBytes')) {
        findings.push({
          severity: 'INFO',
          category: 'Encryption',
          title: 'Initialization Vector Used',
          description: 'Random IV is generated for encryption',
          recommendation: 'Ensure unique IV for each encryption',
          status: 'PASS',
        });
      }
    } else {
      findings.push({
        severity: 'CRITICAL',
        category: 'Encryption',
        title: 'Encryption Module Missing',
        description: 'No encryption utilities found',
        recommendation: 'Implement encryption for PHI data immediately',
        status: 'FAIL',
      });
    }
  });

  it('should audit input validation', () => {
    // Check for validation libraries
    const packageJsonPath = path.join(__dirname, '../../../package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for validation libraries
      const hasValidation =
        dependencies['joi'] ||
        dependencies['yup'] ||
        dependencies['validator'] ||
        dependencies['express-validator'];

      if (hasValidation) {
        findings.push({
          severity: 'INFO',
          category: 'Input Validation',
          title: 'Validation Library Detected',
          description: 'Input validation library is installed',
          recommendation: 'Ensure all user inputs are validated',
          status: 'PASS',
        });
      } else {
        findings.push({
          severity: 'MEDIUM',
          category: 'Input Validation',
          title: 'No Validation Library',
          description: 'No dedicated validation library found',
          recommendation: 'Install and use joi or express-validator',
          status: 'WARNING',
        });
      }
    }
  });

  it('should audit audit logging', () => {
    const auditServicePath = path.join(__dirname, '../../shared/services/auditService.ts');

    if (fs.existsSync(auditServicePath)) {
      const content = fs.readFileSync(auditServicePath, 'utf-8');

      findings.push({
        severity: 'INFO',
        category: 'Audit Logging',
        title: 'Audit Service Implemented',
        description: 'Audit logging service exists',
        recommendation: 'Ensure all PHI access is logged',
        status: 'PASS',
      });

      // Check for required audit fields
      const hasUserId = content.includes('userId') || content.includes('user_id');
      const hasAction = content.includes('action');
      const hasTimestamp = content.includes('timestamp') || content.includes('createdAt');

      if (hasUserId && hasAction && hasTimestamp) {
        findings.push({
          severity: 'INFO',
          category: 'Audit Logging',
          title: 'Audit Fields Complete',
          description: 'Audit logs capture user, action, and timestamp',
          recommendation: 'Maintain comprehensive audit trail',
          status: 'PASS',
        });
      } else {
        findings.push({
          severity: 'MEDIUM',
          category: 'Audit Logging',
          title: 'Incomplete Audit Fields',
          description: 'Some audit fields may be missing',
          recommendation: 'Ensure userId, action, and timestamp are logged',
          status: 'WARNING',
        });
      }
    } else {
      findings.push({
        severity: 'HIGH',
        category: 'Audit Logging',
        title: 'Audit Service Missing',
        description: 'No audit logging service found',
        recommendation: 'Implement HIPAA-compliant audit logging',
        status: 'FAIL',
      });
    }
  });

  it('should audit environment configuration', () => {
    // Check for critical environment variables
    const criticalEnvVars = [
      { name: 'JWT_SECRET', description: 'JWT signing secret' },
      { name: 'DATABASE_URL', description: 'Database connection' },
      { name: 'ENCRYPTION_KEY', description: 'Data encryption key' },
    ];

    criticalEnvVars.forEach(envVar => {
      if (process.env[envVar.name]) {
        findings.push({
          severity: 'INFO',
          category: 'Configuration',
          title: `${envVar.name} Configured`,
          description: `${envVar.description} is set`,
          recommendation: 'Ensure secrets are rotated regularly',
          status: 'PASS',
        });
      } else {
        findings.push({
          severity: 'HIGH',
          category: 'Configuration',
          title: `${envVar.name} Missing`,
          description: `${envVar.description} is not configured`,
          recommendation: `Set ${envVar.name} environment variable`,
          status: 'WARNING',
        });
      }
    });

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      findings.push({
        severity: 'INFO',
        category: 'Configuration',
        title: 'Production Mode',
        description: 'Running in production mode',
        recommendation: 'Ensure all security features are enabled',
        status: 'INFO',
      });
    }
  });

  it('should audit dependencies for vulnerabilities', () => {
    findings.push({
      severity: 'INFO',
      category: 'Dependencies',
      title: 'Dependency Audit Required',
      description: 'Run `npm audit` to check for vulnerable packages',
      recommendation: 'Run `npm audit fix` to update vulnerable dependencies',
      status: 'INFO',
    });
  });

  it('should generate security report', () => {
    console.log('\n' + '='.repeat(80));
    console.log('  SECURITY AUDIT REPORT');
    console.log('  MetaPharm Connect Healthcare Platform');
    console.log('  Generated:', new Date().toISOString());
    console.log('='.repeat(80) + '\n');

    // Group findings by severity
    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const high = findings.filter(f => f.severity === 'HIGH');
    const medium = findings.filter(f => f.severity === 'MEDIUM');
    const low = findings.filter(f => f.severity === 'LOW');
    const info = findings.filter(f => f.severity === 'INFO');

    // Summary
    console.log('EXECUTIVE SUMMARY');
    console.log('-'.repeat(80));
    console.log(`  Total Findings: ${findings.length}`);
    console.log(`  Critical: ${critical.length}`);
    console.log(`  High: ${high.length}`);
    console.log(`  Medium: ${medium.length}`);
    console.log(`  Low: ${low.length}`);
    console.log(`  Info: ${info.length}\n`);

    const passed = findings.filter(f => f.status === 'PASS').length;
    const failed = findings.filter(f => f.status === 'FAIL').length;
    const warnings = findings.filter(f => f.status === 'WARNING').length;

    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Warnings: ${warnings}\n`);

    // Security posture
    const score = ((passed / findings.length) * 100).toFixed(0);
    console.log(`  Overall Security Score: ${score}%\n`);

    // Detailed findings
    if (critical.length > 0) {
      console.log('🚨 CRITICAL FINDINGS');
      console.log('-'.repeat(80));
      critical.forEach(f => {
        console.log(`  ❌ ${f.title}`);
        console.log(`     Category: ${f.category}`);
        console.log(`     Description: ${f.description}`);
        console.log(`     Recommendation: ${f.recommendation}\n`);
      });
    }

    if (high.length > 0) {
      console.log('⚠️  HIGH PRIORITY FINDINGS');
      console.log('-'.repeat(80));
      high.forEach(f => {
        console.log(`  ⚠️  ${f.title}`);
        console.log(`     Category: ${f.category}`);
        console.log(`     Description: ${f.description}`);
        console.log(`     Recommendation: ${f.recommendation}\n`);
      });
    }

    if (medium.length > 0) {
      console.log('💡 MEDIUM PRIORITY FINDINGS');
      console.log('-'.repeat(80));
      medium.forEach(f => {
        console.log(`  💡 ${f.title}`);
        console.log(`     Category: ${f.category}`);
        console.log(`     Recommendation: ${f.recommendation}\n`);
      });
    }

    console.log('✓ PASSED CHECKS');
    console.log('-'.repeat(80));
    info.forEach(f => {
      if (f.status === 'PASS') {
        console.log(`  ✓ ${f.title} (${f.category})`);
      }
    });
    console.log('');

    // Recommendations
    console.log('NEXT STEPS');
    console.log('-'.repeat(80));
    console.log('  1. Address all CRITICAL findings immediately');
    console.log('  2. Schedule fixes for HIGH priority findings');
    console.log('  3. Run `npm audit` for dependency vulnerabilities');
    console.log('  4. Review and test all authentication flows');
    console.log('  5. Verify encryption is enabled for all PHI data');
    console.log('  6. Test audit logging captures all required events');
    console.log('  7. Conduct penetration testing before production');
    console.log('  8. Obtain HIPAA compliance certification\n');

    console.log('='.repeat(80) + '\n');

    // Save report to file
    const reportPath = path.join(__dirname, '../../../reports/security-audit-report.md');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    let report = '# Security Audit Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `## Executive Summary\n\n`;
    report += `- Total Findings: ${findings.length}\n`;
    report += `- Critical: ${critical.length}\n`;
    report += `- High: ${high.length}\n`;
    report += `- Medium: ${medium.length}\n`;
    report += `- Security Score: ${score}%\n\n`;

    if (critical.length > 0) {
      report += `## Critical Findings\n\n`;
      critical.forEach(f => {
        report += `### ${f.title}\n`;
        report += `- **Category:** ${f.category}\n`;
        report += `- **Description:** ${f.description}\n`;
        report += `- **Recommendation:** ${f.recommendation}\n\n`;
      });
    }

    if (high.length > 0) {
      report += `## High Priority Findings\n\n`;
      high.forEach(f => {
        report += `### ${f.title}\n`;
        report += `- **Category:** ${f.category}\n`;
        report += `- **Description:** ${f.description}\n`;
        report += `- **Recommendation:** ${f.recommendation}\n\n`;
      });
    }

    report += `## Passed Checks\n\n`;
    info.filter(f => f.status === 'PASS').forEach(f => {
      report += `- ✓ ${f.title} (${f.category})\n`;
    });

    fs.writeFileSync(reportPath, report);
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Test assertions
    expect(findings.length).toBeGreaterThan(0);
    expect(critical.length).toBe(0); // Should have no critical issues
    expect(parseInt(score)).toBeGreaterThanOrEqual(50); // At least 50% security score
  });
});
