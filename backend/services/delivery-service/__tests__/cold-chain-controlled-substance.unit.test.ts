/**
 * Unit Tests for Cold Chain and Controlled Substance Features (T3-066, T3-067)
 * Tests model methods and business logic
 */

import { Delivery, DeliveryStatus } from '../../../shared/models/Delivery';

describe('Cold Chain and Controlled Substance Unit Tests (T3-066, T3-067)', () => {

  // ============================================================================
  // Cold Chain Model Tests (T3-066)
  // ============================================================================

  describe('Cold Chain Management - Model Behavior (T3-066)', () => {

    it('should create delivery with cold chain attributes', () => {
      const delivery = new Delivery();
      delivery.id = 'test-cold-001';
      delivery.user_id = 'patient-001';
      delivery.requires_temperature_control = true;
      delivery.temperature_range_min = '2';
      delivery.temperature_range_max = '8';
      delivery.max_delivery_duration_minutes = 30;
      delivery.special_handling_instructions = 'Keep refrigerated. Do not freeze.';

      expect(delivery.requires_temperature_control).toBe(true);
      expect(delivery.temperature_range_min).toBe('2');
      expect(delivery.temperature_range_max).toBe('8');
      expect(delivery.max_delivery_duration_minutes).toBe(30);
      expect(delivery.special_handling_instructions).toBe('Keep refrigerated. Do not freeze.');
    });

    it('should format temperature range for display', () => {
      const delivery = new Delivery();
      delivery.temperature_range_min = '2';
      delivery.temperature_range_max = '8';

      const display = delivery.getTemperatureRangeDisplay();
      expect(display).toBe('2°C - 8°C');
    });

    it('should return null for temperature display when range not set', () => {
      const delivery = new Delivery();
      delivery.temperature_range_min = null;
      delivery.temperature_range_max = null;

      const display = delivery.getTemperatureRangeDisplay();
      expect(display).toBeNull();
    });

    it('should detect when delivery exceeds max duration', () => {
      const delivery = new Delivery();
      delivery.max_delivery_duration_minutes = 30;
      delivery.picked_up_at = new Date(Date.now() - 31 * 60 * 1000); // Picked up 31 minutes ago

      expect(delivery.isExceedingMaxDuration()).toBe(true);
    });

    it('should not flag delivery as exceeding max duration when within limits', () => {
      const delivery = new Delivery();
      delivery.max_delivery_duration_minutes = 30;
      delivery.picked_up_at = new Date(Date.now() - 15 * 60 * 1000); // Picked up 15 minutes ago

      expect(delivery.isExceedingMaxDuration()).toBe(false);
    });

    it('should not flag delivery as exceeding max duration when not picked up', () => {
      const delivery = new Delivery();
      delivery.max_delivery_duration_minutes = 30;
      delivery.picked_up_at = null;

      expect(delivery.isExceedingMaxDuration()).toBe(false);
    });

    it('should trigger cold chain alert and log event', () => {
      const delivery = new Delivery();
      delivery.id = 'test-cold-002';
      delivery.compliance_log = [];

      delivery.triggerColdChainAlert('Delivery taking too long');

      expect(delivery.temperature_alert_sent_at).toBeTruthy();
      expect(delivery.temperature_alert_reason).toBe('Delivery taking too long');
      expect(delivery.compliance_log.length).toBe(1);
      expect(delivery.compliance_log[0].event).toBe('cold_chain_alert');
      expect(delivery.compliance_log[0].details).toBe('Delivery taking too long');
    });

    it('should maintain compliance log for cold chain events', () => {
      const delivery = new Delivery();
      delivery.compliance_log = [];

      delivery.addComplianceLog('cold_chain_alert', 'Temperature control compromised', 'system');
      delivery.addComplianceLog('pickup', 'Cold chain delivery picked up', 'driver-001');

      expect(delivery.compliance_log.length).toBe(2);
      expect(delivery.compliance_log[0].event).toBe('cold_chain_alert');
      expect(delivery.compliance_log[1].event).toBe('pickup');
      expect(delivery.compliance_log[1].verified_by).toBe('driver-001');
    });
  });

  // ============================================================================
  // Controlled Substance Model Tests (T3-067)
  // ============================================================================

  describe('Controlled Substance Handling - Model Behavior (T3-067)', () => {

    it('should create delivery with controlled substance attributes', () => {
      const delivery = new Delivery();
      delivery.id = 'test-ctrl-001';
      delivery.user_id = 'patient-001';
      delivery.contains_controlled_substance = true;
      delivery.substance_schedule = 'II';
      delivery.requires_signature = true;
      delivery.age_verification_required = true;

      expect(delivery.contains_controlled_substance).toBe(true);
      expect(delivery.substance_schedule).toBe('II');
      expect(delivery.requires_signature).toBe(true);
      expect(delivery.age_verification_required).toBe(true);
    });

    it('should record signature with timestamp and compliance log', () => {
      const delivery = new Delivery();
      delivery.id = 'test-ctrl-002';
      delivery.requires_signature = true;
      delivery.compliance_log = [];

      const signatureData = 'base64-encoded-signature';
      delivery.recordSignature(signatureData, 'John Doe');

      expect(delivery.signature_obtained_at).toBeTruthy();
      expect(delivery.signature_image_encrypted).toBe(signatureData);
      expect(delivery.isSignatureMet()).toBe(true);
      expect(delivery.compliance_log.length).toBe(1);
      expect(delivery.compliance_log[0].event).toBe('signature_obtained');
      expect(delivery.compliance_log[0].details).toContain('John Doe');
    });

    it('should verify age for age-restricted substances', () => {
      const delivery = new Delivery();
      delivery.id = 'test-ctrl-003';
      delivery.age_verification_required = true;
      delivery.compliance_log = [];

      delivery.verifyAge(18);

      expect(delivery.age_verified_at).toBeTruthy();
      expect(delivery.verified_age_minimum).toBe('18');
      expect(delivery.isAgeVerified()).toBe(true);
      expect(delivery.compliance_log.length).toBe(1);
      expect(delivery.compliance_log[0].event).toBe('age_verified');
    });

    it('should scan ID for controlled substance verification', () => {
      const delivery = new Delivery();
      delivery.id = 'test-ctrl-004';
      delivery.compliance_log = [];

      const idScanData = 'base64-encoded-id-scan';
      delivery.scanId(idScanData, 'driver-001');

      expect(delivery.id_scanned).toBe(true);
      expect(delivery.id_scanned_at).toBeTruthy();
      expect(delivery.id_scan_data_encrypted).toBe(idScanData);
      expect(delivery.isIdScanned()).toBe(true);
      expect(delivery.compliance_log.length).toBe(1);
      expect(delivery.compliance_log[0].event).toBe('id_scanned');
      expect(delivery.compliance_log[0].verified_by).toBe('driver-001');
    });

    it('should enforce all controlled substance requirements', () => {
      const delivery = new Delivery();
      delivery.id = 'test-ctrl-005';
      delivery.contains_controlled_substance = true;
      delivery.requires_signature = true;
      delivery.age_verification_required = true;
      delivery.compliance_log = [];

      // Initially should not meet requirements
      expect(delivery.areControlledSubstanceRequirementsMet()).toBe(false);

      // Add signature
      delivery.recordSignature('sig-data', 'Recipient');
      expect(delivery.areControlledSubstanceRequirementsMet()).toBe(false); // Still missing age verification

      // Add age verification
      delivery.verifyAge(18);
      expect(delivery.areControlledSubstanceRequirementsMet()).toBe(true); // All requirements met
    });

    it('should allow delivery without controlled substance requirements when not applicable', () => {
      const delivery = new Delivery();
      delivery.id = 'test-ctrl-006';
      delivery.contains_controlled_substance = false;

      expect(delivery.areControlledSubstanceRequirementsMet()).toBe(true);
    });

    it('should track signature requirement separately', () => {
      const delivery = new Delivery();
      delivery.requires_signature = true;

      expect(delivery.isSignatureMet()).toBe(false);

      delivery.recordSignature('sig-data');
      expect(delivery.isSignatureMet()).toBe(true);
    });

    it('should track age verification requirement separately', () => {
      const delivery = new Delivery();
      delivery.age_verification_required = true;

      expect(delivery.isAgeVerified()).toBe(false);

      delivery.verifyAge(18);
      expect(delivery.isAgeVerified()).toBe(true);
    });

    it('should track ID scan requirement separately', () => {
      const delivery = new Delivery();
      delivery.id_scanned = false;

      expect(delivery.isIdScanned()).toBe(false);

      delivery.scanId('scan-data');
      expect(delivery.isIdScanned()).toBe(true);
    });

    it('should maintain compliance log for controlled substance events', () => {
      const delivery = new Delivery();
      delivery.requires_signature = true;
      delivery.age_verification_required = true;
      delivery.compliance_log = [];

      delivery.addComplianceLog('delivery_created', 'Delivery created with controlled substance', 'system');
      delivery.recordSignature('sig-data', 'John Doe');
      delivery.verifyAge(21);
      delivery.scanId('scan-data', 'driver-001');

      expect(delivery.compliance_log.length).toBe(4);
      expect(delivery.compliance_log[0].event).toBe('delivery_created');
      expect(delivery.compliance_log[1].event).toBe('signature_obtained');
      expect(delivery.compliance_log[2].event).toBe('age_verified');
      expect(delivery.compliance_log[3].event).toBe('id_scanned');
    });
  });

  // ============================================================================
  // Combined Feature Tests (T3-066 + T3-067)
  // ============================================================================

  describe('Combined Cold Chain + Controlled Substance Delivery', () => {

    it('should handle delivery with both cold chain and controlled substance requirements', () => {
      const delivery = new Delivery();
      delivery.id = 'test-combo-001';
      delivery.user_id = 'patient-001';

      // Cold chain
      delivery.requires_temperature_control = true;
      delivery.temperature_range_min = '2';
      delivery.temperature_range_max = '8';
      delivery.max_delivery_duration_minutes = 30;
      delivery.special_handling_instructions = 'Keep refrigerated. Do not freeze.';

      // Controlled substance
      delivery.contains_controlled_substance = true;
      delivery.substance_schedule = 'II';
      delivery.requires_signature = true;
      delivery.age_verification_required = true;
      delivery.compliance_log = [];

      // Verify both are configured
      expect(delivery.requires_temperature_control).toBe(true);
      expect(delivery.contains_controlled_substance).toBe(true);
      expect(delivery.getTemperatureRangeDisplay()).toBe('2°C - 8°C');

      // Complete controlled substance requirements
      delivery.recordSignature('sig-data', 'Patient');
      delivery.verifyAge(18);

      expect(delivery.areControlledSubstanceRequirementsMet()).toBe(true);

      // Verify compliance log captures all events
      const logEvents = delivery.getComplianceLog().map(e => e.event);
      expect(logEvents).toContain('signature_obtained');
      expect(logEvents).toContain('age_verified');
    });

    it('should maintain separate compliance logs for each feature', () => {
      const delivery = new Delivery();
      delivery.compliance_log = [];

      // Cold chain event
      delivery.addComplianceLog('pickup', 'Cold chain delivery picked up', 'driver-001');

      // Controlled substance event
      delivery.recordSignature('sig-data', 'Patient');

      // Another cold chain event
      delivery.addComplianceLog('cold_chain_alert', 'Duration exceeded', 'system');

      const log = delivery.getComplianceLog();
      expect(log.length).toBe(3);
      expect(log[0].event).toBe('pickup');
      expect(log[1].event).toBe('signature_obtained');
      expect(log[2].event).toBe('cold_chain_alert');

      // Verify timestamps are in order
      const t0 = new Date(log[0].timestamp);
      const t1 = new Date(log[1].timestamp);
      const t2 = new Date(log[2].timestamp);
      expect(t0.getTime() <= t1.getTime()).toBe(true);
      expect(t1.getTime() <= t2.getTime()).toBe(true);
    });
  });

  // ============================================================================
  // Compliance Log Tests
  // ============================================================================

  describe('Compliance Logging (T3-067)', () => {

    it('should initialize empty compliance log', () => {
      const delivery = new Delivery();
      delivery.compliance_log = null;

      expect(delivery.getComplianceLog()).toEqual([]);
    });

    it('should add entries to compliance log with proper structure', () => {
      const delivery = new Delivery();
      delivery.compliance_log = [];

      const before = new Date();
      delivery.addComplianceLog('test_event', 'Test details', 'user-123');
      const after = new Date();

      const log = delivery.getComplianceLog();
      expect(log.length).toBe(1);

      const entry = log[0];
      expect(entry.event).toBe('test_event');
      expect(entry.details).toBe('Test details');
      expect(entry.verified_by).toBe('user-123');

      // Verify timestamp is between before and after
      const timestamp = new Date(entry.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should use system as default verified_by', () => {
      const delivery = new Delivery();
      delivery.compliance_log = [];

      delivery.addComplianceLog('event', 'details');

      const log = delivery.getComplianceLog();
      expect(log[0].verified_by).toBe('system');
    });

    it('should retrieve entire compliance log', () => {
      const delivery = new Delivery();
      delivery.compliance_log = [];

      for (let i = 0; i < 5; i++) {
        delivery.addComplianceLog(`event_${i}`, `details_${i}`, `user_${i}`);
      }

      const log = delivery.getComplianceLog();
      expect(log.length).toBe(5);
      expect(log.map(e => e.event)).toEqual(['event_0', 'event_1', 'event_2', 'event_3', 'event_4']);
    });
  });
});
