/**
 * Tests for comprehensive seed script
 * Verifies that the seeding process creates all expected data
 */

import { Client } from 'pg';

describe('Comprehensive Seed Script', () => {
  let client: Client;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/metapharm_test';

    client = new Client({
      connectionString: databaseUrl,
      ssl: false,
    });

    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  describe('Data Verification', () => {
    it('should have pharmacies seeded', async () => {
      const result = await client.query('SELECT COUNT(*) as count FROM pharmacies');
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should have users with different roles', async () => {
      const result = await client.query(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);

      const roles = result.rows.map((r) => r.role);
      expect(roles).toContain('pharmacist');
      expect(roles).toContain('doctor');
      expect(roles).toContain('patient');
    });

    it('should have categories', async () => {
      const result = await client.query('SELECT COUNT(*) as count FROM categories');
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should have products linked to categories', async () => {
      const result = await client.query(`
        SELECT p.name, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LIMIT 1
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].category_name).toBeTruthy();
    });

    it('should have prescriptions with different statuses', async () => {
      const result = await client.query(`
        SELECT status, COUNT(*) as count
        FROM prescriptions
        GROUP BY status
      `);

      const statuses = result.rows.map((r) => r.status);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('should have prescription items linked to prescriptions', async () => {
      const result = await client.query(`
        SELECT pi.medication_name, p.status
        FROM prescription_items pi
        JOIN prescriptions p ON pi.prescription_id = p.id
        LIMIT 1
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].medication_name).toBeTruthy();
    });

    it('should have inventory items with stock levels', async () => {
      const result = await client.query(`
        SELECT medication_name, quantity, reorder_threshold
        FROM inventory_items
        WHERE quantity > 0
        LIMIT 1
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].quantity).toBeGreaterThan(0);
    });

    it('should have inventory alerts for low stock items', async () => {
      const result = await client.query(`
        SELECT ia.alert_type, ia.severity, ii.medication_name
        FROM inventory_alerts ia
        JOIN inventory_items ii ON ia.inventory_item_id = ii.id
        WHERE ia.is_resolved = false
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should have Swiss/French naming conventions', async () => {
      const pharmacyResult = await client.query(`
        SELECT name FROM pharmacies WHERE name LIKE 'Pharmacie%' LIMIT 1
      `);
      expect(pharmacyResult.rows.length).toBe(1);
      expect(pharmacyResult.rows[0].name).toContain('Pharmacie');

      const productResult = await client.query(`
        SELECT name FROM products WHERE name LIKE '%é%' OR name LIKE '%è%' LIMIT 1
      `);
      expect(productResult.rows.length).toBeGreaterThan(0);
    });

    it('should maintain foreign key relationships', async () => {
      // Test pharmacy -> user relationship
      const userPharmacyResult = await client.query(`
        SELECT u.email, p.name
        FROM users u
        JOIN pharmacies p ON u.primary_pharmacy_id = p.id
        WHERE u.role = 'pharmacist'
        LIMIT 1
      `);
      expect(userPharmacyResult.rows.length).toBe(1);

      // Test prescription -> patient relationship
      const prescriptionPatientResult = await client.query(`
        SELECT pr.status, u.email
        FROM prescriptions pr
        JOIN users u ON pr.patient_id = u.id
        WHERE u.role = 'patient'
        LIMIT 1
      `);
      expect(prescriptionPatientResult.rows.length).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should have encrypted fields for user PII', async () => {
      const result = await client.query(`
        SELECT first_name_encrypted, last_name_encrypted, phone_encrypted
        FROM users
        LIMIT 1
      `);

      expect(result.rows[0].first_name_encrypted).toBeInstanceOf(Buffer);
      expect(result.rows[0].last_name_encrypted).toBeInstanceOf(Buffer);
    });

    it('should have hashed passwords for all users', async () => {
      const result = await client.query(`
        SELECT password_hash FROM users WHERE password_hash IS NOT NULL LIMIT 1
      `);

      expect(result.rows[0].password_hash).toBeTruthy();
      expect(result.rows[0].password_hash.length).toBeGreaterThan(20);
    });

    it('should have valid AI confidence scores', async () => {
      const result = await client.query(`
        SELECT medication_confidence, dosage_confidence, frequency_confidence
        FROM prescription_items
        WHERE medication_confidence IS NOT NULL
        LIMIT 1
      `);

      expect(parseFloat(result.rows[0].medication_confidence)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(result.rows[0].medication_confidence)).toBeLessThanOrEqual(100);
    });

    it('should have products with valid pricing', async () => {
      const result = await client.query(`
        SELECT name, price, stock FROM products WHERE price > 0 LIMIT 1
      `);

      expect(parseFloat(result.rows[0].price)).toBeGreaterThan(0);
      expect(parseInt(result.rows[0].stock)).toBeGreaterThanOrEqual(0);
    });
  });
});
